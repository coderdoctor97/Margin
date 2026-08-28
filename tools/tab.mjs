import { chromium } from 'playwright';
const b = await chromium.launch({args:['--no-sandbox']});
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:5173/', {waitUntil:'networkidle'});
for (let i=0;i<9;i++) {
  await p.keyboard.press('Tab');
  const r = await p.evaluate(() => { const e = document.activeElement; const c = getComputedStyle(e);
    return { id: e.id || e.className || e.tagName, outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`,
             clip: c.clipPath, pos: c.position, box: Math.round(e.getBoundingClientRect().width) }; });
  console.log(i+1, JSON.stringify(r));
}
await b.close();
