// Single-source game catalog, search discovery and distribution assets.
// Source of truth: visible, playable links on the Morrow Wish homepage.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ORIGIN = 'https://morrowwish.vercel.app';
const ROOT = process.cwd();
export const INDEXNOW_KEY = createHash('sha256').update('morrowwish.vercel.app/indexnow/v1').digest('hex').slice(0,32);
const PUBLIC = path.join(ROOT, 'public');
const xml = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const clean = s => String(s || '').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
const attribute = (tag, name) => tag.match(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i'))?.[1] || '';
const metaValue = (html, key, val) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0],key).toLowerCase() === val.toLowerCase()) return attribute(match[0],'content');
  }
  return '';
};
function gitDate(slug, added=false) {
  try {
    const args = ['log','-1', '--format=%cI'];
    if (added) args.push('--diff-filter=A');
    args.push('--','public/' + slug + '/');
    const d=execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    if (d && !Number.isNaN(Date.parse(d))) return d;
  } catch {}
  return '';
}
export function publishedGames() {
  const home = fs.readFileSync(path.join(PUBLIC,'index.html'),'utf8');
  const seen = new Set(), games=[];
  for (const match of home.matchAll(/<a\b[^>]*>/gi)) {
    const tag=match[0],slug=attribute(tag,'data-id'),href=attribute(tag,'href');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || href !== '/' + slug + '/' || seen.has(slug)) continue;
    const file=path.join(PUBLIC,slug,'index.html');
    if (!fs.existsSync(file)) throw Error('Homepage contains a non-playable game: ' + slug);
    seen.add(slug);
    const html=fs.readFileSync(file,'utf8');
    const rawTitle=clean(metaValue(html,'property','og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || slug);
    const title=rawTitle.replace(/\s+[—|]\s+(?:Morrow Wish|Free Browser Game).*$/i,'').trim() || slug;
    const description=clean(metaValue(html,'name','description') || metaValue(html,'property','og:description') || 'A free browser game from Morrow Wish. No signup required.').slice(0,250);
    const image=metaValue(html,'property','og:image') || '/social/tiny-town.png';
    const category=slug==='elsewhere'?'Interactive fiction':slug==='tiny-town'?'Cozy strategy':slug==='flip-dash'?'Arcade action':slug==='parcel-panic'?'Arcade puzzle':'Casual game';
    games.push({slug,title,description,url:ORIGIN+href,preview:new URL(image,ORIGIN).toString(),category,modified:gitDate(slug),published:gitDate(slug,true)});
  }
  if (!games.length) throw Error('No published game links on homepage.');
  return games;
}
export function trackedLink(game, source, medium='social', phase='launch') {
  const u=new URL(game.url);
  u.searchParams.set('utm_source',source);
  u.searchParams.set('utm_medium',medium);
  u.searchParams.set('utm_campaign',game.slug+'-'+phase);
  return u.toString();
}
function addMetadata(html, game) {
  // Preserve canonical source HTML and all existing tags. Only add missing metadata.
  const tags=[];
  if (!/<link\b[^>]*rel=["']canonical["']/i.test(html))
    tags.push('<link rel="canonical" href="'+xml(game.url)+'">');
  if (!metaValue(html,'name','description')) tags.push('<meta name="description" content="'+xml(game.description)+'">');
  if (!metaValue(html,'property','og:title')) tags.push('<meta property="og:title" content="'+xml(game.title)+'">');
  if (!metaValue(html,'property','og:description')) tags.push('<meta property="og:description" content="'+xml(game.description)+'">');
  if (!metaValue(html,'property','og:image')) tags.push('<meta property="og:image" content="'+xml(game.preview)+'">');
  if (!metaValue(html,'property','og:url')) tags.push('<meta property="og:url" content="'+xml(game.url)+'">');
  if (!metaValue(html,'name','twitter:card')) tags.push('<meta name="twitter:card" content="summary_large_image">');
  if (!metaValue(html,'name','twitter:title')) tags.push('<meta name="twitter:title" content="'+xml(game.title)+'">');
  if (!metaValue(html,'name','twitter:description')) tags.push('<meta name="twitter:description" content="'+xml(game.description)+'">');
  if (!metaValue(html,'name','twitter:image') && !game.preview.endsWith('.svg')) tags.push('<meta name="twitter:image" content="'+xml(game.preview)+'">');
  const schema={'@context':'https://schema.org','@type':'VideoGame',name:game.title,description:game.description,url:game.url,image:game.preview,genre:game.category,applicationCategory:'Game',operatingSystem:'Any',inLanguage:['en','zh'],isAccessibleForFree:true,playMode:'SinglePlayer',publisher:{'@type':'Organization',name:'Morrow Wish',url:ORIGIN}};
  if (!html.includes('"@type":"VideoGame"')) tags.push('<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>');
  return html.replace(/<\/head>/i,tags.join('\n')+'\n</head>');
}
function makeSitemap(games) {
  const pages=[{url:ORIGIN+'/',modified:''},...games];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(g=>'  <url><loc>'+xml(g.url)+'</loc>'+(g.modified?'<lastmod>'+xml(g.modified.slice(0,10))+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
}
function makeFeed(games) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Morrow Wish - free browser games</title><link>'+ORIGIN+'/</link><description>New free browser games from Morrow Wish</description><language>en</language>\n'+[...games].sort((a,b)=>(b.published||'').localeCompare(a.published||'')).map(g=>'<item><title>'+xml(g.title)+'</title><link>'+xml(g.url)+'</link><guid isPermaLink="true">'+xml(g.url)+'</guid><description>'+xml(g.description)+'</description>'+(g.published?'<pubDate>'+new Date(g.published).toUTCString()+'</pubDate>':'')+'</item>').join('\n')+'\n</channel></rss>\n';
}
export function generateDiscovery(out) {
  const games=publishedGames();
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'sitemap.xml'),makeSitemap(games));
  fs.writeFileSync(path.join(out,'feed.xml'),makeFeed(games));
  fs.writeFileSync(path.join(out,INDEXNOW_KEY+'.txt'),INDEXNOW_KEY);
  fs.writeFileSync(path.join(out,'games.json'),JSON.stringify({studio:'Morrow Wish',site:ORIGIN+'/',games},null,2)+'\n');
  for (const game of games) {
    const file=path.join(out,game.slug,'index.html');
    if (!fs.existsSync(file)) throw Error('Missing built game: '+game.slug);
    fs.writeFileSync(file,addMetadata(fs.readFileSync(file,'utf8'),game));
  }
  // Crawlable discovery links, generated from the same launch inventory.
  let home=fs.readFileSync(path.join(out,'index.html'),'utf8');
  if (!home.includes('rel="alternate" type="application/rss+xml"'))
    home=home.replace(/<\/head>/i,'<link rel="alternate" type="application/rss+xml" title="Morrow Wish game releases" href="/feed.xml">\n</head>');
  fs.writeFileSync(path.join(out,'index.html'),home);
  console.log('Discovery: '+games.map(g=>g.slug).join(', ')+'. Generated sitemap.xml, feed.xml, games.json and game metadata.');
  return games;
}
export function generateReleaseKit(dest) {
  const games=publishedGames();
  fs.mkdirSync(dest,{recursive:true});
  for (const game of games) {
    const base='New free browser game: '+game.title+'. '+game.description;
    const posts={
      reddit:'I made '+game.title+', a free browser game. '+game.description+'\n'+trackedLink(game,'reddit')+'\nWhat confused you or made you want to replay?',
      bluesky:(base.slice(0,175)+'\n'+trackedLink(game,'bluesky')).slice(0,300),
      threads:base.slice(0,300)+'\n'+trackedLink(game,'threads'),
      youtubeShorts:'What happens when you play '+game.title+'? '+game.description+'\nPlay free: '+trackedLink(game,'youtube','video'),
      tiktok:'Can you beat '+game.title+'? Play free: '+trackedLink(game,'tiktok','video'),
      discord:base+'\n'+trackedLink(game,'discord'),
    };
    const kit={...game,posts,
      crazygames:{title:game.title,description:game.description,developer:'Morrow Wish',submission:'https://developer.crazygames.com/',requirements:'Standalone HTML5 zip, game screenshots, actual gameplay and controls; developer review required.'},
      itch:{title:game.title,description:game.description,genre:game.category,gameURL:trackedLink(game,'itch','portal'),requirements:'Public project with uploaded playable HTML5 build, cover image and accurate tags; first-time setup required.'},
      newgrounds:{title:game.title,description:game.description,gameURL:trackedLink(game,'newgrounds','portal'),requirements:'HTML5 game package and moderated submission; platform-specific QA.'}
    };
    fs.writeFileSync(path.join(dest,game.slug+'.json'),JSON.stringify(kit,null,2)+'\n');
    fs.writeFileSync(path.join(dest,game.slug+'.md'),'# '+game.title+'\n\n'+game.description+'\n\nOfficial game: '+game.url+'\n\n## Promotion posts\n\n'+Object.entries(posts).map(([platform,post])=>'### '+platform+'\n\n'+post).join('\n\n')+'\n\n## Game portals\n\nCrazyGames: https://developer.crazygames.com/\n\nitch.io: https://itch.io/game/new\n\nNewgrounds: https://www.newgrounds.com/projects/games/new\n\nPublishing a package on a game portal is a separate process; these are metadata and copy, not submitted games.\n');
  }
  console.log('Prepared '+games.length+' game launch kits in '+dest);
  return games;
}
const command=process.argv[2];
if (command==='--release-kit') generateReleaseKit(path.join(ROOT,'release-kit'));
if (command==='--discovery') generateDiscovery(path.join(ROOT,'cloudflare-pages','public'));
