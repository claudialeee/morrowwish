// Actual walkable region mechanics. Story progression is never stored here.
export const layouts={
 harbor:{name:["霁潮港","Misttide Harbor"],paths:[[.1,.86],[.23,.71],[.47,.71],[.47,.44],[.74,.44],[.88,.22]],features:{"explore:tide-logbook":[.23,.71,"潮洞日志","Tide cave logbook"],"puzzle:beam-mirrors":[.74,.44,"灯塔反射镜","Lighthouse mirrors"],"rescue:storm-boat":[.47,.71,"遇险小船","Storm boat"],"repair:harbor":[.88,.22,"灯塔圣所","Lighthouse sanctuary"],"melody:harbor":[.88,.22,"归潮调","Returning Tides"]}},
 forest:{name:["眠根林","Rootsleep Forest"],paths:[[.1,.86],[.29,.73],[.29,.4],[.53,.36],[.75,.61],[.88,.23]],features:{"explore:scent-trail":[.29,.4,"气味踪迹","Scent trail"],"puzzle:paired-water-gates":[.75,.61,"双猫水闸","Paired water gates"],"repair:forest":[.88,.23,"古根圣所","Ancient-root sanctuary"],"melody:forest":[.88,.23,"相枝调","Living Roots"]}},
 forge:{name:["赤炉环城","Emberforge City"],paths:[[.1,.86],[.35,.76],[.35,.47],[.65,.47],[.65,.23],[.88,.23]],features:{"puzzle:safety-blueprint":[.35,.47,"安全图纸","Safety blueprint"],"puzzle:heat-pressure":[.65,.47,"炉心控制台","Furnace controls"],"repair:forge":[.88,.23,"炉心圣所","Hearth sanctuary"],"melody:forge":[.88,.23,"承火调","Song of Ember"],"battle:forge-guardian":[.65,.23,"守炉者","Forge guardian"]}},
 sky:{name:["云脊群岛","Skyspine Isles"],paths:[[.1,.86],[.23,.66],[.47,.66],[.59,.42],[.78,.42],[.88,.19]],features:{"explore:flight-recorder":[.47,.66,"飞行记录仪","Flight recorder"],"puzzle:joint-flight":[.59,.42,"双猫滑翔台","Joint gliding platform"],"repair:sky":[.88,.19,"风翼圣所","Windwing sanctuary"],"melody:sky":[.88,.19,"逐风调","Open Sky"]}},
 library:{name:["月镜书库","Moonmirror Library"],paths:[[.1,.86],[.22,.68],[.48,.68],[.48,.42],[.76,.42],[.88,.2]],features:{"puzzle:mirror-records":[.48,.68,"镜面档案","Mirror records"],"explore:routing-record":[.76,.42,"路由记录","Routing record"],"repair:library":[.88,.2,"月镜圣所","Moonmirror sanctuary"],"melody:library":[.88,.2,"照影调","Reflections"]}},
 starfall:{name:["星坠原","Starfall Expanse"],paths:[[.1,.86],[.31,.72],[.41,.46],[.66,.59],[.77,.35],[.88,.2]],features:{"puzzle:star-map":[.41,.46,"星图仪","Star chart"],"explore:catastrophe-record":[.31,.72,"灾变记录","Catastrophe record"],"puzzle:distributed-routing":[.77,.35,"分布式观星仪","Distributed observatory"],"repair:starfall":[.88,.2,"星原圣所","Starfall sanctuary"],"melody:starfall":[.88,.2,"续星调","Beyond Stars"]}}
};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const segment=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return {p:[a[0]+t*dx,a[1]+t*dy],t};};
const closest=(path,p)=>path.slice(1).map((b,i)=>({i,...segment(p,path[i],b)})).sort((a,b)=>distance(a.p,p)-distance(b.p,p))[0];
const specs={
 "puzzle:beam-mirrors":{type:"rotate",initial:[0,1,0],goal:[2,3,1],mod:4},
 "puzzle:paired-water-gates":{type:"paired",initial:[0,0,0],goal:[1,1,1],mod:2},
 "puzzle:safety-blueprint":{type:"sequence",initial:[],goal:[2,0,1]},
 "puzzle:heat-pressure":{type:"heat",initial:[35,20],goal:[55,25]},
 "puzzle:joint-flight":{type:"flight",initial:[0,0],goal:[3,0],wind:[1,-1,1]},
 "puzzle:mirror-records":{type:"sequence",initial:[],goal:[1,2,0]},
 "puzzle:star-map":{type:"rotate",initial:[0,0,0],goal:[3,1,2],mod:4},
 "puzzle:distributed-routing":{type:"paired",initial:[0,0,0],goal:[1,1,1],mod:2},
 "rescue:storm-boat":{type:"sequence",initial:[],goal:[0,2,1]},
};
function createPuzzle(op){const spec=specs[op]||(/^(repair|melody):/.test(op)?{type:"sequence",initial:[],goal:op.startsWith("repair:")?[2,1,0]:[0,2,1]}:null);return spec&&{...spec,values:[...spec.initial],solved:false};}
export function movePuzzle(p,i){
 if(!p||p.solved)return false;
 if(p.type==="rotate"||p.type==="paired"){if(i<0||i>=p.values.length)return false;p.values[i]=(p.values[i]+1)%p.mod;}
 else if(p.type==="sequence"){if(i===p.goal[p.values.length])p.values.push(i);else p.values=[];}
 else if(p.type==="heat"){if(i===0){p.values[0]+=5;p.values[1]+=5;}else if(i===1)p.values[1]-=5;else if(i===2){p.values=[...p.initial];}else return false;if(p.values[0]>70||p.values[1]>45||p.values[1]<0)p.values=[...p.initial];}
 else if(p.type==="flight"){if(i<0||i>2)return false;const wind=p.wind[p.values[0]];p.values[1]+=wind+(i-1);p.values[0]++;if(Math.abs(p.values[1])>1||(p.values[0]===3&&p.values[1]!==0))p.values=[...p.initial];}
 p.solved=p.values.length===p.goal.length&&p.values.every((n,j)=>n===p.goal[j]);return p.solved;
}
export function createExplorer(bridge,region){
 const layout=layouts[region];if(!layout)throw Error("Unknown region");
 const saved=bridge.world().positions[region],path=layout.paths;let pos=saved?[saved.x,saved.y]:[...path[0]],dest=null,puzzle=null,active=null,travel=[],error="";
 // Project every movement to the authored traversable route. No teleport to objective.
 pos=closest(path,pos).p;
 function walk(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return false;const target=closest(path,[x,y]),start=closest(path,pos);travel=[];if(target.i>start.i){for(let i=start.i+1;i<=target.i;i++)travel.push(path[i]);}else if(target.i<start.i){for(let i=start.i;i>target.i;i--)travel.push(path[i]);}travel.push(target.p);dest=travel.shift();return true;}
 function tick(dt){if(!dest)return;let remaining=Math.max(0,Math.min(.1,dt))*.55;while(dest&&remaining>0){const d=distance(pos,dest);if(d<=remaining){pos=[...dest];remaining-=d;dest=travel.shift()||null;if(!dest){const r=bridge.position(region,...pos);error=r.ok?"":r.reason;}}else{pos=[pos[0]+(dest[0]-pos[0])*remaining/d,pos[1]+(dest[1]-pos[1])*remaining/d];remaining=0;}}}
 function interact(op){const v=bridge.view(),f=layout.features[op];if(!f||v.current?.chapter!==region||!v.objective.includes(op)||dest||distance(pos,f)>.075)return {ok:false,reason:"walk-to-objective"};
 if(op.startsWith("battle:"))return {ok:false,reason:"battle-host-required"};
 active={sceneId:v.current.id,operation:op,region};puzzle=createPuzzle(op);
 if(puzzle)return {ok:true,puzzle:true};
 if(!op.startsWith("explore:"))return {ok:false,reason:"unimplemented"};
 return complete();}
 function complete(){if(!active)return {ok:false,reason:"no-interaction"};const f=layout.features[active.operation];if(dest||distance(pos,f)>.075||(puzzle&&!puzzle.solved))return {ok:false,reason:"incomplete-physical-action"};const result=bridge.recordWorld(active.sceneId,active.operation,{...active,verified:true});if(result.ok){active=null;puzzle=null;}return result;}
 function operate(i){if(!puzzle)return {ok:false,reason:"no-puzzle"};return movePuzzle(puzzle,i)?complete():{ok:true,pending:true};}
 function cancel(){puzzle=null;active=null;}
 return {walk,tick,interact,operate,cancel,complete,layout,get position(){return [...pos]},get moving(){return !!dest},get puzzle(){return puzzle?JSON.parse(JSON.stringify(puzzle)):null},get active(){return active?{...active}:null},get error(){return error}};
}
