import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/studio-insights/index.html','src/worker.js','src/analytics.js','wrangler.jsonc'
]) {
  if (!fs.existsSync(file)) throw new Error('Missing required file: ' + file);
}
const dashboard = fs.readFileSync('public/studio-insights/index.html','utf8');
const telemetry = fs.readFileSync('public/telemetry.js','utf8');
if (!dashboard.includes('"elsewhere":"Elsewhere"'))
  throw new Error('Elsewhere label must remain capitalized in gameNames.');
if (!dashboard.includes("['hub','tiny-town','elsewhere'"))
  throw new Error('Dashboard order must start with homepage, Tiny Town, Elsewhere.');
if (!telemetry.includes('"elsewhere"'))
  throw new Error('Elsewhere must be included in telemetry whitelist.');
if (!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))
  throw new Error('Missing dashboard server-side authentication.');
console.log('Source layout, Analytics wiring, dashboard order and game labels validated.');
