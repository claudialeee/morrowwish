import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/zh-site.js','public/zh-stories.js','public/zh-polish.js',
  'public/studio-insights/index.html','public/art/morrowwish-mark.svg','public/pawsibly-innocent/index.html','public/pawsibly-innocent/game.js','public/icons/pawsibly-innocent.svg',
  'public/cat-bond/index.html','public/cat-bond/js/i18n.js','public/cat-bond/js/game.js','public/icons/cat-bond.svg','public/art/cat-bond-scene.svg',
  'src/worker.js','src/analytics.js','cloudflare-pages/wrangler.jsonc'
]) if (!fs.existsSync(file)) throw new Error('Missing required file: '+file);

// CrazyGames approval is an intentional per-game editorial release, never a batch.
const cgApproval=JSON.parse(fs.readFileSync('promotion/crazygames-quality-gate.json','utf8'));
const cgManual=fs.readFileSync('.github/workflows/crazygames-submit.yml','utf8');
const cgAuto=fs.readFileSync('.github/workflows/auto-publish-portals.yml','utf8');
const cgDirect=fs.readFileSync('scripts/crazygames-complete-drafts.mjs','utf8');
const cgAlternate=fs.readFileSync('scripts/auto-publish-crazygames.mjs','utf8');
if(!['hold','approved'].includes(cgApproval.status)||!Array.isArray(cgApproval.candidates)||cgApproval.candidates.length!==7)
 throw Error('CrazyGames quality gate must document exactly seven candidates and a valid hold/approved state');
if(!cgManual.includes('Enforce single-game external QA signoff')||!cgManual.includes('CRAZYGAMES_TARGET_SLUGS: ${{ inputs.slug }}')||cgManual.includes("    - cron:"))
 throw Error('CrazyGames manual workflow must enforce one QA-approved game and must not auto-run');
if(cgAuto.includes('run: node scripts/auto-publish-crazygames.mjs'))
 throw Error('CrazyGames automatic submission must stay disabled while quality QA is pending');
if(!cgDirect.includes('targetSlugs.length!==1')||!cgDirect.includes("gate.status!=='approved'")||
   !cgAlternate.includes("qualityGate.status!=='approved'"))
 throw Error('CrazyGames scripts must fail closed if not individually QA-approved');

const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
const social=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
if(social.schemaVersion!==1||social.platforms.find(x=>x.id==='instagram')?.views!==273)throw Error('Provider metrics snapshot must preserve available and unknown native metrics');
if(!fs.readFileSync('scripts/build-pages.mjs','utf8').includes('SOCIAL_SNAPSHOT'))throw Error('Metrics must be embedded in the protected analytics worker');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
// The mini-game upgrade already emits run_start/run_end. Do not count
// duplicate local game.js tracking events as extra sessions.
const miniUpgrade=fs.readFileSync('public/upgrade.js','utf8');
const analyticsSource=fs.readFileSync('src/analytics.js','utf8');
if(!miniUpgrade.includes('event("run_start"') ||
   !miniUpgrade.includes('event("run_end",{duration:seconds')) throw Error('Mini-game run events must reach the unified tracker');
if(!miniUpgrade.includes('window.__MWMiniActive=true')||
   !miniUpgrade.includes('event("run_abandoned",{reason:"restart"}')||
   !telemetry.includes('window.__MWMiniActive')||
   !analyticsSource.includes('abandons:sum(sessionsOf,"abandons")')||
   !dashboard.includes('miniNoWin:')||
   !dashboard.includes('const siteNum='))throw Error('Mini-game exit versus finish semantics and missing-channel display must remain accurate');
if(!telemetry.includes('"town_completed-win"||(n==="run_end"&&Number(p?.won)===1))eventCounts.completion++') ||
   !telemetry.includes('"town_completed-lose"].includes(n))eventCounts.ends++') ||
   !telemetry.includes('"level_complete"')) throw Error('Terminal gameplay events must be counted separately from clears');
if(!analyticsSource.includes('z.ends+=events.reduce') ||
   !dashboard.includes('data-i18n="colEnds"')) throw Error('Unified and itch.io dashboard must show finished runs');

const config=JSON.parse(fs.readFileSync('cloudflare-pages/wrangler.jsonc','utf8'));
if(config.name!=='morrowwish')throw Error('Wrong Cloudflare Pages project');
if(config.d1_databases?.[0]?.database_name!=='morrowwish-analytics')throw Error('Wrong D1 database');
if(!dashboard.includes('zh:"平行人生",en:"Elsewhere"'))throw Error('Dashboard must show 平行人生 in Chinese and Elsewhere in English');
const displayOrder=dashboard.match(/const displayOrder=\[([^\]]+)\];/)?.[1]||'';
for(const name of ['hub','elsewhere','tiny-town','pawsibly-innocent','cat-bond','flip-dash','parcel-panic','pocket-aquarium']){
 if(!displayOrder.includes("'"+name+"'"))throw Error('Dashboard missing visible game: '+name);
}
if(!dashboard.includes("'pocket-aquarium'"))throw Error('Pocket Aquarium must remain in dashboard order');
if(!telemetry.includes('"pocket-aquarium"'))throw Error('Pocket Aquarium must remain in telemetry');
const aquarium=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
for(const marker of ["metric('game_start'","metric('game_complete'","metric('game_retry'","feed_success","time=60","zh:{"]){
 if(!aquarium.includes(marker))throw Error('Pocket Aquarium V2 missing gameplay or analytics: '+marker);
}

