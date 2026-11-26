// Offline authoring audit. Separates canonical data from observed player evidence.
import fs from 'node:fs/promises';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {activities} from '../public/cat-bond/js/resonance/ambient-play.mjs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {layouts,puzzleSpecs} from '../public/cat-bond/js/resonance/world-exploration.mjs';
import {discoveries,availableDiscoveries,applyDiscovery,progress,earnedKeepsakes} from '../public/cat-bond/js/resonance/regional-discoveries.mjs';
import {recruitment,optionalRecruitment,companionRoles} from '../public/cat-bond/js/resonance/story-party.mjs';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'artifacts/cat-bond-experience';
await fs.mkdir(out,{recursive:true});
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const byId=new Map(campaign.scenes.map(s=>[s.id,s])),issues=[],chapters={},ordered=[];
const flags=(s,reason)=>issues.push({scene:s.id,reason});
for(const s of campaign.scenes){
 const requires=s.requires||[],lines=s.lines||[],choices=s.choices||[];
 if(s.previous&&!byId.has(s.previous))flags(s,'previous scene missing');
 if(new Set(requires).size!==requires.length)flags(s,'duplicate mandatory objective');
 for(const gate of s.lineGate||[])if(!requires.includes(gate))flags(s,'dialogue gate not listed as required: '+gate);
 for(const l of lines)if(!campaign.cast[l.speaker]||!l.text?.zh?.trim()||!l.text?.en?.trim())flags(s,'unknown speaker or missing localization');
 for(const c of choices)if(!c.label?.zh?.trim()||!c.label?.en?.trim())flags(s,'missing choice localization');
 const counts={};for(const op of requires){const type=op.split(':')[0];counts[type]=(counts[type]||0)+1;}
 const entry={scene:s.id,title:s.title,previous:s.previous,mandatory:requires,gate:s.lineGate||[],choiceTiming:s.choiceTiming,
   lines:lines.map(l=>({speaker:l.speaker,zh:l.text.zh,en:l.text.en})),choices:choices.map(c=>({id:c.id,label:c.label,actor:c.npc,method:c.method})),operationTypes:counts};
 ordered.push(entry);
 const ch=chapters[s.chapter]??={scenes:0,lines:0,choices:0,mandatory:0,types:{},sequence:[]};
 ch.scenes++;ch.lines+=lines.length;ch.choices+=choices.length;ch.mandatory+=requires.length;
 for(const [k,n] of Object.entries(counts))ch.types[k]=(ch.types[k]||0)+n;
 ch.sequence.push({scene:s.id,types:requires.map(op=>op.split(':')[0]),dialogueLines:lines.length,choices:choices.length});
}
// Check concrete stale presentation references against current script; these are review leads, not auto verdicts.
const dialogue=await fs.readFile('public/cat-bond/js/resonance/dialogue-ui.mjs','utf8');
const tea=byId.get('sky:S-04');
if(tea&&!tea.lines.some(l=>/修理|修复|repair/i.test(l.text.zh+' '+l.text.en))&&/修理旧铃坠|repairing the old bell pendant/.test(dialogue))flags(tea,'Presentation adds pendant repair not in canonical dialogue; remove or reconcile (confirmed by source comparison).');
const version={revision,canon:campaign.canon,openingPresentationVersion:campaign.openingPresentationVersion,sourceSha:campaign.sourceSha};
await fs.writeFile(out+'/authoring-structure.json',JSON.stringify({version,chapters,issues,ordered,limitations:['Not a rendered playthrough.','Objective count is not player click count or boredom.','Do not give this spoiler-containing file to a blind reviewer.']},null,2));
const rows=['# Campaign structure — spoiler-containing authoring audit','','Revision: '+revision,'','| Chapter | Scenes | Dialogue lines | Choice options | Required operations | Operation families |','|---|---:|---:|---:|---:|---|'];
for(const [k,c] of Object.entries(chapters))rows.push('| '+k+' | '+c.scenes+' | '+c.lines+' | '+c.choices+' | '+c.mandatory+' | '+Object.entries(c.types).map(([a,n])=>a+': '+n).join(', ')+' |');
rows.push('','## Review leads',...issues.map(i=>'- '+i.scene+': '+i.reason),'','Counts represent authored requirements, not actual player experience or difficulty. Semantic causal and emotional judgments still require review.');
await fs.writeFile(out+'/AUTHORING-STRUCTURE.md',rows.join('\n')+'\n');
console.log('Audit:',ordered.length,'scenes,',issues.length,'review leads');

