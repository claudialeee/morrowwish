// Newgrounds ZIP candidates and compliance queue. Never claim submission from CI.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { publishedGames } from './discovery.mjs';

const root = process.cwd(), source = path.join(root, 'public');
const out = path.join(root, 'release-kit', 'newgrounds');
const stage = path.join(root, '.ng-build');
const reviewPath = path.join(root, 'promotion', 'newgrounds-review.json');
const reviews = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf8')) : {};
const games = publishedGames();
fs.rmSync(stage, { recursive:true, force:true });
fs.mkdirSync(stage, { recursive:true });
fs.mkdirSync(out, { recursive:true });
const textFile = /\.(?:html|css|js|json|webmanifest)$/i;
function copy(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive:true });
    for (const n of fs.readdirSync(src)) copy(path.join(src,n), path.join(dest,n));
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive:true });
    fs.copyFileSync(src,dest);
  }
}
function portalHtml(html) {
  // Strip Morrow Wish / Vercel session telemetry; private user data never goes to a portal.
  html = html.replace(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (full, url) => /^\/(?:telemetry|playtest-pulse)\.js(?:\?.*)?$|^\/_vercel\/insights\/script\.js(?:\?.*)?$/.test(url) ? '' : full);
  html = html.replace(/<link\b[^>]*\bhref\s*=\s*["']https:\/\/en\.freepd\.cn[^"']*["'][^>]*>/gi,'');
  return html.replace(/<head([^>]*)>/i,
    (_, rest) => '<head' + rest + '><script>window.arcadeMetric=function(){};window.va=undefined;</script>');
}
function relativePaths(content, rel) {
  const d=path.posix.dirname(rel), depth=d==='.'?0:d.split('/').length;
  const prefix=depth?'../'.repeat(depth):'./';
  return content.replace(/(["'(])\/(?!\/)(?=[A-Za-z0-9_.-])/g, (_,open)=>open+prefix)
    .replace(/(href\s*=\s*["'])\/(["'])/gi, (_,open,close)=>open+prefix+close);
}
function rewrite(dir) {
  function visit(current) {
    for (const item of fs.readdirSync(current,{withFileTypes:true})) {
      const file=path.join(current,item.name);
      if(item.isDirectory()) { visit(file); continue; }
      const rel=path.relative(dir,file).split(path.sep).join('/');
      if (!textFile.test(item.name)) continue;
      let body=fs.readFileSync(file,'utf8');
      if (rel==='index.html') body=portalHtml(body);
      fs.writeFileSync(file,relativePaths(body,rel));
    }
  }
  visit(dir);
}
function missingAssets(dir) {
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  const missing=new Set();
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["'](\.?\.\/*[^"'#?]+)["']/g)) {
    const p=m[1];
    if(p==='./'||p==='../')continue;
    const target=path.resolve(dir,p);
    if(target.startsWith(dir+path.sep)&&!fs.existsSync(target))missing.add(p);
  }
  return [...missing];
}
const queue=[];
for(const game of games) {
  const dir=path.join(stage,game.slug);
  fs.mkdirSync(dir,{recursive:true});
  for(const item of fs.readdirSync(source,{withFileTypes:true})) {
    if(item.isFile()&&/\.(?:js|css)$/i.test(item.name)&&!['telemetry.js','playtest-pulse.js'].includes(item.name))
      copy(path.join(source,item.name),path.join(dir,item.name));
  }
  for(const folder of ['art','audio','icons','social']) copy(path.join(source,folder),path.join(dir,folder));
  copy(path.join(source,game.slug),path.join(dir,game.slug));
  copy(path.join(source,game.slug,'index.html'),path.join(dir,'index.html'));
  rewrite(dir);
  const missing=missingAssets(dir), review=reviews[game.slug]||{};
  const eligible=['humanLedCreation','thumbnailNonAI','rightsCleared','aiUsageDisclosureReviewed','privacyChecked']
    .every(key=>review[key]===true) && missing.length===0;
  const name=game.slug+'-newgrounds-candidate.zip', zip=path.join(out,name);
  fs.rmSync(zip,{force:true});
  execFileSync('zip',['-q','-r',zip,'.'],{cwd:dir});
  queue.push({slug:game.slug,title:game.title,description:game.description,studio:'Morrow Wish',
    sourceUrl:game.url,zip:name,zipRoot:'index.html',missingRootReferences:missing,
    review,eligibleForSubmission:eligible,status:'candidate-not-submitted',
    accountPortal:'https://www.newgrounds.com/projects/games/new',
    requiredNextStep:eligible
      ? 'Test game completely in Newgrounds preview, attach non-AI thumbnail, then publish at most two games per day. No programmatic portal publication exists here.'
      : 'Check human-led originality, non-AI thumbnail, all rights, AI disclosure, privacy and actual portal preview. Do not submit prompt-generated games.'});
}
fs.writeFileSync(path.join(out,'queue.json'),JSON.stringify({
  generatedAt:new Date().toISOString(),platform:'Newgrounds',maxPostsPerDay:2,
  noAutoPublish:true,games:queue},null,2)+'\n');
fs.rmSync(stage,{recursive:true,force:true});
console.log('Newgrounds ZIP candidates: '+queue.map(g=>g.slug).join(', '));
console.log('No games were submitted; account publishing requires compliance and a portal session.');
