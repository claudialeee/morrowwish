import {campaign} from "./campaign.mjs";
import {makeEngine} from "./engine.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const fail=reason=>({ok:false,reason});
// One authority: always read the live slot, never cache an engine or mirror progression.
export function createSlotRuntime(State,{notify=()=>{}}={}){
 function read(){return makeEngine(campaign,State.S.resonance)}
 function view(){const e=read(),v=e.view(),s=e.snapshot();return {...v,completed:s.completed,trust:s.trust,links:s.links,sanctuaries:s.sanctuaries,melodies:s.melodies,returned:s.returned,ambientDone:s.ambientDone,revision:s.revision}}
 function transaction(fn){
  const root=State.S,old=clone(root.resonance),oldSamples=clone(root.npcStories),engine=read(),previous=engine.snapshot();let r=fn(engine);
  if(!r?.ok)return r||fail("invalid-transition");
  if(State.S!==root)return fail("slot-changed");
  root.resonance=clone(r.state);
  if(root.npcStories){delete root.npcStories.harborKeeper;delete root.npcStories.mulingCompanion;if(!Object.keys(root.npcStories).length)delete root.npcStories;}
  let saved;try{saved=State.save()}catch{saved=fail("save-exception")}
  if(!saved?.ok){if(old===undefined)delete root.resonance;else root.resonance=old;if(oldSamples===undefined)delete root.npcStories;else root.npcStories=oldSamples;return fail(saved?.reason||"save-failed")}
  const trustChanges=Object.entries(r.state.trust).flatMap(([id,value])=>value===previous.trust[id]?[]:[{id,delta:value-previous.trust[id],value}]);
  notify({revision:r.state.revision,sceneId:r.state.scene,trustChanges});return {ok:true,state:clone(r.state)}
 }
 const op=(sceneId,operation)=>transaction(e=>e.record(sceneId,operation));
 function recordNPC({sceneId,npcId,region}={}){
  const v=view(),s=v.current,actor=campaign.cast[npcId];
  if(!s||s.id!==sceneId||!actor||npcId==="player")return fail("npc-unavailable");
  const expectedRegion=s.chapter==="prologue"||s.chapter==="epilogue"?"garden":s.chapter;
  if(region!==expectedRegion||actor.region!==region&&npcId!=="muling")return fail("wrong-region");
  if(npcId==="muling"&&actor.region!==region&&!["companion","identity-revealed","betrayal-revealed"].includes(v.muling))return fail("companion-unavailable");
  if(s.lines.length&&!s.lines.some(l=>l.speaker===npcId)&&!s.choices.some(c=>c.npc===npcId))return fail("wrong-npc");
  const location=State.S.resonanceExploration?.location;if(campaign.regions.includes(region)&&location&&location!==region)return fail("wrong-map-location");
  const pending=v.objective.find(x=>x.startsWith("npc:"));
  if(!pending)return {ok:true,dialogueOnly:true};
  return op(sceneId,pending);
 }
 function evidence({sceneId,operation,region,verified,outcome}={}){
  const s=view().current;
  if(!s||sceneId!==s.id||verified!==true||!s.requires.includes(operation))return fail("invalid-evidence");
  const kind=operation.split(":")[0];
  if(kind==="npc"||!["cinematic","explore","travel","puzzle","rescue","repair","melody","battle","mechanism"].includes(kind))return fail("invalid-source");
  if(kind==="battle"&&outcome!=="win")return fail("battle-not-won");
  if(campaign.regions.includes(s.chapter)&&region!==s.chapter)return fail("wrong-region");
  if(kind==="travel"&&region!==operation.split(":")[1])return fail("wrong-destination");
  return op(sceneId,operation);
 }
 function ambient({id,operation,region,verified}={}){if(verified!==true||!read().ambientAvailable(region).some(a=>a.id===id&&a.operation===operation))return fail("invalid-ambient-evidence");return transaction(e=>e.ambient(id,operation))}
 function support({region,action,verified}={}){if(verified!==true)return fail("support-unverified");return transaction(e=>e.supportAction(region,action))}
 function postgame({id,operation,verified}={}){if(verified!==true)return fail("postgame-unverified");return transaction(e=>e.postgame(id,operation))}
 function npcProfile(id){const actor=campaign.cast[id];if(!actor||id==="player")return null;const v=view();return {id,name:clone(actor.name),region:actor.region,trust:v.trust[id],returned:v.returned.includes(id),phase:id==="muling"?v.muling:null,availableAmbient:read().ambientAvailable(actor.region).filter(a=>a.npc===id)}}
 function residents(region){const v=view();if(region==="garden"){const ids=[...v.returned];if(["companion","accountability-pending","accountable","reconciled"].includes(v.muling)||["prologue:P-04","prologue:P-05"].includes(v.current?.id))ids.unshift("muling");return [...new Set(ids)].map(npcProfile).filter(Boolean)}
  if(!v.regions.includes(region))return [];return Object.values(campaign.cast).filter(n=>n.region===region).map(n=>npcProfile(n.id));}
 const follows=()=>view().muling==="companion"||view().muling==="identity-revealed";
 return Object.freeze({npcProfile,residents,follows,view,snapshot:()=>read().snapshot(),choose:id=>transaction(e=>e.choose(id)),nextLine:()=>transaction(e=>e.nextLine()),finish:()=>transaction(e=>e.finish()),recordNPC,evidence,ambient,support,postgame,ambientAvailable:region=>read().ambientAvailable(region),supportProfile:region=>read().supportProfile(region)});
}
