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
const socialRouter=fs.readFileSync('src/worker.js','utf8');
if(!socialRouter.includes('if(p.startsWith("/go/"))')||
   !socialRouter.includes('utm_source')||
   !socialRouter.includes('utm_campaign')||
   !socialRouter.includes('Cache-Control')||
   !dashboard.includes('acquisitionVisits:')||
   !dashboard.includes("siteNum(homeFor(p.id),'visits')")||
   !dashboard.includes("siteNum(z,'pageviews')"))
 throw Error('Tracking links and homepage/game attribution data must be preserved');
if(!dashboard.includes('if(x.game==="hub")return')||
   !dashboard.includes("num('pageviews')+'</td><td></td><td></td><td></td>"))
 throw Error('Homepage overview: show pageviews only and leave gameplay cells blank');

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
if(!dashboard.includes('id="game-details"')||!dashboard.includes('data-i18n="gameMore"')||
   !dashboard.includes('data-i18n="playtestGuide"')||
   !dashboard.includes('metricCard(t("statFinished")')||
   dashboard.includes('data-i18n="colDone"')||
   dashboard.includes('data-i18n="nativePublished"')||
   !dashboard.includes('syncPending:')||
   !dashboard.includes('game!=="hub"'))
 throw Error('Dashboard must prioritize honest game starts, normal finishes and replays with provider sync status');
// Primary dashboard must preserve visit-to-start and start-to-finish context
// and not show unsupported portals as native social-view channels.
const requiredChannels=['itch','crazygames','kongregate','youtube','tiktok','instagram','bluesky','search'];
const channelIds=dashboard.match(/const fallbackIds=\[([^\]]+)\];/)?.[1]||'';
if(requiredChannels.some(name=>!channelIds.includes("'"+name+"'"))||
   !dashboard.includes('id="future-channels"')||
   !dashboard.includes('id="future-channel-list"')||
   !dashboard.includes('channelState:')||
   dashboard.includes("t('notApplicable')"))
 throw Error('Promotion pipeline channels must stay visible; irrelevant metrics stay blank, not N/A');
if(!dashboard.includes("num('pageviews')")||
   !dashboard.includes("const finishRate=")||
   !dashboard.includes("const startRate=")||
   !dashboard.includes("snapshotPlatforms.filter(p=>platformIds.has(p.id))")||
   !dashboard.includes("blueskyPublished:")||
   !dashboard.includes("3n2rchppku32o")||
   social.platforms.find(p=>p.id==='bluesky')?.published!==1)
 throw Error('Dashboard must retain conversion context, hide N/A sources and show the actual Bluesky post');
if(!miniUpgrade.includes('window.__MWMiniActive=true')||
   !miniUpgrade.includes('event("run_abandoned",{reason:"restart"}')||
   !telemetry.includes('window.__MWMiniActive')||
   !analyticsSource.includes('abandons:sum(sessionsOf,"abandons")')||
   dashboard.includes('miniAbandoned:')||
   dashboard.includes('中途退出')||
   !dashboard.includes('const siteNum='))throw Error('Mini-game exit telemetry remains internal, never a player-facing dashboard metric');
if(!telemetry.includes('"town_completed-win"||n==="town_completed-lose"') ||
   !telemetry.includes('"town_completed-lose"].includes(n))eventCounts.ends++') ||
   !telemetry.includes('"level_complete"')) throw Error('Winning and losing Tiny Town runs must both be counted as finished');
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



// Elsewhere: 6 separate genres, explicit continuity, three routes per life, and functioning audio.
import vm from 'node:vm';
const dreamSource=fs.readFileSync('public/elsewhere/dreams.js','utf8');
const dreamA=fs.readFileSync('public/elsewhere/casefiles-a.js','utf8');
const dreamB=fs.readFileSync('public/elsewhere/casefiles-b.js','utf8');
const dreamMoods=fs.readFileSync('public/elsewhere/dream-lives.js','utf8');
const dreamFresh=fs.readFileSync('public/elsewhere/fresh-start.js','utf8');
const dreamAudio=fs.readFileSync('public/elsewhere/dream-audio.js','utf8');
const dreamPage=fs.readFileSync('public/elsewhere/index.html','utf8');
const dreamCss=fs.readFileSync('public/elsewhere/dreams.css','utf8');
const dreamSw=fs.readFileSync('public/elsewhere/sw.js','utf8');
for(const [name,src] of [['dreams',dreamSource],['casefiles-a',dreamA],['casefiles-b',dreamB],['dream-lives',dreamMoods],['fresh-start',dreamFresh],['dream-audio',dreamAudio]])
 new vm.Script(src,{filename:name});
