import { campaign } from "./campaign.mjs";
// Actual walkable region mechanics. Story progression is never stored here.
export const layouts={
 harbor:{name:["霁潮港","Misttide Harbor"],paths:[[.1,.86],[.23,.71],[.47,.71],[.47,.44],[.74,.44],[.88,.22]],features:{"explore:tide-logbook":[.23,.71,"潮洞日志","Tide cave logbook"],"puzzle:beam-mirrors":[.74,.44,"灯塔反射镜","Lighthouse mirrors"],"rescue:storm-boat":[.47,.71,"遇险小船","Storm boat"],"repair:harbor":[.88,.22,"灯塔圣所","Lighthouse sanctuary"],"melody:harbor":[.88,.22,"归潮调","Returning Tides"]}},
 forest:{name:["眠根林","Rootsleep Forest"],paths:[[.1,.86],[.29,.73],[.29,.4],[.53,.36],[.75,.61],[.88,.23]],features:{"explore:scent-trail":[.29,.4,"气味踪迹","Scent trail"],"puzzle:paired-water-gates":[.75,.61,"双猫水闸","Paired water gates"],"repair:forest":[.88,.23,"古根圣所","Ancient-root sanctuary"],"melody:forest":[.88,.23,"相枝调","Living Roots"]}},
 forge:{name:["赤炉环城","Emberforge City"],paths:[[.1,.86],[.35,.76],[.35,.47],[.65,.47],[.65,.23],[.88,.23]],features:{"puzzle:safety-blueprint":[.35,.47,"安全图纸","Safety blueprint"],"puzzle:heat-pressure":[.65,.47,"炉心控制台","Furnace controls"],"repair:forge":[.88,.23,"炉心圣所","Hearth sanctuary"],"melody:forge":[.88,.23,"承火调","Song of Ember"],"battle:forge-guardian":[.65,.23,"守炉者","Forge guardian"]}},
 sky:{name:["云脊群岛","Skyspine Isles"],paths:[[.1,.86],[.23,.66],[.47,.66],[.59,.42],[.78,.42],[.88,.19]],features:{"explore:flight-recorder":[.47,.66,"飞行记录仪","Flight recorder"],"puzzle:joint-flight":[.59,.42,"双猫滑翔台","Joint gliding platform"],"repair:sky":[.88,.19,"风翼圣所","Windwing sanctuary"],"melody:sky":[.88,.19,"逐风调","Open Sky"]}},
 library:{name:["月镜书库","Moonmirror Library"],paths:[[.1,.86],[.22,.68],[.48,.68],[.48,.42],[.76,.42],[.88,.2]],features:{"puzzle:mirror-records":[.48,.68,"镜面档案","Mirror records"],"explore:routing-record":[.76,.42,"路由记录","Routing record"],"repair:library":[.88,.2,"月镜圣所","Moonmirror sanctuary"],"melody:library":[.88,.2,"照影调","Reflections"]}},
 starfall:{name:["星坠原","Starfall Expanse"],paths:[[.1,.86],[.31,.72],[.41,.46],[.66,.59],[.77,.35],[.88,.2]],features:{"puzzle:star-map":[.41,.46,"星图仪","Star chart"],"explore:catastrophe-record":[.31,.72,"灾变记录","Catastrophe record"],"puzzle:distributed-routing":[.77,.35,"分布式观星仪","Distributed observatory"],"repair:starfall":[.88,.2,"星原圣所","Starfall sanctuary"],"melody:starfall":[.88,.2,"续星调","Beyond Stars"]}}
};
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const segment=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return {p:[a[0]+t*dx,a[1]+t*dy],t};};
const closest=(path,p)=>path.slice(1).map((b,i)=>({i,...segment(p,path[i],b)})).sort((a,b)=>distance(a.p,p)-distance(b.p,p))[0];
const stages=["sendA","receiveB","sendB","receiveA"];
export const puzzleSpecs={
 "puzzle:beam-mirrors":{type:"mirrors",initial:[0,1,0],goal:[2,3,1],mod:4},
 "puzzle:paired-water-gates":{type:"water",initial:[0,0,0],goal:[1,1,1],mod:2},
 "puzzle:safety-blueprint":{type:"blueprint",initial:[],goal:[2,0,1]},
 "puzzle:heat-pressure":{type:"heat",initial:[35,20],goal:[55,25]},
 "puzzle:joint-flight":{type:"flight",initial:[0,0],goal:[3,0],wind:[1,-1,1]},
 "puzzle:mirror-records":{type:"memory",initial:[],goal:[1,2,0]},
 "puzzle:star-map":{type:"stars",initial:[0,0,0],goal:[3,1,2],mod:4},
 "puzzle:distributed-routing":{type:"routing",initial:[0,0,0],goal:[1,1,1],mod:2},
 "rescue:storm-boat":{type:"rescue",initial:[],goal:[0,2,1]},
 "repair:harbor":{type:"mirrors",initial:[0,0,2],goal:[1,2,3],mod:4},
 "repair:forest":{type:"water",initial:[0,1,0],goal:[1,0,1],mod:2},
 "repair:forge":{type:"heat",initial:[40,15],goal:[60,30]},
 "repair:sky":{type:"flight",initial:[0,0],goal:[3,0],wind:[-1,1,-1]},
 "repair:library":{type:"memory",initial:[],goal:[2,1,0]},
 "repair:starfall":{type:"stars",initial:[1,0,0],goal:[2,3,1],mod:4},
};
const melodyGoals={harbor:[0,2,1],forest:[1,0,2],forge:[2,1,0],sky:[1,2,0],library:[2,0,1],starfall:[0,1,2]};
export function createPuzzle(op){
 const spec=puzzleSpecs[op]||(op.startsWith("melody:")&&melodyGoals[op.split(":")[1]]?{type:"melody",initial:[],goal:melodyGoals[op.split(":")[1]],response:[]}:null);
 return spec&&{...spec,operation:op,values:[...spec.initial],response:[],mistakes:0,solved:false};
}
export function movePuzzle(p,i){
 if(!p||p.solved||!Number.isInteger(i)||i<0||i>2)return false;
 if(["mirrors","stars","water","routing"].includes(p.type)){p.values[i]=(p.values[i]+1)%p.mod;}
 else if(["blueprint","memory","rescue","melody"].includes(p.type)){
  if(i===p.goal[p.values.length])p.values.push(i);else{p.values=[];p.response=[];p.mistakes++;}
  if(p.type==="melody")p.response=p.values.map((n,j)=>({actor:p.participants?.[j%2],reply:(n+1)%3}));
 }
 else if(p.type==="heat"){if(i===0){p.values[0]+=5;p.values[1]+=5;}else if(i===1)p.values[1]-=5;else p.values=[...p.initial];if(p.values[0]>70||p.values[1]>45||p.values[1]<0){p.values=[...p.initial];p.mistakes++;}}
 else if(p.type==="flight"){const wind=p.wind[p.values[0]];p.values[1]+=wind+(i-1);p.values[0]++;if(Math.abs(p.values[1])>1||(p.values[0]===3&&p.values[1]!==0)){p.values=[...p.initial];p.mistakes++;}}
 else return false;
 p.solved=p.values.length===p.goal.length&&p.values.every((n,j)=>n===p.goal[j]);return p.solved;
}
export function exchangeOptions(bridge,region,links){
 const v=bridge.view();
 return links.flatMap(([a,b,forward,back])=>{
  const sequence=v.links[a+":"+b]||[],i=sequence.length,actor=[a,b,b,a][i];
  const chapterEnd=a==="starfall"?"starfall:F-02":campaign.scenes.filter(s=>s.chapter===a).at(-1)?.id;
  // Engine checks exact chapter gates; also exclude links before the source's melody.
  if(i>=4||actor!==region||!v.regions.includes(a)||!v.regions.includes(b)||!v.completed.includes(chapterEnd))return [];
  return [{a,b,stage:stages[i],action:i<2?forward:back,actor,from:i%2===0?0:1,to:i%2===0?1:0}];
 });
}
export function createExplorer(bridge,region){
 const layout=layouts[region];if(!layout)throw Error("Unknown region");
 const saved=bridge.world().positions[region],path=layout.paths;let pos=saved?[saved.x,saved.y]:[...path[0]],dest=null,puzzle=null,active=null,travel=[],error="",cargo=bridge.world().cargo?.actor===region?bridge.world().cargo:null,invited=new Set();
 pos=closest(path,pos).p;
 function walk(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||puzzle)return false;
  const target=closest(path,[x,y]),start=closest(path,pos);
  travel=[];if(target.i>start.i){for(let i=start.i+1;i<=target.i;i++)travel.push(path[i]);}else if(target.i<start.i){for(let i=start.i;i>target.i;i--)travel.push(path[i]);}travel.push(target.p);dest=travel.shift();return true;
 }
 function tick(dt){
  if(!dest)return;let remaining=Math.max(0,Math.min(.1,dt))*.48;
  while(dest&&remaining>0){const d=distance(pos,dest);if(d<=remaining){pos=[...dest];remaining-=d;dest=travel.shift()||null;if(!dest){const r=bridge.position(region,...pos);error=r.ok?"":r.reason;}}else{pos=[pos[0]+(dest[0]-pos[0])*remaining/d,pos[1]+(dest[1]-pos[1])*remaining/d];remaining=0;}}
 }
 function near(p){return !dest&&distance(pos,p)<.072;}
 function interact(op){
  const v=bridge.view(),f=layout.features[op];if(!f||v.current?.chapter!==region||!v.objective.includes(op)||!near(f))return {ok:false,reason:"walk-to-objective"};
  if(op.startsWith("battle:"))return {ok:false,reason:"battle-host-required"};
  if(op.startsWith("melody:")&&!localNpcs().every(n=>invited.has(n.id)))return {ok:false,reason:"invite-local-cats"};
  active={sceneId:v.current.id,operation:op,region};puzzle=createPuzzle(op);if(puzzle?.type==="melody")puzzle.participants=[...invited];
  if(puzzle)return {ok:true,puzzle:true};
  if(!op.startsWith("explore:"))return {ok:false,reason:"unimplemented"};
  return complete();
 }
 function complete(){
  if(!active)return {ok:false,reason:"no-interaction"};const f=layout.features[active.operation];
  if(!near(f)||(puzzle&&!puzzle.solved))return {ok:false,reason:"incomplete-physical-action"};
  const result=bridge.recordWorld(active.sceneId,active.operation,{...active,verified:true,participants:puzzle?.participants,responses:puzzle?.response});
  if(result.ok){active=null;puzzle=null;}return result;
 }
 function operate(i){if(!puzzle)return {ok:false,reason:"no-puzzle"};if(puzzle.solved)return complete();return movePuzzle(puzzle,i)?complete():{ok:true,pending:true};}
 function cargoPoints(){return [path[1],path[path.length-2]];}
 function startCargo(option){
  if(cargo||puzzle||!option||option.actor!==region)return {ok:false,reason:"cargo-busy"};
  const pts=cargoPoints();if(!near(pts[option.from]))return {ok:false,reason:"walk-to-cargo"};
  const result=bridge.pickupCargo(option);if(result.ok)cargo={...option,pickedUp:true};return result;
 }
 function deliverCargo(){
  if(!cargo||!near(cargoPoints()[cargo.to]))return {ok:false,reason:"walk-to-recipient"};
  const result=bridge.exchange(cargo.a,cargo.b,{region,stage:cargo.stage,action:cargo.action,verified:true});
  if(result.ok)cargo=null;return result;
 }
 function localNpcs(){return Object.values(campaign.cast).filter(n=>n.region===region).map((n,i)=>({...n,point:path[Math.min(i+1,path.length-2)]}));}
 function inviteNpc(id){const n=localNpcs().find(n=>n.id===id),v=bridge.view();if(!n||!near(n.point)||!v.objective.includes("melody:"+region))return {ok:false,reason:"npc-not-available"};invited.add(id);return {ok:true};}
 function rewardPoints(){return [{id:"cache-1",point:[(path[0][0]+path[1][0])/2,(path[0][1]+path[1][1])/2]},{id:"cache-2",point:[(path[path.length-3][0]+path[path.length-2][0])/2,(path[path.length-3][1]+path[path.length-2][1])/2]}];}
 function pickup(id){const p=rewardPoints().find(x=>x.id===id);if(!p||!near(p.point))return {ok:false,reason:"walk-to-cache"};return bridge.pickupReward(region,id);}
 function cancel(){puzzle=null;active=null;}
 return {walk,tick,interact,operate,cancel,complete,startCargo,deliverCargo,cargoPoints,near,localNpcs,inviteNpc,rewardPoints,pickup,layout,get invited(){return [...invited]},get position(){return [...pos]},get moving(){return !!dest},get puzzle(){return puzzle?JSON.parse(JSON.stringify(puzzle)):null},get active(){return active?{...active}:null},get cargo(){return cargo?{...cargo}:null},get error(){return error}};
}
