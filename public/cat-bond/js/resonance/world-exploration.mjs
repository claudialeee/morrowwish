import { campaign } from "./campaign.mjs";
import {newNeighborTrial,advanceNeighborTrial,neighborTrialProof} from "./canon22-neighbor-trial.mjs";
import {mirrorProof} from "./canon22-mirror.mjs";
import {newSpatial,spatialInput,spatialProof,tickSpatial,spatialKind,startBridgeWalk,advanceBridgeWalk,animateStarPlatforms} from "./canon22-spatial.mjs?v=bridge-art-audio-20261127";
import {libraryPoints,libraryInvitations,libraryBlocked,libraryPuzzle,advanceLibrary} from "./library-mechanisms.mjs";
import {newSkyFlight,steerSkyFlight,tickSkyFlight,skyFlightProof,skyLaunch,skyLanding,skyPartsReady,skySurvey,skySurveyPath,skySurveyCache,landSkyFlight} from "./sky-flight.mjs";
// Actual walkable region mechanics. Story progression is never stored here.
export const layouts={
 finale:{name:["中央星铃","Star Bell"],paths:[[.5,.88],[.5,.78],[.5,.68],[.5,.58],[.5,.48]],castPoints:{},features:{}},
 harbor:{
  name:["风铃镇","Windchime Town"],
  paths:[[.19,.89],[.12,.80],[.115,.70],[.16,.60],[.235,.56],[.195,.50],[.34,.478],[.50,.467],[.66,.46],[.82,.45],[.912,.475],
   [.887,.538],[.837,.61],[.80,.682],[.802,.742],[.87,.748]],
  castPoints:{jiedeng:[.195,.50],qilan:[.16,.60]},
  features:{
   "puzzle:chime-chase":[.16,.60,"寻回铃纹","Restore the bell patterns"],
   "battle:chime-beast":[.195,.50,"铃舌兽","Belltongue Beast"],
   "repair:harbor":[.131,.341,"古铃圣所","Town bell sanctuary"],
   "melody:harbor":[.131,.341,"归家调","Coming Home"]
  }
 },
 forest:{name:["眠根林","Rootsleep Forest"],paths:[[.095,.90],[.20,.84],[.31,.73],[.35,.64],[.31,.58],[.265,.53],[.25,.49],[.30,.43],[.27,.35],[.29,.31],[.36,.31],[.42,.28],[.44,.36],[.39,.40],[.53,.40],[.56,.47],[.64,.53],[.69,.53],[.77,.44],[.83,.37],[.81,.32],[.83,.27],[.88,.24],[.89,.20]],castPoints:{yahe:[.30,.43],yuchuan:[.64,.53]},features:{"puzzle:moonleaf-crossing":[.30,.43,"拨动月叶 · 根桥","Moonleaf bridge"],"puzzle:moonleaf-loop":[.64,.53,"打破森林回环","Break the forest loop"],"repair:forest":[.89,.20,"古根圣所","Ancient-root sanctuary"],"melody:forest":[.89,.20,"相枝调","Living Roots"]}},
 forge:{name:["千灯城","Lantern City"],castPoints:{jinpo:[.35,.65],xiaomao:[.53,.50]},paths:[[.1,.86],[.35,.76],[.35,.50],[.63,.50],[.74,.40],[.88,.30]],features:{"puzzle:lantern-show":[.35,.76,"帮小栗演一场灯影","Help Pip put on a show"],"puzzle:shadow-bridge":[.35,.50,"寻找三只影子猫","Find three hiding shadow cats"],"repair:forge":[.88,.30,"千灯圣所","Lantern sanctuary"],"melody:forge":[.88,.30,"承火调","Song of Ember"],"battle:shadow-beast":[.74,.40,"剪影兽","Shadow beast"]}},
 sky:{name:["云脊群岛","Skyspine Isles"],castPoints:{lingyu:[.10,.70],yuanfan:[.18,.55]},paths:[[.10,.80],[.10,.70],[.16,.61],[.18,.55],[.41,.51],[.58,.55],[.67,.50],[.72,.43],[.74,.36],[.84,.30],[.89,.24]],features:{"puzzle:sky-pouch":[.10,.70,"借风起飞 · 练习滑翔","Catch the wind · Practice gliding"],"explore:flight-recorder":[.41,.51,"寻找月门 · 云间航线","Find the moon gate · Cloud route"],"puzzle:joint-flight":[.58,.55,"双猫滑翔台","Joint gliding platform"],"repair:sky":[.89,.24,"风翼圣所","Windwing sanctuary"],"melody:sky":[.89,.24,"逐风调","Open Sky"]}},
 library:{name:["月镜书库","Moonmirror Library"],paths:[[.10,.83],[.17,.73],[.22,.60],[.29,.60],[.46,.58],[.51,.48],[.50,.42],[.67,.40],[.76,.40],[.82,.36],[.89,.29]],castPoints:libraryInvitations,features:libraryPoints},
 starfall:{name:["星坠原","Starfall Expanse"],castPoints:{xingya:[.51,.58],lichuan:[.78,.48]},paths:[[.10,.90],[.23,.78],[.34,.68],[.41,.58],[.42,.52],[.51,.58],[.68,.55],[.78,.48],[.78,.40],[.84,.33],[.92,.30]],features:{"puzzle:star-steps":[.34,.68,"踩着星光走","Walk on starlight"],"explore:catastrophe-record":[.78,.40,"天文台 · 完整灾变记录","Observatory · Complete record"],"battle:star-guardian":[.68,.55,"星辰守卫","Star Guardian"],"puzzle:distributed-routing":[.84,.33,"邻铃试音","Test the neighboring bells"],"repair:starfall":[.92,.30,"星原圣所","Starfall sanctuary"],"melody:starfall":[.92,.30,"续星调","Beyond Stars"]}}
};
export const retiredWorldOperations=new Set(["explore:tide-logbook","puzzle:beam-mirrors","rescue:storm-boat","explore:scent-trail","puzzle:paired-water-gates","rescue:steady-channel","explore:water-marks","battle:root-echo","rescue:trapped-cats","puzzle:festival-lantern","puzzle:safety-blueprint","puzzle:heat-pressure","battle:forge-guardian","explore:letter-recipient","explore:sealed-archive","puzzle:mirror-records","puzzle:caravan-route","battle:observatory-echo","puzzle:library-reflections","battle:library-echo","puzzle:echo-navigation","puzzle:star-map","explore:crater-fragment","explore:ruin-fragment"]);
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const segment=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return {p:[a[0]+t*dx,a[1]+t*dy],t};};
const closest=(path,p)=>path.slice(1).map((b,i)=>({i,...segment(p,path[i],b)})).sort((a,b)=>distance(a.p,p)-distance(b.p,p))[0];
const stages=["sendA","receiveB","sendB","receiveA"];
// Canon 2.2: the actual regional challenge precedes restoration; never reopen retired dial puzzles on the required path.
export const canonRestorationPrerequisites=Object.freeze({"repair:harbor":"harbor:H-04","repair:forest":"forest:R-03","repair:forge":"forge:E-03","repair:starfall":"starfall:F-03"});
export const puzzleSpecs={
 "puzzle:distributed-routing":{type:"routing",initial:[0,0,0],goal:[1,1,1],mod:2},
 "repair:harbor":{type:"mirrors",initial:[0,0,2],goal:[1,2,3],mod:4},
 "repair:forest":{type:"water",initial:[0,1,0],goal:[1,0,1],mod:2},
 "repair:forge":{type:"lanternFocus",initial:[0,2,1],goal:[1,0,2],mod:3},
 "repair:library":{type:"memory",initial:[],goal:[2,1,0]},
 "repair:starfall":{type:"stars",initial:[1,0,0],goal:[2,3,1],mod:4},
};
const melodyGoals={harbor:[0,2,1],forest:[1,0,2],forge:[2,1,0],sky:[1,2,0],library:[2,0,1],starfall:[0,1,2]};
export function createPuzzle(op,choice=null,record=null){
 if(retiredWorldOperations.has(op))return null;
 const spatial=newSpatial(op);if(spatial)return {type:"canonSpatial",operation:op,spatial,values:[],goal:[],solved:false};
 const library=libraryPuzzle(op,record);if(library)return library;
 const flight=newSkyFlight(op,choice);if(flight)return {type:"skyFlight",operation:op,flight,solved:false};
 const spec=puzzleSpecs[op]||(op.startsWith("melody:")&&melodyGoals[op.split(":")[1]]?{type:"melody",initial:[],goal:melodyGoals[op.split(":")[1]],response:[]}:null);
 return spec&&{...spec,operation:op,values:[...spec.initial],response:[],mistakes:0,solved:false};
}
export function movePuzzle(p,i){
 if(!p||p.solved||!Number.isInteger(i)||i<0||i>2)return false;
 if(p.type.startsWith("library"))return advanceLibrary(p,i);
 if(p.type==="routing"&&p.operation==="puzzle:distributed-routing"){p.values=[...p.goal];}
 else if(["mirrors","stars","water","routing","lanternFocus"].includes(p.type)){p.values[i]=(p.values[i]+1)%p.mod;}

 else if(p.type==="echo"){if(i===p.goal[p.values.length])p.values.push(i);else{p.values=[];p.mistakes++;}}
 else if(["lantern","blueprint","memory","rescue","melody","tide","scent"].includes(p.type)){
  if(i===p.goal[p.values.length])p.values.push(i);else if(p.type==="rescue"&&p.assist==="qilan"&&!p.assisted){p.assisted=true;p.assistedAt=p.values.length;}else{if(p.type!=="melody"){p.values=[];p.response=[];}p.mistakes++;}
  if(p.type==="melody")p.response=p.values.map((n,j)=>({actor:p.participants?.[j%2],reply:(n+1)%3}));
 }
 else return false;
 p.solved=p.values.length===p.goal.length&&p.values.every((n,j)=>n===p.goal[j]);return p.solved;
}
export function exchangeOptions(bridge,region,links){
 const v=bridge.view(),pending=bridge.world().cargo;
 if(pending)return [];
 return links.flatMap(([a,b,forward,back])=>{
  const sequence=v.links[a+":"+b]||[],i=sequence.length,actor=[a,b,b,a][i];
  const spec=bridge.cargoSpec(a,b);return spec&&actor===region?[spec]:[];
 });
}
export function createExplorer(bridge,region,{deferForestMelody=false,deferHarborMelody=false,deferSkyMelody=false,deferForgeMelody=false,deferLibraryMelody=false,deferStarfallMelody=false,adventureActions=false}={}){
 const layout=layouts[region];if(!layout)throw Error("Unknown region");
 const owner=bridge.slotIdentity(),live=()=>bridge.isSlot(owner)&&bridge.world().location===region;const saved=bridge.world().positions[region],mainPath=layout.paths;let path=region==="sky"&&bridge.surveyStatus()?.remote?skySurveyPath:mainPath;let facing=1,pos=saved?[saved.x,saved.y]:[...path[0]],dest=null,puzzle=null,active=null,travel=[],error="",cargo=bridge.world().cargo?.actor===region?bridge.world().cargo:null,invited=new Set(region==="harbor"?bridge.harborInvited():region==="forest"?bridge.forestInvited():region==="sky"?bridge.skyInvited():region==="forge"?bridge.forgeInvited():region==="library"?bridge.libraryInvited():region==="starfall"?bridge.starfallInvited():[]);
 pos=closest(path,pos).p;
 function walk(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||puzzle||!live())return false;
  if(region==="harbor"&&[[.153,.44],[.131,.341]].some(p=>distance(p,[x,y])<.035)){const targetPoint=[x,y],junction=[.195,.50];const start=closest(path,pos),target=closest(path,junction);travel=[];if(target.i>start.i){for(let i=start.i+1;i<=target.i;i++)travel.push(path[i]);}else if(target.i<start.i){for(let i=start.i;i>target.i;i--)travel.push(path[i]);}travel.push(junction,targetPoint);dest=travel.shift();return true;}
  const target=closest(path,[x,y]),start=closest(path,pos);
  travel=[];if(target.i>start.i){for(let i=start.i+1;i<=target.i;i++)travel.push(path[i]);}else if(target.i<start.i){for(let i=start.i;i>target.i;i--)travel.push(path[i]);}travel.push(target.p);dest=travel.shift();return true;
 }
 function tick(dt,viewZoom=1){
  if(!live()){dest=null;travel=[];return;}if(!dest)return;let remaining=Math.max(0,Math.min(.1,dt))*Math.min(.18,.29/Math.max(1,viewZoom));
  while(dest&&remaining>0){const d=distance(pos,dest);if(Math.abs(dest[0]-pos[0])>.0001)facing=dest[0]>pos[0]?1:-1;if(d<=remaining){pos=[...dest];remaining-=d;dest=travel.shift()||null;if(!dest){const r=bridge.position(region,...pos);error=r.ok?"":r.reason;}}else{pos=[pos[0]+(dest[0]-pos[0])*remaining/d,pos[1]+(dest[1]-pos[1])*remaining/d];remaining=0;}}
 }
 function near(p){return live()&&!dest&&distance(pos,p)<.072;}
 function survey(){return region==="sky"?bridge.surveyStatus():null;}
 function startSurvey(){const s=survey();if(!s||puzzle||!near(s.from))return {ok:false,reason:"walk-to-survey"};if(!s.remote&&cargo)return {ok:false,reason:"cargo-busy"};active={survey:s.operation,token:bridge.capture(),adventureAction:false};puzzle=createPuzzle(s.operation);return {ok:true,puzzle:true};}
 function readyResidents(){const method={harbor:'harborInvited',forest:'forestInvited',forge:'forgeInvited',sky:'skyInvited',library:'libraryInvited',starfall:'starfallInvited'}[region];return [...new Set([...invited,...(bridge[method]?.()||[])])];}
 function interact(op){
  if(retiredWorldOperations.has(op))return {ok:false,reason:"retired-operation"};
  if(survey()?.remote)return {ok:false,reason:"return-from-survey"};
  if(op==="explore:scent-trail"){const step=bridge.scentStep();return step?traceScent(step.index):{ok:false,reason:"walk-to-scent"};}
  const v=bridge.view(),f=layout.features[op];if(!f||v.current?.chapter!==region||!v.objective.includes(op)||!near(region==="sky"&&skyLaunch[op]||f))return {ok:false,reason:"walk-to-objective"};
  if(op==="puzzle:safety-blueprint"&&bridge.forgeStep())return {ok:false,reason:"incomplete-forge-parts"};
  if(op==="explore:tide-logbook"&&bridge.tideStep())return {ok:false,reason:"incomplete-tide-trail"};
  if(["starfall:F-02","starfall:F-04"].includes(v.current.id)&&op!==v.objective[0])return {ok:false,reason:v.current.id==="starfall:F-02"?"starfall-record-order":"starfall-routing-order"};
  if(v.current.orderedRequires&&op!==v.objective[0])return {ok:false,reason:"story-operation-order"};
  if(region==="library"&&libraryBlocked(op,v.objective,v))return {ok:false,reason:"library-previous-station"};
  if(region==="library"&&op==="melody:library"&&v.objective.includes("repair:library"))return {ok:false,reason:"library-repair-first"};
  if(op.startsWith("battle:"))return {ok:false,reason:"battle-host-required"};
  if(v.current.id==="harbor:H-04"){
   const first=v.choice==="rescue"?"rescue:storm-boat":"puzzle:beam-mirrors";
   if(op!==first&&v.objective.includes(first))return {ok:false,reason:v.choice==="rescue"?"rescue-first":"beacon-first"};
  }
  if(op==="melody:harbor"&&v.objective.includes("repair:harbor"))return {ok:false,reason:"harbor-repair-first"};
  if(op.startsWith("melody:")&&!localNpcs().every(n=>readyResidents().includes(n.id)))return {ok:false,reason:"invite-local-cats"};
  if(region==="sky"&&skyLaunch[op]&&!skyPartsReady(v))return {ok:false,reason:"sky-parts-required"};
  if(op==="puzzle:joint-flight"&&!v.choice)return {ok:false,reason:"choice-pending"};
  active={sceneId:v.current.id,operation:op,region,token:bridge.capture()};if(adventureActions&&["explore:flight-recorder","puzzle:distributed-routing"].includes(op)){active.adventureAction=true;return complete();}if(spatialKind(op)){puzzle=createPuzzle(op,v.choice);return {ok:true,puzzle:true};}if(canonRestorationPrerequisites[op]||v.current.id==="forest:R-03"||op==="repair:sky"&&v.current.id==="sky:S-03"||op==="repair:library"&&v.current.id==="library:M-02"){active.adventureAction=true;return complete();}if(adventureActions&&!(["forest","forge","sky","library","starfall"].includes(region)&&(op.startsWith("puzzle:")||op.startsWith("repair:")||op.startsWith("melody:")||!!skyLaunch[op]||!!libraryPuzzle(op,bridge.libraryRecord())))){active.adventureAction=true;active.participants=readyResidents();if(op.startsWith("melody:"))return {ok:true,ceremony:true};return complete();}puzzle=createPuzzle(op,v.choice??null,region==="library"?bridge.libraryRecord():null);if(puzzle?.type==="melody"){puzzle.participants=readyResidents();if(adventureActions&&["forest","forge","sky","library","starfall"].includes(region)){puzzle.residentLead=true;puzzle.values=puzzle.goal.slice(0,2);puzzle.response=puzzle.values.map((n,j)=>({actor:puzzle.participants[j%2],reply:(n+1)%3}));}}
  if(puzzle)return {ok:true,puzzle:true};
  if(!op.startsWith("explore:"))return {ok:false,reason:"unimplemented"};
  return complete();
 }
 function traceTide(index){const step=bridge.tideStep();if(!step||step.index!==index||!near(step.point)||puzzle)return {ok:false,reason:"walk-to-tide"};return bridge.traceTide(index,bridge.capture());}
 function traceScent(index){const step=bridge.scentStep();if(!step||step.index!==index||!near(step.point))return {ok:false,reason:"walk-to-scent"};return bridge.traceScent(index,bridge.capture());}
 function startHomeRepair(){
  const q=bridge.homeQuest(region);if(!q||q.repaired||!near(q.point)||puzzle)return {ok:false,reason:"postgame-repair-unavailable"};
  active={homeRepair:true,token:bridge.capture(),adventureAction:adventureActions};if(adventureActions)return complete();puzzle=createPuzzle("repair:"+region);return puzzle?{ok:true,puzzle:true}:{ok:false,reason:"unimplemented"};
 }
 function meetHomeResident(id){
  const q=bridge.homeQuest(region),n=localNpcs().find(n=>n.id===id);if(!q?.repaired||!n||!near(n.point))return {ok:false,reason:"postgame-visit-unavailable"};
  return bridge.meetHomeResident(region,id,n.point,bridge.capture());
 }
 function complete(){
  if(active?.optionalTheater){if(!live()||!puzzle?.solved)return {ok:false,reason:"incomplete-optional-play"};active=null;puzzle=null;return {ok:true,optional:true};}
  if(active?.survey){const s=survey();if(s?.operation!==active.survey||!near(s.from)||(!active.adventureAction&&!puzzle?.solved))return {ok:false,reason:"incomplete-flight"};const result=bridge.finishSurvey(s.operation,active.adventureAction?{adventureAction:true}:skyFlightProof(puzzle.flight),active.token);if(result.ok){path=s.remote?mainPath:skySurveyPath;pos=[...s.to];active=null;puzzle=null;}return result;}
  if(active?.homeRepair){
   const q=bridge.homeQuest(region);if(!q||!near(q.point)||(!active.adventureAction&&!puzzle?.solved))return {ok:false,reason:"incomplete-physical-action"};
   const r=bridge.finishHomeRepair(region,active.token,{adventureAction:active.adventureAction,values:puzzle?.values,flightProof:skyFlightProof(puzzle?.flight)});if(r.ok){active=null;puzzle=null;}return r;
  }
  if(!active)return {ok:false,reason:"no-interaction"};const f=layout.features[active.operation];
  if(!near(region==="sky"&&skyLaunch[active.operation]||f)||(puzzle&&!puzzle.solved))return {ok:false,reason:"incomplete-physical-action"};
  const result=bridge.recordWorld(active.sceneId,active.operation,{...active,shortRing:neighborTrialProof(active.shortRing),verified:true,participants:active.adventureAction?active.participants:puzzle?.participants,responses:puzzle?.response,flightProof:skyFlightProof(puzzle?.flight),libraryValues:puzzle?.type.startsWith("library")?puzzle.values:undefined,libraryQuestion:puzzle?.question,mirrorProof:mirrorProof(puzzle?.mirror),spatialProof:spatialProof(puzzle?.spatial),libraryRecord:active.adventureAction?bridge.libraryRecord():puzzle?.record,starfallSequence:puzzle?.values});
  if(result.ok){if((active.adventureAction||puzzle?.type==="skyFlight")&&skyLanding[active.operation]&&!(active.adventureAction&&active.operation==="explore:flight-recorder"))pos=[...skyLanding[active.operation]];active=null;puzzle=null;}return result;
 }
 function operate(i){if(!puzzle)return {ok:false,reason:"no-puzzle"};if(puzzle.solved)return complete();if(puzzle.type==="skyFlight"){steerSkyFlight(puzzle.flight,[.30,.50,.70][i]);return {ok:true,pending:true};}if(!movePuzzle(puzzle,i))return {ok:true,pending:true};if(puzzle.operation==="melody:starfall"){active.shortRing=newNeighborTrial(campaign.regions);if(!deferStarfallMelody){while(!active.shortRing.done)advanceNeighborTrial(active.shortRing,.02);}}if(deferHarborMelody&&puzzle.operation==="melody:harbor"||deferForestMelody&&puzzle.operation==="melody:forest"||deferSkyMelody&&puzzle.operation==="melody:sky"||deferForgeMelody&&puzzle.operation==="melody:forge"||deferLibraryMelody&&puzzle.operation==="melody:library"||deferStarfallMelody&&puzzle.operation==="melody:starfall")return {ok:true,pending:true,ceremony:true};return complete();}
 function advanceShortRing(dt){return active?.shortRing?advanceNeighborTrial(active.shortRing,dt):[];}
 function spatialAct(action){if(puzzle?.type!=="canonSpatial"||!live())return {ok:false,reason:"no-spatial-action"};const s=puzzle.spatial;if(s.walk)return {ok:true,pending:true};if(adventureActions&&["bridge","stars"].includes(s.kind)&&action.type==="step"){startBridgeWalk(s,action);return {ok:true,pending:true};}if(!puzzle.solved)puzzle.solved=spatialInput(s,action);return puzzle.solved?complete():{ok:true,pending:true};}
 function spatialTick(dt){if(puzzle?.type!=="canonSpatial"||!live())return null;const s=puzzle.spatial;if(["bridge","stars"].includes(s.kind)){animateStarPlatforms(s,dt);if(!advanceBridgeWalk(s,dt))return null;puzzle.solved=s.solved;return puzzle.solved?complete():{ok:true,pending:true};}if(!tickSpatial(s,dt))return null;puzzle.solved=true;return complete();}
 function flightLand(){return puzzle?.type==="skyFlight"&&live()&&landSkyFlight(puzzle.flight);}
 function flightSteer(y){return puzzle?.type==="skyFlight"&&live()&&steerSkyFlight(puzzle.flight,y);}
 function flightTick(dt){if(puzzle?.type!=="skyFlight"||!live()||!tickSkyFlight(puzzle.flight,dt))return null;puzzle.solved=true;return complete();}
 function cargoPoints(){return region==="forge"?[[.35,.76],[.79,.364]]:[mainPath[1],mainPath[mainPath.length-2]];}
 function openOptionalTheater(){if(!live()||region!=="forge"||puzzle||!bridge.view().completed.includes("forge:E-01")||!near(layout.features["puzzle:lantern-show"]))return {ok:false,reason:"walk-to-theater"};active={optionalTheater:true,operation:"puzzle:lantern-show"};puzzle=createPuzzle("puzzle:lantern-show");return {ok:true,puzzle:true};}
 function startCargo(option){
  if(survey()?.remote||cargo||puzzle||!option||option.actor!==region)return {ok:false,reason:"cargo-busy"};
  const pts=cargoPoints();if(!near(pts[option.from]))return {ok:false,reason:"walk-to-cargo"};
  const result=bridge.pickupCargo(option);if(result.ok)cargo={...option,pickedUp:true};return result;
 }
 function deliverCargo(){
  if(survey()?.remote||!cargo||!near(cargoPoints()[cargo.to]))return {ok:false,reason:"walk-to-recipient"};
  const result=bridge.exchange(cargo.a,cargo.b,{region,stage:cargo.stage,action:cargo.action,verified:true,token:bridge.capture()});
  if(result.ok)cargo=null;return result;
 }
 function localNpcs(){const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return Object.values(campaign.cast).filter(n=>n.region===region&&!(region==="harbor"&&bridge.view().current?.id==="harbor:H-01"&&n.id==="jiedeng")).map((n,i)=>({...n,point:layout.castPoints?.[n.id]||(i===0?lerp(path[1],path[2],.44):lerp(path[3],path[4],.46))}));}
 function inviteNpc(id){const n=localNpcs().find(n=>n.id===id),v=bridge.view();if(!n||!near(n.point)||!v.objective.includes("melody:"+region))return {ok:false,reason:"npc-not-available"};const method={harbor:"inviteHarbor",forest:"inviteForest",forge:"inviteForge",sky:"inviteSky",library:"inviteLibrary",starfall:"inviteStarfall"}[region];if(method){const result=bridge[method](id,n.point,bridge.capture());if(!result.ok)return result;}invited.add(id);return {ok:true};}
 function rewardPoints(){if(region==="finale")return [];if(region==="forge")return [{id:"cache-1",point:[.225,.81]},{id:"cache-2",point:[.35,.705]}];if(survey()?.remote)return [{id:"survey-cache",point:[...skySurveyCache]}];return [...(region==="starfall"&&bridge.view().completed.includes("starfall:F-02")?[{id:"starfall-hidden-record",point:[.41,.58]}]:[]),{id:"cache-1",point:[(path[0][0]+path[1][0])/2,(path[0][1]+path[1][1])/2]},{id:"cache-2",point:[(path[path.length-3][0]+path[path.length-2][0])/2,(path[path.length-3][1]+path[path.length-2][1])/2]}];}
 function pickup(id){const p=rewardPoints().find(x=>x.id===id);if(!p||!near(p.point))return {ok:false,reason:"walk-to-cache"};return bridge.pickupReward(region,id);}
 function cancel(){puzzle=null;active=null;}
 return {walk,tick,interact,operate,openOptionalTheater,advanceShortRing,spatialAct,spatialTick,forgeStep:()=>bridge.forgeStep(),collectForgePart:index=>{const step=bridge.forgeStep();if(!step||step.index!==index||!near(step.point)||puzzle)return {ok:false,reason:"walk-to-objective"};return bridge.collectForgePart(index,bridge.capture());},flightSteer,flightLand,flightTick,survey,startSurvey,cancel,complete,traceTide,tideStep:()=>bridge.tideStep(),traceScent,scentStep:()=>bridge.scentStep(),homeQuest:()=>bridge.homeQuest(region),startHomeRepair,meetHomeResident,startCargo,deliverCargo,cargoPoints,near,localNpcs,inviteNpc,rewardPoints,pickup,layout,get invited(){return readyResidents()},get position(){return [...pos]},get moving(){return !!dest},get facing(){return facing},get puzzle(){return puzzle?JSON.parse(JSON.stringify(puzzle)):null},get active(){return active?{...active}:null},get cargo(){return cargo?{...cargo}:null},get error(){return error}};
}
