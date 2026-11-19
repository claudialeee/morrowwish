// Produce genuine browser-game evidence and platform-sized covers from the live
// Morrow Wish URL. This never interacts with or submits to the CrazyGames portal.
// Synthetic QA traffic is excluded by blocking only first-party telemetry calls.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {publishedGames} from './discovery.mjs';

const slug=process.argv[2]||'flip-dash';
const available=publishedGames();
const game=available.find(g=>g.slug===slug);
if(!game)throw Error('Not a public Morrow Wish game: '+slug);
const ledger=JSON.parse(fs.readFileSync('promotion/ledger.json','utf8'));
const record=ledger.games.find(g=>g.slug===slug);
const channel=record?.channels?.crazygames;
if(!record||record.officialUrl!==game.url||!channel)throw Error('Unverified official URL or missing portal ledger');
const tracked=new URL(channel.trackedUrl);
if(tracked.origin!=='https://morrowwish.vercel.app'||tracked.pathname!==new URL(game.url).pathname||
 tracked.searchParams.get('utm_source')!=='crazygames'||tracked.searchParams.get('utm_medium')!=='portal'||
 tracked.searchParams.get('utm_campaign')!==slug+'-playtest')throw Error('Unexpected portal URL or campaign');
if(channel.status!=='not-submitted'&&channel.status!=='preflight-ready') {
 console.log('Skipped existing CrazyGames entry for '+slug+': '+channel.status);
 process.exit(0);
}

const out=path.join(process.cwd(),'.check','crazygames',slug);
fs.mkdirSync(out,{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true});
const telemetryBlock=/\/api\/(?:session|elsewhere-collect)(?:\?|$)/;
const blockTelemetry=async context=>{
 await context.route('**/*',route=>telemetryBlock.test(new URL(route.request().url()).pathname+new URL(route.request().url()).search) ?
   route.abort('blockedbyclient'):route.continue());
};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const controls={
 'flip-dash':'Tap or press Space to flip gravity and avoid obstacles.',
 'parcel-panic':'Drag falling parcels to the same-colored delivery docks.',
 'pawsibly-innocent':'Explore the rooms, distract the human with yarn, and steal three fish.',
 'tiny-town':'Place venues and connect neighbors to build a town in eight rounds.',
 'elsewhere':'Choose a life, read the scenes, and make branching story choices.',
 'pocket-aquarium':'Select matching food and feed fish before the one-minute round ends.'
};
const evidence={game:slug,title:game.title,officialUrl:game.url,trackedUrl:tracked.toString(),
 verifiedAt:new Date().toISOString(),status:'preflight-only-not-submitted',screenshots:[],
 videos:[],covers:[],errors,controls:controls[slug]||'',portalSubmissionId:null};

