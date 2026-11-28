// Independent game releases on the existing atomic Cloudflare Pages project.
// A live manifest pins the site and each game separately; never use an untested
// sibling from main, and never deploy an incomplete Pages directory.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
const games=['cat-bond','pawsibly-innocent'];
const origin='https://morrowwish.pages.dev',proxy='https://morrowwish.vercel.app';
const shaOK=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const candidate=process.env.GITHUB_SHA;
const run=(cmd,args,opts={})=>execFileSync(cmd,args,{encoding:'utf8',maxBuffer:64*1024*1024,...opts});
const git=(...args)=>run('git',args).trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function ensureRef(sha){
  if(!shaOK(sha))throw Error('Invalid release SHA');
  if(spawnSync('git',['cat-file','-e',sha+'^{commit}']).status!==0)
    run('git',['fetch','--no-tags','--depth=1','origin',sha],{stdio:'inherit'});
  git('cat-file','-e',sha+'^{commit}');
}
function normalize(data){
  if(!shaOK(data.sha))throw Error('Live site has no verifiable source SHA; refusing publication');
  const gameShas={};
  for(const game of games){
    const s=data.gameShas?.[game]??data.sha;
    if(!shaOK(s))throw Error('Invalid live game SHA: '+game);
    gameShas[game]=s;
  }
  return {sha:data.sha,gameShas};
}
async function live(host=origin){
  let err;
  for(let i=0;i<6;i++){
    try{return normalize(JSON.parse(run('curl',['-fsSL','--max-time','20',host+'/release-version.json?scope='+Date.now()])));}
    catch(e){err=e;await wait(2000);}
  }
  throw err;
}
function emit(values){for(const [k,v] of Object.entries(values)){console.log(k+'='+v);if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,k+'='+v+'\n');}}
function diff(a,b,dir){
  ensureRef(a);ensureRef(b);
  const s=spawnSync('git',['diff','--quiet',a,b,'--',dir]);
  if(s.status!==0&&s.status!==1)throw Error('git diff failed: '+dir);
  return s.status===1;
}
function restore(sha,dir,cwd=process.cwd()){
  ensureRef(sha);
  run('git',['restore','--source='+sha,'--staged','--worktree','--',dir],{cwd,stdio:'inherit'});
}
async function plan(){
  if(!shaOK(candidate))throw Error('Missing candidate SHA');
  const state=await live(),target=process.env.RELEASE_TARGET||'auto';
  ensureRef(state.sha);for(const game of games)ensureRef(state.gameShas[game]);
  const changed=git('diff','--name-only',state.sha,candidate,'--','public','src','promotion/social-metrics-snapshot.json','scripts/build-pages.mjs','cloudflare-pages/wrangler.jsonc','package.json','package-lock.json').split('\n').filter(Boolean);
  const site=target==='site'||(target==='auto'&&(changed.some(p=>!games.some(g=>p.startsWith('public/'+g+'/')))||process.env.GITHUB_EVENT_NAME==='workflow_run'||process.env.GENERATE_PROMOS==='true'));
  const selected=g=>(target==='auto'||target==='both-games'||target===g)&&diff(state.gameShas[g],candidate,'public/'+g);
  emit({site_sha:state.sha,cat_sha:state.gameShas[games[0]],paw_sha:state.gameShas[games[1]],cat:selected(games[0]),paw:selected(games[1]),site});
}
async function stageQA(game){
  if(!games.includes(game))throw Error('Unknown game');
  // Test against the currently published shared site assets, not unshipped main dependencies.
  restore(process.env.SITE_SHA,'public');
  restore(candidate,'public/'+game);
}
async function stageSite(){
  const state=await live();
  for(const game of games)restore(state.gameShas[game],'public/'+game);
  fs.appendFileSync(process.env.GITHUB_ENV,'MW_GAME_SHAS='+JSON.stringify(state.gameShas)+'\nMW_SITE_BASE_SHA='+state.sha+'\n');
}
async function assertLive(expected){
  for(const host of [origin,proxy]){
    let ok=false;
    for(let i=0;i<8;i++){
      const state=await live(host);
      if(state.sha===expected.sha&&games.every(g=>state.gameShas[g]===expected.gameShas[g])){ok=true;break;}
      await wait(2500);
    }
    if(!ok)throw Error('Release identity not live on '+host);
  }
}
async function verifyBytes(host,root,rel){
  const file=path.join(root,rel),url=host+'/'+rel.split('/').map(encodeURIComponent).join('/');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())throw Error('Missing published source: '+rel);
  const tmp=path.join(os.tmpdir(),'mw-scope-check-'+process.pid);
  try{
    for(let i=0;i<5;i++){
      try{
        run('curl',['-fsSL','--max-time','30','-o',tmp,url+'?scope='+candidate+'&attempt='+i]);
        if(fs.readFileSync(file).equals(fs.readFileSync(tmp)))return;
      }catch{}
      await wait(1800);
    }
    throw Error('Stale asset '+url);
  }finally{fs.rmSync(tmp,{force:true});}
}
async function publishOne(game,approvedBase){
  const state=await live();
  if(state.sha!==process.env.SITE_SHA)throw Error('Shared site changed after game QA; do not publish stale composite');
  if(state.gameShas[game]!==approvedBase){
    if(!diff(state.gameShas[game],candidate,'public/'+game)){console.log(game+' already live');return;}
    throw Error('Game release changed after QA: '+game);
  }
  if(!diff(approvedBase,candidate,'public/'+game))return;
  ensureRef(state.sha);
  for(const g of games)ensureRef(state.gameShas[g]);
  const next={sha:state.sha,gameShas:{...state.gameShas,[game]:candidate}};
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-game-release-'));
  const work=path.join(root,'source');
  try{
    run('git',['worktree','add','--detach',work,state.sha],{stdio:'inherit'});
    for(const g of games)restore(next.gameShas[g],'public/'+g,work);
    run('npm',['ci'],{cwd:work,stdio:'inherit'});
    run('npm',['install','--no-save','--no-package-lock','sharp@0.34.5'],{cwd:work,stdio:'inherit'});
    run('npm',['run','build:pages'],{cwd:work,stdio:'inherit',env:{...process.env,GITHUB_SHA:state.sha,MW_GAME_SHAS:JSON.stringify(next.gameShas)}});
    const out=path.join(work,'cloudflare-pages','public');
    // Older site commits may not understand MW_GAME_SHAS; normalize the manifest
    // here as well, after the canonical build and before the atomic publish.
    fs.writeFileSync(path.join(out,'release-version.json'),JSON.stringify(next)+'\n');
    const config=JSON.parse(fs.readFileSync(path.join(work,'cloudflare-pages','wrangler.jsonc'),'utf8'));
    if(config.name!=='morrowwish'||(config.d1_databases?.find(x=>x.binding==='DB')?.database_name!=='morrowwish-analytics'||config.d1_databases?.find(x=>x.binding==='DB')?.database_id!=='fbd62f69-1811-4538-a17f-ecc5be8ad7cc'))throw Error('Wrong existing Pages project or database');
    if(!process.env.CLOUDFLARE_API_TOKEN)throw Error('Missing existing Cloudflare credential');
    run('npx',['wrangler','pages','deploy','public','--project-name','morrowwish','--branch','main'],{cwd:path.join(work,'cloudflare-pages'),stdio:'inherit'});
    await assertLive(next);
    const changed=run('git',['diff','--name-only','--diff-filter=ACMRT','-z',approvedBase,candidate,'--','public/'+game]).split('\0').filter(Boolean).map(p=>p.slice(7));
    const core=game==='cat-bond'?['index.html','js/game.js','js/battle.js','css/style.css']:['index.html','game.js','single-screen.css'];
    const sibling=games.find(g=>g!==game);
    const siblingCore=sibling==='cat-bond'?['index.html','js/game.js','js/battle.js','css/style.css']:['index.html','game.js','single-screen.css'];
    for(const rel of new Set([...changed,...core.map(p=>game+'/'+p),...siblingCore.map(p=>sibling+'/'+p)]))await verifyBytes(origin,out,rel);
    // Minimize Vercel proxy requests; the direct Pages check covers every changed file.
    for(const rel of [game+'/index.html',game+'/'+(game==='cat-bond'?'js/game.js':'game.js'),sibling+'/index.html'])await verifyBytes(proxy,out,rel);
    console.log('SCOPED PRODUCTION VERIFIED '+game+' '+candidate+'; preserved '+sibling+' '+next.gameShas[sibling]);
  }finally{
    spawnSync('git',['worktree','remove','--force',work],{stdio:'inherit'});
    fs.rmSync(root,{recursive:true,force:true});
  }
}
async function publish(){
  let failed=false;
  for(const [game,enabled,base] of [[games[0],process.env.CAT_APPROVED,process.env.CAT_SHA],[games[1],process.env.PAW_APPROVED,process.env.PAW_SHA]]){
    if(enabled!=='true')continue;
    try{await publishOne(game,base);}catch(e){failed=true;console.error('::error::'+game+' scoped publication failed: '+e.message);}
  }
  if(failed)process.exitCode=1;
}
const command=process.argv[2];
if(command==='plan')await plan();
else if(command==='stage-qa')await stageQA(process.argv[3]);
else if(command==='stage-site')await stageSite();
else if(command==='publish')await publish();
else throw Error('Unknown scoped release command');
