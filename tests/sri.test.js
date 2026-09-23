import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, it, expect } from 'vitest';

const PAGE_ORIGIN = 'https://margin.example';
// Vitest (jsdom environment) rewrites import.meta.url, so locate the repo from
// the working directory — this repo's npm scripts always run vitest at its root.
const repoRoot = process.cwd();

/**
 * Endpoints known to serve content-unstable (User-Agent-dependent or
 * unversioned) stylesheets. No single integrity hash can protect them, so
 * they must not be referenced at all — self-host instead. This project
 * self-hosts its fonts via src/fonts.css.
 * https://frontendchecklist.io/rules/html/subresource-integrity
 */
const KNOWN_UNPINNABLE = [/^https?:\/\/fonts\.googleapis\.com\/css/i];

const INTEGRITY_TOKEN = /^(?:sha256-[A-Za-z0-9+/]{43}=?|sha384-[A-Za-z0-9+/]{64}|sha512-[A-Za-z0-9+/]{86}(?:==)?)$/;
const AXE_CORE_SRC = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const AXE_CORE_INTEGRITY = 'sha384-3NYxCdpLKVHfNs2FHPtg3qqaYuhq85m4mMnlHBlN0JzSpKYKct2PMGYfsKGaKIj4';

function runSriCheck(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(repoRoot, 'tools', 'sri-check.mjs'), '--verify', '--origin', PAGE_ORIGIN, file],
      { cwd: repoRoot },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

/** Every script/stylesheet/preload resource a page loads, with its SRI attributes. */
function resourceEntries(html) {
  const dom = new JSDOM(html, { url: PAGE_ORIGIN });
  const { document } = dom.window;
  const entries = [];

  for (const script of document.querySelectorAll('script[src]')) {
    entries.push(pick(script, 'script'));
  }

  for (const link of document.querySelectorAll('link[href]')) {
    const rel = (link.getAttribute('rel') || '').toLowerCase();
    const as = (link.getAttribute('as') || '').toLowerCase();
    const isProtected =
      rel === 'stylesheet' ||
      rel === 'modulepreload' ||
      (rel === 'preload' && (as === 'script' || as === 'style'));
    if (isProtected) entries.push(pick(link, rel === 'stylesheet' ? 'stylesheet' : rel));
  }

  return entries;
}

function pick(el, kind) {
  return {
    kind,
    url: el.getAttribute(kind === 'script' ? 'src' : 'href'),
    integrity: el.getAttribute('integrity'),
    crossorigin: el.getAttribute('crossorigin'),
  };
}

function classification(rawUrl) {
  try {
    return new URL(rawUrl, PAGE_ORIGIN).origin === PAGE_ORIGIN ? 'same-origin' : 'cross-origin';
  } catch {
    return 'invalid';
  }
}

/** Asserts the SRI rule for one HTML document; returns the parsed entries. */
function assertSriCompliant(html, label) {
  const entries = resourceEntries(html);
  // Guard against a broken parse making every check below pass vacuously.
  expect(entries.length, `${label}: expected at least one script/stylesheet resource`).toBeGreaterThan(0);

  for (const entry of entries) {
    const scope = `${label} ${entry.kind} ${entry.url}`;

    expect(classification(entry.url), `${scope}: unparseable resource URL`).not.toBe('invalid');

    for (const pattern of KNOWN_UNPINNABLE) {
      expect(
        entry.url,
        `${scope}: this endpoint serves User-Agent-dependent, unversioned CSS that cannot be protected with SRI; self-host the resource instead (see src/fonts.css)`,
      ).not.toMatch(pattern);
    }

    if (classification(entry.url) === 'cross-origin') {
      expect(entry.integrity, `${scope}: cross-origin resources require a non-empty integrity attribute`).toBeTruthy();
      for (const token of (entry.integrity || '').split(/\s+/).filter(Boolean)) {
        expect(token, `${scope}: malformed integrity token "${token}"`).toMatch(INTEGRITY_TOKEN);
      }
      expect(
        ['anonymous', 'use-credentials'],
        `${scope}: SRI requires crossorigin="anonymous" or an intentionally credentialed "use-credentials" load`,
      ).toContain((entry.crossorigin || '').toLowerCase());
    }
  }

  return entries;
}

