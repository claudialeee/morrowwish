import fs from 'node:fs';
import path from 'node:path';
import { generateDiscovery } from './discovery.mjs';
import { generateSocialCards } from './render-social-cards.mjs';
import { execFileSync } from 'node:child_process';

const base = process.cwd();
if (!fs.existsSync('public/audio/cat-happy-clappy.ogg'))
  execFileSync('bash',['scripts/fetch-cat-music.sh'],{stdio:'inherit'});
const out = path.join(base, 'cloudflare-pages', 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(base, 'public'), out, { recursive: true });


// Publish a stable, version-independent preview manifest for the private
// creative-review landing page. Only use fully rendered local assets.
const promoRoot = path.join(out, 'promo');
const reviewVersions = fs.readdirSync(promoRoot)
  .map(name => ({ name, match: /^v(\d+)-review\.json$/.exec(name) }))
  .filter(v => v.match)
  .sort((a, b) => Number(b.match[1]) - Number(a.match[1]));
let latestReview = null;
for (const item of reviewVersions) {
  const data = JSON.parse(fs.readFileSync(path.join(promoRoot, item.name), 'utf8'));
  if (!Array.isArray(data.trailers) || data.trailers.length !== 7) continue;
  const hasFiles = data.trailers.every(entry =>
    [entry.video, entry.poster].every(url => {
      if (typeof url !== 'string' || !url.startsWith('/promo/') || url.includes('..')) return false;
      const file = path.join(out, url.slice(1));
      return fs.existsSync(file) && fs.statSync(file).size > 0;
    }));
  if (!hasFiles) continue;
  latestReview = { ...data, latestPreviewPath: '/promo/review/', latestVersion: 'V' + item.match[1] };
  fs.writeFileSync(path.join(promoRoot, 'latest-review.json'), JSON.stringify(latestReview, null, 2) + '\n');
  console.log('Latest seven-game trailer preview: ' + latestReview.latestVersion);
  break;
}
if (!latestReview) throw new Error('No fully rendered seven-game trailer review manifest is available');


// Dated provider snapshot stays inside the authenticated Worker response, not a public asset.
const social = JSON.parse(fs.readFileSync(path.join(base,'promotion','social-metrics-snapshot.json'),'utf8'));
if(social.schemaVersion!==2||!Array.isArray(social.platforms)||social.metricScope?.type!=='approved-short-videos-only'||!social.metricScope?.historicalExcluded)throw Error('Social snapshot must exclude all previously published short videos');
const tiktokNative=fs.readFileSync(path.join(base,'src','tiktok-native.js'),'utf8')
  .replace(/^export /gm,'');
const blueskyNative=fs.readFileSync(path.join(base,'src','bluesky-native.js'),'utf8')
  .replace(/^export /gm,'');
const youtubeNative=fs.readFileSync(path.join(base,'src','youtube-native.js'),'utf8')
  .replace(/^export /gm,'');
const instagramNative=fs.readFileSync(path.join(base,'src','instagram-native.js'),'utf8')
  .replace(/^export /gm,'');
const analytics = 'const SOCIAL_SNAPSHOT='+JSON.stringify(social)+';\n'
  + tiktokNative+'\n'
  + blueskyNative+'\n'
  + youtubeNative+'\n'
  + instagramNative+'\n'
  + fs.readFileSync(path.join(base, 'src', 'analytics.js'), 'utf8')
    .replace('import {nativeTikTokRoute,nativeTikTokSnapshot} from "./tiktok-native.js";','')
    .replace('import {nativeBlueskySnapshot} from "./bluesky-native.js";','')
    .replace('import {nativeYouTubeSnapshot} from "./youtube-native.js";','')
    .replace('import {nativeInstagramSnapshot,nativeInstagramRoute} from "./instagram-native.js";','')
    .replace('export async function api', 'async function api');
const router = fs.readFileSync(path.join(base, 'src', 'worker.js'), 'utf8')
  .replace('import {api} from "./analytics.js";', '');
if (!analytics.includes('async function api') || !router.includes('ASSETS.fetch')) {
  throw new Error('Unexpected worker source: check the Pages build script before deploying.');
}
fs.writeFileSync(path.join(out, '_worker.js'), analytics + '\n' + router);
console.log('Built Cloudflare Pages assets from canonical public/ and src/.');

await generateSocialCards(out);
generateDiscovery(out);