for(const path of ['/elsewhere/dreams.js','/elsewhere/dreams.css','/elsewhere/casefiles-a.js',
                   '/elsewhere/casefiles-b.js','/elsewhere/dream-lives.js','/elsewhere/fresh-start.js','/elsewhere/dream-audio.js',
                   '/telemetry.js','/social-share.js']){
 if(!dreamPage.includes(path))throw Error('Elsewhere missing resource: '+path);
 if(!path.startsWith('/telemetry')&&!path.startsWith('/social-share')&&!dreamSw.includes(path))
  throw Error('Elsewhere offline cache missing: '+path);
}
for(const marker of ['@media(min-width:701px)','@media(max-width:700px)','grid-template-columns:minmax(0,1.07fr)',
                    'prefers-reduced-motion','twist-burst','twistFlash','twistSpark','.case-resources','.case-report','.case-previous em'])
 if(!dreamCss.includes(marker))throw Error('Missing desktop/mobile scene or continuation visual: '+marker);
for(const marker of ['Kevin MacLeod','creativecommons.org/licenses/by/4.0'])
 if(!dreamPage.includes(marker))throw Error('Elsewhere music credit missing');
for(const marker of ['musicOn=read(KEY,true)','fxOn=read(FX_KEY,true)','audio.play()','function toggleMusic()',
                    'function toggleFX()','window.DreamAudio=','blocked=true'])
 if(!dreamAudio.includes(marker))throw Error('Elsewhere music/FX wiring missing');
const storySandbox={window:{}};
for(const src of [dreamA,dreamB,dreamMoods,dreamFresh])vm.runInNewContext(src,storySandbox,{timeout:2500});
const cases=storySandbox.window.ELSEWHERE_CASEFILES, vibes=storySandbox.window.ELSEWHERE_VIBES;
const bilingual=x=>Array.isArray(x)&&x.length===2&&x.every(y=>typeof y==='string'&&y.trim().length>1);
const expectedModes={paris:'romance',maldives:'wild',iceland:'wonder',swiss:'spectacle',tokyo:'comeback',amalfi:'luxury'};
const moodNames=new Set();
if(!cases||Object.keys(cases).length!==6||Object.keys(vibes||{}).length!==6)
 throw Error('All six dream lives must be fully configured');
for(const [world,life] of Object.entries(cases)){
 if(life.mode!==expectedModes[world])throw Error('Wrong/missing dream genre for '+world);
 moodNames.add(life.mode);
 for(const label of [life.mystery,life.objective,life.secret,life.villain])
  if(!bilingual(label))throw Error('Untranslated story introduction in '+world);
 if(!life.paths||life.paths.length!==3||life.endings?.length!==3||life.rare?.length!==2)
  throw Error('Missing routes or ending for '+world);
 if(life.paths.some(x=>x.length!==3))throw Error('Every selected start must lead through three unique scenes: '+world);
 const scenes=[life.intro,...life.paths.flat(),life.finale];
 if(scenes.length!==11)throw Error('Invalid number of scenes in '+world);
 if(new Set(life.paths.map(x=>x[0].body[0])).size!==3)
  throw Error('Selected first action must create three genuinely different routes: '+world);
 for(const scene of scenes){
  if(!bilingual(scene.title)||!bilingual(scene.body)||scene.choices?.length!==3)
   throw Error('Incomplete bilingual scene in '+world);
  for(const a of scene.choices)
   if(!bilingual(a.title)||!bilingual(a.result)||!['proof','allies','leverage'].includes(a.gain))
    throw Error('Choice must have a real resulting event connected to its context in '+world);
 }
 for(const ending of [...life.endings,life.rare])
  if(ending.length!==2||!bilingual(ending[0])||!bilingual(ending[1]))
   throw Error('Incomplete ending in '+world);
 for(const kind of ['proof','allies','leverage'])
  if(!bilingual(vibes[world].stats[kind]))throw Error('Generic investigation score still present in '+world);
}
if(moodNames.size!==6)throw Error('All dreams still play like the same mystery game');
for(const marker of [
 'edition:"life-v4"','state.route=n','state.scores[act.gain]++','state.history.push',
 'prior.title','prior.result','function isDream','dream?"strong"','window.ELSEWHERE_VIBES',
 'i===4&&!dream','function revealTwist()','window.DreamAudio?.fx("twist")',
 'window.DreamAudio?.fx("ending")','track("choice_made"','track("chapter_completed"',
 'track("life_completed"','track("ending_view"','window.arcadeMetric?.("game_complete")',
 'navigator.globalPrivacyControl','MorrowwishSocialShare?.open','history.pushState'
])if(!dreamSource.includes(marker))throw Error('Elsewhere progression or instrumentation missing: '+marker);
const requiredNewArcs=['paris','amalfi'];
for(const id of requiredNewArcs){
 const w=cases[id];
 if(!Array.isArray(w.finale.routeBodies)||w.finale.routeBodies.length!==3||w.finale.routeBodies.some(x=>!bilingual(x)))
  throw Error('Finale must reflect the actual opening route: '+id);
 for(const path of w.paths)for(const scene of path.slice(1)){
  if(!Array.isArray(scene.links)||scene.links.length!==3||scene.links.some(x=>!bilingual(x)))
   throw Error('Every choice must connect into the next scene: '+id);
 }
}
if(cases.paris.intro.body[0].includes('旧爱')||cases.paris.intro.body[0].includes('五年')||cases.amalfi.intro.body[0].includes('地产商'))
 throw Error('Old stressful plot remains live');