try {
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await blockTelemetry(context);
 const page=await context.newPage();
 page.on('pageerror',err=>errors.push('JS error: '+String(err.message).slice(0,180)));
 const response=await page.goto(tracked.toString(),{waitUntil:'domcontentloaded',timeout:30000});
 if(response?.status()!==200)throw Error('Official page returned '+response?.status());
 await page.waitForTimeout(1400);
 if(!(await page.locator('body').isVisible()))throw Error('No visible HTML document');
 const name=await page.title();
 if(!name.toLowerCase().includes(slug.split('-')[0]) && !name.toLowerCase().includes(game.title.split(' ')[0].toLowerCase())) {
   errors.push('Title needs manual checking: '+name.slice(0,100));
 }
 const play=page.getByRole('button',{name:/^play now$|^play$/i}).first();
 if(await play.count())await play.click({timeout:3500}).catch(()=>{});
 await page.waitForTimeout(700);
 const screenshot=path.join(out,'real-gameplay-page.png');
 await page.screenshot({path:screenshot,animations:'disabled'});
 evidence.screenshots.push(path.basename(screenshot));

 // Actual cross-origin iframe render, not only an HTTP HEAD test.
 const framePage=await context.newPage();
 await framePage.setContent('<!doctype html><html><body style="margin:0"><iframe style="width:1280px;height:720px;border:0" src="'+escape(tracked.toString())+'"></iframe></body></html>');
 await framePage.waitForTimeout(2000);
 const embedded=framePage.frames().find(f=>f!==framePage.mainFrame()&&f.url().startsWith(game.url));
 if(!embedded||!(await embedded.locator('body').isVisible().catch(()=>false)))errors.push('Embedded iframe content was not visible');
 else evidence.iframeRendered=true;
 await context.close();

 // Three CrazyGames cover formats from the real game's existing brand art.
 // These are explicitly cover art, NOT represented as gameplay screenshots.
 for(const [name,width,height] of [['landscape',1920,1080],['portrait',800,1200],['square',800,800]]){
   const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const p=await c.newPage();
   const tall=height>width,ratio=height/width;
   const font=Math.round(Math.min(width*.092,height*.115));
   const art=escape(game.preview);
   const css='html,body{margin:0;width:100%;height:100%;overflow:hidden}body{background:linear-gradient(135deg,#fff6e9,#ecf3ec 58%,#f4dce9);font-family:system-ui,-apple-system,sans-serif;color:#382a43;display:flex;align-items:center;justify-content:center}.hero{width:100%;height:100%;position:relative;overflow:hidden}.hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 10%,#fff 0%,transparent 55%);opacity:.8}.art{position:absolute;object-fit:cover;object-position:center;width:'+ (tall?'118%':'78%') +';height:'+(tall?'60%':'90%')+';top:'+(tall?'6%':'4%')+';left:'+(tall?'-9%':'21%')+';border-radius:28px;filter:drop-shadow(0 22px 25px #48384918)}h1{position:absolute;z-index:3;left:6%;bottom:'+(tall?'12%':'10%')+';max-width:88%;margin:0;font-size:'+font+'px;line-height:1.04;letter-spacing:-.055em;font-weight:950;text-wrap:balance;text-shadow:0 3px 0 #fff,0 0 24px #fff,0 0 40px #fff}';
   await p.setContent('<!doctype html><html><head><style>'+css+'</style></head><body><div class="hero"><img class="art" src="'+art+'"><h1>'+escape(game.title)+'</h1></div></body></html>');
   await p.waitForTimeout(1100);
   const valid=await p.locator('img.art').evaluate(img=>img.complete&&img.naturalWidth>0);
   if(!valid)errors.push('Game cover source unavailable for '+name+': '+game.preview);
   else {
     const file=path.join(out,'cover-'+name+'.png');
     await p.screenshot({path:file});
     evidence.covers.push({file:path.basename(file),width,height,source:game.preview});
   }
   await c.close();
 }

 // Record ACTUAL browser playback (not animation built from still images).
 // Two required aspect ratios; no soundtrack and no static-image video.
 if(['flip-dash','parcel-panic'].includes(slug)){
  for(const [label,width,height] of [['landscape',1280,720],['portrait',800,1200]]){
   const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
     recordVideo:{dir:out,size:{width,height}}});
   await blockTelemetry(c);
   const p=await c.newPage();
   const response=await p.goto(tracked.toString(),{waitUntil:'domcontentloaded',timeout:30000});
   if(response?.status()!==200){errors.push('Video page HTTP '+response?.status());await c.close();continue;}
   await p.waitForTimeout(650);
   const start=p.getByRole('button',{name:/^play now$|^play$/i}).first();
   if(await start.count())await start.click().catch(()=>{});
   const duration=16000,origin=Date.now();
   while(Date.now()-origin<duration){
     if(slug==='flip-dash')await p.keyboard.press('Space').catch(()=>{});
     if(slug==='parcel-panic'){
       const canvas=p.locator('canvas#game');
       const bounds=await canvas.boundingBox().catch(()=>null);
       if(bounds){
         // Human-like exploratory drag on the *real* running canvas.
         const sx=bounds.x+bounds.width*.50, sy=bounds.y+bounds.height*.23;
         await p.mouse.move(sx,sy);await p.mouse.down();
         await p.mouse.move(bounds.x+bounds.width*.72,bounds.y+bounds.height*.74,{steps:12});
         await p.mouse.up();
       }
     }
     await wait(750);
     const restart=p.getByRole('button',{name:/^play now$|^retry$|^play again$/i}).first();
     if(await restart.count()&&await restart.isVisible().catch(()=>false))await restart.click().catch(()=>{});
   }
   const video=p.video();
   await c.close();
   const raw=await video.path();
   const target=path.join(out,'real-gameplay-'+label+'.mp4');
   try {
     execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',raw,
       '-t','20','-an','-pix_fmt','yuv420p','-c:v','libx264','-crf','24','-preset','veryfast',target],{stdio:'pipe'});
     evidence.videos.push({file:path.basename(target),label,source:tracked.toString(),capture:'real Chromium session',audio:false});
     fs.rmSync(raw,{force:true});
   } catch(e){
     errors.push('Real-gameplay video conversion failed for '+label+': '+e.message.slice(0,100));
   }
  }
 }
} finally {
 await browser.close();
}
fs.writeFileSync(path.join(out,'preflight.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({game:slug,status:evidence.status,iframe:evidence.iframeRendered||false,
 covers:evidence.covers.map(x=>x.file),videos:evidence.videos.map(x=>x.file),errors},null,2));
if(errors.length)process.exitCode=1;
