// Produce additional real-gameplay footage for cinematic review trailers.
// Recording does NOT publish to social platforms. It never fabricates an achievement.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=process.env.MW_V4_BROLL_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-v4-broll');
const host='http://127.0.0.1:8795';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(dir,'raw'),{recursive:true});
const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function realVerticalCamera(id){
 const source=document.getElementById(id);
 if(!source)throw Error('Cannot frame real gameplay scene '+id);
 const output=document.createElement('canvas');output.width=540;output.height=960;
 Object.assign(output.style,{position:'fixed',inset:'0',height:'100vh',width:'100vw',
 zIndex:'2147483647',pointerEvents:'none',background:'#241a37'});
 document.body.appendChild(output);
 const ctx=output.getContext('2d',{alpha:false});
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 let focus=0.5;
 window.__V4_CAMERA__={setFocus(v){focus=Math.max(.18,Math.min(.82,v))}};
 function paint(){
  const sw=source.width,sh=source.height;
  ctx.fillStyle='#241a37';ctx.fillRect(0,0,540,960);
  if(sw>10&&sh>10){
   // Trim 3% safe margins to remove any edge artifacts while retaining
   // exact 9:16 pixel aspect; never stretch a landscape game.
   const ch=sh*0.80,cw=ch*540/960,available=sw*.94;
   const w=Math.min(cw,available),h=w*960/540;
   const sx=Math.max(sw*.03,Math.min(sw*.97-w,sw*focus-w/2));
   const sy=Math.max(0,Math.min(sh-h,sh*.64-h/2));
   ctx.drawImage(source,sx,sy,w,h,0,0,540,960);
  }
  requestAnimationFrame(paint);
 }requestAnimationFrame(paint);
}
async function capture(browser,slug,fn){
 const context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
   recordVideo:{dir:path.join(dir,'raw'),size:{width:540,height:960}},locale:'en-US'});
 const page=await context.newPage(),born=Date.now(),errors=[];
 page.on('pageerror',e=>errors.push(e.message.slice(0,180)));
 await context.route('**/api/session**',r=>r.abort('blockedbyclient'));
 const stamp=()=>+(Date.now()-born)/1000;
 const shots=await fn({page,stamp});
 const video=page.video();await context.close();
 const src=await video.path(),dst=path.join(dir,slug+'.webm');
 fs.renameSync(src,dst);
 const data={slug,file:dst,shots,errors};
 console.log('REAL BROLL '+JSON.stringify({slug,shots,errors}));
 return data;
}
let browser;
try{
 await sleep(1300);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 // Use OFFICIAL current game art in the trailer, not invented game scenes.
 // No stretched landscape art: the cover is composed with CSS object-fit:cover.
 const coverPage=await browser.newPage({viewport:{width:540,height:960},deviceScaleFactor:1});
 const svg=fs.readFileSync('public/art/cat-bond-scene.svg').toString('base64');
 await coverPage.setContent('<!doctype html><html><body style="margin:0;overflow:hidden;background:linear-gradient(160deg,#25193e 0%,#503466 46%,#c78c77 100%);display:flex;align-items:center;justify-content:center;width:100vw;height:100vh"><img style="width:125vw;height:85vh;object-fit:cover;object-position:center;border-radius:32px;box-shadow:0 25px 45px #170c2477" src="data:image/svg+xml;base64,'+svg+'"></body></html>');
 await coverPage.waitForTimeout(550);
 fs.mkdirSync('public/promo/cat-bond',{recursive:true});
 await coverPage.screenshot({path:'public/promo/cat-bond/cover-portrait.png'});
 await coverPage.close();
 const result=[];
 result.push(await capture(browser,'cat-bond',async({page,stamp})=>{
  await page.goto(host+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game?.yard && !!window.State?.S?.cats?.length,{timeout:19000});
  await page.evaluate(realVerticalCamera,'scene');
  const yard=stamp();await sleep(6150);
  const fight=stamp();
  await page.evaluate(()=>{
    const cats=State.S.cats.slice(0,3),wild=GameData.SPECIES.find(s=>s.rarity==='SSR')||GameData.SPECIES.at(-1);
    State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true,autoBattle:true};
    window.__game.startBattle(cats,wild);
  });
  await sleep(6900);
  return [{label:'yard',start:yard,duration:4.0},{label:'yard-late',start:yard+3.05,duration:2.75},
    {label:'battle',start:fight+0.45,duration:3.0},{label:'battle-late',start:fight+3.45,duration:2.7}];
 }));
 result.push(await capture(browser,'pawsibly-innocent',async({page,stamp})=>{
  await page.goto(host+'/pawsibly-innocent/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),{timeout:12000});
  await page.evaluate(()=>{
   const source=document.getElementById('board'),out=document.createElement('canvas');
   out.width=540;out.height=960;Object.assign(out.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:'2147483647',pointerEvents:'none'});
   document.body.appendChild(out);const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=true;
   let x=0;function draw(){
    const st=window.__PAWSIBLY_TEST__?.getState();
    if(st&&source.width&&source.height){
     const vis=588*540/960,cat=st.cat||{x:2},human=st.human||{x:7};
     const center=window.__V4_FOCUS__==='human'?human.x:window.__V4_FOCUS__==='both'?(cat.x+human.x)/2:cat.x;
     const want=Math.max(0,Math.min(840-vis,(center+.5)*84-vis/2));
     x+=(want-x)*0.18;ctx.drawImage(source,x*source.width/840,0,vis*source.width/840,source.height,0,0,540,960);
    }
    requestAnimationFrame(draw);
   }window.__V4_FOCUS__='cat';draw();
  });
  const sneak=stamp();for(let i=0;i<4;i++){await page.evaluate(()=>window.__PAWSIBLY_TEST__.move(1,0));await sleep(550);}
  const decoy=stamp();
  await page.evaluate(()=>{
    const g=window.__PAWSIBLY_TEST__;g.choose(0,false);window.__V4_FOCUS__='human';g.throwYarn();
    if(!g.throwYarnTo({x:9,y:1}))throw Error('Actual yarn decoy rejected');
  });
  await sleep(2600);await page.evaluate(()=>window.__V4_FOCUS__='cat');
  const steal=stamp();
  for(const [dx,dy] of [[1,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0],[1,0],[1,0],[0,-1],[1,0]]){
    await page.evaluate(([x,y])=>window.__PAWSIBLY_TEST__.move(x,y),[dx,dy]);
    await sleep(430);
  }
  await sleep(650);
  return [{label:'sneak',start:sneak,duration:2.3},{label:'decoy',start:decoy,duration:2.4},
    {label:'steal',start:steal,duration:4.3}];
 }));
 result.push(await capture(browser,'tiny-town',async({page,stamp})=>{
  await page.goto(host+'/tiny-town/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#introStart').click();
  await page.addStyleTag({content:' .arcade-return,.app>.header,.stats,.app>.progress,.sidebar .citizen-panel,.sidebar .petition,.sidebar .sidebar-head{display:none!important}.app{max-width:100vw!important;width:100vw!important;padding:0!important}.stage{display:block!important}.map-panel{width:100%!important;padding:9px!important}.world{height:780px!important}.tile-icon{font-size:43px!important}.board{width:100%!important}.sidebar{width:100%!important}.wish-card{min-height:100px!important}.modal{width:96vw!important;max-width:96vw!important}.overlay{opacity:0!important;pointer-events:none!important}'});
  const build=stamp();let placed=0,storyAt=null;
  for(let i=0;i<6;i++){
   const done=await page.evaluate(()=>{
    const card=document.querySelector('#cards .wish-card');if(!card)return false;card.click();
    const plots=[...document.querySelectorAll('#board .tile.target')];if(!plots.length)return false;plots[0].click();return true;
   });if(!done)break;placed++;
   await sleep(950);
   for(let j=0;j<8;j++){
    const mode=await page.evaluate(()=>{
      if(document.querySelector('#storyModal.show #storyChoices .button'))return 'story';
      if(document.querySelector('.freedom-options:not([hidden]) [data-destination]'))return 'travel';
      if(document.querySelector('.freedom-adventure:not([hidden]) .freedom-finish'))return 'finish';
      return null;
    });
    if(!mode)break;
    if(!storyAt)storyAt=stamp();
    await sleep(mode==='story'?1300:450);
    await page.evaluate(m=>{
      (m==='story'?document.querySelector('#storyModal.show #storyChoices .button'):
       m==='travel'?document.querySelector('.freedom-options:not([hidden]) [data-destination]'):
       document.querySelector('.freedom-adventure:not([hidden]) .freedom-finish'))?.click();
    },mode);
   }
  }
  if(placed<4)throw Error('Town broll contains too few real constructed wishes '+placed);
  return [{label:'build',start:build,duration:Math.min(7.2,stamp()-build-1)},
    {label:'build-late',start:build+7.3,duration:Math.min(4.2,Math.max(1.5,stamp()-build-8))},
   ...(storyAt?[{label:'story',start:storyAt,duration:Math.min(2.2,Math.max(1.5,stamp()-storyAt-0.4))}]:[])];
 }));
 result.push(await capture(browser,'elsewhere',async({page,stamp})=>{
  await page.goto(host+'/elsewhere/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.addStyleTag({content:' .topbar,.footer,.game-top,.case-topline,.moment-pips,.scene-body,.choices-label,.impact{display:none!important}#game{padding:0!important;max-width:100vw!important;width:100vw!important}.scene-picture{height:960px!important;min-height:960px!important;width:100vw!important;overflow:hidden!important;border:0!important}.scene-picture svg{height:100%!important;width:100%!important;transform:scale(1.12);transform-origin:center}'});
  const shots=[];
  for(const world of ['maldives','moon','tokyo']){
   if(await page.locator('#game:not([hidden])').count())await page.evaluate(()=>document.querySelector('#game [data-home]')?.click());
   await page.locator('[data-world="'+world+'"]').first().click({timeout:8000});
   await sleep(400);
   const start=stamp();await sleep(4150);
   shots.push({label:world,start,duration:3.7});
   await page.evaluate(()=>{const b=document.querySelector('#game [data-choice]');if(!b)throw Error('Actual life choice not present');b.click();});
   const result=stamp();await sleep(2050);
   shots.push({label:world+'-result',start:result,duration:1.7});
  }
  return shots;
 }));
 const manifest={createdAt:new Date().toISOString(),kind:'actual-captured-extra-gameplay-not-posted',broll:result};
 fs.writeFileSync(path.join(dir,'broll-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
 if(browser)await browser.close();server.kill('SIGTERM');
}
