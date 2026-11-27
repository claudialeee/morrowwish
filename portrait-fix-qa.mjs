import fs from 'node:fs';import path from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {chromium} from 'playwright';
const out='portrait-fix-qa';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(out+'/extracted',{recursive:true});execFileSync('unzip',['-q','-o','output/cat-bond-gamepix-candidate.zip','-d',out+'/extracted']);
const server=spawn('python3',['-m','http.server','18963','--bind','127.0.0.1','--directory',out+'/extracted'],{stdio:'ignore'});
const base='http://127.0.0.1:18963',wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={baseSource:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',fix:'c0c9eef798870ac84ffd2442dc68ca085cf407cd',tests:[],pass:false};
const save=JSON.parse(fs.readFileSync('output/refined/portrait/attained-save.json','utf8'));
let browser;
try{
 for(let i=0;i<40;i++){try{if((await fetch(base)).ok)break}catch{}await wait(200)}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,width,height,touch] of [['phone',390,844,true],['gamepix-portrait',720,1280,true],['tall',1080,1620,true],['vertical',1080,1920,true],['desktop',1920,1080,false],['y8-standard',760,570,false]]){
  const r={name,width,height,errors:[],failures:[],pass:false};report.tests.push(r);
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,storageState:save});
  const page=await ctx.newPage();
  page.on('pageerror',e=>r.errors.push(e.message));page.on('response',res=>{if(res.status()>=400&&!res.url().endsWith('favicon.ico'))r.failures.push(res.status()+' '+res.url())});
  await page.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){r.failures.push('Unexpected external request '+new URL(route.request().url()).pathname);return route.abort()}return route.continue()});
  const tap=async sel=>{let l=page.locator(sel).first();await l.waitFor({state:'visible',timeout:15000});if(touch)await l.tap();else await l.click()};
  const point=async(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);
  const shot=async name2=>{await wait(300);await page.screenshot({path:out+'/'+name+'-'+name2+'.png'})};
  const geometry=()=>page.evaluate(()=>{let r=document.getElementById('stage').getBoundingClientRect(),c=document.getElementById('scene'),g=c.getBoundingClientRect();return {stage:{x:r.x,y:r.y,w:r.width,h:r.height},canvas:{x:g.x,y:g.y,w:g.width,h:g.height},viewport:{w:innerWidth,h:innerHeight}}});
  const coverage=()=>page.evaluate(()=>{let c=document.getElementById('scene'),ctx=c.getContext('2d'),w=c.width,h=c.height,d=ctx.getImageData(0,0,w,h).data,miss=0,all=0;for(let y of [0,1,Math.round(h*.05),Math.round(h*.5),Math.round(h*.9),h-2,h-1])for(let x=0;x<w;x+=Math.max(1,Math.floor(w/80))){all++;if(d[(y*w+x)*4+3]<245)miss++}for(let x of [0,1,w-2,w-1])for(let y=0;y<h;y+=Math.max(1,Math.floor(h/80))){all++;if(d[(y*w+x)*4+3]<245)miss++}return {sampleCount:all,transparentSamples:miss,width:w,height:h}});
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  try{
   await page.goto(base+'/?lang=en',{waitUntil:'domcontentloaded',timeout:35000});await tap('#intro-start');
   await page.waitForFunction(()=>window.State?.S?.cats?.length>=2);
   // A returning-player report may be present after loading an earned save.
   await wait(850);let close=page.locator('#panel.open .panel-dismiss').first();if(await close.isVisible())await close.click();
   r.geometry=await geometry();const b=r.geometry.stage;assert(Math.abs(b.w-width)<=1&&Math.abs(b.h-height)<=1&&Math.abs(b.x)<=1&&Math.abs(b.y)<=1,'Stage not full viewport');
   assert(Math.abs(r.geometry.canvas.w-width)<=1&&Math.abs(r.geometry.canvas.h-height)<=1,'Canvas not full viewport');
   await shot('garden');
   await tap('[data-tab="cats"]');await shot('companions');if(await close.isVisible())await close.click();
   await tap('#fab-map');await page.waitForFunction(()=>WorldMap.mode==='map');if(await close.isVisible())await close.click();await wait(400);
   let p=await page.evaluate(()=>{let g=window.__game,b=document.getElementById('scene').getBoundingClientRect(),n=WorldMap.REGIONS.find(x=>x.id==='home').node;return {x:b.left+40+n.x*(g.W-80),y:b.top+70+n.y*(g.H-150)}});
   await point(p.x,p.y);await page.waitForFunction(()=>WorldMap.mode==='region');await wait(600);
   r.initial=await coverage();assert(r.initial.transparentSamples===0,'Unpainted exploration pixels');
   r.view=await page.evaluate(()=>WorldMap.view);
   assert(Math.abs(r.view.scale-Math.max(1,width/1800,height/1300))<.01,'Unexpected world scale');
   await shot('exploration');
   const canvas=await page.locator('#scene').boundingBox();
   const x=canvas.x+canvas.width*.78,y=canvas.y+canvas.height*.55,x2=canvas.x+canvas.width*.50;
   const before=await page.evaluate(()=>WorldMap.view);
   if(touch){
    const cdp=await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(x2-x)*i/6,y}]});await wait(40)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x2,y,{steps:8});await page.mouse.up()}
   const after=await page.evaluate(()=>WorldMap.view);r.drag={before:before.camX,after:after.camX,expected:Math.min(Math.max(0,1800-before.width),before.camX+(x-x2)/before.scale),panMode:after.panMode};
   assert(after.panMode&&Math.abs(r.drag.after-r.drag.expected)<15,'Camera drag transform mismatch');
   r.afterDrag=await coverage();assert(r.afterDrag.transparentSamples===0,'Unpainted pixels after pan');
   // Choose an on-screen target using the exact inverse transform; real click/tap, no game-state injection.
   let v=await page.evaluate(()=>WorldMap.view),sx=canvas.width*.65,sy=canvas.height*.62;
   await point(canvas.x+sx,canvas.y+sy);
   let target=await page.evaluate(()=>WorldMap.view);
   let expected={x:Math.max(60,Math.min(1740,v.camX+sx/v.scale)),y:Math.max(60,Math.min(1240,v.camY+sy/v.scale))};
   r.tap={expected,actual:target.targetWorld,panMode:target.panMode};
   assert(target.targetWorld&&Math.abs(target.targetWorld.x-expected.x)<4&&Math.abs(target.targetWorld.y-expected.y)<4&&!target.panMode,'Tap coordinate transform mismatch');
   await wait(450);r.afterTap=await coverage();assert(r.afterTap.transparentSamples===0,'Unpainted pixels after tap');
   await shot('exploration-moved');
   // Resize inside the same live scene; camera must clamp before repaint.
   if(name==='tall'){await page.setViewportSize({width:1620,height:1080});await wait(500);r.rotated=await coverage();assert(r.rotated.transparentSamples===0,'Blank after rotation');await page.setViewportSize({width,height});await wait(500);r.rotatedBack=await coverage();assert(r.rotatedBack.transparentSamples===0,'Blank after rotating back')}
   r.pass=!r.errors.length&&!r.failures.length;
  }catch(e){r.error=String(e);await shot('failure').catch(()=>{})}finally{await ctx.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
 }
 report.pass=report.tests.length===6&&report.tests.every(t=>t.pass);
}finally{await browser?.close();server.kill();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
if(!report.pass)process.exitCode=1;
