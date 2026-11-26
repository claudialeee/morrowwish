// Select tests using the incremental PR commit range, never the cumulative PR file list.
export const scopes=['map','core','controls','prologue','book','audio','score','visual','story'];
export function selectScopes(paths){
 const out=new Set(),add=(...x)=>x.forEach(v=>out.add(v)),all=()=>add(...scopes.filter(v=>v!=='score'));
 for(const p of paths){
  if(/^scripts\/cat-bond-ci-scope\.mjs$|^\.github\/workflows\/cat-bond-(dev-qa|final-release-qa)\.yml$/.test(p))continue;
  if(/^\.github\/workflows\/cat-bond-/.test(p)){if(p.includes('bright-score'))add('score');else if(p.includes('harbor-flow'))add('map','story');else if(p.includes('rpg-audio'))add('audio');else if(p.includes('visual-polish'))add('visual');else if(p.includes('resonance-book'))add('book');else if(p.includes('release-prologue'))add('prologue');else if(p.includes('combined-controls'))add('controls');else if(p.includes('core-regression'))add('core');continue;}
  if(/rpg-audio-score\.js$|(?:render|reorchestrate)-cat-bond-score\.mjs$|grade-cat-bond-art\.py$/.test(p)){add('score','audio');continue;}
  if(/\/assets\/audio\/|\/assets\/quality-audio\/|rpg-audio\.js$|scripts\/.*cat-bond.*audio/.test(p)){add('audio');continue;}
  if(/\/resonance\/(?:world-runtime|world-exploration)\.mjs$|scripts\/cat-bond-harbor-playthrough\.mjs$/.test(p)){add('map','audio');continue;}
  if(/\/assets\/(?:resonance-world-v2|world)\/|\/resonance\/(?:world-runtime|world-bridge|world-exploration|world-mechanisms|sky-flight|library-mechanisms|ambient-puzzles|ambient-play)\.mjs$|\/css\/resonance-canonical-world\.css$|scripts\/(?:cat-bond-harbor-playthrough|check-cat-bond-resonance-world)\.mjs$/.test(p)){add('map');continue;}
  if(/\/resonance\/(?:campaign|engine|slot-runtime|narrative-host|home-conversations|dialogue-ui)\.mjs$|scripts\/(?:test-cat-bond-resonance|cat-bond-finale-real-playthrough|cat-bond-starfall-playthrough)/.test(p)){add('story','map');continue;}
  if(/\/resonance\/(?:npc-world|chapter-cinematics|library-reveal|sky-pendant-shot)\.mjs$|\/assets\/(?:cinematics|npc|npcs|portraits|garden)\/|\/assets\/.*\.(webp|png|svg|jpg)$|scripts\/.*cat-bond.*visual/.test(p)){add('visual');continue;}
  if(/\/resonance\/(?:title-entry|garden-bell)\.mjs$|opening|prologue/.test(p)&&p.includes('cat-bond')){add('prologue','book');continue;}
  if(/\/resonance\/(?:resonance-book|book-recipes)\.mjs$|\/(?:garden-projects|sunlit-garden|raising|relations)\.js$|scripts\/.*(?:book|garden|title-save)/.test(p)){add('book');continue;}
  if(/\/resonance\/(?:.*combat.*|battle-hud)\.mjs$|\/(?:battle|skills|game-data)\.js$|scripts\/check-cat-bond(?:-ai|-invariants)?\.mjs$|scripts\/.*(?:combat|duo-modal|battle-hud)/.test(p)){add('core','controls','story');continue;}
  if(/^(?:public\/cat-bond\/|scripts\/.*cat-bond|package(?:-lock)?\.json$)/.test(p)){all();continue;}
 }
 return Object.fromEntries(scopes.map(k=>[k,out.has(k)]));
}

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const only=(paths,expected)=>assert.deepEqual(Object.entries(selectScopes(paths)).filter(([,v])=>v).map(([k])=>k).sort(),expected.sort());
 only(['public/cat-bond/js/resonance/world-runtime.mjs'],['map','audio']);
 only(['scripts/cat-bond-harbor-playthrough.mjs'],['map','audio']);
 only(['public/cat-bond/assets/quality-audio/enchanted-valley.ogg'],['audio']);
 only(['public/cat-bond/js/resonance/npc-world.mjs'],['visual']);
 only(['public/cat-bond/js/rpg-audio-score.js'],['audio','score']);
 only(['public/cat-bond/js/resonance/world-runtime.mjs','public/cat-bond/js/resonance/resonance-book.mjs'],['map','audio','book']);
 only(['docs/cat-bond-rpg/story.md'],[]);
 only(['public/cat-bond/index.html'],scopes.filter(x=>x!=='score'));
 if(process.argv.includes('--self-test')){console.log('Incremental scope tests PASS');}
 else {
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
  const head=event.pull_request.head.sha;
  let paths,result;
  try{
   let before=event.action==='synchronize'&&event.before?event.before:git('merge-base',event.pull_request.base.sha,head);
   // A canceled or failed incremental run has not verified its changes. Select the
   // union of the still-unverified paths, not merely the last tiny fix commit.
   const api=process.env.GITHUB_API_URL||'https://api.github.com',repo=event.repository?.full_name;
   if(event.action==='synchronize'&&repo){
    try{
     const url=new URL(api+'/repos/'+repo+'/actions/workflows/cat-bond-dev-qa.yml/runs');
     url.searchParams.set('branch',event.pull_request.head.ref);url.searchParams.set('status','success');url.searchParams.set('per_page','30');
     const response=await fetch(url,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(8000)});
     if(!response.ok)throw Error('QA history HTTP '+response.status);
     const runs=(await response.json()).workflow_runs||[];
     const ancestor=(a,b)=>{try{git('merge-base','--is-ancestor',a,b);return true}catch{return false}};
     const good=runs.find(r=>/^[0-9a-f]{40}$/.test(r.head_sha)&&r.head_sha!==head&&ancestor(r.head_sha,before));
     if(good)before=good.head_sha;else before=git('merge-base',event.pull_request.base.sha,head);
     console.log('Last verified daily QA anchor: '+before);
    }catch(error){console.warn('Cannot resolve prior QA; conservatively verify changed PR files',error.message);before=git('merge-base',event.pull_request.base.sha,head);}
   }
   paths=git('diff','--name-only','--no-renames','-z',before,head).split('\0').filter(Boolean);
   result=selectScopes(paths);
  }catch(error){console.warn('Incremental range unavailable; run all daily suites',error.message);result=Object.fromEntries(scopes.map(k=>[k,true]));}
  // Changes to the CI router itself verify its contract and smoke the map path,
  // not a full campaign. Never report the daily workflow as release approval.
  if(paths?.some(p=>p==='scripts/cat-bond-ci-scope.mjs'||p==='.github/workflows/cat-bond-dev-qa.yml'))result.map=true;
  console.log(JSON.stringify({head,paths,result},null,2));
  fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([k,v])=>k+'='+v).join('\n')+'\n');
 }
}
