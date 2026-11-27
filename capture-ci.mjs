import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {chromium} from 'playwright';
const out=path.resolve('output'),raw=path.join(out,'raw'),media=path.join(out,'media');
fs.mkdirSync(raw,{recursive:true});fs.mkdirSync(media,{recursive:true});
const server=spawn('python3',['-m','http.server','18963','--bind','127.0.0.1','--directory','source/public'],{stdio:'ignore'});
const base='http://127.0.0.1:18963',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const report={source:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',captures:[],visualApproval:false,portalSaved:false};
let browser;
try{
 for(let i=0;i<40;i++){try{if((await fetch(base+'/cat-bond/')).ok)break}catch{}await sleep(250)}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,width,height,touch] of [['landscape',1920,1080,false],['portrait',1080,1620,true],['vertical',1080,1920,true]]){
 const dir=path.join(raw,name);fs.mkdirSync(dir,{recursive:true});
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,recordVideo:{dir,size:{width,height}}});
 const page=await ctx.newPage(),errors=[],marks=[],start=Date.now();const video=page.video();
 const record={name,width,height,marks,errors,completed:false};report.captures.push(record);
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{let u=new URL(r.request().url());return u.origin!==base||/telemetry/.test(u.pathname)?r.abort():r.continue()});
 const tap=async selector=>{let l=page.locator(selector).first();await l.waitFor({state:'visible',timeout:15000});if(touch)await l.tap();else await l.click()};
 const shot=async name=>{await page.waitForTimeout(750);await page.screenshot({path:path.join(dir,name+'.png')});marks.push({name,at:(Date.now()-start)/1000,scene:await page.evaluate(()=>window.__game?.scene||null),cats:await page.evaluate(()=>window.State?.S?.cats?.length||0)});await page.waitForTimeout(1200)};
 const closePanel=async()=>{let l=page.locator('#panel.open .panel-dismiss').first();if(await l.isVisible())await l.click()};
 try{
 await page.goto(base+'/cat-bond/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:40000});
 await tap('#intro-start');await tap('#panel.open .dex-cell');await page.waitForFunction(()=>window.State?.S?.cats?.length===1);
 await shot('garden');
 const target=await page.evaluate(()=>{const s=window.__game?.yard?.hide?.spot,r=document.getElementById('scene').getBoundingClientRect();return s?{x:r.left+s.x,y:r.top+s.y}:null});
 if(!target)throw Error('No initial wild encounter');if(touch)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
 await page.locator('#cp-go').waitFor({state:'visible',timeout:15000});
 let auto=page.locator('#panel.open .capture-mode-option[data-battle-auto="true"]');if(await auto.count())await auto.click();
 await tap('#cp-go');await page.waitForFunction(()=>window.__game?.scene==='battle');
 let skip=page.locator('#battle-tutorial-skip');if(await skip.isVisible())await skip.click();
 await shot('battle');
 await page.locator('#cr-next').waitFor({state:'visible',timeout:120000});
 await shot('capture-result');if(await page.evaluate(()=>State.S.cats.length)<2)throw Error('First capture not attained');
 await tap('#cr-next');await shot('two-cat-garden');
 await tap('[data-tab="dex"]');await shot('catdex');await closePanel();
 await tap('[data-tab="work"]');await shot('workshop');await closePanel();
 await tap('[data-tab="cats"]');await shot('companions');await closePanel();
 await tap('#fab-map');await page.waitForFunction(()=>window.__game?.scene==='map');await closePanel();await shot('exploration');
 record.completed=true;
 }catch(e){record.error=String(e);await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{})}
 finally{await ctx.close();let file=await video.path();fs.renameSync(file,path.join(dir,'continuous.webm'));record.raw=path.relative(out,path.join(dir,'continuous.webm'))}
 if(record.completed&&!errors.length){
 let mark=Object.fromEntries(marks.map(x=>[x.name,x.at]));
 // Actual uninterrupted recording; trim only opening before yard.
 execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,mark.garden-1)),'-i',path.join(dir,'continuous.webm'),'-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',path.join(media,name+'-continuous.mp4')],{stdio:'ignore'});
 // Candidate silent variety preview from real shots only; no speed changes.
 let clips=[];for(const [i,key] of ['garden','two-cat-garden','catdex','workshop','exploration','battle'].entries()){
 let clip=path.join(dir,'clip-'+i+'.mp4');execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,mark[key]-.5)),'-i',path.join(dir,'continuous.webm'),'-t','3','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p',clip],{stdio:'ignore'});clips.push(clip)}
 let list=path.join(dir,'clips.txt');fs.writeFileSync(list,clips.map(c=>"file '"+c+"'").join('\n'));
 execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',path.join(media,name+'-variety.mp4')],{stdio:'ignore'});
 for(const m of marks){let f=path.join(dir,m.name+'.png');fs.copyFileSync(f,path.join(media,name+'-'+m.name+'.png'))}
 for(const c of clips)fs.unlinkSync(c);fs.unlinkSync(list);
 }
 fs.writeFileSync(path.join(out,'real-capture-report.json'),JSON.stringify(report,null,2)+'\n');
 }
}finally{await browser?.close();server.kill();fs.writeFileSync(path.join(out,'real-capture-report.json'),JSON.stringify(report,null,2)+'\n')}
if(report.captures.some(x=>!x.completed||x.errors.length))process.exitCode=1;
