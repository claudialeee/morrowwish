// Presentation only: no second controllable character or progress gate.
export const companionWalkAllowed=(view,region)=>view?.muling==="companion"&&["harbor","forest","forge","sky","library"].includes(region)&&!["sky:S-04","library:M-03","library:M-04","library:M-05"].includes(view.current?.id)&&view.current?.chapter===region;
const bound=n=>Math.max(.035,Math.min(.965,n));
export function companionPose(previous,leader,dt,moving){
 const last=previous?.leader||leader,dx=leader[0]-last[0],dy=leader[1]-last[1],length=Math.hypot(dx,dy),face=Math.abs(dx)>.0002?Math.sign(dx):previous?.face||1;
 const dir=length>.0002?[dx/length,dy/length]:previous?.dir||[1,0];
 const target=[bound(leader[0]-dir[0]*.075-dir[1]*.036),bound(leader[1]-dir[1]*.075+dir[0]*.036)];
 const pos=previous?.pos||target,d=Math.hypot(target[0]-pos[0],target[1]-pos[1]),k=d>.22?1:Math.min(1,Math.max(0,dt)*8);
 return {leader:[...leader],pos:pos.map((n,i)=>n+(target[i]-n)*k),dir,face,walking:!!moving||d>.006};
}
export const companionReplies=Object.freeze({harbor:["暮铃：听见啦！我就在这儿。","Muling: I hear you! Right here."],forest:["暮铃：小心头顶的叶子……噗！","Muling: Watch the leaves overhead... pfft!"],forge:["暮铃：等回花园，咱们也挂一盏灯吧。","Muling: Let's hang a lantern in the garden, too."],sky:["暮铃：我可没有怕高！……真的。","Muling: I'm not scared of heights! ...Really."],library:["暮铃：要是走散了，还是摇两下。","Muling: If we get separated, ring twice."]});
