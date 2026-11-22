// Exhaustive localization coverage of authored hidden branches, not random-path sampling.
// Production release gate: every reachable story variant and every legacy secret dataset.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const HAN=/[\u3400-\u9fff]/;
const root='public/elsewhere/';
const activeModules=[
 'casefiles-a.js','casefiles-b.js','dream-lives.js','fresh-start.js',
 'absurd-worlds.js','route-endings.js','story-polish.js'
];
const legacyModules=[
 'story.js','season.js','branches.js','endings.js',
 'mysteries.js','continuity.js','extra-scenes.js','fast-story.js'
];
const checked={paired:0,english:0,worlds:0,openings:0,storyChoices:0,finales:0,memories:0,duoMoves:0,files:0};
const seenIssues=[];
function issue(message){if(seenIssues.length<60)seenIssues.push(message);}
function validEnglish(value,place){
 if(typeof value!=='string'||!value.trim())issue(place+': missing English translation');
 else if(HAN.test(value))issue(place+': Chinese in English: '+value.slice(0,135));
 else checked.english++;
}
function walk(node,place,order){
 if(Array.isArray(node)){
  if(node.length===2 && node.every(v=>typeof v==='string') && order!=='english-only'){
   const en=order==='english-first'?node[0]:node[1];
   validEnglish(en,place+' English');
   checked.paired++;
   return;
  }
  node.forEach((v,i)=>walk(v,place+'['+i+']',order));return;
 }
 if(node&&typeof node==='object'){
  for(const [key,val] of Object.entries(node)){
   // Story may contain language-keyed scalars instead of a tuple.
   if(/^(?:en|english|.*En|.*EN|enTitle|enHint|enStory|enDesc)$/.test(key) && typeof val==='string')
    validEnglish(val,place+'.'+key);
   if(/^(?:zh|.*Zh|.*ZH)$/.test(key))continue;
   walk(val,place+'.'+key,order);
  }
  return;
 }
 if(typeof node==='string'){
  if(order==='english-only')validEnglish(node,place);
  else if(HAN.test(node))issue(place+': untranslated Chinese text outside bilingual pair: '+node.slice(0,135));
 }
}
function loadAll(files){
 const ctx=vm.createContext({window:{},console,structuredClone});
 for(const file of files){
  const filename=root+file;
  vm.runInContext(read(filename),ctx,{filename,timeout:15000});
 }
 return ctx.window;
}
const live=loadAll(activeModules);
const casefiles=live.ELSEWHERE_CASEFILES||{},endings=live.ELSEWHERE_ROUTE_ENDINGS||{};
assert.equal(Object.keys(casefiles).length,8,'All eight active Elsewhere dream lives must remain');
for(const [key,order] of [
 ['ELSEWHERE_CASEFILES','chinese-first'],['ELSEWHERE_VIBES','chinese-first'],
 ['ELSEWHERE_ROUTE_ENDINGS','chinese-first']
])walk(live[key],key,order);
for(const [id,world] of Object.entries(casefiles)){
 checked.worlds++;
 assert.equal(world.paths.length,3,id+' must have 3 unique openings');
 assert.equal(world.finale.routeChoices.length,3,id+' must have route-specific finales');
 for(let route=0;route<3;route++){
  checked.openings++;
  const scenes=world.paths[route];
  assert.equal(scenes.length,3,id+' route '+route+' has three intermediate scenes');
  for(const [step,scene] of scenes.entries()){
   assert.equal(scene.choices.length,3,id+' route '+route+' step '+step+' has three choices');
   checked.storyChoices+=scene.choices.length;
  }
  assert.equal(world.finale.routeChoices[route].length,3,id+' route '+route+' finale must have three endings');
  for(let choice=0;choice<3;choice++){
   assert.ok(endings[id]?.[route]?.[choice],id+' route '+route+' choice '+choice+' lacks a distinct ending');
   checked.finales++;
  }
 }
}
// Legacy, mystery, optional, and continuity story modules are still shipped;
// audit them as well even when not visible in the normal 5-scene experience.
const old=loadAll(legacyModules);
for(const key of ['ELSEWHERE_WORLDS','ELSEWHERE_SEASON','ELSEWHERE_BRANCH_EVENTS',
 'ELSEWHERE_FINAL_EVENTS','ELSEWHERE_LENS_LINES','ELSEWHERE_EIGHT_SCENE_BACKUP'])
 if(old[key])walk(old[key],key,'english-only');
