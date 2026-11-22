// Real native 16:9 Cat Bond cut: same encounter, native skills, one duo cast,
// its real follow-through and the earned rare capture. No synthetic gameplay.
// Run: node scripts/record-cat-bond-combo-landscape.mjs
import {chromium} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {promoTrack} from './promo-audio.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-catbond-wide-'));
const port=8798,base='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const outDir='public/promo/cat-bond';
const out=path.join(outDir,'combo-landscape-20261122.mp4');
const poster=path.join(outDir,'combo-landscape-20261122.jpg');
const report=path.join(outDir,'combo-landscape-20261122.json');
const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,context;
try{
 fs.mkdirSync(outDir,{recursive:true});
 for(let i=0;i<45;i++){
  try{if((await fetch(base+'/cat-bond/')).ok)break}catch{}
  if(i===44)throw Error('Local game server failed to start');
  await sleep(300);
 }
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  recordVideo:{dir:root,size:{width:1280,height:720}},locale:'en-US',
  reducedMotion:'no-preference'});
 const page=await context.newPage(),born=Date.now(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/session**',r=>r.abort('blockedbyclient'));
 await page.goto(base+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__game&&window.State?.S?.cats?.length>=3&&window.CatRelations&&window.GameData,
  null,{timeout:20000});
 await page.waitForFunction(()=>window.CatBondPremiumCinematics?.ready===true,null,{timeout:20000});
 const shots=[],stamp=()=>+(Date.now()-born)/1000;
 const mark=async(label,ms)=>{const start=stamp();await sleep(ms);shots.push({label,start,duration:stamp()-start-.08})};
 // Same authentic rare encounter as the vertical V10 trailer, but draw the
 // *whole landscape page* so neither gameplay nor native HUD gets cropped.
 const rare=await page.evaluate(()=>{
  const wild=GameData.SPECIES.find(sp=>sp.rarity==='R'&&!State.S.dex[sp.id])||
    GameData.SPECIES.find(sp=>sp.rarity==='R');
  if(!wild)throw Error('No authentic rare opponent');
  const cats=State.S.cats.slice(0,3);
  cats.forEach(cat=>State.addXp(cat,120));
  CatRelations.grow(cats[0],cats[1],75);
  CatRelations.choose(cats[0],cats[1]);
  State.S.battlePrefs={...(State.S.battlePrefs||{}),
   manualTutorialSeen:true,tutorialSeen:true,modeChosen:true,autoBattle:false};
  const before=State.S.dex[wild.id]||0;
  window.__game.startBattle(cats,wild);UI.closeAll();
  const b=window.__game.battle;b.autoMode=false;b.duoCharge=0;b.duoCd=999;
  return {id:wild.id,rarity:wild.rarity,before,active:!b.done,
    duo:!!b.duo,hud:document.querySelector('#battle-ui')?.classList.contains('on')};
 });
 if(rare.rarity!=='R'||!rare.active||!rare.duo||!rare.hud)throw Error('Rare fight not live '+JSON.stringify(rare));
 const sceneBounds=await page.evaluate(()=>{
  const c=document.getElementById('scene'),r=c?.getBoundingClientRect();
  const hud=document.getElementById('battle-ui');
  return {width:r?.width,height:r?.height,body:document.body.clientWidth,
    hud:hud?.classList.contains('on'),lang:document.documentElement.lang};
 });
 if(!sceneBounds.hud||sceneBounds.width<680||sceneBounds.height<370||
     sceneBounds.lang!=='en')throw Error('Landscape game is not readable '+JSON.stringify(sceneBounds));
 await mark('rare-encounter',2150);
 const controls=await page.evaluate(()=>{
  const b=window.__game.battle;
  const buttons=['mv-basic','mv-q','mv-e','mv-dodge'].map(id=>{
   const r=document.getElementById(id)?.getBoundingClientRect();
   return {id,visible:!!r&&r.width>8&&r.height>8&&r.right<=innerWidth+2&&r.bottom<=innerHeight+2};
  });
  return {allyHp:b.me()?.hp,enemyHp:b.liveEnemies()[0]?.hp,buttons};
 });
 if(!Number.isFinite(controls.allyHp)||!Number.isFinite(controls.enemyHp)||
    controls.buttons.filter(x=>x.visible).length<4)
   throw Error('Native landscape HUD is cut off '+JSON.stringify(controls));
 await mark('battle-hud',1400);
 const skills=await page.evaluate(()=>{
  const b=window.__game.battle,f=b.me(),target=b.liveEnemies()[0];
  if(!f||!target||b.done)throw Error('Rare fight ended early');
  f.cd.q=0;f.cd.e=0;
  const aim=Math.atan2(target.y-f.y,target.x-f.x);
  return {q:b.skillQ(f,aim),e:b.skillE(f,aim)};
 });
 if(!skills.q||!skills.e)throw Error('Real native skills failed '+JSON.stringify(skills));
 await mark('battle-skills',2550);
 const duo=await page.evaluate(()=>{
  const b=window.__game.battle;
  if(!b||b.done)throw Error('Enemy died before finisher');
  b.duoCharge=100;b.duoCd=0;
  return {ready:b.duoReady(),cast:b.castDuo(),uses:b.duoUses,
    cinematic:!!b.duoCinematic};
 });
 if(!duo.ready||!duo.cast||duo.uses!==1||!duo.cinematic)
  throw Error('One genuine duo finisher not visible '+JSON.stringify(duo));
 await mark('duo',3200);
 await mark('rare-aftermath',1300);
 const post=await page.evaluate(()=>{
  const b=window.__game.battle;
  if(b&&!b.done)b.autoMode=true;
  return {uses:b?.duoUses??1};
 });
 if(post.uses!==1)throw Error('Repeated finisher in same battle');
 await page.waitForFunction(({id,before})=>(State.S.dex[id]||0)>before,
  {id:rare.id,before:rare.before},{timeout:55000,polling:250});
 const caught=await page.evaluate(id=>({
  count:State.S.dex[id],name:GameData.speciesName(GameData.speciesById(id)),
  panel:!!document.querySelector('#panel.open')
 }),rare.id);
 if(!caught.panel||caught.count<=rare.before)throw Error('No native earned rare result '+JSON.stringify(caught));
 await mark('rare-capture',3300);
 if(errors.length)throw Error('Runtime page errors '+errors.join(' | '));
 const sourceVideo=page.video();
 await context.close();context=null;
 const source=await sourceVideo.path();
 // Preserve scene order and exact genuine browser-recorded game frames.
 const beats=[
  {scene:'rare-encounter',time:1.9,text:'A RARE CAT APPEARS!'},
  {scene:'battle-hud',time:1.3,text:'TWO CATS. ONE TEAM.'},
  {scene:'battle-skills',time:2.3,text:'USE YOUR SKILLS.'},
  {scene:'duo',time:3.1,text:'WAIT... CATS HAVE COMBO ATTACKS?!'},
  {scene:'rare-aftermath',time:1.15,text:''},
  {scene:'rare-capture',time:3.0,text:'A NEW FRIEND JOINS YOU!'},
  {scene:'rare-capture',time:1.5,text:'CAT BOND  |  PLAY FREE'}
 ];
 const filters=[];
 for(let i=0;i<beats.length;i++){
  const b=beats[i],s=shots.find(x=>x.label===b.scene);
  if(!s||b.time>s.duration+.15)throw Error('Bad authentic cut '+JSON.stringify(b));
  const start=s.start+(b.scene==='rare-capture'&&i===beats.length-1?.45:0);
  const length=b.time;
  const title=path.join(root,'caption-'+i+'.txt');
  fs.writeFileSync(title,b.text);
  let filt='[0:v]trim=start='+start.toFixed(3)+':duration='+length.toFixed(3)+
    ',setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,setsar=1';
  if(b.text)filt+=',drawtext=fontfile='+font+':textfile='+title+
    ':fontcolor=white:fontsize=60:box=1:boxcolor=black@0.42:boxborderw=18'+
    ':x=(w-text_w)/2:y=85:shadowcolor=black@0.85:shadowx=2:shadowy=3';
  filters.push(filt+',format=yuv420p[v'+i+']');
 }
 const duration=beats.reduce((a,b)=>a+b.time,0);
 const joined=beats.map((_,i)=>'[v'+i+']').join('')+
  'concat=n='+beats.length+':v=1:a=0[v]';
 execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
  '-i',source,'-stream_loop','-1','-i',promoTrack('cat-bond'),
  '-filter_complex',filters.join(';')+';'+joined,
  '-map','[v]','-map','1:a:0','-t',duration.toFixed(2),'-r','30',
  '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
  '-c:a','aac','-b:a','144k','-af','volume=0.25,afade=t=out:st='+
     (duration-.6).toFixed(2)+':d=.6',
  '-movflags','+faststart',out],{stdio:'inherit',timeout:240000});
 execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss','3','-i',out,
  '-frames:v','1','-q:v','3',poster],{stdio:'inherit',timeout:30000});
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error',
  '-show_entries','stream=codec_type,width,height:format=duration,size','-of','json',out],
  {encoding:'utf8'}));
 const video=probe.streams.find(s=>s.codec_type==='video');
 const audio=probe.streams.find(s=>s.codec_type==='audio');
 if(video?.width!==1920||video?.height!==1080||!audio||
    Number(probe.format.duration)<14||Number(probe.format.duration)>22||
    fs.statSync(out).size<200000||fs.statSync(poster).size<10000)
  throw Error('1920x1080 playable video QA failed '+JSON.stringify(probe));
 const metadata={kind:'native-landscape-real-gameplay',sourceShortId:'ELv02K9K294',
  youtubeTarget:'@morrowwishgames',aspect:'16:9',
  footage:'actual Cat Bond engine, same rare encounter / native HUD / skills / single combo / earned rare capture',
  artwork:'no AI-generated game footage',rare,controls,skills,duo,caught,
  width:video.width,height:video.height,duration:Number(probe.format.duration),
  bytes:fs.statSync(out).size,shots:beats,
  video:'/promo/cat-bond/combo-landscape-20261122.mp4',
  poster:'/promo/cat-bond/combo-landscape-20261122.jpg',
  published:false,createdAt:new Date().toISOString()};
 fs.writeFileSync(report,JSON.stringify(metadata,null,2)+'\n');
 console.log('CAT BOND LANDSCAPE READY '+JSON.stringify(metadata));
}finally{
 await context?.close().catch(()=>{});
 await browser?.close().catch(()=>{});
 server.kill('SIGTERM');fs.rmSync(root,{recursive:true,force:true});
}
