import {campaign} from "./campaign.mjs";
import {makeEngine} from "./engine.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const fail=reason=>({ok:false,reason});
const runtimes=new WeakMap();
// Every adapter using the same State object shares one transaction implementation.
export function getSlotRuntime(State){if(!runtimes.has(State))runtimes.set(State,createSlotRuntime(State));return runtimes.get(State)}
// One authority: always read the live slot, never cache an engine or mirror progression.
export function createSlotRuntime(State,{notify=()=>{}}={}){
 const listeners=new Set([notify]);
 const leases=new WeakMap();let busy=false;
 function read(){return makeEngine(campaign,State.S.resonance)}
 function capture(){const token=Object.freeze({});leases.set(token,{root:State.S,slot:State.activeSlot?.(),scene:read().view().current?.id??null});return token}
 function check(token){if(!token)return true;const lease=leases.get(token);return !!lease&&lease.root===State.S&&lease.slot===State.activeSlot?.()&&lease.scene===(read().view().current?.id??null)}
 function subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn)}
 function view(){const e=read(),v=e.view(),s=e.snapshot();return {...v,completed:s.completed,trust:s.trust,links:s.links,sanctuaries:s.sanctuaries,melodies:s.melodies,returned:s.returned,ambientDone:s.ambientDone,revision:s.revision}}
 // The optional physical side effect is part of the same local save as story
 // evidence. World ownership remains with the caller; only these fields may
 // be patched here. A cloud backup error does not undo a successful local save.
 function transaction(fn,{token,physical}={}){
  if(busy)return fail("transaction-busy");
  if(!check(token))return fail("stale-action");
  const root=State.S,slot=State.activeSlot?.(),old=clone(root.resonance),oldSamples=clone(root.npcStories),engine=read(),previous=engine.snapshot();
  const oldPhysical=Object.fromEntries(["resonanceExploration","coins","fish"].map(k=>[k,clone(root[k])]));
  let patch=null;
  if(physical!==undefined){
   if(typeof physical!=="function")return fail("invalid-physical-effect");
   try{patch=physical(clone(oldPhysical));}catch{return fail("invalid-physical-effect")}
   if(!patch||Object.keys(patch).some(k=>!["resonanceExploration","coins","fish"].includes(k))||["coins","fish"].some(k=>k in patch&&(!Number.isFinite(patch[k])||patch[k]<0)))return fail("invalid-physical-effect");
  }
  let r=fn(engine);
  if(!r?.ok)return r||fail("invalid-transition");
  if(State.S!==root||State.activeSlot?.()!==slot||!check(token))return fail("slot-changed");
  busy=true;
  const restore=(key,value)=>{if(value===undefined)delete root[key];else root[key]=value};
  try{
   root.resonance=clone(r.state);
   if(root.npcStories){delete root.npcStories.harborKeeper;delete root.npcStories.mulingCompanion;if(!Object.keys(root.npcStories).length)delete root.npcStories;}
   if(patch)for(const [key,value] of Object.entries(patch))restore(key,clone(value));
   let saved;try{saved=State.save()}catch{saved=fail("save-exception")}
   if(!saved?.ok){
    restore("resonance",old);restore("npcStories",oldSamples);
    if(patch)for(const [key,value] of Object.entries(oldPhysical))restore(key,value);
    return fail(saved?.reason||"save-failed");
   }
  }finally{busy=false}
  const trustChanges=Object.entries(r.state.trust).flatMap(([id,value])=>value===previous.trust[id]?[]:[{id,delta:value-previous.trust[id],value}]);
  if(State.S===root&&State.activeSlot?.()===slot)for(const listener of listeners){try{listener({revision:r.state.revision,sceneId:r.state.scene,trustChanges})}catch(error){console.error("Narrative notification failed after local save",error)}}
  return {ok:true,state:clone(r.state)};
 }
 const op=(sceneId,operation,options)=>transaction(e=>e.record(sceneId,operation),options);
 function recordNPC({sceneId,npcId,region,token}={}){
  if(!check(token))return fail("stale-action");
  const v=view(),s=v.current,actor=campaign.cast[npcId];
  if(!s||s.id!==sceneId||!actor||npcId==="player")return fail("npc-unavailable");
  const expectedRegion=s.chapter==="prologue"||s.chapter==="epilogue"?"garden":s.chapter;
  if(region!==expectedRegion||actor.region!==region&&npcId!=="muling")return fail("wrong-region");
  if(npcId==="muling"&&actor.region!==region&&!["companion","identity-revealed","betrayal-revealed"].includes(v.muling)&&!["starfall:F-03","starfall:F-04","starfall:F-05"].includes(s.id))return fail("companion-unavailable");
  if(s.id==="epilogue:E-02"&&npcId!=="muling")return fail("wrong-npc");
  if(s.lines.length&&!s.lines.some(l=>l.speaker===npcId)&&!s.choices.some(c=>c.npc===npcId))return fail("wrong-npc");
  const location=State.S.resonanceExploration?.location;if(campaign.regions.includes(region)&&location&&location!==region)return fail("wrong-map-location");
  const pending=v.objective.find(x=>x.startsWith("npc:"));
  if(!pending)return {ok:true,dialogueOnly:true};
  return op(sceneId,pending,{token});
 }
 function evidence({sceneId,operation,region,verified,outcome,token}={},physical){
  if(!check(token))return fail("stale-action");
  const s=view().current;
  if(!s||sceneId!==s.id||verified!==true||!s.requires.includes(operation))return fail("invalid-evidence");
  const kind=operation.split(":")[0];
  if(kind==="npc"||!["cinematic","explore","travel","puzzle","rescue","repair","melody","battle","mechanism"].includes(kind))return fail("invalid-source");
  if(kind==="battle"&&outcome!=="win")return fail("battle-not-won");
  if(kind==="battle"&&!token)return fail("action-token-required");
  if(campaign.regions.includes(s.chapter)&&region!==s.chapter)return fail("wrong-region");
  if(kind==="travel"&&region!==operation.split(":")[1])return fail("wrong-destination");
  if(physical&&!["explore","puzzle","rescue","repair","melody","travel"].includes(kind))return fail("invalid-physical-source");
  return op(sceneId,operation,{token,physical});
 }
 function ambient({id,operation,region,verified,token}={}){if(verified!==true||!read().ambientAvailable(region).some(a=>a.id===id&&a.operation===operation))return fail("invalid-ambient-evidence");return transaction(e=>e.ambient(id,operation),{token})}
 function support({region,action,verified,token}={}){if(verified!==true)return fail("support-unverified");if(!token)return fail("action-token-required");return transaction(e=>e.supportAction(region,action),{token})}
 function exchange({a,b,stage,actor,action,verified,token}={},physical){if(verified!==true||!token)return fail("exchange-unverified");if(State.S.resonanceExploration?.location!==actor)return fail("wrong-map-location");return transaction(e=>e.exchange({a,b,stage,actor,action}),{token,physical})}
 function postgame({id,operation,verified,token}={}){if(verified!==true||!token)return fail("postgame-unverified");return transaction(e=>e.postgame(id,operation),{token})}
 function npcProfile(id){const actor=campaign.cast[id];if(!actor||id==="player")return null;const v=view();return {id,name:clone(actor.name),region:actor.region,trust:v.trust[id],returned:v.returned.includes(id),phase:id==="muling"?v.muling:null,availableAmbient:read().ambientAvailable(actor.region).filter(a=>a.npc===id)}}
 function residents(region){const v=view();if(region==="garden"){const ids=[...v.returned];if(["companion","accountability-pending","accountable","reconciled"].includes(v.muling)||["prologue:P-04","prologue:P-05"].includes(v.current?.id))ids.unshift("muling");return [...new Set(ids)].map(npcProfile).filter(Boolean)}
  if(!v.regions.includes(region))return [];const ids=Object.values(campaign.cast).filter(n=>n.region===region).map(n=>n.id);if(v.current?.chapter===region&&["sky:S-04","library:M-03","library:M-05","starfall:F-03","starfall:F-04","starfall:F-05"].includes(v.current?.id))ids.push("muling");return ids.map(id=>({...npcProfile(id),scripted:id==="muling"}));}
 const follows=()=>view().muling==="companion"||view().muling==="identity-revealed";
 return Object.freeze({capture,isCurrentAction:check,subscribe,exchange,initialize:()=>State.S.resonance?{ok:true,state:clone(State.S.resonance)}:transaction(e=>({ok:true,state:e.snapshot()})),npcProfile,residents,follows,view,snapshot:()=>read().snapshot(),choose:(id,token)=>transaction(e=>e.choose(id),{token}),nextLine:token=>transaction(e=>e.nextLine(),{token}),finish:token=>transaction(e=>e.finish(),{token}),recordNPC,evidence,ambient,support,postgame,ambientAvailable:region=>read().ambientAvailable(region),supportProfile:region=>read().supportProfile(region)});
}
