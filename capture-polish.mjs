import fs from 'node:fs';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {chromium} from 'playwright';
const root=path.resolve('output/refined');fs.mkdirSync(root,{recursive:true});const base='http://127.0.0.1:18963';
const server=spawn('python3',['-m','http.server','18963','--bind','127.0.0.1','--directory','source/public'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let browser;
const report={sourceCommit:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',method:'trusted real player input, no seeded state or fabricated result',captures:[],visualApproved:false};
try{
 for(let i=0;i<50;i++){try{if((await fetch(base+'/cat-bond/')).ok)break}catch{}await wait(200)}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,width,height,touch] of [['landscape',1920,1080,false],['portrait',1080,1620,true]]){
 const dir=path.join(root,name);fs.mkdirSync(dir,{recursive:true});
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,recordVideo:{dir,size:{width,height}}});
 const page=await ctx.newPage(),start=Date.now(),video=page.video();
 const r={name,width,height,marks:[],errors:[],failedActions:[],complete:false};report.captures.push(r);
 page.on('pageerror',e=>r.errors.push(e.message));
 await page.route('**/*',route=>{let u=new URL(route.request().url());return u.origin!==base||/telemetry/.test(u.pathname)?route.abort():route.continue()});
 const tap=async sel=>{let l=page.locator(sel).first();await l.waitFor({state:'visible',timeout:10000});if(touch)await l.tap({timeout:10000});else await l.click({timeout:10000})};
 const point=async(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);
 const visible=async sel=>page.locator(sel).first().isVisible().catch(()=>false);
 const close=async()=>{if(await visible('#panel.open .panel-dismiss'))await tap('#panel.open .panel-dismiss')};
 const mark=async(name,hold=3300)=>{await wait(350);await page.screenshot({path:path.join(dir,name+'.png')});r.marks.push({name,at:(Date.now()-start)/1000,scene:await page.evaluate(()=>window.__game?.scene),mode:await page.evaluate(()=>window.WorldMap?.mode),cats:await page.evaluate(()=>window.State?.S?.cats?.length||0)});await wait(hold)};
 const attempt=async(name,fn)=>{try{await fn()}catch(e){r.failedActions.push({name,error:String(e).slice(0,400)});await close().catch(()=>{})}};
 try{
 await page.goto(base+'/cat-bond/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:40000});
 await tap('#intro-start');await tap('#panel.open .dex-cell');await page.waitForFunction(()=>window.State?.S?.cats?.length===1);
 await mark('garden',1600);
 const target=await page.evaluate(()=>{const s=window.__game?.yard?.hide?.spot,b=document.getElementById('scene').getBoundingClientRect();return s?{x:b.left+s.x,y:b.top+s.y}:null});
 if(!target)throw Error('No first wild encounter');await point(target.x,target.y);await page.locator('#cp-go').waitFor({state:'visible',timeout:15000});
 const auto=page.locator('#panel.open .capture-mode-option[data-battle-auto="true"]');if(await auto.count())await auto.click();await tap('#cp-go');await page.waitForFunction(()=>window.__game?.scene==='battle');
 if(await visible('#battle-tutorial-skip'))await tap('#battle-tutorial-skip');await wait(2400);await mark('active-battle',3200);
 await page.locator('#cr-next').waitFor({state:'visible',timeout:120000});if(await page.evaluate(()=>State.S.cats.length)<2)throw Error('First capture not earned');
 await mark('capture',2200);await tap('#cr-next');await mark('two-cat-garden',3200);
 await attempt('teaser',async()=>{await tap('#fab-play');const area=page.locator('#tease-area');await area.waitFor({state:'visible',timeout:8000});const b=await area.boundingBox();await point(b.x+b.width/2,b.y+b.height-48);await wait(400);await point(b.x+b.width/2,b.y+b.height*.58);await mark('teaser',3200);r.teaserScore=await page.locator('#tz-score').textContent();await tap('#tz-done')});
 await attempt('feed',async()=>{await tap('#fab-feed');if(await visible('#feedall')){const before=await page.evaluate(()=>State.S.fish);await tap('#feedall');const after=await page.evaluate(()=>State.S.fish);r.fed=after<before;await mark('feed-result',700)}});
 await attempt('duo',async()=>{await tap('[data-tab="cats"]');if(await visible('[data-cat-view="duo"]'))await tap('[data-cat-view="duo"]');await page.locator('#duo-choose').waitFor({state:'visible',timeout:10000});await tap('#duo-choose');const play=page.locator('#duo-play');if(await play.isEnabled().catch(()=>false)){await tap('#duo-play');r.duoPlay=true}await mark('duo',3200);await close()});
 await attempt('care',async()=>{await tap('[data-tab="cats"]');if(await visible('[data-cat-view="solo"]'))await tap('[data-cat-view="solo"]');await tap('#panel [data-breed]');if(await visible('#panel .breed-member'))await tap('#panel .breed-member');await tap('#cd-pet');await mark('cat-care',3200);await close()});
 await attempt('catdex',async()=>{await tap('[data-tab="dex"]');await mark('catdex',1700);await close()});
 await attempt('workshop',async()=>{await tap('[data-tab="work"]');await mark('workshop',1600);await close()});
 await attempt('explore',async()=>{await tap('#fab-map');await page.waitForFunction(()=>window.WorldMap?.mode==='map',{timeout:10000});await close();await wait(500);const p=await page.evaluate(()=>{let g=window.__game,b=document.getElementById('scene').getBoundingClientRect(),n=WorldMap.REGIONS.find(x=>x.id==='home').node;return {x:b.left+40+n.x*(g.W-80),y:b.top+70+n.y*(g.H-150)}});await point(p.x,p.y);await page.waitForFunction(()=>window.WorldMap?.mode==='region',{timeout:10000});await mark('real-exploration',3200);const c=await page.locator('#scene').boundingBox();await point(c.x+c.width*.64,c.y+c.height*.61);await mark('explore-motion',2500)});
 r.complete=true;
 await ctx.storageState({path:path.join(dir,'attained-save.json')});
 }catch(e){r.error=String(e);await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{})}
 finally{await ctx.close();const raw=await video.path();fs.renameSync(raw,path.join(dir,'continuous.webm'))}
 const marks=Object.fromEntries(r.marks.map(x=>[x.name,x.at]));
 if(r.complete&&r.errors.length===0){
 const chosen=['two-cat-garden','teaser','cat-care','duo','real-exploration','active-battle'].filter(k=>marks[k]!=null);
 r.montageScenes=chosen;
 if(chosen.length===6){let clips=[];for(const [i,key] of chosen.entries()){const p=path.join(dir,'clip-'+i+'.mp4');execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,marks[key]-.25)),'-i',path.join(dir,'continuous.webm'),'-t','3.2','-an','-vf','fps=25','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p',p],{stdio:'ignore'});clips.push(p)}const list=path.join(dir,'clips.txt');fs.writeFileSync(list,clips.map(p=>"file '"+p+"'").join('\n'));execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',path.join(dir,'refined-variety.mp4')],{stdio:'ignore'});for(const c of clips)fs.unlinkSync(c);fs.unlinkSync(list)}
 if(name==='landscape'){const start=Math.max(0,marks.garden-.5);execFileSync('ffmpeg',['-y','-ss',String(start),'-i',path.join(dir,'continuous.webm'),'-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',path.join(dir,'refined-continuous.mp4')],{stdio:'ignore'})}
 }
 fs.writeFileSync(path.join(root,'capture-report.json'),JSON.stringify(report,null,2)+'\n');
 }
}finally{await browser?.close();server.kill();fs.writeFileSync(path.join(root,'capture-report.json'),JSON.stringify(report,null,2)+'\n')}
