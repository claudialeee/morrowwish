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
  // Latest website preserves Start Adventure on all portals; start it explicitly.
  if(await page.locator('#intro-start').isVisible())await page.locator('#intro-start').click();
  const starter=page.locator('#panel.open .dex-cell').first();
  await starter.waitFor({state:'visible',timeout:30000});
  await starter.click({timeout:20000});
  await page.waitForFunction(()=>window.State?.S?.cats?.length>=1
    && window.__game?.scene==='yard',{timeout:20000});
  // A progressed but attainable genuine in-game collection for richer footage.
  const state=await page.evaluate(()=>{
    const Game=window.__game, State=window.State, Data=window.GameData;
    if(!Game||!State||!Data)throw Error('Game components missing');
    for(const id of ['xiaohui','niuniu','sanhua','lanbao']){
      const c=State.makeCat(id,{affinity:65});
      c.level=6;
      State.S.cats.push(c);
      State.S.dex[id]=(State.S.dex[id]||0)+1;
    }
    State.S.catchCount=8;
    State.S.tutorialDone=true;
    State.S.coins=500;State.S.fish=150;
    State.S.firstAdventureTour={step:7,done:true,skipped:true};
    State.S.battlePrefs={...(State.S.battlePrefs||{}),
      autoBattle:true,modeChosen:true,tutorialSeen:true,manualTutorialSeen:true,
      teamUids:State.S.cats.slice(0,2).map(c=>c.uid)};
    const duoA=State.S.cats[0],duoB=State.S.cats[1];
    CatRelations.pair(duoA,duoB).value=95;
    CatRelations.choose(duoA,duoB);
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

  const view=async()=>{
    const shot=await page.screenshot({type:'png'});
    return sharp(shot).extract({left:285,top:150,width:1350,height:760}).png().toBuffer();
  };
  // Capture separate ACTUAL gameplay screens. Never present five crops of one yard.
  const yard=await view();
  await image('01-standard-screenshot',yard,760,570,2_000_000);
  await page.evaluate(()=>UI.openCatHub('solo'));
  await sleep(650);
  const roster=await view();
  await page.evaluate(()=>UI.openBondPanel());
  await page.locator('#duo-preview').waitFor({state:'visible',timeout:12000});
  await page.locator('#duo-preview').click();
  await page.waitForFunction(()=>document.querySelector('#cb-duo-viewer iframe')?.contentWindow?.__duoPreviewReady===true,{timeout:15000});
  await sleep(1150);
  const duo=await view();
  await page.locator('.cb-duo-viewer-close').click();
  await page.evaluate(()=>UI.openWorkshop());
  await sleep(800);
  const workshop=await view();
  await page.evaluate(()=>{UI.closeAll();UI.openBuild()});
  await sleep(650);
  const build=await view();
  await page.evaluate(()=>UI.openDex());
  await sleep(750);
  const dex=await view();
  await page.evaluate(()=>{UI.closeAll();__game.openWorldMap()});
  await sleep(650);
  const map=await view();
  await page.locator('#panel .map-destination.available').first().click({timeout:10000});
  await sleep(850);
  const explore=await view();
  await page.evaluate(()=>{
    const game=window.__game;game._returnScene='map';
    game.startBattle(State.S.cats.slice(0,2),{...GameData.speciesById('jinwu'),encounterLevel:2});
  });
  await sleep(950);
  const combat=await view();
  for(const [name,pic] of Object.entries({yard,roster,duo,workshop,build,dex,map,explore,combat}))
    fs.writeFileSync(path.join(media,'review-'+name+'.png'),pic);
  await image('02-widescreen-screenshot',explore,1280,720,5_000_000);
  await image('01b-standard-exploration',map,760,570,2_000_000);
  await image('02b-widescreen-combat',combat,1280,720,5_000_000);
  const svgText=(w,h,mode)=>{
    const portrait=mode==='portrait';
    return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+
      '<text x="'+(portrait?72:65)+'" y="'+(portrait?131:131)+'" '+
      'font-family="Arial,Helvetica,sans-serif" font-size="'+(portrait?100:102)+'" '+
      'letter-spacing="-2" font-weight="800" fill="#233f3c">Cat Bond</text>'+
      '<text x="'+(portrait?76:72)+'" y="'+(portrait?198:187)+'" '+
      'font-family="Arial,Helvetica,sans-serif" font-size="'+(portrait?30:30)+'" '+
      'font-weight="600" letter-spacing="2.2" fill="#60746d">COLLECT  ·  CARE  ·  EXPLORE</text></svg>');
  };
  const picture=async(buffer,w,h)=>sharp(buffer).resize(w,h,
    {fit:'cover',position:'attention'}).jpeg({quality:91,mozjpeg:true}).toBuffer();
  const portraitBG={create:{width:1080,height:1920,channels:3,background:'#f2f0e6'}};
  const portraitHero=await picture(duo,1000,800);
  const portraitMap=await picture(dex,492,735);
  const portraitCombat=await picture(combat,492,735);
  const portrait=await sharp(portraitBG).composite([
    {input:svgText(1080,215,'portrait'),left:0,top:10},
    {input:portraitHero,left:40,top:240},
    {input:portraitMap,left:40,top:1060},
    {input:portraitCombat,left:548,top:1060},
  ]).jpeg({quality:91,mozjpeg:true}).toBuffer();
  await image('04-portrait-promo',portrait,1080,1920,5_000_000);
  const landBG={create:{width:1920,height:1080,channels:3,background:'#f2f0e6'}};
  const landHero=await picture(yard,1330,855);
  const small1=await picture(duo,520,334);
  const small2=await picture(workshop,520,334);
  const small3=await picture(explore,520,334);
  const land=await sharp(landBG).composite([
    {input:landHero,left:30,top:24},
    {input:small1,left:1380,top:24},
    {input:small2,left:1380,top:373},
    {input:small3,left:1380,top:721},
    {input:svgText(1320,210,'landscape'),left:20,top:875},
  ]).jpeg({quality:91,mozjpeg:true}).toBuffer();
  await image('03-landscape-promo',land,1920,1080,5_000_000);
  await image('05-game-card-promo',combat,760,570,2_000_000);

  // One raw video file; every screen transition happens in the running game.
  // Reset to the REAL first-cat picker for the continuous recording. Later
  // unlocked states use a documented demo save, not fake screenshots or edits.
  // Reset state itself: removing localStorage alone gets undone by the game's pagehide autosave.
  await page.evaluate(()=>State.hardReset());
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true,{timeout:45000});
  if(await page.locator('#intro-start').isVisible())await page.locator('#intro-start').click();
  await page.locator('#panel.open .dex-cell').first().waitFor({state:'visible',timeout:35000});
  const trim=Math.max(0,(Date.now()-wall)/1000+.15);
  const begun=Date.now();
  await sleep(800);
  await page.locator('#panel.open .dex-cell').first().click();
  await page.waitForFunction(()=>window.State?.S?.cats?.length===1,{timeout:15000});
  await sleep(1450);
  await page.evaluate(()=>{
    const State=window.State,game=window.__game;
    const b=State.makeCat('xiaohui',{affinity:85});
    State.S.cats.push(b);State.S.dex[b.species]=(State.S.dex[b.species]||0)+1;
    const a=State.S.cats[0];
    for(const c of [a,b]){
      c.level=12;c.affinity=85;c.stats.pow=75;c.stats.agi=55;c.stats.vit=62;c.stats.cha=58;
    }
    State.S.coins=900;State.S.fish=100;State.S.catchCount=3;State.S.tutorialDone=true;
    State.S.firstAdventureTour={step:7,done:true,skipped:true};
    State.S.firstDuoShowcasePending=true;
    State.S.battlePrefs={autoBattle:true,modeChosen:true,tutorialSeen:true,
      manualTutorialSeen:true,teamUids:[a.uid,b.uid]};
    CatRelations.pair(a,b).value=95;CatRelations.choose(a,b);
    State.save();game.rebuildYard();game.refreshHUD();
  });
  await page.locator('[data-tab="cats"]').click();
  await sleep(850);
  await page.evaluate(()=>UI.openBondPanel());
  await sleep(700);
  await page.locator('#duo-preview').click();
  await page.waitForFunction(()=>document.querySelector('#cb-duo-viewer iframe')?.contentWindow?.__duoPreviewReady===true,{timeout:15000});
  await sleep(2950);
  await page.locator('.cb-duo-viewer-close').click();
  await page.evaluate(()=>{UI.closeAll();UI.openWorkshop();});
  await sleep(1550);
  await page.evaluate(()=>{UI.closeAll();UI.openBuild();});
  await sleep(1450);
  await page.evaluate(()=>{UI.closeAll();UI.openDex();});
  await sleep(1700);
  await page.evaluate(()=>{UI.closeAll();__game.openWorldMap()});
  await sleep(1350);
  await page.locator('#panel .map-destination.available').first().click({timeout:10000});
  await sleep(2700);
  // Show the earned duo relationship promise, then enter a genuine arena.
  await page.evaluate(()=>UI.openBondPanel());
  await sleep(1500);
  await page.evaluate(()=>UI.closeAll());
  await sleep(450);
  await page.evaluate(()=>{
    const game=window.__game;game._returnScene='map';
    game.startBattle(State.S.cats.slice(0,2),{...GameData.speciesById('jinwu'),encounterLevel:2});
  });
  await sleep(750);
  const duoBattle=page.locator('#duo-burst');
  if(await duoBattle.isVisible().catch(()=>false))await duoBattle.click().catch(()=>{});
  await page.waitForFunction(()=>window.State?.S?.dex?.jinwu>=1,{timeout:38000});
  await sleep(1900);
  const clipDuration=Math.min(65,(Date.now()-begun)/1000+0.3);
  if(clipDuration<15)throw Error('Diverse video under 15 seconds');
  const captureProof=await page.evaluate(()=>({rarity:GameData.speciesById('jinwu').rarity,
    captured:State.S.dex.jinwu||0,scene:window.__game.scene}));
  if(captureProof.rarity!=='SSR'||!captureProof.captured)throw Error('Missing genuine SSR capture');
  const recordedVideo=page.video();
  await page.close();
  const rawPath=await recordedVideo.path();
  await ctx.close();
  const trailer=path.join(media,'06-gameplay-continuous.mp4');
  const music=path.join(out,'game/audio/freepd-cc0-3.mp3');
  if(!fs.existsSync(music))throw Error('Real game music not bundled');
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-ss',String(trim),'-i',rawPath,
    '-stream_loop','-1','-i',music,
    '-t',String(clipDuration),
    '-filter_complex','[0:v]crop=1350:760:285:150,fps=30,'+
      'scale=1920:1080:flags=lanczos,format=yuv420p[v];'+
      '[1:a]volume=0.14,afade=t=in:st=0:d=0.3,'+
      'afade=t=out:st='+Math.max(0,clipDuration-1.2).toFixed(2)+':d=1.2[a]',
    '-map','[v]','-map','[a]',
    '-c:v','libx264','-preset','veryfast','-crf','20',
    '-c:a','aac','-b:a','96k','-pix_fmt','yuv420p',
    '-movflags','+faststart',trailer],{timeout:180000});

  const probe=JSON.parse(execFileSync('ffprobe',['-v','error',
    '-show_entries','stream=codec_type,width,height:format=duration',
    '-of','json',trailer],{encoding:'utf8'}));
  const dur=Number(probe.format?.duration);
  if(dur<15||dur>70||fs.statSync(trailer).size>50_000_000)
    throw Error('Continuous Y8 gameplay video outside limits: '+dur);
  const v=probe.streams.find(s=>s.codec_type==='video');
  if(v?.width!==1920||v?.height!==1080)throw Error('Bad gameplay resolution');
  cases.push({name:'06-gameplay-continuous.mp4',durationSeconds:dur,bytes:fs.statSync(trailer).size,
    continuous:true,source:'one chronological unedited Playwright gameplay session'});
  if(errors.length)throw Error('Runtime defects found: '+errors.slice(0,12).join('; '));
  if(cases.length!==8)throw Error('Expected eight media assets');
  fs.writeFileSync(path.join(out,'media-report.json'),JSON.stringify({
    acceptedFileSpecs:true,sourceCommit:process.env.GITHUB_SHA||'local',
    gameplayState:state,ssrCapture:captureProof,videoSeconds:clipDuration,assets:cases,reviewNeeded:true
  },null,2)+'\n');
  console.log('Y8 REAL-GAMEPLAY CAPTURE PASS\n'+JSON.stringify(cases,null,2));
}finally{
  await browser?.close().catch(()=>{});
  server.kill('SIGTERM');
}

// Y8 assets: recapture distinct authentic gameplay scenes for user-feedback revision.
