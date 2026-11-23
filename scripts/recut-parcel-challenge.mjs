// Parcel Panic challenge trailer: genuine current-game actions, review-only.
// Produces one portrait MP4, proof frames and a new seven-game review manifest.
// Never publishes to social platforms and never changes game difficulty.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const ROOT='public/promo', SLUG='parcel-panic', BASE=ROOT+'/'+SLUG;
const OUT=BASE+'/trailer-challenge-20261122.mp4';
const POSTER=BASE+'/trailer-challenge-20261122.jpg';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mw-parcel-challenge-'));
const host='http://127.0.0.1:8795';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(condition,message)=>{if(!condition)throw Error(message)};
function command(app,args,timeout=240000) {
  execFileSync(app,args,{stdio:'inherit',timeout});
}
function probe(file){
  return JSON.parse(execFileSync('ffprobe',
    ['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],
    {encoding:'utf8',timeout:12000}));
}
function duration(file){return Number(probe(file).format.duration)}
function write(file,obj){fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n')}
function findLatest(){
  const versions=fs.readdirSync(ROOT).map(n=>({n,m:/^v([0-9]+)-review\.json$/.exec(n)}))
    .filter(x=>x.m).sort((a,b)=>Number(b.m[1])-Number(a.m[1]));
  assert(versions.length,'Missing prior seven-game review');
  for(const v of versions){
    const data=JSON.parse(fs.readFileSync(ROOT+'/'+v.n,'utf8'));
    if(data.trailers?.length===7 &&
      data.trailers.every(x=>fs.existsSync('public'+x.video)&&fs.existsSync('public'+x.poster)))
      return {version:Number(v.m[1]),data};
  }
  throw Error('No complete seven-game review manifest');
}
async function main(){
  fs.mkdirSync(BASE,{recursive:true});
  // The prior public game footage is the authoritative licensed audio source;
  // retain its own soundtrack instead of replacing it with unrelated music.
  const old=BASE+'/trailer-v7-20261121.mp4';
  assert(fs.existsSync(old),'Missing prior authentic music source');
  const soundtrack=temp+'/licensed-parcel.m4a';
  command('ffmpeg',['-nostdin','-y','-v','error','-i',old,
    '-map','0:a:0','-vn','-c:a','copy',soundtrack],35000);
  assert(duration(soundtrack)>10,'Old trailer audio is missing');
  const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1','--directory','public'],
    {stdio:'ignore'});
  let browser,context,videoFile;
  const shots=[],proof={};
  try{
    await sleep(1100);
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
      isMobile:true,hasTouch:true,locale:'en-US',
      recordVideo:{dir:temp,size:{width:540,height:960}}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/session**',route=>route.abort('blockedbyclient'));
    await page.route('**/upgrade.js*',async route=>{
      const response=await route.fetch(),code=await response.text();
      const needle='let time=0,boxes=[],spawn=.42,life=4,delivered=0,press=null,drag=null,feedback=null,queue=[],planned=0;';
      assert(code.includes(needle),'Parcel Panic code changed: update capture observer');
      const observer='window.__PARCEL_AD_STATE__=()=>({time,boxes:boxes.map(b=>({y:b.y,color:b.color,kind:b.kind})),queue:queue.map(b=>({color:b.color,kind:b.kind})),life,delivered,stats:{...window.mwMiniStats}});';
      await route.fulfill({response,body:code.replace(needle,needle+'\n'+observer),
        headers:{...response.headers(),'content-type':'application/javascript; charset=utf-8'}});
    });
    const born=Date.now(),clock=()=>+(Date.now()-born)/1000;
    await page.goto(host+'/parcel-panic/?lang=en&seed=parcel-challenge-20261122',
      {waitUntil:'domcontentloaded',timeout:30000});
    await page.evaluate(()=>document.querySelector('#mw-mini-fullscreen')?.click());
    await page.waitForFunction(()=>window.MorrowwishArcadeViewport?.state?.portrait===true&&
      typeof window.__PARCEL_AD_STATE__==='function',null,{timeout:12000});
    await page.locator('#play-btn').click();
    await page.waitForFunction(()=>document.querySelector('#overlay')?.hidden===true,null,{timeout:5000});
    const state=()=>page.evaluate(()=>window.__PARCEL_AD_STATE__());
    const mark=(label,start)=>{
      const sec=+(clock()-start-.12).toFixed(3);
      assert(sec>=1.8,'Insufficient genuine recording for '+label+': '+sec);
      shots.push({label,start,duration:sec});
    };
    async function send(closeCall=false){
      await page.waitForFunction(()=>window.__PARCEL_AD_STATE__().boxes.length===1,
        null,{timeout:5000,polling:60});
      const before=await state();
      assert(before.life>0&&before.boxes.length===1,'No live parcel');
      const oldDelivered=before.delivered;
      const targetY=before.life===1?(closeCall?265:145):(closeCall?290:190);
      await page.waitForFunction(y=>{
        const s=window.__PARCEL_AD_STATE__();
        return s.boxes.length===1&&s.boxes[0].y>=y;
      },targetY,{timeout:5000,polling:40});
      const live=await state();
      assert(live.boxes.length===1&&live.delivered===oldDelivered,'Parcel expired before physical key');
      const color=live.boxes[0].color;
      await page.keyboard.press(String(color+1)); // actual in-game keyboard handler
      await page.waitForFunction(old=>window.__PARCEL_AD_STATE__().delivered===old+1,
        oldDelivered,{timeout:2500,polling:40});
      const after=await state();
      assert(after.life===before.life,'Unexpected missed parcel during real delivery: '+JSON.stringify({before,live,after}));
      if(closeCall)proof.closeCall={color,y:live.boxes[0].y,delivered:after.delivered};
      return after;
    }
    async function missByTimeout(){
      const old=await state();
      await page.waitForFunction(x=>window.__PARCEL_AD_STATE__().stats.misses>x,
        old.stats.misses,{timeout:5500,polling:60});
      const now=await state();
      assert(now.life===old.life-1,'Timeout did not reduce one life');
      return now;
    }
    let phase=clock();
    for(let i=0;i<3;i++)await send();
    mark('opening',phase);
    phase=clock();
    for(let i=3;i<8;i++)await send(i===5);
    mark('express',phase);
    let snap=await state();
    assert(snap.delivered===8&&snap.stats.express>=1&&snap.stats.shifts===1,
      'Express parcel and first earned shift not captured: '+JSON.stringify(snap));
    phase=clock();
    for(let i=8;i<16;i++)await send(i===12);
    mark('speed-up',phase);
    snap=await state();
    assert(snap.delivered===16&&snap.stats.gifts>=1&&snap.stats.shifts===2,
      'Bonus order and second shift not earned: '+JSON.stringify(snap));
    phase=clock();
    for(let i=0;i<3;i++)await missByTimeout(); // real timeouts, no fake HUD
    mark('one-life',phase);
    snap=await state();
    assert(snap.life===1&&snap.stats.misses===3,
      'Genuine one-life cliffhanger not achieved: '+JSON.stringify(snap));
    phase=clock();
    for(let i=16;i<21;i++)await send(i===19);
    mark('clutch',phase);
    snap=await state();
    assert(snap.life===1&&snap.delivered===21&&snap.stats.express>=3,
      'Survival under express rush failed: '+JSON.stringify(snap));
    phase=clock();
    for(let i=21;i<24;i++)await send();
    await sleep(420);
    mark('shift-clear',phase);
    snap=await state();
    assert(snap.delivered===24&&snap.stats.shifts===3&&snap.life===2,
      'Final shift and recovered life were not earned: '+JSON.stringify(snap));
    proof.final=snap;
    assert(!errors.length,'Real-game recording browser errors: '+errors.join(' | '));
    const video=page.video();
    await context.close();context=null;
    videoFile=temp+'/genuine-parcel-run.webm';
    fs.copyFileSync(await video.path(),videoFile);
    console.log('AUTHENTIC PARCEL CHALLENGE '+JSON.stringify({shots,proof}));
  } finally {
    if(context)await context.close().catch(()=>{});
    if(browser)await browser.close().catch(()=>{});
    server.kill('SIGTERM');
  }
  assert(videoFile&&fs.existsSync(videoFile),'No authentic game recording');
  // Proof frames come from recorded pixels AFTER the run: screenshots during
  // a one-life real-time rush can consume the final life before the next key.
  for(const [scene,file] of [
    ['one-life',BASE+'/challenge-one-life-proof.png'],
    ['shift-clear',BASE+'/challenge-shift-clear-proof.png']]){
    const shot=shots.find(x=>x.label===scene);
    assert(shot,'Missing real proof scene '+scene);
    const at=shot.start+Math.max(.15,shot.duration-.25);
    command('ffmpeg',['-nostdin','-y','-v','error','-i',videoFile,
      '-ss',at.toFixed(3),'-frames:v','1',file],35000);
    assert(fs.existsSync(file)&&fs.statSync(file).size>10000,'Blank proof frame '+scene);
  }
  const timeline=[
    ['opening',2.9,'LOOKS EASY?'],
    ['express',3.5,'EXPRESS RUSH!'],
    ['speed-up',3.7,'THE PACE PICKS UP.'],
    ['one-life',2.7,'ONE LIFE LEFT.'],
    ['clutch',4.2,"DON'T BLINK."],
    ['shift-clear',2.9,'SHIFT CLEARED!']
  ];
  const chosen=timeline.map(([label,max,caption])=>{
    const shot=shots.find(x=>x.label===label);
    assert(shot,'Missing scene '+label);
    const seconds=Math.min(max,shot.duration);
    assert(seconds>=2.0,'Unusable real scene '+label);
    return {label,start:shot.start,seconds,caption};
  });
  const finalDuration=3.0;
  const font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const filters=[];
  chosen.forEach((shot,i)=>{
    const txt=temp+'/caption-'+i+'.txt';
    fs.writeFileSync(txt,shot.caption);
    const f='[0:v]trim=start='+shot.start.toFixed(3)+':duration='+shot.seconds.toFixed(3)+
      ',setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1,'+
      'drawtext=fontfile='+font+':textfile='+txt+
      ':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=1690:'+
      'shadowcolor=black@0.85:shadowx=3:shadowy=4:'+
      'box=1:boxcolor=black@0.55:boxborderw=14,format=yuv420p[v'+i+']';
    filters.push(f);
  });
  const endTexts=[['PARCEL PANIC',69,790,'white'],['PLAY FREE',53,1030,'white'],
    ['MORROW WISH',37,1155,'0xE7BDA3']];
  let end='[1:v]trim=duration='+finalDuration+',setpts=PTS-STARTPTS,format=yuv420p';
  endTexts.forEach(([caption,size,y,color],i)=>{
    const file=temp+'/end-'+i+'.txt';fs.writeFileSync(file,caption);
    end+=',drawtext=fontfile='+font+':textfile='+file+
      ':fontcolor='+color+':fontsize='+size+':x=(w-text_w)/2:y='+y;
  });
  filters.push(end+'[v'+chosen.length+']');
  filters.push(chosen.map((_,i)=>'[v'+i+']').join('')+
    '[v'+chosen.length+']concat=n='+(chosen.length+1)+':v=1:a=0[vout]');
  const total=chosen.reduce((n,x)=>n+x.seconds,finalDuration);
  command('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',videoFile,'-f','lavfi','-i','color=c=0x241A37:s=1080x1920:r=30',
    '-stream_loop','-1','-i',soundtrack,'-filter_complex',filters.join(';'),
    '-map','[vout]','-map','2:a:0','-t',total.toFixed(3),'-r','30',
    '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','128k','-af',
    'volume=0.34,afade=t=in:st=0:d=0.3,afade=t=out:st='+(total-.7).toFixed(3)+':d=0.7',
    '-movflags','+faststart',OUT],350000);
  const metadata=probe(OUT);
  assert(duration(OUT)>19&&duration(OUT)<26,'Incorrect final trailer duration');
  assert(metadata.streams.some(x=>x.codec_type==='video'&&x.width===1080&&x.height===1920),
    'Final footage is not 1080x1920 portrait');
  assert(metadata.streams.some(x=>x.codec_type==='audio'),'Final trailer has no licensed music');
  assert(fs.statSync(OUT).size>250000,'Rendered trailer suspiciously small');
  command('ffmpeg',['-nostdin','-y','-v','error','-ss','1','-i',OUT,
    '-frames:v','1','-q:v','3',POSTER],25000);
  const review=[];
  for(const [i,second] of [1.1,total*.50,total-4.6].entries()){
    const p=BASE+'/challenge-review-'+(i+1)+'.jpg';
    command('ffmpeg',['-nostdin','-y','-v','error','-ss',second.toFixed(2),'-i',OUT,
      '-frames:v','1','-q:v','3',p],25000);
    assert(fs.statSync(p).size>10000,'Blank review frame '+p);
    review.push('/promo/'+SLUG+'/challenge-review-'+(i+1)+'.jpg');
  }
  const previous=findLatest();
  const next=previous.version+1;
  const data=structuredClone(previous.data);
  data.version='V'+next;
  data.createdAt=new Date().toISOString();
  data.approval='NOT APPROVED — REVIEW ONLY';
  data.socialAutopublish=false;
  data.readabilityChecked=true;
  const current=data.trailers.find(x=>x.slug===SLUG);
  assert(current,'Missing Parcel Panic from existing seven-game review');
  const original=Object.fromEntries(data.trailers.filter(x=>x.slug!==SLUG).map(x=>[x.slug,x.video]));
  const replacement={
    slug:SLUG,kind:'real-gameplay-challenge-ad',
    video:'/promo/'+SLUG+'/trailer-challenge-20261122.mp4',
    poster:'/promo/'+SLUG+'/trailer-challenge-20261122.jpg',
    review,duration:Number(duration(OUT).toFixed(1)),
    shots:[...chosen.map(x=>({source:'real-gameplay',scene:x.label,caption:x.caption,
      seconds:Number(x.seconds.toFixed(3))})),
      {source:'end-card',scene:null,caption:'PLAY FREE',seconds:finalDuration}],
    sourceClips:'Fresh browser recording of current Parcel Panic; authentic express, gift, real timeouts, one-life recovery and three completed shifts',
    transitions:'clean cuts; no fabricated packages or HUD',
    aspect:'real portrait game 9:16; no stretched landscape',
    approved:false,published:false
  };
  data.trailers=data.trailers.map(x=>x.slug===SLUG?replacement:x);
  for(const [slug,video] of Object.entries(original)){
    assert(data.trailers.find(x=>x.slug===slug)?.video===video,
      'Other game trailer unexpectedly changed: '+slug);
  }
  assert(data.trailers.length===7&&data.trailers.every(x=>!x.approved&&!x.published),
    'Owner-review-only gate failed');
  const auditName=ROOT+'/readability-audit-v'+previous.version+'.json';
  const oldAudit=fs.existsSync(auditName)?
    JSON.parse(fs.readFileSync(auditName,'utf8')):{scenes:[]};
  const audit={...oldAudit,createdAt:data.createdAt,
    version:'readability-review-v'+next,
    method:'Authentic parcel gameplay, phone-safe headline captions, 2+ seconds per scene.',
    scenes:[...(oldAudit.scenes||[]).filter(x=>x.game!==SLUG),
      ...chosen.map(x=>({game:SLUG,scene:x.label,seconds:Number(x.seconds.toFixed(2)),
        captionWords:x.caption.split(/\s+/).length,requiredSeconds:2,passed:x.seconds>=2}))]};
  assert(audit.scenes.every(x=>x.passed!==false),'Readability regression');
  write(ROOT+'/v'+next+'-review.json',data);
  write(ROOT+'/readability-audit-v'+next+'.json',audit);
  write(ROOT+'/readability-audit.json',audit);
  write(BASE+'/challenge-proof.json',{createdAt:data.createdAt,proof,source:'live game browser actions',
    editedScenes:chosen,version:data.version,socialAutopublish:false});
  console.log('PARCEL PANIC REVIEW READY '+JSON.stringify({
    version:data.version,seconds:duration(OUT),video:replacement.video,
    sourceProof:proof,unchangedGames:Object.keys(original)}));
}
try{await main()}finally{fs.rmSync(temp,{recursive:true,force:true})}
