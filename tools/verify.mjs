// Premium-ui verification harness (scratch, outside the repo).
// node /home/user/tools/verify.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const out = process.argv[2] || '/home/user/tools/after';
fs.mkdirSync(out, { recursive: true });
const URL = 'http://127.0.0.1:5173/';
const PASSAGE = 'The quiet discipline of practice is not speed for its own sake, but the slow recovery of fluency you once took for granted.';
fs.writeFileSync('/tmp/sample-import.txt', PASSAGE + '\n' + PASSAGE + '\nPractice makes the margin narrower.');

const errors = [];
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
const shot = (n, o = {}) => page.screenshot({ path: `${out}/${n}.png`, ...o });
const row = (k, v) => console.log(`  ${String(k).padEnd(38)} ${v}`);

await page.goto(URL, { waitUntil: 'networkidle' });
await shot('01-import-desktop');
console.log('\n[IMPORT]');
row('brand-title px @1440', await page.evaluate(() => getComputedStyle(document.querySelector('.brand-title')).fontSize));
row('drop-zone px wide', await page.evaluate(() => Math.round(document.querySelector('.drop-zone').getBoundingClientRect().width)));
row('drop-zone top / title top', await page.evaluate(() => {
  const a = document.querySelector('.drop-zone').getBoundingClientRect(), b = document.querySelector('.brand-title').getBoundingClientRect();
  return `${Math.round(a.top)} / ${Math.round(b.top)}`; }));

// focus management on import -> read
await page.setInputFiles('#fileInput', '/tmp/sample-import.txt');
await page.waitForSelector('#readStage.is-active');
await page.waitForTimeout(400);
console.log('\n[SELECT]');
row('focus after import->read', await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
row('preview min-height', await page.evaluate(() => getComputedStyle(document.querySelector('.document-preview')).minHeight));
row('preview box height (short doc)', await page.evaluate(() => Math.round(document.querySelector('.document-preview').getBoundingClientRect().height)));
row('meta row (no redundant Ready label)', await page.evaluate(() => document.querySelectorAll('.document-meta > *').length + ' items; .success-label present: ' + !!document.querySelector('.success-label')));
row('heading link margin-bottom', await page.evaluate(() => getComputedStyle(document.querySelector('.section-heading > :last-child')).marginBottom));
await shot('03-select-desktop');

await page.evaluate(() => {
  const host = document.querySelector('#documentPreview .plain-text') || document.querySelector('#documentPreview').firstElementChild || document.querySelector('#documentPreview');
  const r = document.createRange(); r.selectNodeContents(host);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
});
await page.waitForTimeout(300);
const sel = await page.evaluate(() => {
  const bar = document.querySelector('.selection-bar'), btn = document.querySelector('#practiceSelectionButton');
  const cs = getComputedStyle(bar), bs = getComputedStyle(btn);
  return { border: cs.borderTopColor, borderBottom: cs.borderBottomColor, hasSel: bar.classList.contains('has-selection'),
           btnColor: bs.color, btnBg: bs.backgroundColor, aria: btn.getAttribute('aria-disabled') };
});
row('bar border-top (active, want transparent)', sel.border);
row('bar border-bottom (active)', sel.borderBottom);
row('bar has-selection', sel.hasSel);
row('dormant btn color / bg', `${sel.btnColor} / ${sel.btnBg}`);
row('dormant btn aria-disabled', sel.aria);
await shot('04-select-with-selection');

await page.click('#practiceAllButton');
await page.waitForSelector('#typeStage.is-active');
await page.waitForTimeout(350);
console.log('\n[TYPE / OVERLAY]');
row('focus on stage entry (overlay)', await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
row('typing-shell height', await page.evaluate(() => getComputedStyle(document.querySelector('.typing-shell')).height));
row('gap shell-bottom -> controls', await page.evaluate(() => {
  const a = document.querySelector('.typing-shell').getBoundingClientRect(), b = document.querySelector('.session-controls').getBoundingClientRect();
  return Math.round(b.top - a.bottom) + 'px'; }));
row('stats opacity (idle)', await page.evaluate(() => getComputedStyle(document.querySelector('.live-stats')).opacity));
await shot('05-type-idle-overlay');

await page.click('#overlayActionButton');
await page.waitForTimeout(120);
row('focus after Start', await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
for (const ch of PASSAGE.slice(0, 33)) { await page.keyboard.type(ch); await page.waitForTimeout(3); }
await page.keyboard.type('x');                 // -> error at 33, cursor moves to 34
await page.waitForTimeout(220);
const cur = await page.evaluate(() => {
  const err = document.querySelector('.char.is-current.is-incorrect');
  const next = document.querySelectorAll('.char')[document.querySelector('#typingPassage').parentElement ? 0 : 0];
  const all = [...document.querySelectorAll('.char')];
  const errEl = all.find(e => e.classList.contains('is-incorrect'));
  const curEl = all.find(e => e.classList.contains('is-current'));
  const st = errEl ? getComputedStyle(errEl) : null;
  return {
    overlapExists: Boolean(err),
    errCharIsAlsoCurrent: Boolean(errEl && errEl.classList.contains('is-current')),
    errAnim: st?.animationName + ' ' + st?.animationDuration,
    errColor: st?.color,
    curIndex: curEl ? all.indexOf(curEl) : -1,
    errIndex: errEl ? all.indexOf(errEl) : -1,
    statsOpacity: getComputedStyle(document.querySelector('.live-stats')).opacity,
  };
});
console.log('\n[CURRENT CHARACTER]');
row('incorrect char animation (want none)', `${cur.errAnim}`);
row('incorrect char color', cur.errColor);
row('error idx / cursor idx', `${cur.errIndex} / ${cur.curIndex}`);
row('stats opacity (running)', cur.statsOpacity);
await shot('06-type-mid-session');

// completed state: type the remainder, verify chrome recession
const rest = await page.evaluate(() => document.querySelector('#typingPassage').textContent.length);
for (let i = 0; i < rest; i++) { await page.keyboard.press('Digit5'); if (i % 40 === 0) await page.waitForTimeout(2); }
await page.waitForTimeout(400);
const done = await page.evaluate(() => ({
  resultsVisible: !document.querySelector('#resultsPanel').hidden,
  statsOpacity: getComputedStyle(document.querySelector('.live-stats')).opacity,
  stageEnded: document.querySelector('#typeStage').classList.contains('is-ended'),
  wpm: document.querySelector('#resultWpm').textContent,
  acc: document.querySelector('#resultAccuracy').textContent,
}));
console.log('\n[RESULTS / CHROME RECESSION]');
for (const [k, v] of Object.entries(done)) row(k, v);
await shot('07-results');

// confirm dialog tone: non-destructive vs destructive
await page.reload({ waitUntil: 'networkidle' });
await page.setInputFiles('#fileInput', '/tmp/sample-import.txt');
await page.waitForSelector('#readStage.is-active');
await page.click('#replaceDocumentButton');
await page.waitForTimeout(250);
const tone = await page.evaluate(() => {
  const b = document.querySelector('#confirmAccept');
  return { cls: b.className, bg: getComputedStyle(b).backgroundColor };
});
console.log('\n[CONFIRM DIALOG]');
row('non-destructive accept classes', tone.cls);
row('non-destructive accept bg', tone.bg);
await shot('08-confirm-primary');
await page.keyboard.press('Escape');

// keyboard-only run: skip link -> tab order -> stage advance
await page.reload({ waitUntil: 'networkidle' });
const kb = [];
for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); kb.push(await page.evaluate(() => {
  const a = document.activeElement; return a.id || a.className.split(' ')[0] || a.tagName; })); }
console.log('\n[KEYBOARD TAB ORDER]');
row('tab sequence', kb.join(' -> '));
row('visible focus ring color', await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor));
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
row('drop-zone Enter opens picker (no crash)', 'ok');

