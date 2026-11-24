import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {makeEngine} from '../public/cat-bond/js/resonance/engine.mjs';
function selfTest(data,makeEngine){
 let e=makeEngine(data),other=makeEngine(data),third=makeEngine(data),count=0;
 const assert=(b,m)=>{if(!b)throw Error(m)},ok=(r,m)=>{assert(r.ok,m+":"+r.reason);count++};
 assert(!e.finish().ok,"click-only progression");assert(!e.record("library:M-03","npc:identity-confrontation").ok,"early reveal");
 function fillLinks(){for(const [a,b,x,y] of data.links)for(let i=0;i<4;i++){const r=e.exchange({a,b,stage:["sendA","receiveB","sendB","receiveA"][i],actor:[a,b,b,a][i],action:[x,x,y,y][i]});if(r.ok)count++}}
 for(const scene of data.scenes){assert(e.view().current.id===scene.id,"scene order");assert(!e.record(scene.id,"fake:complete").ok,"fake operation");if(scene.choices.length){ok(e.choose(scene.choices[0].id),"choice");assert(!e.choose(scene.choices.at(-1).id).ok,"duplicate choice")}
 for(const l of scene.lines){assert(l.text.zh&&l.text.en,"bilingual");ok(e.nextLine(),"line")}
 if(scene.id==="starfall:F-04"){fillLinks();assert(e.view().ring,"ring")}
 if(scene.id==="finale:B-03"){assert(!e.record(scene.id,"mechanism:muling-unlock").ok,"premature lock");for(let i=0;i<6;i++)ok(e.supportAction(data.regions[i],data.support[i]),"support")}
 for(const op of scene.requires){ok(e.record(scene.id,op),op);assert(!e.record(scene.id,op).ok,"duplicate")}
 let snap=e.snapshot();e=makeEngine(data,JSON.parse(JSON.stringify(snap)));assert(e.snapshot().cursor===snap.cursor,"reload");ok(e.finish(),scene.id);fillLinks()}
 assert(e.view().ending,"ending");for(const q of data.side){ok(e.postgame(q.id,q.operation),"postgame");assert(!e.postgame(q.id,q.operation).ok,"repeat postgame")}
 assert(e.snapshot().returned.length===12,"returns");assert(other.snapshot().completed.length===0&&third.snapshot().completed.length===0,"slot isolation");
 for(const scene of data.scenes.slice(0,7)){for(const l of scene.lines)ok(other.nextLine(),"alternate dialogue");if(scene.choices.length)ok(other.choose(scene.choices[1].id),"alternate choice");for(const op of scene.requires)ok(other.record(scene.id,op),"alternate action");ok(other.finish(),"alternate finish")}
 assert(other.snapshot().trust.jiedeng===2&&e.snapshot().choices["harbor:H-02"]==="comfort"&&third.snapshot().trust.jiedeng===0,"alternate trust");
 assert(other.supportProfile("harbor").methods.includes("keeper-trust"),"alternate support");
 return {scenes:data.scenes.length,lines:data.scenes.reduce((a,s)=>a+s.lines.length,0),successfulTransitions:count,postgame:data.side.length}
}
console.log(selfTest(campaign,makeEngine));
