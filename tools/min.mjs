// minimalist-skill pass — measures RESTRAINT in the rendered UI (not the source).
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || '/home/user/tools/min';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync('/tmp/doc.txt',
  'Alpha bravo charlie delta echo foxtrot.\n\nGolf hotel india juliet kilo lima mike november.\n\nOscar papa quebec romeo sierra tango.\n\nUniform xray yankee zulu.\n\nAnother paragraph with a few more words so that the preview can scroll a little if it needs to.');
const b = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = []; p.on('console', m => m.type()==='error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

const probe = () => p.evaluate(() => {
  const num = v => parseFloat(v) || 0;
  const vis = e => e.offsetParent !== null || e.getClientRects().length;
  const root = document.querySelector('main .stage-panel.is-active');
  const nodes = [...root.querySelectorAll('*')].filter(vis);
  const accents = new Set(); let shadows = 0, borders = 0, backdrop = 0, gradients = 0, deco = 0;
  const cs = e => getComputedStyle(e);
  const HUES = { forest:'rgb(34, 75, 60)', forestDark:'rgb(23, 55, 44)', sage:'rgb(145, 170, 153)', sagePale:'rgb(219, 230, 220)', rust:'rgb(160, 71, 50)', rustText:'rgb(142, 57, 40)', gold:'rgb(118, 85, 29)', ink:'rgb(31, 41, 37)', muted:'rgb(79, 89, 83)', line:'rgb(216, 210, 198)', white:'rgb(255, 253, 248)', paper:'rgb(245, 241, 232)', charCorrect:'rgb(41, 66, 54)', charIncorrect:'rgb(135, 47, 34)', charDefault:'rgb(96, 104, 99)', focus:'rgb(166, 110, 49)', sel:'rgb(201, 218, 203)', advisory:'rgb(247, 237, 215)' };
  const used = new Set();
  for (const e of nodes) {
    if (e.classList.contains('char')) continue;
    const s = cs(e);
    if (s.boxShadow && s.boxShadow !== 'none') shadows++;
    const bw = ['Top','Right','Bottom','Left'].map(d => num(s['border'+d+'Width']));
    if (bw.some(v => v > 0)) borders++;
    if (s.backdropFilter && s.backdropFilter !== 'none') backdrop++;
    for (const prop of ['backgroundImage']) if (s[prop] && s[prop].includes('gradient')) gradients++;
    if ((e.className+'').includes('::')) deco++;
    const col = s.color, bg = s.backgroundColor;
    for (const v of [col, bg]) {
      const m = v.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) continue;
      const [r,g,bl] = [+m[1],+m[2],+m[3]];
      const mx = Math.max(r,g,bl), mn = Math.min(r,g,bl);
      if (mx > 0 && (mx-mn)/mx > 0.16) {
        accents.add(v.replace(/, ?[\d.]+\)$/,')'));
        for (const [name, rgb] of Object.entries(HUES)) if (v.startsWith(rgb)) used.add(name);
      }
    }
  }
  for (const e of nodes) { if (e.classList.contains('char')) continue; const s = cs(e);
    const bw = ['Top','Right','Bottom','Left'].map(d => num(s['border'+d+'Width']));
    if (bw.some(v => v > 0)) used.add('BORDER'); }
  for (const sel of ['::before','::after']) {
    for (const e of nodes.slice(0,400)) { const s = getComputedStyle(e, sel);
      if (s.content && s.content !== 'none' && s.content !== 'normal') deco++; }
  }
  const cpl = el => { if (!el) return null;
    const st = getComputedStyle(el); const probe = document.createElement('span');
    probe.style.fontFamily = st.fontFamily; probe.style.fontSize = st.fontSize;
    probe.style.letterSpacing = st.letterSpacing; probe.style.fontWeight = st.fontWeight;
    probe.style.visibility = 'hidden'; probe.style.position = 'absolute';
    probe.textContent = 'n'.repeat(200); document.body.appendChild(probe);
    const w1 = probe.getBoundingClientRect().width/200; probe.remove();
    return Math.round(el.clientWidth/w1); };
  const focusState = {};
  const read = () => { const ls = document.querySelector('.live-stats'), tb = document.querySelector('.typing-topbar');
    return { liveStatsOpacity: ls? cs(ls).opacity : null, topbarColor: tb? cs(tb).color : null }; };
  return {
    nodes: nodes.length, shadows, borders, backdrop, gradients, pseudoDeco: deco,
    accents: [...accents].sort(), hues: [...used].sort(), borderNodes: borders, previewCPL: cpl(document.querySelector('.document-preview')),
    passageCPL: cpl(document.querySelector('.typing-passage')),
    preFocus: read(),
  };
});

console.log('IMPORT ', JSON.stringify(await probe()));
await p.setInputFiles('#fileInput', '/tmp/doc.txt');
await p.waitForSelector('#readStage.is-active');
await p.waitForTimeout(250);
console.log('SELECT ', JSON.stringify(await probe()));
await p.screenshot({ path: `${out}/select.png` });
await p.click('#practiceAllButton');
await p.waitForSelector('#typeStage.is-active');
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/type-idle.png` });
const preFocus = await p.evaluate(() => { const cs=e=>getComputedStyle(e);
  return { live: cs(document.querySelector('.live-stats')).opacity, topbar: cs(document.querySelector('.typing-topbar')).color }; });
// Enter the focused/typing state: dismiss the overlay with the keyboard target only (no typing yet)
await p.click('#startPauseButton');
await p.waitForTimeout(400);
const postFocus = await p.evaluate(() => { const cs=e=>getComputedStyle(e);
  return { active: document.activeElement.id, live: cs(document.querySelector('.live-stats')).opacity, topbar: cs(document.querySelector('.typing-topbar')).color,
            hint: cs(document.querySelector('.typing-hint')).opacity,
            statsLayout: document.querySelector('.live-stats').getBoundingClientRect().height,
            controlsLayout: document.querySelector('.session-controls').getBoundingClientRect().height }; });
await p.screenshot({ path: `${out}/type-focused.png` });
console.log('FOCUS  pre ', JSON.stringify(preFocus));
console.log('FOCUS  post', JSON.stringify(postFocus));
const full = await probe();
console.log('TYPE   ', JSON.stringify(full));
console.log('CPL    preview', full.previewCPL, 'passage', full.passageCPL);
const clip = (x,y,w,h,name) => p.screenshot({ path: `${out}/${name}.png`, clip: {x,y,width:w,height:h} });
await clip(0,0,1440,900,'full');
// library
await p.keyboard.press('Escape');
await p.click('#openLibraryButton');
await p.waitForTimeout(250);
await p.screenshot({ path: `${out}/library.png` });
await p.evaluate(() => document.querySelector('#closeLibraryButton').click());
// narrow
for (const w of [880, 620, 360, 320]) {
  await p.setViewportSize({ width: w, height: 900 });
  await p.waitForTimeout(200);
  const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const ov = await p.evaluate(() => { let m=0; for (const e of document.querySelectorAll('.stage-panel.is-active *')) { const r=e.getBoundingClientRect(); if (r.right > innerWidth+0.5) m = Math.max(m, Math.round(r.right-innerWidth)); } return m; });
  console.log(`@${w}px  horizontal overflow: ${o}px | past edge: ${ov}px`);
  if (w===360) await p.screenshot({ path: `${out}/type-360.png` });
  await p.setViewportSize({ width: 1440, height: 900 });
}
console.log('CONSOLE ERRORS:', errs.length ? errs.join(' | ') : 'none');
await b.close();
