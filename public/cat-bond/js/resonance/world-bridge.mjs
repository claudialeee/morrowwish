// The canonical engine owns every narrative transition. The map owns physical state only.
import { campaign } from "./campaign.mjs";
import { makeEngine } from "./engine.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const stages=["sendA","receiveB","sendB","receiveA"];
const fail=reason=>({ok:false,reason});
export function createWorldBridge(State){
 let cachedRoot,cachedStory,cachedView;
 const read=()=>makeEngine(campaign,State.S.resonance);
 const view=()=>{const root=State.S;if(cachedRoot===root&&cachedStory===root.resonance&&cachedView)return cachedView;const e=read(),v=e.view(),s=e.snapshot();cachedRoot=root;cachedStory=root.resonance;return cachedView={current:v.current,cursor:v.cursor,choice:v.choice,lineReady:v.lineReady,objective:v.objective,regions:v.regions,ring:v.ring,ending:v.ending,muling:v.muling,completed:s.completed,sanctuaries:s.sanctuaries,melodies:s.melodies,links:s.links};};
 const world=()=>{const w=clone(State.S.resonanceExploration)||{};return {location:w.location||null,positions:w.positions||{},interactions:w.interactions||{},pickups:w.pickups||{},cargo:w.cargo||null};};
 function atomic(change){
  const root=State.S,oldStory=clone(root.resonance),oldWorld=clone(root.resonanceExploration),oldCoins=root.coins,oldFish=root.fish;
  const result=change(root);if(!result?.ok)return result;
  let saved;try{saved=State.save()}catch(e){saved=fail("save-exception");}
  if(!saved?.ok){
   if(oldStory===undefined)delete root.resonance;else root.resonance=oldStory;
   if(oldWorld===undefined)delete root.resonanceExploration;else root.resonanceExploration=oldWorld;
   root.coins=oldCoins;root.fish=oldFish;cachedRoot=null;
   return fail(saved?.reason||"save-failed");
  }
  cachedRoot=null;return result;
 }
 function transaction(action,exploreMutation=null,reward=null){
  const engine=read(),result=action(engine);if(!result?.ok)return result;
  return atomic(root=>{root.resonance=clone(result.state);if(exploreMutation)root.resonanceExploration=exploreMutation(world());if(reward){root.coins=(root.coins||0)+(reward.coins||0);root.fish=(root.fish||0)+(reward.fish||0);}return {ok:true,state:clone(result.state),reward};});
 }
 function persistWorld(change,reward=null){return atomic(root=>{const next=change(world());if(!next)return fail("invalid-world-state");root.resonanceExploration=next;if(reward){root.coins=(root.coins||0)+(reward.coins||0);root.fish=(root.fish||0)+(reward.fish||0);}return {ok:true,reward};});}
 function enter(region){if(!view().regions.includes(region))return fail("region-locked");return persistWorld(w=>({...w,location:region}));}
 function position(region,x,y){if(world().location!==region||!campaign.regions.includes(region)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return fail("invalid-position");return persistWorld(w=>({...w,positions:{...w.positions,[region]:{x,y}}}));}
 function recordWorld(sceneId,op,proof){
  const v=view(),region=v.current?.chapter;
  if(v.current?.id!==sceneId||world().location!==region||!campaign.regions.includes(region)||!v.objective.includes(op)||!proof||proof.sceneId!==sceneId||proof.operation!==op||proof.region!==region)return fail("invalid-world-evidence");
  if(!/^(explore|puzzle|rescue|repair|melody):/.test(op))return fail("owned-by-other-module");
  if(proof.verified!==true)return fail("unverified");
  if(op.startsWith("melody:")){const ids=Object.values(campaign.cast).filter(n=>n.region===region).map(n=>n.id);if(!ids.every(id=>proof.participants?.includes(id))||proof.responses?.length!==3)return fail("local-response-required");}
  const reward=op.startsWith("melody:")?{coins:35,fish:3}:op.startsWith("repair:")?{coins:25,fish:1}:op.startsWith("explore:")?{coins:8,fish:1}:{coins:12,fish:1};
  return transaction(e=>e.record(sceneId,op),w=>({...w,interactions:{...w.interactions,[sceneId+":"+op]:true}}),reward);
 }
 function exchange(a,b,proof){
  const link=campaign.links.find(l=>l[0]===a&&l[1]===b),v=view(),location=world().location;if(!link)return fail("unknown-link");
  const i=v.links[a+":"+b].length,actor=[a,b,b,a][i],action=[link[2],link[2],link[3],link[3]][i];
  const cargo=world().cargo;
  if(i>=4||location!==actor||!proof||proof.region!==actor||proof.action!==action||proof.stage!==stages[i]||proof.verified!==true||!cargo||cargo.a!==a||cargo.b!==b||cargo.stage!==stages[i]||cargo.action!==action)return fail("exchange-evidence-missing");
  return transaction(e=>e.exchange({a,b,stage:stages[i],actor,action}),w=>({...w,cargo:null}),{coins:10,fish:1});
 }
 function pickupCargo(option){const w=world(),v=view();if(w.cargo||!option||w.location!==option.actor)return fail("cargo-busy");const l=campaign.links.find(([a,b])=>a===option.a&&b===option.b),i=l?(v.links[l[0]+":"+l[1]]||[]).length:4;if(!l||i>=4||option.stage!==stages[i]||option.action!==l[i<2?2:3])return fail("invalid-cargo");return persistWorld(x=>({...x,cargo:clone(option)}));}
 function pickupReward(region,id){const w=world();if(w.location!==region||!/^cache-[12]$/.test(id)||w.pickups[region+":"+id])return fail("already-collected");const reward=id==="cache-1"?{coins:14,fish:1}:{coins:22,fish:2};return persistWorld(x=>({...x,pickups:{...x.pickups,[region+":"+id]:true}}),reward);}
 return Object.freeze({view,world,enter,position,recordWorld,exchange,pickupCargo,pickupReward});
}
