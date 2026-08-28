// Final premium-ui verification: newline state fix, a11y sweep, axe.
import { chromium } from 'playwright';
import fs from 'node:fs';

fs.writeFileSync('/tmp/nl.txt', 'Alpha bravo charlie delta.\nEcho foxtrot golf hotel.\nIndia juliet kilo lima.');
const out = process.argv[2] || '/home/user/tools/final';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--no-sandbox'] });
const errors = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => m.type() === 'error' && errors.push('console: ' + m.text()));
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
const row = (k, v) => console.log(`  ${String(k).padEnd(40)} ${v}`);

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.setInputFiles('#fileInput', '/tmp/nl.txt');
await page.waitForSelector('#readStage.is-active');
await page.click('#practiceAllButton');
await page.click('#overlayActionButton');
// type line 1 correctly, then one wrong key so the newline itself is evaluated incorrectly
await page.keyboard.type('Alpha bravo charlie delta.');
await page.keyboard.type('~');
await page.waitForTimeout(250);
const nl = await page.evaluate(() => {
  const all = [...document.querySelectorAll('.char')];
  const marker = all.find(e => e.classList.contains('is-newline'));
  const prev = all[all.indexOf(marker) - 1];
  const nrect = marker.getBoundingClientRect(), prect = prev.getBoundingClientRect();
  return {
    isNewlineError: marker.classList.contains('is-incorrect'),
    display: getComputedStyle(marker).display,
    minWidth: getComputedStyle(marker).minWidth,
    sameLineAsPreceding: Math.abs(nrect.top - prect.top) < 3,
    markerTop: Math.round(nrect.top), prevTop: Math.round(prect.top),
  };
});
console.log('\n[NEWLINE ERROR STATE]');
for (const [k, v] of Object.entries(nl)) row(k, v);
await page.screenshot({ path: `${out}/newline-state.png`, clip: { x: 240, y: 300, width: 960, height: 260 } });

// focus ring on the reading surfaces
const rings = await page.evaluate(() => {
  document.querySelector('#typingPassage').focus();
  const a = getComputedStyle(document.querySelector('#typingPassage'));
  document.querySelector('#documentPreview')?.focus();
  const c = document.querySelector('#documentPreview') ? getComputedStyle(document.querySelector('#documentPreview')) : null;
  return { passage: `${a.outlineWidth} ${a.outlineStyle} ${a.outlineColor}`, preview: c && `${c.outlineWidth} ${c.outlineStyle} ${c.outlineColor}` };
});
console.log('\n[FOCUS RINGS]');
row('typing passage', rings.passage); row('document preview', rings.preview);

// semantic + a11y sweep across all stages/states
const a11y = await page.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)];
  return {
    'h1 count (visible stages)': q('h1').filter(h => h.offsetParent !== null).length,
    'h1 total': q('h1').length,
    'buttons without accessible name': q('button').filter(x => !x.getAttribute('aria-label') && !x.textContent.trim()).length,
    'inputs without label': q('input').filter(x => !x.getAttribute('aria-label') && !document.querySelector(`label[for="${x.id}"]`)).length,
    'imgs without alt': q('img').filter(i => !i.hasAttribute('alt')).length,
    'role=textbox nodes': q('[role="textbox"]').length,
    'progressbar aria': (() => { const p = document.querySelector('[role="progressbar"]'); return p ? `${p.getAttribute('aria-valuemin')}..${p.getAttribute('aria-valuemax')} now=${p.getAttribute('aria-valuenow')}` : 'none'; })(),
    'aria-live regions': q('[aria-live]').length,
    'dialog elements': q('dialog').length,
    'skip link target exists': Boolean(document.querySelector(document.querySelector('.skip-link')?.getAttribute('href') || '#__x')),
    'lang attr': document.documentElement.lang,
    'clickable divs (non-button, no role)': q('div[onclick], span[onclick]').length,
  };
});
console.log('\n[A11Y SWEEP]');
for (const [k, v] of Object.entries(a11y)) row(k, v);

// heading levels across stage changes + library open
await page.click('#endSessionButton');
await page.waitForTimeout(200);
const dlg = await ctx.newPage();
await dlg.goto('http://127.0.0.1:5173/');
await dlg.click('#openLibraryButton');
await dlg.waitForTimeout(250);
console.log('  library dialog open                   ', await dlg.evaluate(() => document.querySelector('#libraryDialog').open));
await dlg.screenshot({ path: `${out}/library-empty.png` });

// axe-core if we can pull it (network), else note it
try {
  const src = await (await fetch('https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js')).text();
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations'] }));
  console.log('\n[AXE-CORE]');
  if (!res.violations.length) console.log('  0 violations');
  for (const v of res.violations) console.log(`  ${v.impact.padEnd(7)} ${v.id.padEnd(26)} ${v.nodes.length} node(s) — ${v.help}`);
} catch (e) { console.log('\n[AXE-CORE] unavailable:', e.message); }

// contrast re-verification on the final rendered text (computed colors, not source hexes)
const measured = await page.evaluate(() => {
  const srgb = (c) => { const [r, g, b] = c.match(/\d+/g).map(Number); return [r, g, b]; };
  const L = (c) => { const v = srgb(c).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const ratio = (a, b) => { const l1 = L(a), l2 = L(b); return +(((Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05)).toFixed(2)); };
  const cs = (sel) => getComputedStyle(document.querySelector(sel));
  const bgOf = (el) => { let n = el; while (n) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) return c; n = n.parentElement; } return 'rgb(255,255,255)'; };
  const probe = (sel) => { const el = document.querySelector(sel); return { fg: cs(sel).color, bg: bgOf(el) }; };
  const cases = {
    'live stat label': '.live-stats span', 'live stat value': '.live-stats strong',
    'kicker': '#sessionKicker', 'passage char': '.char', 'hint text': '.typing-hint',
  };
  return Object.fromEntries(Object.entries(cases).map(([k, sel]) => {
    const p = probe(sel); return [k, { ...p, ratio: ratio(p.fg, p.bg) }];
  }));
});
console.log('\n[COMPOSED CONTRAST (computed at paint, includes layering)]');
for (const [k, v] of Object.entries(measured)) row(k, `WCAG ${String(v.ratio).padEnd(6)} ${v.fg} on ${v.bg}`);

console.log('\nCONSOLE/PAGE ERRORS:', errors.length ? errors : 'none');
await b.close();
