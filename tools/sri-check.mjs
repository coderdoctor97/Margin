#!/usr/bin/env node
/**
 * sri-check — static Subresource Integrity gate for Margin.
 *
 * Enumerates every <script src>, <link rel="stylesheet">, <link rel="preload"
 * as="script"|"style"> and <link rel="modulepreload"> in the given HTML files
 * and enforces the Front-End Checklist rule "Add Subresource Integrity to
 * external scripts" (https://frontendchecklist.io/rules/html/subresource-integrity):
 *
 *   - every cross-origin resource must carry a well-formed `integrity`
 *     attribute (sha256-/sha384-/sha512- base64) and a `crossorigin`
 *     attribute, because SRI only applies to CORS-mode loads;
 *   - no resource may point at endpoints known to serve content-unstable,
 *     User-Agent-dependent stylesheets (fonts.googleapis.com/css*): no hash
 *     can be pinned for them, so they must be self-hosted instead.
 *
 * Same-origin resources are listed for visibility but do not require SRI.
 *
 * Usage:
 *   node tools/sri-check.mjs index.html dist/index.html
 *   node tools/sri-check.mjs --verify index.html   # additionally fetch each
 *       cross-origin URL, recompute its hash, compare with the declared
 *       integrity value, and check the CORS response header.
 *
 * Options:
 *   --origin <url>  origin the HTML is served from (default https://margin.example)
 *   --verify        fetch and hash-verify cross-origin resources (needs egress)
 *
 * Missing files are skipped with a notice so the same command works before and
 * after `npm run build`. Exits non-zero on any violation.
 *
 * Parsing uses a permissive tag scanner (no dependencies). It is intentionally
 * simple: this repo's HTML is machine-edited and contains no commented-out
 * tags; tests/sri.test.js performs the same check with a real HTML parser.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const KNOWN_UNPINNABLE = [
  {
    pattern: /^https?:\/\/fonts\.googleapis\.com\/css/i,
    reason:
      'fonts.googleapis.com/css* returns User-Agent-dependent, unversioned CSS, so no stable integrity hash exists; self-host the fonts (see src/fonts.css)',
  },
];

const VALID_INTEGRITY_TOKEN = /^(?:sha256-[A-Za-z0-9+/]{43}=?|sha384-[A-Za-z0-9+/]{64}|sha512-[A-Za-z0-9+/]{86}(?:==)?)$/;

const argv = process.argv.slice(2);
let verify = false;
let origin = 'https://margin.example';
const files = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--verify') verify = true;
  else if (argv[i] === '--origin') origin = argv[i + 1] ?? '';
  else if (argv[i - 1] !== '--origin') files.push(argv[i]);
}
if (files.length === 0) files.push('index.html');

function extractResources(html) {
  const resources = [];
  const tagRe = /<(script|link)\b[^>]*>/gi;
  let tag;
  while ((tag = tagRe.exec(html)) !== null) {
    const attrs = {};
    const attrRe = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let attr;
    while ((attr = attrRe.exec(tag[0])) !== null) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? '';
    }
    const rel = (attrs.rel || '').toLowerCase();
    const as = (attrs.as || '').toLowerCase();
    let kind = null;
    let url = null;
    if (tag[1].toLowerCase() === 'script' && attrs.src) {
      kind = 'script';
      url = attrs.src;
    } else if (attrs.href && (rel === 'stylesheet' || rel === 'modulepreload' || (rel === 'preload' && (as === 'script' || as === 'style')))) {
      kind = rel === 'stylesheet' ? 'stylesheet' : rel;
      url = attrs.href;
    }
    if (kind) {
      resources.push({ kind, url, integrity: attrs.integrity || '', crossorigin: attrs.crossorigin || '' });
    }
  }
  return resources;
}

function classification(rawUrl) {
  try {
    return new URL(rawUrl, origin).origin === new URL(origin).origin ? 'same-origin' : 'cross-origin';
  } catch {
    return 'invalid';
  }
}

async function verifyHash(resource) {
  const notes = [];
  const errors = [];
  const requestOrigin = new URL(origin).origin;
  let response;
  try {
    response = await fetch(new URL(resource.url, origin), {
      redirect: 'follow',
      headers: { origin: requestOrigin },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const detail = `fetch failed: ${error.cause?.code || error.message} (no network egress to this host?)`;
    return { ok: false, notes: [detail], errors: [`could not fetch resource to verify its hash — ${detail}`] };
  }
  if (!response.ok) {
    const detail = `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, notes: [detail], errors: [`could not fetch resource to verify its hash — ${detail}`] };
  }

  const allowedOrigin = response.headers.get('access-control-allow-origin')?.trim();
  const credentialMode = resource.crossorigin.toLowerCase();
  const credentialHeader = response.headers.get('access-control-allow-credentials')?.toLowerCase();
  const corsAllowed = credentialMode === 'use-credentials'
    ? allowedOrigin === requestOrigin && credentialHeader === 'true'
    : allowedOrigin === '*' || allowedOrigin === requestOrigin;
  if (corsAllowed) {
    notes.push(`CORS OK (${allowedOrigin}${credentialMode === 'use-credentials' ? ', credentials allowed' : ''})`);
  } else {
    const detail = credentialMode === 'use-credentials'
      ? `CORS failure: credentials require Access-Control-Allow-Origin: ${requestOrigin} and Access-Control-Allow-Credentials: true (received ${allowedOrigin || 'no allow-origin header'}${credentialHeader ? `; credentials=${credentialHeader}` : ''})`
      : `CORS failure: response must include Access-Control-Allow-Origin: * or ${requestOrigin} (received ${allowedOrigin || 'no header'})`;
    notes.push(detail);
    errors.push(detail);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const declared = resource.integrity.split(/\s+/).filter(Boolean);
  for (const token of declared) {
    const [, algorithm, expected] = token.match(/^(sha\d+)-(.+)$/);
    const actual = createHash(algorithm).update(bytes).digest('base64');
    if (actual === expected) {
      notes.push(`hash OK (${algorithm})`);
    } else {
      const served = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
      const detail = `hash MISMATCH (${algorithm}) — served bytes hash to ${served}`;
      notes.push(detail);
      errors.push(`declared integrity does not match the served resource — ${detail}`);
    }
  }
  return { ok: errors.length === 0, notes, errors };
}

const violations = [];
let checked = 0;

for (const file of files) {
  if (!existsSync(file)) {
    console.log(`\n${file}: skipped (not found — run "npm run build" first if you expected it)`);
    continue;
  }
  console.log(`\n${file}:`);
  const resources = extractResources(readFileSync(file, 'utf8'));
  if (resources.length === 0) console.log('  (no script/stylesheet resources found)');

  for (const resource of resources) {
    checked += 1;
    const kind = classification(resource.url);
    const problems = [];
    const notes = [];

    for (const { pattern, reason } of KNOWN_UNPINNABLE) {
      if (pattern.test(resource.url)) problems.push(reason);
    }

    if (kind === 'invalid') problems.push('unparseable resource URL');

    if (kind === 'cross-origin') {
      if (!resource.integrity) problems.push('missing integrity attribute');
      else {
        for (const token of resource.integrity.split(/\s+/).filter(Boolean)) {
          if (!VALID_INTEGRITY_TOKEN.test(token)) problems.push(`malformed integrity token "${token}"`);
        }
      }
      if (!resource.crossorigin) problems.push('missing crossorigin attribute (SRI requires CORS-mode loading)');
      else if (!['anonymous', 'use-credentials'].includes(resource.crossorigin.toLowerCase())) {
        problems.push(`invalid crossorigin mode "${resource.crossorigin}" (use anonymous or use-credentials)`);
      }

      if (verify && problems.length === 0) {
        const result = await verifyHash(resource);
        notes.push(...result.notes);
        problems.push(...result.errors);
      }
    }

    const label = `${kind.padEnd(12)} ${resource.kind.padEnd(14)} ${resource.url}`;
    if (problems.length === 0) {
      console.log(`  [ok]   ${label}${notes.length ? ` — ${notes.join('; ')}` : ''}`);
    } else {
      console.log(`  [FAIL] ${label}`);
      for (const problem of problems) {
        console.log(`         - ${problem}`);
        violations.push(`${file} ${resource.kind} ${resource.url}: ${problem}`);
      }
    }
  }
}

console.log(
  `\n${violations.length === 0 ? 'PASS' : 'FAIL'}: ${checked} resource(s) checked across ${files.length} file(s), ${violations.length} violation(s).` +
    (verify ? '' : ' (run with --verify to also fetch and hash-check cross-origin resources)'),
);
process.exit(violations.length === 0 ? 0 : 1);
