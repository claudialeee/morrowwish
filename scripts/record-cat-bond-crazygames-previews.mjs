// Capture *actual* Cat Bond Canvas gameplay for CrazyGames in two native
// aspect ratios. Only uses owned game art and the in-game battle engine.
// Run: node scripts/record-cat-bond-crazygames-previews.mjs
// Requires Playwright Chromium; ffmpeg transcoding is done by media prep.
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const dir='.check/crazygames';
fs.mkdirSync(dir,{recursive:true});
const port=Number(process.env.CAT_BOND_MEDIA_PORT||8765);
const base='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1',
  '--directory','public'],{stdio:'ignore'});
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function ready(){
  for(let i=0;i<40;i++){
    try{const r=await fetch(base+'/cat-bond/');if(r.ok)return;}
    catch{}
    await sleep(250);
  }
  throw Error('Cat Bond source server unavailable');
}
let browser;
try {
  await ready();
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const [label,width,height] of [
    ['landscape',1920,1080],['portrait',1080,1620],
  ]){
    const context=await browser.newContext({
      viewport:{width,height},deviceScaleFactor:1,
      recordVideo:{dir,size:{width,height}},
    });
    const page=await context.newPage();
    const video=page.video();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/cat-bond/?platform=crazygames&lang=en',
      {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#panel.open .dex-cell',{timeout:12000});
    await page.locator('#panel.open .dex-cell').first().click();
    await page.waitForFunction(()=>State.S.cats.length===1,{timeout:10000});
    // Capture an attainable late-game two-cat action scene. All characters,
    // stats, damage and VFX come from the actual shipping game engine.
    const setup=await page.evaluate(()=>{
      const g=window.__game,State=window.State,Data=window.GameData;
      const a=State.S.cats[0],b=State.makeCat('xiaohui',{affinity:92});
      if(!a||!b)throw Error('Missing starter or second cat');
      for(const cat of [a,b]){
        cat.level=20;cat.affinity=92;
        cat.stats={pow:52,agi:45,vit:60,cha:42};
      }
      State.S.cats.push(b);
      State.S.dex[b.species]=1;
      window.CatRelations?.grow(a,b,80);
      window.CatRelations?.choose(a,b);
      State.S.battlePrefs={...(State.S.battlePrefs||{}),
        autoBattle:true,modeChosen:true,tutorialSeen:true,
        manualTutorialSeen:true,teamUids:[a.uid,b.uid]};
      State.save();
      g.startBattle([a,b],Data.speciesById('jinwu'));
      const fight=g.battle;
      if(!fight?.duo)throw Error('Actual Duo attack not available');
      fight.duoCharge=100;fight.duoCd=0;
      return {active:fight.team.length,duo:!!fight.duo,wild:fight.wild.id};
    });
    if(setup.active!==2||!setup.duo)throw Error('Bad gameplay fixture: '+JSON.stringify(setup));
    // Do not approve a recording that merely shows a charged button or
    // frozen tutorial: the signature must actually execute on camera.
    await sleep(650);
    const filmed=await page.evaluate(()=>{
      const fight=window.__game?.battle;
      // Auto mode usually casts immediately. If the animation scheduler has
      // not yet fired, press the exact same public battle action once.
      if(fight&&fight.duoUses===0&&fight.duoReady())fight.castDuo();
      return {uses:fight?.duoUses||0,active:window.__game?.scene,
        tutorialVisible:!!window.__game?.battleHelpOpen};
    });
    if(filmed.uses<1||filmed.tutorialVisible)
      throw Error('Duo action was not visibly filmed: '+JSON.stringify(filmed));
    await sleep(18000);
    if(errors.length)throw Error('Gameplay capture errors: '+errors.join('; '));
    await page.close();
    const src=await video.path();
    const dest=dir+'/cat-bond-gameplay-'+label+'.webm';
    fs.copyFileSync(src,dest);
    await context.close();
    if(fs.statSync(dest).size<10000)throw Error('Gameplay recording is suspiciously small: '+dest);
    console.log('CAT BOND REAL GAMEPLAY VIDEO PASS',label,JSON.stringify({
      width,height,bytes:fs.statSync(dest).size,scene:setup.wild
    }));
  }
} finally {
  await browser?.close().catch(()=>{});
  server.kill('SIGTERM');
}
