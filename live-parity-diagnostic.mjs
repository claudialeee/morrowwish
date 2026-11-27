import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {chromium} from 'playwright';
const out='qa-output/live-check';fs.mkdirSync(out,{recursive:true});
const files=['js/data.js','js/battle.js','js/duo-premium.js','js/duo-bond.js','assets/mobile-portrait/duo/fire-light-tier-3.webp'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync('source/public/cat-bond/'+f))]));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report={sourceCommit:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',checkedAt:new Date().toISOString(),expected,targets:[]};
const urls=[['crazygames-canonical','https://morrowwish.vercel.app/cat-bond/?platform=crazygames&lang=en'],['itch-public','https://morrowwishgames.itch.io/cat-bond']];
for(const [name,url] of urls){
 const ctx=await browser.newContext({viewport:{width:1280,height:900}}),page=await ctx.newPage();
 const r={name,url,frames:[],requestsFailed:[],consoleErrors:[],pass:false};report.targets.push(r);
 await ctx.route('**/*',route=>{const u=new URL(route.request().url());return /(?:\/api\/(?:session|telemetry|events|track)|\/telemetry(?:\/|[.]|$))/i.test(u.pathname)?route.abort():route.continue()});
 page.on('requestfailed',q=>{if(r.requestsFailed.length<30)r.requestsFailed.push({url:q.url().slice(0,220),error:q.failure()?.errorText})});
 page.on('pageerror',e=>r.consoleErrors.push(e.message.slice(0,250)));
 try{
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});r.status=response?.status();r.title=await page.title();r.finalUrl=page.url();
 await page.waitForTimeout(1500);
 if(name==='itch-public'){
 r.buttons=await page.evaluate(()=>[...document.querySelectorAll('button,a,[role="button"],.game_frame,.embed_wrapper')].filter(el=>/run game|play game|launch game|play now|click to play/i.test(el.textContent||'')).map(el=>({tag:el.tagName,id:el.id,classes:String(el.className).slice(0,100),text:el.textContent.trim().slice(0,100),visible:!!el.getClientRects().length})).slice(0,15));
 r.listingText=(await page.locator('body').innerText()).slice(0,1200);
 const selectors=['#play_button','.game_frame .button','.launch_btn','.start_game','button:has-text("Run game")','text=/run game|play game|launch game|click to play/i'];
 for(const sel of selectors){const l=page.locator(sel).first();if(await l.count()&&await l.isVisible().catch(()=>false)){try{await l.click({timeout:5000});r.clicked=sel;break}catch(e){r.clickError=String(e).slice(0,180)}}}
 }
 let frame;
 for(let i=0;i<25&&!frame;i++){for(const f of page.frames()){if(await f.evaluate(()=>!!document.querySelector('script[src*="duo-premium.js"]')&&!!document.querySelector('#scene')).catch(()=>false)){frame=f;break}}if(!frame)await page.waitForTimeout(400)}
 r.frames=page.frames().map(f=>f.url());r.iframes=await page.evaluate(()=>[...document.querySelectorAll('iframe')].map(el=>({src:el.src,visible:!!el.getClientRects().length})));
 if(!frame)throw Error('Actual Cat Bond frame unavailable; no assumed parity');
 r.actualFrame=frame.url();r.assets=[];
 for(const f of files){
 let data=await frame.evaluate(async name=>{const tag=[...document.scripts].find(s=>s.src&&new URL(s.src).pathname.endsWith('/'+name));const url=tag?.src||new URL(name,document.baseURI).href;let res=await fetch(url,{cache:'no-store'});return {status:res.status,url:res.url,bytes:[...new Uint8Array(await res.arrayBuffer())]}},f);
 let actual=hash(Buffer.from(data.bytes));r.assets.push({file:f,status:data.status,url:data.url,match:data.status===200&&actual===expected[f],actual,expected:expected[f]})
 }
 r.pass=r.assets.every(a=>a.match);
 }catch(e){r.error=String(e.message||e)}
 finally{await page.screenshot({path:out+'/'+name+'.png'}).catch(()=>{});await ctx.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
}
await browser.close();
