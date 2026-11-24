// Distinct, deterministic regional interaction rules. No progress on a failed attempt.
(function(root){const api=(function build(){
 "use strict";
 const p=(zh,en)=>({zh,en});
 const definitions={
 harbor:{kind:"optics",title:p("潮汐与灯塔","Tides and lighthouse"),steps:["tide-cave","logbook","reflect-beam","rescue-navigator","guide-beacon"],hint:p("观察潮线，旋转三面反光镜，让光束连通救援船。","Read the tide marks and rotate three mirrors to connect the beacon to the rescue boat."),initial:[0,2,3],target:[1,3,2]},
 forest:{kind:"flow",title:p("根系水道","Root waterways"),steps:["canopy","scent-trail","root-tunnel","paired-traversal","water-routing"],hint:p("调节三个水闸，使地表与地下同时得到足量水源。","Adjust the three gates to supply both canopy and roots."),initial:[0,0,0],target:[2,1,2]},
 forge:{kind:"heat",title:p("炉心校准","Furnace calibration"),steps:["collect-parts","temperature","blueprint","rhythm-forge","assemble","furnace-test"],hint:p("用加热、冷却与泄压将温度和压力送入安全区，再完成炉心测试。","Heat, cool and vent to bring temperature and pressure into the safe range before testing."),initial:[20,15],target:[55,35]},
 sky:{kind:"wind",title:p("风脊航线","Windspine route"),steps:["read-wind","glide","flight-recorder","joint-flight","courier-delivery"],hint:p("观察风向与航线高度，借助上升气流穿过三道航标。","Read wind and altitude; use updrafts to reach three waypoints."),initial:[0,2],target:[3,2]},
 library:{kind:"memory",title:p("镜中档案","Mirror archive"),steps:["mirror-navigation","reconstruct-record","verify-memory"],hint:p("按照镜中倒置的记录重组档案，拒绝时间与证词不一致的复制品。","Reconstruct the reversed record and reject copies with conflicting times and testimony."),initial:[],target:[2,0,1]},
 starfall:{kind:"stars",title:p("观星仪","Observatory"),steps:["align-stars","shift-ruins","reject-illusion","observatory"],hint:p("转动三环星盘，使刻度与观测记录一致，再开启观星仪。","Rotate three star rings to match the observation record and open the observatory."),initial:[0,1,2],target:[3,0,1]}
 };
 function definition(region,action){
  const d=definitions[region];if(!d||!d.steps.includes(action))return null;
  const i=d.steps.indexOf(action);
  const target=d.kind==="optics"||d.kind==="stars"?d.target.map((n,j)=>(n+i+j)%4):d.kind==="flow"?[1+i%2,1,2-i%2]:d.kind==="memory"?[0,1,2].map(n=>(n+i)%3).reverse():d.kind==="heat"?[50+5*(i%3),30+5*(i%2)]:[3,2];
  return {...d,action,target,initial:d.initial.slice(),winds:[1,-1,0].map((n,j)=>[1,-1,0][(i+j)%3])};
 }
 function create(region,action){const d=definition(region,action);return d?{region,action,values:d.initial.slice(),moves:0,solved:false,failed:false}:null;}
 function controls(s){const d=definition(s.region,s.action);if(!d)return [];
  if(d.kind==="heat")return ["heat","cool","vent","seal","test"];
  if(d.kind==="wind")return ["climb","hold","descend","reset"];
  if(d.kind==="memory")return ["0","1","2","reset","test"];
  return ["0","1","2","reset","test"];
 }
 function apply(s,input){const d=definition(s.region,s.action);if(!d||s.solved||!controls(s).includes(input))return false;
  const v=s.values;s.moves++;
  if(input==="reset"){s.values=d.initial.slice();s.failed=false;return true;}
  if(d.kind==="heat"){
   if(input==="heat"){v[0]+=5;v[1]+=5;}else if(input==="cool"){v[0]-=5;v[1]-=5;}else if(input==="vent")v[1]-=5;else if(input==="seal")v[1]+=5;
   if(v[0]>85||v[0]<0||v[1]>75||v[1]<0){s.values=d.initial.slice();s.failed=true;return true;}
   if(input==="test"){s.solved=v.every((n,i)=>Math.abs(n-d.target[i])<=5);s.failed=!s.solved;}
  }else if(d.kind==="wind"){
   const i=v[0];if(i>=3)return false;
   const alt=v[1]+d.winds[i]+({climb:1,hold:0,descend:-1}[input]);
   if(alt!==2){s.values=d.initial.slice();s.failed=true;}else{v[0]++;v[1]=alt;s.failed=false;s.solved=v[0]===3;}
  }else if(d.kind==="memory"){
   if(input==="test"){s.solved=v.length===3&&v.every((n,i)=>n===d.target[i]);s.failed=!s.solved;if(!s.solved)s.values=[];}
   else if(v.length<3&&!v.includes(Number(input)))v.push(Number(input));else return false;
  }else{
   if(input==="test"){s.solved=v.every((n,i)=>n===d.target[i]);s.failed=!s.solved;}
   else {const i=Number(input);v[i]=(v[i]+1)%(d.kind==="flow"?3:4);s.failed=false;}
  }
  return true;
 }
 // Call only after the scene controller has reached the named physical activity.
 function complete(session,world){return !!session?.solved&&world.record(session.action);}
 return {definitions,definition,create,controls,apply,complete};
})();if(typeof module==="object"&&module.exports)module.exports=api;else root.CatBondResonancePuzzles=api;})(typeof window!=="undefined"?window:globalThis);