if(cases.paris.intro.body[0].includes('诺亚'))throw Error('The new romance must introduce Noa naturally after the first choice');
if(!cases.amalfi.objective[0].includes('没有失败结局'))throw Error('Amalfi must have no losing ending');
if(!dreamCss.includes('white-space:nowrap!important')||!dreamCss.includes('font-size:clamp(15px,4.35vw,24px)'))
 throw Error('Single-line responsive Chinese and English title missing');
if(!dreamSource.includes('hero:L("醒来，活一种舍不得结束的人生。","Wake up to a life too good to end.")'))
 throw Error('Single-line headline changed unexpectedly');
if(!dreamSource.includes('s.routeBodies?.[state.route]')||!dreamSource.includes('s.links?.[prior.index]'))
 throw Error('Meaningful scene continuation missing');
if(!dreamSource.includes('state.id==="amalfi"||state.id==="paris"'))
 throw Error('Romance and luxury endings should be achievable without score pressure');
if(dreamPage.includes('/elsewhere/extra-scenes.js')||dreamPage.includes('/elsewhere/app.js'))
 throw Error('Retired disconnected story still active');
console.log('Elsewhere: 6 distinct genres, 18 route-specific arcs, 66 authored scenes and 198 context-tied decisions, bilingual outcomes, and functioning sound wiring checked.');

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
const townV4=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
new vm.Script(townV4,{filename:'public/tiny-town/game-v4.js'});
const townFreedom=fs.readFileSync('public/tiny-town/freedom-scenes.js','utf8');
const townFreedomCss=fs.readFileSync('public/tiny-town/freedom-scenes.css','utf8');
new vm.Script(townFreedom,{filename:'public/tiny-town/freedom-scenes.js'});
const townCompact=fs.readFileSync('public/tiny-town/compact-v5.js','utf8');
const townCompactCss=fs.readFileSync('public/tiny-town/compact-v5.css','utf8');
new vm.Script(townCompact,{filename:'public/tiny-town/compact-v5.js'});
for(const marker of ['id="wonderStat"','id="peaceStat"','id="comboStat"','id="townInspector"','id="inspectorContent"','id="tabResidents"','id="tabMemories"','id="tabDiscoveries"','id="liveNotice"','id="residentRibbon"','id="residentRibbonPeople"']){
 if(!tinyMusicPage.includes(marker))throw Error('Tiny Town compact single-surface UI missing '+marker);
}
for(const marker of ['body:has(.app){overflow:hidden}','height:calc(100dvh - 40px)','@media(max-width:700px)','.app .town-inspector[hidden]']){
 if(!townCompactCss.includes(marker))throw Error('Tiny Town single-screen responsive layout missing '+marker);
}
for(const marker of ['function peopleMarkup','function inspect()','function render()','window.TownV5={boot,render,toggle,openResident}']){
 if(!townCompact.includes(marker))throw Error('Tiny Town readable resident profiles or in-game info missing '+marker);
}
for(const marker of ["S.memories.push(","S.wonder>=55","window.TownV5?.render?.()","wish-reactions","S.memories.map(m=>"]){
 if(!townV4.includes(marker))throw Error('Tiny Town reward and preference system missing '+marker);
}
for(const marker of ['Bring ','Return to my town','freedom-collect','const found=[...taken]']){
 if(!townFreedom.includes(marker))throw Error('Optional free-day souvenir collection missing '+marker);
}
if(!townCompact.includes('function residentRibbon()')||
   !townCompact.includes('data-resident=')||
   !townCompact.includes('residentRibbon();')||
   !townCompactCss.includes('.app .resident-ribbon')||
   !townCompactCss.includes('.app .resident-avatar.likes')||
   !townCompactCss.includes('.app .resident-avatar.dislikes'))
 throw Error('Visible resident strip and wish impact indicators are missing');