if(!telemetry.includes('"elsewhere"'))throw Error('Missing Elsewhere telemetry');
if(!telemetry.includes('"pawsibly-innocent"'))throw Error('Missing Pawsibly Innocent telemetry');
if(!telemetry.includes('"cat-bond"'))throw Error('Missing Cat Bond telemetry');
// Cat Bond: bilingual real-time cat collector. Verify it is wired to unified
// analytics, keeps a complete ZH->EN layer, and loads the shared site scripts.
const bondGame=fs.readFileSync('public/cat-bond/js/game.js','utf8');
for(const marker of ['game_start','game_complete','game_over','game_retry','cat_capture']){
 if(!bondGame.includes(marker))throw Error('Cat Bond missing gameplay/analytics: '+marker);
}
const bondHTML=fs.readFileSync('public/cat-bond/index.html','utf8');
// Every active game module must keep a cache-buster, but the CI test must
// not pin a stale version when the game's battle mechanics are improved.
const bondScriptSources=[...bondHTML.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
for(const asset of ['js/data.js','js/worldmap.js','js/battle.js','js/real-kittens.js','js/game.js','js/ui.js','js/i18n.js']){
 if(!bondScriptSources.some(src=>src.startsWith(asset+'?v=')&&src.slice(asset.length+3).length>0))
  throw Error('Cat Bond game module must be cache-busted: '+asset);
}
for(const marker of ['/telemetry.js','/lang.js','js/i18n.js','href="/"']){
 if(!bondHTML.includes(marker))throw Error('Cat Bond page missing shared integration: '+marker);
}
const bondI18n=fs.readFileSync('public/cat-bond/js/i18n.js','utf8');
for(const marker of ['morrowwish-language-change','var DICT','猫猫纽带','Cat Bond']){
 if(!bondI18n.includes(marker))throw Error('Cat Bond bilingual layer incomplete: '+marker);
}
const catGame=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
for(const marker of ['game_start','game_complete','game_retry','cat_level_won','guardMove','morrowwish-language-change']){
 if(!catGame.includes(marker))throw Error('Pawsibly Innocent missing gameplay/analytics: '+marker);
}
const translationSource=fs.readFileSync('public/lang.js','utf8');
const homepage=fs.readFileSync('public/index.html','utf8');
const oneLineHero='和满院子的猫咪成为朋友，化身捣蛋小猫偷三条鱼，建造人人自由的小镇，或体验一段从未活过的人生。';
const heroMarkup=homepage.match(/<p class="hero-copy">([\s\S]*?)<\/p>/)?.[1]||'';
if(!heroMarkup.includes('<span class="hero-zh-copy" lang="zh-CN">'+oneLineHero+'</span>')||/<(?:wbr|br)\b/i.test(heroMarkup))
  throw Error('Homepage Chinese hero must keep all four worlds together as one unbroken sentence');
// Never reorder featured cards without updating BOTH homepage introductions.
// These checks compare real card order rather than preserving a stale fixed order.
const featuredOrder=[...homepage.matchAll(/<article class="feature-card[^"]*"><a class="card-hit" href="[^"]+" data-id="([^"]+)"/g)].map(m=>m[1]);
const phrases={
 'cat-bond':['和满院子的猫咪成为朋友','Befriend a yard full of cats','和满院子的猫咪一起成长'],
 'pawsibly-innocent':['化身捣蛋小猫偷三条鱼','steal three fish as a mischievous cat','化身小猫偷走三条鱼'],
 'tiny-town':['建造人人自由的小镇','build a town where everyone is free','建造人人自由的小镇'],
 'elsewhere':['体验一段从未活过的人生','explore a life you never lived','体验一段从未活过的人生']
};
const homeEnglish=homepage.match(/class="hero-en-copy">([^<]+)</)?.[1]||'';
const leadEnglish=homepage.match(/<section class="featured-section[^>]*>[\s\S]*?<div class="section-intro">[\s\S]*?<\/h2><\/div><p>([^<]+)</)?.[1]||'';
const leadZh=(translationSource.match(/"Raise a yard of cats and explore together[^"]*":"([^"]+)"/)||[])[1]||'';
for(const [index,id] of featuredOrder.entries()){
 if(!phrases[id])continue;
 const previous=featuredOrder.slice(0,index).filter(p=>phrases[p]);
 for(let i=0;i<3;i++){
  const copy=[oneLineHero,homeEnglish,leadZh][i];
  const marker=phrases[id][i];
  if(!copy.includes(marker)||previous.some(pr=>copy.indexOf(phrases[pr][i])>copy.indexOf(marker)))
   throw Error('Homepage descriptions must match featured ordering: '+id);
 }
}
const homeStyles=fs.readFileSync('public/hub.css','utf8');
if(!homeStyles.includes(".elsewhere-card h3{font-family:'Nunito'"))throw Error('Elsewhere heading must match other featured headings');
if((homepage.match(/class="card-hit"/g)||[]).length!==4)throw Error('All featured cards must have full-card pointer targets');
if(!homeStyles.includes('html[lang="zh-CN"] .hero .hero-zh-copy{display:block;white-space:nowrap;'))
  throw Error('Homepage Chinese hero no-wrap style is missing');
if(!homeStyles.includes('@media(max-width:700px)')||!homeStyles.includes('html[lang="zh-CN"] .hero>p.hero-copy{white-space:normal;overflow:visible;max-width:100%}')||!homeStyles.includes('html[lang="zh-CN"] .hero .hero-zh-copy{white-space:normal;overflow-wrap:break-word;'))
  throw Error('Homepage Chinese tagline must wrap naturally on phones instead of horizontal scrolling');
if(!homeStyles.includes('/* Balanced compact homepage: all game cards are reduced, never just the heading. */')||!homeStyles.includes('.feature-card{display:grid;grid-template-columns:minmax(0,59%) minmax(0,41%);height:272px;'))
  throw Error('Homepage must keep compact image-and-copy featured cards');
if(!homeStyles.includes('.hero-doodles{display:none}')||!homeStyles.includes('.tiny-section .mini-game{display:flex;flex-direction:column;min-height:0;height:208px;'))
  throw Error('Homepage decorative overlaps and oversized mini-game cards must not return');
if(homepage.includes('<h1>Little games.<br><em>'))throw Error('Homepage headline must not be forced into two giant lines');
if(!homepage.includes('/art/cat-bond-home.webp?v=1'))throw Error('Cat Bond card must use approved cat friendship illustration');
const catBondCardAsset=fs.readFileSync('public/art/cat-bond-home.webp');
if(catBondCardAsset.toString('ascii',0,4)!=='RIFF'||catBondCardAsset.toString('ascii',8,12)!=='WEBP')throw Error('Cat Bond approved image must be a valid WebP');

const featured=homepage.match(/<div class="feature-grid">([\s\S]*?)<\/div><\/section>/)?.[1]||'';
const minis=homepage.match(/<div class="mini-grid">([\s\S]*?)<\/div><\/div><\/section>/)?.[1]||'';
for(const link of ['href="/pawsibly-innocent/"','href="/elsewhere/"','href="/tiny-town/"','href="/cat-bond/"']){
 if(!featured.includes(link))throw Error('Missing signature world featured card: '+link);
}
if((featured.match(/class="feature-card/g)||[]).length!==4)throw Error('Four signature games required');
if(!featured.trimStart().startsWith('<article class="feature-card bond-feature-card">'))throw Error('Cat Bond must be the first featured game');
const featuredIds=[...featured.matchAll(/class="card-hit" href="\/[^"]+" data-id="([^"]+)"/g)].map(m=>m[1]);
if(JSON.stringify(featuredIds)!==JSON.stringify(['cat-bond','pawsibly-innocent','tiny-town','elsewhere']))
 throw Error('Featured games must follow the current Cat Bond-led homepage order');
const zhCard=featured.match(/<article class="feature-card cat-feature-card">([\s\S]*?)<\/article>/)?.[1]||'';
if(!zhCard.includes('猫猫绝对无辜！')||zhCard.includes('cat-original'))throw Error('Chinese homepage card must not display the English Pawsibly subtitle');
if(!homepage.includes('Three fish to steal. One human to fool.'))throw Error('Cat game marketing hook is missing');
if(!displayOrder.startsWith("'hub','cat-bond','pawsibly-innocent','tiny-town','elsewhere'"))throw Error('Studio dashboard game order must follow the homepage');
if(minis.includes('href="/pawsibly-innocent/"')||minis.includes('href="/cat-bond/"'))throw Error('Cat worlds must not be in mini-games');
for(const marker of ['function throwYarn','const EXTRAS=[','ROOM_REWARDS','souvenirs','function vacuumDraw','function roomDecor']){
 if(!catGame.includes(marker))throw Error('Cat expansion missing: '+marker);
}
const catHTML=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
for(const id of ['id="tool"','id="collection"','id="ability"'])if(!catHTML.includes(id))throw Error('Cat interface missing '+id);
if(!fs.readFileSync('public/art/pawsibly-scene.svg','utf8').includes('<svg'))throw Error('Featured cat art missing');
const approvedPawsiblyCover=fs.readFileSync('public/art/pawsibly-hatted-muted.avif');
if(!homepage.includes('/art/pawsibly-hatted-muted.avif?v=20261120')||approvedPawsiblyCover.length<4000||approvedPawsiblyCover.toString('ascii',4,12)!=='ftypavif')throw Error('Pawsibly homepage must use the approved muted hatted cat cover');

if(!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))throw Error('Missing Analytics authentication');
for(const file of ['README.md','CLAUDE.md','public/lang.js','public/telemetry.js','public/studio-insights/index.html']){
 const text=fs.readFileSync(file,'utf8');
 if(text.toLowerCase().includes(['ruckus','button'].join('-')))throw Error('Old project name remains in '+file);
}
// Keep the marketing dashboard compact and make sure all six live games are monitored.
const trackerSource=fs.readFileSync('src/analytics.js','utf8');
if(!telemetry.includes('hubClickVersion:game==="hub"?1')||!telemetry.includes('signal("hub_card_"')||!trackerSource.includes('const homeFunnel='))throw Error('Homepage click attribution must be instrumented, versioned and private');
if(!trackerSource.includes('"cat-bond","elsewhere"'))throw Error('Cat Bond acquisition must be included in reporting');
if(!dashboard.includes('id="hub-funnel"'))throw Error('Homepage conversion data must appear in compact dashboard');

const arcadeSource=fs.readFileSync('public/upgrade.js','utf8');
for(const id of ['pawsibly-innocent','elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium']){
 if(!dashboard.includes("id:'"+id+"'"))throw new Error('Gameplay insight missing published game '+id);
}
for(const metric of ['flip_finished','flip_10s','flip_30s','parcel_sorted','parcel_missed','parcel_ten_sorted']){
 if(!telemetry.includes(metric))throw new Error('Missing game telemetry signal '+metric);
}
if(!arcadeSource.includes('event("parcel_sorted",')||!arcadeSource.includes('event("parcel_missed",'))
 throw new Error('Parcel Panic outcome instrumentation missing');
if(!trackerSource.includes('const byChannel=')||!dashboard.includes('j.byChannel')||!dashboard.includes('j.socialPulse')||dashboard.includes('j.byGameChannel'))
 throw new Error('Dashboard must use grouped acquisition-channel rollups');
// Marketing reporting may be displayed as a curated platform table or a
// compact top-channel rollup. Verify actual source attribution and its UI target
// instead of hard-coding a presentation implementation from another release.
if(!dashboard.includes('id="channel-rows"') || !dashboard.includes('j.byChannel'))
 throw new Error('Promotion channel UI must retain source-attributed analytics');
if(!dashboard.includes('<details class="ew-details"><summary data-ew="more">'))
 throw new Error('Elsewhere scene details should remain collapsed by default');
console.log('Six game analytics cards, compact acquisition channels and actionable telemetry checked.');

console.log('Morrow Wish Cloudflare Pages source, Analytics, branding and game labels checked.');
await import('./check-pawsibly.mjs');
await import('./check-cat-bond.mjs');

// Prevent decorative starburst glyphs from leaking back into any published page,
// SVG social card, dynamically generated game copy, or language map.
const starburst=String.fromCodePoint(0x2733);
function auditPublishedText(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=dir+'/'+entry.name;
  if(entry.isDirectory()){auditPublishedText(file);continue}
  if(!/\.(?:html?|css|js|svg|json|xml|txt|webmanifest)$/.test(entry.name))continue;
  const content=fs.readFileSync(file,'utf8');
  if(content.includes(starburst)||/&#(?:10035|x2733);|\\u2733/i.test(content))
   throw new Error('Unwanted starburst glyph found in published file: '+file);
 }
}
auditPublishedText('public');
console.log('Published pages and UI source contain no starburst glyphs.');



// Elsewhere: every route must lead to a complete, illustrated, bilingual ending.
import vm from 'node:vm';
const storySandbox={window:{}};
for(const file of ['public/elsewhere/season.js','public/elsewhere/endings.js','public/zh-polish.js']){
  vm.runInNewContext(fs.readFileSync(file,'utf8'),storySandbox,{filename:file,timeout:2000});
}
const storyWorlds=storySandbox.window.ELSEWHERE_SEASON||[];
const storyEndings=storySandbox.window.ELSEWHERE_ENDINGS||{};
if(storyWorlds.length!==4)throw Error('Elsewhere must have four complete worlds');
if(!fs.readFileSync('public/elsewhere/index.html','utf8').includes('/elsewhere/endings.js'))throw Error('Elsewhere ending script is not loaded');
const storyApp=fs.readFileSync('public/elsewhere/app.js','utf8');
if(!storyApp.includes('const anchor=')||!storyApp.includes('function resolveEnding()'))throw Error('Elsewhere continuity logic missing');
for(const world of storyWorlds){
  const endings=storyEndings[world.id];
  if(world.acts.length!==8||world.acts.some(act=>act.choices.length!==2||!act.n[0]))throw Error('Incomplete story: '+world.id);
  if(endings?.paths.length!==2||endings.paths.some(p=>p.finales.length!==2)||endings.memories.length<2)throw Error('Incomplete ending matrix: '+world.id);
  for(const path of endings.paths){
    const asset='public/elsewhere/endings/'+path.image;
    if(!fs.existsSync(asset)||!fs.readFileSync(asset,'utf8').includes('<svg'))throw Error('Missing ending illustration: '+asset);
    for(const finale of path.finales){
      if(!finale.title?.[0]||!finale.title?.[1]||!finale.detail?.[0]||!finale.detail?.[1])throw Error('Missing bilingual ending: '+world.id);
    }
  }
}
console.log('Elsewhere branching logic, 32 scenes, 16 endings and 8 SVG illustrations checked.');

// Elsewhere continuity v3: translated tradeoffs, conditional callbacks, and no conjured plot items.
const continuitySrc='public/elsewhere/continuity.js';
if(!fs.existsSync(continuitySrc))throw Error('Missing Elsewhere continuity engine');
const continuitySandbox={window:{}};
vm.runInNewContext(fs.readFileSync(continuitySrc,'utf8'),continuitySandbox,{filename:continuitySrc,timeout:2000});
const continuity=continuitySandbox.window.ELSEWHERE_CONTINUITY;
if(!continuity?.beats||!continuity.hints||!continuity.overrides)throw Error('Missing continuity structure');
const elsewherePage=fs.readFileSync('public/elsewhere/index.html','utf8');
if(!elsewherePage.includes('/elsewhere/continuity.js'))throw Error('Continuity engine not loaded');
const elsewhereServiceWorker=fs.readFileSync('public/elsewhere/sw.js','utf8');
if(!elsewhereServiceWorker.includes('/elsewhere/continuity.js')||!elsewhereServiceWorker.includes('/elsewhere/endings.js'))throw Error('Offline scripts missing from Elsewhere cache');
if(!storyApp.includes('BECAUSE OF AN EARLIER CHOICE')||!storyApp.includes('c.hint')||!storyApp.includes('morrowwish-language-change'))throw Error('Elsewhere story reminder, choice hints or language switching missing');
for(const world of storyWorlds){
  const hints=continuity.hints[world.id],beats=continuity.beats[world.id],overrides=continuity.overrides[world.id]||{};
  if(hints?.length!==8||!beats||Object.keys(beats).length<4)throw Error('Incomplete choice consequences: '+world.id);
  for(let scene=0;scene<8;scene++){
    if(hints[scene]?.length!==2||hints[scene].some(v=>v.length!==2||!v[0]||!v[1]))throw Error('Missing bilingual choice hints: '+world.id+' scene '+(scene+1));
  }
  for(const [sceneStr,beat] of Object.entries(beats)){
    const scene=Number(sceneStr);
    if(!Number.isInteger(scene)||scene<1||scene>7||beat.from<0||beat.from>=scene||beat.echo?.length!==2
       ||beat.echo.some(t=>t?.length!==2||!t[0]||!t[1])||beat.echo[0][0]===beat.echo[1][0])throw Error('Invalid story consequence: '+world.id+' scene '+sceneStr);
  }
  for(const [sceneStr,override] of Object.entries(overrides)){
    const scene=Number(sceneStr);
    if(!Number.isInteger(scene)||scene<1||scene>7||override.from<0||override.from>=scene
      ||override.variants?.length!==2)throw Error('Invalid conditional option: '+world.id+' scene '+sceneStr);
    for(const v of override.variants){
      if(v!==null&&(v.choice<0||v.choice>1||v.label?.length!==2||v.reply?.length!==2||!v.label[1]||!v.reply[1]))throw Error('Missing localized conditional option: '+world.id+' scene '+sceneStr);
    }
  }
}
// Before scene 4, the Paris missing reel must be found rather than silently appearing.
if(!continuity.overrides.paris[3].variants[0]?.label?.[0].includes('newsreels'))throw Error('Paris reel continuity regression');
if(!storyWorlds.find(w=>w.id==='cabin').acts[7].clock.includes('SPRING'))throw Error('Cabin timeline must allow repairs to finish');
for(const source of ['public/elsewhere/app.js','public/elsewhere/season.js','public/elsewhere/endings.js',continuitySrc,'public/zh-polish.js']){
  new vm.Script(fs.readFileSync(source,'utf8'),{filename:source});
}
console.log('Elsewhere continuity, bilingual decisions, conditional film option, seasonal timeline, and syntax checked.');


// Elsewhere mystery validation: real choice and exploration gating, persistent endings, bilingual art.
const mysterySource='public/elsewhere/mysteries.js';
const mysterySandbox={window:{}};
vm.runInNewContext(fs.readFileSync(mysterySource,'utf8'),mysterySandbox,{filename:mysterySource,timeout:2000});
const mysteries=mysterySandbox.window.ELSEWHERE_MYSTERIES||{};
const mysteryPage=fs.readFileSync('public/elsewhere/index.html','utf8');
const offlineScript=fs.readFileSync('public/elsewhere/sw.js','utf8');
if(!mysteryPage.includes('/elsewhere/mysteries.js')||!offlineScript.includes('/elsewhere/mysteries.js'))throw Error('Hidden story module missing from public or offline app');
for(const token of ['function mysteryState()','function recordEnding(','COLLECTION_KEY','active.inspected','mystery-rare','HIDDEN STORY DISCOVERED']){
 if(!storyApp.includes(token))throw Error('Missing functional Elsewhere story mechanic: '+token);
}
const seenMysteryArts=new Set();
for(const w of storyWorlds){
 const data=mysteries[w.id];
 if(!data||data.steps?.length!==4||data.hooks?.length!==3||data.teasers?.length!==3||data.result?.length!==2)
   throw Error('Incomplete hidden narrative: '+w.id);
 const properPair=p=>Array.isArray(p)&&p.length===2&&p.every(x=>typeof x==='string'&&x.trim().length>0);
 for(const pair of [data.name,data.description,data.revealing,data.closing,...data.hooks,...data.teasers])
   if(!properPair(pair))throw Error('Untranslated mystery copy: '+w.id);
 for(const conclusion of data.result)
   for(const value of [conclusion.title,conclusion.sub,conclusion.detail])
     if(!properPair(value))throw Error('Untranslated hidden ending: '+w.id);
 if(seenMysteryArts.has(data.art))throw Error('Ending art must be unique: '+data.art);
 seenMysteryArts.add(data.art);
 const art='public/elsewhere/endings/'+data.art;
 const xml=fs.readFileSync(art,'utf8');
 if(!xml.startsWith('<svg')||!xml.includes('</svg>')||!xml.includes('viewBox'))throw Error('Secret illustration invalid: '+art);
 for(const r of data.steps){
   if(!Number.isInteger(r.at)||r.at<0||r.at>=8||!properPair(r.label))throw Error('Invalid clue requirement: '+w.id);
   const isInspection=r.inspect!==undefined, isChoice=r.choice!==undefined;
   if(isInspection===isChoice)throw Error('Clue must require exactly one interaction: '+w.id);
   if(isInspection&&(!Number.isInteger(r.inspect)||r.inspect<0||r.inspect>=w.acts[r.at].inspect.length))
     throw Error('Mystery refers to absent inspection: '+w.id);
   if(isChoice&&(!Number.isInteger(r.choice)||r.choice<1||r.choice>w.acts[r.at].choices.length))
     throw Error('Mystery refers to absent choice: '+w.id);
 }
 let secrets=0,normal=0;
 // Simulate 2^8 story paths, both with and without discovered objects.
 for(let bits=0;bits<256;bits++){
   const decisions=Array.from({length:8},(_,i)=>1+(bits>>i&1));
   for(const inspected of [false,true]){
     const matched=data.steps.every(r=>r.choice!==undefined?decisions[r.at]===r.choice:inspected);
     if(matched)secrets++;else normal++;
     const next=decisions[7]-1;
     const final=matched?data.result[next]:storyEndings[w.id].paths[decisions[6]-1].finales[next];
     if(!properPair(final.title)||!properPair(final.detail))throw Error('Unreachable or malformed ending: '+w.id);
   }
 }
 if(secrets<1||normal<1)throw Error('Hidden ending cannot be both earned and missed: '+w.id);
 console.log(w.id+': '+secrets+' hidden and '+normal+' regular simulated completions');
}
for(const source of [mysterySource,'public/elsewhere/app.js'])new vm.Script(fs.readFileSync(source,'utf8'),{filename:source});
console.log('Elsewhere mystery validation: 2,048 simulated ending paths, four secret illustrations, old save support, and bilingual endings checked.');


// Four distinctly styled cheerful CC0 recordings, no shared Lo-fi fallback.
const originalMusic=fs.readFileSync('public/studio-music.js','utf8');
new vm.Script(originalMusic,{filename:'public/studio-music.js'});
const bgmTracks={
 'tiny-town':{hex:'5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033',title:'Happy Whistling Ukulele'},
 'flip-dash':{hex:'5570626561742f496e76656e74696e6720466c696768742e6d7033',title:'Inventing Flight'},
 'parcel-panic':{hex:'5570626561742f46756e7368696e652e6d7033',title:'Funshine'},
 'pocket-aquarium':{hex:'576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033',title:'Connecting Rainbows'}
};
for(const [slug,{hex,title}] of Object.entries(bgmTracks)){
 const page=fs.readFileSync('public/'+slug+'/index.html','utf8');
 if(!page.includes('src="/studio-music.js"')||!page.includes('src="/studio-audio.js"'))
  throw new Error('Music and SFX must both load: '+slug);
 if(!page.includes('rel="preload" as="audio"')||!page.includes('https://en.freepd.cn/api/music/'+hex))
  throw new Error('Bright BGM must preload from FreePD: '+slug);
 if(!originalMusic.includes("'"+slug+"':")||!originalMusic.includes(hex)||!originalMusic.includes(title))
  throw new Error('Bright BGM profile missing: '+slug);
}
if(originalMusic.includes('aeris-cc0-music')||originalMusic.includes('createOscillator')||
   originalMusic.includes('bedroom-window-vast.mp3')||originalMusic.includes('FALLBACK+track.file'))
 throw new Error('Retired dark/bass-heavy Lo-fi or synthesizer music is still configured');
const tinyMusicPage=fs.readFileSync('public/tiny-town/index.html','utf8');
for(const marker of ['function portrait(person)','data:image/webp;base64,','function homesView(','fans=state.residents.filter(']){
 if(!tinyMusicPage.includes(marker))throw new Error('Tiny Town polish missing: '+marker);
}
if(!fs.readFileSync('public/studio-audio.js','utf8').includes('[data-mw-music]'))
 throw new Error('Music toggle must not trigger the sound effects button');
console.log('Game music: 4 original profiles, independent bilingual controls, and 12 illustrated portraits checked.');

// Five-scene Elsewhere runtime validation: test the actual adapter and the release HTML.
const fiveSceneSandbox={window:{}};
const copyForVm=x=>JSON.parse(JSON.stringify(x));
for(const path of ['public/elsewhere/season.js','public/elsewhere/continuity.js',
  'public/elsewhere/endings.js','public/elsewhere/mysteries.js']){
  vm.runInNewContext(fs.readFileSync(path,'utf8'),fiveSceneSandbox,{filename:path,timeout:3000});
}
vm.runInNewContext(fs.readFileSync('public/elsewhere/fast-story.js','utf8'),{
  window:fiveSceneSandbox.window,structuredClone:copyForVm},{filename:'public/elsewhere/fast-story.js',timeout:3000});
const fastWorlds=fiveSceneSandbox.window.ELSEWHERE_SEASON;
const fastMysteries=fiveSceneSandbox.window.ELSEWHERE_MYSTERIES;
const fastContinuity=fiveSceneSandbox.window.ELSEWHERE_CONTINUITY;
if(fiveSceneSandbox.window.ELSEWHERE_FAST_STORY_VERSION!==3)throw Error('Unexpected Elsewhere fast-story version');
for(const world of fastWorlds){
  if(world.acts.length!==5)throw Error('Five-scene story regression: '+world.id);
  for(const [i,act] of world.acts.entries()){
    if(act.choices.length!==2||!act.n[0]||!act.clock||!act.loc)throw Error('Incomplete five-scene act: '+world.id+' '+i);
    if(!fastContinuity.hints[world.id]?.[i]||fastContinuity.hints[world.id][i].length!==2)
      throw Error('Missing contextual tradeoff: '+world.id+' '+i);
    if(!fiveSceneSandbox.window.MORROW_ZH_STORIES[act.n[0]])
      throw Error('Untranslated new story scene: '+world.id+' '+i);
  }
  const secret=fastMysteries[world.id];
  if(secret.steps.some(piece=>piece.at>=5))throw Error('Secret still requires removed scene: '+world.id);
  let reachable=0;
  for(let mask=0;mask<32;mask++){
    const picks=Array.from({length:5},(_,i)=>1+(mask>>i&1));
    if(secret.steps.every(piece=>piece.choice===undefined||picks[piece.at]===piece.choice))reachable++;
  }
  if(reachable<=0||reachable>=32)throw Error('Secret should require specific choices: '+world.id);
}
const fastPage=fs.readFileSync('public/elsewhere/index.html','utf8');
const ordered=['/elsewhere/season.js','/elsewhere/continuity.js','/elsewhere/mysteries.js',
  '/elsewhere/fast-story.js','/elsewhere/app.js'];
if(!ordered.every((x,i)=>i===0||fastPage.indexOf(ordered[i-1])<fastPage.indexOf(x)))
  throw Error('Elsewhere scripts load in wrong order');
if(!fastPage.includes('/elsewhere/music.js'))throw Error('Elsewhere music auto-start script not mounted');
if(!fastPage.includes('A LETTER FROM ELSEWHERE')||!fastPage.includes('The bookshop by the sea has ten days left on its lease.'))
  throw Error('Elsewhere must introduce its worlds through the story letter');
if(!fastPage.includes('<details class="letter-details">'))
  throw Error('Elsewhere play and data disclosure must be separate and collapsed');
if(fastPage.includes('not live generative AI')||fastPage.includes('pseudonymous browser and play-session identifiers, chapter progress'))
  throw Error('Technical disclaimers must not dominate the Elsewhere story letter');
if(!fastPage.includes('https://incompetech.com/music/royalty-free/')||!fastPage.includes('creativecommons.org/licenses/by/4.0'))
  throw Error('Elsewhere must give the composer and Creative Commons attribution');
for(const src of ['public/elsewhere/music.js','public/elsewhere/fast-story.js','public/elsewhere/app.js']){
  new vm.Script(fs.readFileSync(src,'utf8'),{filename:src});
}
const fastApp=fs.readFileSync('public/elsewhere/app.js','utf8');
for(const pattern of ['storyVersion:3','const route=active.decisions[3]','const next=active.decisions[4]',
  'elsewhere_endings_collection_v1','window.ElsewhereMusic?.setEnding(active.world)']){
  if(!fastApp.includes(pattern))throw Error('Five-scene app requirement missing: '+pattern);
}
if(!fastApp.includes('ending-illustration'))throw Error('Full-size illustrated ending view missing');
const musicSource=fs.readFileSync('public/elsewhere/music.js','utf8');
for(const pattern of ['audio.autoplay=enabled','if(enabled)start();','setWorld:switchTo','setEnding:','CC BY 4.0','Kevin MacLeod','Carefree.mp3']){
 if(!musicSource.includes(pattern))throw Error('Missing immediate and licensed soundtrack handling: '+pattern);
}
console.log('Five-scene Elsewhere runtime validation: four short lives, reachable secrets, translated story, illustrated endings and immediate music attempt checked.');

const letterZh=fs.readFileSync('public/zh-polish.js','utf8');
if(!letterZh.includes('来自《平行人生》的一封信')||!letterZh.includes('海边书店的租约只剩十天'))
  throw Error('Elsewhere letter needs authored, natural Chinese');
if(musicSource.includes('farmmer938-lgtm/aeris-cc0-music')||musicSource.includes('0xabad1dea/glorytales')||musicSource.includes('evergreen-open-road.mp3')||musicSource.includes('CatsEyeWaltz'))
  throw Error('Previous mismatched soundtrack is still in use');
const melodyPaths=['Carefree.mp3','Life of Riley.mp3','Bossa Antigua.mp3','Easy Lemon.mp3','Porch Swing Days - slower.mp3'];
for(const track of melodyPaths)if(!musicSource.includes(track))throw Error('Missing licensed instrumental theme: '+track);
const cheerfulMusic=fs.readFileSync('public/elsewhere/music.js','utf8');
if(!cheerfulMusic.includes("home:'Carefree.mp3'")||
 !cheerfulMusic.includes("'no-work':'Life of Riley.mp3'")||
 !cheerfulMusic.includes("bookshop:'Bossa Antigua.mp3'")||
 !cheerfulMusic.includes("paris:'Easy Lemon.mp3'")||
 !cheerfulMusic.includes("cabin:'Porch Swing Days - slower.mp3'"))
 throw Error('Elsewhere soundtrack must stay consistently warm, bright and relaxed');
if(!cheerfulMusic.includes('if(tracks[world]===tracks[next])'))
 throw Error('Elsewhere should continue the same melody into its ending');
if(!cheerfulMusic.includes('encodeURIComponent(tracks[world])'))
 throw Error('Elsewhere music filenames require URI encoding');
if(!fastPage.includes('Music by <a')||!fastPage.includes('Kevin MacLeod'))
 throw Error('New music author and title credits missing');
console.log('Elsewhere musical redesign and story letter copy checked.');


// Native media looping fixes browser-suspended Web Audio oscillators.
const immediateMusic=fs.readFileSync('public/studio-music.js','utf8');
for(const marker of ['if(enabled)play(); // Attempt immediately','audio.loop=true',
 'audio.addEventListener(\'playing\'','audio.addEventListener(\'error\'',
 'audio.src=track.url',"evt.target?.closest?.('[data-mw-music]')"]){
 if(!immediateMusic.includes(marker))throw new Error('Robust licensed BGM missing: '+marker);
}
for(const slug of ['tiny-town','flip-dash','parcel-panic','pocket-aquarium']){
 const html=fs.readFileSync('public/'+slug+'/index.html','utf8');
 if(!html.includes('rel="preload" href="/studio-music.js" as="script"'))throw new Error('Music should preload: '+slug);
}
const newsTopPage=fs.readFileSync('public/tiny-town/index.html','utf8');
const newsTopIndex=newsTopPage.indexOf('<section class="panel tt-news-panel"');
const guideIndex=newsTopPage.indexOf('<div class="tt-journey"');
if(newsTopIndex<0||guideIndex<0||newsTopIndex>guideIndex||
   !newsTopPage.includes('function newsText(el)')||
   !newsTopPage.includes('el.dataset.week=String(state?.turn||0)')||
   !newsTopPage.includes("state.last.pending.map(c=>zhClubs[c.name]||c.name)"))
 throw new Error('Town News must appear above gameplay and update in both languages');
console.log('Immediate music start and top-positioned bilingual Town News checked.');


// Elsewhere's primary escape route must match all studio games: the first
// interactive item in the header returns to Morrow Wish, not the life picker.
const elsewhereHeader=fs.readFileSync('public/elsewhere/index.html','utf8');
const navStart=elsewhereHeader.indexOf('<header class="topbar">');
const navEnd=elsewhereHeader.indexOf('</header>',navStart);
if(navStart<0||navEnd<0)throw new Error('Missing Elsewhere header');
const nav=elsewhereHeader.slice(navStart,navEnd);
const studioLink=nav.indexOf('<a class="studio-home studio-home-leading" href="/"');
const internalLink=nav.indexOf('<a href="/elsewhere/" class="brand" id="brand"');
if(studioLink<0||internalLink<0||studioLink>internalLink)
  throw new Error('Elsewhere header must lead with the Morrow Wish homepage link');
if((nav.match(/href="\/"(?=\s|>)/g)||[]).length!==1)
  throw new Error('Elsewhere header must have one unambiguous studio-home link');
if(!nav.includes('id="home-btn"')||!nav.includes('id="brand"'))
  throw new Error('Elsewhere life-picker navigation must remain available');
const elsewhereStyles=fs.readFileSync('public/elsewhere/style.css','utf8');
if(!elsewhereStyles.includes('.topbar-start')||!elsewhereStyles.includes('.topbar>#mw-language'))
  throw new Error('Elsewhere desktop and mobile nav responsive layout missing');
console.log('Elsewhere top-left homepage navigation, internal life picker and mobile layout checked.');

// Parcel Panic must be genuinely playable with one click or 1/2/3 keys on laptops,
// while retaining touch drag and the old analytics/achievements event contracts.
{
 const src=fs.readFileSync('public/upgrade.js','utf8');
 const from=src.indexOf('G["parcel-panic"]=()=>{'),to=src.indexOf('const factory=G[id]',from);
 if(from<0||to<0)throw Error('Parcel Panic factory missing');
 const factory=src.slice(from,to);
 function play(actions,lang='en'){
  const G={},events=[];let points=0,finishes=0,status='';
  const env={G,seeded:()=>()=>.5,seed:'test',combo:0,shake:0,
   colors:['#47ddfc','#ffcb68','#fd79a8'],clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),
   info:v=>status=v,add:x=>{points+=x},winEffect:()=>{env.combo++},
   finish:()=>{finishes++},burst:()=>{},tone:()=>{},vibrate:()=>{},rnd:()=>1,
   event:(name,data)=>events.push({name,data}),bg:()=>{},box:()=>{},line:()=>{},
   txt:()=>{},glow:()=>{},circ:()=>{},
   window:{mwMiniDelivered:0,MorrowwishI18n:{get:()=>lang}},
   document:{documentElement:{lang:lang==='zh'?'zh-CN':'en'}}};
  const mode=new Function(...Object.keys(env),factory+'return G["parcel-panic"]();')(...Object.values(env));
  mode.init();for(const step of actions)mode[step[0]](...step.slice(1));
  return {points,events,delivered:env.window.mwMiniDelivered,finishes,status};
 }
 const ready=[['tick',.6]];
 const good=[
  ['click correct lane',play([...ready,['down',190,460],['up',190,460]])],
  ['keyboard 1',play([...ready,['key','1']])],
  ['arrow left',play([...ready,['key','ArrowLeft']])],
  ['touch drag',play([...ready,['down',480,167],['move',190,455],['up',190,455]])]
 ];
 for(const [name,result] of good){
  if(result.points<14||result.delivered!==1||result.events.filter(x=>x.name==='parcel_sorted').length!==1)
   throw Error('Parcel Panic correct sort failed '+name+': '+JSON.stringify(result));
 }
 const wrong=play([...ready,['down',770,460],['up',770,460]]);
 if(wrong.points!==0||wrong.events.filter(x=>x.name==='parcel_missed').length!==1)
  throw Error('Parcel Panic wrong lane must count as a miss');
 const empty=play([['down',190,450],['up',190,450]]);
 if(empty.points!==0||empty.events.length)throw Error('Empty dock cannot score');
 const three=play([...ready,['key','1'],['tick',.2],['key','2'],['tick',.2],['key','3']]);
 if(three.points<42||three.delivered!==3||three.events.filter(x=>x.name==='parcel_sorted').length!==3)
  throw Error('Sequential parcels or combos broken: '+JSON.stringify(three));
 const zh=play([...ready,['key','1']], 'zh');
 if(!zh.status.includes('已送达')&&!zh.status.includes('直接点击'))throw Error('One-click Chinese hints missing');
 const page=fs.readFileSync('public/parcel-panic/index.html','utf8');
 const translations=fs.readFileSync('public/zh-mini.js','utf8');
 if(!page.includes('click its color lane or press 1, 2, or 3')||
    !translations.includes('按顺序分拣包裹')||
    !factory.includes('NEXT PARCEL'))throw Error('One-click onboarding copy missing');
 console.log('Parcel Panic: one-click, keyboard, touch drag, wrong/empty lane, combos and zh copy passed.');
}


// Nonintrusive, no-account feedback coverage for every published game.
{
 const pulse=fs.readFileSync('public/playtest-pulse.js','utf8');
 new vm.Script(pulse,{filename:'public/playtest-pulse.js'});
 const tracker=fs.readFileSync('public/telemetry.js','utf8');
 const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
 for(const id of ['pawsibly-innocent','flip-dash','parcel-panic','pocket-aquarium']){
  const html=fs.readFileSync('public/'+id+'/index.html','utf8');
  if(!html.includes('/playtest-pulse.js'))throw Error('Optional post-run feedback missing: '+id);
  if(!pulse.includes("'"+id+"'"))throw Error('Feedback game route missing: '+id);
 }
 if(!tracker.includes('play_feedback_not_fun')||!dashboard.includes('feelPrefix')||
    !dashboard.includes("play_feedback_"))throw Error('Game feedback signals are not in the unified dashboard');
 if(!fs.readFileSync('public/tiny-town/index.html','utf8').includes('feedbackQuestion'))
  throw Error('Tiny Town existing playtest feedback missing');
 if(!fs.readFileSync('public/elsewhere/app.js','utf8').includes('ending_feedback'))
  throw Error('Elsewhere existing ending feedback missing');
 console.log('All six published games offer post-play feedback without any registration.');
}


// Game-onboarding and aquarium mood regression: no returning-player autostart.
{
 const upgrade=fs.readFileSync('public/upgrade.js','utf8');
 if(upgrade.includes('event("auto_start")')||
    !upgrade.includes('showReadyScreen();')||
    !upgrade.includes('goBtn.onclick=()=>window.start();')||
    !upgrade.includes('if(!running&&extras.hidden)showReadyScreen()'))
  throw Error('Flip Dash and Parcel Panic must wait for an explicit Play click on every visit');
 const aq=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
 const match=[...aq.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function endingFor()'));
 if(!match)throw Error('Pocket Aquarium endings script missing');
 new vm.Script(match,{filename:'pocket-aquarium game'});
 for(const end of ['festival','clear','friends','calm','rest']){
  if(!match.includes(end+':{icon:'))throw Error('Aquarium ending missing '+end);
  if(!match.includes("ending:lastEnding"))throw Error('Aquarium analytics should identify the ending');
 }
 const decision=match.match(/function endingFor\(\)\{return ([^\n]+)\}/)?.[1];
 if(!decision)throw Error('Aquarium outcome evaluator missing');
 const expected=[
  [{score:550,fed:13,quality:90},'festival'],
  [{score:90,fed:4,quality:90},'clear'],
  [{score:190,fed:7,quality:66},'friends'],
  [{score:0,fed:0,quality:27},'rest'],
  [{score:0,fed:0,quality:64},'calm']
 ];
 for(const [run,answer] of expected){
  const found=new Function('score','fed','quality','return '+decision)(run.score,run.fed,run.quality);
  if(found!==answer)throw Error('Aquarium outcome regression '+answer+' vs '+found);
 }
 const gameplay=match.slice(match.indexOf('function update(dt)'),match.indexOf('function paintFish('));
 if(gameplay.includes('finish(true)')||gameplay.includes('quality<=0')||
    !gameplay.includes('if(time<=0)finish()')||
    !match.includes('quality=cap(quality+3.2,18,100)')||
    !match.includes("state='playing';$('overlay').hidden=true"))
   throw Error('Aquarium should complete 60s with restorative, non-punishing water mechanics');
 const dashboardText=fs.readFileSync('public/studio-insights/index.html','utf8');
 const trackerText=fs.readFileSync('public/telemetry.js','utf8');
 if(!dashboardText.includes("['fishFinished','aquarium_completed']")||
    !trackerText.includes('signal("aquarium_completed")'))
   throw Error('Aquarium 60-second completion telemetry missing from unified dashboard');
 console.log('Five aquarium endings and click-to-start arcade flow verified.');
}


// Three flagship games must offer direct share destinations, not clipboard-only buttons.
{
 const helper=fs.readFileSync('public/social-share.js','utf8');
 new vm.Script(helper,{filename:'public/social-share.js'});
 for(const host of [
  'twitter.com/intent/tweet','facebook.com/sharer/sharer.php',
  'reddit.com/submit','api.whatsapp.com/send',
  'bsky.app/intent/compose','t.me/share/url'
 ]){
  if(!helper.includes(host))throw Error('Missing social share destination: '+host);
 }
 if(!helper.includes('message:typeof raw.message')||
    !helper.includes('onShare:typeof raw.onShare')||
    !helper.includes("opts.onShare?.(platform)")||
    !helper.includes("opts.meta"))
   throw Error('Shared social dialog must support truthful story captions and game analytics');
 const pages=[
  ['tiny-town','public/tiny-town/index.html','MorrowwishSocialShare.open({'],
  ['elsewhere','public/elsewhere/index.html','/elsewhere/app.js'],
  ['pawsibly-innocent','public/pawsibly-innocent/index.html','/pawsibly-innocent/game.js']
 ];
 for(const [name,path,marker] of pages){
  const html=fs.readFileSync(path,'utf8');
  if(!html.includes('/social-share.js')||!html.includes(marker))
   throw Error(name+' must load the shared social modal');
 }
 const town=fs.readFileSync('public/tiny-town/index.html','utf8');
 const elsewhere=fs.readFileSync('public/elsewhere/app.js','utf8');
 const cat=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
 if(!town.includes('outcome?.totalScore||0')||
    !town.includes("onShare:()=>gameProgress('shared-link')"))
  throw Error('Tiny Town share must use real game score and preserve tracking');
 if(!elsewhere.includes("link.searchParams.set('world',w.id)")||
    !elsewhere.includes("localizeStory(chosenEnding.title)")||
    !elsewhere.includes("onShare:platform=>track('share_clicked'"))
  throw Error('Elsewhere share must preserve playable world deep links and ending');
 if(!cat.includes('score=Math.max(0,Math.floor(Number(s?.score)||0))')||
    !cat.includes("meta:{game:'pawsibly-innocent',level:room}"))
  throw Error('Cat share must include real score and room');
 console.log('All three flagship game share menus: 6 social sites, localized messages, active scores and deep links.');
}


// Compact cat sidebar: all essential gameplay remains above its optional details.
{
 const html=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
 const script=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
 const start=html.indexOf('<aside class="panel"');
 const end=html.indexOf('</aside>',start);
 if(start<0||end<0)throw new Error('Cat compact sidebar missing');
 const aside=html.slice(start,end);
 const extra=aside.indexOf('<details class="sidebar-extra">');
 if(extra<0||!aside.includes('<summary>')||!aside.includes('sidebar-extra-body'))
  throw new Error('Secondary cat-game instructions and souvenirs must fold away by default');
 const above=aside.slice(0,extra);
 for(const id of ['hearts','chapter','fishCount','meterFill','mission','collection',
                   'score','moves','starTotal','restart','levels','wardrobe','skinHint']){
  if(!above.includes('id="'+id+'"'))throw new Error('Essential cat game control hidden in detail: '+id);
 }
 // Music and effects now live at the top-right of the game, not in the sidebar.
 const top=html.slice(html.indexOf('<header class="sitebar">'),html.indexOf('</header>')+9);
 for(const id of ['sound','music'])if(!top.includes('id="'+id+'"'))
  throw new Error('Audio control missing from cat header: '+id);
 if(html.includes('data-move="'))throw new Error('On-screen D-pad must not crowd the cat board');
 // The yarn button is a primary gameplay action above the board, not inside the sidebar.
 const yarnAction=html.indexOf('id="tool"'),canvas=html.indexOf('id="board"');
 if(yarnAction<0||canvas<0||yarnAction>canvas||yarnAction>start)
  throw new Error('Yarn action must be visible immediately above the board');
 for(const id of ['yarnExplain','ability','collectionHint','souvenirShelf','musicCredit']){
  if(!aside.slice(extra).includes('id="'+id+'"'))throw new Error('Optional cat section missing '+id);
 }
 for(const id of [...new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map(x=>x[1]))]){
  if(!html.includes('id="'+id+'"'))throw new Error('Cat game script references missing DOM control '+id);
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 if(ids.some((id,i)=>ids.indexOf(id)!==i))throw new Error('Duplicate cat-game DOM ID');
 if(!html.includes('max-width:1110px')||!html.includes('max-width:620px')||
    !html.includes('.panel .sidebar-actions')||!html.includes('.panel .level-btn'))
  throw new Error('Compact cat sidebar responsiveness missing');
 if(aside.indexOf('id="levels"')>extra||aside.indexOf('id="wardrobe"')>extra)
  throw new Error('Active level and cat selection cannot be hidden by default');
 console.log('Compact cat sidebar: every active control fits above folded extras; responsive and all IDs intact.');
}

// Elsewhere regression: all story text must remain full paragraphs, never
// the first character of a string (the previous fast-story destructuring bug).
{
 const vm=await import('node:vm');
 const context={window:{
   MORROW_ZH_STORIES:{},
   ELSEWHERE_CONTINUITY:{beats:{},hints:{},overrides:{}},
   ELSEWHERE_MYSTERIES:{},ELSEWHERE_ENDINGS:{}
 },structuredClone};
 vm.runInNewContext(fs.readFileSync('public/elsewhere/season.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('public/elsewhere/fast-story.js','utf8'),context);
 const worlds=context.window.ELSEWHERE_SEASON;
 if(worlds.length!==4||worlds.some(w=>w.acts.length!==5))
  throw new Error('Elsewhere must have four five-scene lives');
 let count=0;
 for(const world of worlds)for(const act of world.acts)for(const paragraph of act.n){
  if(typeof paragraph!=='string'||paragraph.length<75)
   throw new Error('Truncated Elsewhere paragraph in '+world.id+': '+paragraph);
  const zh=context.window.MORROW_ZH_STORIES[paragraph];
  if(typeof zh!=='string'||zh.length<40||!/[\u4e00-\u9fff]/.test(zh))
   throw new Error('Missing complete Chinese story paragraph in '+world.id);
  count++;
 }
 if(count!==40)throw new Error('Expected 40 branched Elsewhere paragraphs, got '+count);
 const page=fs.readFileSync('public/elsewhere/index.html','utf8');
 if(page.includes('id="narrate-voice"'))throw new Error('Duplicate iPhone speech voice menu has returned');
 console.log('Elsewhere: '+count+' full-length bilingual passages, curated narrator and no duplicate voice picker verified.');
}