describe('Subresource Integrity (frontendchecklist.io/rules/html/subresource-integrity)', () => {
  it('source index.html: cross-origin scripts/stylesheets must carry integrity + crossorigin', () => {
    const html = readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
    const entries = assertSriCompliant(html, 'source');

    // Dev entry points stay same-origin files that actually exist on disk.
    for (const entry of entries) {
      if (entry.url.startsWith('/src/')) {
        const file = path.join(repoRoot, entry.url);
        expect(existsSync(file), `${entry.url}: linked dev asset is missing on disk`).toBe(true);
      }
    }
  });

  it('built dist/index.html (when present): same guarantees and fonts bundled as same-origin assets', () => {
    const distIndex = path.join(repoRoot, 'dist', 'index.html');
    if (!existsSync(distIndex)) return; // not built yet — `npm run build` first

    const html = readFileSync(distIndex, 'utf8');
    assertSriCompliant(html, 'dist');

    // The self-hosted font strategy must survive the build: a bundled
    // stylesheet registers the Inter @font-face and every font file it
    // references resolves against the page origin (no third-party font CDN).
    const dom = new JSDOM(html, { url: PAGE_ORIGIN });
    const cssHrefs = [...dom.window.document.querySelectorAll('link[rel="stylesheet"][href]')].map((link) =>
      link.getAttribute('href'),
    );
    const css = cssHrefs
      .map((href) => readFileSync(path.join(repoRoot, 'dist', href.replace(/^\//, '')), 'utf8'))
      .join('\n');

    expect(css, 'built CSS should register the Inter @font-face from src/fonts.css').toMatch(
      /@font-face[^}]*font-family:\s*['"]?Inter/i,
    );

    const fontUrls = [...css.matchAll(/url\(([^)]+\.woff2?[^)]*)\)/g)].map((m) =>
      m[1].trim().replace(/^['"]|['"]$/g, '').split(/\s+/)[0],
    );
    expect(fontUrls.length, 'built CSS should reference bundled font files').toBeGreaterThan(0);
    for (const fontUrl of fontUrls) {
      expect(new URL(fontUrl, PAGE_ORIGIN).origin, `${fontUrl}: fonts must be bundled same-origin`).toBe(PAGE_ORIGIN);
    }
    expect(css, 'built CSS must not retain a remote @import').not.toMatch(
      /@import\s+(?:url\(\s*)?['"]?(?:https?:)?\/\//i,
    );
  });

  it('verify mode requires usable CORS headers and a matching resource hash', async () => {
    const bytes = Buffer.from('window.sriProbe = true;');
    const integrity = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
    const server = createServer((request, response) => {
      if (request.url === '/allowed.js') {
        response.setHeader('Access-Control-Allow-Origin', request.headers.origin || '*');
      }
      response.setHeader('Content-Type', 'application/javascript');
      response.end(bytes);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'margin-sri-test-'));
    try {
      const resourceUrl = `http://127.0.0.1:${server.address().port}`;
      const allowedFile = path.join(tempDir, 'allowed.html');
      const missingCorsFile = path.join(tempDir, 'missing-cors.html');
      const tag = (url) => `<script src="${url}" crossorigin="anonymous" integrity="${integrity}"></script>`;
      writeFileSync(allowedFile, tag(`${resourceUrl}/allowed.js`));
      writeFileSync(missingCorsFile, tag(`${resourceUrl}/missing-cors.js`));

      const allowed = await runSriCheck(allowedFile);
      expect(allowed.code, allowed.stdout + allowed.stderr).toBe(0);
      expect(allowed.stdout).toContain('CORS OK (https://margin.example)');
      expect(allowed.stdout).toContain('hash OK (sha384)');

      const missingCors = await runSriCheck(missingCorsFile);
      expect(missingCors.code, missingCors.stdout + missingCors.stderr).toBe(1);
      expect(missingCors.stdout).toContain('CORS failure');
    } finally {
      await new Promise((resolve) => server.close(resolve));
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('source CSS does not @import remote stylesheets that cannot carry SRI', () => {
    const css = ['src/fonts.css', 'src/styles.css']
      .map((file) => readFileSync(path.join(repoRoot, file), 'utf8'))
      .join('\n');
    expect(css).not.toMatch(/@import\s+(?:url\(\s*)?['"]?(?:https?:)?\/\//i);
  });

  it('the dynamic axe-core audit loader is version-pinned and sets SRI/CORS before insertion', () => {
    const source = readFileSync(path.join(repoRoot, 'tools', 'a11y.mjs'), 'utf8');
    expect(source).toContain(`const AXE_CORE_SRC = '${AXE_CORE_SRC}'`);
    expect(source).toContain(`const AXE_CORE_INTEGRITY = '${AXE_CORE_INTEGRITY}'`);
    expect(AXE_CORE_SRC).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/axe-core@\d+\.\d+\.\d+\/axe\.min\.js$/);
    expect(AXE_CORE_INTEGRITY).toMatch(INTEGRITY_TOKEN);

    const loaderStart = source.indexOf('async function loadAxeCore(page) {');
    expect(loaderStart, 'expected an explicit dynamic SRI loader').toBeGreaterThanOrEqual(0);
    const loaderEnd = source.indexOf('\n}\n', loaderStart);
    expect(loaderEnd, 'dynamic loader should have a clear function boundary').toBeGreaterThan(loaderStart);
    const loader = source.slice(loaderStart, loaderEnd);
    const insertion = loader.indexOf('document.head.append(script)');
    expect(insertion, 'script must be appended after its security attributes are set').toBeGreaterThanOrEqual(0);

    for (const attribute of [
      "script.setAttribute('crossorigin', 'anonymous')",
      "script.setAttribute('integrity', integrity)",
      'script.src = src',
    ]) {
      const attributeIndex = loader.indexOf(attribute);
      expect(attributeIndex, `${attribute} must be set on the script`).toBeGreaterThanOrEqual(0);
      expect(attributeIndex, `${attribute} must be set before insertion`).toBeLessThan(insertion);
    }
    expect(loader).not.toMatch(/fetch\(|addScriptTag/);
  });
});
