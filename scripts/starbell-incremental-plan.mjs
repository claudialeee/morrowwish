// Reuse only an ancestor whose real Pages publish and live-browser checks passed.
// Unknown changes, incomplete evidence, removed assets and test changes fail closed.
import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const chapters=['harbor','forest','forge','sky','library','starfall','finale','epilogue'];
const full=()=>({layout:true,opening:true,chapters:[...chapters],deploy:true});
const none=()=>({layout:false,opening:false,chapters:[],deploy:false});
const wf='.github/workflows/starbell-unified-layout.yml';
const planner='scripts/starbell-incremental-plan.mjs';
const runtime='public/cat-bond/js/resonance/world-runtime.mjs';
const entry='public/cat-bond/js/resonance/integration-entry.mjs';
const index='public/cat-bond/index.html';
const test='scripts/cat-bond-experience-chapters.mjs';
const prefix='public/cat-bond/assets/mobile-portrait/';
const art={
 'windchime-town-tall.webp':'harbor','harbor-ceremony-matched.webp':'harbor','harbor-chase.webp':'harbor','battle-windchime.webp':'harbor',
 'rootsleep-forest.webp':'forest','forest-moonleaf-bridge.webp':'forest','battle-forest.webp':'forest',
 'lantern-city.webp':'forge','lantern-shadow-square.webp':'forge','lantern-vault.webp':'forge','battle-lantern.webp':'forge',
 'skyspine-isles.webp':'sky','sky-farwind.webp':'sky','sky-glide.webp':'sky','story-cloud-tea.webp':'sky','battle-sky.webp':'sky',
 'moonmirror-library-tall.webp':'library','story-m03-reveal.webp':'library','battle-library.webp':'library',
 'starfall-expanse.webp':'starfall','story-f02-history.webp':'starfall','battle-starfall.webp':'starfall',
 'battle-finale.webp':'finale','battle-finale-chorus.webp':'finale','battle-finale-lock.webp':'finale','story-b04-reunion.webp':'finale',
 'story-e03-garden.webp':'epilogue','prologue-garden.webp':'opening','title-bell-sanctuary.webp':'opening'
};
const versionOnly=(s)=>s.replace(/((?:world-runtime|integration-entry)\.mjs\?v=)[\w.-]+/g,'$1VERSION');
const titleOnly=s=>s.replace(/(const title=E\("strong","rw-festival-title",tr\()"[^"\\\n]*","[^"\\\n]*"(\)\);)/g,'$1"TITLE","TITLE"$2');
const assertionOnly=s=>s.replace(/(assert\.equal\(await festival\.locator\('\.rw-festival-title'\)\.innerText\(\),locale==='zh'\?)'[^'\\\n]*':'[^'\\\n]*'(\);)/g,"$1'TITLE':'TITLE'$2");
function classify(changes,read){
 const p=none(),selected=new Set();
 for(const {status,path} of changes){
  if((path===wf||path===planner)&&['M','A'].includes(status))continue;
  if(status!=='M')return full();
  p.deploy=true;
  if(/^public\/cat-bond\/assets\/(?:audio|quality-audio)\/[^/]+\.(?:mp3|ogg|wav|m4a)$/i.test(path))continue; // existing build audio verification + live smoke
  if(path.startsWith(prefix)&&Object.hasOwn(art,path.slice(prefix.length))){
   const c=art[path.slice(prefix.length)];p.layout=true;
   if(c==='opening')p.opening=true;else selected.add(c);
   continue;
  }
  if(path===runtime&&titleOnly(read(path,false))===titleOnly(read(path,true))){selected.add('forge');continue;}
  if(path===test&&assertionOnly(read(path,false))===assertionOnly(read(path,true))){selected.add('forge');continue;}
  if((path===entry||path===index)&&versionOnly(read(path,false))===versionOnly(read(path,true)))continue;
  return full();
 }
 p.chapters=chapters.filter(c=>selected.has(c));
 // Cache-version-only edits have no content evidence; still smoke-test layout.
 if(p.deploy&&!p.chapters.length&&!p.opening&&!p.layout&&changes.some(x=>x.path===entry||x.path===index))p.layout=true;
 return p;
}
if(process.argv.includes('--self-test')){
 const change=(path,status='M')=>({path,status});
 const read=(p,newer)=>newer?'const title=E("strong","rw-festival-title",tr("中文","New title"));':'const title=E("strong","rw-festival-title",tr("中文","Old title"));';
 assert.deepEqual(classify([change(runtime)],read),{layout:false,opening:false,chapters:['forge'],deploy:true});
 assert.deepEqual(classify([change(prefix+'sky-glide.webp')],read).chapters,['sky']);
 assert.deepEqual(classify([change('public/cat-bond/assets/audio/harbor.mp3')],read).chapters,[]);
 assert.deepEqual(classify([change(prefix+'sky-glide.webp','D')],read),full());
 assert.deepEqual(classify([change(runtime)],(_,n)=>n?'different logic':'old logic'),full());
 assert.deepEqual(classify([change(wf),change(planner,'A')],read),none());
 console.log('Incremental release classifier self-tests passed');
 process.exit(0);
}
const sh=(bin,args)=>execFileSync(bin,args,{encoding:'utf8',maxBuffer:32*1024*1024}).trimEnd();
const repo=process.env.GITHUB_REPOSITORY,head=sh('git',['rev-parse','HEAD']);
let baseline=null,proof=null,p=full();
try{
 const runs=JSON.parse(sh('gh',['api','--method','GET','repos/'+repo+'/actions/workflows/starbell-unified-layout.yml/runs','-f','branch=review/starbell-unified-layout-fix','-f','status=success','-f','per_page=30'])).workflow_runs||[];
 for(const run of runs){
  if(run.head_sha===head||run.id===Number(process.env.GITHUB_RUN_ID)||!run.head_sha)continue;
  try{sh('git',['merge-base','--is-ancestor',run.head_sha,head]);}catch{continue;}
  const jobs=JSON.parse(sh('gh',['api','repos/'+repo+'/actions/runs/'+run.id+'/jobs?per_page=100'])).jobs||[];
  const release=jobs.find(j=>j.name==='preview'&&j.conclusion==='success');
  if(!release||!['Publish separate non-production Pages alias only','Verify deployed version and no production APIs','Verify live portrait title and new slot'].every(name=>release.steps?.some(s=>s.name===name&&s.conclusion==='success')))continue;
  baseline=run.head_sha;proof=run.id;break;
 }
 if(baseline){
  const raw=sh('git',['diff','--name-status','--no-renames',baseline,head]);
  const changes=raw?raw.split('\n').map(line=>{const [status,path]=line.split('\t');return {status,path};}):[];
  p=classify(changes,(path,newer)=>sh('git',['show',(newer?head:baseline)+':'+path]));
 }
}catch(e){console.warn('Cannot establish reuse evidence; run full gate:',e.message);p=full();baseline=null;proof=null;}
console.log(JSON.stringify({baseline,verifiedReleaseRun:proof,head,...p},null,2));
for(const key of ['layout','opening','chapters','deploy'])appendFileSync(process.env.GITHUB_OUTPUT,key+'='+(Array.isArray(p[key])?JSON.stringify(p[key]):String(p[key]))+'\n');
