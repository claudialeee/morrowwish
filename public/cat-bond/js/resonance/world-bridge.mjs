// Chat 3 physical-world adapter. Chat 4 owns the sole narrative mutation path.
import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const fail=reason=>({ok:false,reason}),stages=["sendA","receiveB","sendB","receiveA"];
const scentTrail=Object.freeze([
 {point:[.31,.58],name:["湿苔上的气味","Scent on damp moss"],clue:["湿苔上留下了药箱经过的痕迹。沿上方林道继续追踪。","The medicine crate passed through the damp moss. Follow the upper path."]},
 {point:[.42,.28],name:["林间药草痕迹","Herbs on the canopy path"],clue:["药草散落在通往根系水道的路上。","Loose herbs lead toward the root channel."]},
 {point:[.69,.53],name:["根系药材藏处","Medicine at the root channel"],clue:["药材被送去治疗地下根系。旁边的秘密水路一直通向芽禾的药草园。","The medicine was diverted to treat the underground roots. A hidden channel also leads directly to Yahe’s herb gardens."]}
]);
const tideTrail=[
 {point:[.82,.45],name:["查看退潮刻痕","Inspect the ebb marks"],clue:["退潮刻痕指向码头尽头。沿东岸石径寻找露出的台阶。","The ebb marks point toward the end of the pier. Follow the eastern stone path to the exposed steps."]},
 {point:[.80,.682],name:["寻找干燥石阶","Find the dry steps"],clue:["潮水退去，旧日志匣的入口就在前方。","The water has receded. The entrance to the old logbook chest is just ahead."]}
];
const tideKey=i=>"harbor:H-03:tide:"+i;
const tideNear=(w,p)=>{const q=w.positions.harbor;return !!q&&Math.hypot(q.x-p[0],q.y-p[1])<.072;};
const scentKey=i=>"forest:R-02:scent:"+i;
const scentAt=(w,i)=>{const p=w.positions.forest,q=scentTrail[i]?.point;return !!p&&!!q&&Math.hypot(p.x-q[0],p.y-q[1])<.072};
const upperGate={point:[.53,.40],npc:"yahe",name:["与芽禾撑开上层水闸","Open the upper gate with Yahe"],clue:["第一只猫留在上层控制水压；带另一只猫沿根桥前往地下水闸。","The first cat stays to regulate pressure. Lead the other cat across the root bridge to the lower gate."]};
const pairedKey="forest:R-03:upper-gate";
 function forestPair(root){
  const cats=root.cats||[],selected=(root.duoRelations?.active||[]).map(id=>cats.find(c=>c.uid===id)).filter(Boolean);
  const team=[...selected,...cats].filter((c,i,a)=>a.findIndex(x=>x.uid===c.uid)===i);
  return team.length?{upper:team[0].uid,lower:team[1]?.uid||"muling"}:null;
 }
 const validPair=(root,p)=>!!p&&typeof p==="object"&&p.upper!==p.lower&&root.cats?.some(c=>c.uid===p.upper)&&(p.lower==="muling"||root.cats?.some(c=>c.uid===p.lower));
