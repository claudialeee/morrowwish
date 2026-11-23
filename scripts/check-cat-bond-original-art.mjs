// Verify the archived V13 original storyboard footage AND the current live
// game separately. Current battles must show the selected watercolor breeds.
// Old trailer metadata remains a historical record, not permission for fixed
// actors to reappear in newly captured live gameplay.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const must=(ok,message)=>{if(!ok)throw Error('CAT BOND PREMIUM ART QA: '+message)};
const read=path=>fs.readFileSync(path,'utf8');
const original=read('public/cat-bond/js/duo-bond.js');
const painter=read('public/cat-bond/js/duo-premium.js');
const loader=read('public/cat-bond/index.html');
const capture=read('scripts/capture-trailers-v10.mjs');
const render=read('scripts/render-trailers-v10.mjs');
const art='public/cat-bond/assets/duo-storyboard-21x3-v3.webp';
must(fs.existsSync(art)&&fs.statSync(art).size>2_000_000,'63-frame approved atlas missing');
// The published V13 artwork is historical; the live game must display
// the actual player's two selected watercolor cats, not fixed gallery cats.
must(original.includes('this.duoCinematic.originalArt=false;'),'Current live duo must use actual watercolor cat breeds');
must(!original.includes('this.duoCinematic.originalArt=true;'),'Current live duo cannot substitute fixed painting subjects');
must(painter.includes('duo-storyboard-21x3-v3.webp'),'Premium cinematic no longer loads the canonical atlas');
must(/js\/duo-bond\.js\?v=[\w-]+/.test(loader),'Current selected-cat duo JS must be cache-busted');
must(capture.includes("artMode:'63-original-painted-storyboards'") &&
  capture.includes("originalArt:b.duoCinematic?.originalArt===true"),
  'Capture does not prove real art mode at cast time');
must(render.includes('trailer-v13-20261122.mp4') &&
  render.includes("painted?.originalArt!==true"),
  'Render might silently substitute old video');
if(process.argv.includes('--source-only')){
 console.log('CAT BOND ORIGINAL ART SOURCE QA PASS');
 process.exit(0);
}
const m=JSON.parse(read('public/promo/v13-review.json'));
const audit=JSON.parse(read('public/promo/readability-audit-v13.json'));
const old=JSON.parse(read('public/promo/v12-review.json'));
must(m.version==='V13'&&m.trailers.length===7,'Missing complete new seven-game V13 review manifest');
must(m.socialAutopublish===false&&m.trailers.every(x=>x.approved===false&&x.published===false),
  'V13 must be owner review only, with no automatic social posting');
const cat=m.trailers.find(x=>x.slug==='cat-bond');
must(cat?.video==='/promo/cat-bond/trailer-v13-20261122.mp4','V13 points to stale v10 video');
must(cat?.poster==='/promo/cat-bond/trailer-v13-20261122.jpg','V13 poster not refreshed');
must(cat.originalDuoArtMode==='63-original-painted-storyboards' &&
  cat.originalDuoArtSource?.includes('duo-storyboard-21x3-v3.webp'),
  'Recorded duo provenance is missing');
const scenes=cat.shots.map(x=>x.scene||'end-card');
must(scenes.filter(x=>x==='duo').length===1&&!scenes.includes('ultimate'),
  'Old/duplicated finisher footage is still present');
const order=['rare-encounter','battle-hud','battle-skills','duo','rare-aftermath','rare-capture'];
must(order.every((x,i)=>scenes.indexOf(x)>=0&&(i===0||scenes.indexOf(x)>scenes.indexOf(order[i-1]))),
 'Real rare cat encounter -> skills -> duo -> capture chronology broken');
must(cat.duration>55&&cat.duration<60,'Review duration out of acceptable range');
must(audit.scenes.every(x=>x.passed),'Unreadable shot');
for(const slug of ['pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium']){
 const cur=m.trailers.find(x=>x.slug===slug),before=old.trailers.find(x=>x.slug===slug);
 must(cur&&before&&cur.video===before.video&&cur.poster===before.poster,
    'Modified unrelated game trailer: '+slug);
}
for(const item of m.trailers){
 for(const uri of [item.video,item.poster]){
  must(uri?.startsWith('/promo/')&&fs.existsSync('public'+uri)&&fs.statSync('public'+uri).size>0,
    'Missing review asset '+uri);
 }
}
const info=JSON.parse(execFileSync('ffprobe',['-v','error',
 '-show_entries','format=duration,size:stream=codec_type,width,height',
 '-of','json','public'+cat.video],{encoding:'utf8'}));
must(info.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920),
 'Not a native portrait master');
must(info.streams.some(s=>s.codec_type==='audio'),'Trailer music missing');
must(Number(info.format.duration)>55&&Number(info.format.duration)<60,'Encoded duration mismatch');
must(Number(info.format.size)>1_000_000,'Encoded video blank or truncated');
const shortPath='public/promo/cat-bond/hook-v13-original-duo-20261122.mp4';
const shortReport=JSON.parse(read('public/promo/cat-bond/hook-v13-original-duo-20261122.json'));
must(shortReport.sourceVideo===cat.video && shortReport.newGameplayCapture===true &&
 shortReport.oldHookReused===false && shortReport.originalDuoCasts===1 &&
 shortReport.originalDuoArtMode==='63-original-painted-storyboards' &&
 shortReport.earnedRareCapture===true && shortReport.published===false,
 'Corrected short is using old/duplicated finisher footage');
must(shortReport.scenes.map(s=>s.scene).join(',')===
 'rare-encounter,duo,rare-aftermath,rare-capture,end-card',
 'Corrected short must show one duo followed by its real rare capture');
must(fs.existsSync(shortPath)&&fs.statSync(shortPath).size>300_000,
 'No encoded V13 correction short');
const shortInfo=JSON.parse(execFileSync('ffprobe',['-v','error',
 '-show_entries','format=duration:stream=codec_type,width,height','-of','json',shortPath],{encoding:'utf8'}));
must(shortInfo.streams.some(s=>s.codec_type==='video'&&s.width===1080&&s.height===1920) &&
 shortInfo.streams.some(s=>s.codec_type==='audio') &&
 Number(shortInfo.format.duration)>9 && Number(shortInfo.format.duration)<11,
 'V13 social short audio, resolution or length invalid');
for(const path of ['public/promo/cat-bond/hook-v13-original-duo-proof.jpg',
 'public/promo/cat-bond/hook-v13-rare-result-proof.jpg'])
 must(fs.existsSync(path)&&fs.statSync(path).size>15000,'Missing short proof '+path);
const proof='public/promo/cat-bond/v13-duo-original-art-proof.png';
must(fs.existsSync(proof)&&fs.statSync(proof).size>50_000,'Missing screenshot at real duo attack');
console.log('V13 ORIGINAL 63-PAINTED-SCENE GAME AND TRAILER QA PASS',
 JSON.stringify({video:cat.video,art:cat.originalDuoArtSource,
  seconds:info.format.duration,bytes:info.format.size,proof,scenes:scenes.length}));
