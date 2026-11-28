// Real keyboard/touch input, portable player build, no test API or fake state.
import fs from 'node:fs';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='release-kit/pawsibly',media=out+'/media';fs.mkdirSync(media,{recursive:true});
const routes=JSON.parse(fs.readFileSync('scripts/check-pawsibly.mjs','utf8').match(/const solvableRoutes=(\[[^\n]+\]);/)[1]);
const first='RRULDDDDRRRRRUDRR',key={R:'ArrowRight',L:'ArrowLeft',U:'ArrowUp',D:'ArrowDown'};
const browser=await chromium.launch({headless:true});const proof=[];
const url='http://127.0.0.1:8766/standalone/index.html';
async function read(p){return p.evaluate(()=>({room:document.querySelector('#roomNum').textContent,fish:document.querySelector('#fishCount').textContent,visibleResult:!document.querySelector('#overlay').hidden,result:document.querySelector('#resultTitle').textContent,achievement:!document.querySelector('#achievementToast').hidden}));}
async function open(w,h,room=1,video=false){
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,locale:'en-US',...(video?{recordVideo:{dir:out+'/raw',size:{width:w,height:h}}}:{}),...(w<h?{hasTouch:true,isMobile:true}: {})});
 const page=await ctx.newPage();const start=Date.now();const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8766/')&&!r.url().startsWith('data:'))external.push(r.url())});
 await page.goto(url+'?lang=en&room='+room,{waitUntil:'load'});
 await page.locator('#board').waitFor({state:'visible'});
 await page.waitForTimeout(150);return {ctx,page,errors,external,offset:(Date.now()-start)/1000};
}
async function act(p,l,wait=100){await p.keyboard.press(key[l]);await p.waitForTimeout(wait)}
async function geometry(p,w,h){
 const g=await p.evaluate(()=>{const box=id=>{let a=document.getElementById(id).getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height}};return {board:box('board'),controls:box('stageControls'),guide:box('guideHelp'),bonus:box('bonusQuick'),menu:box('menuButton'),testHook:!!window.__PAWSIBLY_TEST__};});
 for(const [name,a] of Object.entries(g)){if(name==='testHook')continue;assert.ok(a.w>0&&a.h>0&&a.x>=-1&&a.y>=-1&&a.x+a.w<=w+1&&a.y+a.h<=h+1,JSON.stringify({name,g,w,h}));}
 assert.equal(g.testHook,false);assert.ok(g.board.w/g.board.h>1.4&&g.board.w/g.board.h<1.46,JSON.stringify(g));
 const overlap=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1;
 assert.ok(!overlap(g.controls,g.guide)&&!overlap(g.board,g.bonus)&&!overlap(g.board,g.controls),JSON.stringify(g));
 return g;
}
async function screenshot(w,h,room,tag){
 const {ctx,page,errors,external}=await open(w,h,room);try{
  const route=room===1?first:routes[room-1];let state;
  for(const l of route){await act(page,l);state=await read(page);if(parseInt(state.fish)>=2&&!state.visibleResult)break;if(state.visibleResult)throw Error('Result before requested gameplay screenshot');}
  assert.ok(parseInt(state.fish)>=1&&!state.visibleResult,JSON.stringify(state));
  await page.waitForFunction(()=>document.querySelector('#achievementToast').hidden,{},{timeout:6000});
  await page.waitForTimeout(200);
  const g=await geometry(page,w,h);state=await read(page);assert.equal(state.achievement,false);
  await page.screenshot({path:media+'/'+tag+'-room-'+room+'.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);proof.push({kind:'screenshot',tag,room,state,g});
 }finally{await ctx.close()}
}
async function clip(w,h,name){
 const {ctx,page,errors,external,offset}=await open(w,h,1,true);const video=page.video();const begin=Date.now();
 try{
  await geometry(page,w,h);
  for(const letter of first){await act(page,letter,770);if((await read(page)).visibleResult)break;}
  const s=await read(page);assert.ok(s.visibleResult&&/getaway|escape/i.test(s.result)&&parseInt(s.fish)>=3,JSON.stringify(s));
  await page.waitForTimeout(Math.max(2000,18400-(Date.now()-begin)));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  proof.push({kind:'video',name,state:s});await page.screenshot({path:media+'/'+name+'-end.png'});
 }finally{await ctx.close()}
 const raw=await video.path();
 execFileSync('ffmpeg',['-y','-loglevel','error','-ss',String(offset),'-i',raw,'-t','18','-an','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',media+'/'+name+'.mp4']);
}
async function qa(w,h){
 const {ctx,page,errors,external}=await open(w,h);try{
  let g=await geometry(page,w,h);
  await page.locator('#portalLang').click();await geometry(page,w,h);await page.locator('#portalLang').click();g=await geometry(page,w,h);
  if(w<h){await page.touchscreen.tap(g.board.x+g.board.w*.25,g.board.y+g.board.h*.5);}
  else await page.locator('#board').click({position:{x:g.board.w*.25,y:g.board.h*.5}});
  await page.waitForTimeout(250);
  assert.match((await read(page)).fish,/1\s*\/\s*3/);
  const steps=await page.locator('#moves').textContent();
  await page.evaluate(()=>window.MorrowwishPortalPause(true));await act(page,'R',200);
  assert.equal(await page.locator('#moves').textContent(),steps);
  await page.evaluate(()=>window.MorrowwishPortalPause(false));await page.waitForFunction(()=>document.querySelector('#achievementToast').hidden,{},{timeout:6000});
  await page.screenshot({path:media+'/qa-'+w+'x'+h+'.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);proof.push({kind:'qa',w,h,g});
 }finally{await ctx.close()}
}
try{
 // All jobs use actual final standalone files. Capture only the failed visual/media gate.
 for(const [w,h] of [[907,510],[800,450],[640,480],[390,844],[844,390],[1280,720],[760,570],[320,568],[720,1080]]){console.log('Geometry QA',w,h);await qa(w,h);}
 for(const [w,h,tag] of [[1280,720,'wide'],[760,570,'standard']])for(const room of [1,2,3,5,8]){console.log('Capture',tag,room);await screenshot(w,h,room,tag);}
 for(const args of [[1280,720,'y8-continuous'],[1920,1080,'cg-landscape-preview'],[720,1080,'cg-portrait-preview']]){console.log('Record',args);await clip(...args);}
 fs.writeFileSync(out+'/visual-proof.json',JSON.stringify({source:process.env.SOURCE_SHA,proof,realInputs:true},null,2));
}finally{await browser.close()}
