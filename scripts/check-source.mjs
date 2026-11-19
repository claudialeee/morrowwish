import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/zh-site.js','public/zh-stories.js','public/zh-polish.js',
  'public/studio-insights/index.html','public/art/morrowwish-mark.svg','public/meowhem/index.html','public/meowhem/game.js','public/icons/meowhem.svg',
  'src/worker.js','src/analytics.js','cloudflare-pages/wrangler.jsonc'
]) if (!fs.existsSync(file)) throw new Error('Missing required file: '+file);

const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
const config=JSON.parse(fs.readFileSync('cloudflare-pages/wrangler.jsonc','utf8'));
if(config.name!=='morrowwish')throw Error('Wrong Cloudflare Pages project');
if(config.d1_databases?.[0]?.database_name!=='morrowwish-analytics')throw Error('Wrong D1 database');
if(!dashboard.includes('zh:"平行人生",en:"Elsewhere"'))throw Error('Dashboard must show 平行人生 in Chinese and Elsewhere in English');
const displayOrder=dashboard.match(/const displayOrder=\[([^\]]+)\];/)?.[1]||'';
for(const name of ['hub','elsewhere','tiny-town','meowhem','flip-dash','parcel-panic','pocket-aquarium']){
 if(!displayOrder.includes("'"+name+"'"))throw Error('Dashboard missing visible game: '+name);
}
if(!dashboard.includes("'pocket-aquarium'"))throw Error('Pocket Aquarium must remain in dashboard order');
if(!telemetry.includes('"pocket-aquarium"'))throw Error('Pocket Aquarium must remain in telemetry');
const aquarium=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
for(const marker of ["metric('game_start'","metric('game_complete'","metric('game_retry'","feed_success","time=60","zh:{"]){
 if(!aquarium.includes(marker))throw Error('Pocket Aquarium V2 missing gameplay or analytics: '+marker);
}

if(!telemetry.includes('"elsewhere"'))throw Error('Missing Elsewhere telemetry');
if(!telemetry.includes('"meowhem"'))throw Error('Missing MEOWHEM telemetry');
const catGame=fs.readFileSync('public/meowhem/game.js','utf8');
for(const marker of ['game_start','game_complete','game_retry','cat_level_won','guardMove','morrowwish-language-change']){
 if(!catGame.includes(marker))throw Error('MEOWHEM missing gameplay/analytics: '+marker);
}
if(!fs.readFileSync('public/index.html','utf8').includes('href="/meowhem/"'))throw Error('Homepage missing MEOWHEM link');
if(!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))throw Error('Missing Analytics authentication');
for(const file of ['README.md','CLAUDE.md','public/lang.js','public/telemetry.js','public/studio-insights/index.html']){
 const text=fs.readFileSync(file,'utf8');
 if(text.toLowerCase().includes(['ruckus','button'].join('-')))throw Error('Old project name remains in '+file);
}
console.log('Morrow Wish Cloudflare Pages source, Analytics, branding and game labels checked.');


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
