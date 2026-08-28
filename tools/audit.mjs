// impeccable-design-polish AUDIT pass — measures the rendered UI, not the source.
// node /home/user/tools/audit.mjs <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';

const out = process.argv[2] || '/home/user/tools/audit';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync('/tmp/doc.txt',
  'Alpha bravo charlie delta echo foxtrot.\n\nGolf hotel india juliet kilo lima mike november.\n\nOscar papa quebec romeo sierra tango.\n\nUniform xray yankee zulu.\n\nAnother paragraph with a few more words so that the preview can scroll a little if it needs to.');

const b = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

const num = (v) => Math.round(parseFloat(v) * 100) / 100;
const geo = (sel) => page.evaluate((s) => {
  const num = (v) => Math.round(parseFloat(v) * 100) / 100;
  const el = document.querySelector(s);
  if (!el) return { missing: s };
  const r = el.getBoundingClientRect(), c = getComputedStyle(el);
  return { x: num(r.x), y: num(r.y), w: num(r.width), h: num(r.height),
    mt: num(c.marginTop), mb: num(c.marginBottom), ml: num(c.marginLeft), mr: num(c.marginRight),
    pt: num(c.paddingTop), pb: num(c.paddingBottom), pl: num(c.paddingLeft), pr: num(c.paddingRight),
    radius: c.borderTopLeftRadius + '/' + c.borderTopRightRadius + '/' + c.borderBottomRightRadius + '/' + c.borderBottomLeftRadius,
    borderWidth: [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join(' '),
    shadow: c.boxShadow === 'none' ? 'none' : c.boxShadow.slice(0, 46) + '…',
    font: `${num(parseFloat(c.fontSize))}px/${c.lineHeight} w${c.fontWeight}`,
    color: c.color, bg: c.backgroundColor };
}, sel);

const say = (label, o) => { if (o.missing) { console.log(`  ! ${label}: MISSING`); return; }
  console.log(`  ${label.padEnd(26)} x${o.x} y${o.y} ${o.w}x${o.h}`);
  console.log(`  ${''.padEnd(26)} pad T${o.pt} R${o.pr} B${o.pb} L${o.pl} | margin T${o.mt} B${o.mb}`);
  console.log(`  ${''.padEnd(26)} radius ${o.radius} | border ${o.borderWidth}`);
  console.log(`  ${''.padEnd(26)} shadow ${o.shadow}`);
  console.log(`  ${''.padEnd(26)} type ${o.font} ${o.color} on ${o.bg}`); };

const gap = (a, bSel) => page.evaluate(([as, bs]) => {
  const A = document.querySelector(as), B = document.querySelector(bs);
  if (!A || !B) return 'missing';
  const ar = A.getBoundingClientRect(), br = B.getBoundingClientRect();
  return `vert gap ${Math.round(br.top - ar.bottom)}px | left diff ${Math.round(br.left - ar.left)}px | width ${Math.round(ar.width)} vs ${Math.round(br.width)}`;
}, [a, bSel]);

await page.screenshot({ path: `${out}/import.png` });
console.log('\n=== IMPORT ===');
for (const s of ['.import-composition', '.import-copy', '.kicker', '.brand-title', '.hero-line', '.hero-support', '.upload-panel', '.drop-zone', '.privacy-note'])
  say(s, await geo(s));
say('button (Choose a file)', await geo('.drop-zone .button'));
console.log('  alignment:', await gap('.import-copy', '.upload-panel'));
console.log('  hero->button block left edges:', await gap('.brand-title', '.drop-zone'));

await page.setInputFiles('#fileInput', '/tmp/doc.txt');
await page.waitForSelector('#readStage.is-active');
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/select.png` });
console.log('\n=== SELECT ===');
for (const s of ['.section-heading', '.section-heading h1', '.document-meta', '.file-type', '.file-identity', '.document-preview', '.selection-bar', '.selection-summary', '.advisory'])
  say(s, await geo(s));
say('button-secondary', await geo('#practiceAllButton'));
say('button-dormant', await geo('#practiceSelectionButton'));
console.log('  meta->preview:', await gap('.document-meta', '.document-preview'));
console.log('  preview->bar:', await gap('.document-preview', '.selection-bar'));
console.log('  widths share a container? heading vs preview:', await gap('.section-heading', '.document-preview'));

await page.click('#practiceAllButton');
await page.waitForSelector('#typeStage.is-active');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/type.png` });
console.log('\n=== TYPE ===');
for (const s of ['.typing-topbar', '.typing-topbar h1', '.live-stats', '.progress-track', '.typing-shell', '.typing-passage', '.typing-hint', '.session-controls'])
  say(s, await geo(s));
say('button-primary (Start)', await geo('#startPauseButton'));
say('button-secondary (Restart)', await geo('#restartButton'));
console.log('  stats->track:', await gap('.live-stats', '.progress-track'));
console.log('  track->shell:', await gap('.progress-track', '.typing-shell'));
console.log('  hint->controls:', await gap('.typing-hint', '.session-controls'));

await page.click('#overlayActionButton');
await page.keyboard.type('Alpha bravo charlie delta echo foxtrot.');
await page.waitForTimeout(1200);
console.log('\n=== RESULTS (after completing) ===');
await page.keyboard.press('Backspace');
const finish = await page.evaluate(() => document.querySelector('#typingPassage').textContent.length);
for (let i = 0; i < finish; i++) await page.keyboard.press('Digit5');
await page.waitForTimeout(500);
for (const s of ['.results', '.result-grid', '.result-grid div', '.missed-words', '.result-actions'])
  say(s, await geo(s));
