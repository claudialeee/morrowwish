// Read-only live itch.io build comparison. Run from a checkout of the frozen
// intended Cat Bond source: node promotion/cat-bond-platform-refresh-20261127/verify-itch-live.mjs
// Requires locally installed playwright and Chromium. No login or publication.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const root=process.env.CAT_BOND_SOURCE||'public/cat-bond';
const target='https://morrowwishgames.itch.io/cat-bond';
const files=['js/data.js','js/battle.js','js/duo-premium.js','js/duo-bond.js','assets/mobile-portrait/duo/fire-light-tier-3.webp'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]));
const browser=await chromium.launch({headless:true});
let result={url:target,checkedAt:new Date().toISOString(),pass:false,expected};
try {
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 // Suppress instrumentation traffic, not the game resource requests.
 await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   return /(?:\/api\/(?:telemetry|events|track)|\/telemetry(?:\/|$))/i.test(u.pathname)
     ? route.abort() : route.continue();
 });
 const page=await context.newPage();
 const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
 if(!response?.ok())throw Error('Public listing unavailable: '+response?.status());
 const run=page.getByText(/^Run game$/i).first();
 if(await run.isVisible())await run.click({timeout:10000});
 let gameFrame;
 for(let i=0;i<60&&!gameFrame;i++){
   for(const f of page.frames()){
     if(await f.evaluate(()=>!!document.querySelector('script[src*="duo-premium.js"]')&&!!document.querySelector('#scene')).catch(()=>false)){gameFrame=f;break;}
   }
   if(!gameFrame)await page.waitForTimeout(500);
 }
 result.frames=page.frames().map(f=>f.url());
 if(!gameFrame)throw Error('Actual Cat Bond game frame not found after public Run game');
 result.gameFrame=gameFrame.url();
 result.assets=[];
 for(const file of files){
   // Resolve from the actual document, not a separately opened canonical URL.
   // For scripts preserve their actual cache-buster by reading the DOM.
   const asset=await gameFrame.evaluate(async name=>{
     const script=Array.from(document.scripts).find(s=>s.src&&new URL(s.src).pathname.endsWith('/'+name));
     const url=script?.src||new URL(name,document.baseURI).href;
     const r=await fetch(url,{cache:'no-store'});
     return {url:r.url,status:r.status,bytes:Array.from(new Uint8Array(await r.arrayBuffer()))};
   },file);
   const actual=hash(Buffer.from(asset.bytes));
   result.assets.push({file,url:asset.url,status:asset.status,actual,expected:expected[file],match:asset.status===200&&actual===expected[file]});
 }
 result.pass=result.assets.every(a=>a.match);
 if(!result.pass)throw Error('Embedded game assets differ from frozen source; inspect deployment and wrapper before editing listing.');
} catch(e){result.error=String(e.message||e);}
finally{
 await browser.close();
 fs.mkdirSync('.check/cat-bond-platform-drafts',{recursive:true});
 fs.writeFileSync('.check/cat-bond-platform-drafts/itch-live-parity.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}
if(!result.pass)process.exitCode=1;