if(!townCompact.includes('let opened=\'\',focusedResident=null')||
   !townCompact.includes('function oneResident(')||
   !townCompact.includes('function compareResidents(')||
   !townCompact.includes('data-residents-all')||
   !townCompact.includes('data-resident-profile')||
   !tinyMusicPage.includes('data-zh="居民对比"')||
   !townCompactCss.includes('.app .resident-compare-row')||
   !townCompactCss.includes('.app .resident-focus-card'))
 throw Error('Resident avatar must open only one profile, with a separate all-five comparison');
for(const marker of ['HOME=[0,2,4,20,24]','HOME_RESIDENT={0:0,2:3,4:1,20:2,24:4}','window.TownV5Actions={selectWish}','if(tenant){tile.onclick','function rareUnlocked()','LEGENDARY_WISHES.includes(id)']){
 if(!townV4.includes(marker))throw Error('Tiny Town homes or usable legendary wishes missing: '+marker);
}
for(const marker of ['function legendaryPanel(','data-legend-wish','function openResident(index,source)','window.TownV5={boot,render,toggle,openResident}']){
 if(!townCompact.includes(marker))throw Error('Tiny Town legend collection or resident home links missing: '+marker);
}
if(!tinyMusicPage.includes('id="tabLegends"')||
   !townCompactCss.includes('.app .tile.resident-home')||
   !townCompactCss.includes('.app .legend-wish-list')||
   !townCompactCss.includes('.app #tabLegends.unlocked'))
 throw Error('Visible legendary catalog or resident nameplates missing');
for(const marker of ['data-law="wonder"','data-law="care"','data-law="dream"','data-zh="想疯就疯"','data-zh="先躺为敬"','data-zh="离谱一点才好玩"','charter-flavor','charter-bonus']){
 if(!tinyMusicPage.includes(marker))throw Error('Playful starting style or visible perk is missing: '+marker);
}
for(const marker of ['function wishEffect(card)','lastComfortDay:-1','if(effect.cozy)S.lastComfortDay=S.day','S.law===\'wonder\'','S.law===\'care\'','if(S.law===\'dream\')','const firstThought=']){
 if(!townV4.includes(marker))throw Error('Distinct starting-style gameplay is missing: '+marker);
}
if(townV4.includes("S.law='care';news(")||townV4.includes("S.law='wonder';news("))
 throw Error("Random story events cannot override the player\'s opening playstyle");
if(!townCompactCss.includes('#intro .charter .charter-bonus')||
   !townCompactCss.includes('#intro .charter .charter-flavor'))
 throw Error('Starting choice effects must be visible on mobile and desktop');
console.log('Tiny Town single-canvas UI, resident preferences, meaningful resources, and optional memory rewards verified.');

if(tinyMusicPage.indexOf('src="/tiny-town/freedom-scenes.js"')<0||
   tinyMusicPage.indexOf('src="/tiny-town/freedom-scenes.js"')>tinyMusicPage.indexOf('src="/tiny-town/game-v4.js')||
   !tinyMusicPage.includes('href="/tiny-town/freedom-scenes.css?v=1"')||
   !townFreedomCss.includes('/art/tiny-town-scene.svg'))
 throw Error('Free Days illustrated scenery assets must load before the game engine');
