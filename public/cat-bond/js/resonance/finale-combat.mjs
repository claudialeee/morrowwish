import {positionObjectiveHud,watchObjectiveHud,cinematicActive,syncCinematicHud} from "./battle-hud.mjs";
// Real-time finale adapter for the existing CaptureBattle; narrative state remains in the active slot.
import {campaign} from "./campaign.mjs";
import {REGION_KITS} from "./regional-combat.mjs";
export const PHASES=Object.freeze({
 "finale:B-01":"battle:inward-gates",
 "finale:B-02":"battle:identify-echo",
 "finale:B-03":"battle:central-echo"
});
const REGIONS=Object.keys(REGION_KITS);
const ALLIES=Object.fromEntries(REGIONS.map(region=>[
 region,Object.values(campaign.cast).filter(actor=>actor.region===region)
]));
const REPLY_OBJECTIVES={
 harbor:["守护岬灯与栖蓝，接通灯塔信号。","Guard Jiedeng and Qilan as they align the lighthouse signal."],
 forest:["守护芽禾与榆川，维持双向树根水道。","Guard Yahe and Yuchuan as they reopen the paired root channel."],
 forge:["守护烬婆与小铆，稳定声闸。","Guard Jinpo and Xiaomao as they stabilize the sound gate."],
 sky:["守护翎羽与远帆，将旋律送过空中航路。","Guard Lingyu and Yuanfan as they carry the melody across the air route."],
 library:["守护墨页与白栞，辨出正确的旋律次序。","Guard Moye and Baikan as they identify the authentic melody order."],
 starfall:["守护星芽与砾川，校准星图并接回港口。","Guard Xingya and Lichuan as they align the star map and close the route to Harbor."]
};
const ACTIONS=["lighthouse-signal","paired-root-channel","sound-gate-repair","aerial-melody","authentic-melody-order","star-map-alignment"];
const COLORS=["#7ccedc","#a8cc86","#ed9967","#c6e1f0","#cab1e3","#f1d39c"];
const clamp=(n,a,b)=>Math.min(Math.max(n,a),b);
export function nodePositions(W,H,top,bottom){
 const h=Math.max(1,H-top-bottom),ry=Math.min(h*.34,210),rx=Math.min(W*.30,Math.max(ry,Math.min(230,W*.28)));
 // Elliptical ring preserves the playable vertical band without collapsing six allies into one cluster on short screens.
 return REGIONS.map((region,i)=>({region,action:ACTIONS[i],x:W*.5+Math.cos(i*Math.PI/3-Math.PI/2)*rx,y:top+h*.5+Math.sin(i*Math.PI/3-Math.PI/2)*ry,color:COLORS[i],integrity:100,progress:0,done:false}));
}
// The existing individual cat personality supplies its characteristic bell response.
export function echoHabit(cat){
 return ({clever:1.08,mischievous:1.16,glutton:1.24,diligent:1.32,gentle:1.40,shy:1.48,lazy:1.56})[cat?.personality]??1.28;
}
export function rhythm(phase,impostor,habit=1.28){
 // Both copies resemble the same collected cat; their timing reveals the mismatch.
 return [.24,impostor?.24+habit-.60:.24+habit];
}
export function identifyEcho(expected,observed){
 return Number.isFinite(expected)&&Number.isFinite(observed)&&Math.abs(expected-observed)>.20;
}
export function supportEffects(profile,project,{bonded=false,pledge=false}={}){
 const methods=Array.isArray(profile?.methods)?profile.methods:[];
 // Canonical choices trade faster coordination for a sturdier local support action.
 const tactics={
  "navigator-trust":[.18,0],"keeper-trust":[0,3],
  "rapid-rescue":[.45,0],"precise-beacon":[0,8],
  "herbal-supplies":[0,8],"root-stability":[.45,0],
  "worker-transparency":[.45,0],"shared-repair":[0,8],
  "fast-courier":[.45,0],"escort-flight":[0,8],
  "full-records":[.45,0],"verified-records":[0,8],
  "coordinated-repair":[.45,0],"distributed-repair":[0,8]
 };
 let speed=0,shield=0;
 for(const method of new Set(methods)){const t=tactics[method];if(t){speed+=t[0];shield+=t[1];}}
 // Actual ordered cargo receipts supplied by the Starfall adapter.
 const cargoTactics={"beacon-supply-vessel":[.12,3],"herbs-waterway-map":[0,4],"cooling-plans-herbs":[0,5],"pumps-tools":[.24,0],"wind-vanes-flight-parts":[.24,0],"wind-data-airship-route":[.18,1],"courier-route":[.28,0],"archived-flight-maps":[.16,2],"star-chart-coordinates":[.26,0],"astronomical-observations":[.16,2],"navigation-bell-compass":[.24,1],"beacon-response":[0,4]};
 for(const id of new Set(Array.isArray(profile?.received)?profile.received:[])){const effect=cargoTactics[id];if(effect){speed+=effect[0];shield+=effect[1];}}

 const trust=Object.values(profile?.trust||{}).reduce((n,v)=>n+(Number.isFinite(v)?v:0),0);
 const level=Number.isInteger(project?.level)?Math.max(0,Math.min(3,project.level)):0;
 const visits=level&&Number.isInteger(project?.visits)?Math.max(0,Math.min(4,project.visits)):0;
 const gardenSpeed=level*.12+visits*.05,gardenShield=level*2;
 return {required:Math.max(1.8,4-Math.min(1,Math.max(0,trust)*.12)-speed-gardenSpeed-(bonded?.6:0)-(pledge?.35:0)),
  pulseDamage:Math.max(12,32-shield-gardenShield),speed,shield,gardenLevel:level};
}
export function holdProgress(progress,dt,near,interrupted,required){
 return clamp(progress+(near&&!interrupted?dt:-dt*.5),0,required);
}

