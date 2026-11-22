// Merge only the newly recaptured Cat Bond video into the latest complete
// seven-game review manifest; preserve the other games' current trailer assets.
// This runs before the review-only GitHub Action commits the files.
import fs from 'node:fs';
import path from 'node:path';

const root='public/promo';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const latestFiles=fs.readdirSync(root)
  .map(file=>({file,n:Number(/^v(\d+)-review\.json$/.exec(file)?.[1]||0)}))
  .filter(x=>x.n>=11).sort((a,b)=>b.n-a.n);
if(!latestFiles.length)throw Error('Missing latest independent seven-game review');

const fresh=read(path.join(root,'v10-review.json'));
const freshAudit=read(path.join(root,'readability-audit-v10.json'));
const latest=latestFiles[0],target=path.join(root,latest.file);
const current=read(target);
const newCat=fresh.trailers.find(t=>t.slug==='cat-bond');
if(!newCat||newCat.duration<55||newCat.duration>=60||
  newCat.shots?.filter(x=>x.scene==='duo').length!==1||
  newCat.shots?.filter(x=>x.scene==='map-explore').length!==1||
  newCat.shots?.filter(x=>x.scene==='rare-encounter').length!==1||
  newCat.shots?.filter(x=>x.scene==='rare-aftermath').length!==1||
  !(['rare-encounter','battle-hud','battle-skills','duo','rare-aftermath','rare-capture']
    .every((scene,i,ordered)=>i===0||
      newCat.shots.findIndex(x=>x.scene===ordered[i-1])<
      newCat.shots.findIndex(x=>x.scene===scene)))||
  !newCat.shots?.some(x=>x.scene==='duo-quarrel'&&x.seconds>=6)||
  fresh.socialAutopublish!==false)
  throw Error('New Cat Bond trailer did not pass independent short-form review');
if(current.trailers?.length!==7||current.trailers.filter(t=>t.slug==='cat-bond').length!==1)
  throw Error('Latest review roster missing games');
const originals=new Map(current.trailers.filter(t=>t.slug!=='cat-bond').map(t=>[t.slug,t.video]));
current.trailers=current.trailers.map(t=>t.slug==='cat-bond'?newCat:t);
for(const [slug,video] of originals)
  if(current.trailers.find(t=>t.slug===slug)?.video!==video)
    throw Error('A different game was changed: '+slug);
current.createdAt=fresh.createdAt;
current.socialAutopublish=false;
const auditPath=path.join(root,'readability-audit-v'+latest.n+'.json');
if(!fs.existsSync(auditPath))throw Error('Latest review has no matched readability audit');
const audit=read(auditPath);
const freshCatScenes=freshAudit.scenes.filter(s=>s.game==='cat-bond');
if(freshCatScenes.length!==21||freshCatScenes.some(x=>!x.passed))
  throw Error('Missing complete and readable latest Cat Bond scenes');
audit.scenes=[...freshCatScenes,...audit.scenes.filter(s=>s.game!=='cat-bond')];
if(audit.scenes.some(x=>!x.passed))throw Error('Latest review contains unreadable shots');
audit.createdAt=fresh.createdAt;
audit.method=freshAudit.method+' · Other games retain current review scene timings.';
for(const item of current.trailers) {
  for(const asset of [item.video,item.poster])
    if(!asset?.startsWith('/promo/')||!fs.existsSync('public'+asset))
      throw Error('Latest review missing file: '+asset);
}
write(target,current);
write(auditPath,audit);
write(path.join(root,'readability-audit.json'),audit);
console.log('MERGED FRESH CAT BOND INTO V'+latest.n,
  JSON.stringify({duration:newCat.duration,scenes:freshCatScenes.length,
    otherGames:[...originals.keys()],approval:current.approval,
    target,readability:auditPath}));
