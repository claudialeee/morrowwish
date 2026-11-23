import { STAGES, FORMS, nextStage, bondTier, shieldStrength, canIntercept, chapterGoal, compareForms } from './logic.mjs';

// Standalone design experiment. Intentionally NO imports from the production game,
// no localStorage, no telemetry, no external assets or API calls.
// Production's existing hand-painted battle garden is reused as a background.
const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');
const dom = Object.fromEntries(['hp','form','bond','chapter','goal','notice','modal','modal-title','modal-body','modal-btn','modal-eyebrow'].map(id => [id, document.getElementById(id)]));
const W=canvas.width, H=canvas.height;
const bg=new Image();
bg.src='../../assets/battle-garden.svg';
const input={left:false,right:false,up:false,down:false,fire:false,joyX:0,joyY:0};
const chapters={encounter:'相遇',together:'同行',apart:'分别',reunion:'重逢',complete:'完成'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rand=(a,b)=>a+Math.random()*(b-a);
let g=null,last=0,modalCallback=null,uiAcc=0;

function createGame(){
  return {
    stage:'encounter', stageAge:0, elapsed:0, inModal:false, playing:true, guardianUnlocked:false,
    reunited:false, trust:0, protectedOnce:false, shield:0, comboNotice:false, noticeUntil:0,
    player:{x:215,y:330,hp:100,maxHp:100,form:'hunter',attackCd:0,skillCd:0,guardCd:0,guard:0,dashCd:0,dash:0,invuln:0,facing:1},
    companion:{x:425,y:322,hp:75,maxHp:75,present:true,attackCd:1,flare:0},
    enemies:[],particles:[],slashes:[],
    stats:{hunterHits:0,guardianHits:0,shifts:0,intercepts:0,skills:0,damageTaken:0,seconds:0,chaptersCleared:0}
  };
}
function enemy(type,x,y,preferCompanion=false) {
  const data={
    scout:{hp:77,speed:86,damage:11,radius:22,windup:.82,label:'追逐者'},
    bulwark:{hp:132,speed:59,damage:17,radius:30,windup:1.12,label:'石甲守卫'},
    boss:{hp:255,speed:72,damage:20,radius:39,windup:1.03,label:'山谷领主'}
  }[type];
  return {type,x,y,hp:data.hp,maxHp:data.hp,speed:data.speed,damage:data.damage,radius:data.radius,
    windupTime:data.windup,windup:0,recover:1.1,preferCompanion,target:'player',slow:0,flash:0,dead:false,label:data.label};
}
function startStage(stage) {
  if(!g)return;
  g.stage=stage;g.stageAge=0;g.shield=0;g.inModal=false;
  g.player.x=215;g.player.y=322;g.player.hp=clamp(g.player.hp+38,1,g.player.maxHp);
  g.player.invuln=.75;g.player.guard=0;g.player.skillCd=0;
  g.companion.present=stage!=='apart';
  g.companion.x=425;g.companion.y=325;g.companion.hp=g.companion.maxHp;
  g.companion.attackCd=1.4;
  if(stage==='encounter')g.enemies=[enemy('scout',775,319,true)];
  if(stage==='together')g.enemies=[enemy('scout',760,235,true),enemy('bulwark',826,391,false)];
  if(stage==='apart')g.enemies=[enemy('scout',745,250,false),enemy('bulwark',817,385,false)];
  if(stage==='reunion')g.enemies=[enemy('boss',780,285,true),enemy('scout',670,400,false)];
  g.particles=[];g.slashes=[];hideModal();
  say(stage==='encounter'?'小雾有些害怕。靠近它，按 E 挡下敌人的攻击。':
    stage==='together'?'按 1 / 2 切换猎手与守卫。两种形态拥有不同的普通攻击与技能。':
    stage==='apart'?'小雾离开了，但潮汐守卫仍然可用——只是失去了一部分力量。':
    '听见铃声了吗？小雾带着新的力量回来了！',5.5);
  renderHud();
  canvas.focus({preventScroll:true});
}
function showModal(title,body,button,callback,eyebrow='CHALLENGER PLAYTEST') {
  g.inModal=true;input.fire=false;
  dom['modal-title'].textContent=title;
  dom['modal-body'].textContent=body;
  dom['modal-btn'].textContent=button;
  dom['modal-eyebrow'].textContent=eyebrow;
  dom.modal.hidden=false;modalCallback=callback;
}
function hideModal(){dom.modal.hidden=true;modalCallback=null;if(g)g.inModal=false;}
dom['modal-btn'].addEventListener('click',()=>{const fn=modalCallback;if(fn)fn();});
function say(message,seconds=2.7) {
  dom.notice.textContent=message;
  if(g)g.noticeUntil=g.elapsed+seconds;
}
function pulse(x,y,text,color='#fff4cc',size=15) {
  if(!g)return;
  g.particles.push({x,y,vx:rand(-12,12),vy:-35,life:1.1,max:1.1,text,color,size});
}
function sparks(x,y,color='#e2c47c',count=7){
  for(let i=0;i<count;i++)g.particles.push({x,y,vx:rand(-160,160),vy:rand(-150,100),life:rand(.23,.65),max:.65,color,r:rand(2,5)});
}
function nearestEnemy(range=Infinity) {
  let best=null,bd=range;
  for(const e of g.enemies)if(!e.dead){const d=dist(g.player,e);if(d<bd){best=e;bd=d;}}
  return best;
}
function hitEnemy(e,damage,source){
  if(e.dead)return;
  e.hp=Math.max(0,e.hp-damage);e.flash=.16;
  sparks(e.x,e.y,source==='hunter'?'#e6a15e':'#8dced9',5);
  pulse(e.x,e.y-35,'−'+Math.round(damage),source==='hunter'?'#f7b177':'#a3e4ed');
  if(source==='hunter')g.stats.hunterHits++;
  if(source==='guardian')g.stats.guardianHits++;
  if(e.hp<=0){e.dead=true;sparks(e.x,e.y,'#ffe9b5',22);}
}
function attack(){
  const p=g.player,form=FORMS[p.form];
  if(p.attackCd>0)return;
  p.attackCd=form.attackCooldown;
  const foe=nearestEnemy(form.attackRange);
  if(!foe){g.slashes.push({x:p.x+p.facing*48,y:p.y,life:.16,max:.16,color:'#d5d1c1',size:42});return;}
  if(p.form==='hunter'){
    hitEnemy(foe,form.attackDamage,'hunter');
    p.facing=foe.x>=p.x?1:-1;
    g.slashes.push({x:foe.x,y:foe.y,life:.21,max:.21,color:'#edb26a',size:69});
  }else{
    hitEnemy(foe,form.attackDamage+(g.reunited?3:0),'guardian');
    foe.slow=1.2;
    const t=shieldStrength({guardianUnlocked:g.guardianUnlocked,reunited:g.reunited,companionPresent:g.companion.present});
    g.slashes.push({x:foe.x,y:foe.y,life:.29,max:.29,color:'#a7e9f0',size:48,fromX:p.x,fromY:p.y,ray:true});
    if(t>1)g.player.hp=clamp(g.player.hp+1,0,100);
  }
}
function activateSkill(){
  if(!g||g.inModal)return;
  const p=g.player;if(p.skillCd>0)return;
  g.stats.skills++;
  if(p.form==='hunter'){
    const foe=nearestEnemy(330);
    if(!foe){say('疾扑需要附近有敌人',1.1);return;}
    p.skillCd=4.5;p.invuln=.32;
    const dx=foe.x-p.x,dy=foe.y-p.y,d=Math.max(1,Math.hypot(dx,dy));
    p.x=clamp(foe.x-dx/d*57,40,920);p.y=clamp(foe.y-dy/d*57,105,476);
    hitEnemy(foe,40,'hunter');g.slashes.push({x:foe.x,y:foe.y,life:.42,max:.42,color:'#ffa965',size:112});
    say('疾风猎手：瞬身疾扑！',1.15);
  }else{
    p.skillCd=7.2;g.shield=3.1;
    const power=shieldStrength({guardianUnlocked:g.guardianUnlocked,reunited:g.reunited,companionPresent:g.companion.present});
    p.hp=clamp(p.hp+Math.round(4*power),0,p.maxHp);
    if(g.companion.present)g.companion.hp=clamp(g.companion.hp+Math.round(12*power),0,g.companion.maxHp);
    sparks(p.x,p.y,'#99e9ed',20);say(g.reunited?'重逢·双潮守护！':'潮汐守卫：守护泡泡！',1.6);
  }
}
function activateGuard(){
  if(!g||g.inModal)return;const p=g.player;
  if(p.guardCd>0)return;
  p.guard=1.05;p.guardCd=3.8;
  sparks(p.x,p.y,'#d6f0e2',7);
  if(!g.companion.present)say('小雾不在身边。但你仍能守护自己的回忆。',1.6);
  else if(dist(p,g.companion)>135)say('靠近小雾再保护它（距离太远）',1.8);
  else say('护住小雾！等待敌人攻击命中护盾。',1.7);
}
function dash(){
  if(!g||g.inModal)return;const p=g.player;
  if(p.dashCd>0)return;
  p.dash=.23;p.dashCd=1.35;p.invuln=.39;
  sparks(p.x,p.y,'#e5ded0',7);
}
function shift(to){
  if(!g||g.inModal)return;
  if(to==='guardian'&&!g.guardianUnlocked){say('和小雾一起战胜第一位追逐者，就能解锁潮汐守卫。',2.1);return;}
  if(g.player.form===to)return;
  g.player.form=to;g.player.attackCd=.12;g.player.skillCd=.45;
  g.stats.shifts++;sparks(g.player.x,g.player.y,to==='guardian'?'#8de3df':'#efb66c',24);
  say(to==='guardian'?'羁绊变身 · 潮汐守卫（远程 / 护盾）':'羁绊变身 · 疾风猎手（近战 / 疾扑）',1.8);
  renderHud();
}
function intercept(e,target){
  const p=g.player;
  const close=dist(p,g.companion);
  const intercepted=canIntercept({guarding:p.guard>0,distanceToCompanion:close,companionPresent:g.companion.present,enemyTarget:e.target});
  const bubble=g.shield>0&&dist(p,target)<150;
  if(intercepted||bubble){
    const added=!g.protectedOnce?23:10;
    g.trust=clamp(g.trust+added,0,100);
    g.stats.intercepts++;g.protectedOnce=true;
    sparks(target.x,target.y,'#bbf7f1',13);pulse(target.x,target.y-47,'守护成功 +'+added,'#d5fff4');
    say('小雾记住了你的保护。羁绊正在成长。',2.2);
    return true;
  }
  return false;
}
function enemyStrike(e){
  const target=e.target==='companion'&&g.companion.present?g.companion:g.player;
  if(dist(e,target)>e.radius+76)return;
  if(target===g.companion&&intercept(e,target))return;
  if(target===g.player&&(g.player.invuln>0||g.player.guard>0||g.shield>0)){
    sparks(g.player.x,g.player.y,'#d0f9ef',9);return;
  }
  if(target===g.player){
    const damage=e.damage;g.player.hp=clamp(g.player.hp-damage,0,100);g.stats.damageTaken+=damage;
    sparks(target.x,target.y,'#e7767d',9);pulse(target.x,target.y-38,'−'+damage,'#e88184');
    if(g.player.hp<=0){showModal('再试一次？','这个战斗原型允许失败。尝试更靠近伙伴、用 E 守护，并在近战与远程形态之间切换。','重新开始',begin);return;}
  }else{
    g.companion.hp=clamp(g.companion.hp-e.damage,1,g.companion.maxHp);
    sparks(target.x,target.y,'#dc8c82',8);
    say('小雾受到惊吓。你可以用 E 为它挡下下一次攻击。',1.7);
  }
}
function movePlayer(dt){
  const p=g.player;let dx=Number(input.right)-Number(input.left)+input.joyX;
  let dy=Number(input.down)-Number(input.up)+input.joyY;
  const d=Math.hypot(dx,dy);if(d>.01){dx/=Math.max(1,d);dy/=Math.max(1,d);p.facing=dx===0?p.facing:Math.sign(dx);}
  const speed=FORMS[p.form].speed*(p.dash>0?2.1:1);
  p.x=clamp(p.x+dx*speed*dt,46,914);p.y=clamp(p.y+dy*speed*dt,132,477);
  for(const prop of ['attackCd','skillCd','guardCd','guard','dashCd','dash','invuln'])p[prop]=Math.max(0,p[prop]-dt);
  if(input.fire)attack();
}
function moveCompanion(dt){
  const c=g.companion;if(!c.present)return;
  c.attackCd-=dt;c.flare=Math.max(0,c.flare-dt);
  // The first encounter keeps the shy kitten visible and easy to protect.
  const tx=g.stage==='encounter'?430:g.player.x+72;
  const ty=g.stage==='encounter'?326:g.player.y+51;
  const d=Math.hypot(tx-c.x,ty-c.y);
  if(d>10){const speed=clamp(d*2,0,92);c.x+=(tx-c.x)/d*speed*dt;c.y+=(ty-c.y)/d*speed*dt;}
  const foe=g.enemies.filter(e=>!e.dead).sort((a,b)=>dist(a,c)-dist(b,c))[0];
  if(foe&&c.attackCd<=0&&dist(c,foe)<305){
    c.attackCd=g.reunited?1.0:1.6;c.flare=.35;
    const damage=g.reunited?16:8;
    foe.hp=Math.max(0,foe.hp-damage);foe.flash=.15;
    g.slashes.push({x:foe.x,y:foe.y,life:.23,max:.23,color:'#b4e9df',size:39,fromX:c.x,fromY:c.y,ray:true});
    if(foe.hp<=0){foe.dead=true;sparks(foe.x,foe.y,'#e8fff3',15);}
  }
}
function updateEnemies(dt){
  for(const e of g.enemies){
    if(e.dead)continue;
    e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);e.recover=Math.max(0,e.recover-dt);
    const target=e.target==='companion'&&g.companion.present?g.companion:g.player;
    if(e.windup>0){
      e.windup-=dt;
      if(e.windup<=0){enemyStrike(e);e.recover=e.type==='boss'?1.2:1.05;e.target='player';}
      continue;
    }
    if(e.recover===0){
      e.target=e.preferCompanion&&g.companion.present?'companion':(g.companion.present&&Math.random()<.35?'companion':'player');
      e.windup=e.windupTime;
      continue;
    }
    const aim=e.preferCompanion&&g.companion.present?g.companion:g.player;
    const d=Math.max(.1,dist(e,aim));
    if(d>e.radius+58){
      const spd=e.speed*(e.slow>0?.52:1);
      e.x=clamp(e.x+(aim.x-e.x)/d*spd*dt,38,922);
      e.y=clamp(e.y+(aim.y-e.y)/d*spd*dt,133,481);
    }
  }
}
function endWave(){
  if(g.inModal||g.enemies.some(e=>!e.dead))return;
  g.stats.chaptersCleared++;
  const next=nextStage(g.stage);
  if(next==='together'){
    g.guardianUnlocked=true;g.trust=Math.max(24,g.trust);
    showModal('第一次羁绊变身','即使你还没成功挡下一次攻击，小雾也因并肩作战开始信任你。你获得「潮汐守卫」：远程冰晶弹 + 保护泡泡。按 1 / 2 切换，与近战猎手形成真正的战术选择。','继续同行',()=>startStage('together'),'第一章 · 相遇');
  }else if(next==='apart'){
    showModal('小雾决定离开','它找到了失散伙伴的线索，想独自沿着溪流继续寻找。它留下一个小铃铛。你仍然能使用潮汐守卫，但失去同行者后护盾会弱一些。','带着回忆继续',()=>startStage('apart'),'第二章 · 分别');
  }else if(next==='reunion'){
    g.reunited=true;g.trust=clamp(g.trust+35,60,100);
    showModal('铃铛响了。','小雾回来了。它更勇敢，还学会了主动支援；你们共同的守卫形态也得到了强化。重逢不是还给玩家被拿走的能力，而是创造新的能力。','迎接最终挑战',()=>startStage('reunion'),'第三章 · 重逢');
  }else{
    g.stage='complete';g.stats.seconds=Math.round(g.elapsed);
    const s=g.stats;
    const usedBoth=compareForms(s.hunterHits,s.guardianHits);
    showModal('羁绊原型完成','两种形态都造成有效伤害：'+(usedBoth?'是':'否')+'。成功保护伙伴 '+s.intercepts+' 次；主动切换形态 '+s.shifts+' 次；承受伤害 '+s.damageTaken+'；游玩 '+s.seconds+' 秒。这个结果不是玩家留存数据，只供可玩性测试。','重玩原型',begin,'PROTOTYPE COMPLETE · NOT A SHIPPED GAME');
  }
}
function update(dt){
  g.elapsed+=dt;g.stageAge+=dt;g.stats.seconds=Math.round(g.elapsed);
  g.shield=Math.max(0,g.shield-dt);
  movePlayer(dt);moveCompanion(dt);updateEnemies(dt);
  for(const p of g.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;p.life-=dt;}
  for(const s of g.slashes)s.life-=dt;
  g.particles=g.particles.filter(p=>p.life>0);
  g.slashes=g.slashes.filter(s=>s.life>0);
  if(dom.notice.textContent&&g.elapsed>g.noticeUntil)dom.notice.textContent='';
  if(!g.inModal)endWave();
  uiAcc+=dt;if(uiAcc>.12){renderHud();uiAcc=0;}
}
function renderHud(){
  if(!g)return;
  const p=g.player;
  dom.hp.textContent=Math.ceil(p.hp)+' / 100';
  dom.form.textContent=FORMS[p.form].name+(p.form==='guardian'?(g.reunited?' ✦':g.companion.present?'':' · 回忆'):'');
  dom.bond.textContent=(g.companion.present?'在身边 · ':'在远方 · ')+Math.round(g.trust)+' · '+({forming:'初识',remembered:'铭记',renewed:'重逢'}[bondTier(g.trust,g.reunited)]);
  dom.chapter.textContent=chapters[g.stage];
  dom.goal.textContent=chapterGoal(g.stage);
}
function roundedRect(x,y,w,h,r,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function healthbar(x,y,w,h,value,max,color){
  roundedRect(x-w/2,y,w,h,h/2,'#2d3d3a99');
  roundedRect(x-w/2+2,y+2,Math.max(0,(w-4)*value/max),h-4,(h-4)/2,color);
}
function drawCat(x,y,kind,scale=1,flash=false){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  const isPlayer=kind==='player',isCompanion=kind==='companion';
  const fill=isPlayer?'#f1d8ae':isCompanion?'#c7d7de':'#9e8493';
  const edge=isPlayer?'#a27d5b':isCompanion?'#6d8c9b':'#66596c';
  const tilt=isPlayer?g.player.facing:1;
  ctx.scale(tilt,1);
  ctx.fillStyle='#333c2b35';ctx.beginPath();ctx.ellipse(0,28,30,8,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=edge;ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-19,8);ctx.bezierCurveTo(-52,-23,-59,17,-47,19);ctx.stroke();
  ctx.fillStyle=flash?'#fffdf1':fill;ctx.strokeStyle=edge;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,10,27,27,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  for(const ex of [-16,16]){ctx.beginPath();ctx.moveTo(ex-11,-10);ctx.lineTo(ex-8,-42);ctx.lineTo(ex+8,-19);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.beginPath();ctx.arc(0,-8,28,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f4a9a7';ctx.beginPath();ctx.moveTo(-3,3);ctx.lineTo(3,3);ctx.lineTo(0,7);ctx.fill();
  ctx.fillStyle='#273e3f';for(const eyeX of [-11,11]){ctx.beginPath();ctx.ellipse(eyeX,-12,3,5,0,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle=edge;ctx.lineWidth=1;for(const d of [-1,1])for(const yy of [1,7]){ctx.beginPath();ctx.moveTo(d*7,yy);ctx.lineTo(d*29,yy-4);ctx.stroke();}
  if(isPlayer){
    ctx.fillStyle=g.player.form==='hunter'?'#e98e50':'#7dc6c9';
    ctx.beginPath();ctx.moveTo(-14,13);ctx.lineTo(15,13);ctx.lineTo(7,26);ctx.lineTo(0,19);ctx.lineTo(-7,26);ctx.closePath();ctx.fill();
  }
  if(isCompanion){
    ctx.strokeStyle=g.reunited?'#e8c676':'#7fb3be';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,7,27,.1,Math.PI-.1);ctx.stroke();
    if(g.reunited){ctx.fillStyle='#ffe28c';ctx.beginPath();ctx.arc(17,-32,6,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
function drawEnemy(e){
  if(e.dead)return;
  ctx.save();
  ctx.translate(e.x,e.y);
  const s=e.radius/26;ctx.scale(s,s);
  ctx.fillStyle='#18232232';ctx.beginPath();ctx.ellipse(0,31,28,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.flash>0?'#fff6db':e.type==='boss'?'#65586c':'#957486';
  ctx.strokeStyle=e.type==='boss'?'#4f4658':'#755369';ctx.lineWidth=3;
  for(const d of [-1,1]){ctx.beginPath();ctx.moveTo(d*12,-13);ctx.lineTo(d*23,-37);ctx.lineTo(d*3,-24);ctx.fill();ctx.stroke();}
  ctx.beginPath();ctx.ellipse(0,0,27,28,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffdb9d';for(const x of [-11,11]){ctx.beginPath();ctx.ellipse(x,-5,4,5,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  healthbar(e.x,e.y-e.radius-31,e.type==='boss'?106:66,8,e.hp,e.maxHp,e.type==='boss'?'#ecb477':'#f08c88');
  if(e.windup>0){
    const t=1-e.windup/e.windupTime;
    const target=e.target==='companion'&&g.companion.present?g.companion:g.player;
    ctx.save();ctx.strokeStyle='#e16858';ctx.lineWidth=3;ctx.setLineDash([8,7]);
    ctx.beginPath();ctx.arc(target.x,target.y,42+12*t,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(target.x,target.y);ctx.globalAlpha=.38;ctx.stroke();
    ctx.restore();
  }
}
function draw(){
  ctx.clearRect(0,0,W,H);
  if(bg.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,W,H);
  else{ctx.fillStyle='#b5cbb2';ctx.fillRect(0,0,W,H);}
  ctx.fillStyle='#e7e9d52a';ctx.fillRect(0,120,W,H-120);
  if(!g)return;
  // Bond thread: only visible while companion is here, so departure is readable.
  if(g.companion.present){
    ctx.save();ctx.strokeStyle=g.reunited?'#f9d88f':'#a9ddd4';ctx.globalAlpha=.65;
    ctx.lineWidth=g.reunited?5:3;ctx.setLineDash([6,9]);ctx.beginPath();
    ctx.moveTo(g.player.x,g.player.y);ctx.quadraticCurveTo((g.player.x+g.companion.x)/2,(g.player.y+g.companion.y)/2-40,g.companion.x,g.companion.y);
    ctx.stroke();ctx.restore();
  }
  if(g.shield>0){
    const power=shieldStrength({guardianUnlocked:g.guardianUnlocked,reunited:g.reunited,companionPresent:g.companion.present});
    ctx.save();ctx.strokeStyle='#83ded8';ctx.fillStyle='#96eef222';ctx.lineWidth=3*power;
    ctx.beginPath();ctx.arc(g.player.x,g.player.y,100*power,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  for(const e of g.enemies)drawEnemy(e);
  if(g.companion.present){drawCat(g.companion.x,g.companion.y,'companion',.88);healthbar(g.companion.x,g.companion.y-56,70,7,g.companion.hp,g.companion.maxHp,'#91cdd8');}
  if(g.player.form==='guardian'){
    ctx.strokeStyle='#8fd9d2';ctx.lineWidth=4;ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(g.player.x,g.player.y,38,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  if(g.player.guard>0){
    ctx.strokeStyle='#e5f8dc';ctx.lineWidth=6;ctx.beginPath();ctx.arc(g.player.x,g.player.y,51,-1.8,1.8);ctx.stroke();
  }
  drawCat(g.player.x,g.player.y,'player',1.03,g.player.invuln>0&&Math.sin(g.elapsed*43)>0);
  healthbar(g.player.x,g.player.y-69,82,9,g.player.hp,g.player.maxHp,'#7fb59a');
  for(const s of g.slashes){
    const a=s.life/s.max;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=s.color;ctx.lineWidth=s.ray?5:7;
    if(s.ray){ctx.beginPath();ctx.moveTo(s.fromX,s.fromY);ctx.lineTo(s.x,s.y);ctx.stroke();}
    ctx.beginPath();ctx.arc(s.x,s.y,s.size*(1-a*.4)/2,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  for(const p of g.particles){
    const a=clamp(p.life/p.max,0,1);ctx.save();ctx.globalAlpha=a;ctx.fillStyle=p.color;
    if(p.text){ctx.font='bold '+p.size+'px sans-serif';ctx.textAlign='center';ctx.shadowColor='#25453b';ctx.shadowBlur=6;ctx.fillText(p.text,p.x,p.y);}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.r||3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  // No gameplay-critical text is baked into the painted background.
  roundedRect(16,132,206,30,12,'#fff9ebd9');
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#486963';
  ctx.fillText('敌人 '+g.enemies.filter(e=>!e.dead).length+'  ·  形态 '+(g.player.form==='hunter'?'1':'2'),28,152);
  if(g.stage==='apart'){
    roundedRect(16,172,218,34,10,'#fff9ebe0');ctx.fillStyle='#607d7e';
    ctx.font='bold 12px sans-serif';ctx.fillText('小雾暂离：守卫之力保留',26,194);
  }
}
function tick(timestamp){
  const dt=Math.min(.035,(timestamp-(last||timestamp))/1000);last=timestamp;
  if(g&&!g.inModal&&document.visibilityState==='visible')update(dt);
  draw();requestAnimationFrame(tick);
}
function begin(){g=createGame();input.fire=false;uiAcc=0;startStage('encounter');}
function pause(){
  if(!g||g.inModal)return;
  showModal('已暂停','原型不会修改正式 Cat Bond 存档。继续后请尝试按 E 保护伙伴、按 1/2 体验不同攻击方式。','继续',()=>{hideModal();canvas.focus({preventScroll:true});});
}
function keyState(code,value){
  if(['KeyA','ArrowLeft'].includes(code))input.left=value;
  if(['KeyD','ArrowRight'].includes(code))input.right=value;
  if(['KeyW','ArrowUp'].includes(code))input.up=value;
  if(['KeyS','ArrowDown'].includes(code))input.down=value;
  if(['KeyJ','KeyK'].includes(code))input.fire=value;
}
window.addEventListener('keydown',e=>{
  const c=e.code;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(c))e.preventDefault();
  keyState(c,true);
  if(e.repeat||!g||g.inModal)return;
  if(c==='Digit1')shift('hunter');
  if(c==='Digit2')shift('guardian');
  if(c==='KeyQ')activateSkill();
  if(c==='KeyE')activateGuard();
  if(c==='Space')dash();
  if(c==='KeyP'||c==='Escape')pause();
});
window.addEventListener('keyup',e=>keyState(e.code,false));
window.addEventListener('blur',()=>{for(const k of ['left','right','up','down','fire'])input[k]=false;input.joyX=0;input.joyY=0;if(g&&!g.inModal)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&g&&!g.inModal)pause();});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&g&&!g.inModal){input.fire=true;canvas.focus({preventScroll:true});}});
window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')input.fire=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const button of document.querySelectorAll('[data-act]')){
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!g||g.inModal)return;
    const action=button.dataset.act;
    if(action==='attack')input.fire=true;
    if(action==='guard')activateGuard();
    if(action==='dash')dash();
    if(action==='skill')activateSkill();
    if(action==='form')shift(g.player.form==='hunter'?'guardian':'hunter');
    if(action==='pause')pause();
    if(action==='attack')button.setPointerCapture(e.pointerId);
  });
  button.addEventListener('pointerup',()=>{if(button.dataset.act==='attack')input.fire=false;});
  button.addEventListener('pointercancel',()=>{if(button.dataset.act==='attack')input.fire=false;});
}
const joystick=document.getElementById('joystick'),stick=document.getElementById('stick');
let joyPointer=null;
function joyMove(e){
  const rect=joystick.getBoundingClientRect(),x=e.clientX-(rect.left+rect.width/2),y=e.clientY-(rect.top+rect.height/2);
  const r=rect.width*.34,len=Math.hypot(x,y),factor=Math.min(1,r/Math.max(.01,len));
  input.joyX=clamp(x/r,-1,1)*factor;input.joyY=clamp(y/r,-1,1)*factor;
  stick.style.left=(50+input.joyX*31)+'%';stick.style.top=(50+input.joyY*31)+'%';
}
joystick.addEventListener('pointerdown',e=>{if(!g||g.inModal)return;e.preventDefault();joyPointer=e.pointerId;joystick.setPointerCapture(joyPointer);joyMove(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)joyMove(e);});
function resetJoy(e){if(e.pointerId!==joyPointer)return;joyPointer=null;input.joyX=0;input.joyY=0;stick.style.left='50%';stick.style.top='50%';}
joystick.addEventListener('pointerup',resetJoy);joystick.addEventListener('pointercancel',resetJoy);
// A read-only, opt-in QA surface. No analytics are sent anywhere.
window.__bondShiftDebug=()=>g?{stage:g.stage,trust:g.trust,form:g.player.form,guardianUnlocked:g.guardianUnlocked,reunited:g.reunited,stats:{...g.stats}}:null;
requestAnimationFrame(tick);
dom['modal-btn'].addEventListener('click',()=>{if(!g)begin();});
