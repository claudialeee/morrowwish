/**
 * Capture Y8 screenshots and a SINGLE continuous gameplay recording
 * directly from the isolated Cat Bond build (not a social trailer).
 *
 * Prerequisites: python3 scripts/y8-catbond-build.py
 * npm install --no-save playwright sharp
 * npx playwright install chromium
 * node scripts/y8-catbond-media.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn, execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import sharp from 'sharp';

const root=process.cwd();
const out=path.join(root,'.check/y8-cat-bond');
const media=path.join(out,'media');
const raw=path.join(out,'raw');
fs.mkdirSync(media,{recursive:true});
fs.mkdirSync(raw,{recursive:true});
const port=18963;
const base='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1',
  '--directory',path.join(out,'game')],{stdio:'ignore'});
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));
let browser;
const cases=[];
const errors=[];
async function ready(){
  for(let i=0;i<60;i++){
    try{if((await fetch(base+'/index.html')).ok)return}catch{}
    await sleep(500);
  }
  throw Error('Standalone Y8 test web server never started');
}
async function enterGame(page){
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
    if(r.status()===404&&!r.url().includes('favicon'))errors.push('HTTP 404 '+r.url());
  });
  await page.goto(base+'/?lang=en',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true,{timeout:45000});
  const starter=page.locator('#panel.open .dex-cell').first();
  await starter.waitFor({state:'visible',timeout:30000});
  await starter.click({timeout:20000});
  await page.waitForFunction(()=>window.State?.S?.cats?.length>=1
    && window.__game?.scene==='yard',{timeout:20000});
  // A progressed but attainable genuine in-game collection for richer footage.
  const state=await page.evaluate(()=>{
    const Game=window.__game, State=window.State, Data=window.GameData;
    if(!Game||!State||!Data)throw Error('Game components missing');
    for(const id of ['xiaohui','niuniu']){
      const c=State.makeCat(id,{affinity:44});
      State.S.cats.push(c);
      State.S.dex[id]=(State.S.dex[id]||0)+1;
    }
    State.save();
    Game.rebuildYard();
    Game.refreshHUD();
    return {cats:State.S.cats.length,scene:Game.scene,
      source:window.CatBondPremiumCinematics?.originalPaintingSource||null};
  });
  if(state.cats<3)throw Error('Three-cat garden not visible');
  await page.waitForTimeout(1800);
  return state;
}
async function image(name, rawImg, width,height,maxBytes, crop='centre'){
  const target=path.join(media,name+'.jpg');
  await sharp(rawImg).resize(width,height,{fit:'cover',position:crop==='centre'?'centre':'attention'})
    .jpeg({quality:86,mozjpeg:true}).toFile(target);
  const m=await sharp(target).metadata();
  if(m.width!==width||m.height!==height||fs.statSync(target).size>maxBytes)
    throw Error('Y8 media file rejected: '+target);
  cases.push({name:name+'.jpg',width,height,bytes:fs.statSync(target).size});
}
try{
  await ready();
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  // Native 16:9 live gameplay, used also for continuous video.
  const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,
    recordVideo:{dir:raw,size:{width:1920,height:1080}}});
  const page=await ctx.newPage();
  const wall=Date.now();
  const state=await enterGame(page);
  await page.addStyleTag({content:'*{cursor:none!important}'});
  const yard=await page.screenshot({type:'png'});
  // Crop to the real game stage, not the light-gray surrounding web viewport.
  // Never stretch, pad with borders, or synthesize gameplay elements.
  const wide=await sharp(yard).extract({left:285,top:150,width:1350,height:760}).png().toBuffer();
  const four=await sharp(yard).extract({left:385,top:90,width:1226,height:920}).png().toBuffer();
  await image('01-standard-screenshot',four,760,570,2_000_000);
  await image('02-widescreen-screenshot',wide,1280,720,5_000_000);
  await image('03-landscape-promo',wide,1920,1080,5_000_000);
  // Different live gameplay frame after the three cats start moving.
  await page.mouse.move(870,680);
  await sleep(1000);
  const play=await page.screenshot({type:'png'});
  const card=await sharp(play).extract({left:385,top:90,width:1226,height:920}).png().toBuffer();
  await image('05-game-card-promo',card,760,570,2_000_000);
  const trim=Math.max(0,(Date.now()-wall)/1000-0.12);
  // From this timestamp the footage is ONE unbroken real player session.
  // Interactions are native in-game buttons, not montage cuts.
  // Cursor and feeding actions keep the cats in motion. Avoid the teaser
  // minigame popup, which is not suitable for a continuous gameplay preview.
  await page.mouse.move(650,730);
  await sleep(3600);
  await page.mouse.move(1150,760);
  await sleep(3500);
  try{await page.locator('#fab-feed').click({force:true,timeout:2500})}catch{}
  await sleep(3500);
  await page.mouse.move(850,750);
  await sleep(3600);
  await page.mouse.move(1170,660);
  await sleep(8200);
  // Keep recording long enough to survive capture startup/frame latency.
  const recordedVideo=page.video();
  await page.close();
  const rawPath=await recordedVideo.path();
  await ctx.close();
  const trailer=path.join(media,'06-gameplay-continuous.mp4');
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-ss',String(trim),'-i',rawPath,'-t','19',
    '-vf','crop=1350:760:285:150,fps=30,scale=1920:1080:flags=lanczos,format=yuv420p',
    '-an','-c:v','libx264','-preset','veryfast','-crf','24',
    '-movflags','+faststart',trailer],{timeout:180000});
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error',
    '-show_entries','stream=codec_type,width,height:format=duration',
    '-of','json',trailer],{encoding:'utf8'}));
  const dur=Number(probe.format?.duration);
  if(dur<15||dur>21||fs.statSync(trailer).size>50_000_000)
    throw Error('Continuous Y8 gameplay video outside limits: '+dur);
  const v=probe.streams.find(s=>s.codec_type==='video');
  if(v?.width!==1920||v?.height!==1080)throw Error('Bad gameplay resolution');
  cases.push({name:'06-gameplay-continuous.mp4',durationSeconds:dur,bytes:fs.statSync(trailer).size,
    continuous:true,source:'one unedited Playwright gameplay recording'});
  // Actual 9:16 portrait gameplay, not a stretched landscape screenshot.
  const portraitCtx=await browser.newContext({viewport:{width:1080,height:1920},
    deviceScaleFactor:1});
  const portrait=await portraitCtx.newPage();
  await enterGame(portrait);
  const vertical=await portrait.screenshot({type:'png'});
  if(vertical.length<10000)throw Error('Mobile Cat Bond screenshot unexpectedly blank');
  await portraitCtx.close();
  // Y8 calls this a PROMOTIONAL IMAGE, not a screenshot. Compose a portrait
  // from the current game's genuine garden painting, three existing painted
  // cat sprites, and a faithful crop of the live game. No AI-made artwork.
  const garden=path.join(out,'game/assets/yard_bg.png');
  const cats=path.join(out,'game/assets/watercolor-cats-v2.webp');
  const bg=await sharp(garden).resize(1080,1920,{fit:'cover',position:'centre'})
    .modulate({brightness:.94,saturation:.82}).blur(1.2).png().toBuffer();
  const sprites=await sharp(cats).resize({width:960}).png().toBuffer();
  const screen=await sharp(wide).resize(960,540,{fit:'cover'}).png().toBuffer();
  const title=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="240">'+
    '<text x="540" y="128" text-anchor="middle" font-family="Georgia,serif" '+
    'font-size="124" font-weight="bold" fill="#fff9ec" stroke="#536a68" stroke-width="7" '+
    'paint-order="stroke">Cat Bond</text>'+
    '<text x="540" y="206" text-anchor="middle" font-family="Arial,sans-serif" '+
    'font-size="35" fill="#34534b" letter-spacing="4">COLLECT · CARE · EXPLORE</text></svg>');
  const framed=await sharp({create:{width:1000,height:580,channels:4,background:'#fffaf0'}})
    .composite([{input:screen,left:20,top:20}]).png().toBuffer();
  const poster=await sharp(bg).composite([
    {input:title,left:0,top:215},
    {input:sprites,left:60,top:650},
    {input:framed,left:40,top:1120},
  ]).jpeg({quality:90,mozjpeg:true}).toBuffer();
  await image('04-portrait-promo',poster,1080,1920,5_000_000);
  if(errors.length)throw Error('Runtime defects found: '+errors.slice(0,12).join('; '));
  if(cases.length!==6)throw Error('Expected six Y8 media assets');
  fs.writeFileSync(path.join(out,'media-report.json'),JSON.stringify({
    acceptedFileSpecs:true,sourceCommit:process.env.GITHUB_SHA||'local',
    gameplayState:state,assets:cases,reviewNeeded:true
  },null,2)+'\n');
  console.log('Y8 REAL-GAMEPLAY CAPTURE PASS\n'+JSON.stringify(cases,null,2));
}finally{
  await browser?.close().catch(()=>{});
  server.kill('SIGTERM');
}
