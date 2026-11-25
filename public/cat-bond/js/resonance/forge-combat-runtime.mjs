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
        const f=b.team[i];if(!f.alive||Math.hypot((f.x-h.x)/(h.r+(f.r||18)),(f.y-h.y)/(h.r*.42+(f.r||18)))>1)continue;
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
  if(this.captureSeq.t===0){this.captureSeq=null;window.MorrowwishAudio?.effect?.("combat_win");this.finish(true);}
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
  const img=art.guardian,scale=(b.catScale?.("enemy")||.62)/.62,size=Math.max(84,Math.min(152,Math.max(96,b.W*.23),b.H*.36,140*scale));
  ctx.save();
  ctx.fillStyle="rgba(5,10,14,.42)";ctx.beginPath();ctx.ellipse(e.x,e.y+5,size*.43,size*.105,0,0,Math.PI*2);ctx.fill();
  if(img.complete&&img.naturalWidth){
    const bob=Math.sin(b.t*4.2)*2.2,tilt=e.telegraph>0?-.025*Math.sin(b.t*30):.012*Math.sin(b.t*2.4);
    ctx.save();ctx.translate(e.x,e.y-size*.43+bob);ctx.rotate(tilt);
    ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
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
// Position the mechanic HUD below the actual battle topbar on every viewport.
function positionObjectiveHud(panel){
 if(!panel)return;const host=document.getElementById("battle-ui"),top=host?.querySelector(".battle-topbar");
 if(!host||!top)return;
 const hr=host.getBoundingClientRect(),tr=top.getBoundingClientRect();
 if(hr.height&&tr.height)panel.style.setProperty("--cb-rpg-hud-top",Math.round(tr.bottom-hr.top+7)+"px");
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
  host.append(panel);renderHud(game,b);requestAnimationFrame(()=>positionObjectiveHud(panel));
}
function renderHud(game,b){
  const p=document.getElementById("cb-forge-hud");if(!p||!b?.forgeState)return;
  const s=b.forgeState,en=window.MorrowwishI18n?.get?.()!=="zh",e=b.enemies?.find(x=>x.visualKind==="forge-guardian");
  const set=(sel,value)=>{const n=p.querySelector(sel);if(n&&n.textContent!==value)n.textContent=value;};
  set("[data-forge-title]",en?"EMBERFORGE · E-03":"赤炉环城 · E-03");
  const enemyLabel=document.getElementById("wild-name");if(enemyLabel)enemyLabel.textContent=en?"EMBERFORGE · FURNACE GUARDIAN":"赤炉环城 · 熔炉机械守卫";
  set("[data-forge-phase]",en?["HEAT TEST","OVERDRIVE","CRITICAL"][s.phase]:"热压测试 · "+(s.phase+1)+"/3");
  set("[data-forge-objective]",en?"Vent the core, then strike while exposed.":"先泄压，再攻击暴露的炉心。");
  set("[data-forge-heat-label]",en?"FURNACE PRESSURE":"炉内压力");
  set("[data-forge-heat-value]",Math.round(s.heat)+"%");
  const bar=p.querySelector("[data-forge-heat]");if(bar)bar.style.width=s.heat+"%";
  const open=s.ventOpen>0,button=p.querySelector("[data-forge-support-button]");
  if(button){button.disabled=s.supportCharges<=0||open;button.textContent=open?(en?"CORE EXPOSED":"炉心暴露中"):en?("VENT · "+s.supportCharges):("协力泄压 · "+s.supportCharges);}
  set("[data-forge-support-title]",en?"Jinpo & Xiaomao":"烬婆与小铆");
  set("[data-forge-support-note]",en?("Safety bypass · "+s.supportCharges):("安全旁路 · "+s.supportCharges));
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
  const titleNode=overlay.querySelector("h2"),descNode=overlay.querySelector("p");
  titleNode.textContent=title;descNode.textContent=desc;
  titleNode.dataset.forgeZh=win?"熔炉试验完成":retreat?"已撤退":"队伍需要休整";
  titleNode.dataset.forgeEn=win?"FURNACE STABILIZED":retreat?"WITHDRAWN":"THE SQUAD NEEDS REST";
  descNode.dataset.forgeZh=win?"机械守卫停止运转，炉心已经稳定。":retreat?"队伍已安全撤离，可以重新挑战。":"先恢复状态、调整队伍，再尝试挑战。";
  descNode.dataset.forgeEn=win?"The guardian is quiet. The forge can be examined safely.":retreat?"The team withdrew safely. The encounter can be attempted again.":"Recover, adjust your lineup, and try again.";
  const rewards=overlay.querySelector(".cb-forge-rewards");
  if(win&&b.forgeRewardGranted){rewards.hidden=false;rewards.textContent=en?"Rewards · 80 coins · 2 fish · battle XP":"奖励 · 80 金币 · 2 小鱼干 · 猫咪战斗经验";rewards.dataset.forgeZh="奖励 · 80 金币 · 2 小鱼干 · 猫咪战斗经验";rewards.dataset.forgeEn="Rewards · 80 coins · 2 fish · battle XP";}
  if(win&&!b.forgeRewardGranted){rewards.hidden=false;rewards.dataset.forgeZh=b.forgeContext?.preview?"调试胜利，不写入存档。":"剧情进度未提交，请返回后重试。";rewards.dataset.forgeEn=b.forgeContext?.preview?"Preview win: no save changes.":"Story progress not committed. Return and retry.";rewards.textContent=en?rewards.dataset.forgeEn:rewards.dataset.forgeZh;}
  const back=overlay.querySelector("[data-forge-return]"),retry=overlay.querySelector("[data-forge-retry]");
  back.textContent=en?"Return to the world":"返回世界";back.dataset.forgeZh="返回世界";back.dataset.forgeEn="Return to the world";
  retry.textContent=en?"Retry encounter":"再次挑战";retry.dataset.forgeZh="再次挑战";retry.dataset.forgeEn="Retry encounter";retry.hidden=win&&!!b.forgeRewardGranted;
  back.addEventListener("click",()=>{game._forgeResultOpen=false;overlay.remove();if(b.forgeContext?.returnToWorld){b.forgeContext.returnToWorld({outcome,committed:!!b.forgeRewardGranted});}else if(returnToMap){game.scene="map";window.WorldMap?.resumeRegion?.(false);}else{game.scene="yard";game.showYardChrome?.();}});
  retry.addEventListener("click",()=>{game._forgeResultOpen=false;overlay.remove();try{window.CatBondForgeCombat.launch(game,b.forgeContext);}catch(error){toast(game,"无法重试：存档或剧情已变化。","Retry unavailable: save or story has changed.");console.error(error);}});
  document.getElementById("stage")?.append(overlay);game._forgeResultOpen=true;
}
function currentForgeContext(game,options){
  const slot=window.State?.S;
  if(!slot)throw Error("No active save slot");
  if(options?.preview===true){
    if(new URLSearchParams(location.search).get("combat")!=="forge")throw Error("Debug preview is not enabled");
    return {preview:true,slot,returnToWorld:null};
  }
  const engine=window.CatBondResonance;
  if(!engine||typeof engine.view!=="function"||typeof engine.snapshot!=="function"||typeof engine.recordEvidence!=="function")throw Error("Chat 4 active narrative host required");
  if(options?.engine&&options.engine!==engine)throw Error("Noncanonical narrative host");
  if(options.slot&&options.slot!==slot)throw Error("Stale save slot");
  const snapshot=engine.snapshot(),view=engine.view();
  if(JSON.stringify(snapshot)!==JSON.stringify(slot.resonance))throw Error("Narrative engine does not match active slot");
  if(game.scene!=="map"||slot.resonanceExploration?.location!=="forge"||view.current?.id!==FORGE_ENCOUNTER.id||!view.objective?.includes(FORGE_ENCOUNTER.operation)||view.objective.includes("puzzle:heat-pressure"))throw Error("Forge battle unavailable: reach the forge and complete the heat-pressure puzzle first");
  return {preview:false,slot,engine,revision:snapshot.revision,returnToWorld:typeof options.returnToWorld==="function"?options.returnToWorld:null};
}
function finishEncounter(game,b){
  if(b.forgeFinished)return;b.forgeFinished=true;
  const outcome=b.forgeOutcome||"defeat",win=outcome==="win",returnToMap=game._returnScene==="map",ctx=b.forgeContext;
  const slot=window.State.S,valid=ctx?.slot===slot&&!ctx.preview;
  b.forgeRewardGranted=false;
  if(valid){
    const clone=x=>JSON.parse(JSON.stringify(x));
    const oldCoins=slot.coins,oldFish=slot.fish,oldCats=(slot.cats||[]).map(cat=>[cat,clone(cat)]),oldShowcase=slot.firstDuoShowcasePending;
    const restore=()=>{slot.coins=oldCoins;slot.fish=oldFish;slot.firstDuoShowcasePending=oldShowcase;for(const [cat,previous] of oldCats){for(const key of Object.keys(cat))if(!(key in previous))delete cat[key];Object.assign(cat,previous);}};
    try{
      const seen=new Set(),hardcore=window.State.difficulty()==="hardcore";
      for(const f of [...(b.team||[]),...(b._benchFighters?.values?.()||[])]){
        if(!f?.cat||f._reinforcement||seen.has(f.cat.uid))continue;seen.add(f.cat.uid);
        if(returnToMap&&hardcore)window.State.setBattleHealth(f.cat,f.alive?Math.max(.15,Math.min(1,f.hp/f.maxhp)):.15);
        else{delete f.cat._hpFrac;delete f.cat._hpAt;}
      }
      if(!hardcore)window.State.healAllCats?.();
      if(b._firstDuoShowcase&&b.duoUses>0)slot.firstDuoShowcasePending=false;
      if(win){
        const before=ctx.engine.snapshot();
        if(before.revision!==ctx.revision||JSON.stringify(before)!==JSON.stringify(slot.resonance))throw Error("Stale narrative revision");
        slot.coins=(slot.coins||0)+80;slot.fish=(slot.fish||0)+2;
        const cats=[...(b.team||[]),...(b._benchFighters?.values?.()||[])].filter(f=>f?.cat&&!f._reinforcement).map(f=>f.cat);
        for(const cat of new Map(cats.map(c=>[c.uid,c])).values()){window.State.addXp?.(cat,42);cat.battlesWon=(cat.battlesWon||0)+1;}
        // Chat 4 owns the only story transaction. Staged rewards are included in its single Save Manager write.
        const result=ctx.engine.recordEvidence({sceneId:FORGE_ENCOUNTER.id,operation:FORGE_ENCOUNTER.operation,region:"forge",verified:true,outcome:"win"});
        if(!result?.ok)throw Error(result?.reason||"Story save rejected");
        b.forgeRewardGranted=true;
      }else{const result=window.State.save();if(!result?.ok)throw Error(result?.reason||"Recovery save rejected");}
    }catch(error){restore();b.forgeRewardGranted=false;console.error("[Forge] outcome transaction rejected",error);}
    window.arcadeMetric?.(win?"game_complete":"game_over",{region:"forge",storyEncounter:FORGE_ENCOUNTER.operation,outcome});
  }
  document.getElementById("battle-ui")?.classList.remove("on");
  const duo=document.getElementById("duo-burst");if(duo)duo.hidden=true;
  game.setBattleHelpVisible?.(false);game._returnScene=null;game.battle=null;removeHud();
  game.scene=returnToMap?"map":"yard";
  if(returnToMap)document.body.classList.add("cb-exploring");else game.showYardChrome?.();
  game.refreshHUD?.();
  showResult(game,b,outcome,returnToMap);
}
const originalEnd=GP.endBattle;
GP.endBattle=function(){
  const b=this.battle;if(!b?.storyEncounter)return originalEnd.call(this);
  return finishEncounter(this,b);
};
const originalStart=GP.startBattle;
GP.startBattle=function(team,wildSpecies,opts={}){
  if(opts.storyEncounter!=="forge-guardian")return originalStart.call(this,team,wildSpecies,opts);
  const context=currentForgeContext(this,opts.forgeContext);
  const result=originalStart.call(this,team,wildSpecies,opts);
  if(!this.battle)throw Error("Forge battle was not created");
  const b=this.battle,enemy=b.enemies?.[0];if(!enemy)throw new Error("Forge guardian failed to spawn");
  b.storyEncounter=true;b.storyEncounterId=FORGE_ENCOUNTER.id;b.forgeState=createForgeState();b.forgeContext=context;
  b._forgeReturnScene=this._returnScene||"yard";b._forgeTeam=(team||[]).slice();
  b._analyticsRegion="forge";b.captureReady=false;
  const teamHp=(b.team||[]).reduce((n,f)=>n+(f.maxhp||0),0);
  enemy.sp=wildSpecies;enemy.visualKind="forge-guardian";enemy.isBoss=true;enemy.element="fire";
  enemy.role="elite";enemy.r=30;enemy.combatName=["熔炉守卫","Furnace guardian"];enemy.speed=65;enemy.dmg=Math.max(17,enemy.dmg*1.38);
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
    const context=currentForgeContext(game,options);
    if(game.battle)throw new Error("A battle is already active.");
    const preferred=options.team||window.UI?.getPreferredBattleTeam?.()||[];
    const team=preferred.length?preferred:(window.State.S.cats||[]).slice(0,5);
    if(!team.length)throw new Error("Choose at least one cat before launching the encounter.");
    if(game.scene!=="map")game.openWorldMap?.();
    game._returnScene="map";
    game._battleTheme={region:"forge",sky1:"#172532",sky2:"#405967",ground:"#4b4138",ground2:"#222b32",accent:"#b96e49"};
    const boss=bossSpecies();
    game.startBattle(team,boss,{storyEncounter:"forge-guardian",pack:[boss],forgeContext:context});
    return game.battle;
  },
  canLaunch(game,options){try{currentForgeContext(game,options);return !game.battle;}catch{return false;}},
  prepare(game){
    if(!this.canLaunch(game,{}))return false;
    const team=window.UI.getPreferredBattleTeam();if(!team.length)return false;
    const root=window.State.S;window.CatBondResonance.close?.();
    window.UI.openBattleModePrompt(team,bossSpecies(),{origin:"map",storyTitle:["熔炉机械守卫","Furnace guardian"],onStart:fighters=>{if(root!==window.State.S)return;try{this.launch(game,{team:fighters,slot:root,returnToWorld:()=>window.WorldMap?.resumeRegion?.(false)});}catch(error){toast(game,"战斗入口已失效。","Encounter is no longer available.");console.error(error);}}});return true;
  },
  drawBackground,drawEnemy,drawBossEffects
};
GP.startResonanceBattle=function(operation,context){if(operation!==FORGE_ENCOUNTER.operation)return false;return window.CatBondForgeCombat.prepare(this);};
window.addEventListener("cat-bond-resonance-battle-request",event=>{const d=event.detail,game=window.__game;if(!game||d?.sceneId!==FORGE_ENCOUNTER.id||d.operation!==FORGE_ENCOUNTER.operation||d.region!=="forge")return;if(!window.CatBondForgeCombat.prepare(game))toast(game,"请先完成熔炉机关。","Complete the furnace mechanism first.");});
const flee=document.getElementById("btn-flee");
flee?.addEventListener("click",()=>{if(window.__game?.battle?.storyEncounter)window.__game.battle.forgeRetreat=true;},true);
window.addEventListener("resize",()=>requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-forge-hud"))));
window.addEventListener("morrowwish-language-change",()=>{
  const game=window.__game;if(game?.battle?.storyEncounter){renderHud(game,game.battle);requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-forge-hud")));}
  const en=window.MorrowwishI18n?.get?.()!=="zh";
  document.querySelectorAll("#cb-forge-result [data-forge-zh][data-forge-en]").forEach(node=>{node.textContent=en?node.dataset.forgeEn:node.dataset.forgeZh;});
});
})();