import { chromium } from 'playwright'; import fs from 'node:fs';
fs.writeFileSync('/tmp/fc.txt','Alpha bravo charlie delta echo foxtrot. Golf hotel india juliet kilo lima mike november. Oscar papa quebec romeo sierra tango uniform xray.');
const b = await chromium.launch({args:['--no-sandbox']});
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:5173/', {waitUntil:'networkidle'});
await p.setInputFiles('#fileInput','/tmp/fc.txt'); await p.waitForSelector('#readStage.is-active');
await p.click('#practiceAllButton'); await p.waitForSelector('#typeStage.is-active');
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('#typingPassage').focus());   // enter the focused state, no clock start
await p.waitForTimeout(400);
const out = await p.evaluate(() => {
  const lum = ([r,g,bl]) => { const f = c => { c/=255; return c<=.03928?c/12.92:((c+.055)/1.055)**2.4; };
    return .2126*f(r)+.7152*f(g)+.0722*f(bl); };
  const bg = [245,241,232];
  const chain = e => { let o = 1, n = e; const parts = [];
    while (n && n !== document.body) { const v = parseFloat(getComputedStyle(n).opacity);
      if (v !== 1) parts.push((n.className||n.tagName)+':'+v); o *= v; n = n.parentElement; }
    return { o, parts }; };
  const res = {};
  for (const [k,sel] of [['stat label','.live-stats span'],['stat value','.live-stats strong'],
                         ['hint','.typing-hint'],['topbar h1','.typing-topbar h1'],['kicker','.typing-topbar .kicker'],
                         ['back to doc','.typing-topbar .text-button'],['pause btn','#startPauseButton']]) {
    const e = document.querySelector(sel); if (!e) { res[k] = 'missing'; continue; }
    const cs = getComputedStyle(e); const { o, parts } = chain(e);
    const m = cs.color.match(/rgb\((\d+), (\d+), (\d+)/);
    const fg = [+m[1],+m[2],+m[3]].map(c => c*o + bg[c===+m[1]?0:1]*(1-o));
    const eff = [0,1,2].map(i => (+m[i+1] ?? 0));
    const rgb = [+m[1],+m[2],+m[3]].map(c => c*o + (o<1? 245:0)*(1-o)*0 + (1-o)*(i=>i)(0));
    let bb = [245,241,232]; const own = getComputedStyle(e).backgroundColor.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
    if (own && +own[4] > 0.99) bb = [+own[1],+own[2],+own[3]];
    else { let n = e; while (n && n !== document.body) { const m2 = getComputedStyle(n).backgroundColor.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
      if (m2 && +m2[4] > 0.99) { bb = [+m2[1],+m2[2],+m2[3]]; break; } n = n.parentElement; } }
    const c = getComputedStyle(e).color.match(/rgb\((\d+), (\d+), (\d+)/);
    const comp = [+m[1],+m[2],+m[3]].map((c,i) => c*o + bb[i]*(1-o));
    const L1 = lum(comp), L2 = lum(bb);
    res[k] = { px: cs.fontSize, w: cs.fontWeight, effOpacity: +o.toFixed(2), chain: parts.join(','),
               contrast: +(((Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05))).toFixed(2) };
  }
  res.divider = getComputedStyle(document.querySelector('.live-stats div')).borderRightColor;
  res.focused = document.activeElement.id;
  return res; });
console.log(JSON.stringify(out, null, 1));
await b.close();
