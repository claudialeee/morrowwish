// Regional boss metadata: stable operation IDs, localized labels, map points and rewards.
export const REGIONAL_BOSSES=Object.freeze({
 forest:{region:"forest",point:[.77,.44],optional:true,name:["森林巨兽","Rootbound Guardian"],clue:["森林深处还有根影在活动。避开根须，再反击。","Roots still stir deep in the woods. Dodge the roots, then strike."],reward:[65,4,45],hp:1.08},
 sky:{region:"sky",point:[.67,.50],optional:true,name:["云海幻兽","Gale Wyrm"],clue:["云海有异常风声。留意侧风与预警光带。","A strange wind stirs above the clouds. Watch the crosswind and marked lanes."],reward:[75,4,50],hp:1.14},
 library:{region:"library",point:[.76,.40],scene:"library:M-02",op:"battle:mirror-guardian",name:["镜影守卫","Mirror Guardian"],clue:["它会复制投射技能的属性与弹道。改变招式，避开镜影反击。","It copies projectile skill elements and trajectories. Change attacks and dodge the mirrored strike."],reward:[55,3,38],hp:1.02},
 starfall:{region:"starfall",point:[.68,.55],scene:"starfall:F-04",op:"battle:star-guardian",name:["星辰守卫","Star Guardian"],clue:["它会在光与暗之间切换属性。留意星轨，灵活搭配猫咪。","It shifts between light and dark. Watch the orbits and adapt your party."],reward:[80,5,55],hp:1.16},
 mastery:{region:"starfall",point:[.41,.58],optional:true,ending:true,name:["星轨大师试炼","Orbital Master Trial"],clue:["通关后的高难度试炼：星轨更快，守卫更强。","A postgame challenge: faster orbits and a stronger guardian."],reward:[150,8,90],hp:1.65}
});
// Stable encounter archetypes, not additional collectible cats.
export const bossTemplates=Object.freeze({harbor:"shell",forest:"clover",forge:"cinder",sky:"fizz",library:"button",starfall:"sunlace",mastery:"aurora"});
export function regionalBossLevel(id,fighters){const active=fighters.slice(0,2);const mean=active.reduce((sum,c)=>sum+(Number(c.level)||1),0)/Math.max(1,active.length);const floor={harbor:1,forest:3,forge:3,sky:4,library:5,starfall:6,mastery:10}[id]||1;return id==="mastery"?Math.max(floor,Math.round(mean)+2):Math.max(floor,Math.round(mean*.75+floor*.25));}
export const bossKey=id=>"regional-boss:"+id;
export function optionalBossAvailable(id,view,world){
 const d=REGIONAL_BOSSES[id];return !!(d?.optional&&view?.melodies?.includes(d.region)&&(!d.ending||view.ending)&&world?.location===d.region&&!world.cargo);
}
export function atBoss(id,world){
 const d=REGIONAL_BOSSES[id],p=world?.positions?.[d?.region];return !!(d&&p&&Math.hypot(p.x-d.point[0],p.y-d.point[1])<.072);
}
export function bossReward(id,world){
 const d=REGIONAL_BOSSES[id];return d?.optional&&world?.interactions?.[bossKey(id)]?[0,0,0]:(d?.reward||[38,2,28]);
}
