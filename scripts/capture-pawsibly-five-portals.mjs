// Real browser input. No state injection, no synthetic wins, no production analytics.
import fs from 'node:fs';
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='release-kit/pawsibly', media=out+'/media';
fs.mkdirSync(media,{recursive:true});
const browser=await chromium.launch({headless:true});
const origin='http://127.0.0.1:8765', slug='/pawsibly-innocent/';
const routes=JSON.parse(fs.readFileSync('scripts/check-pawsibly.mjs','utf8').match(/const solvableRoutes=(\[[^\n]+\]);/)[1]);
const first='RRULDDDDRRRRRUDRR';
const key={R:'ArrowRight',L:'ArrowLeft',U:'ArrowUp',D:'ArrowDown'};
const proof=[];
async function open(w,h,room=1,video=false,portrait=false){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,...(video?{recordVideo:{dir:out+'/raw',size:{width:w,height:h}}}:{}),...(portrait?{hasTouch:true,isMobile:true}: {})});
 await context.route('**/api/**',r=>r.fulfill({status:204,body:''}));
 const page=await context.newPage();const start=Date.now();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+slug+'?room='+room,{waitUntil:'load'});
 await page.waitForFunction(()=>window.__PAWSIBLY_TEST__?.getState());
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 await page.waitForTimeout(250);
 const offset=(Date.now()-start)/1000;
 return {context,page,errors,offset};
}
async function step(page,letter){await page.keyboard.press(key[letter]);await page.waitForTimeout(240);}
async function state(page){return page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return {room:s.index+1,fish:s.got,steps:s.steps,done:s.done,win:s.winning,cat:s.cat,exposure:s.exposure};});}
async function shots(w,h,tag){
 for(let room=1;room<=5;room++){
  const {context,page,errors}=await open(w,h,room);
  const route=room===1?first:routes[room-1];
  let old=await state(page);assert.equal(old.room,room);
  for(const letter of route){await step(page,letter);const current=await state(page);if(current.fish>=1&&current.steps>=4&&!current.done){old=current;break;}old=current;}
  assert.ok(old.steps>0&&!old.done,'meaningful live gameplay required for room '+room);
  await page.screenshot({path:media+'/'+tag+'-room-'+room+'.png'});
  proof.push({tag,room,state:old,errors});assert.deepEqual(errors,[]);
  await context.close();
 }
}
async function clip(w,h,name,portrait=false){
 const {context,page,errors,offset}=await open(w,h,1,true,portrait);const video=page.video();
 const begin=Date.now();
 for(const letter of first){await page.keyboard.press(key[letter]);await page.waitForTimeout(830);if((await state(page)).done)break;}
 const final=await state(page);assert.ok(final.win,'real first-room escape is required: '+JSON.stringify(final));
 await page.waitForTimeout(Math.max(1500,18000-(Date.now()-begin)));
 await page.screenshot({path:media+'/'+name+'-win.png'});
 assert.deepEqual(errors,[]);await context.close();
 const raw=await video.path();
 execFileSync('ffmpeg',['-y','-ss',String(offset),'-i',raw,'-t','18','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',media+'/'+name+'.mp4'],{stdio:'inherit'});
 proof.push({name,final,errors});
}
async function cover(w,h,name){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 const art=fs.readFileSync('public/art/pawsibly-scene.svg','utf8');
 const data='data:image/svg+xml;base64,'+Buffer.from(art).toString('base64');
 const size=Math.round(Math.min(w*.095,h*.11));
 await page.setContent('<style>*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% 45%,#fff1db,#e6c9e7);width:100vw;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center}img{width:100%;height:100%;object-fit:cover;object-position:50% 48%}h1{position:absolute;top:4%;left:4%;right:4%;margin:0;text-align:center;font:900 '+size+'px/1.02 system-ui,sans-serif;color:#694058;text-shadow:0 2px #fff,0 0 12px #fff,0 0 24px #fff;letter-spacing:-.055em}</style><img src="'+data+'"><h1>Pawsibly Innocent!</h1>');
 await page.locator('img').evaluate(x=>x.decode());
 await page.screenshot({path:media+'/'+name+'.png'});await page.close();
}
try{
 for(const [w,h,name] of [[1920,1080,'cg-landscape'],[800,1200,'cg-portrait'],[800,800,'cg-square'],[1080,1920,'y8-promo-portrait'],[760,570,'y8-promo-card'],[1920,1080,'y8-promo-landscape'],[1260,1000,'itch-cover'],[512,384,'gd-cover'],[512,512,'gamepix-icon'],[200,120,'gd-small']])await cover(w,h,name);
 await shots(1280,720,'wide');await shots(760,570,'standard');
 await clip(1280,720,'y8-continuous');
 await clip(1920,1080,'cg-landscape-gameplay');
 await clip(720,1080,'cg-portrait-gameplay',true);
 // CRAZYGAMES: opening cover + contiguous genuine footage; no CTA, sound or speed-up.
 for(const [name,w,h] of [['landscape',1920,1080],['portrait',720,1080]]){
  execFileSync('ffmpeg',['-y','-loop','1','-i',media+'/cg-'+name+'.png','-i',media+'/cg-'+name+'-gameplay.mp4','-filter_complex','[0:v]scale='+w+':'+h+',setsar=1,fps=30,trim=duration=0.5,setpts=PTS-STARTPTS[a];[1:v]scale='+w+':'+h+',setsar=1,fps=30,trim=duration=17.5,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]','-map','[v]','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',media+'/cg-'+name+'-preview.mp4'],{stdio:'inherit'});
 }
 fs.writeFileSync(out+'/capture-proof.json',JSON.stringify({source:process.env.SOURCE_SHA,proof,manualVisualReview:'required',realInputs:true},null,2));
}finally{await browser.close();}
