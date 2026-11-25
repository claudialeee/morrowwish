// Chat 3 map adapter. The unmodified Chat 4 engine is the only story authority.
import { campaign } from "./campaign.mjs";
import { makeEngine } from "./engine.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const stages=["sendA","receiveB","sendB","receiveA"];
export function createWorldBridge(State){
 const read=()=>makeEngine(campaign,State.S.resonance);
 const view=()=>{const e=read(),v=e.view(),s=e.snapshot();return {current:v.current,cursor:v.cursor,choice:v.choice,lineReady:v.lineReady,objective:v.objective,regions:v.regions,ring:v.ring,ending:v.ending,muling:v.muling,completed:s.completed,sanctuaries:s.sanctuaries,melodies:s.melodies,links:s.links};};
 const world=()=>clone(State.S.resonanceExploration)||{location:null,positions:{},interactions:{}};
 function transaction(action,exploreMutation=null){
  const root=State.S,oldStory=clone(root.resonance),oldWorld=clone(root.resonanceExploration),engine=read();
  const result=action(engine);if(!result?.ok)return result;
  if(State.S!==root)return {ok:false,reason:"slot-changed"};
  root.resonance=clone(result.state);if(exploreMutation)root.resonanceExploration=exploreMutation(world());
  let saved;try{saved=State.save()}catch(e){saved={ok:false,reason:"save-exception"};}
  if(!saved?.ok){if(oldStory===undefined)delete root.resonance;else root.resonance=oldStory;if(oldWorld===undefined)delete root.resonanceExploration;else root.resonanceExploration=oldWorld;return {ok:false,reason:saved?.reason||"save-failed"};}
  return {ok:true,state:clone(result.state)};
 }
 function persistWorld(change){const root=State.S,old=clone(root.resonanceExploration),next=change(world());if(!next)return {ok:false,reason:"invalid-position"};root.resonanceExploration=next;let r;try{r=State.save()}catch(e){r={ok:false,reason:"save-exception"};}if(!r?.ok){if(old===undefined)delete root.resonanceExploration;else root.resonanceExploration=old;return {ok:false,reason:r?.reason||"save-failed"};}return {ok:true};}
 function enter(region){const v=view();if(!v.regions.includes(region))return {ok:false,reason:"region-locked"};return persistWorld(w=>({...w,location:region}));}
 function position(region,x,y){if(!campaign.regions.includes(region)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return {ok:false,reason:"invalid-position"};return persistWorld(w=>({...w,positions:{...w.positions,[region]:{x,y}}}));}
 function recordWorld(sceneId,op,proof){
  const v=view(),region=v.current?.chapter;
  if(v.current?.id!==sceneId||world().location!==region||!campaign.regions.includes(region)||!v.objective.includes(op)||!proof||proof.sceneId!==sceneId||proof.operation!==op||proof.region!==region)return {ok:false,reason:"invalid-world-evidence"};
  if(!/^(explore|puzzle|rescue|repair|melody):/.test(op))return {ok:false,reason:"owned-by-other-module"};
  if(proof.verified!==true)return {ok:false,reason:"unverified"};
  return transaction(e=>e.record(sceneId,op),w=>({...w,interactions:{...w.interactions,[sceneId+":"+op]:true}}));
 }
 function exchange(a,b,proof){const link=campaign.links.find(l=>l[0]===a&&l[1]===b),v=view(),location=world().location;if(!link)return {ok:false,reason:"unknown-link"};const i=v.links[a+":"+b].length,actor=[a,b,b,a][i],action=[link[2],link[2],link[3],link[3]][i];if(i>=4||location!==actor||!proof||proof.region!==actor||proof.action!==action||proof.stage!==stages[i]||proof.verified!==true)return {ok:false,reason:"exchange-evidence-missing"};return transaction(e=>e.exchange({a,b,stage:stages[i],actor,action}));}
 // These methods are for real host UI callbacks. The map never advances dialogue,
 // auto-finishes scenes, grants fake cinematic evidence or reports battle victory.
 return Object.freeze({view,world,enter,position,recordWorld,exchange});
}