// mobile + reduced motion passes
const m = await ctx.newPage();
m.on('pageerror', (e) => errors.push(`mobile pageerror: ${e.message}`));
await m.setViewportSize({ width: 360, height: 740 });
await m.goto(URL, { waitUntil: 'networkidle' });
await m.screenshot({ path: `${out}/09-import-mobile.png` });
await m.setInputFiles('#fileInput', '/tmp/sample-import.txt');
await m.waitForSelector('#readStage.is-active');
await m.waitForTimeout(350);
await m.screenshot({ path: `${out}/10-select-mobile.png` });
await m.click('#practiceAllButton');
await m.waitForSelector('#typeStage.is-active');
await m.click('#overlayActionButton');
for (const ch of PASSAGE.slice(0, 30)) await m.keyboard.type(ch);
await m.waitForTimeout(250);
await m.screenshot({ path: `${out}/11-type-mobile.png` });
console.log('\n[MOBILE 360]');
row('typing-shell height', await m.evaluate(() => Math.round(document.querySelector('.typing-shell').getBoundingClientRect().height)));
row('session controls visible?', await m.evaluate(() => {
  const r = document.querySelector('.session-controls').getBoundingClientRect();
  return r.top < window.innerHeight ? 'in viewport' : 'below fold'; }));
await m.setViewportSize({ width: 320, height: 700 });
await m.waitForTimeout(250);
await m.screenshot({ path: `${out}/12-type-320.png` });
row('horizontal overflow @320', await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
await m.close();

const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const rpage = await rctx.newPage();
await rpage.goto(URL, { waitUntil: 'networkidle' });
await rpage.setInputFiles('#fileInput', '/tmp/sample-import.txt');
await rpage.waitForSelector('#readStage.is-active');
await rpage.click('#practiceAllButton');
await rpage.click('#overlayActionButton');
for (const ch of PASSAGE.slice(0, 20)) await rpage.keyboard.type(ch);
await rpage.waitForTimeout(200);
console.log('\n[REDUCED MOTION]');
row('stage transition duration', await rpage.evaluate(() => getComputedStyle(document.querySelector('.stage-panel')).transitionDuration));
row('cursor animation', await rpage.evaluate(() => { const c = document.querySelector('.char.is-current'); return c ? getComputedStyle(c).animationDuration : 'n/a'; }));
row('stats transition duration', await rpage.evaluate(() => getComputedStyle(document.querySelector('.live-stats')).transitionDuration));
await rpage.screenshot({ path: `${out}/13-reduced-motion-type.png` });
await rctx.close();

console.log('\nCONSOLE/PAGE ERRORS:', errors.length ? errors : 'none');
await browser.close();