await page.screenshot({ path: `${out}/results.png`, fullPage: true });

console.log('\n=== LIBRARY (with data) ===');
await page.evaluate(() => {
  const list = document.querySelector('#mistakeList');
  list.innerHTML = '';
  const row = (w, c, ctx2, n, d) => {
    const div = document.createElement('div');
    div.className = 'mistake-item';
    div.innerHTML = `<input type="checkbox" value="${w}"><strong class="mistake-word">${w}</strong><span class="mistake-context">${ctx2}</span><span class="mistake-count">${n}x</span><time class="mistake-date">${d}</time><button class="remove-word">Remove</button>`;
    list.append(div);
  };
  row('the', '…and then the rest of the sentence followed', '12', '2 Aug');
  row('quaing', '…with a deliberately long contextual fragment here', '7', '1 Aug');
  row('fluency', '…the slow recovery of fluency you once took', '3', '30 Jul');
  document.querySelector('#libraryDialog').showModal();
});
await page.waitForTimeout(350);
for (const s of ['.library-dialog', '.dialog-header', '.library-toolbar', '.mistake-item', '.mistake-word', '.mistake-context', '.mistake-count', '.remove-word', '.library-footer', '.button-small'])
  say(s, await geo(s));
console.log('  item grid cols:', await page.evaluate(() => getComputedStyle(document.querySelector('.mistake-item')).gridTemplateColumns));
await page.screenshot({ path: `${out}/library.png` });

// ---- rhythm analysis: every visible top-level margin/padding in the type + select stages
const rhythm = await page.evaluate(() => {
  const collect = (stage) => [...document.querySelectorAll(`${stage} > *`)]
    .map(el => { const r = el.getBoundingClientRect(), c = getComputedStyle(el);
      return { tag: el.className || el.tagName, top: Math.round(r.top), bot: Math.round(r.bottom), mb: c.marginBottom, mt: c.marginTop, h: Math.round(r.height) }; });
  return { read: collect('.read-stage'), type: collect('.type-stage') };
});
const steps = (arr) => arr.slice(1).map((el, i) => ({ gap: el.top - arr[i].bot, mt: el.mt, prevMb: arr[i].mb }));
console.log('\n=== VERTICAL RHYTHM (read stage) ===');
for (const s of steps(rhythm.read)) console.log(`  gap ${String(s.gap).padStart(4)}px  (next margin-top ${s.mt}, prev margin-bottom ${s.prevMb})`);
console.log('=== VERTICAL RHYTHM (type stage) ===');
for (const s of steps(rhythm.type)) console.log(`  gap ${String(s.gap).padStart(4)}px  (next margin-top ${s.mt}, prev margin-bottom ${s.prevMb})`);

// radius + border census across everything visible
const census = await page.evaluate(() => {
  const rad = {}, brd = {}, shad = {};
  for (const el of document.querySelectorAll('*')) {
    if (!el.offsetParent && el.tagName !== 'BODY') continue;
    const c = getComputedStyle(el);
    if (c.borderTopLeftRadius !== '0px') { const k = [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius].join(' '); rad[k] = (rad[k] || 0) + 1; }
    const bw = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth];
    if (bw.some(w => parseFloat(w) > 0) && c.borderStyle !== 'none') { const k = `${bw.join('/')} ${c.borderStyle.split(' ')[0]} ${c.borderTopColor}`; brd[k] = (brd[k] || 0) + 1; }
    if (c.boxShadow !== 'none') { const k = c.boxShadow.slice(0, 40); shad[k] = (shad[k] || 0) + 1; }
  }
  return { rad, brd, shad };
});
console.log('\n=== RADIUS CENSUS (rendered, current stage) ===');
for (const [k, v] of Object.entries(census.rad).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(2)}x  ${k}`);
console.log('=== BORDER CENSUS ===');
for (const [k, v] of Object.entries(census.brd).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${String(v).padStart(2)}x  ${k}`);
console.log('=== SHADOW CENSUS ===');
for (const [k, v] of Object.entries(census.shad)) console.log(`  ${String(v).padStart(2)}x  ${k}`);

// mobile rhythm + clipping
for (const w of [880, 620, 360, 320]) {
  await page.setViewportSize({ width: w, height: 860 });
  await page.waitForTimeout(250);
  const m = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.type-stage *, .read-stage *, header *, .selection-bar *')].filter(e => e.offsetParent);
    const clipped = els.filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' && e.clientWidth > 0)
      .map(e => `${(e.className || e.tagName).toString().slice(0, 26)} ${e.scrollWidth}>${e.clientWidth}`);
    const overflow = [...els].filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map(e => `${(e.className || e.tagName).toString().slice(0, 26)}`);
    return { docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, clipped: clipped.slice(0, 6), overflow: [...new Set(overflow)].slice(0, 6) };
  });
  console.log(`\n=== @${w}px === doc overflow: ${m.docOverflow}px | clipped: ${m.clipped.join(' | ') || 'none'} | past edge: ${m.overflow.join(', ') || 'none'}`);
  await page.screenshot({ path: `${out}/type-${w}.png` });
}
await b.close();
