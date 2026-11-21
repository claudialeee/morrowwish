// Static storyline integrity: every decision must belong to the actual
// selected route, with a bilingual situational question and matching outcome.
// This intentionally runs without a browser, database, or network.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx=vm.createContext({window:{},console});
const files=[
 'casefiles-a.js','casefiles-b.js','dream-lives.js','fresh-start.js',
 'absurd-worlds.js','route-endings.js','story-polish.js'
];
for(const f of files){
 const p='public/elsewhere/'+f;
 vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p,timeout:15000});
}
const worlds=['paris','amalfi','tokyo','moon','monday','maldives','iceland','swiss'];
const cases=ctx.window.ELSEWHERE_CASEFILES;
const endings=ctx.window.ELSEWHERE_ROUTE_ENDINGS;
const bilingual=(v,label)=>{
 assert.ok(Array.isArray(v)&&v.length===2,label+' must have English and Chinese');
 assert.ok(v.every(s=>typeof s==='string'&&s.trim().length>=4),label+' must have nonblank translation');
};
let checked=0;
for(const id of worlds){
 const c=cases[id];assert.ok(c,'Missing life '+id);
 assert.equal(c.paths.length,3,id+' opening must create three real routes');
 bilingual(c.intro.prompt,id+' intro question');
 bilingual(c.finale.prompt,id+' finale question');
 assert.equal(c.finale.routeChoices.length,3,id+' needs route-specific final decisions');
 for(let r=0;r<3;r++){
  const scenes=c.paths[r];assert.equal(scenes.length,3,id+'/'+r+' needs three middle scenes');
  assert.equal(c.finale.routeChoices[r].length,3,id+'/'+r+' needs three true endings');
  const titles=[];
  for(let step=0;step<3;step++){
   const scene=scenes[step];
   bilingual(scene.prompt,id+'/'+r+'/'+step+' story question');
   bilingual(scene.title,id+'/'+r+'/'+step+' title');
   bilingual(scene.body,id+'/'+r+'/'+step+' story');
   assert.equal(scene.choices.length,3,id+'/'+r+'/'+step+' must have three actions');
   for(const action of scene.choices){bilingual(action.title,id+' action');bilingual(action.result,id+' consequence')}
   checked++;
  }
  for(let j=0;j<3;j++){
   const end=c.finale.routeChoices[r][j];
   bilingual(end.title,id+'/'+r+'/'+j+' finale choice');
   bilingual(end.result,id+'/'+r+'/'+j+' finale result');
   assert.equal(end.gain,c.finale.choices[j].gain,id+' final must preserve ending category');
   assert.ok(endings[id]?.[r]?.[j],id+' has no earned ending for route '+r+' choice '+j);
   titles.push(end.title[0]);
  }
  assert.equal(new Set(titles).size,3,id+' offers duplicate finale choices');
  checked++;
 }
 assert.notEqual(c.finale.routeChoices[0][0].title[0],c.finale.routeChoices[1][0].title[0],
  id+' is incorrectly using the same final action after different scenes');
}
const engine=fs.readFileSync('public/elsewhere/dreams.js','utf8');
const html=fs.readFileSync('public/elsewhere/index.html','utf8');
assert.ok(engine.includes('c.finale.routeChoices?.[state.route]'), 'real game must use route-aware choices');
assert.ok(engine.includes('life-causal-bridge'), 'real game must present the previous cause');
assert.ok(engine.includes('life-ending-moments'), 'real endings must reflect intermediate choices');
assert.ok(html.indexOf('story-polish.js')>html.indexOf('absurd-worlds.js')&&
 html.indexOf('story-polish.js')<html.indexOf('dreams.js'),
 'story polish must run after casefiles and before UI initialization');
const capture=fs.readFileSync('scripts/capture-trailers-v7.mjs','utf8');
assert.ok(capture.includes("save.achievements?.['near-miss']")&&
 capture.includes("getElementById('achievementToast')")&&capture.includes('.award-title')&&
 capture.includes('REAL IN-GAME ACHIEVEMENT CARD')&&
 !capture.includes('NINE LIVES'),
 'promotional near-miss must display the real unlocked badge card (not a misleading subtitle)');
const paws=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
assert.ok(paws.includes('en:"Narrow escape",zh:"侥幸逃脱"')&&paws.includes('award-icon')&&
 paws.includes('award-desc'), 'near-miss must be named and shown as a real in-game reward');
assert.ok(capture.includes('first-coin')&&capture.includes('FIRST gold coin'),
 'Flip Dash video must show authentic first-coin pickup early');
console.log('Elsewhere branching QA passed: 8 lives, 24 distinct finales, '+checked+' story/ending checks; verified promo evidence hooks.');
