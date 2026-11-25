import {createForgeState,tickForgeState,useForgeSupport,forgeDamageScale,FORGE_ENCOUNTER} from "./forge-combat-rules.mjs";
(() => {
"use strict";
if(!window.Battle?.CaptureBattle||!window.Game)return;
const BP=window.Battle.CaptureBattle.prototype,GP=window.Game.prototype;
const baseUrl=new URL("../../assets/combat/",import.meta.url);
const art={background:new Image(),guardian:new Image(),jinpo:new Image(),xiaomao:new Image()};
for(const [key,file] of Object.entries({background:"emberforge-arena.svg",guardian:"forge-guardian.svg",jinpo:"jinpo-portrait.svg",xiaomao:"xiaomao-portrait.svg"})){
  art[key].decoding="async";art[key].src=new URL(file,baseUrl).href;
}
const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
const toast=(game,zh,en)=>game?.toast?.({zh,en});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function bossSpecies(){
  const base=window.GameData?.speciesById?.("jinwu");
  if(!base)throw new Error("The canonical jinwu base species is missing");
  return {...base,name:"熔炉守卫",desc:"赤炉环城的古老机械守卫。",visualKind:"forge-guardian"};
}
function aliveTarget(b,e){
  return (b.team||[]).filter(f=>f.alive).sort((a,c)=>dist(a,e)-dist(c,e))[0]||null;
}
function addHazard(e,h){(e.forgeHazards||(e.forgeHazards=[])).push({...h,age:0,tick:h.delay??0,hitCounts:{}});}
function impact(b,e,x,y,r,damage,kind="impact",delay=.38,life=.62){
  addHazard(e,{x,y,r,damage,kind,delay,life,tick:delay});
}
function releaseAttack(b,e,cast){
  const target=cast.target||aliveTarget(b,e)||{x:e.x,y:e.y};
  if(cast.kind==="hammerfall"){
    impact(b,e,target.x,target.y,104,e.dmg*1.48,"hammer",.42,.58);
    window.MorrowwishAudio?.effect?.("combat_hurt");
    return;
  }
  if(cast.kind==="slag-fan"){
    const angle=Math.atan2(target.y-e.y,target.x-e.x),skill={element:"fire",isBasic:true,name:"熔渣扇击"};
    for(let i=-2;i<=2;i++)b.spawnProj(e.x+Math.cos(angle)*34,e.y+Math.sin(angle)*34,angle+i*.19,255,e.dmg*.64,"wild","#e28a50",9,"forge-slag",skill);
    return;
  }
  if(cast.kind==="steam-vents"){
    for(let i=-1;i<=1;i++){
      const x=Math.max(70,Math.min(b.W-70,target.x+i*128));
      const y=Math.max(b.topMargin+35,Math.min(b.H-b.bottomMargin-35,target.y+(i%2?62:-62)));
      impact(b,e,x,y,68,e.dmg*.72,"steam",.82,2.8);
    }
  }
}
function processEvents(b,e,events){
  for(const event of events){
    if(event.type==="phase"){
      e.phase=event.phase;
      b.vfx?.ring?.(e.x,e.y,{r0:44,vr:360,life:.85,color:"#e9a66a",width:7});
      b.vfx?.burst?.(e.x,e.y,{count:22,color:"#f4a05b",speed:180,life:.6,r:3});
      toast(b.game,
        event.phase===1?"守卫核心过热！它开始释放蒸汽陷阱。":"炉心进入临界状态！注意连续落点。",
        event.phase===1?"The core is overheating. Steam vents are active.":"Critical furnace state. Watch for chained impact zones.");
      window.MorrowwishAudio?.effect?.("discover");
    }else if(event.type==="windup"){
      e.forgeCast=event.cast;
      const labels={
        "hammerfall":["重锤锁定：离开地面红圈！","Hammerfall: leave the marked ground!"],
        "slag-fan":["熔渣扇击：横向移动躲避！","Slag fan: move sideways to evade!"],
        "steam-vents":["蒸汽喷口：注意三处地面标记！","Steam vents: watch the three marked zones!"]
      };
      const line=labels[event.cast.kind]||labels["hammerfall"];
      toast(b.game,line[0],line[1]);
      window.MorrowwishAudio?.effect?.("combat_hurt");
    }else if(event.type==="release"){
      e.forgeCast=null;releaseAttack(b,e,event.cast);
      b.vfx?.shockwave?.(e.x,e.y,"#e9a05d");
      b.shakeTrauma=Math.max(b.shakeTrauma||0,.22);
    }else if(event.type==="pressure-burst"){
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3;
        impact(b,e,e.x+Math.cos(a)*118,e.y+Math.sin(a)*76,94,e.dmg*.9,"pressure",.56,.88);
      }
      toast(b.game,"炉压爆发！远离守卫周围。","Pressure burst! Get away from the guardian.");
      window.MorrowwishAudio?.effect?.("combat_hurt");
    }
  }
}
function tickHazards(b,e,dt){
  const list=e.forgeHazards||[];
  for(const h of list){
    h.age+=dt;h.life-=dt;h.delay=Math.max(0,(h.delay||0)-dt);h.tick-=dt;
    if(h.delay<=0&&h.tick<=0){
      for(let i=0;i<b.team.length;i++){
        const f=b.team[i];if(!f.alive||dist(f,h)>h.r+(f.r||18))continue;
        const n=h.hitCounts[i]||0,max=h.kind==="steam"?2:1;if(n>=max)continue;
        h.hitCounts[i]=n+1;
        b.resolveHit(f,"wild",{element:"fire",isBasic:true,name:h.kind==="hammer"?"重锤冲击":"高温蒸汽"},h.damage,h.x,h.y);
        b.vfx?.impact?.(f.x,f.y,"#ef9b58");
      }
      h.tick=h.kind==="steam"?.72:99;
    }
  }
  e.forgeHazards=list.filter(h=>h.life>0);
}
const originalAI=BP.updateEnemyAI;
BP.updateEnemyAI=function(dt,e,me){
  if(!this.storyEncounter||e.visualKind!=="forge-guardian")return originalAI.call(this,dt,e,me);
  const b=this,state=this.forgeState,target=aliveTarget(this,e);
  if(!state||!target)return;
  // Reuse the mature arena movement, dodge and ward planner; disable its generic attacks.
  e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.rotReady=99999;
  originalAI.call(this,dt,e,me);
  e.fireCd=99999;e.specialMeter=-10000;
  const events=tickForgeState(state,dt,e.hp/e.maxhp,target);
  processEvents(b,e,events);
  if(state.cast&&e.forgeCast)e.forgeCast.remaining=state.cast.remaining;
  tickHazards(b,e,dt);
  e.forgeVentOpen=state.ventOpen>0;
  e.forgeHeat=state.heat;
  e.forgeShielded=state.heat>=65&&!e.forgeVentOpen;
};
const originalHurt=BP.hurtEnemy;
BP.hurtEnemy=function(e,dmg,...args){
  if(this.storyEncounter&&e?.visualKind==="forge-guardian")dmg*=forgeDamageScale(this.forgeState);
  return originalHurt.call(this,e,dmg,...args);
};
const originalStartCapture=BP.startCaptureSeq;
BP.startCaptureSeq=function(){
  if(!this.storyEncounter)return originalStartCapture.call(this);
  const e=this.enemies.find(x=>x.visualKind==="forge-guardian");
  this.captureSeq={t:1.35,max:1.35,x:e?.x||this.W/2,y:e?.y||this.H/2,sp:null,cat:e};
  this.forgeVictorySequence=true;
};
const originalTickCapture=BP.tickCaptureSeq;
BP.tickCaptureSeq=function(dt){
  if(!this.storyEncounter)return originalTickCapture.call(this,dt);
  if(!this.captureSeq)return;
  this.captureSeq.t=Math.max(0,this.captureSeq.t-dt);
  if(this.captureSeq.t===0){this.captureSeq=null;this.finish(true);}
};
const originalFinish=BP.finish;
BP.finish=function(win){
  if(this.storyEncounter)this.forgeOutcome=win?"win":(this.forgeRetreat?"retreat":"defeat");
  return originalFinish.call(this,win);
};
function drawBackground(ctx,W,H,b){
  const img=art.background;
  if(img.complete&&img.naturalWidth){
    const scale=Math.max(W/1920,H/1080),dw=1920*scale,dh=1080*scale;
    ctx.drawImage(img,(W-dw)/2,(H-dh)/2,dw,dh);
  }else{
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#172532");g.addColorStop(.65,"#574037");g.addColorStop(1,"#1a222a");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
  const heat=b.forgeState?.heat||20,pulse=.5+.5*Math.sin(b.t*1.3);
  const glow=ctx.createRadialGradient(W*.5,H*.37,4,W*.5,H*.37,Math.max(W,H)*.46);
  glow.addColorStop(0,"rgba(243,133,71,"+(.08+heat/1000+pulse*.025)+")");
  glow.addColorStop(1,"rgba(243,133,71,0)");
  ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  if(!b.forgeParticles)b.forgeParticles=Array.from({length:30},(_,i)=>({x:(i*137%997)/997,y:(i*83%991)/991,v:.2+(i%5)*.08,r:1+(i%3)}));
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const p of b.forgeParticles){
    p.y-=p.v*.0025;if(p.y<.12){p.y=.92;p.x=(p.x+.173)%1;}
    const x=p.x*W,y=p.y*H,alpha=.18+.34*Math.abs(Math.sin(b.t*1.8+p.x*12));
    ctx.globalAlpha=alpha;ctx.fillStyle="#ffb36c";ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function drawEnemy(ctx,e,b){
  const img=art.guardian,scale=(b.catScale?.("enemy")||.62)/.62,size=Math.max(118,Math.min(250,192*scale));
  ctx.save();
  ctx.fillStyle="rgba(5,10,14,.42)";ctx.beginPath();ctx.ellipse(e.x,e.y+5,size*.43,size*.105,0,0,Math.PI*2);ctx.fill();
  if(img.complete&&img.naturalWidth){
    const bob=Math.sin(b.t*4.2)*2.2,tilt=e.telegraph>0?-.025*Math.sin(b.t*30):.012*Math.sin(b.t*2.4);
    ctx.translate(e.x,e.y-size*.52+bob);ctx.rotate(tilt);
    ctx.drawImage(img,-size/2,-size/2,size,size);
  }else{
    const draw=window.CatMotion?.draw||window.CatArt?.drawCat;
    draw?.(ctx,e.x,e.y,{species:e.sp,scale:b.catScale("enemy"),face:e.face,t:e.t,pose:e.pose,mood:"alert"});
  }
  // The chest furnace follows heat and the exposed-core window.
  const exposed=(b.forgeState?.ventOpen||0)>0,rad=size*(exposed ? 0.24 : 0.18),cx=e.x,cy=e.y-size*.39;
  const pulse=.78+.22*Math.sin(b.t*8);
  const g=ctx.createRadialGradient(cx,cy,1,cx,cy,rad);
  g.addColorStop(0,exposed?"rgba(255,238,178,.9)":"rgba(255,163,83,.72)");
  g.addColorStop(.55,exposed?"rgba(255,166,91,.32)":"rgba(212,91,48,.24)");
  g.addColorStop(1,"rgba(212,91,48,0)");
  ctx.globalCompositeOperation="lighter";ctx.globalAlpha=pulse;ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawBossEffects(ctx,b){
  const e=b.enemies?.find(x=>x.visualKind==="forge-guardian");if(!e)return;
  ctx.save();
  for(const h of e.forgeHazards||[]){
    const ready=h.delay<=0,fade=Math.max(.08,Math.min(1,h.life/(h.kind==="steam"?2.8:.65)));
    ctx.globalAlpha=ready ? 0.48 : 0.25;
    ctx.fillStyle=ready?"#f06b3e":"#e6a05f";
    ctx.beginPath();ctx.ellipse(h.x,h.y,h.r,h.r*.42,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.8;ctx.strokeStyle=ready?"#ffb06b":"#f1d4a0";ctx.lineWidth=ready?3:2;
    ctx.setLineDash(ready?[]:[8,7]);ctx.beginPath();ctx.ellipse(h.x,h.y,h.r*(ready?1:.72),h.r*.42*(ready?1:.72),0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    if(!ready){ctx.globalAlpha=.85;ctx.strokeStyle="#fff0cf";ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,h.r*.72,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-h.delay/(h.kind==="steam" ? 0.82 : 0.56)));ctx.stroke();}
    ctx.globalAlpha=fade;
  }
  const state=b.forgeState;
  if(state&&state.heat>=65&&state.ventOpen<=0){ctx.globalAlpha=.38;ctx.strokeStyle="#e78c55";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(e.x,e.y,57,24,0,0,Math.PI*2);ctx.stroke();}
  const c=e.forgeCast;
  if(c){
    const k=Math.max(0,Math.min(1,1-c.remaining/(c.phase===2 ? 0.88 : c.phase===1 ? 1.02 : 1.18)));
    ctx.globalAlpha=.8;ctx.strokeStyle="#ffd29a";ctx.lineWidth=3;
    if(c.kind==="hammerfall"){
      const x=c.target?.x??e.x,y=c.target?.y??e.y;
      ctx.fillStyle="rgba(219,83,47,.22)";ctx.beginPath();ctx.ellipse(x,y,104,48,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x,y,104*(1-k*.7),48*(1-k*.7),0,0,Math.PI*2);ctx.stroke();
    }else if(c.kind==="slag-fan"){
      const x=c.target?.x??e.x,y=c.target?.y??e.y,a=Math.atan2(y-e.y,x-e.x),reach=390;
      ctx.fillStyle="rgba(227,123,67,.16)";ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,reach,a-.55,a+.55);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a-.55)*reach,e.y+Math.sin(a-.55)*reach);ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(a+.55)*reach,e.y+Math.sin(a+.55)*reach);ctx.stroke();
    }else{
      for(let i=-1;i<=1;i++){const x=(c.target?.x??e.x)+i*128,y=(c.target?.y??e.y)+(i%2?62:-62);ctx.beginPath();ctx.ellipse(x,y,68*(.65+.35*k),30*(.65+.35*k),0,0,Math.PI*2);ctx.stroke();}
    }
  }
  if(b.forgeVictorySequence){
    ctx.fillStyle="rgba(12,20,27,.46)";ctx.fillRect(0,0,b.W,b.H);
    ctx.textAlign="center";ctx.fillStyle="#f4d7a7";ctx.shadowColor="#e18b54";ctx.shadowBlur=18;
    ctx.font="900 "+Math.max(22,Math.min(42,b.W*.045))+"px Georgia,serif";
    ctx.fillText(tr("炉心归于平稳","THE FURNACE FALLS QUIET"),b.W/2,b.H*.28);
    ctx.shadowBlur=0;
  }
  ctx.restore();
}
function mountHud(game,b){
  document.getElementById("cb-forge-hud")?.remove();
  const host=document.getElementById("battle-ui");if(!host)return;
  const panel=document.createElement("section");panel.id="cb-forge-hud";panel.className="cb-forge-hud";
  panel.innerHTML='<div class="cb-forge-title"><span data-forge-title></span><span data-forge-phase></span></div>'+
    '<div class="cb-forge-objective" data-forge-objective></div>'+
    '<div class="cb-forge-heat"><span data-forge-heat-label></span><div><i data-forge-heat></i></div><b data-forge-heat-value></b></div>'+
    '<div class="cb-forge-support"><img alt="" data-forge-jinpo><img alt="" data-forge-xiaomao>'+
    '<div><strong data-forge-support-title></strong><small data-forge-support-note></small></div>'+
    '<button type="button" data-forge-support-button></button></div>';
  panel.querySelector("[data-forge-jinpo]").src=art.jinpo.src;
  panel.querySelector("[data-forge-xiaomao]").src=art.xiaomao.src;
  panel.querySelector("[data-forge-support-button]").addEventListener("click",()=>{
    if(game.battle?.storyEncounter)game.battle.forgeUseSupport?.();
  });
  host.append(panel);renderHud(game,b);
}
function renderHud(game,b){
  const p=document.getElementById("cb-forge-hud");if(!p||!b?.forgeState)return;
  const s=b.forgeState,en=window.MorrowwishI18n?.get?.()!=="zh",e=b.enemies?.find(x=>x.visualKind==="forge-guardian");
  const set=(sel,value)=>{const n=p.querySelector(sel);if(n&&n.textContent!==value)n.textContent=value;};
  set("[data-forge-title]",en?"EMBERFORGE · E-03":"赤炉环城 · E-03");
  set("[data-forge-phase]",en?["HEAT TEST","OVERDRIVE","CRITICAL"][s.phase]:"热压测试 · "+(s.phase+1)+"/3");
  set("[data-forge-objective]",en?"Vent the core, then strike while exposed.":"先泄压，再攻击暴露的炉心。");
  set("[data-forge-heat-label]",en?"FURNACE PRESSURE":"炉内压力");
  set("[data-forge-heat-value]",Math.round(s.heat)+"%");
  const bar=p.querySelector("[data-forge-heat]");if(bar)bar.style.width=s.heat+"%";
  const open=s.ventOpen>0,button=p.querySelector("[data-forge-support-button]");
  if(button){button.disabled=s.supportCharges<=0||open;button.textContent=open?(en?"CORE EXPOSED":"炉心暴露中"):en?("VENT · "+s.supportCharges):("协力泄压 · "+s.supportCharges);}
  set("[data-forge-support-title]",en?"Jinpo & Xiaomao":"烬婆与小铆");
  set("[data-forge-support-note]",en?"Safety bypass · 2 charges":"安全旁路 · 两次机会");
  const objective=p.querySelector("[data-forge-objective]");if(objective)objective.textContent=en?"Protect the test rig. Vent before striking the core.":"保护试验炉，先泄压再攻击炉心。";
}
function removeHud(){document.getElementById("cb-forge-hud")?.remove();}
function showResult(game,b,outcome,returnToMap){
  document.getElementById("cb-forge-result")?.remove();
  const win=outcome==="win",retreat=outcome==="retreat",en=window.MorrowwishI18n?.get?.()!=="zh";
  const overlay=document.createElement("section");overlay.id="cb-forge-result";overlay.className="cb-forge-result";
  const title=win?(en?"FURNACE STABILIZED":"熔炉试验完成"):retreat?(en?"WITHDRAWN":"已撤退"):(en?"THE SQUAD NEEDS REST":"队伍需要休整");
  const desc=win?(en?"The guardian is quiet. The forge can be examined safely.":"机械守卫停止运转，炉心已经稳定。"):
    retreat?(en?"The team withdrew safely. The encounter can be attempted again.":"队伍已安全撤离，可以重新挑战。"):
    (en?"Recover, adjust your lineup, and try again.":"先恢复状态、调整队伍，再尝试挑战。");
  overlay.innerHTML='<div class="cb-forge-result-card"><div class="cb-forge-result-kicker">EMBERFORGE · E-03</div><h2></h2><p></p><div class="cb-forge-rewards" hidden></div><div class="cb-forge-result-actions"><button type="button" data-forge-return></button><button type="button" data-forge-retry></button></div></div>';
  overlay.querySelector("h2").textContent=title;overlay.querySelector("p").textContent=desc;
  const rewards=overlay.querySelector(".cb-forge-rewards");
  if(win){rewards.hidden=false;rewards.textContent=en?"Rewards · 80 coins · 2 fish · battle XP":"奖励 · 80 金币 · 2 小鱼干 · 猫咪战斗经验";}
  const back=overlay.querySelector("[data-forge-return]"),retry=overlay.querySelector("[data-forge-retry]");
  back.textContent=en?"Return to the world":"返回世界";
  retry.textContent=en?"Retry encounter":"再次挑战";retry.hidden=win;
  back.addEventListener("click",()=>{game._forgeResultOpen=false;overlay.remove();if(returnToMap){game.scene="map";window.WorldMap?.resumeRegion?.(false);}else{game.scene="yard";game.showYardChrome?.();}});
  retry.addEventListener("click",()=>{game._forgeResultOpen=false;overlay.remove();launch(game,{retry:true});});
  document.getElementById("stage")?.append(overlay);game._forgeResultOpen=true;
}
function finishEncounter(game,b){
  const outcome=b.forgeOutcome||"defeat",win=outcome==="win",returnToMap=game._returnScene==="map";
  try{b.commitAiProfile?.(win);}catch(_){}
  const recovery={mode:window.State?.difficulty?.()||"casual",fromMap:returnToMap,team:[]};
  const seen=new Set();
  try{
    for(const f of [...(b.team||[]),...(b._benchFighters?.values?.()||[])]){
      if(!f?.cat||f._reinforcement||seen.has(f.cat.uid))continue;seen.add(f.cat.uid);
      const before=f.alive?Math.max(.15,Math.min(1,f.hp/f.maxhp)):.15;
      const after=returnToMap&&recovery.mode==="hardcore"?window.State.setBattleHealth(f.cat,before):1;
      if(after===1){delete f.cat._hpFrac;delete f.cat._hpAt;}
      recovery.team.push({name:window.State.catName(f.cat),before:Math.round(before*100),after:Math.round(after*100)});
    }
    if(recovery.mode==="casual")window.State.healAllCats?.();
  }catch(error){console.error("[Forge] battle recovery failed",error);}
  game._battleRecovery=recovery;
  document.getElementById("battle-ui")?.classList.remove("on");
  const duo=document.getElementById("duo-burst");if(duo)duo.hidden=true;
  game.setBattleHelpVisible?.(false);
  game._returnScene=null;
  if(returnToMap){game.scene="map";document.body.classList.add("cb-exploring");window.WorldMap?.resumeRegion?.(false);}
  else{game.scene="yard";game.showYardChrome?.();}
  game.yard?.refreshYardSwitch?.();game.refreshCollectionGoal?.();
  if(win){
    window.State.S.coins=(window.State.S.coins||0)+80;
    window.State.S.fish=(window.State.S.fish||0)+2;
    const cats=[...(b.team||[]),...(b._benchFighters?.values?.()||[])].map(f=>f?.cat).filter(Boolean);
    for(const cat of new Map(cats.map(c=>[c.uid,c])).values())window.State.addXp?.(cat,42);
    const engine=game._forgeNarrativeEngine;
    if(engine?.record){
      const result=engine.record(FORGE_ENCOUNTER.id,FORGE_ENCOUNTER.operation);
      if(result.ok){window.State.S.resonance=result.state;game._forgeNarrativeRecord="PASS";}
      else{game._forgeNarrativeRecord="REJECTED: "+result.reason;console.warn("[Forge] narrative adapter rejected victory",result.reason);}
    }else game._forgeNarrativeRecord="NOT CONNECTED";
    window.arcadeMetric?.("game_complete",{region:"forge",storyEncounter:FORGE_ENCOUNTER.operation});
  }else if(!retreat){window.arcadeMetric?.("game_over",{region:"forge",storyEncounter:FORGE_ENCOUNTER.operation});}
  window.State.save();game.refreshHUD?.();game.battle=null;removeHud();
  showResult(game,b,outcome,returnToMap);
}
const originalEnd=GP.endBattle;
GP.endBattle=function(){
  const b=this.battle;if(!b?.storyEncounter)return originalEnd.call(this);
  return finishEncounter(this,b);
};
const originalStart=GP.startBattle;
GP.startBattle=function(team,wildSpecies,opts={}){
  const result=originalStart.call(this,team,wildSpecies,opts);
  if(opts.storyEncounter!=="forge-guardian"||!this.battle)return result;
  const b=this.battle,enemy=b.enemies?.[0];if(!enemy)throw new Error("Forge guardian failed to spawn");
  b.storyEncounter=true;b.storyEncounterId=FORGE_ENCOUNTER.id;b.forgeState=createForgeState();
  b._forgeReturnScene=this._returnScene||"yard";b._forgeTeam=(team||[]).slice();
  b._analyticsRegion="forge";b.captureReady=false;
  const teamHp=(b.team||[]).reduce((n,f)=>n+(f.maxhp||0),0);
  enemy.sp=wildSpecies;enemy.visualKind="forge-guardian";enemy.isBoss=true;enemy.element="fire";
  enemy.role="elite";enemy.r=39;enemy.speed=65;enemy.dmg=Math.max(17,enemy.dmg*1.38);
  enemy.maxhp=Math.max(1080,Math.round(teamHp*2.65));enemy.hp=enemy.maxhp;
  enemy.poiseMax=Math.round(enemy.maxhp*.72);enemy.poise=enemy.poiseMax;
  enemy.forgeState=b.forgeState;enemy.forgeHazards=[];enemy.forgeCast=null;
  enemy.rotation=[];enemy.ultSkill=null;enemy.specialMeter=-10000;enemy.fireCd=99999;
  b.wild=wildSpecies;b.forgeUseSupport=()=>{
    const result=useForgeSupport(b.forgeState);if(!result.ok){toast(this,"支援尚不可用。","Support is not ready.");return false;}
    enemy.forgeCast=null;enemy.telegraph=0;enemy.staggerT=Math.max(enemy.staggerT||0,1.15);
    b.vfx?.ring?.(enemy.x,enemy.y,{r0:35,vr:480,life:.72,color:"#ffe0a3",width:8});
    b.vfx?.burst?.(enemy.x,enemy.y,{count:18,color:"#ffc17b",speed:190,life:.48,r:3});
    toast(this,"烬婆与小铆打开冷却旁路！炉心暴露六秒。","Jinpo and Xiaomao open the coolant bypass! Core exposed for six seconds.");
    window.MorrowwishAudio?.effect?.("discover");renderHud(this,b);return true;
  };
  const label=document.getElementById("wild-name");
  if(label)label.textContent=tr("赤炉环城 · 熔炉机械守卫","EMBERFORGE · FURNACE GUARDIAN");
  mountHud(this,b);this.updateBattleUI?.();return result;
};
const originalBattleUI=GP.updateBattleUI;
GP.updateBattleUI=function(){const result=originalBattleUI.call(this);if(this.battle?.storyEncounter)renderHud(this,this.battle);return result;};
const originalGameUpdate=GP.update;
GP.update=function(dt){if(this._forgeResultOpen){return;}return originalGameUpdate.call(this,dt);};
const originalArena=BP.drawArenaBackground;
BP.drawArenaBackground=function(ctx,W,H){if(this.storyEncounter)return drawBackground(ctx,W,H,this);return originalArena.call(this,ctx,W,H);};
const originalDraw=BP.draw;
BP.draw=function(ctx){
  if(!this.storyEncounter)return originalDraw.call(this,ctx);
  const seq=this.captureSeq;this.captureSeq=null;
  try{originalDraw.call(this,ctx);}finally{this.captureSeq=seq;}
  drawBossEffects(ctx,this);
};
window.CatBondForgeCombat={
  rules:{createForgeState,tickForgeState,useForgeSupport,forgeDamageScale},
  launch(game=window.__game,options={}){
    if(!game||!window.State?.S)throw new Error("Start or load a save slot before launching the Forge encounter.");
    if(game.battle)throw new Error("A battle is already active.");
    const preferred=window.UI?.getPreferredBattleTeam?.()||[];
    const team=preferred.length?preferred:(window.State.S.cats||[]).slice(0,5);
    if(!team.length)throw new Error("Choose at least one cat before launching the encounter.");
    if(game.scene!=="map")game.openWorldMap?.();
    game._returnScene="map";
    game._battleTheme={region:"forge",sky1:"#172532",sky2:"#405967",ground:"#4b4138",ground2:"#222b32",accent:"#b96e49"};
    const boss=bossSpecies();
    game.startBattle(team,boss,{storyEncounter:"forge-guardian",pack:[boss]});
    return game.battle;
  },
  bindNarrative(engine){
    if(!engine||typeof engine.record!=="function")throw new Error("A Chat 4 narrative engine instance is required.");
    if(!window.State?.S)throw new Error("No active save slot.");
    window.__game._forgeNarrativeEngine=engine;
    return true;
  },
  drawBackground,drawEnemy,drawBossEffects
};
const flee=document.getElementById("btn-flee");
flee?.addEventListener("click",()=>{if(window.__game?.battle?.storyEncounter)window.__game.battle.forgeRetreat=true;},true);
window.addEventListener("morrowwish-language-change",()=>{if(window.__game?.battle?.storyEncounter)renderHud(window.__game,window.__game.battle);});
})();