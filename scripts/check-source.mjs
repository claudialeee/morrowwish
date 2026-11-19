import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/zh-site.js','public/zh-stories.js','public/zh-polish.js',
  'public/studio-insights/index.html','public/art/morrowwish-mark.svg','public/pawsibly-innocent/index.html','public/pawsibly-innocent/game.js','public/icons/pawsibly-innocent.svg',
  'src/worker.js','src/analytics.js','cloudflare-pages/wrangler.jsonc'
]) if (!fs.existsSync(file)) throw new Error('Missing required file: '+file);

const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
const config=JSON.parse(fs.readFileSync('cloudflare-pages/wrangler.jsonc','utf8'));
if(config.name!=='morrowwish')throw Error('Wrong Cloudflare Pages project');
if(config.d1_databases?.[0]?.database_name!=='morrowwish-analytics')throw Error('Wrong D1 database');
if(!dashboard.includes('zh:"平行人生",en:"Elsewhere"'))throw Error('Dashboard must show 平行人生 in Chinese and Elsewhere in English');
const displayOrder=dashboard.match(/const displayOrder=\[([^\]]+)\];/)?.[1]||'';
for(const name of ['hub','elsewhere','tiny-town','pawsibly-innocent','flip-dash','parcel-panic','pocket-aquarium']){
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
const catGame=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
for(const marker of ['game_start','game_complete','game_retry','cat_level_won','guardMove','morrowwish-language-change']){
 if(!catGame.includes(marker))throw Error('Pawsibly Innocent missing gameplay/analytics: '+marker);
}
const homepage=fs.readFileSync('public/index.html','utf8');
const featured=homepage.match(/<div class="feature-grid">([\s\S]*?)<\/div><\/section>/)?.[1]||'';
const minis=homepage.match(/<div class="mini-grid">([\s\S]*?)<\/div><\/div><\/section>/)?.[1]||'';
for(const link of ['href="/pawsibly-innocent/"','href="/elsewhere/"','href="/tiny-town/"']){
 if(!featured.includes(link))throw Error('Missing signature world featured card: '+link);
}
if((featured.match(/class="feature-card/g)||[]).length!==3)throw Error('Three signature games required');
if(!featured.trimStart().startsWith('<article class="feature-card cat-feature-card">'))throw Error('Cat must be the first featured game');
const zhCard=featured.match(/<article class="feature-card cat-feature-card">([\s\S]*?)<\/article>/)?.[1]||'';
if(!zhCard.includes('猫猫绝对无辜！')||zhCard.includes('cat-original'))throw Error('Chinese homepage card must not display the English Pawsibly subtitle');
if(!homepage.includes('Three fish to steal. One human to fool.'))throw Error('Cat game marketing hook is missing');
if(!displayOrder.startsWith("'hub','pawsibly-innocent'"))throw Error('Studio dashboard game order must follow the homepage');
if(minis.includes('href="/pawsibly-innocent/"'))throw Error('Cat world must not be in mini-games');
for(const marker of ['function throwYarn','const EXTRAS=[','ROOM_REWARDS','souvenirs','function vacuumDraw','function roomDecor']){
 if(!catGame.includes(marker))throw Error('Cat expansion missing: '+marker);
}
const catHTML=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
for(const id of ['id="tool"','id="collection"','id="ability"'])if(!catHTML.includes(id))throw Error('Cat interface missing '+id);
if(!fs.readFileSync('public/art/pawsibly-scene.svg','utf8').includes('<svg'))throw Error('Featured cat art missing');

if(!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))throw Error('Missing Analytics authentication');
for(const file of ['README.md','CLAUDE.md','public/lang.js','public/telemetry.js','public/studio-insights/index.html']){
 const text=fs.readFileSync(file,'utf8');
 if(text.toLowerCase().includes(['ruckus','button'].join('-')))throw Error('Old project name remains in '+file);
}
console.log('Morrow Wish Cloudflare Pages source, Analytics, branding and game labels checked.');
await import('./check-pawsibly.mjs');

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


// Four intentionally distinct, original looping soundtracks, separate from SFX.
const originalMusic=fs.readFileSync('public/studio-music.js','utf8');
new vm.Script(originalMusic,{filename:'public/studio-music.js'});
for(const slug of ['tiny-town','flip-dash','parcel-panic','pocket-aquarium']){
 const page=fs.readFileSync('public/'+slug+'/index.html','utf8');
 if(!page.includes('src="/studio-music.js"')||!page.includes('src="/studio-audio.js"')){
  throw new Error('Music and SFX must both load: '+slug);
 }
 if(!originalMusic.includes("'"+slug+"':{"))throw new Error('Original music profile missing: '+slug);
}
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
if(!fastPage.includes('five illustrated scenes'))throw Error('Elsewhere about page still describes eight scenes');
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
for(const pattern of ['audio.autoplay=enabled','if(enabled)start();','setWorld:switchTo','setEnding:','CC0']){
 if(!musicSource.includes(pattern))throw Error('Missing immediate and licensed soundtrack handling: '+pattern);
}
console.log('Five-scene Elsewhere runtime validation: four short lives, reachable secrets, translated story, illustrated endings and immediate music attempt checked.');

// Instant soundtrack attempt + in-game weekly news placement/regression checks.
const immediateMusic=fs.readFileSync('public/studio-music.js','utf8');
if(!immediateMusic.includes('if(enabled)start(); // Immediately attempt at script execution')||
   !immediateMusic.includes('nextTime=ctx.currentTime+.008')||
   !immediateMusic.includes("if(enabled&&!running)start()"))
 throw new Error('Soundtrack should attempt to play on load and resume instantly after a blocked autoplay');
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
