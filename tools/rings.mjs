import { chromium } from 'playwright'; import fs from 'node:fs';
fs.writeFileSync('/tmp/r.txt','Alpha bravo charlie delta echo foxtrot. Golf hotel india juliet kilo lima mike november.');
const b = await chromium.launch({args:['--no-sandbox']});
const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('http://127.0.0.1:5173/', {waitUntil:'networkidle'});
await p.setInputFiles('#fileInput','/tmp/r.txt'); await p.waitForSelector('#readStage.is-active');
await p.waitForTimeout(400);
const read = () => p.evaluate(() => { const g = s => { const e = document.querySelector(s); const c = getComputedStyle(e);
  return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} off ${c.outlineOffset}`; };
  return { preview: g('.document-preview'), passage: g('.typing-passage'),
           focused: document.activeElement?.id || document.activeElement?.tagName,
           metaItems: document.querySelectorAll('.document-meta > *').length }; });
console.log('read stage (auto-focused after import):', JSON.stringify(await read()));
await p.keyboard.press('Shift+Tab');
console.log('after Shift+Tab                     :', JSON.stringify(await read()));
await p.click('#practiceAllButton'); await p.waitForSelector('#typeStage.is-active'); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector('#typingPassage').focus());
await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab');
console.log('type stage (passage focused)        :', JSON.stringify(await read()));
await b.close();
