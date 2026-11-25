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


// Use the approved publication ledger for permalinks only. All numbers come
// from native providers at runtime.
const campaignDate = '2026-11-22';
const release = JSON.parse(fs.readFileSync(path.join(promoRoot, 'social-release-status.json'), 'utf8'));
const nativePlatforms = ['youtube', 'tiktok', 'instagram', 'bluesky'];
const approvedGames = release.games.filter(game => game.approved === true);
const approvedPosts = nativePlatforms.flatMap(platform => approvedGames.map(game => ({
  platform, game: game.slug, url: game.socialUrls?.[platform],
  publishedAt: campaignDate, approved: true, publicVerified: true
})));
if (approvedGames.length !== 7 || new Set(approvedGames.map(game => game.slug)).size !== 7 ||
    approvedPosts.some(post => typeof post.url !== 'string' || !post.url.startsWith('https://')) ||
    new Set(approvedPosts.map(post => post.url)).size !== 28) {
  throw Error('Expected 28 unique approved publication links from the November 22 campaign');
}
const metricsSnapshot = JSON.parse(fs.readFileSync(path.join(base, 'promotion', 'social-metrics-snapshot.json'), 'utf8'));
if (!Array.isArray(metricsSnapshot.publicationRounds?.rounds) ||
    metricsSnapshot.publicationRounds.rounds.length !== 2 ||
    metricsSnapshot.publicationRounds.rounds[0].status !== 'deleted' ||
    metricsSnapshot.publicationRounds.rounds[1].status !== 'active') {
  throw Error('The deleted morning round and active evening repost must remain separately recorded');
}
const social = {
  platforms: [{id:'itch'}, ...nativePlatforms.map(id => ({id, published: 7}))],
  metricScope: {type:'approved-short-videos-only', campaignStart:campaignDate, historicalExcluded:true,
    activeApprovedPosts:approvedPosts.length, verifiedPosts:approvedPosts},
  publicationRounds: metricsSnapshot.publicationRounds
};
const nativeHelpers = ['social-native.js','social-schedule.js'].map(file=>
  fs.readFileSync(path.join(base,'src',file),'utf8').replace(/^export /gm,'')).join('\n');
const tiktokNative=fs.readFileSync(path.join(base,'src','tiktok-native.js'),'utf8')
  .replace(/^export /gm,'').replace(/^import .*"\.\/social-native\.js";\n/gm,'');
const blueskyNative=fs.readFileSync(path.join(base,'src','bluesky-native.js'),'utf8')
  .replace(/^export /gm,'').replace(/^import .*"\.\/social-native\.js";\n/gm,'');
const youtubeNative=fs.readFileSync(path.join(base,'src','youtube-native.js'),'utf8')
  .replace(/^export /gm,'').replace(/^import .*"\.\/social-native\.js";\n/gm,'');
const instagramNative=fs.readFileSync(path.join(base,'src','instagram-native.js'),'utf8')
  .replace(/^export /gm,'').replace(/^import .*"\.\/social-native\.js";\n/gm,'');
const analytics = 'const SOCIAL_CAMPAIGN='+JSON.stringify(social)+';\n'
  + nativeHelpers+'\n'
  + tiktokNative+'\n'
  + blueskyNative+'\n'
  + youtubeNative+'\n'
  + instagramNative+'\n'
  + fs.readFileSync(path.join(base, 'src', 'analytics.js'), 'utf8')
    .replace('import {authorizedSocialSchedule} from "./social-schedule.js";','')
    .replace('import {nativeTikTokRoute,nativeTikTokSnapshot} from "./tiktok-native.js";','')
    .replace('import {nativeBlueskySnapshot} from "./bluesky-native.js";','')
    .replace('import {nativeYouTubeSnapshot,nativeYouTubeRoute} from "./youtube-native.js";','')
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
