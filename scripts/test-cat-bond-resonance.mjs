import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
function verify(data,makeEngine){
 const assert=(b,m)=>{if(!b)throw Error(m)},ok=(r,m)=>{assert(r.ok,m+":"+r.reason);return r};
 let e=makeEngine(data),alt=makeEngine(data),third=makeEngine(data),count=0;
 const pass=(r,m)=>{ok(r,m);count++};
 function links(e){for(const [a,b,x,y] of data.links)for(let i=0;i<4;i++){const r=e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]});if(r.ok)count++}}
 function play(e,scene,variant=0){assert(e.view().current.id===scene.id,"sequence");assert(!e.record(scene.id,"fake:complete").ok,"fake operation");
  if(scene.choices.length&&scene.choiceTiming==="beforeAction"){assert(!e.record(scene.id,scene.requires[0]).ok,"missing advance choice");pass(e.choose(scene.choices[variant].id),"advance choice")}
  if(scene.lineGate.length&&scene.lines.length)assert(!e.nextLine().ok,"premature critical dialogue "+scene.id);
  if(scene.id==="finale:B-03"){assert(!e.record(scene.id,"mechanism:muling-unlock").ok,"early unlock");for(let i=0;i<6;i++)pass(e.supportAction(data.regions[i],data.support[i]),"support")}
  const deferred=scene.requires.filter(op=>["npc:public-accountability","npc:second-garden-key"].includes(op));for(const op of deferred)assert(!e.record(scene.id,op).ok,"premature epilogue action");
  for(const op of scene.requires.filter(op=>op!=="mechanism:muling-unlock"&&!deferred.includes(op))){pass(e.record(scene.id,op),op);assert(!e.record(scene.id,op).ok,"duplicate")}
  if(scene.id==="starfall:F-04"){assert(!e.finish().ok,"early finish");links(e);assert(e.view().ring,"ring");}
  for(const l of scene.lines){assert(l.text.zh&&l.text.en,"bilingual");pass(e.nextLine(),"line "+scene.id)}
  if(scene.choices.length&&scene.choiceTiming==="afterDialogue")pass(e.choose(scene.choices[variant].id),"after choice");
  for(const op of deferred)pass(e.record(scene.id,op),"completed epilogue action");
  if(scene.requires.includes("mechanism:muling-unlock"))pass(e.record(scene.id,"mechanism:muling-unlock"),"unlock");
  const snap=e.snapshot();e=makeEngine(data,JSON.parse(JSON.stringify(snap)));assert(e.snapshot().cursor===snap.cursor,"restore");pass(e.finish(),scene.id);links(e);return e}
 assert(!e.finish().ok,"click-only");assert(!e.record("library:M-03","npc:identity-confrontation").ok,"early reveal");assert(!e.ambient("muling:tea","ambient:brew-bitter-tea").ok,"early ambient");
 for(const scene of data.scenes){e=play(e,scene);if(scene.id==="prologue:P-05"){assert(e.ambientAvailable("garden").some(a=>a.id==="muling:tea"),"tea available");pass(e.ambient("muling:tea","ambient:brew-bitter-tea"),"tea");assert(!e.ambient("muling:tea","ambient:brew-bitter-tea").ok,"repeat ambient")}}
 assert(e.view().ending,"ending");for(const q of data.side){pass(e.postgame(q.id,q.operation),"postgame");assert(!e.postgame(q.id,q.operation).ok,"repeat postgame")}
 assert(e.snapshot().returned.length===12,"returns");
 for(const scene of data.scenes.slice(0,7))alt=play(alt,scene,1);
 assert(alt.snapshot().trust.jiedeng===2&&e.snapshot().choices["harbor:H-02"]==="comfort"&&third.snapshot().trust.jiedeng===0&&third.snapshot().completed.length===0,"three slots");
 assert(alt.supportProfile("harbor").methods.includes("keeper-trust"),"choice affects support");
 return {scenes:data.scenes.length,lines:data.scenes.reduce((a,s)=>a+s.lines.length,0),successfulTransitions:count,postgame:data.side.length,ambient:data.ambient.length};
}
console.log(verify(campaign,makeEngine));
