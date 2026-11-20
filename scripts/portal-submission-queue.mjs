// Portal publishing queue: honest status tracking, not a website submission API.
import fs from 'node:fs';
import { publishedGames, trackedLink } from './discovery.mjs';

const policy=JSON.parse(fs.readFileSync('promotion/portal-status.json','utf8'));
const published=publishedGames();
const bySlug=new Map(published.map(g=>[g.slug,g]));
const portalEntries=policy.crazygames
  .filter(g=>bySlug.has(g.slug))
  .sort((a,b)=>a.priority-b.priority);
const unknown=published.filter(g=>!policy.crazygames.some(p=>p.slug===g.slug));
const itchRecords=new Map(policy.itch.games.map(g=>[g.slug,g]));
const crazy=portalEntries.map(entry=>{
  const game=bySlug.get(entry.slug);
  return {...entry,title:game.title,gameUrl:trackedLink(game,'crazygames','portal'),portalUrl:'https://developer.crazygames.com/games'};
});
for(const game of unknown) crazy.push({slug:game.slug,title:game.title,priority:null,status:'not-created',readiness:'qa-needed',notes:'New launch: check submission requirements',gameUrl:trackedLink(game,'crazygames','portal'),portalUrl:'https://developer.crazygames.com/games'});
const itch=published.map(game=>({
  slug:game.slug,title:game.title,
  status:itchRecords.get(game.slug)?.status||'not-created',
  gameUrl:trackedLink(game,'itch','portal'),
  portalUrl:policy.itch.studioUrl
}));
const md=[
  '<!-- morrowwish-portal-queue -->',
  '# CrazyGames + itch.io — Morrow Wish release queue',
  '',
  'This is **not proof of platform submission**. Update statuses only after seeing portal confirmation or an actual public project URL.',
  '',
  '**CrazyGames policy:** submit in the order below, one new submission per review cycle (studio caution, not a platform-advertised limit); check QA and cover readiness first.',
  '',
  '| # | Game | CrazyGames status | QA gate |',
  '|---|---|---|---|',
  ...crazy.map(g=>'| '+(g.priority??'new')+' | '+g.title+' | '+g.status+' | '+g.readiness+' |'),
  '',
  '**itch.io:** six existing games reported public by the studio; new Cat Bond entry is not yet verified as created.',
  '',
  '| Game | itch.io status | Official game |',
  '|---|---|---|',
  ...itch.map(g=>'| '+g.title+' | '+g.status+' | '+g.gameUrl+' |'),
  '',
  'For each actual **new public launch**, prepare the same game for itch.io and CrazyGames. Check both platform dashboards; log real submission IDs and public URLs, never infer publication from GitHub deploys.',
  '',
  'CrazyGames developer portal: https://developer.crazygames.com/games',
  '',
  'itch.io creator: https://itch.io/game/new',
  '',
  'Only these two platforms are in scope; Reddit and Newgrounds are excluded.',
  ''
].join('\n');
fs.mkdirSync('release-kit',{recursive:true});
fs.writeFileSync('release-kit/portal-queue.json',JSON.stringify({studio:'Morrow Wish',policyUpdatedAt:policy.updatedAt,crazy,itch},null,2)+'\n');
fs.writeFileSync('release-kit/portal-queue.md',md);
console.log('Prepared portal queue for '+published.length+' public games; no false external submission claims.');
