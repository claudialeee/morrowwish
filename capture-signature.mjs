import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=path.resolve('signature-capture');fs.mkdirSync(root,{recursive:true});
const base='http://127.0.0.1:18963',wait=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('python3',['-m','http.server','18963','--bind','127.0.0.1','--directory','output/portrait-fixed-web/public'],{stdio:'ignore'});
const report={sourceCommit:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',viewportFix:'c0c9eef798870ac84ffd2442dc68ca085cf407cd',method:'Real input only. Resumed previously earned saves. Natural rarity rolls, no seeded randomness or state injection.',captures:[],pass:false};
const ff=(...a)=>execFileSync('ffmpeg',['-v','error','-y',...a.map(String)],{stdio:'pipe'});
const check=(b,msg)=>{if(!b)throw Error(msg)};
let browser;
async function play(name,width,height,touch){
 const dir=path.join(root,name);fs.mkdirSync(dir,{recursive:true});
 const save=JSON.parse(fs.readFileSync('output/portrait-fixed-refined/'+name+'/attained-save.json','utf8'));
 const r={name,width,height,errors:[],failedRequests:[],duo:null,ssr:null,rolls:[],battles:[],complete:false};report.captures.push(r);
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,storageState:save,recordVideo:{dir,size:{width,height}}});
 const page=await ctx.newPage(),video=page.video(),start=Date.now();
 const time=()=> (Date.now()-start)/1000;
 const visible=async s=>page.locator(s).first().isVisible().catch(()=>false);
 const tap=async s=>{let l=page.locator(s).first();await l.waitFor({state:'visible',timeout:10000});if(touch)await l.tap({timeout:10000});else await l.click({timeout:10000})};
 const point=(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);
 const shot=async n=>{await page.screenshot({path:path.join(dir,n+'.png')})};
 const read=()=>page.evaluate(()=>({scene:window.__game?.scene,catchCount:State.S.catchCount,cats:State.S.cats.map(c=>({species:c.species,level:c.level,rarity:GameData.speciesById(c.species)?.rarity})),pending:!!State.S.firstDuoShowcasePending,duo:window.__game?.battle?.duoUses||0}));
 const close=async()=>{if(await visible('#cr-ok'))await tap('#cr-ok');else if(await visible('#panel.open .panel-dismiss'))await tap('#panel.open .panel-dismiss')};
 page.on('pageerror',e=>r.errors.push(e.message));page.on('response',res=>{if(res.status()>=400&&!res.url().endsWith('favicon.ico'))r.failedRequests.push(res.status()+' '+res.url())});
 await page.route('**/*',q=>{let u=new URL(q.request().url());return u.origin!==base||/telemetry/.test(u.pathname)?q.abort():q.continue()});
 const hide=async()=>{
  if(!await page.evaluate(()=>!!window.__game?.yard?.hide))await tap('#fab-seek');
  const h=await page.evaluate(()=>{let h=window.__game?.yard?.hide,b=document.getElementById('scene').getBoundingClientRect();return h?{species:h.species.id,rarity:h.species.rarity,level:h.level,x:b.left+h.spot.x,y:b.top+h.spot.y}:null});
  check(h,'No naturally spawned cat');return h;
 };
 const open=async h=>{await point(h.x,h.y);await page.locator('#cp-go').waitFor({state:'visible',timeout:8000})};
 const fight=async(h,wantDuo=false,wantSSR=false)=>{
  const before=await read();await open(h);
  if(wantSSR)await shot('ssr-discovery');
  if(await visible('#panel.open .capture-mode-option[data-battle-auto="true"]'))await tap('#panel.open .capture-mode-option[data-battle-auto="true"]');
  if(wantSSR&&await visible('#cp-best-team'))await tap('#cp-best-team');
  await tap('#cp-go');await page.waitForFunction(()=>window.__game?.scene==='battle',null,{timeout:12000});
  if(await visible('#battle-tutorial-skip'))await tap('#battle-tutorial-skip');
  let record={species:h.species,rarity:h.rarity,started:time(),before:before.catchCount};
  if(wantDuo){
   // Real one-time reward precharges the duo; click the existing button if auto
   // hasn't already fired. No calls to castDuo, no game state modification.
   await page.waitForFunction(()=>window.__game?.battle?.duoReady?.()||window.__game?.battle?.duoCinematic?.t>0,null,{timeout:15000});
   if(await page.evaluate(()=>!window.__game?.battle?.duoCinematic?.t&&window.__game?.battle?.duoReady?.()))await tap('#duo-burst');
   await page.waitForFunction(()=>window.__game?.battle?.duoCinematic?.t>0,null,{timeout:10000});
   let onset=time();
   await page.waitForFunction(()=>{const b=window.__game?.battle,l=window.CatBondPremiumCinematics?.lastLayout;return b?.duoCinematic?.t>0&&b.duoUses>0&&l?.originalArt===true&&l?.actorFallback===false&&(l.opacity===undefined?l.effectPhase>.15&&l.effectPhase<.72:l.opacity>.65)},null,{timeout:10000});
   const art=await page.evaluate(()=>{const b=window.__game.battle,l=window.CatBondPremiumCinematics.lastLayout;return {uses:b.duoUses,elementPair:b.duo.elementPair,tier:b.duo.tier,cinematic:{remaining:b.duoCinematic.t,max:b.duoCinematic.max},layout:l}});
   check(art.layout.source===(touch?'63-native-portrait-painted-storyboards':'63-original-painted-storyboards'),'Wrong actual artwork source');
   r.duo={...art,onset,frameTime:time(),screenshot:'duo-real.png'};
   await shot('duo-real');
  }
  if(wantSSR){await wait(1000);record.combatTime=time();await shot('ssr-combat')}
  await page.waitForFunction(()=>window.__game?.scene!=='battle',null,{timeout:120000});
  await wait(200);
  const after=await read();record.after=after.catchCount;record.earned=after.catchCount>before.catchCount&&after.cats.some(c=>c.species===h.species);record.resultTime=time();record.cats=after.cats;r.battles.push(record);
  if(wantSSR&&record.earned&&h.rarity==='SSR'&&await visible('#cr-next')){
    await shot('ssr-earned');r.ssr={species:h.species,rarity:'SSR',combatTime:record.combatTime,resultTime:record.resultTime,before:before.catchCount,after:after.catchCount,owned:after.cats.find(c=>c.species===h.species),screenshot:'ssr-earned.png'};
    await wait(3800);
  }
  if(wantDuo)await wait(900);
  await close();return record;
 };
 try{
  await page.goto(base+'/cat-bond/?platform=crazygames&lang=en',{waitUntil:'domcontentloaded',timeout:40000});
  await tap('#intro-start');await page.waitForFunction(()=>window.State?.S?.cats?.length>=2);await wait(450);await close();
  r.initial=await read();check(r.initial.pending,'Earned save did not preserve first-duo reward');check(!r.initial.cats.some(c=>c.rarity==='SSR'),'Unexpected pre-owned SSR');
  await fight(await hide(),true,false);
  // The yard's real encounter rarity weights remain unchanged. Cancel unwanted
  // encounters via the normal Let it go button. No reload/reset or RNG override.
  for(let i=0;i<230&&!r.ssr;i++){
   const h=await hide();r.rolls.push({species:h.species,rarity:h.rarity,level:h.level});
   if(h.rarity==='SSR'){await fight(h,false,true);continue}
   // Actual ordinary battles grow the lineup; do not invent experience.
   if(r.battles.length<4&&['N','R'].includes(h.rarity)&&i%9===0){await fight(h);continue}
   await open(h);await tap('#cp-cancel');
  }
  r.complete=!!r.duo&&!!r.ssr&&!r.errors.length&&!r.failedRequests.length;
  await ctx.storageState({path:path.join(dir,'attained-save.json')});
 }catch(e){r.error=String(e);await shot('failure').catch(()=>{})}
 finally{await ctx.close();const raw=await video.path();fs.renameSync(raw,path.join(dir,'continuous.webm'))}
 const raw=path.join(dir,'continuous.webm');
 const clip=(n,t,d)=>ff('-ss',Math.max(0,t),'-i',raw,'-t',d,'-an','-vf','fps=25','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(dir,n+'.mp4'));
 if(r.duo)clip('duo-real',r.duo.onset-.30,4.1);
 if(r.ssr){clip('ssr-combat',r.ssr.combatTime-.25,3.4);clip('ssr-earned',r.ssr.resultTime-.15,3.4)}
 fs.writeFileSync(path.join(root,name+'-report.json'),JSON.stringify(r,null,2)+'\n');
}
try{
 for(let i=0;i<50;i++){try{if((await fetch(base+'/cat-bond/')).ok)break}catch{}await wait(200)}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const results=await Promise.allSettled([play('landscape',1920,1080,false)]);
 report.executionErrors=results.filter(x=>x.status==='rejected').map(x=>String(x.reason));
 report.pass=report.captures.length===1&&report.captures.every(x=>x.complete)&&!report.executionErrors.length;
}finally{await browser?.close();server.kill();fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n')}
if(!report.pass)process.exitCode=1;