for(const marker of ['id="freedomModal"','id="worldIllustration"','id="journeyPassport"','id="endArt"']){
 if(!tinyMusicPage.includes(marker))throw Error('Free Days interactive scenery UI missing: '+marker);
}
for(const marker of ['function play(opts,onDone)','function stage(id)','freedom-collect','freedom-skip','A Day of Doing Nothing']){
 if(!townFreedom.includes(marker))throw Error('Free Days choice and collectible scene missing: '+marker);
}
for(const marker of ["overlays.push({kind:'journey'",'S.journeys.push(memory.id)','function renderScenery()','end-hero-art','function postcard()','my-free-town-']){
 if(!townV4.includes(marker))throw Error('Free Days story, visits or end postcard missing: '+marker);
}
if(townV4.includes('A promise was forgotten. Your neighbors are disappointed.'))
 throw Error('Optional free-life wishes must not punish players');
console.log('Tiny Town Free Days: illustrated journeys, optional rest, living map, and postcard integration checked.');

for(const marker of ['const residents=[','const legends=[','function connectedLegend(','function discoverLegends()','function processResidents(','function relocate(pos)','function updatePromise(','function finalLayers()']){
 if(!townV4.includes(marker))throw Error('Tiny Town strategic gameplay missing: '+marker);
}
for(const marker of ['id="cityLandmark"','id="citizens"','id="petition"','id="moveWish"','id="charterSelect"','id="endStory"']){
 if(!tinyMusicPage.includes(marker))throw Error('Tiny Town strategic interface missing: '+marker);
}

for(const marker of ['src="/tiny-town/game-v4.js','id="intro"','id="endArt"','id="savePostcard"','id="feedbackQuestion"']){
 if(!tinyMusicPage.includes(marker))throw new Error('Tiny Town wish-cascade UI missing: '+marker);
}
for(const marker of ['function place(pos)','function newPairs(id,pos)','function chooseEvent(decision)','function illustrate(kind)','function finish()','town_completed-']){
 if(!townV4.includes(marker))throw new Error('Tiny Town playable wish-cascade missing: '+marker);
}
if(!fs.readFileSync('public/studio-audio.js','utf8').includes('[data-mw-music]'))
 throw new Error('Music toggle must not trigger the sound effects button');
console.log('Game music profiles, bilingual controls and Tiny Town wish-cascade engine checked.');

// The new fast visual adventure intentionally supersedes the letter-heavy legacy game.
if(dreamPage.includes('/elsewhere/app.js')||dreamPage.includes('/elsewhere/fast-story.js')||dreamPage.includes('/elsewhere/music.js'))
 throw Error('Elsewhere old scripts still launch');
if(dreamPage.includes('A LETTER FROM ELSEWHERE')||dreamPage.includes('letter-details'))
 throw Error('Elsewhere should not show long prose before gameplay');
console.log('Elsewhere launches directly into its illustration-led adventures.');

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
const townNewsEngine=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
if(!newsTopPage.includes('id="news"')||!newsTopPage.includes('id="discoveries"')||
   !townNewsEngine.includes('function renderNews()')||
   !townNewsEngine.includes('function translate()')||
   !townNewsEngine.includes('function showOverlay()'))
 throw new Error('Tiny Town bilingual news, discoveries and reactive events missing');
console.log('Immediate music start and bilingual wish-cascade news checked.');


// Elsewhere header returns home first and offers bilingual controls.
const navStart=dreamPage.indexOf('<header class="top">'),navEnd=dreamPage.indexOf('</header>',navStart);
if(navStart<0||navEnd<0)throw Error('Missing Elsewhere header');
const nav=dreamPage.slice(navStart,navEnd);
if(nav.indexOf('href="/"')<0||nav.indexOf('href="/"')>nav.indexOf('href="/elsewhere/"')||!nav.includes('data-language="zh"')||!nav.includes('data-language="en"'))
 throw Error('Elsewhere studio-home link or language toggle missing');
