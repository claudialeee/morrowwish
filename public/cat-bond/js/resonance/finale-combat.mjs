// Real-time finale adapter for the existing CaptureBattle; narrative state remains in the active slot.
import {REGION_KITS} from "./regional-combat.mjs";
export const PHASES=Object.freeze({
 "finale:B-01":"battle:inward-gates",
 "finale:B-02":"battle:identify-echo",
 "finale:B-03":"battle:central-echo"
});
const REGIONS=Object.keys(REGION_KITS);
const ACTIONS=["lighthouse-signal","paired-root-channel","sound-gate-repair","aerial-melody","authentic-melody-order","star-map-alignment"];
const COLORS=["#7ccedc","#a8cc86","#ed9967","#c6e1f0","#cab1e3","#f1d39c"];
const clamp=(n,a,b)=>Math.min(Math.max(n,a),b);
export function nodePositions(W,H,top,bottom){
 const h=Math.max(1,H-top-bottom),r=Math.min(W*.30,h*.34);
 return REGIONS.map((region,i)=>({region,action:ACTIONS[i],x:W*.5+Math.cos(i*Math.PI/3-Math.PI/2)*r,y:top+h*.5+Math.sin(i*Math.PI/3-Math.PI/2)*r,color:COLORS[i],integrity:100,progress:0,done:false}));
}
export function rhythm(phase,impostor){
 // Both images use the same species and palette. The anomaly is the response timing.
 return impostor?[.24,.92]:[.24,1.52];
}
export function holdProgress(progress,dt,near,interrupted,required){
 return clamp(progress+(near&&!interrupted?dt:-dt*.5),0,required);
}
// Position the mechanic HUD below the actual battle topbar on every viewport.
function positionObjectiveHud(panel){
 if(!panel)return;const host=document.getElementById("battle-ui"),top=host?.querySelector(".battle-topbar");
 if(!host||!top)return;
 const hr=host.getBoundingClientRect(),tr=top.getBoundingClientRect();
 if(hr.height&&tr.height)panel.style.setProperty("--cb-rpg-hud-top",Math.round(tr.bottom-hr.top+7)+"px");
}

