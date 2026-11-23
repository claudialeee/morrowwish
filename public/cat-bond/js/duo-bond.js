// Personality-driven Cat Bond teamwork, applied to every battle mode.
// Side effects are bounded, all attacks obey the existing resolveHit pipeline.
// Loaded after battle.js; no save migration required for existing cat collections.
(function(){
'use strict';
const P=window.Battle?.CaptureBattle?.prototype;
if(!P)return;
const en=()=>window.MorrowwishI18n?.get?.()!=='zh';
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
// A dedicated, short in-arena finishing strike. It survives the painting's
// retreat and follows the CURRENT battle target; never a pasted image panel.
function drawDuoRelease(g,W,H,release){
 const u=cap(release.age/release.max,0,1),fade=Math.pow(1-u,1.35);
 if(fade<=.002)return;
 const x=cap(release.x,W*.15,W*.85);
 const y=cap(release.y,H*.20,H*.82);
 const size=Math.min(340,Math.max(115,Math.min(W*.65,H*.78)));
 const [first,second]=(release.elements||'fire+light').split('+');
 const colors={dark:'#c4a5e6',elec:'#fbdf95',fire:'#ffb78e',
   grass:'#b5e2ad',light:'#fff1b1',water:'#9adbe9'};
 const c1=colors[first]||release.first||'#dcc6f4',c2=colors[second]||release.second||'#b8e9da';
 g.save();
 g.globalAlpha*=fade*.84;
 g.globalCompositeOperation='screen';
 // Large effects stay around the actual enemy and do not conceal the HUD.
 const radius=size*(.12+.32*u);
 const halo=g.createRadialGradient(x,y,2,x,y,radius);
 halo.addColorStop(0,c1+'99');
 halo.addColorStop(.48,c2+'40');
 halo.addColorStop(1,c2+'00');
 g.fillStyle=halo;g.beginPath();g.arc(x,y,radius,0,Math.PI*2);g.fill();
 g.lineCap='round';g.lineJoin='round';
 for(let n=0;n<(release.tier>=3?3:2);n++){
  const r=radius*(.7+n*.16),spin=u*2.8+n*2.1;
  g.globalAlpha=fade*(.76-n*.13);
  g.strokeStyle=n%2?c2:c1;
  g.lineWidth=Math.max(2,(release.tier>=3?5:4)*(1-u*.7));
  g.beginPath();g.arc(x,y,r,spin,spin+Math.PI*(.92+n*.12));g.stroke();
 }
 if(window.CatBondDuoFinale?.draw){
  g.save();
  g.globalAlpha=fade*.78;
  g.translate(x-size*.5,y-size*.39);
  window.CatBondDuoFinale.draw(g,size,size*.78,.22+.45*u,release.elements,release.tier);
  g.restore();
 }
 g.restore();
}
window.CatBondDuoReleaseVFX={draw:drawDuoRelease,duration:1.1};
P.bondFighters=function(){
 if(!this.duo)return null;
 const a=this.team.find(f=>f.alive&&f.cat.uid===this.duo.a.uid);
 const b=this.team.find(f=>f.alive&&f.cat.uid===this.duo.b.uid);
 return a&&b?[a,b]:null;
};
P.bondMoment=function(kind,label){
 if(!this.duo)return;
 this.bondEvents??={guard:0,courage:0,feint:0,ambush:0,lazy:0,feast:0};
 this.bondEvents[kind]=(this.bondEvents[kind]||0)+1;
 if(label)this.game.toast(label);
 window.arcadeMetric?.('bond_personality_reaction',{kind,tier:this.duo.tier});
 // Only three trust points per encounter; cannot farm by hiding from enemies.
 this._bondGrowth??=0;
 if(this._bondGrowth<3){
  this._bondGrowth++;
  const result=window.CatRelations?.grow?.(this.duo.a,this.duo.b,1);
  if(result?.value!=null){
   this.duo.value=result.value;
   const before=this.duo.tier;
   this.duo.tier=result.value>=90?3:result.value>=60?2:1;
   if(this.duo.tier>before)this.game.toast(en()?'New duo move awakened!':'双猫默契提升！解锁新的合击动作！');
  }
 }
};
const originalHurt=P.hurtMe;
P.hurtMe=function(damage,x,y,cat){
 const target=cat||this.me(),duo=this.bondFighters();
 if(duo&&target&&duo.includes(target)&&!this.coachHoldsEnemies()){
  const friend=duo.find(f=>f!==target);
  const guards=['gentle','diligent'].includes(friend.cat.personality);
  const needsCourage=target.cat.personality==='shy';
  const vulnerable=target.hp/target.maxhp<.72||damage>target.maxhp*.16;
  if((guards||needsCourage)&&vulnerable&&friend.hp>friend.maxhp*.2&&this.t>=(friend._bondGuardNext||0)){
   friend._bondGuardNext=this.t+Math.max(10,17-this.duo.tier*2);
   damage*=1-cap(.32+this.duo.tier*.07,.3,.56);
   this.vfx.beam(friend.x,friend.y,target.x,target.y,'#b2eed5');
   this.vfx.ring(target.x,target.y,{r0:12,vr:230,life:.6,color:'#bbf1d7',width:5});
   this.bondMoment('guard',en()?State.catName(friend.cat)+' protects '+State.catName(target.cat):
      State.catName(friend.cat)+' 挡在 '+State.catName(target.cat)+' 身前！');
   if(needsCourage){
    this._bondFollowups??=[];
    this._bondFollowups.push({kind:'courage',at:this.t+.64,uid:target.cat.uid,
      enemyId:(this.lockedEnemy()||this.nearestEnemy(target.x,target.y))?.i});
    target._bondBraveUntil=this.t+2;
   }
  }
 }
 return originalHurt.call(this,damage,x,y,cat);
};
function followup(b,ev){
 const f=b.team.find(x=>x.alive&&x.cat.uid===ev.uid);
 if(!f)return;
 const foe=b.liveEnemies().find(x=>x.i===ev.enemyId)||b.nearestEnemy(f.x,f.y);
 if(!foe)return;
 const courage=ev.kind==='courage',tier=b.duo?.tier||1;
 const dmg=Math.min(foe.maxhp*.17,f.dmg*(courage?1.7:1.9)*(1+(tier-1)*.1));
 b.vfx.beam(f.x,f.y,foe.x,foe.y,courage?'#ffe4bd':'#baf2d7');
 b.vfx.slash(foe.x,foe.y,courage?-.7:.7,courage?'#ffdda5':'#a2ead9',67,1.12);
 b.resolveHit(foe,'me',{element:f.element,kind:'melee',isBondReaction:true},dmg,foe.x,foe.y);
 if(tier>=2&&foe.alive){
  foe.status??={};foe.tags??=[];
  foe.status.expose=Math.max(foe.status.expose||0,1.8);
  if(!foe.tags.includes('expose'))foe.tags.push('expose');
 }
 b.vfx.text(foe.x,foe.y-42,courage?(en()?'BRAVE COUNTER!':'勇气反击！'):
  (en()?'SNEAK ATTACK!':'偷袭成功！'),courage?'#ffe8ac':'#c3f2d7',16);
 b.bondMoment(courage?'courage':'ambush');
}
P.tickBondStory=function(){
 if(!this.duo||this.done||this.coachHoldsEnemies())return;
 const duo=this.bondFighters();if(!duo)return;
 this._bondFollowups??=[];
 // Process committed counterattacks first, so no effect depends on a toast.
 for(let i=this._bondFollowups.length-1;i>=0;i--){
  const ev=this._bondFollowups[i];if(this.t<ev.at)continue;
  this._bondFollowups.splice(i,1);followup(this,ev);
 }
 // Gentle and diligent protectors save friends above. A shy cat then attacks.
 // Mischievous or clever kittens actively distract the wild cat and coordinate
 // with their partner; the actual AI changes target for 2.4 simulated seconds.
 if(this.t>=(this._bondNextFeint??6)){
  const lead=duo.find(f=>['mischievous','clever'].includes(f.cat.personality));
  const ally=lead&&duo.find(f=>f!==lead);
  const foe=lead&&this.nearestEnemy(lead.x,lead.y);
  if(lead&&ally&&foe&&Math.hypot(lead.x-foe.x,lead.y-foe.y)<420){
   foe._bondLureUid=lead.cat.uid;foe._bondLureUntil=this.t+2.4;
   lead.inv=Math.max(lead.inv,.55);
   this.vfx.ring(lead.x,lead.y,{r0:13,vr:180,life:.65,color:'#f3d092',width:4});
   this._bondFollowups.push({kind:'ambush',at:this.t+.82,uid:ally.cat.uid,enemyId:foe.i});
   this.bondMoment('feint',en()?'Look here! A surprise attack!':'调皮猫诱敌，搭档准备偷袭！');
   this._bondNextFeint=this.t+Math.max(12,21-this.duo.tier*2);
  }else this._bondNextFeint=this.t+3;
 }
 // Sleepy cats aren't hyperactive: only one reactive rescue per battle.
 if(!this._bondLazyUsed&&this.t>5){
  const sleeper=duo.find(f=>f.cat.personality==='lazy');
  const friend=sleeper&&duo.find(f=>f!==sleeper);
  if(sleeper&&friend&&friend.hp/friend.maxhp<.36){
   this._bondLazyUsed=true;
   friend.shieldT=Math.max(friend.shieldT,2);
   this.vfx.ring(friend.x,friend.y,{r0:9,vr:215,life:.55,color:'#efdbff',width:4});
   this.bondMoment('lazy',en()?'Sleepy cat wakes to help!':'慵懒猫为伙伴惊醒守护！');
  }
 }
 // A well-fed foodie occasionally contributes a burst of energy to the pair.
 if(!this._bondFoodUsed&&this.t>7){
  const foodie=duo.find(f=>f.cat.personality==='glutton'&&(f.cat.hunger||0)>=70);
  if(foodie){
   this._bondFoodUsed=true;
   this.duoCharge=Math.min(100,this.duoCharge+12);
   this.vfx.text(foodie.x,foodie.y-42,en()?'SNACK POWER!':'吃饱了，有力气！','#ffe5aa',14);
   this.bondMoment('feast');
  }
 }
};
const originalUpdate=P.update;
P.update=function(dt){
 const result=originalUpdate.call(this,dt);
 if(!this.done){
  // The real game resumes as the full-screen painting dissolves. Keep
  // a separately clocked elemental payoff alive AFTER the cut-in clears.
  const c=this.duoCinematic;
  if(c&&!c._afterglowStarted&&c.max-c.t>=(c.strikeAt??3)){
   c._afterglowStarted=true;
   this._duoRelease={age:0,max:1.1,x:c.x,y:c.y,
     elements:c.elements,first:c.first,second:c.second,tier:c.tier||this.duo?.tier||1,
     sounded:false,echoed:false};
   for(const foe of this.liveEnemies()){
    this.vfx.ring(foe.x,foe.y,{r0:12,vr:265,life:.62,color:c.first,width:4});
    this.vfx.slash(foe.x,foe.y,.42,c.second,88,1.06);
   }
  }
  const release=this._duoRelease;
  if(release){
   release.age+=Math.max(0,dt);
   if(!release.sounded&&release.age>=.20){
    release.sounded=true;
    if(!window.MorrowwishAudio?.duoSignature?.(release.elements,release.tier,'release'))
      window.MorrowwishAudio?.effect?.('combat_duo_impact');
   }
   if(!release.echoed&&release.age>=.33){
    release.echoed=true;
    const foe=this.lockedEnemy()||this.nearestEnemy(release.x,release.y);
    if(foe){release.x=foe.x;release.y=foe.y;}
    this.vfx.burst(release.x,release.y,{
      count:release.tier>=3?18:12,color:release.second,speed:200,life:.58,r:2});
    this.vfx.ring(release.x,release.y,{
      r0:20,vr:260,life:.52,color:release.first,width:4});
   }
   if(release.age>=release.max)this._duoRelease=null;
  }
  this.tickBondStory();
  // Crossed-claw paw-impact: gated to the SAME strike beat as the main deferred
  // payload (the END of the frozen splash), never mid-splash. The whole arena is
  // hard-frozen while the big art plays; once it clears, this extra hit + the main
  // payload land together as ONE connect and animate in the revealed arena.
  // Higher trust unlocks extra real attacks and stagger.
  // Reuse the cinematic captured above for the first impact and its echo.
  if(c&&!c._pawImpact&&c.max-c.t>=(c.strikeAt??.76)){
   c._pawImpact=true;
   const tier=c.tier||this.duo?.tier||1;
   for(const foe of this.liveEnemies()){
    this.vfx.slash(foe.x,foe.y,-.65,c.first,80,1.1);
    if(tier>=2)this.vfx.slash(foe.x,foe.y,.65,c.second,82,1.1);
    if(tier>=3){foe.staggerT=Math.max(foe.staggerT||0,1.3);
      this.vfx.ring(foe.x,foe.y,{r0:9,vr:330,life:.5,color:'#ffe5af',width:5});}
    const extra=foe.maxhp*(tier===1?.025:tier===2?.045:.065);
    this.hurtEnemy(foe,extra,foe.x,foe.y,true,true);
   }
   this.hitstop=Math.max(this.hitstop,.07);
   window.arcadeMetric?.('bond_duo_paw_impact',{tier});
  }
 }
 return result;
};
const originalCast=P.castDuo;
P.castDuo=function(){
 const ok=originalCast.call(this);
 if(ok&&this.duoCinematic){
  // Live combat MUST use the owner-approved complete 63-frame original
  // two-cat watercolor paintings, also used in the canonical V13 trailer.
  // This override must remain aligned with the cast in battle.js.
  this.duoCinematic.originalArt=true;
  this.duoCinematic.tier=this.duo?.tier||1;
  this.duoCinematic.variant=this.duoCinematic.tier>=3?'finale':
   this.duoCinematic.tier>=2?'cross':'pounce';
  this._duoRelease=null;
  // Preserve the whole entrance/exit and the in-arena audio tail instead
  // of restoring full-volume background music before the impact arrives.
  window.MorrowwishMusic?.duckFor?.(3800);
  // Earn the first-strike memory only by actually casting a charged duo move.
  if(this.duo?.a&&this.duo?.b&&window.CatRelations?.remember){
    const memory=CatRelations.remember(this.duo.a,this.duo.b,'duo-strike');
    if(memory.ok)this.game?.toast?.(en()?'✨ Duo memory unlocked: First Twin Strike':
      '✨ 解锁双猫回忆：第一次并肩出击');
  }
 }
 return ok;
};
const originalCutin=P.drawCatCutin;
P.drawCatCutin=function(ctx,W,H){
 if(this.duoCinematic?.t>0&&window.CatBondDuoHero?.draw){
  window.CatBondDuoHero.draw(ctx,W,H,this.duoCinematic,uid=>
    this.team.find(f=>f.cat.uid===uid)?.cat||
    this._benchFighters?.get(uid)?.cat||this.reserve.find(c=>c.uid===uid));
 }else originalCutin.call(this,ctx,W,H);
 if(this._duoRelease&&window.CatBondDuoReleaseVFX)
  window.CatBondDuoReleaseVFX.draw(ctx,W,H,this._duoRelease);
};
})();
