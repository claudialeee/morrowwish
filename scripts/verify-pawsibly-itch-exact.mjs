import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:720}});
const page=await ctx.newPage();
const requests=[],errors=[];
await ctx.route('**/api/**',r=>r.fulfill({status:204,body:''}));
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().includes('morrowwish'))requests.push({url:r.url(),status:r.status()})});
const sha=x=>createHash('sha256').update(x).digest('hex');
try{
 const response=await page.goto('https://morrowwishgames.itch.io/pawsibly-innocent',{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(response.status(),200);
 const button=page.getByText(/run game|play game|launch game|play now|click to play/i).first();
 if(await button.isVisible().catch(()=>false))await button.click({timeout:10000});
 const until=Date.now()+25000;
 let frame;
 while(Date.now()<until){frame=page.frames().find(f=>/^https:\/\/(?:morrowwish\.vercel\.app|morrowwish\.pages\.dev)\/pawsibly-innocent\//.test(f.url()));if(frame)break;await page.waitForTimeout(500);}
 assert.ok(frame,'Existing itch project did not expose the canonical live game iframe');
 await frame.locator('#board').waitFor({state:'visible',timeout:15000});
 const version=await frame.evaluate(()=>({engine:[...document.scripts].find(s=>s.src.includes('/pawsibly-innocent/game.js'))?.src,css:[...document.querySelectorAll('link[rel=stylesheet]')].find(s=>s.href.includes('/pawsibly-innocent/single-screen.css'))?.href,fish:document.querySelector('#fishCount')?.textContent}));
 assert.ok(version.engine&&version.css);
 for(const [url,path] of [[version.engine,'public/pawsibly-innocent/game.js'],[version.css,'public/pawsibly-innocent/single-screen.css']]){
  const res=await ctx.request.get(url);assert.equal(res.status(),200);
  assert.equal(sha(await res.body()),sha(fs.readFileSync(path)),url+' must match pinned source bytes');
 }
 await frame.locator('#board').click({position:await frame.locator('#board').evaluate(el=>({x:el.clientWidth*.25,y:el.clientHeight*.5}))});
 await frame.waitForFunction(()=>/1\s*\/\s*3/.test(document.querySelector('#fishCount').textContent),{},{timeout:8000});
 fs.mkdirSync('release-kit/pawsibly',{recursive:true});await page.screenshot({path:'release-kit/pawsibly/itch-live.png'});
 fs.writeFileSync('release-kit/pawsibly/itch-live.json',JSON.stringify({status:'pass',source:process.env.SOURCE_SHA,frame:frame.url(),version,fish:await frame.locator('#fishCount').textContent(),errors,requests},null,2));
 console.log('ITCH EXACT LIVE ENGINE/CSS MATCH AND REAL FISH COLLECTION PASS',frame.url());
}finally{await browser.close();}
