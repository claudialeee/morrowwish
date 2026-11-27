import fs from 'node:fs';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {chromium} from 'playwright';
const out='qa-output',dir=out+'/gamepix-extracted';fs.mkdirSync(dir,{recursive:true});execFileSync('unzip',['-q','-o','output/cat-bond-gamepix-candidate.zip','-d',dir]);const server=spawn('python3',['-m','http.server','18964','--bind','127.0.0.1','--directory',dir],{stdio:'ignore'});
const base='http://127.0.0.1:18964',report={sourceCommit:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',tests:[],portalVerified:false,pass:false};let browser,save;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break}catch{}await wait(200)}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,width,height,touch] of [['desktop',1280,720,false],['y8-standard',760,570,false],['gamepix-portrait',720,1280,true]]){
 const r={name,width,height,errors:[],failedRequests:[],external:[],pass:false};report.tests.push(r);
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,...(save?{storageState:save}:{})});
 const page=await ctx.newPage();const shot=async name2=>{await page.waitForTimeout(500);await page.screenshot({path:out+'/'+name+'-'+name2+'.png'})};
 const tap=async selector=>{let l=page.locator(selector).first();await l.waitFor({state:'visible',timeout:20000});if(touch)await l.tap();else await l.click()};
 page.on('pageerror',e=>r.errors.push(String(e)));page.on('response',res=>{if(res.status()>=400&&!res.url().endsWith('favicon.ico'))r.failedRequests.push(res.status()+' '+res.url())});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base){r.external.push(url.origin+url.pathname);return route.abort()}return route.continue()});
 try{
 await page.goto(base+'/?lang=en',{waitUntil:'domcontentloaded',timeout:40000});
 if(!save){await tap('#intro-start');await tap('#panel.open .dex-cell');await page.waitForFunction(()=>window.State?.S?.cats?.length===1);await shot('first-garden');
 const p=await page.evaluate(()=>{let s=window.__game?.yard?.hide?.spot,b=document.getElementById('scene').getBoundingClientRect();return s?{x:b.left+s.x,y:b.top+s.y}:null});if(!p)throw Error('Missing first wild cat');
 await page.mouse.click(p.x,p.y);await page.locator('#cp-go').waitFor({state:'visible',timeout:15000});const auto=page.locator('#panel.open .capture-mode-option[data-battle-auto="true"]');if(await auto.count())await auto.click();await tap('#cp-go');const skip=page.locator('#battle-tutorial-skip');if(await skip.isVisible())await skip.click();await shot('battle');
 await page.locator('#cr-next').waitFor({state:'visible',timeout:120000});await shot('capture-result');if(await page.evaluate(()=>State.S.cats.length)<2)throw Error('First capture not earned');await tap('#cr-next');
 save=await ctx.storageState();r.captureEarned=true;
 }else{let intro=page.locator('#intro-start');if(await intro.isVisible())await intro.click();await page.waitForFunction(()=>window.State?.S?.cats?.length>=2,{timeout:20000})}
 await shot('garden');
 await tap('[data-tab="dex"]');await shot('catdex');let close=page.locator('#panel.open .panel-dismiss').first();if(await close.isVisible())await close.click();
 await tap('[data-tab="work"]');await shot('workshop');if(await close.isVisible())await close.click();
 await tap('[data-tab="cats"]');await shot('companions');if(await close.isVisible())await close.click();
 r.debugHidden=!(await page.locator('#fab-debug-unlock').isVisible());
 r.language=await page.evaluate(()=>document.documentElement.lang);
 r.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 await page.reload({waitUntil:'domcontentloaded'});await tap('#intro-start');await page.waitForFunction(()=>window.State?.S?.cats?.length>=2,{timeout:20000});
 r.savedCats=await page.evaluate(()=>State.S.cats.length);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('catbond_save_v1')||'{}').cats?.length||0);r.savedLocalStorageCats=saved;r.pass=saved>=2&&r.debugHidden&&!r.overflow&&r.savedCats>=2&&r.language.startsWith('en')&&!r.errors.length&&!r.failedRequests.length&&!r.external.length;
 }catch(e){r.error=String(e);await shot('failure').catch(()=>{})}finally{await ctx.close();fs.writeFileSync(out+'/standalone-qa.json',JSON.stringify(report,null,2)+'\n')}
 }
 report.pass=report.tests.every(x=>x.pass)&&report.tests.length===3;
}finally{await browser?.close();server.kill();fs.writeFileSync(out+'/standalone-qa.json',JSON.stringify(report,null,2)+'\n')}
if(!report.pass)process.exitCode=1;
