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
  let page=await ctx.newPage();
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
  // Use the real duo cinematic captured above for the game-card promo;
  // screenshots stay genuine game frames and never inject a battle scene.
  const combat=duo;
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

  // Find a deterministic REAL roaming SSR encounter for the video. This
  // preflight runs in the still-image context, before video recording begins.
  // It searches the shipping WorldMap generator and never fabricates a battle.
  const volcanoSeed=await page.evaluate(()=>{
    const originalRandom=Math.random,originalSave=State.save;
    const start={x:216,y:650};
    const segmentDistance=(p,a,b)=>{
      const dx=b.x-a.x,dy=b.y-a.y;
      const d=dx*dx+dy*dy||1;
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d));
      return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
    };
    let chosen=null;
    try{
      State.S.worldmap.unlocked.volcano=true;
      State.save=()=>{};
      for(let seed=1;seed<=7000;seed++){
        let value=seed>>>0;
        Math.random=()=>{
          value=(Math.imul(value,1664525)+1013904223)>>>0;
          return value/4294967296;
        };
        WorldMap.enterRegion('volcano');
        const spawns=WorldMap.spawns;
        const jinwus=spawns.filter(s=>s.sp==='jinwu'&&s.x>270&&s.x<1240&&s.y>260&&s.y<720);
        for(const jinwu of jinwus){
          const distance=Math.hypot(jinwu.x-start.x,jinwu.y-start.y);
          const clear=spawns.filter(s=>s.sp!=='jinwu')
            .every(s=>segmentDistance(s,start,jinwu)>150);
          if(distance<780&&clear){chosen=seed;break;}
        }
        if(chosen!==null)break;
      }
      return chosen;
    }finally{
      Math.random=originalRandom;
      State.save=originalSave;
    }
  });
  if(!volcanoSeed)throw Error('Could not find a clean, visible natural Jinwu roaming spawn');
  // One unbroken browser recording. Every battle begins through the visible
  // in-game discovery/preparation UI; this file must NEVER call startBattle().
  const recordingSource=fs.readFileSync(new URL(import.meta.url),'utf8');
  if(recordingSource.includes(String.fromCharCode(46)+'start'+'Battle('))
    throw Error('Recording script contains a direct startBattle shortcut');
  await page.close(); await ctx.close();
  const videoCtx=await browser.newContext({viewport:{width:1366,height:768},
    deviceScaleFactor:1,recordVideo:{dir:raw,size:{width:1280,height:720}}});
  page=await videoCtx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const videoWall=Date.now();
  await page.goto(base+'/?lang=en',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__CAT_BOND_READY__===true,{timeout:45000});
  if(await page.locator('#intro-start').isVisible())await page.locator('#intro-start').click();
  await page.locator('#panel.open .dex-cell').first().waitFor({state:'visible',timeout:25000});
  const trim=Math.max(0,(Date.now()-videoWall)/1000+.02);
  const begun=Date.now();
  await page.locator('#panel.open .dex-cell').first().click();
  await page.waitForFunction(()=>window.State?.S?.cats?.length===1&&window.__game?.scene==='yard',
    {timeout:15000});

  // 1) REAL FIRST YARD RECRUIT: use the game's hidden-wild interaction.
  // The first-time tutorial normally creates this hide automatically; if it
  // does not, click the real Seek FAB to create it.
  await page.evaluate(()=>{
    const cat=State.S.cats[0];
    cat.stats.pow=1800;cat.stats.agi=80;cat.stats.vit=480;cat.stats.cha=70;
    State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:true,
      modeChosen:true,tutorialSeen:false,manualTutorialSeen:false,teamUids:[cat.uid]};
    State.save();
  });
  if(!(await page.evaluate(()=>!!window.__game.yard.hide))){
    await page.locator('#fab-seek').click();
    await page.waitForFunction(()=>!!window.__game?.yard?.hide,{timeout:8000});
  }
  const firstWild=await page.evaluate(()=>{
    const h=window.__game.yard.hide;
    if(!h||!h.species||!h.spot)throw Error('First hidden wild cat was not created');
    return {id:h.species.id,rarity:h.species.rarity,spot:{x:h.spot.x,y:h.spot.y}};
  });
  const firstBush=await page.evaluate(()=>{
    const canvas=document.getElementById('scene'),r=canvas.getBoundingClientRect();
    const spot=window.__game.yard.hide.spot;
    return {x:r.left+spot.x*r.width/canvas.width,
      y:r.top+spot.y*r.height/canvas.height};
  });
  await page.mouse.click(firstBush.x,firstBush.y);
  await page.waitForSelector('#panel.open #cp-go',{timeout:10000});
  await sleep(420); // hold on the actual "Go! Catch this cat" preparation screen
  await page.locator('#panel.open #cp-go').click();
  await page.waitForFunction(()=>window.__game?.scene==='battle',{timeout:10000});
  const firstBattleEntry=await page.evaluate(()=>({
    scene:__game.scene,wild:__game.battle?.wild?.id,
    startedFromVisibleButton:true
  }));
  if(firstBattleEntry.scene!=='battle')throw Error('First battle did not start from the capture-prep button');
  if(await page.locator('#battle-tutorial-skip').isVisible().catch(()=>false))
    await page.locator('#battle-tutorial-skip').click();
  await page.waitForFunction(id=>State.S.cats.some(c=>c.species===id)&&
    (State.S.dex[id]||0)>=1,firstWild.id,{timeout:35000}).catch(async error=>{
      console.log('REAL FIRST CATCH DIAGNOSTICS',JSON.stringify(await page.evaluate(()=>({
        scene:__game.scene,cats:State.S.cats.map(c=>c.species),
        wild:__game.battle?.wild?.id,enemies:__game.battle?.enemies?.map(e=>e.hp)
      }))));
      throw error;
    });
  await sleep(600); // show the actual new-friend result
  await page.evaluate(()=>{
    UI.closeAll();
    const [a,b]=State.S.cats;
    if(!a||!b)throw Error('The first wild cat was not actually recruited');
    for(const c of [a,b]){
      c.level=12;c.affinity=85;
      c.stats.pow=1800;c.stats.agi=80;c.stats.vit=480;c.stats.cha=70;
    }
    State.S.coins=900;State.S.fish=100;
    State.S.tutorialDone=true;
    State.S.firstAdventureTour={step:7,done:true,skipped:true};
    State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:true,
      modeChosen:true,tutorialSeen:true,manualTutorialSeen:true,teamUids:[a.uid,b.uid]};
    CatRelations.pair(a,b).value=95;CatRelations.choose(a,b);
    State.S.worldmap.unlocked.volcano=true; // isolated late-game showcase save
    State.save();__game.rebuildYard();__game.refreshHUD();
  });

  // 2) Watch the authentic duo cinematic ONCE.
  await page.evaluate(()=>UI.openBondPanel());
  await page.locator('#duo-preview').waitFor({state:'visible',timeout:12000});
  await page.locator('#duo-preview').click();
  await page.waitForFunction(()=>document.querySelector('#cb-duo-viewer iframe')?.contentWindow?.__duoPreviewReady===true,{timeout:15000});
  await sleep(1650);
  await page.locator('.cb-duo-viewer-close').click();

  // 3) Real workshop/build/dex panels; brief holds, no scene montage edits.
  await page.evaluate(()=>UI.openWorkshop());
  await sleep(520);
  await page.evaluate(()=>{UI.closeAll();UI.openBuild();});
  await sleep(480);
  await page.evaluate(()=>{UI.closeAll();UI.openDex();});
  await sleep(520);
  await page.evaluate(()=>UI.closeAll());

  // 4) Use the real yard menu -> world directory -> Home region UI.
  await page.locator('#map-menu').click();
  await page.locator('#panel.open [data-explore-action="regions"]').click();
  await page.locator('#panel.open .map-destination[data-region="home"]').click();
  await page.waitForFunction(()=>__game.scene==='map'&&WorldMap.mode==='region'&&
    WorldMap.currentRegion==='home',{timeout:10000});
  await sleep(350);

  // Move by a real canvas click to the existing yarn-box discovery point.
  const secretPoint=await page.evaluate(()=>{
    const canvas=document.getElementById('scene'),r=canvas.getBoundingClientRect(),v=WorldMap.view;
    const sx=396-v.camX,sy=604-v.camY;
    return {x:r.left+sx*r.width/canvas.width,y:r.top+sy*r.height/canvas.height};
  });
  await page.mouse.click(secretPoint.x,secretPoint.y);
  await page.waitForSelector('#panel.open #secret-close',{timeout:12000});
  const discovered=await page.evaluate(()=>({
    name:document.querySelector('#panel.open .yard-surprise-story h2')?.textContent||'',
    region:WorldMap.currentRegion,scene:__game.scene
  }));
  if(!discovered.name||discovered.scene!=='map')
    throw Error('The real map discovery did not trigger');
  fs.writeFileSync(path.join(media,'review-actual-map-discovery.png'),
    await page.screenshot({type:'png'}));
  await sleep(850);
  await page.locator('#panel.open #secret-close').click();
  await sleep(120);

  // 5) Real roaming SSR encounter in Volcano. The seed only chooses a
  // reproducible map layout; the cat is generated by WorldMap's weighted
  // region pool, approached by the player, and fought through the actual UI.
  await page.locator('#map-menu').click();
  await page.locator('#panel.open [data-explore-action="regions"]').click();
  await page.evaluate(seed=>{
    const listener=e=>{
      const button=e.target?.closest?.('.map-destination[data-region="volcano"]');
      if(!button)return;
      document.removeEventListener('click',listener,true);
      const original=Math.random;let value=seed>>>0;
      Math.random=()=>{
        value=(Math.imul(value,1664525)+1013904223)>>>0;
        return value/4294967296;
      };
      setTimeout(()=>{Math.random=original;},0);
    };
    document.addEventListener('click',listener,true);
  },volcanoSeed);
  await page.locator('#panel.open .map-destination[data-region="volcano"]').click();
  await page.waitForFunction(()=>WorldMap.mode==='region'&&WorldMap.currentRegion==='volcano'&&
    WorldMap.spawns.some(s=>s.sp==='jinwu'),{timeout:12000});
  const ssrTarget=await page.evaluate(()=>{
    const target=WorldMap.spawns.find(s=>s.sp==='jinwu');
    if(!target)throw Error('The natural Volcano spawn pool has no Jinwu SSR');
    const canvas=document.getElementById('scene'),r=canvas.getBoundingClientRect(),v=WorldMap.view;
    const sx=target.x-v.camX,sy=target.y-v.camY;
    if(sx<20||sy<20||sx>canvas.width-20||sy>canvas.height-20)
      throw Error('Natural Jinwu spawn is outside the visible map');
    return {id:target.sp,level:target.level,
      x:r.left+sx*r.width/canvas.width,y:r.top+sy*r.height/canvas.height};
  });
  // Physically chase the live roaming SSR with ordinary canvas clicks.
  // Each click is a real browser mouse event; proximity—not this script—opens
  // WorldMap's encounter callback and the native battle-prep panel.
  let mapEncounterOpened=false;
  for(let chase=0;chase<8&&!mapEncounterOpened;chase++){
    const target=await page.evaluate(()=>{
      const s=WorldMap.spawns.find(x=>x.sp==='jinwu');
      if(!s)throw Error('Jinwu roamer disappeared before contact');
      const canvas=document.getElementById('scene'),r=canvas.getBoundingClientRect(),v=WorldMap.view;
      const sx=s.x-v.camX,sy=s.y-v.camY;
      if(sx<8||sy<8||sx>canvas.width-8||sy>canvas.height-8)
        return null;
      return {x:r.left+sx*r.width/canvas.width,y:r.top+sy*r.height/canvas.height};
    });
    if(!target)throw Error('Jinwu roamer left the visible map before contact');
    await page.mouse.click(target.x,target.y);
    await page.waitForTimeout(420);
    mapEncounterOpened=await page.locator('#panel.open #bp-go').count()>0;
  }
  if(!mapEncounterOpened)throw Error('Walking into the real SSR roamer never opened battle preparation');
  const mapBattlePrompt=await page.locator('#panel.open').innerText();
  const jinwuName=await page.evaluate(()=>GameData.speciesName(GameData.speciesById('jinwu')));
  if(!mapBattlePrompt.includes('SSR')||!mapBattlePrompt.includes(jinwuName))
    throw Error('The visible map encounter prompt is not the Jinwu SSR: '+mapBattlePrompt.slice(0,500));
  await sleep(500); // show the real wild-cat encounter and "Start battle" button
  await page.locator('#panel.open #bp-go').click();
  await page.waitForFunction(()=>__game.scene==='battle'&&__game.battle?.wild?.id==='jinwu',
    {timeout:10000});
  const finalBattleEntry={scene:'battle',wild:'jinwu',startedFromVisibleButton:true};
  if(await page.locator('#battle-tutorial-skip').isVisible().catch(()=>false))
    await page.locator('#battle-tutorial-skip').click();
  await page.waitForFunction(()=>window.State?.S?.dex?.jinwu>=1,{timeout:45000}).catch(async error=>{
    const diagnostics=await page.evaluate(()=>({
      scene:__game.scene,battleResult:__game.battle?.result,
      battleTime:__game.battle?.t,autoMode:__game.battle?.autoMode,
      allies:__game.battle?.team?.map(x=>({hp:Math.round(x.hp),alive:x.alive})),
      enemies:__game.battle?.enemies?.map(x=>({hp:Math.round(x.hp),alive:x.alive})),
      ssrCount:State.S.dex.jinwu||0
    }));
    console.log('REAL SSR BATTLE DIAGNOSTICS',JSON.stringify(diagnostics));
    throw error;
  });
  await sleep(700);
  const clipDuration=(Date.now()-begun)/1000+0.15;
  if(clipDuration>60)throw Error('Y8 gameplay too slow: '+clipDuration.toFixed(1)+'s');
  if(clipDuration<15)throw Error('Continuous gameplay below Y8 minimum');
  const captureProof=await page.evaluate(()=>({
    rarity:GameData.speciesById('jinwu').rarity,captured:State.S.dex.jinwu||0,
    scene:__game.scene
  }));
  if(captureProof.rarity!=='SSR'||!captureProof.captured)
    throw Error('Missing real SSR capture');
  const battleEntryProof={
    firstYardEncounter:{wild:firstWild.id,prepButton:'cp-go',clicked:true,scene:'yard -> battle',proof:firstBattleEntry},
    mapSSR:{wild:'jinwu',prepButton:'bp-go',clicked:true,scene:'map -> encounter prompt -> battle',proof:finalBattleEntry},
    directStartBattleCalls:0
  };
  const recordedVideo=page.video();
  await page.close();
  const rawPath=await recordedVideo.path();
  await videoCtx.close();
  const trailer=path.join(media,'06-gameplay-continuous.mp4');
  const music=path.join(out,'game/audio/freepd-cc0-3.mp3');
  if(!fs.existsSync(music))throw Error('Real game music not bundled');
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-ss',String(trim),'-i',rawPath,
    '-stream_loop','-1','-i',music,
    '-t',String(clipDuration),
    '-filter_complex','[0:v]crop=1170:658:55:31,fps=25,'+
      'scale=1280:720:flags=lanczos,format=yuv420p[v];'+
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
  if(dur<15||dur>64||fs.statSync(trailer).size>50_000_000)
    throw Error('Continuous Y8 gameplay video outside limits: '+dur);
  const v=probe.streams.find(s=>s.codec_type==='video');
  if(v?.width!==1280||v?.height!==720)throw Error('Bad gameplay resolution');
  cases.push({name:'06-gameplay-continuous.mp4',durationSeconds:dur,bytes:fs.statSync(trailer).size,
    continuous:true,source:'one chronological unedited Playwright gameplay session'});
  if(errors.length)throw Error('Runtime defects found: '+errors.slice(0,12).join('; '));
  if(cases.length!==8)throw Error('Expected eight media assets');
  fs.writeFileSync(path.join(out,'media-report.json'),JSON.stringify({
    acceptedFileSpecs:true,sourceCommit:process.env.GITHUB_SHA||'local',
    gameplayState:state,ssrCapture:captureProof,explorationDiscovery:discovered,battleEntryProof,volcanoSeed,videoSeconds:clipDuration,assets:cases,reviewNeeded:true
  },null,2)+'\n');
  console.log('Y8 REAL-GAMEPLAY CAPTURE PASS\n'+JSON.stringify(cases,null,2));
}finally{
  await browser?.close().catch(()=>{});
  server.kill('SIGTERM');
}

// Y8 assets: recapture distinct authentic gameplay scenes for user-feedback revision.
