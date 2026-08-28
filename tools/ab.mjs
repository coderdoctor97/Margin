// node /home/user/tools/ab.mjs <label>  — writes /home/user/tools/ab-<label>.json
import { chromium } from 'playwright'; import fs from 'node:fs';
fs.writeFileSync('/tmp/doc.txt','Alpha bravo charlie delta echo foxtrot.\n\nGolf hotel india juliet kilo lima mike november.\n\nOscar papa quebec romeo sierra tango.\n\nUniform xray yankee zulu.\n\nAnother paragraph with a few more words so that the preview can scroll a little if it needs to.');
const HUES = { forest:'rgb(34, 75, 60)', forestDark:'rgb(23, 55, 44)', sage:'rgb(145, 170, 153)', sagePale:'rgb(219, 230, 220)', rust:'rgb(160, 71, 50)', rustText:'rgb(142, 57, 40)', gold:'rgb(118, 85, 29)', ink:'rgb(31, 41, 37)', muted:'rgb(79, 89, 83)', line:'rgb(216, 210, 198)', white:'rgb(255, 253, 248)', paper:'rgb(245, 241, 232)', focus:'rgb(166, 110, 49)', sel:'rgb(201, 218, 203)', advisory:'rgb(247, 237, 215)' };
const b = await chromium.launch({args:['--no-sandbox']});
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:5173/', {waitUntil:'networkidle'});
const probe = () => p.evaluate((HUES) => {
  const num = v => parseFloat(v) || 0;
  const vis = e => e.offsetParent !== null || e.getClientRects().length;
  const root = document.querySelector('main .stage-panel.is-active');
  const nodes = [...root.querySelectorAll('*')].filter(vis).filter(e => !e.classList.contains('char'));
  const used = new Set(); const accentArea = {}; let shadows = 0, borders = 0, backdrop = 0, pseudo = 0, maxBorder = 0;
  const cs = e => getComputedStyle(e);
  for (const e of nodes) { const s = cs(e);
    if (s.boxShadow && s.boxShadow !== 'none') shadows++;
    const bw = ['Top','Right','Bottom','Left'].map(d => num(s['border'+d+'Width']));
    if (bw.some(v => v > 0)) { borders++; maxBorder = Math.max(maxBorder, ...bw); }
    if (s.backdropFilter && s.backdropFilter !== 'none') backdrop++;
    const area = e.clientWidth * e.clientHeight;
    for (const v of [s.backgroundColor]) { const m = v.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) continue;
      const [r,g,bl] = [+m[1],+m[2],+m[3]]; const mx = Math.max(r,g,bl), mn = Math.min(r,g,bl);
      if (mx > 0 && (mx-mn)/mx > 0.16 && !/rgba\(\d+, \d+, \d+, 0\)/.test(v)) {
        for (const [n,rgb] of Object.entries(HUES)) if (v.startsWith(rgb)) { accentArea[n] = (accentArea[n]||0) + area; } } }
    for (const v of [s.color]) { const m = v.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) continue;
      const [r,g,bl] = [+m[1],+m[2],+m[3]]; const mx = Math.max(r,g,bl), mn = Math.min(r,g,bl);
      if (mx > 0 && (mx-mn)/mx > 0.16) for (const [n,rgb] of Object.entries(HUES)) if (v.startsWith(rgb)) used.add(n); } }
  for (const sel of ['::before','::after']) for (const e of nodes) { const s = getComputedStyle(e, sel);
    if (s.content && s.content !== 'none' && s.content !== 'normal') pseudo++; }
  return { nodes: nodes.length, accentArea, shadows, borderNodes: borders, maxBorderPx: maxBorder, backdrop, pseudo, hues: [...used].sort() };
}, HUES);
const r = {};
r.import = await probe();
await p.setInputFiles('#fileInput','/tmp/doc.txt'); await p.waitForSelector('#readStage.is-active'); await p.waitForTimeout(300);
r.select = await probe();
await p.click('#practiceAllButton'); await p.waitForSelector('#typeStage.is-active'); await p.waitForTimeout(300);
r.type = await probe();
r.focus = await p.evaluate(() => { const cs=e=>getComputedStyle(e);
  const read = () => ({ live: cs(document.querySelector('.live-stats')).opacity, topbar: cs(document.querySelector('.typing-topbar')).color });
  const before = read(); document.querySelector('#startPauseButton').click();
  return new Promise(res => setTimeout(() => res({ before, after: read(), active: document.activeElement.id }), 400)); });
fs.writeFileSync(`/home/user/tools/ab-${process.argv[2]}.json`, JSON.stringify(r, null, 1));
console.log(JSON.stringify(r));
await b.close();
