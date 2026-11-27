// Regional boss metadata: stable operation IDs, localized labels, map points and rewards.
export const REGIONAL_BOSSES=Object.freeze({
 forest:{region:"forest",point:[.77,.44],optional:true,name:["森林巨兽","Rootbound Guardian"],clue:["森林深处还有根影在活动。避开根须，再反击。","Roots still stir deep in the woods. Dodge the roots, then strike."],reward:[65,4,45],hp:1.08},
 sky:{region:"sky",point:[.67,.50],optional:true,name:["云海幻兽","Gale Wyrm"],clue:["云海有异常风声。留意侧风与预警光带。","A strange wind stirs above the clouds. Watch the crosswind and marked lanes."],reward:[75,4,50],hp:1.14},
 library:{region:"library",point:[.76,.40],scene:"library:M-02",op:"battle:mirror-guardian",name:["镜影守卫","Mirror Guardian"],clue:["它会复制投射技能的属性与弹道。改变招式，避开镜影反击。","It copies projectile skill elements and trajectories. Change attacks and dodge the mirrored strike."],reward:[55,3,38],hp:1.02},
 starfall:{region:"starfall",point:[.68,.55],scene:"starfall:F-04",op:"battle:star-guardian",name:["星辰守卫","Star Guardian"],clue:["前半场使用光系，生命值降至一半时转为暗系。暗系克制光相，光系克制暗相。避开星轨标记。","It starts in light and shifts to dark below half health. Dark counters light, and light counters dark. Dodge the marked orbits."],reward:[80,5,55],hp:1.16},
 mastery:{region:"starfall",point:[.41,.58],optional:true,ending:true,name:["星轨大师试炼","Orbital Master Trial"],clue:["终局试炼：光相封锁纵向星轨，暗相封锁横向星轨。进入未标记的安全带，抓住破绽反击。","Postgame trial: light seals vertical lanes; dark seals horizontal lanes. Move into the unmarked safe lane, then counter."],reward:[150,8,90],hp:1.65}
});
// Authored chapter pacing. HP scales with active party health; later chapters
// give their signature attacks time to play, without an invulnerable timer gate.
// Hardcore adds threat via the core difficulty model and stronger hazard damage.
export const GUARDIAN_BALANCE=Object.freeze({
 harbor:{hp:1.55,attack:.85,first:1.6,period:5.8,shot:3.5,hazard:.10},
 forest:{hp:2.25,attack:1,first:1.6,period:5.8,shot:3.3,hazard:.12},
 forge:{hp:1.10,attack:1,first:1.6,period:6.5,shot:3.5,hazard:.14},
 sky:{hp:2.20,attack:1,first:1.6,period:5.5,shot:2.7,hazard:.12},
 library:{hp:2.25,attack:1,first:1.6,period:6.2,shot:3.3,hazard:.13},
 starfall:{hp:2.65,attack:1.08,first:1.6,period:5.8,shot:3.1,hazard:.14},
 mastery:{hp:3.15,attack:1.50,first:1.4,period:3.8,shot:2.1,hazard:.23}
});
export function guardianProfile(id,field,difficulty){
 const p=GUARDIAN_BALANCE[id];if(!p||!field.length)return null;
 const active=field.slice(0,2),hardcore=difficulty==="hardcore";
 // A lone traveler should not face a two-cat HP pool. Above the chapter
 // level, only part of level growth and 35% of actual health enter boss HP.
 const sum=active.reduce((n,f)=>n+f.maxhp,0);
 const averageLevel=active.reduce((n,f)=>n+(f.cat?.level||1),0)/active.length;
 const chapterLevel={harbor:1,forest:3,forge:3,sky:4,library:5,starfall:6,mastery:10}[id]||1;
 const scaledLevel=averageLevel<=chapterLevel?averageLevel:chapterLevel+(averageLevel-chapterLevel)*.55;
 const reference=(130+10*(scaledLevel-1))*active.length;
 const base=reference*.65+sum*.35;
 // Solo attacks lack the two-cat reaction and focus-fire synergy; scale for
 // the actual available damage rather than simply halving a paired HP pool.
 const solo=active.length===1?({harbor:.62,forest:.55,forge:.85,sky:.70,library:.78,starfall:.72,mastery:.78}[id]):1;
 return {...p,hp:Math.max(65,Math.round(base*p.hp*solo*(hardcore?1.12:1))),hazard:p.hazard*(hardcore?1.18:1),hardcore};
}
// Stable encounter archetypes, not additional collectible cats.
export const bossTemplates=Object.freeze({harbor:"shell",forest:"clover",forge:"cinder",sky:"fizz",library:"button",starfall:"sunlace",mastery:"aurora"});
export function regionalBossLevel(id,fighters){const active=fighters.slice(0,2);const mean=active.reduce((sum,c)=>sum+(Number(c.level)||1),0)/Math.max(1,active.length);const floor={harbor:1,forest:3,forge:3,sky:4,library:5,starfall:6,mastery:10}[id]||1;return id==="mastery"?Math.max(floor,Math.round(mean<=floor?mean+2:floor+2+(mean-floor)*.5)):Math.max(floor,Math.round(mean*.5+floor*.5));}
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