function install(){
 const GP=window.Game?.prototype,BP=window.Battle?.CaptureBattle?.prototype;
 if(!GP||!BP||window.CatBondFinaleCombat)return;
 const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
 const host=()=>window.CatBondResonance;
 const alive=b=>b.team.filter(f=>f.alive);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const notice=(b,zh,en)=>b.game.toast({zh,en});
 const sceneTitle={"finale:B-01":["逆响守铃者","The Reverse Bellkeeper"],"finale:B-02":["空白回响","The Hollow Echo"],"finale:B-03":["六音归环","Six Notes Return"]};
 function available(game,id){
  const h=host(),v=h?.view?.(),root=window.State.S;
  return typeof h?.captureAction==="function"&&typeof h?.isCurrentAction==="function"&&game?.scene==="map"&&!game.battle&&v?.current?.id===id&&v.ring===true&&v.objective.includes(PHASES[id])&&v.melodies?.length===6&&root.resonanceExploration?.location==="starfall";
 }
 function prep(game,id){
  if(!available(game,id))return false;
  const team=window.UI.getPreferredBattleTeam();if(!team.length)return false;
  const root=window.State.S,base=window.GameData.speciesById(team[0].species);
  if(!base)return false;
  host().close?.();
  window.UI.openBattleModePrompt(team,base,{origin:"map",storyTitle:sceneTitle[id],onStart:fighters=>{
   if(root!==window.State.S||!available(game,id))return;
   game._returnScene="map";game._battleTheme={region:"starfall",sky1:"#16273b",sky2:"#596985",ground:"#393f55",ground2:"#1d2436",accent:"#d8c397"};
   const catSp=fighters.map(c=>window.GameData.speciesById(c.species)).filter(Boolean);
   if(!catSp.length)return;
   // The lead species is a physics/stat template only. Finale enemies are not collectible cats.
   const pack=id==="finale:B-01"?[base,...Array(6).fill(base)]:id==="finale:B-02"?[catSp[0],catSp[0],catSp[1]||catSp[0],catSp[1]||catSp[0]]:[base];
   game.startBattle(fighters,base,{storyEncounter:"finale",pack});
   const b=game.battle;if(!b)return;
   const f={id,root,token:host().captureAction(),revision:host().snapshot().revision,nodes:nodePositions(b.W,b.H,b.topMargin,b.bottomMargin),elapsed:0,cast:null,cooldown:2.8,cycle:0,confirmed:new Set(),done:false};
   b.resonanceFinale=f;b.storyEncounter=true;b.captureReady=false;
   b.enemies.forEach((e,i)=>{
     e.isBoss=true;e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.reflectT=0;e.wardCd=99999;
     e.maxhp=Math.max(55,Math.round(alive(b).reduce((n,x)=>n+x.maxhp,0)*(id==="finale:B-01"?(i===0?1:.20):id==="finale:B-02"?.32:1.6)));e.hp=e.maxhp;
     e.poiseMax=e.maxhp;e.poise=e.poiseMax;
     if(id==="finale:B-01"){e.finaleActor=i===0?"muling":"gate";e.gateIndex=i-1;e.combatName=i===0?["暮铃","Muling"]:["逆响锁","Inward lock"];}
     else if(id==="finale:B-02"){e.finaleActor="echo";e.echoGroup=Math.floor(i/2);e.impostor=(i%2)===((f.revision+e.echoGroup)%2);e.echoObserved=0;}
     else{e.finaleActor="central";e.combatName=["空白回响","Hollow Echo"];}
   });
   if(id==="finale:B-03"){const done=host().snapshot().support||[];for(const n of f.nodes)n.done=done.includes(n.region);}
   mount(b);paint(b);
  }});return true;
 }
 function mount(b){
  document.getElementById("cb-finale-hud")?.remove();
  const el=document.createElement("section");el.id="cb-finale-hud";el.className="cb-finale-hud";
  el.innerHTML='<strong data-finale-title></strong><p data-finale-objective></p><div data-finale-count></div><button type="button" data-finale-clue></button>';
  el.querySelector("button").onclick=()=>{
   const f=b.resonanceFinale;if(!f||f.id!=="finale:B-02")return;
   const cats=alive(b).map(x=>x.cat);const recorded=cats.some(c=>(window.State.S.dex?.[c.species]||0)>0);
   if(recorded){f.clueRead=true;notice(b,"图鉴记录：真实回应有两次完整节拍，回响的第二次敲击过早。","Catdex observation: a true reply has two complete beats; an echo cuts the second one short.");}
   else notice(b,"观察两次回应的间隔。","Watch the spacing between the two replies.");
   paint(b);
  };
  document.getElementById("battle-ui")?.append(el);requestAnimationFrame(()=>positionObjectiveHud(el));
 }
 function paint(b){
  const f=b.resonanceFinale,el=document.getElementById("cb-finale-hud");if(!el||!f)return;
  const set=(sel,t)=>{const n=el.querySelector(sel);if(n&&n.textContent!==t)n.textContent=t;};
  set("[data-finale-title]",tr(...sceneTitle[f.id]));
  const first=f.id==="finale:B-01",second=f.id==="finale:B-02";
  set("[data-finale-objective]",first?tr("打断六个逆响锁。挡住袭向地区伙伴的铃声。","Break all six inward locks. Intercept bell pulses aimed at the regional allies."):second?tr("观察回应节拍；攻击第二次敲击过早的回响。","Observe the reply rhythm. Strike the echo whose second beat is too early."):tr("靠近六组地区伙伴，保护他们完成旋律。全部归位后攻击中央回响。","Stand near each allied group and defend its melody. Strike the central echo after all six return."));
  set("[data-finale-count]",first?f.nodes.filter(n=>n.done).length+"/6":second?f.confirmed.size+"/2":f.nodes.filter(n=>n.done).length+"/6");
  const clue=el.querySelector("button");clue.hidden=!second;clue.textContent=tr("查看 Catdex 记录","Check Catdex record");
 }
 function points(b){
  const f=b.resonanceFinale,old=f.nodes;
  f.nodes=nodePositions(b.W,b.H,b.topMargin,b.bottomMargin).map((n,i)=>({...n,integrity:old[i].integrity,progress:old[i].progress,done:old[i].done}));
 }
 const resize=BP.onResize;
 BP.onResize=function(...args){const r=resize.call(this,...args);if(this.resonanceFinale)points(this);return r;};
 const ai=BP.updateEnemyAI;
 BP.updateEnemyAI=function(dt,e,me){
  const f=this.resonanceFinale;if(!f)return ai.call(this,dt,e,me);
  if(e.finaleActor==="gate"){const n=f.nodes[e.gateIndex];e.x=n.x;e.y=n.y;e.vx=e.vy=0;e.pose="idle";return;}
  if(e.finaleActor==="echo"){
   const left=e.echoGroup===0?.29:.71,area=this.H-this.topMargin-this.bottomMargin;
   e.x=this.W*(left+(e.i%2===0?-.10:.10));e.y=this.topMargin+area*(.31+(e.echoGroup%2)*.34);e.vx=e.vy=0;e.pose="idle";
   return;
  }
  e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.wardCd=99999;
  ai.call(this,dt,e,me);
  e.fireCd=99999;
 };
 const hurt=BP.hurtEnemy;
 BP.hurtEnemy=function(e,dmg,...args){
  const f=this.resonanceFinale;if(!f)return hurt.call(this,e,dmg,...args);
  if(e.finaleActor==="muling"||(e.finaleActor==="central"&&!f.nodes.every(n=>n.done)))return 0;
  if(e.finaleActor==="echo"&&(!e.impostor||e.echoObserved<1)){
    // A premature or incorrect hit cannot remove a genuine reply.
    if(this.t-(e._wrongAt??-99)>1.8){e._wrongAt=this.t;this.vfx.ring(e.x,e.y,{r0:18,vr:130,life:.45,color:"#b9ced8",width:3});}
    return 0;
  }
  const r=hurt.call(this,e,dmg,...args);
  if(e.finaleActor==="gate"&&!e.alive){
    const n=f.nodes[e.gateIndex];n.done=true;n.integrity=Math.max(1,n.integrity);
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
 const nearest=BP.nearestEnemy;
 BP.nearestEnemy=function(x,y){
  const f=this.resonanceFinale;if(!f||!this.autoMode)return nearest.call(this,x,y);
  let list=this.liveEnemies();
  if(f.id==="finale:B-01")list=list.filter(e=>e.finaleActor==="gate");
  if(f.id==="finale:B-02")list=list.filter(e=>e.impostor&&e.echoObserved>=1);
  return list.sort((a,c)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-c.x,y-c.y))[0]||null;
 };
 function castPulse(b,f){
  const n=f.nodes.find((n,i)=>i>=f.cycle%6&&!n.done)||f.nodes.find(n=>!n.done);
  const actor=b.liveEnemies().find(e=>e.finaleActor==="muling"||e.finaleActor==="central");
  if(!actor)return;
  if(n){f.cast={node:f.nodes.indexOf(n),remaining:1.25,x:n.x,y:n.y};f.cycle++;}
  else{const me=b.me();if(me)f.cast={node:-1,remaining:1.05,x:me.x,y:me.y};}
 }
 function releasePulse(b,f,c){
  const n=f.nodes[c.node],r=56;
  const guards=alive(b).filter(x=>distance(x,c)<=r);
  if(n&&!n.done&&!guards.length){n.integrity=Math.max(0,n.integrity-32);n.progress=0;if(n.integrity===0){notice(b,"地区伙伴无法继续行动。","A regional ally group can no longer continue.");b.finish(false);}}
  for(const cat of guards)b.resolveHit(cat,"wild",{element:"dark",kind:"aoe",isBasic:false},Math.max(7,cat.maxhp*.12),cat.x,cat.y);
  b.vfx.ring(c.x,c.y,{r0:12,vr:220,life:.55,color:"#ddc095",width:6});
 }
 function tick(b,dt){
  const f=b.resonanceFinale;if(!f||b.done||b.captureSeq||b.duoCinematic||b.ultCinematic||b.game.battleHelpOpen||b.coachHoldsEnemies?.())return;
  if(f.root!==window.State.S||!host()?.isCurrentAction?.(f.token)||host()?.view()?.current?.id!==f.id){b.finish(false);return;}
  const d=clamp(dt*(b.tempoScale??.64),0,.06);f.elapsed+=d;
  if(f.id==="finale:B-02"){
   const beat=f.elapsed%2.8,prev=(f.elapsed-d)%2.8;
   for(const e of b.liveEnemies()){
    if(beat<prev)e.echoObserved++;
    const pulses=rhythm(f.id,e.impostor);
    for(const at of pulses)if(prev<at&&beat>=at){
     b.vfx.ring(e.x,e.y,{r0:10,vr:150,life:.50,color:"#d7c7a8",width:3});
     if(e.impostor&&at===pulses[1]){const me=b.me();if(me){const angle=Math.atan2(me.y-e.y,me.x-e.x);b.spawnProj(e.x,e.y,angle,185,e.dmg*.62,"wild","#ccbbeb",7,"ball",{element:e.element,isBasic:true});}}
    }
    if(b.duoUses>0&&e.impostor)e.echoObserved=Math.max(1,e.echoObserved);
   }
   return;
  }
  if(f.cast){f.cast.remaining-=d;if(f.cast.remaining<=0){const c=f.cast;f.cast=null;releasePulse(b,f,c);f.cooldown=3.1;}}
  else{f.cooldown-=d;if(f.cooldown<=0){castPulse(b,f);f.cooldown=3.1;}}
  if(f.id!=="finale:B-03"||b.done)return;
  const next=f.nodes.find(n=>!n.done);
  if(!next)return;
  const me=b.me();
  // Auto mode performs the same physical movement and protection requirement, not a free progress flag.
  if(b.autoMode&&me?.alive&&!b.duoRun&&!me.dashT&&!me.rootT){const dx=next.x-me.x,dy=next.y-me.y,l=Math.hypot(dx,dy);if(l>18){const step=Math.min(l,105*d);me.x+=dx/l*step;me.y+=dy/l*step;}}
  const support=host().supportProfile?.(next.region),trust=Object.values(support?.trust||{}).reduce((a,c)=>a+c,0),methods=support?.methods||[];
  const bonded=b.duo&&b.duoUses>0&&alive(b).filter(x=>[b.duo.a.uid,b.duo.b.uid].includes(x.cat.uid)).length===2;
  const memories=b.duo&&window.CatRelations?.memoryList?.(b.duo.a,b.duo.b)||[];const pledge=memories.length>0&&bonded;
  const need=Math.max(1.8,4.0-Math.min(1.0,Math.max(0,trust)*.12)-(methods.length?.4:0)-(bonded?.6:0)-(pledge?.35:0));
  const near=alive(b).some(x=>distance(x,next)<=56);
  next.progress=holdProgress(next.progress,d,near,false,need);next.required=need;
  if(next.progress>=need){
   // Stage the verified physical action in this fight; a retreat cannot grant narrative evidence.
   next.done=true;b.vfx.ring(next.x,next.y,{r0:15,vr:240,life:.8,color:next.color,width:5});notice(b,"地区旋律已归位。","A regional melody has returned.");paint(b);
  }
 }
 const update=BP.update;
 BP.update=function(dt){const r=update.call(this,dt);if(this.resonanceFinale)tick(this,dt);return r;};
 const capture=BP.startCaptureSeq;
 BP.startCaptureSeq=function(){
  const f=this.resonanceFinale;if(!f)return capture.call(this);
  const success=f.id==="finale:B-01"?f.nodes.every(n=>n.done&&n.integrity>0):f.id==="finale:B-02"?f.confirmed.size===2:f.nodes.every(n=>n.done&&n.integrity>0);
  if(!success){this.finish(false);return;}
  f.done=true;this.projectiles=[];this.captureSeq={t:.8,max:.8,x:this.W/2,y:this.H/2,sp:null,cat:null};
 };
 const captureTick=BP.tickCaptureSeq;
 BP.tickCaptureSeq=function(dt){if(!this.resonanceFinale)return captureTick.call(this,dt);if(this.captureSeq){this.captureSeq.t=Math.max(0,this.captureSeq.t-dt);if(this.captureSeq.t===0){this.captureSeq=null;this.finish(true);}}};
 const background=BP.drawArenaBackground;
 BP.drawArenaBackground=function(ctx,W,H){if(this.resonanceFinale&&window.CatBondRegionalArt?.drawScene(ctx,W,H,"starfall"))return;return background.call(this,ctx,W,H);};
 const draw=BP.draw;
 BP.draw=function(ctx){
  const f=this.resonanceFinale;if(!f)return draw.call(this,ctx);
  const seq=this.captureSeq;this.captureSeq=null;try{draw.call(this,ctx);}finally{this.captureSeq=seq;}
  if(this.duoCinematic||this.ultCinematic)return;
  ctx.save();ctx.lineWidth=2;
  if(f.id!=="finale:B-02")for(const [i,n] of f.nodes.entries()){
    ctx.strokeStyle=n.color;ctx.fillStyle="rgba(20,28,42,.82)";ctx.beginPath();ctx.arc(n.x,n.y,24,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.globalAlpha=n.done?.95:.58;ctx.strokeStyle=n.color;ctx.beginPath();ctx.arc(n.x,n.y,19,-Math.PI/2,-Math.PI/2+Math.PI*2*(n.done?1:f.id==="finale:B-03"?n.progress/(n.required||4):n.integrity/100));ctx.stroke();
    ctx.globalAlpha=1;ctx.textAlign="center";ctx.font="700 10px system-ui";ctx.fillStyle="#f4e5c7";ctx.fillText(tr(...REGION_KITS[n.region].name),n.x,n.y-31);
  }
  if(f.cast){ctx.strokeStyle="#eac19a";ctx.fillStyle="rgba(218,132,100,.17)";ctx.beginPath();ctx.arc(f.cast.x,f.cast.y,56,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();
 };
 const end=GP.endBattle;
 GP.endBattle=function(){
  const b=this.battle,f=b?.resonanceFinale;if(!f)return end.call(this);
  const win=b.result==="win"&&f.done,root=f.root,same=root===window.State.S,active=host(),valid=same&&active?.view()?.current?.id===f.id;
  let committed=false;
  if(win&&valid&&active.isCurrentAction(f.token)){
   let supportOK=true;
   if(f.id==="finale:B-03")for(const n of f.nodes){if(active.snapshot().support.includes(n.region))continue;const r=active.support({region:n.region,action:n.action,verified:true,token:f.token});if(!r?.ok){supportOK=false;break;}}
   if(supportOK){const r=active.recordEvidence({sceneId:f.id,operation:PHASES[f.id],region:"starfall",verified:true,outcome:"win",token:f.token});committed=!!r?.ok;}
  }
  if(same&&window.State.difficulty()==="casual")window.State.healAllCats?.();
  document.getElementById("cb-finale-hud")?.remove();document.getElementById("battle-ui")?.classList.remove("on");
  const duo=document.getElementById("duo-burst");if(duo)duo.hidden=true;
  this.battle=null;this._returnScene=null;this.scene="map";document.body.classList.add("cb-exploring");this.setBattleHelpVisible?.(false);this.refreshHUD?.();window.WorldMap?.resumeRegion?.(false);
  this.toast(committed?{zh:"本阶段目标已达成。",en:"The objective is complete."}:win?{zh:"剧情保存失败，请重新挑战。",en:"Story save failed. Retry the encounter."}:{zh:"队伍撤离，休整后再挑战。",en:"Withdrawn. Rest and retry the encounter."});
  if(committed)active.showCurrent?.();
 };
 window.addEventListener("cat-bond-resonance-battle-request",e=>{const d=e.detail;if(d?.region==="starfall"&&PHASES[d.sceneId]===d.operation)prep(window.__game,d.sceneId);});
 window.addEventListener("resize",()=>requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-finale-hud"))));
 window.addEventListener("morrowwish-language-change",()=>{const b=window.__game?.battle;if(b?.resonanceFinale){paint(b);requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-finale-hud")));}});
 window.CatBondFinaleCombat=Object.freeze({prepare:prep,available});
}
if(typeof window!=="undefined")install();
