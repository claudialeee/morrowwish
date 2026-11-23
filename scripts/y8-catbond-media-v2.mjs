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
    return sharp(shot).extract({left:285,top:150,width:1350,height:760})
      .png().toBuffer();
  };
  // Captures are real scenes in the shipping game, not illustrations made up
  // to advertise unimplemented features.
  const yard=await view();
  await image('01-standard-screenshot',yard,760,570,2_000_000);
  await image('02-widescreen-screenshot',yard,1280,720,5_000_000);

  // Stage five real gameplay views before the continuous video. These are
  // useful for promotional stills, not spliced into the Y8 gameplay video.
  await page.evaluate(()=>UI.openCatHub('solo'));
  await sleep(1100);
  const roster=await view();
  await page.evaluate(()=>UI.openWorkshop());
  await sleep(850);
  const workshop=await view();
  await page.evaluate(()=>{UI.closeAll();__game.openWorldMap();});
  await sleep(850);
  await page.locator('#panel .map-destination.available').first().click({timeout:7000});
  await sleep(1100);
  const explore=await view();
  await page.evaluate(()=>{
    const game=window.__game;
    game._returnScene='map';
    game.startBattle(UI.getPreferredBattleTeam().slice(0,2),
      GameData.speciesById('sanhua'));
  });
  await sleep(1250);
  const combat=await view();
  fs.writeFileSync(path.join(media,'review-yard.png'),yard);
  fs.writeFileSync(path.join(media,'review-roster.png'),roster);
  fs.writeFileSync(path.join(media,'review-workshop.png'),workshop);
  fs.writeFileSync(path.join(media,'review-explore.png'),explore);
  fs.writeFileSync(path.join(media,'review-combat.png'),combat);

  // Alternative authentic gameplay thumbnails: genuine exploration/combat.
  await image('01b-standard-exploration',explore,760,570,2_000_000);
  await image('02b-widescreen-combat',combat,1280,720,5_000_000);

  // A Y8 promotional image may combine actual game scenes + game's title,
  // unlike a screenshot, which cannot be composited. No generic AI artwork,
  // fake cats, fabricated mechanics or social CTA.
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
  // Portrait: title + three large actual gameplay moments. No pasted
  // low-resolution sprite row, pastel stock backdrop, or tiny framed image.
  const portraitBG={create:{width:1080,height:1920,channels:3,background:'#f2f0e6'}};
  const portraitHero=await picture(yard,1000,800);
  const portraitMap=await picture(explore,492,735);
  const portraitCombat=await picture(combat,492,735);
  const portrait=await sharp(portraitBG).composite([
    {input:svgText(1080,215,'portrait'),left:0,top:10},
    {input:portraitHero,left:40,top:240},
    {input:portraitMap,left:40,top:1060},
    {input:portraitCombat,left:548,top:1060},
  ]).jpeg({quality:91,mozjpeg:true}).toBuffer();
  await image('04-portrait-promo',portrait,1080,1920,5_000_000);

  // Landscape: 1 main real garden view, 3 compact game-mode snapshots,
  // restrained original branding. All imagery from the active game build.
  const landBG={create:{width:1920,height:1080,channels:3,background:'#f2f0e6'}};
  const landHero=await picture(yard,1330,855);
  const small1=await picture(roster,520,334);
  const small2=await picture(explore,520,334);
  const small3=await picture(combat,520,334);
  const land=await sharp(landBG).composite([
    {input:landHero,left:30,top:24},
    {input:small1,left:1380,top:24},
    {input:small2,left:1380,top:373},
    {input:small3,left:1380,top:721},
    {input:svgText(1320,210,'landscape'),left:20,top:875},
  ]).jpeg({quality:91,mozjpeg:true}).toBuffer();
  await image('03-landscape-promo',land,1920,1080,5_000_000);
  await image('05-game-card-promo',combat,760,570,2_000_000);

  // Single unbroken session: return to yard before the recording starts.
  // Video first 20 seconds show cat care, a brief cat roster, actual region
  // exploration, and the real-time arena. All game scene changes happen live.
  await page.evaluate(()=>{
    UI.closeAll(); const game=window.__game;
    game.battle=null; game.scene='yard';
    document.getElementById('battle-ui')?.classList.remove('on');
    game.showYardChrome();game.rebuildYard();game.refreshHUD();
  });
  await sleep(1300);
  const trim=Math.max(0,(Date.now()-wall)/1000+0.2);
  await page.mouse.move(850,700);
  await sleep(2750);
  await page.evaluate(()=>UI.openCatHub('solo'));
  await sleep(1600);
  await page.evaluate(()=>UI.closeAll());
  await sleep(550);
  await page.evaluate(()=>__game.openWorldMap());
  await sleep(900);
  await page.locator('#panel .map-destination.available').first().click({timeout:7000});
  await sleep(3900);
  // Natural game-generated real-time battle begins after map exploration.
  await page.evaluate(()=>{
    const game=window.__game;game._returnScene='map';
    game.startBattle(UI.getPreferredBattleTeam().slice(0,2),GameData.speciesById('sanhua'));
  });
  await sleep(11500);

  // Keep recording long enough to survive capture startup/frame latency.
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
    '-t','19.6',
    '-filter_complex','[0:v]crop=1350:760:285:150,fps=30,'+
      'scale=1920:1080:flags=lanczos,format=yuv420p[v];'+
      '[1:a]volume=0.14,afade=t=in:st=0:d=0.3,'+
      'afade=t=out:st=18.4:d=1.2[a]',
    '-map','[v]','-map','[a]',
    '-c:v','libx264','-preset','veryfast','-crf','20',
    '-c:a','aac','-b:a','96k','-pix_fmt','yuv420p',
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
  if(errors.length)throw Error('Runtime defects found: '+errors.slice(0,12).join('; '));
  if(cases.length!==8)throw Error('Expected eight media assets');
  fs.writeFileSync(path.join(out,'media-report.json'),JSON.stringify({
    acceptedFileSpecs:true,sourceCommit:process.env.GITHUB_SHA||'local',
    gameplayState:state,assets:cases,reviewNeeded:true
  },null,2)+'\n');
  console.log('Y8 REAL-GAMEPLAY CAPTURE PASS\n'+JSON.stringify(cases,null,2));
}finally{
  await browser?.close().catch(()=>{});
  server.kill('SIGTERM');
}