if((nav.match(/href="\/"(?=\s|>)/g)||[]).length!==1)throw Error('Ambiguous Elsewhere homepage route');
if(!dreamSource.includes('btn.setAttribute("aria-pressed",String(active))')||!dreamSource.includes('el.matches("[data-language]")'))throw Error('Elsewhere language options must highlight the current language and respond directly');
if(!dreamSource.includes('history.replaceState(history.state||{}')||!dreamSource.includes('url.delete("lang")'))throw Error('Elsewhere language preference must survive refreshing deep links');
console.log('Elsewhere home navigation, bilingual selector, and persistent URL language checked.');

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
  ['tiny-town','public/tiny-town/index.html','/tiny-town/game-v4.js'],
  ['elsewhere','public/elsewhere/index.html','/elsewhere/dreams.js'],
  ['pawsibly-innocent','public/pawsibly-innocent/index.html','/pawsibly-innocent/game.js']
 ];
 for(const [name,path,marker] of pages){
  const html=fs.readFileSync(path,'utf8');
  if(!html.includes('/social-share.js')||!html.includes(marker))
   throw Error(name+' must load the shared social modal');
 }
 const town=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
  const elsewhere=fs.readFileSync('public/elsewhere/dreams.js','utf8');
  const cat=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
  if(!town.includes('score=S.wonder+S.peace*4')||
     !town.includes("onShare:()=>send('town_shared-link')"))
   throw Error('Tiny Town share must include a real run score and tracking');
 if(!elsewhere.includes('MorrowwishSocialShare?.open')||
     !elsewhere.includes('onShare:platform=>track("share_clicked"')||
     !(elsewhere.includes('encodeURIComponent(w.id)')||elsewhere.includes('encodeURIComponent(state.id)')))
   throw Error('Elsewhere share must preserve playable world deep links and ending');

if(!cat.includes('score=Math.max(0,Math.floor(Number(s?.score)||0))')||
    !cat.includes("meta:{game:'pawsibly-innocent',level:room}"))
  throw Error('Cat share must include real score and room');
 console.log('All three flagship game share menus: 6 social sites, localized messages, active scores and deep links.');
}


// Cat game release guard: gameplay controls are integrated INSIDE the stage,
// not in a permanent sidebar or a separate instruction panel.
{
 const html=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
 const script=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
 const css=fs.readFileSync('public/pawsibly-innocent/single-screen.css','utf8');
 const fullscreen=fs.readFileSync('public/game-fullscreen.js','utf8');
 const from=html.indexOf('<div class="stage" id="stage">');
 const end=html.indexOf('</main>',from);
 if(from<0||end<0)throw new Error('Cat gameplay stage missing');
 const stage=html.slice(from,end);
 const board=stage.indexOf('id="board"'),hud=stage.indexOf('id="heistStatus"'),
   guide=stage.indexOf('class="in-game-guidance"'),bonus=stage.indexOf('id="bonusQuick"'),
   tool=stage.indexOf('id="tool"'),menu=stage.indexOf('id="gameMenu"');
 if(board<0||hud<0||guide<0||bonus<0||tool<0||menu<board||!(guide<bonus&&bonus<board&&tool<board))
  throw new Error('Cat tutorial, bonus and yarn control must be grouped in one upper HUD before the map');
 if(stage.includes('class="stealth-actionbar"'))throw new Error('Standalone bottom yarn strip must not return');
 for(const id of ['menuButton','menuButtonLabel','menuClose','quickHelp','stageControls','tool','visionTip','guardIntent','bonusQuick','bonusQuickText','bonusQuickProgress',
                 'levels','wardrobe','skinHint','score','moves','starTotal','collection','hearts','fishCount',
                 'achievementCount','relicGallery','achievementsGrid','badgeHighlights','howTitle',
                 'menuLanguage','menuAudio','restart','roomNum','roomTag','overlay']){
  if(!stage.includes('id="'+id+'"'))throw new Error('Cat game stage lost control '+id);
 }
 if(!stage.includes('data-game-tab="rooms"')||!stage.includes('data-game-tab="album"')||
    !stage.includes('data-game-tab="badges"')||!stage.includes('data-game-tab="help"'))
  throw new Error('Game menu tabs missing');
 if(html.includes('<section class="explainer"')||html.includes('<aside class="panel" aria-label="Game progress and controls">'))
  throw new Error('Obsolete persistent cat sidebar or duplicated rules remain');
 if(!css.includes('playfield')||!css.includes('game-menu')||
    !fullscreen.includes("'pawsibly-innocent':['#stage','#stageControls']"))
  throw new Error('One-screen game layout or stage-only fullscreen not wired');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 if(ids.some((id,i)=>ids.indexOf(id)!==i))throw new Error('Duplicate cat-game DOM ID');
 for(const id of [...new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map(x=>x[1]))]){
  if(!html.includes('id="'+id+'"'))throw new Error('Cat script references missing DOM node '+id);
 }
 console.log('Single-screen cat adventure: one stage, in-game menus, stage-only fullscreen, all DOM IDs present.');
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