for(const key of ['ELSEWHERE_ENDINGS','ELSEWHERE_MYSTERIES','ELSEWHERE_CONTINUITY'])
 if(old[key])walk(old[key],key,'english-first');
if(old.ELSEWHERE_EXTRA_SCENES)walk(old.ELSEWHERE_EXTRA_SCENES,'ELSEWHERE_EXTRA_SCENES','chinese-first');
for(const [original,translated] of Object.entries(old.MORROW_ZH_STORIES||{})){
 validEnglish(original,'historical translation source');
 assert.equal(typeof translated,'string','Legacy Chinese translation must be text');
}
// Cat Bond: hidden duo journals, all 21 element combinations and their stories
// use explicit locale-specific fields. Scanning raw Chinese originals as leaks
// would be incorrect; check precisely the English field read by the game.
const catContext=vm.createContext({
 window:{MorrowwishI18n:{get:()=> 'en'}},State:{S:{cats:[]}},Skills:{elementOf:x=>x.species||x},console
});
vm.runInContext(read('public/cat-bond/js/cat-relationships.js'),catContext,{
 filename:'public/cat-bond/js/cat-relationships.js',timeout:15000
});
const relations=catContext.window.CatRelations;
assert.ok(relations?.MEMORY_CATALOG?.length>=13,'Expected all duo memory entries including secret moments');
for(const m of relations.MEMORY_CATALOG){
 for(const field of ['en','enStory'])validEnglish(m[field],m.id+'.'+field);
 if(m.zhHint)validEnglish(m.enHint,m.id+'.enHint');
 checked.memories++;
}
assert.equal(Object.keys(relations.DUO_ARTS).length,21,'All 21 elemental duo skills must be retained');
for(const [element,values] of Object.entries(relations.DUO_ARTS)){
 validEnglish(values[1],element+' move name');
 validEnglish(values[3],element+' move description');
 checked.duoMoves++;
}
const elements=['fire','water','grass','elec','dark','light'];
for(const elementA of elements)for(const elementB of elements){
 const story=relations.secretStory({species:elementA},{species:elementB});
 validEnglish(story,'hidden duo secret '+elementA+'+'+elementB);
}
// All authored English fields in every game's script and HTML, including
// content not rendered in a normal play-through.
const gameDirs=['cat-bond','color-current','echo-heist','elsewhere','flip-dash',
 'grid-glider','mirror-mosaic','orbit-escape','parcel-panic','pawsibly-innocent',
 'perfect-pour','pocket-aquarium','tiny-town','tower-tuck','traffic-tangle'];
const gamePaths=[];
function collect(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())collect(p);
  else if(/\.(?:js|html|json)$/.test(p) && !/\.min\./.test(p))gamePaths.push(p);
 }
}
for(const slug of gameDirs)collect('public/'+slug);
for(const file of gamePaths){
 const text=read(file);checked.files++;
 // Explicit English-value string properties, including nested hidden event data.
 for(const m of text.matchAll(/\b(?:en|enText|enDesc|enSub|enStory|enHint|enName|enTitle|descEn|nameEn|titleEn|hintsEn|bodyEn)\s*:\s*(["'])([^"'\n]{1,500})\1/g))
  validEnglish(m[2],file+' English property');
 for(const m of text.matchAll(/\bdata-en\s*=\s*(["'])([^"'<>]{1,500})\1/g))
  validEnglish(m[2],file+' English HTML attribute');
}
if(seenIssues.length)throw Error('HIDDEN-STORY LANGUAGE FAIL ('+seenIssues.length+' shown):\n'+seenIssues.join('\n'));
assert.equal(checked.openings,24);
assert.equal(checked.storyChoices,216);
assert.equal(checked.finales,72);
console.log('ALL HIDDEN STORY LANGUAGES PASS '+JSON.stringify(checked));