function install(){
 const GP=window.Game?.prototype,BP=window.Battle?.CaptureBattle?.prototype;
 if(!GP||!BP||window.CatBondFinaleCombat)return;
 const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
 const arenaArt=new Map();
 function arenaPainting(W,H){
  const frame=H>W?"portrait":"wide";
  if(!arenaArt.has(frame)){
   const image=new Image();
   image.decoding="async";
   image.src=new URL("../../assets/combat/star-bell-arena-"+frame+".webp",import.meta.url).href;
   arenaArt.set(frame,image);
  }
  return arenaArt.get(frame);
 }
 const host=()=>window.CatBondResonance;
 const regionalEffects=(b,region)=>{
  const pair=b.duo,bonded=!!(pair&&b.duoUses>0&&b.team.filter(x=>x.alive&&[pair.a.uid,pair.b.uid].includes(x.cat.uid)).length===2);
  const pledge=!!(bonded&&window.CatRelations?.memoryList?.(pair.a,pair.b)?.includes("sakura"));
  return supportEffects(host()?.supportProfile?.(region),window.State.S.sunlitGarden?.projects?.[region],{bonded,pledge});
 };
 const alive=b=>b.team.filter(f=>f.alive);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const notice=(b,zh,en)=>b.game.toast({zh,en});
 const sceneTitle={"finale:B-01":["逆响守铃者","The Reverse Bellkeeper"],"finale:B-02":["空白回响","The Hollow Echo"],"finale:B-03":["六音归环","Six Notes Return"]};
 function available(game,id){
  const h=host(),v=h?.view?.(),root=window.State.S;
  return typeof h?.captureAction==="function"&&typeof h?.isCurrentAction==="function"&&game?.scene==="map"&&!game.battle&&v?.current?.id===id&&v.ring===true&&v.objective.includes(PHASES[id])&&v.melodies?.length===6&&v.support?.length===6&&v.support.every(profile=>profile.ready===true)&&root.resonanceExploration?.location==="starfall";
 }
 function prep(game,id){
  if(!available(game,id))return false;
  const team=window.UI.getPreferredBattleTeam();if(!team.length)return false;
  const root=window.State.S,base=window.GameData.speciesById(team[0].species);
  if(!base)return false;
  arenaPainting(game.W,game.H);
  host().close?.();
  window.UI.openBattleModePrompt(team,base,{origin:"map",storyTitle:sceneTitle[id],onStart:fighters=>{
   if(root!==window.State.S||!available(game,id))return;
   game._returnScene="map";game._battleTheme={region:"starfall",sky1:"#16273b",sky2:"#596985",ground:"#393f55",ground2:"#1d2436",accent:"#d8c397"};
   const catSp=fighters.map(c=>window.GameData.speciesById(c.species)).filter(Boolean);
   if(!catSp.length)return;
   // The lead species is a physics/stat template only. Finale enemies are not collectible cats.
   const pack=id==="finale:B-01"?[base,...Array(6).fill(base)]:id==="finale:B-02"?[catSp[0],catSp[0],catSp[1]||catSp[0],catSp[1]||catSp[0],base,base]:[base];
   game.startBattle(fighters,base,{storyEncounter:"finale",pack});
   const b=game.battle;if(!b)return;
   const f={id,root,token:host().captureAction(),revision:host().snapshot().revision,nodes:nodePositions(b.W,b.H,b.topMargin,b.bottomMargin),elapsed:0,cast:null,cooldown:2.8,cycle:0,confirmed:new Set(),verifiedGroups:new Set(),done:false,clueOpen:false,lastDuoUse:0,echoQuietUntil:0,wrongUntil:0,wrongCount:0,echoGroups:3};
   b.resonanceFinale=f;b.storyEncounter=true;b.captureReady=false;
   b.enemies.forEach((e,i)=>{
     e.isBoss=true;e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.reflectT=0;e.wardCd=99999;
     e.maxhp=Math.max(55,Math.round(alive(b).reduce((n,x)=>n+x.maxhp,0)*(id==="finale:B-01"?(i===0?1:.20):id==="finale:B-02"?.32:1.6)));e.hp=e.maxhp;
     e.poiseMax=e.maxhp;e.poise=e.poiseMax;
     if(id==="finale:B-01"){e.finaleActor=i===0?"muling":"gate";e.gateIndex=i-1;e.combatName=i===0?["暮铃","Muling"]:["逆响锁","Inward lock"];}
     else if(id==="finale:B-02"){e.finaleActor="echo";e.echoGroup=Math.floor(i/2);e.impostor=(i%2)===((f.revision+e.echoGroup)%2);e.echoObserved=0;e.echoFirstBeat=null;e.echoGap=null;
      e.echoCat=e.echoGroup===2?null:fighters[e.echoGroup]||fighters[0];e.echoHabit=e.echoGroup===2?1.40:echoHabit(e.echoCat);e.dexVerified=false;e.combatName=e.echoGroup===2?["暮铃的回应","Muling’s reply"]:[window.State.catName(e.echoCat),window.State.catName(e.echoCat)];}
     else{e.finaleActor="central";e.combatName=["空白回响","Hollow Echo"];}
   });
   if(id==="finale:B-03"){const done=host().snapshot().support||[];for(const n of f.nodes)n.done=done.includes(n.region);}
   mount(b);paint(b);
  }});return true;
 }
 function mount(b){
  document.getElementById("cb-finale-hud")?.remove();
  const el=document.createElement("section");el.id="cb-finale-hud";el.className="cb-finale-hud";
  el.innerHTML='<strong data-finale-title></strong><p data-finale-objective></p><div data-finale-count></div><div data-finale-regions hidden></div><p data-finale-warning hidden role="status"></p><button type="button" data-finale-clue aria-expanded="false"></button><p data-finale-record hidden></p><div data-finale-focus hidden></div>';
  el.querySelector("button").onclick=()=>{
   const f=b.resonanceFinale;if(!f||f.id!=="finale:B-02")return;
   f.clueOpen=!f.clueOpen;
   paint(b);
  };
  document.getElementById("battle-ui")?.append(el);watchObjectiveHud(el);
 }
 // A measured mismatch gives one resonance gain per distinct reply group.
 // Both manual and auto identification use this path. Repeated taps, opening
 // the record again and toggling battle mode cannot farm charge.
 function verifyEchoRecord(b,e){
  const f=b.resonanceFinale;
  if(f?.id!=="finale:B-02"||!f.clueOpen||!e.alive||e.finaleActor!=="echo"||e.echoObserved<1||!identifyEcho(e.echoHabit,e.echoGap))return false;
  const hasRecord=e.echoGroup===2||!!(e.echoCat&&window.State.S.dex?.[e.echoCat.species]>0);
  if(!hasRecord)return false;
  e.dexVerified=true;
  if(!f.verifiedGroups.has(e.echoGroup)){
   f.verifiedGroups.add(e.echoGroup);
   const pair=b.duo,partners=pair&&[pair.a.uid,pair.b.uid].every(uid=>b.team.some(x=>x.alive&&x.cat.uid===uid));
   if(partners){
    const pledge=window.CatRelations?.memoryList?.(pair.a,pair.b)?.includes("sakura");
    b.duoCharge=Math.min(100,b.duoCharge+(pledge?30:20));
   }
   b.vfx.ring(e.x,e.y,{r0:16,vr:150,life:.55,color:"#9edcd2",width:4});
  }
  return true;
 }
 function verifyCatdex(b){
  const f=b.resonanceFinale;if(!f?.clueOpen||f.id!=="finale:B-02"||!b.autoMode)return;
  for(const e of b.liveEnemies())if(!e.dexVerified)verifyEchoRecord(b,e);
 }
 function paint(b){
  const f=b.resonanceFinale,el=document.getElementById("cb-finale-hud");if(!el||!f)return;
  verifyCatdex(b);
  const set=(sel,t)=>{const n=el.querySelector(sel);if(n&&n.textContent!==t)n.textContent=t;};
  set("[data-finale-title]",tr(...sceneTitle[f.id]));
  const first=f.id==="finale:B-01",second=f.id==="finale:B-02";
  const enemyName=document.getElementById("wild-name");
  if(enemyName)enemyName.textContent=first?tr("暮铃","Muling"):tr("空白回响","Hollow Echo");
  const next=f.nodes.find(node=>!node.done);
  const effect=next&&f.id==="finale:B-03"?regionalEffects(b,next.region):null;
  const bonus=effect?" · "+tr("协作 "+effect.required.toFixed(1)+"秒 / 失守伤害 "+effect.pulseDamage,"Hold "+effect.required.toFixed(1)+"s / unguarded damage "+effect.pulseDamage)+(effect.gardenLevel?tr(" · 家园 Lv."," · Garden Lv.")+effect.gardenLevel:""):"";
  const reply=next?tr(...REPLY_OBJECTIVES[next.region])+bonus:tr("六段旋律已归位，攻击中央回响。","All six melodies have returned. Strike the central echo.");
  set("[data-finale-objective]",first?tr("打断六个逆响锁。挡住袭向地区伙伴的铃声。","Break all six inward locks. Intercept bell pulses aimed at the regional allies."):second?tr("观察回应节拍；攻击第二次敲击过早的回响。","Observe the reply rhythm. Strike the echo whose second beat is too early."):reply);
  set("[data-finale-count]",first?f.nodes.filter(n=>n.done).length+"/6":second?f.confirmed.size+"/"+f.echoGroups:f.nodes.filter(n=>n.done).length+"/6"+(next?" · "+Math.floor(100*next.progress/(next.required||4))+"%":""));
  const regionStatus=el.querySelector("[data-finale-regions]"),warning=el.querySelector("[data-finale-warning]");
  regionStatus.hidden=second;
  if(!second){
   if(!regionStatus.children.length)for(const n of f.nodes){const item=document.createElement("div"),label=document.createElement("span"),meter=document.createElement("meter");meter.min=0;meter.max=100;item.append(label,meter);regionStatus.append(item);}
   for(const [i,n] of f.nodes.entries()){const item=regionStatus.children[i],label=item.firstChild,meter=item.lastChild;const name=tr(...REGION_KITS[n.region].name);label.textContent=name+(n.done?" ✓":"");meter.value=n.done?100:n.integrity;meter.setAttribute("aria-label",name+" "+tr("伙伴状态","Ally integrity")+" "+n.integrity+"%");item.classList.toggle("is-threatened",f.cast?.node===i);item.classList.toggle("is-secured",n.done);}
  }
  warning.hidden=second||!f.cast;
  if(!warning.hidden){const n=f.nodes[f.cast.node];warning.textContent=n?tr("铃声来袭：守护 ","Incoming pulse: protect ")+tr(...REGION_KITS[n.region].name):tr("中央回响：离开预警范围","Central echo: leave the marked area");}
  const clue=el.querySelector("[data-finale-clue]");
  clue.hidden=!second;
  clue.textContent=f.clueOpen?tr("收起 Catdex","Close Catdex"):tr("查看 Catdex 记录","Check Catdex record");
  clue.setAttribute("aria-expanded",String(f.clueOpen));
  const focus=el.querySelector("[data-finale-focus]");
  focus.hidden=!second||!f.clueOpen||b.autoMode;
  if(!focus.hidden){const candidates=b.liveEnemies().filter(e=>e.echoObserved&&e.finaleActor==="echo");const signature=candidates.map(e=>e.i).join(",");if(focus.dataset.signature!==signature){focus.dataset.signature=signature;focus.replaceChildren();for(const e of candidates){const button=document.createElement("button");button.type="button";button.dataset.echo=String(e.i);button.onclick=()=>{if(b.done||!e.alive||e.echoGap===null)return;b._lockIdx=e.i;if(identifyEcho(e.echoHabit,e.echoGap)){const verified=verifyEchoRecord(b,e);notice(b,verified?"识别正确！共鸣蓄力增加。":"发现不一致的节拍，试着击破这道回响！",verified?"Correct identification! Resonance gained.":"A mismatched rhythm! Try breaking this echo.");b.vfx.ring(e.x,e.y,{r0:16,vr:150,life:.55,color:"#9edcd2",width:4});}else wrongReply(b,e);paint(b)};focus.append(button);}}for(const button of focus.children){const i=Number(button.dataset.echo),group=Math.floor(i/2);button.textContent=tr(["上","中","下"][group]+(i%2?"右":"左"),["Top","Mid","Bottom"][group]+(i%2?" R":" L"));button.setAttribute("aria-pressed",String(b._lockIdx===i));}}
  const record=el.querySelector("[data-finale-record]");
  record.hidden=!second||!f.clueOpen;
  if(!record.hidden){
   const groups=[0,1,2].filter(group=>!f.confirmed.has(group));
   const entries=groups.map(group=>{
    const echoes=b.enemies.filter(e=>e.echoGroup===group);
    const cat=echoes[0]?.echoCat;
    const area=group===0?tr("上方","Upper pair"):group===1?tr("中间","Middle pair"):tr("下方","Lower pair");
    if(group===2){const beats=echoes.map(e=>e.echoGap===null?"…":e.echoGap.toFixed(2)+(e.dexVerified?" ×":""));return area+" · "+tr("暮铃：第二次铃坠轻响应间隔 1.40 秒","Muling: the second pendant tap follows after 1.40s")+" · "+beats.join(" / ")+"s";}
    if(!cat||!(window.State.S.dex?.[cat.species]>0))return area+" · "+tr("Catdex 暂无记录","No Catdex record");
    const intervals=echoes.map(e=>e.echoGap===null?"…":e.echoGap.toFixed(2)+(e.dexVerified?" ×":""));
    return area+" · "+window.State.catName(cat)+" · "+tr("习惯 ","Habit ")+echoHabit(cat).toFixed(2)+"s · "+intervals.join(" / ")+"s";
   });
   record.textContent=[tr("按从左到右比较实测节拍；每组首次验证获得合击蓄力，对错误回响伤害 +25%。","Compare beats left to right. Each newly verified group charges the duo and adds 25% damage against its false reply."),...entries].join(" · ");
  }
 }
 function points(b){
  const f=b.resonanceFinale,old=f.nodes;
  f.nodes=nodePositions(b.W,b.H,b.topMargin,b.bottomMargin).map((n,i)=>({...n,integrity:old[i].integrity,progress:old[i].progress,required:old[i].required,done:old[i].done}));
  if(f.cast){const n=f.nodes[f.cast.node];if(n){f.cast.x=n.x;f.cast.y=n.y;}else{const me=b.me();if(me){f.cast.x=me.x;f.cast.y=me.y;}}const actor=b.liveEnemies().find(e=>e.finaleActor==="muling"||e.finaleActor==="central");if(actor){f.cast.fromX=actor.x;f.cast.fromY=actor.y;}}
 }
 const resize=BP.onResize;
 BP.onResize=function(...args){const r=resize.call(this,...args);if(this.resonanceFinale)points(this);return r;};
 const ai=BP.updateEnemyAI;
 BP.updateEnemyAI=function(dt,e,me){
  const f=this.resonanceFinale;if(!f)return ai.call(this,dt,e,me);
  if(e.finaleActor==="gate"){const n=f.nodes[e.gateIndex];e.x=n.x;e.y=n.y;e.vx=e.vy=0;e.pose="idle";return;}
  if(e.finaleActor==="echo"){
   const area=this.H-this.topMargin-this.bottomMargin;
   const offset=Math.max(.16,Math.min(.23,100/this.W));
   e.x=this.W*(.5+(e.i%2===0?-offset:offset));e.y=this.topMargin+area*(.19+e.echoGroup*.30);e.vx=e.vy=0;e.pose="idle";
   return;
  }
  e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.wardCd=99999;
  ai.call(this,dt,e,me);
  e.fireCd=99999;
 };
 function wrongReply(b,e){const f=b.resonanceFinale;if(!f||f.elapsed<f.wrongUntil)return;f.wrongUntil=f.elapsed+2.5;f.wrongCount++;const me=b.me();if(me?.alive){const angle=Math.atan2(me.y-e.y,me.x-e.x);b.spawnProj(e.x,e.y,angle,215,Math.max(8,me.maxhp*.15),"wild","#f2afbc",8,"ball",{element:"dark",isBasic:true});}notice(b,"这次节拍没对上！避开回响，再听一次。","Not quite! Dodge the echo and listen to its rhythm again.");b.vfx.ring(e.x,e.y,{r0:18,vr:160,life:.55,color:"#f2afbc",width:4});}
 const hurt=BP.hurtEnemy;
 BP.hurtEnemy=function(e,dmg,...args){
  const f=this.resonanceFinale;if(!f)return hurt.call(this,e,dmg,...args);
  if(e.finaleActor==="muling"||(e.finaleActor==="central"&&!f.nodes.every(n=>n.done)))return 0;
  if(e.finaleActor==="echo"&&(!e.impostor||e.echoObserved<1)){
    // A premature or incorrect hit cannot remove a genuine reply.
    if(!this.autoMode&&this._lockIdx===e.i&&!args[2]&&!args[3]&&f.elapsed>=f.wrongUntil){
      wrongReply(this,e);
    }
    return 0;
  }
  // An automatic strike can arrive on the same frame as a measured reply or
  // mode switch. Verify the observed record before damage can remove that
  // group; paint() alone is too late when a fast hit defeats the echo.
  if(e.finaleActor==="echo"&&this.autoMode&&f.clueOpen)verifyEchoRecord(this,e);
  const r=hurt.call(this,e,e.finaleActor==="echo"&&e.dexVerified?dmg*1.25:dmg,...args);
  if(e.finaleActor==="gate"&&!e.alive){
    const n=f.nodes[e.gateIndex];n.done=true;n.integrity=Math.max(1,n.integrity);
    const broken=f.nodes.filter(n=>n.done).length;
    if(broken===2)notice(this,"暮铃：共鸣锁正在松动，星铃还需要稳定！","Muling: The resonance locks are loosening. We still need to stabilize the bell!");
    if(broken===4)notice(this,"守铃者：最后一道锁打开了！让我们听听六地的回应！","Bellkeeper: The last lock is open! Let's listen to the six regions!");
    if(f.cast?.node===e.gateIndex)f.cast=null;
    this.vfx.ring(n.x,n.y,{r0:18,vr:200,life:.55,color:n.color,width:5});paint(this);
    if(f.nodes.every(n=>n.done)){const muling=this.enemies.find(x=>x.finaleActor==="muling");muling.alive=false;muling.hp=0;}
  }
  if(e.finaleActor==="echo"&&e.impostor&&!e.alive){
   f.confirmed.add(e.echoGroup);for(const other of this.enemies)if(other.echoGroup===e.echoGroup&&!other.impostor){other.alive=false;other.hp=0;}
   paint(this);
  }
  return r;
 };
 // All automatic targeting paths share the same phase-specific eligibility.
 function eligibleTarget(b,e){
  if(!e?.alive)return false;
  const f=b.resonanceFinale;if(!f)return true;
  if(f.id==="finale:B-01")return e.finaleActor==="gate";
  if(f.id==="finale:B-02")return e.finaleActor==="echo"&&e.echoObserved>=1&&identifyEcho(e.echoHabit,e.echoGap);
  return e.finaleActor==="central";
 }
 const command=BP.commandedTarget;
 BP.commandedTarget=function(x,y){
  if(!this.resonanceFinale||!this.autoMode)return command.call(this,x,y);
  const f=this.resonanceFinale;
  if(f.id==='finale:B-01'&&f.cast?.node>=0){const threatened=this.liveEnemies().find(e=>e.gateIndex===f.cast.node&&eligibleTarget(this,e));if(threatened)return threatened;}
  const current=command.call(this,x,y);
  if(eligibleTarget(this,current))return current;
  if(this.commandTarget)this.commandTarget=null;
  return this.nearestEnemy(x,y);
 };
 const exception=BP.focusException;
 BP.focusException=function(fighter,focus){
  const target=exception.call(this,fighter,focus);
  return this.resonanceFinale&&this.autoMode&&!eligibleTarget(this,target)?null:target;
 };
 const unwarded=BP.unwardedTarget;
 BP.unwardedTarget=function(fighter,target){
  const chosen=unwarded.call(this,fighter,target);
  return this.resonanceFinale&&this.autoMode&&!eligibleTarget(this,chosen)?target:chosen;
 };
 const locked=BP.lockedEnemy;
 BP.lockedEnemy=function(){const e=locked.call(this),f=this.resonanceFinale;if(!this.autoMode||!f||!e)return e;if(!eligibleTarget(this,e)){this._lockIdx=null;return null;}return e;};
 const nearest=BP.nearestEnemy;
 BP.nearestEnemy=function(x,y){
  const f=this.resonanceFinale;if(!f||!this.autoMode)return nearest.call(this,x,y);
  let list=this.liveEnemies().filter(e=>eligibleTarget(this,e));
  if(f.id==="finale:B-01"&&f.cast?.node>=0){const threatened=list.find(e=>e.gateIndex===f.cast.node);if(threatened)return threatened;}
  return list.sort((a,c)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-c.x,y-c.y))[0]||null;
 };
 function castPulse(b,f){
  const n=f.id==="finale:B-03"?f.nodes.find(n=>!n.done):f.nodes.find((n,i)=>i>=f.cycle%6&&!n.done)||f.nodes.find(n=>!n.done);
  const actor=b.liveEnemies().find(e=>e.finaleActor==="muling"||e.finaleActor==="central");
  if(!actor)return;
  if(n){const broken=f.nodes.filter(n=>n.done).length;f.cast={node:f.nodes.indexOf(n),remaining:Math.max(.85,1.4-broken*.06),x:n.x,y:n.y,fromX:actor.x,fromY:actor.y,style:f.id==="finale:B-01"&&f.cycle%2===1?"chain":"pulse"};f.cycle++;}
  else{const me=b.me();if(me)f.cast={node:-1,remaining:1.05,x:me.x,y:me.y};}
 }
 function releasePulse(b,f,c){
  const n=f.nodes[c.node],r=56;
  if(n?.done)return;
  const guards=alive(b).filter(x=>distance(x,c)<=r);
  if(n&&!n.done&&!guards.length){n.integrity=Math.max(0,n.integrity-(f.id==="finale:B-03"?regionalEffects(b,n.region).pulseDamage:32));n.progress=0;if(n.integrity===0){notice(b,"地区伙伴无法继续行动。","A regional ally group can no longer continue.");f.failedProtection=true;b.finish(false);}}
  for(const cat of guards)b.resolveHit(cat,"wild",{element:"dark",kind:"aoe",isBasic:false},Math.max(7,cat.maxhp*.12),cat.x,cat.y);
  if(c.style==="chain"){const dx=c.x-c.fromX,dy=c.y-c.fromY,len=Math.hypot(dx,dy)||1;for(const cat of alive(b)){if(guards.includes(cat))continue;const t=clamp(((cat.x-c.fromX)*dx+(cat.y-c.fromY)*dy)/(len*len),0,1);if(Math.hypot(cat.x-(c.fromX+dx*t),cat.y-(c.fromY+dy*t))<24)b.resolveHit(cat,"wild",{element:"dark",kind:"aoe",isBasic:false},Math.max(6,cat.maxhp*.09),cat.x,cat.y);}}
  paint(b);
  window.MorrowwishAudio?.effect?.("discover");
  b.vfx.ring(c.x,c.y,{r0:12,vr:220,life:.55,color:"#ddc095",width:6});
 }
 function tick(b,dt){
  const f=b.resonanceFinale;if(!f||b.done)return;
  if(f.root!==window.State.S||!host()?.isCurrentAction?.(f.token)||host()?.view()?.current?.id!==f.id){b.finish(false);return;}
  if(f.id==="finale:B-02"){
   const duoTriggered=b.duoUses>f.lastDuoUse;
   if(duoTriggered){
    f.lastDuoUse=b.duoUses;
    const pair=b.duo;
    if(pair&&alive(b).filter(x=>[pair.a.uid,pair.b.uid].includes(x.cat.uid)).length===2){
     for(const e of b.liveEnemies().filter(e=>e.impostor)){
      e.echoObserved=1;
      b.vfx.ring(e.x,e.y,{r0:16,vr:170,life:.65,color:"#f4db96",width:5});
     }
     if(window.CatRelations?.memoryList?.(pair.a,pair.b)?.includes("sakura")){
      f.echoQuietUntil=f.elapsed+2.8;
      notice(b,"双猫约定 · 打断下一次回声。","Duo Promise · The next copied reply is interrupted.");
     }
    }
   }
  }
  if(b.captureSeq||b.duoCinematic||b.ultCinematic||b.game.battleHelpOpen||b.coachHoldsEnemies?.())return;
  const d=clamp(dt*(b.tempoScale??.64),0,.06);f.elapsed+=d;
  // Count only active simulation time; do not trap a player in a stalled encounter.
  if(f.elapsed>145){b._timeCapLoss=true;f.timedOut=true;b.finish(false);return;}
  if(f.id==="finale:B-02"){
   if(f.lastAuto!==b.autoMode||f.lastLock!==b._lockIdx){f.lastAuto=b.autoMode;f.lastLock=b._lockIdx;paint(b);}
   const beat=f.elapsed%2.8,prev=(f.elapsed-d)%2.8;
   const learning=f.clueOpen;
   let newClue=false;
   for(const e of b.liveEnemies()){
    const [firstBeat,secondBeat]=rhythm(f.id,e.impostor,e.echoHabit);
    if(prev<firstBeat&&beat>=firstBeat){
     e.echoFirstBeat=firstBeat;
     b.vfx.ring(e.x,e.y,{r0:10,vr:150,life:.50,color:"#d7c7a8",width:3});
    }
    if(prev<secondBeat&&beat>=secondBeat){
     b.vfx.ring(e.x,e.y,{r0:10,vr:150,life:.50,color:"#d7c7a8",width:3});
     if(e.echoFirstBeat!==null){
      newClue||=e.echoGap===null;
      e.echoGap=secondBeat-e.echoFirstBeat;
      e.echoObserved=1;
     }
     if(e.impostor&&f.elapsed>=f.echoQuietUntil){
      const me=b.me();
      if(me){
       const angle=Math.atan2(me.y-e.y,me.x-e.x);
       b.spawnProj(e.x,e.y,angle,185,e.dmg*.62,"wild","#ccbbeb",7,"ball",{element:e.element,isBasic:true});
      }
     }
    }
   }
   if(learning&&newClue)paint(b);
   return;
  }
  if(f.cast){f.cast.remaining-=d;if(f.cast.remaining<=0){const c=f.cast;f.cast=null;releasePulse(b,f,c);f.cooldown=3.1;}}
  else{f.cooldown-=d;if(f.cooldown<=0){castPulse(b,f);f.cooldown=3.1;paint(b);}}
  if(f.id!=="finale:B-03"||b.done)return;
  const next=f.nodes.find(n=>!n.done);
  if(!next)return;
  // The existing AI movement loop owns steering to the active node; no second position writer.
  const need=regionalEffects(b,next.region).required;
  if(next.required!==need){next.required=need;paint(b);}
  const near=alive(b).some(x=>distance(x,next)<=56);
  next.progress=holdProgress(next.progress,d,near,false,need);next.required=need;
  const progressBucket=Math.floor(next.progress/need*20);if(f.progressBucket!==progressBucket){f.progressBucket=progressBucket;paint(b);}
  if(next.progress>=need){
   // Stage the verified physical action in this fight; a retreat cannot grant narrative evidence.
   next.done=true;if(f.cast?.node===f.nodes.indexOf(next)){f.cast=null;f.cooldown=Math.max(f.cooldown,2.0);}b.vfx.ring(next.x,next.y,{r0:15,vr:240,life:.8,color:next.color,width:5});
   for(const cat of alive(b))cat.hp=Math.min(cat.maxhp,cat.hp+Math.ceil(cat.maxhp*(next.region==="forest"?.09:.035)));
   const central=b.liveEnemies().find(e=>e.finaleActor==="central");if(central){central.dmg*=next.region==="forge"?.86:.94;if(next.region==="starfall")central.hp=Math.max(1,central.hp-central.maxhp*.08);}
   if(next.region==="harbor")for(const n of f.nodes)if(!n.done)n.integrity=Math.min(100,n.integrity+12);
   if(next.region==="sky")f.cooldown=Math.max(f.cooldown,4.6);
   if(next.region==="library")b.projectiles=b.projectiles.filter(p=>p.owner!=="wild");
   notice(b,REGION_KITS[next.region].name[0]+" · 旋律归位，队伍恢复。",REGION_KITS[next.region].name[1]+" · Melody restored; team steadied.");paint(b);
  }
 }
 const update=BP.update;
 BP.update=function(dt){const r=update.call(this,dt);if(this.resonanceFinale)tick(this,dt);return r;};
 const capture=BP.startCaptureSeq;
 BP.startCaptureSeq=function(){
  const f=this.resonanceFinale;if(!f)return capture.call(this);
  const success=f.id==="finale:B-01"?f.nodes.every(n=>n.done&&n.integrity>0):f.id==="finale:B-02"?f.confirmed.size===f.echoGroups:f.nodes.every(n=>n.done&&n.integrity>0);
  if(!success){this.finish(false);return;}
  f.done=true;this.projectiles=[];this.captureSeq={t:.8,max:.8,x:this.W/2,y:this.H/2,sp:null,cat:null};
 };
 const captureTick=BP.tickCaptureSeq;
 BP.tickCaptureSeq=function(dt){if(!this.resonanceFinale)return captureTick.call(this,dt);if(this.captureSeq){this.captureSeq.t=Math.max(0,this.captureSeq.t-dt);if(this.captureSeq.t===0){this.captureSeq=null;this.finish(true);}}};
 const background=BP.drawArenaBackground;
 BP.drawArenaBackground=function(ctx,W,H){
  if(this.resonanceFinale){
   const painting=arenaPainting(W,H);
   if(painting.complete&&painting.naturalWidth){
    window.CatBondSceneFit.draw(ctx,painting,W,H,{top:"#161d36",bottom:"#302943"});
    return;
   }
   if(window.CatBondRegionalArt?.drawScene(ctx,W,H,"starfall"))return;
  }
  return background.call(this,ctx,W,H);
 };
 const draw=BP.draw;
 BP.draw=function(ctx){
  const f=this.resonanceFinale;if(!f)return draw.call(this,ctx);
  const seq=this.captureSeq;this.captureSeq=null;try{draw.call(this,ctx);}finally{this.captureSeq=seq;}
  syncCinematicHud(document.getElementById("cb-finale-hud"),this);
  if(cinematicActive(this))return;
  ctx.save();ctx.lineWidth=2;
  if(f.id==="finale:B-03"){for(let i=0;i<f.nodes.length;i++){const n=f.nodes[i],next=f.nodes[(i+1)%f.nodes.length];if(!n.done)continue;ctx.save();ctx.strokeStyle=n.color;ctx.shadowColor=n.color;ctx.shadowBlur=10;ctx.globalAlpha=.7+.2*Math.sin(f.elapsed*3+i);ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(next.x,next.y);ctx.stroke();ctx.restore();}}
  if(f.id!=="finale:B-02")for(const n of f.nodes){
    ctx.strokeStyle=n.color;ctx.fillStyle="rgba(20,28,42,.82)";ctx.beginPath();ctx.arc(n.x,n.y,24,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.globalAlpha=n.done?.95:.58;ctx.strokeStyle=n.color;ctx.beginPath();ctx.arc(n.x,n.y,19,-Math.PI/2,-Math.PI/2+Math.PI*2*(n.done?1:f.id==="finale:B-03"?n.progress/(n.required||4):n.integrity/100));ctx.stroke();
    ctx.globalAlpha=1;
    if(f.id==="finale:B-03"||f.id==="finale:B-01"){
      const actors=ALLIES[n.region];
      for(const [j,actor] of actors.entries()){
        window.CatBondResonanceNPC?.drawResident?.(ctx,actor.id,{
          x:n.x+(j-.5)*26,y:n.y+15,scale:.43,time:f.elapsed
        });
      }
    }
    ctx.textAlign="center";ctx.font="700 10px system-ui";ctx.fillStyle="#f4e5c7";ctx.fillText(tr(...REGION_KITS[n.region].name),n.x,n.y-31);
  }
  if(f.cast){if(f.cast.style==="chain"){ctx.save();ctx.strokeStyle="#eac19a";ctx.lineWidth=8;ctx.globalAlpha=.35;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(f.cast.fromX,f.cast.fromY);ctx.lineTo(f.cast.x,f.cast.y);ctx.stroke();ctx.restore();}ctx.strokeStyle="#eac19a";ctx.fillStyle="rgba(218,132,100,.17)";ctx.beginPath();ctx.arc(f.cast.x,f.cast.y,56,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();
 };
 function resultPanel(game,b,f,committed,won){
  document.getElementById("cb-finale-result")?.remove();
  const owner=f.root,token=f.token;
  const box=document.createElement("section");box.id="cb-finale-result";box.className="cb-finale-result";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");
  const card=document.createElement("div"),title=document.createElement("h2"),detail=document.createElement("p"),reward=document.createElement("p"),actions=document.createElement("div"),back=document.createElement("button"),retry=document.createElement("button");
  back.type=retry.type="button";back.dataset.finaleReturn="";retry.dataset.finaleRetry="";actions.append(back,retry);card.append(title,detail,reward,actions);box.append(card);
  const retreat=!won&&b._voluntaryFlee&&!f.failedProtection&&!f.timedOut;
  function render(){title.textContent=committed?tr("回响已稳定","Resonance restored"):won?tr("未能保存","Save not completed"):retreat?tr("安全撤退","Safe withdrawal"):tr("再试一次吧","Let's try again");detail.textContent=committed?tr("本阶段已经保存，可以继续剧情。","This phase is saved. Continue the story."):won?tr("未保存剧情或奖励，可重新挑战。","Story and rewards were not saved. Retry the encounter."):f.timedOut?tr("战斗超过时限。调整队伍后重试。","The encounter timed out. Adjust your team and retry."):f.failedProtection?tr("地区伙伴未能坚持。优先守护受到攻击的共鸣节点。","Regional allies could not hold. Protect the threatened resonance nodes first."):tr("队伍已返回星坠原。可休整或再次挑战。","Your party has returned to Starfall. Recover or try again.");reward.hidden=!(committed&&f.id==="finale:B-03");reward.textContent=tr("+180 金币 · +8 小鱼干","+180 coins · +8 fish");back.textContent=committed?tr("继续故事","Continue story"):tr("返回星坠原","Return to Starfall");retry.textContent=tr("再次挑战","Retry encounter");retry.hidden=committed;box.setAttribute("aria-label",title.textContent);}
  function close(){box.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",close);}
  back.onclick=()=>{close();if(owner!==window.State.S)return;window.WorldMap?.resumeRegion?.(false);if(committed)host()?.showCurrent?.();};
  retry.onclick=()=>{close();if(owner!==window.State.S||!host()?.isCurrentAction(token))return;window.WorldMap?.resumeRegion?.(false);prep(game,f.id);};
  window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",close);document.getElementById("stage")?.append(box);render();back.focus();
 }
 const end=GP.endBattle;
 GP.endBattle=function(){
  const b=this.battle,f=b?.resonanceFinale;if(!f)return end.call(this);
  const win=b.result==="win"&&f.done,root=f.root,same=root===window.State.S,active=host(),valid=same&&active?.view()?.current?.id===f.id;
  let committed=false;const oldHealth=new Map();const restoreHealth=()=>{for(const [cat,old] of oldHealth){if(old.frac===undefined)delete cat._hpFrac;else cat._hpFrac=old.frac;if(old.at===undefined)delete cat._hpAt;else cat._hpAt=old.at;}};
  if(same&&valid){const State=window.State;for(const cat of root.cats||[])oldHealth.set(cat,{frac:cat._hpFrac,at:cat._hpAt});const seen=new Set();for(const fighter of [...b.team,...(b._benchFighters?.values?.()||[])]){const cat=fighter.cat;if(!cat||fighter._reinforcement||seen.has(cat.uid))continue;seen.add(cat.uid);if(State.difficulty()==="hardcore")State.setBattleHealth(cat,fighter.alive?clamp(fighter.hp/fighter.maxhp,.15,1):.15);else{delete cat._hpFrac;delete cat._hpAt;}}if(State.difficulty()==="casual")State.healAllCats?.();}
  if(win&&valid&&active.isCurrentAction(f.token)){
   const proof={sceneId:f.id,operation:PHASES[f.id],region:"starfall",verified:true,outcome:"win",token:f.token};
   const r=f.id==="finale:B-03"
    ?active.commitFinaleVictory({...proof,participants:f.nodes.map(({region,action})=>({region,action}))})
    :active.recordEvidence(proof);
   committed=!!r?.ok;
  }
  if(same&&valid&&(!win||!committed)){if(!win){const result=window.State.save();if(!result?.ok)restoreHealth();}else restoreHealth();}
  document.getElementById("cb-finale-hud")?.remove();document.getElementById("battle-ui")?.classList.remove("on");
  const duo=document.getElementById("duo-burst");if(duo)duo.hidden=true;
  this.battle=null;this._returnScene=null;this.scene="map";document.body.classList.add("cb-exploring");this.setBattleHelpVisible?.(false);this.refreshHUD?.();window.WorldMap?.resumeRegion?.(false);
  this.toast(committed?{zh:"本阶段目标已达成。",en:"The objective is complete."}:win?{zh:"剧情保存失败，请重新挑战。",en:"Story save failed. Retry the encounter."}:b._voluntaryFlee&&!f.failedProtection?{zh:"队伍撤离，休整后再挑战。",en:"Withdrawn. Rest and retry the encounter."}:{zh:"先休整一下，准备好再来挑战！",en:"Rest up, then give it another try!"});
  if(same&&valid)resultPanel(this,b,f,committed,win);
 };
 window.addEventListener("cat-bond-resonance-battle-request",e=>{const d=e.detail;if(d?.region==="starfall"&&PHASES[d.sceneId]===d.operation)prep(window.__game,d.sceneId);});
 window.addEventListener("resize",()=>requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-finale-hud"))));
 window.addEventListener("morrowwish-language-change",()=>{const b=window.__game?.battle;if(b?.resonanceFinale){paint(b);requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-finale-hud")));}});
 function drawEnemy(ctx,e,b){
  if(!b.resonanceFinale)return false;
  if(e.finaleActor==="muling"||(e.finaleActor==="echo"&&e.echoGroup===2)){
   ctx.save();if(e.finaleActor==="echo"){ctx.globalAlpha=.78;ctx.shadowColor="#c3b4f4";ctx.shadowBlur=14;}
   const drawn=window.CatBondResonanceNPC?.drawResident?.(ctx,"muling",{x:e.x,y:e.y+28,scale:e.finaleActor==="muling"?.78:.58,time:b.t});
   ctx.restore();return !!drawn;
  }
  if(e.finaleActor==="gate"){
   ctx.save();ctx.translate(e.x,e.y);ctx.rotate(b.t*.28);ctx.strokeStyle="#d7c49b";ctx.lineWidth=3;ctx.shadowColor="#e4b87b";ctx.shadowBlur=9;
   for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.ellipse(0,0,22,9,0,0,Math.PI*2);ctx.stroke();}
   ctx.restore();return true;
  }
  if(e.finaleActor==="central"){
   ctx.save();const radius=32+Math.sin(b.t*3)*4;const g=ctx.createRadialGradient(e.x,e.y,2,e.x,e.y,radius*1.7);
   g.addColorStop(0,"#f1eaff");g.addColorStop(.22,"#aca2d7");g.addColorStop(.62,"#524773");g.addColorStop(1,"rgba(71,61,109,0)");
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,radius*1.7,0,Math.PI*2);ctx.fill();ctx.translate(e.x,e.y);ctx.rotate(b.t*.5);ctx.strokeStyle="#bfb3e1";ctx.lineWidth=2;
   for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.ellipse(0,0,radius*1.2,radius*.62,0,0,Math.PI*2);ctx.stroke();}
   ctx.restore();return true;
  }
  return false;
 }
 function guardSteering(b,fighter){
  const f=b.resonanceFinale;if(!f||!b.autoMode||!fighter.alive)return null;
  const n=f.id==="finale:B-01"&&f.cast?.node>=0?f.nodes[f.cast.node]:f.id==="finale:B-03"?f.nodes.find(n=>!n.done):null;
  if(!n||n.done)return null;
  // Assign one actual living fighter to defend the node, leaving the others free to attack.
  // Keep that assignment stable while the node remains active, and reassign on knockout/root.
  const capable=alive(b).filter(cat=>!cat._reinforcement);
  const ready=capable.filter(cat=>!(cat.rootT>0)&&!(cat._beamRoot>0)&&!(cat._castRoot>0));
  const pool=ready.length?ready:capable;
  const key=f.id+":"+n.region+(f.id==="finale:B-01"?":"+f.cycle:"");
  if(f.guardKey!==key||!pool.some(cat=>cat.cat.uid===f.guardUid)){
   f.guardKey=key;f.guardUid=pool.slice().sort((a,c)=>distance(a,n)-distance(c,n))[0]?.cat.uid;
  }
  if(fighter.cat.uid!==f.guardUid)return null;
  const dx=n.x-fighter.x,dy=n.y-fighter.y,d=Math.hypot(dx,dy);
  if(d<=16){fighter._svx=0;fighter._svy=0;return {x:0,y:0};}
  return {x:dx/d,y:dy/d};
 }
 window.CatBondFinaleCombat=Object.freeze({prepare:prep,available,drawEnemy,guardSteering});
}
if(typeof window!=="undefined")install();