const atForest=(w,q)=>{const p=w.positions.forest;return !!p&&Math.hypot(p.x-q[0],p.y-q[1])<.072};
// Muling's six letters are optional post-ending scenes. They do not reopen the seal or reverse the ending.
const homeLetters={
 harbor:{point:[.131,.341],letter:["岬灯、栖蓝：我曾把回家的愿望放在你们的安全之前。我会重新检查灯塔的回声路径，这次由你们决定何时开灯。","Jiedeng, Qilan: I once put my wish to return home before your safety. I will check the lighthouse's echo paths again. This time, you decide when to light it."],reply:[["岬灯：先把备用灯路接好吧。信任不能靠一盏灯恢复。","Jiedeng: Let's reconnect the spare light first. Trust isn't restored by a single lamp."],["栖蓝：新航线已经试过了。下次我带大家去花园。","Qilan: I've tested the new route. Next time I'll bring everyone to the garden."]]},
 forest:{point:[.89,.20],letter:["芽禾、榆川：我以为我能替大家承担后果。现在我愿意一起记录水量，让两边都能决定水往哪里流。","Yahe, Yuchuan: I thought I could carry the consequences for everyone. Now I'll help record the water flow, so both communities can decide where it goes."],reply:[["芽禾：下次来花园，我带些药草。别再一个人做决定。","Yahe: I'll bring herbs to the garden next time. No more deciding alone."],["榆川：水路已经恢复，我会带上每月的水量记录。","Yuchuan: The channel is working. I'll bring the monthly flow records."]]},
 forge:{point:[.88,.30],letter:["烬婆、小铆：我隐瞒了自己动过的机关。我愿意把每个改动写进维修记录，请你们亲自核对。","Jinpo, Xiaomao: I concealed the mechanisms I altered. I'll record every change and let you check the work yourselves."],reply:[["烬婆：先按新的安全流程验收。我们都得对自己的决定负责。","Jinpo: We'll inspect it under the new safety rules. We all answer for our decisions."],["小铆：我给花园做了一套新工具。等我测试完就带过去。","Xiaomao: I made new tools for the garden. I'll bring them when testing is done."]]},
 sky:{point:[.89,.24],letter:["翎羽、远帆：我曾擅自决定别人该走的路。这次我只修复航标，飞向哪里，由你们选择。","Lingyu, Yuanfan: I used to decide which paths others should take. This time I'll repair the markers; where you fly is your choice."],reply:[["翎羽：我会陪着他，但不会再替他选路线。","Lingyu: I'll fly beside him, but I won't choose his route."],["远帆：花园会是我下一次独立送信的目的地。","Yuanfan: The garden will be my next solo delivery."]]},
 library:{point:[.89,.29],letter:["墨页、白栞：请把我改变星铃路由的记录保存下来。我不会要求你们删掉它。","Moye, Baikan: Please preserve the record of how I altered the Star Bell's routes. I won't ask you to erase it."],reply:[["墨页：记录会保存。我们也会保护当事人的私人记忆。","Moye: The record stays. We'll also protect the private memories of those affected."],["白栞：我会把核对后的档案副本带到花园。","Baikan: I'll bring verified copies of the archive to the garden."]]},
 starfall:{point:[.92,.30],letter:["星芽、砾川：我曾只相信中央星铃。现在我愿意帮助校准六地的航路，让每个地方都能发出自己的回应。","Xingya, Lichuan: I once trusted only the Star Bell. Now I'll help align the six routes so every region can send its own reply."],reply:[["星芽：每一处的校准记录都要公开给邻地。","Xingya: Every calibration record must be shared with the neighboring regions."],["砾川：我会带商队经过花园。到时见。","Lichuan: I'll bring the caravan through the garden. See you there."]]}
};
const homeVisitKey=(region,id)=>"postgame:visit:"+region+":"+id;
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
 function enter(region){
  const story=view();
  if(!story.regions.includes(region))return fail("region-locked");
  const departure=region==="harbor"&&story.current?.id==="prologue:P-05"&&story.objective.includes("travel:harbor");
  if(!departure)return physical(w=>({...w,location:region}));
  if(story.cursor<story.current.lines.length)return fail("departure-dialogue-pending");
  const api=resolveNarrative();
  return api.evidence({sceneId:story.current.id,operation:"travel:harbor",region,verified:true,token:api.capture()},
   prior=>({resonanceExploration:{...prior.resonanceExploration,location:region}}));
 }
 function position(region,x,y){if(world().location!==region||!campaign.regions.includes(region)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return fail("invalid-position");return physical(w=>({...w,positions:{...w.positions,[region]:{x,y}}}));}
 function patch(change,reward){return prior=>{const w=prior.resonanceExploration||{};return {resonanceExploration:change(clone(w)),coins:(prior.coins||0)+(reward.coins||0),fish:(prior.fish||0)+(reward.fish||0)};};}
 function tideStep(){
  const v=view(),w=world();
  if(v.current?.id!=="harbor:H-03"||w.location!=="harbor"||!v.objective.includes("explore:tide-logbook"))return null;
  const index=tideTrail.findIndex((_,i)=>!w.interactions[tideKey(i)]);
  return index<0?null:{...clone(tideTrail[index]),index,total:tideTrail.length};
 }
 function traceTide(index,token){
  const step=tideStep(),api=resolveNarrative();
  if(!step||step.index!==index||!token||!api.isCurrentAction(token)||!tideNear(world(),step.point))return fail("walk-to-tide");
  return physical(w=>({...w,interactions:{...w.interactions,[tideKey(index)]:true}}));
 }
 function scentStep(){
  const v=view(),w=world();
  if(v.current?.id!=="forest:R-02"||w.location!=="forest"||!v.objective.includes("explore:scent-trail"))return null;
  const index=scentTrail.findIndex((_,i)=>!w.interactions[scentKey(i)]);
  return index<0?null:{...clone(scentTrail[index]),index,total:scentTrail.length};
 }
 function traceScent(index,token){
  const step=scentStep(),w=world(),api=resolveNarrative();
  if(!step||step.index!==index||!token||!api.isCurrentAction(token)||!scentAt(w,index))return fail("walk-to-scent");
  if(!view().choice)return fail("choice-pending");
  if(index===scentTrail.length-1)return recordWorld("forest:R-02","explore:scent-trail",{sceneId:"forest:R-02",operation:"explore:scent-trail",region:"forest",verified:true,token});
  const r=physical(x=>({...x,interactions:{...x.interactions,[scentKey(index)]:true}}));
  return r.ok?{...r,pending:true}:r;
 }
 function pairedGate(){
  const v=view(),w=world();
  if(w.location!=="forest"||v.current?.id!=="forest:R-03"||!v.objective.includes("puzzle:paired-water-gates"))return null;
  const pair=w.interactions[pairedKey],ready=validPair(State.S,pair);return {...clone(upperGate),ready,pair:ready?clone(pair):forestPair(State.S)};
 }
 function holdUpperGate(token){
  const gate=pairedGate(),api=resolveNarrative();
  if(!gate||gate.ready||!token||!api.isCurrentAction(token)||!atForest(world(),gate.point))return fail("walk-to-upper-gate");
  if(!gate.pair)return fail("two-cat-required");return physical(w=>({...w,interactions:{...w.interactions,[pairedKey]:gate.pair}}));
 }
 function homeQuest(region){
  const v=view(),w=world(),spec=homeLetters[region];
  if(!v.ending||w.location!==region||!spec)return null;
  const letter=campaign.side.find(q=>q.id==="postgame:letter-"+region),reunion=campaign.side.find(q=>q.id==="postgame:reunion-"+region);
  if(v.postgame.includes(reunion.id))return null;
  const actors=Object.values(campaign.cast).filter(n=>n.region===region).map((n,i)=>({id:n.id,reply:spec.reply[i],visited:!!w.interactions[homeVisitKey(region,n.id)]}));
  return {...clone(spec),letterText:clone(spec.letter),region,letter,reunion,actors,repaired:v.postgame.includes(letter.id)};
 }
 function finishHomeRepair(region,token){
  const q=homeQuest(region),w=world(),pos=w.positions[region],api=resolveNarrative();
  if(!q||q.repaired||!token||!api.isCurrentAction(token)||!pos||Math.hypot(pos.x-q.point[0],pos.y-q.point[1])>=.072)return fail("postgame-repair-unavailable");
  const reward={coins:25,fish:2},r=api.postgame({...q.letter,verified:true,token},patch(x=>x,reward));cachedRoot=null;
  return r.ok?{...r,reward}:r;
 }
 function meetHomeResident(region,id,point,token){
  const q=homeQuest(region),w=world(),pos=w.positions[region],api=resolveNarrative();
  if(!q?.repaired||!q.actors.some(a=>a.id===id&&!a.visited)||!token||!api.isCurrentAction(token)||!pos||Math.hypot(pos.x-point[0],pos.y-point[1])>=.072)return fail("postgame-visit-unavailable");
  const change=x=>({...x,interactions:{...x.interactions,[homeVisitKey(region,id)]:true}});
  if(q.actors.some(a=>a.id!==id&&!a.visited))return physical(change);
  const r=api.postgame({...q.reunion,verified:true,token},patch(change,{coins:0,fish:0}));cachedRoot=null;return r;
 }
 function recordWorld(sceneId,op,proof){
  const api=resolveNarrative(),v=view(),region=v.current?.chapter,w=world();
  if(v.current?.id!==sceneId||w.location!==region||!campaign.regions.includes(region)||!v.objective.includes(op)||proof?.sceneId!==sceneId||proof.operation!==op||proof.region!==region||proof.verified!==true)return fail("invalid-world-evidence");
  if(!/^(explore|puzzle|rescue|repair|melody):/.test(op))return fail("owned-by-other-module");
  if(w.interactions[sceneId+":"+op])return fail("already-completed");
  if(op==="explore:tide-logbook"&&(!tideTrail.every((_,i)=>w.interactions[tideKey(i)])||!tideNear(w,[.87,.748])))return fail("incomplete-tide-trail");
  if(op==="explore:scent-trail"&&(!scentTrail.slice(0,-1).every((_,i)=>w.interactions[scentKey(i)])||!scentAt(w,scentTrail.length-1)))return fail("incomplete-scent-trail");
  if(op==="puzzle:paired-water-gates"){
    const pair=w.interactions[pairedKey];
    if(!validPair(State.S,pair)||!atForest(w,[.69,.53]))return fail("upper-gate-required");
    if(proof.pair?.upper!==pair.upper||proof.pair?.lower!==pair.lower||proof.waterSequence?.join(",")!=="2,1,1")return fail("paired-flow-incomplete");
   }
  if(op==="melody:harbor"&&v.objective.includes("repair:harbor"))return fail("harbor-repair-first");
  if(op==="melody:harbor"&&!["qilan","jiedeng"].every(id=>w.interactions["harbor:H-05:invite:"+id]))return fail("local-response-required");
  if(op==="melody:forest"&&!["yahe","yuchuan"].every(id=>w.interactions["forest:R-04:invite:"+id]))return fail("local-response-required");
  if(op.startsWith("melody:")){const ids=Object.values(campaign.cast).filter(n=>n.region===region).map(n=>n.id);if(!ids.every(id=>proof.participants?.includes(id))||proof.responses?.length!==3||!ids.every(id=>proof.responses.some(r=>r.actor===id)))return fail("local-response-required");}
  const reward=op.startsWith("melody:")?{coins:35,fish:3}:op.startsWith("repair:")?{coins:25,fish:1}:op.startsWith("explore:")?{coins:8,fish:1}:{coins:12,fish:1};
  if(typeof api?.evidence!=="function"||!proof.token)return fail("canonical-host-unavailable");
  const r=api.evidence({sceneId,operation:op,region,verified:true,token:proof.token},patch(x=>({...x,interactions:{...x.interactions,[sceneId+":"+op]:true}}),reward));cachedRoot=null;return r.ok?{...r,reward}:r;
 }
 function harborInvited(){const v=view(),w=world();return v.current?.id==="harbor:H-05"?["qilan","jiedeng"].filter(id=>w.interactions["harbor:H-05:invite:"+id]):[];}
 function inviteHarbor(id,point,token){const api=resolveNarrative(),v=view(),w=world(),expected={qilan:[.16,.60],jiedeng:[.195,.50]}[id];if(!expected||point[0]!==expected[0]||point[1]!==expected[1]||w.location!=="harbor"||v.current?.id!=="harbor:H-05"||v.objective.includes("repair:harbor")||!v.objective.includes("melody:harbor")||!token||!api.isCurrentAction(token)||!tideNear(w,expected))return fail("npc-not-available");return physical(x=>({...x,interactions:{...x.interactions,["harbor:H-05:invite:"+id]:true}}));}
 function forestInvited(){const v=view(),w=world();return v.current?.id==="forest:R-04"||v.completed.includes("forest:R-04")?["yahe","yuchuan"].filter(id=>w.interactions["forest:R-04:invite:"+id]):[];}
 function inviteForest(id,point,token){const api=resolveNarrative(),v=view(),w=world(),expected={yahe:[.30,.43],yuchuan:[.64,.53]}[id];if(!expected||point[0]!==expected[0]||point[1]!==expected[1]||w.location!=="forest"||v.current?.id!=="forest:R-04"||v.objective.includes("repair:forest")||!v.objective.includes("melody:forest")||!token||!api.isCurrentAction(token)||!atForest(w,expected))return fail("npc-not-available");return physical(x=>({...x,interactions:{...x.interactions,["forest:R-04:invite:"+id]:true}}));}
 function cargoSpec(a,b){const l=campaign.links.find(([x,y])=>x===a&&y===b);if(!l)return null;const v=view(),i=(v.links[a+":"+b]||[]).length,actor=[a,b,b,a][i];if(i>=4||!v.regions.includes(a)||!v.regions.includes(b))return null;const end=a==="starfall"?"starfall:F-02":campaign.scenes.filter(s=>s.chapter===a).at(-1)?.id;if(!v.completed.includes(end))return null;return {a,b,stage:stages[i],actor,action:l[i<2?2:3],from:i%2===0?0:1,to:i%2===0?1:0};}
 function pickupCargo(option){const w=world(),s=option&&cargoSpec(option.a,option.b);if(w.cargo)return fail("cargo-busy");if(!s||w.location!==s.actor||!["a","b","stage","actor","action","from","to"].every(k=>option[k]===s[k]))return fail("invalid-cargo");return physical(x=>({...x,cargo:s}));}
 function exchange(a,b,proof){const api=resolveNarrative(),s=cargoSpec(a,b),w=world();if(!s||!w.cargo||w.location!==s.actor||proof?.region!==s.actor||proof.stage!==s.stage||proof.action!==s.action||proof.verified!==true||!["a","b","stage","actor","action","from","to"].every(k=>w.cargo[k]===s[k]))return fail("exchange-evidence-missing");
  if(typeof api?.exchange!=="function"||!proof.token)return fail("canonical-exchange-unavailable");
  const reward={coins:10,fish:1},r=api.exchange({a,b,stage:s.stage,actor:s.actor,action:s.action,verified:true,token:proof.token},patch(x=>({...x,cargo:null}),reward));cachedRoot=null;return r.ok?{...r,reward}:r;
 }
 function pickupReward(region,id){const w=world();if(w.location!==region||!/^cache-[12]$/.test(id)||w.pickups[region+":"+id])return fail("already-collected");return physical(x=>({...x,pickups:{...x.pickups,[region+":"+id]:true}}),id==="cache-1"?{coins:14,fish:1}:{coins:22,fish:2});}
 return Object.freeze({view,world,enter,position,recordWorld,exchange,pickupCargo,pickupReward,cargoSpec,harborInvited,inviteHarbor,forestInvited,inviteForest,tideStep,traceTide,scentStep,traceScent,pairedGate,holdUpperGate,homeQuest,finishHomeRepair,meetHomeResident,capture:()=>resolveNarrative().capture(),slotIdentity:()=>State.S,isSlot:owner=>State.S===owner});
}
