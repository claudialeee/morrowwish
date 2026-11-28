// Keepsakes are persistent discovery rewards, not consumables or new save fields.
// Each regional effect is bounded, optional and shared by automatic/manual combat.
export const regionalKeepsakes=Object.freeze({
 harbor:{label:["潮汐贝壳 · 潮声庇护","Tidepool shell · Tidal ward"],description:["风铃镇战斗：首次危险预警时为上阵伙伴提供2.5秒护盾。","Windchime combat: shield active allies for 2.5 seconds at the first warning."]},
 forest:{label:["香草茶袋 · 林间茶香","Herbal tea pouch · Forest remedy"],description:["眠根林战斗：首次有伙伴生命低于70%时，治疗其12%最大生命。","Rootsleep combat: heal the first ally below 70% HP for 12% max HP."]},
 forge:{label:["歪耳纸灯 · 暖光延伸","Crooked-ear lantern · Wider light"],description:["千灯城剪影兽战斗：灯光有效半径扩大15%。","Lantern City shadow-beast battle: the lit arena radius increases by 15%."]},
 sky:{label:["云邮信封 · 稳定航向","Cloud-post envelope · Steady flight"],description:["云脊战斗：首轮风切预警免疫风力位移，仍需躲避伤害。","Skyspine combat: resist forced movement during the first gale warning; damage must still be avoided."]},
 library:{label:["晨昏故事页 · 真迹辨识","Daybreak page · Original text"],description:["月镜战斗：首次镜影反击不复制玩家技能，也不会获得反射。","Moonmirror combat: the first mirror counter cannot copy your skill or gain reflection."]},
 starfall:{label:["小猫座星带 · 星光回馈","Kitten constellation · Starlight"],description:["星坠原战斗：首次成功避开星轨预警时，大招能量+15。","Starfall combat: gain 15 ultimate charge after the first successfully evaded orbital warning."]}
});
export function hasRegionalKeepsake(root,region){return !!regionalKeepsakes[region]&&root?.resonanceExploration?.interactions?.["side-adventure:"+region]===true;}
function eligible(b,root){const r=b?.regionalCombat;return !!r&&!b.done&&!b.captureSeq&&!b.postgameRuins&&b.libraryEncounter?.bossId!=="mastery"&&hasRegionalKeepsake(root,r.region);}
export function forgeLightScale(b,root){return eligible(b,root)&&b.regionalCombat.region==="forge"&&b.regionalCombat.shadowLight?1.15:1;}
export function applyRegionalKeepsake(b,root,event){
 if(!eligible(b,root))return false;
 const r=b.regionalCombat;if(r.keepsakeUsed)return false;
 const active=(b.team||[]).filter(f=>f.alive&&f.hp>0&&f.maxhp>0);if(!active.length)return false;
 let targets=active;
 switch(r.region){
 case "harbor":if(event!=="warning")return false;for(const f of active)f.shieldT=Math.max(f.shieldT||0,2.5);break;
 case "forest":{if(event!=="tick")return false;const weak=active.filter(f=>f.hp/f.maxhp<.70).sort((a,c)=>a.hp/a.maxhp-c.hp/c.maxhp)[0];if(!weak)return false;b.healUnit(weak,weak.maxhp*.12);targets=[weak];break;}
 case "sky":if(event!=="warning")return false;r.keepsakeGaleCast=r.cast;break;
 case "library":if(event!=="mirror-counter")return false;for(const e of b.liveEnemies())e.reflectT=0;break;
 case "starfall":if(event!=="evade")return false;b.gainUlt(15);break;
 default:return false;
 }
 r.keepsakeUsed=true;const info=regionalKeepsakes[r.region];for(const f of targets)b.vfx?.ring?.(f.x,f.y,{r0:14,vr:130,life:.6,color:r.kit?.color||"#f6d38b",width:3});
 b.game?.toast?.({zh:info.label[0],en:info.label[1]});return true;
}
