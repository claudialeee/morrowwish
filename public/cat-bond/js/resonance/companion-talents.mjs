// Regional battle talents use live combat state and existing combat effects.
export const companionTalents=Object.freeze({
 qilan:{name:["顺风领航","Tailwind"],description:["战斗开始后获得12点大招能量","Gain 12 ultimate charge shortly after battle starts"],notice:["栖蓝 · 顺风领航，大招能量 +12","Skye · Tailwind, ultimate charge +12"],color:"#8bd4ee"},
 yahe:{name:["月叶急救","Moonleaf remedy"],description:["队友生命降至75%时，治疗最虚弱的队友20%最大生命","When an ally falls to 75% HP, heal the weakest ally for 20% max HP"],notice:["芽禾 · 月叶急救，治疗队友","Fern · Moonleaf remedy, ally healed"],color:"#9adca0"},
 xiaomao:{name:["暖光护盾","Lantern ward"],description:["地区敌人预警攻击时，为全队提供3.5秒护盾","When a regional attack is telegraphed, shield active allies for 3.5 seconds"],notice:["小栗 · 暖光护盾，保护全队","Pip · Lantern ward, party shielded"],color:"#f5cf85"}
});
export function talentRank(cat){const level=Number(cat?.level)||1;return level>=7?3:level>=4?2:1;}
export function activateCompanionTalents(b){
 if(!b.regionalCombat||b.done||b.captureSeq||b.duoCinematic||b.ultCinematic)return [];
 const active=b.team.filter(f=>f.alive&&f.hp>0),used=b.companionTalentsUsed||(b.companionTalentsUsed=new Set()),fired=[];
 for(const actor of active){
  const id=actor.cat?.storyActor,skill=companionTalents[id];if(!skill||used.has(id))continue;
  let targets=[];const rank=talentRank(actor.cat),charge=12+4*(rank-1);
  if(id==="qilan"&&b.t>=2&&b.ult<=100-charge){b.gainUlt(charge);targets=[actor];}
  else if(id==="yahe"){const weak=active.filter(f=>f.maxhp>0&&f.hp/f.maxhp<=.75).sort((a,c)=>a.hp/a.maxhp-c.hp/c.maxhp)[0];if(weak){b.healUnit(weak,weak.maxhp*(.20+.04*(rank-1)));targets=[weak];}}
  else if(id==="xiaomao"&&b.regionalCombat.cast&&active.some(f=>(f.shieldT||0)<1)){for(const f of active)f.shieldT=Math.max(f.shieldT||0,3.5+.75*(rank-1));targets=active;}
  if(!targets.length)continue;used.add(id);fired.push(id);
  for(const f of targets)b.vfx?.ring?.(f.x,f.y,{r0:12,vr:130,life:.65,color:skill.color,width:4});
  const suffix=rank>1?{zh:" · 专长 "+rank+" 阶",en:" · Talent rank "+rank}:{zh:"",en:""};const notice=id==="qilan"?["栖蓝 · 顺风领航，大招能量 +"+charge,"Skye · Tailwind, ultimate charge +"+charge]:skill.notice;b.game?.toast?.({zh:notice[0]+suffix.zh,en:notice[1]+suffix.en});
 }
 return fired;
}