// Source-generated inventory: an authored item is never marked browser-passed merely
// because it appears here. Runtime evidence must be revision matched and independent.
const inventory=[];
const add=(family,id,details={})=>inventory.push({family,id,...details,browserStatus:'not-verified-by-this-source-audit',evidence:null,severity:'unassessed',regression:'not-executed'});
for(const scene of campaign.scenes){
 add('scene',scene.id,{chapter:scene.chapter,title:scene.title,method:'real browser scene completion'});
 for(const op of scene.requires||[])add('required-operation',scene.id+'/'+op,{chapter:scene.chapter,method:'real input and durable evidence'});
 for(const choice of scene.choices||[])add('choice',scene.id+'/'+choice.id,{chapter:scene.chapter,method:'engine option coverage plus real browser choice path'});
}
for(const s of campaign.side||[])add('side-quest',s.id,{region:s.region,operation:s.operation,method:'real browser side quest completion and reload'});
for(const a of campaign.ambient||[])add('ambient',a.id,{region:a.region,actor:a.npc,after:a.after,before:a.before,operation:a.operation,method:'real browser optional interaction'});
for(const [a,b,forward,back] of campaign.links)add('cargo-link',a+':'+b,{forward,back,method:'complete send/receive both ways using real UI'});
for(const [id,n] of Object.entries(campaign.cast))add('story-actor',id,{name:n.name,region:n.region,role:companionRoles[id]||'player',method:'dialogue, party and actual renderer'});
for(const [id,actors] of Object.entries(recruitment))for(const actor of actors)add('recruitment',id+'/'+actor,{method:'real scene completion and roster reload'});
for(const [id,actors] of Object.entries(optionalRecruitment))for(const actor of actors)add('optional-recruitment',id+'/'+actor,{method:'real postgame reunion and roster reload'});
add('departure','library:M-05/muling',{method:'same UID retained in away roster, removed from active duo and team'});
add('return','epilogue:E-03/muling',{method:'same UID returned, persisted after reload'});
for(const [region,layout] of Object.entries(layouts)){
 add('region',region,{name:layout.name,method:'real map navigation and return visits'});
 for(const [id,feature] of Object.entries(layout.features))add('map-feature',region+'/'+id,{label:feature.slice(2),method:'walk/action and durable state'});
}
for(const [id,p] of Object.entries(puzzleSpecs))add('puzzle',id,{type:p.type,method:'real inputs, incorrect attempt and recovery'});
for(const [region,d] of Object.entries(discoveries))for(const step of d.steps)add('discovery',region+'/'+step.id,{mode:step.mode||'normal',requires:step.requires,method:'real map interaction; source state-machine checks recorded separately'});
const context=vm.createContext({window:{},console});
for(const file of ['data.js','skills.js'])vm.runInContext(await fs.readFile('public/cat-bond/js/'+file,'utf8'),context,{filename:file});
const {GameData,Skills}=context.window;
const roster=[GameData.speciesById('jinjc'),...GameData.SPECIES,...Object.values(GameData.STORY_SPECIES)];
for(const sp of roster){
 add('roster',sp.id,{rarity:sp.rarity,element:Skills.elementOf(sp.id),method:'capture/recruit where applicable, actual battle and rendered art'});
 if(Skills.breedPassive(sp.id))add('passive',sp.id,{method:'combat prototype and actual encounter trigger'});
}
for(const skill of Skills.SKILLS)add('skill-catalog',skill.id,{element:skill.element,kind:skill.kind,vfx:skill.vfx,method:'verify RPG availability, actual cast/impact/status/VFX if reachable',availability:'requires-loadout-reachability-audit'});
const elements=['fire','water','grass','elec','dark','light'];
for(let i=0;i<elements.length;i++)for(let j=i;j<elements.length;j++)add('duo-element-pair',elements[i]+'+'+elements[j],{method:'actual roster rendering and legal in-battle trigger'});
for(const profile of ['desktop','portrait','landscape'])for(const lang of ['zh','en'])add('ui-profile',lang+'/'+profile,{method:'real input, layout, tutorial, navigation, accessibility smoke'});
for(const id of ['wild-capture','catdex','level-growth','learn-skill','evolution','breeding','team-selection','duo-bond','garden','save','reload','restart','audio','cinematics','difficulty','enemy-encounters','legacy-art-references'])add('system-review',id,{method:'enumerate reachable subcases in actual game and record browser results'});
const counts={};for(const row of inventory)counts[row.family]=(counts[row.family]||0)+1;
await fs.writeFile(out+'/coverage-inventory.json',JSON.stringify({revision,counts,rows:inventory,limitations:['Source inventory, not a browser pass matrix.','Skill catalog may include unavailable/legacy definitions; establish actual loadout reachability separately.','System-review rows require further subcase enumeration.']},null,2));
console.log('SOURCE COVERAGE INVENTORY',JSON.stringify(counts));
// Actual optional-exploration module state-machine test. Model position is controlled
// intentionally; these checks must not be presented as real player navigation.
const discoveryResults=[];
for(const [region,d] of Object.entries(discoveries)){
 const v={regions:[...campaign.regions],completed:[]};
 let w={location:region,positions:{},interactions:{},cargo:null};
 const available=()=>availableDiscoveries(region,w,v).map(s=>s.id);
 const apply=step=>applyDiscovery(region,step.id,w,v);
 const position=(step,offset=0)=>{w={...w,positions:{...w.positions,[region]:{x:step.at[0]+offset,y:step.at[1]}}};};
 assert.deepEqual(availableDiscoveries(region,{...w,cargo:{active:true}},v),[],'Cargo blocks discoveries '+region);
 assert.deepEqual(availableDiscoveries(region,w,{...v,regions:[]}),[],'Locked region '+region);
 for(const step of d.steps.filter(s=>s.mode!=='return')){
  assert.ok(available().includes(step.id),'Authored sequence not reachable '+region+'/'+step.id);
  position(step,.2);assert.equal(apply(step).ok,false,'Remote interaction blocked');
  position(step);const before=JSON.stringify(w.interactions),r=apply(step);
  assert.equal(r.ok,true,region+'/'+step.id);
  if(step.mode==='decoy'){
   assert.equal(r.decoy,true);assert.equal(JSON.stringify(w.interactions),before);assert.ok(!r.souvenir);
  }else{
   w=r.next;assert.ok(progress(region,w.interactions).done.includes(step.id));assert.equal(apply(step).ok,false,'Duplicate interaction blocked');
  }
  discoveryResults.push({region,id:step.id,mode:step.mode||'normal',status:'source-state-machine-pass'});
 }
 assert.equal(progress(region,w.interactions).complete,true);
 assert.equal(earnedKeepsakes(w.interactions).filter(x=>x.region===region).length,1);
 for(const step of d.steps.filter(s=>s.mode==='return')){
  assert.ok(!available().includes(step.id),'Return unlock requires region completion');
  v.completed.push(d.after);assert.ok(available().includes(step.id));position(step);
  const r=apply(step);assert.equal(r.ok,true);assert.deepEqual(r.souvenir,d.returnSouvenir);w=r.next;
  assert.equal(apply(step).ok,false,'Return keepsake cannot be awarded twice');
  assert.equal(progress(region,w.interactions).returned,true);
  discoveryResults.push({region,id:step.id,mode:'return',status:'source-state-machine-pass'});
 }
 assert.equal(earnedKeepsakes(w.interactions).filter(x=>x.region===region).length,2);
}
await fs.writeFile(out+'/discovery-model-checks.json',JSON.stringify({revision,results:discoveryResults,limitations:['Model-state inputs, not actual walking, map UI or screenshots.']},null,2));
console.log('DISCOVERY MODEL PASS',discoveryResults.length,'steps across',Object.keys(discoveries).length,'regions');

// Every authored optional event has a reachable presentation contract, including non-Muling NPCs.
assert.deepEqual(Object.keys(activities).sort(),campaign.ambient.map(a=>a.id).sort());
for(const a of campaign.ambient){const p=activities[a.id];assert.ok(campaign.cast[a.npc]);for(const field of ['title','action','hint'])assert.ok(p[field].length===2&&p[field].every(t=>typeof t==='string'&&t.trim()),a.id+' '+field);}
console.log('AMBIENT PRESENTATION CONTRACT PASS',campaign.ambient.length,'bilingual optional activities');
