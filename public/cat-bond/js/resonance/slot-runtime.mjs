import {campaign} from "./campaign.mjs";
import {makeEngine} from "./engine.mjs";
import {layouts} from "./world-exploration.mjs";
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
 function view(){const e=read(),v=e.view(),s=e.snapshot();return {...v,completed:s.completed,trust:s.trust,links:s.links,sanctuaries:s.sanctuaries,melodies:s.melodies,returned:s.returned,postgame:s.postgame,ruins:s.ruins,ambientDone:s.ambientDone,revision:s.revision}}
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
  if(npcId==="muling"&&s.id==="library:M-05"&&v.cursor>=s.lines.length&&v.choice)return fail("companion-unavailable");
  const requiredActor=s.id==="starfall:F-01"?(v.objective.includes("npc:central-dispute")?"xingya":v.objective.includes("npc:central-dispute-lichuan")?"lichuan":null):{"harbor:H-01":"qilan","harbor:H-02":"jiedeng","sky:S-04":"muling","library:M-03":"muling","starfall:F-03":"muling","epilogue:E-02":"muling"}[s.id];
  if(requiredActor&&v.objective.some(o=>o.startsWith("npc:"))&&npcId!==requiredActor)return fail("wrong-npc");
  if(s.lines.length&&!s.lines.some(l=>l.speaker===npcId)&&!s.choices.some(c=>c.npc===npcId))return fail("wrong-npc");
  const location=State.S.resonanceExploration?.location;if(campaign.regions.includes(region)&&location&&location!==region)return fail("wrong-map-location");
  const pending=v.objective.find(x=>x.startsWith("npc:"));
  if(pending&&["starfall:F-01","starfall:F-03"].includes(s.id)){const p=State.S.resonanceExploration?.positions?.starfall,point={xingya:[.51,.58],lichuan:[.78,.48],muling:[.92,.30]}[npcId];if(!token||location!=="starfall"||!p||!point||Math.hypot(p.x-point[0],p.y-point[1])>=.072)return fail("walk-to-story-npc");}
  if(!pending||["npc:public-accountability","npc:second-garden-key"].includes(pending))return {ok:true,dialogueOnly:true};
  return op(sceneId,pending,{token});
 }
 function completeNPCScene({sceneId,operation,region,npcId,verified,token}={}){
  const v=view();if(!token||!check(token)||verified!==true||region!=="garden"||npcId!=="muling"||sceneId!==v.current?.id||!v.objective.includes(operation)||v.cursor!==v.current.lines.length||!["npc:public-accountability","npc:second-garden-key"].includes(operation))return fail("npc-scene-incomplete");
  return op(sceneId,operation,{token});
 }
 function evidence({sceneId,operation,region,verified,outcome,token}={},physical){
  if(!check(token))return fail("stale-action");
  const s=view().current;
  if(!s||sceneId!==s.id||verified!==true||!s.requires.includes(operation))return fail("invalid-evidence");
  const kind=operation.split(":")[0];
  if(kind==="npc"||!["cinematic","explore","travel","puzzle","rescue","repair","melody","battle","mechanism"].includes(kind))return fail("invalid-source");
  if(s.chapter==="starfall"){const w=State.S.resonanceExploration;if(!token||w?.location!=="starfall")return fail("starfall-action-required");if(kind==="cinematic"){const p=w.positions?.starfall;if(!p||Math.hypot(p.x-.92,p.y-.30)>=.072)return fail("walk-to-central-ruins");}else if(["explore","puzzle","repair","melody"].includes(kind)&&typeof physical!=="function")return fail("starfall-world-evidence-required");}
  if(s.chapter==="finale"&&(!token||region!=="starfall"||State.S.resonanceExploration?.location!=="starfall"))return fail("finale-action-required");
  if(kind==="battle"&&outcome!=="win")return fail("battle-not-won");
  if(kind==="battle"&&!token)return fail("action-token-required");
  if(campaign.regions.includes(s.chapter)&&region!==s.chapter)return fail("wrong-region");
  if(kind==="travel"&&region!==operation.split(":")[1])return fail("wrong-destination");
  if(physical&&!["explore","puzzle","rescue","repair","melody","travel"].includes(kind))return fail("invalid-physical-source");
  return op(sceneId,operation,{token,physical});
 }
 function ambient({id,operation,region,verified,token}={}){if(verified!==true||!read().ambientAvailable(region).some(a=>a.id===id&&a.operation===operation))return fail("invalid-ambient-evidence");return transaction(e=>e.ambient(id,operation),{token})}
 function commitFinaleVictory({sceneId,operation,region,participants,verified,outcome,token}={}){
  if(!token||!check(token)||verified!==true||outcome!=="win"||sceneId!=="finale:B-03"||operation!=="battle:central-echo"||region!=="starfall"||State.S.resonanceExploration?.location!=="starfall")return fail("invalid-finale-victory");
  if(!Array.isArray(participants)||participants.some(x=>!x)||participants.length!==campaign.regions.length||new Set(participants.map(x=>x?.region)).size!==participants.length||participants.some(({region,action})=>!campaign.regions.includes(region)||campaign.support[campaign.regions.indexOf(region)]!==action))return fail("incomplete-finale-support");
  return transaction(engine=>{
   const saved=engine.snapshot();
   for(const {region,action} of participants){
    if(saved.support.includes(region))continue;
    const result=engine.supportAction(region,action);
    if(!result.ok)return result;
   }
   return engine.record(sceneId,operation);
  },{token,physical:old=>({coins:(old.coins||0)+180,fish:(old.fish||0)+8})});
 }
 function support({region,action,verified,token}={}){if(verified!==true)return fail("support-unverified");if(!token)return fail("action-token-required");return transaction(e=>e.supportAction(region,action),{token})}
 function exchange({a,b,stage,actor,action,verified,token}={},physical){if(verified!==true||!token)return fail("exchange-unverified");const w=State.S.resonanceExploration;if(w?.location!==actor)return fail("wrong-map-location");const cargo=w.cargo;if(typeof physical!=="function"||!cargo||!["a","b","stage","actor","action"].every(k=>cargo[k]===({a,b,stage,actor,action})[k]))return fail("exchange-evidence-missing");const path=layouts[actor]?.paths,index=["sendA","receiveB","sendB","receiveA"].indexOf(stage),to=index%2===0?1:0,point=actor==="forge"?[[.35,.76],[.79,.364]][to]:path?.[to===0?1:path.length-2],pos=w.positions?.[actor];
  if(index<0||cargo.from!==1-to||cargo.to!==to||!point||!pos||Math.hypot(pos.x-point[0],pos.y-point[1])>=.072)return fail("walk-to-recipient");
  // A reciprocal step and its exact one-time reward must commit together.
  const guarded=prior=>{
   const next=physical(clone(prior)),expected={...prior.resonanceExploration,cargo:null};
   if(!next||JSON.stringify(next.resonanceExploration)!==JSON.stringify(expected)||next.coins!==(prior.coins||0)+10||next.fish!==(prior.fish||0)+1)throw Error("Invalid reciprocal delivery patch");
   return next;
  };
  return transaction(e=>e.exchange({a,b,stage,actor,action}),{token,physical:guarded})
 }
 function postgame({id,operation,region,verified,token}={},physical){
  const q=campaign.side.find(q=>q.id===id&&q.operation===operation&&q.region===region),letter=id?.startsWith("postgame:letter-"),reunion=id?.startsWith("postgame:reunion-");
  if(verified!==true||!token||!check(token)||!q||(!letter&&!reunion)||!campaign.regions.includes(region)||State.S.resonanceExploration?.location!==region||typeof physical!=="function")return fail("postgame-unverified");
  const guarded=prior=>{
   const next=physical(clone(prior)),w=prior.resonanceExploration;
   const coins=letter?25:40,fish=letter?2:3;
   if(!next||next.coins!==(prior.coins||0)+coins||next.fish!==(prior.fish||0)+fish)throw Error("Invalid postgame reward");
   let expected=w;
   if(letter){const p=layouts[region].features["repair:"+region],pos=w.positions?.[region];if(!p||!pos||Math.hypot(pos.x-p[0],pos.y-p[1])>=.072)throw Error("Walk to the sanctuary");}
   else{
    const actors=Object.values(campaign.cast).filter(n=>n.region===region),key=n=>"postgame:visit:"+region+":"+n.id;
    const missing=actors.filter(n=>!w.interactions?.[key(n)]),pos=w.positions?.[region],point=layouts[region].castPoints[missing[0]?.id];
    if(missing.length!==1||!point||!pos||Math.hypot(pos.x-point[0],pos.y-point[1])>=.072)throw Error("Complete both resident visits");
    expected={...w,interactions:{...w.interactions,[key(missing[0])]:true}};
   }
   if(JSON.stringify(next.resonanceExploration)!==JSON.stringify(expected))throw Error("Invalid postgame world patch");
   return next;
  };
  return transaction(e=>e.postgame(id,operation),{token,physical:guarded});
 }
 function commitRuinsVictory({attemptId,duoPromise,verified,outcome,token}={}){if(verified!==true||outcome!=="win"||!token||!check(token)||State.S.resonanceExploration?.location!=="starfall")return fail("ruins-unverified");const first=!view().postgame.includes("postgame:ruins");const coins=(first?100:30)+(duoPromise===true?15:0),fish=(first?5:2)+(duoPromise===true?1:0);return transaction(e=>e.ruinsClear(attemptId,duoPromise),{token,physical:p=>({coins:(p.coins||0)+coins,fish:(p.fish||0)+fish})})}
 function npcProfile(id){const actor=campaign.cast[id];if(!actor||id==="player")return null;const v=view();return {id,name:clone(actor.name),region:actor.region,trust:v.trust[id],returned:v.returned.includes(id),phase:id==="muling"?v.muling:null,availableAmbient:read().ambientAvailable(actor.region).filter(a=>a.npc===id)}}
 function residents(region){const v=view();if(region==="garden"){const ids=[...v.returned];if(["epilogue:E-02","epilogue:E-03"].includes(v.current?.id))ids.push(...Object.values(campaign.cast).filter(n=>campaign.regions.includes(n.region)).map(n=>n.id));if(["companion","accountability-pending","accountable","reconciled"].includes(v.muling)||["prologue:P-04","prologue:P-05"].includes(v.current?.id))ids.unshift("muling");return [...new Set(ids)].map(npcProfile).filter(Boolean)}
  if(!v.regions.includes(region))return [];const ids=Object.values(campaign.cast).filter(n=>n.region===region).map(n=>n.id);const scene=v.current,scripted=["sky:S-04","library:M-03","library:M-05","starfall:F-03","starfall:F-04","starfall:F-05"].includes(scene?.id);
  const hasDialogue=(scene?.lines||[]).some(l=>l.speaker==="muling")||(scene?.choices||[]).some(c=>c.npc==="muling");
  const availableAmbient=read().ambientAvailable(region).some(a=>a.npc==="muling");
  if(!(scene?.id==="library:M-05"&&v.cursor>=scene.lines.length&&v.choice)&&((scene?.chapter===region&&scripted)||((availableAmbient||scene?.chapter===region&&hasDialogue)&&["companion","identity-revealed"].includes(v.muling))))ids.push("muling");return ids.map(id=>({...npcProfile(id),scripted:id==="muling"}));}
 // Compatibility query: ordinary world exploration never mounts a companion.
 // Joint flight and paired-water tasks render their participants in their own mechanism.
 const follows=()=>false;
 return Object.freeze({capture,isCurrentAction:check,completeNPCScene,commitFinaleVictory,commitRuinsVictory,subscribe,exchange,initialize:()=>State.S.resonance?{ok:true,state:clone(State.S.resonance)}:transaction(e=>({ok:true,state:e.snapshot()})),npcProfile,residents,follows,view,snapshot:()=>read().snapshot(),choose:(id,token)=>transaction(e=>e.choose(id),{token}),nextLine:token=>transaction(e=>e.nextLine(),{token}),finish:token=>transaction(e=>e.finish(),{token}),recordNPC,evidence,ambient,support,postgame,ambientAvailable:region=>read().ambientAvailable(region),supportProfile:region=>read().supportProfile(region)});
}
