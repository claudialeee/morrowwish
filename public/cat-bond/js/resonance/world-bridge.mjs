// Chat 3 physical-world adapter. Chat 4 owns the sole narrative mutation path.
import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const fail=reason=>({ok:false,reason}),stages=["sendA","receiveB","sendB","receiveA"];
export function createWorldBridge(State,{resolveNarrative=()=>getSlotRuntime(State)}={}){
 let cachedRoot,cachedStory,cachedApi,cachedView;
 function view(){const api=resolveNarrative();if(!api?.view)throw Error("Canonical narrative host not mounted");const root=State.S;if(cachedRoot===root&&cachedStory===root.resonance&&cachedApi===api&&cachedView)return cachedView;cachedRoot=root;cachedStory=root.resonance;cachedApi=api;return cachedView=api.view();}
 const world=()=>{const w=clone(State.S.resonanceExploration)||{};return {location:w.location||null,positions:w.positions||{},interactions:w.interactions||{},pickups:w.pickups||{},cargo:w.cargo||null};};
 // Physical-only saves are independent. Narrative operations use Chat 4\'s pure physical patch callback in the shared atomic transaction.
 function physical(change,reward=null){
  const root=State.S,old=clone(root.resonanceExploration),coins=root.coins,fish=root.fish,next=change(world());if(!next)return fail("invalid-world-state");
  root.resonanceExploration=next;if(reward){root.coins=(root.coins||0)+(reward.coins||0);root.fish=(root.fish||0)+(reward.fish||0);}
  let r;try{r=State.save()}catch{r=fail("save-exception");}
  if(!r?.ok||State.S!==root){if(old===undefined)delete root.resonanceExploration;else root.resonanceExploration=old;root.coins=coins;root.fish=fish;cachedRoot=null;return fail(r?.reason||"slot-changed");}
  cachedRoot=null;return {...r,ok:true,reward};
 }
 function enter(region){if(!view().regions.includes(region))return fail("region-locked");return physical(w=>({...w,location:region}));}
 function position(region,x,y){if(world().location!==region||!campaign.regions.includes(region)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return fail("invalid-position");return physical(w=>({...w,positions:{...w.positions,[region]:{x,y}}}));}
 function patch(change,reward){return prior=>{const w=prior.resonanceExploration||{};return {resonanceExploration:change(clone(w)),coins:(prior.coins||0)+(reward.coins||0),fish:(prior.fish||0)+(reward.fish||0)};};}
 function recordWorld(sceneId,op,proof){
  const api=resolveNarrative(),v=view(),region=v.current?.chapter,w=world();
  if(v.current?.id!==sceneId||w.location!==region||!campaign.regions.includes(region)||!v.objective.includes(op)||proof?.sceneId!==sceneId||proof.operation!==op||proof.region!==region||proof.verified!==true)return fail("invalid-world-evidence");
  if(!/^(explore|puzzle|rescue|repair|melody):/.test(op))return fail("owned-by-other-module");
  if(w.interactions[sceneId+":"+op])return fail("already-completed");
  if(op.startsWith("melody:")){const ids=Object.values(campaign.cast).filter(n=>n.region===region).map(n=>n.id);if(!ids.every(id=>proof.participants?.includes(id))||proof.responses?.length!==3||!ids.every(id=>proof.responses.some(r=>r.actor===id)))return fail("local-response-required");}
  const reward=op.startsWith("melody:")?{coins:35,fish:3}:op.startsWith("repair:")?{coins:25,fish:1}:op.startsWith("explore:")?{coins:8,fish:1}:{coins:12,fish:1};
  if(typeof api?.evidence!=="function"||!proof.token)return fail("canonical-host-unavailable");
  const r=api.evidence({sceneId,operation:op,region,verified:true,token:proof.token},patch(x=>({...x,interactions:{...x.interactions,[sceneId+":"+op]:true}}),reward));cachedRoot=null;return r.ok?{...r,reward}:r;
 }
 function cargoSpec(a,b){const l=campaign.links.find(([x,y])=>x===a&&y===b);if(!l)return null;const v=view(),i=(v.links[a+":"+b]||[]).length,actor=[a,b,b,a][i];if(i>=4||!v.regions.includes(a)||!v.regions.includes(b))return null;const end=a==="starfall"?"starfall:F-02":campaign.scenes.filter(s=>s.chapter===a).at(-1)?.id;if(!v.completed.includes(end))return null;return {a,b,stage:stages[i],actor,action:l[i<2?2:3],from:i%2===0?0:1,to:i%2===0?1:0};}
 function pickupCargo(option){const w=world(),s=option&&cargoSpec(option.a,option.b);if(w.cargo)return fail("cargo-busy");if(!s||w.location!==s.actor||!["a","b","stage","actor","action","from","to"].every(k=>option[k]===s[k]))return fail("invalid-cargo");return physical(x=>({...x,cargo:s}));}
 function exchange(a,b,proof){const api=resolveNarrative(),s=cargoSpec(a,b),w=world();if(!s||!w.cargo||w.location!==s.actor||proof?.region!==s.actor||proof.stage!==s.stage||proof.action!==s.action||proof.verified!==true||!["a","b","stage","actor","action","from","to"].every(k=>w.cargo[k]===s[k]))return fail("exchange-evidence-missing");
  if(typeof api?.exchange!=="function"||!proof.token)return fail("canonical-exchange-unavailable");
  const reward={coins:10,fish:1},r=api.exchange({a,b,stage:s.stage,actor:s.actor,action:s.action,verified:true,token:proof.token},patch(x=>({...x,cargo:null}),reward));cachedRoot=null;return r.ok?{...r,reward}:r;
 }
 function pickupReward(region,id){const w=world();if(w.location!==region||!/^cache-[12]$/.test(id)||w.pickups[region+":"+id])return fail("already-collected");return physical(x=>({...x,pickups:{...x.pickups,[region+":"+id]:true}}),id==="cache-1"?{coins:14,fish:1}:{coins:22,fish:2});}
 return Object.freeze({view,world,enter,position,recordWorld,exchange,pickupCargo,pickupReward,cargoSpec,capture:()=>resolveNarrative().capture(),slotIdentity:()=>State.S,isSlot:owner=>State.S===owner});
}
