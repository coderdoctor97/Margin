import { existsSync, readFileSync } from 'node:fs';
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

const INTEGRITY_TOKEN = /^sha(256|384|512)-[A-Za-z0-9+/=]+$/;

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
        entry.crossorigin,
        `${scope}: SRI requires the resource to load in CORS mode; add crossorigin="anonymous"`,
      ).toBeTruthy();
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
  });
});
