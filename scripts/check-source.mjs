import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/zh-site.js','public/zh-stories.js','public/zh-polish.js',
  'public/studio-insights/index.html','public/art/morrowwish-mark.svg',
  'src/worker.js','src/analytics.js','cloudflare-pages/wrangler.jsonc'
]) if (!fs.existsSync(file)) throw new Error('Missing required file: '+file);

const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
const config=JSON.parse(fs.readFileSync('cloudflare-pages/wrangler.jsonc','utf8'));
if(config.name!=='morrowwish')throw Error('Wrong Cloudflare Pages project');
if(config.d1_databases?.[0]?.database_name!=='morrowwish-analytics')throw Error('Wrong D1 database');
if(!dashboard.includes('zh:"平行人生",en:"Elsewhere"'))throw Error('Dashboard must show 平行人生 in Chinese and Elsewhere in English');
if(!dashboard.includes("['hub','tiny-town','elsewhere'"))throw Error('Dashboard order mismatch');
if(!dashboard.includes("'pocket-aquarium'"))throw Error('Pocket Aquarium must remain in dashboard order');
if(!telemetry.includes('"pocket-aquarium"'))throw Error('Pocket Aquarium must remain in telemetry');
const aquarium=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
for(const marker of ["metric('game_start'","metric('game_complete'","metric('game_retry'","feed_success","time=60","zh:{"]){
 if(!aquarium.includes(marker))throw Error('Pocket Aquarium V2 missing gameplay or analytics: '+marker);
}

if(!telemetry.includes('"elsewhere"'))throw Error('Missing Elsewhere telemetry');
if(!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))throw Error('Missing Analytics authentication');
for(const file of ['README.md','CLAUDE.md','public/lang.js','public/telemetry.js','public/studio-insights/index.html']){
 const text=fs.readFileSync(file,'utf8');
 if(text.toLowerCase().includes(['ruckus','button'].join('-')))throw Error('Old project name remains in '+file);
}
console.log('Morrow Wish Cloudflare Pages source, Analytics, branding and game labels checked.');
