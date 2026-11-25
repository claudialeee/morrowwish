// Verified physical ambient interactions. No direct "complete task" control.
export const ambientGames=Object.freeze({
 "muling:tea":{
  zh:"为暮铃泡一杯苦茶",en:"Brew Muling's bitter tea",
  props:[{id:"leaves",asset:"tea-leaves.svg",x:.16,y:.64,w:.17},{id:"kettle",asset:"water-kettle.svg",x:.35,y:.24,w:.25},{id:"pot",asset:"tea-pot.svg",x:.55,y:.62,w:.31},{id:"cup",asset:"tea-cup.svg",x:.83,y:.62,w:.23}],
  steps:[{piece:"leaves",target:"pot",zh:"把茶叶拖入茶壶",en:"Drag the tea leaves into the pot"},{piece:"kettle",target:"pot",zh:"将水壶拖至茶壶，注水",en:"Pour water from the kettle into the pot"},{piece:"pot",target:"cup",zh:"将茶壶拖至茶杯，倒出茶水",en:"Pour the brewed tea into the cup"}]
 },
 "muling:bells":{
  zh:"修理暮铃的旧铃铛",en:"Repair Muling's old bell",
  props:[{id:"tongue",asset:"bell-tongue.svg",x:.20,y:.63,w:.12},{id:"pin",asset:"bell-pin.svg",x:.78,y:.64,w:.24},{id:"shell",asset:"bell-shell.svg",x:.49,y:.47,w:.36}],
  steps:[{piece:"tongue",target:"shell",zh:"将铃舌装入铃身",en:"Fit the clapper into the bell shell"},{piece:"pin",target:"shell",zh:"插入固定销，完成修复",en:"Insert the retaining pin to repair the bell"}]
 }
});
export function createAmbientGame(id){
 const game=ambientGames[id];if(!game)throw Error("Unsupported ambient interaction");
 let stage=0;
 function drop(piece,x,y){
  const step=game.steps[stage],target=game.props.find(p=>p.id===step?.target);
  if(!step||step.piece!==piece||!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot((x-target.x)*1.1,y-target.y)>.13)return {ok:false,stage,done:false};
  stage++;return {ok:true,stage,done:stage===game.steps.length};
 }
 return {game,drop,stage:()=>stage,done:()=>stage===game.steps.length};
}
