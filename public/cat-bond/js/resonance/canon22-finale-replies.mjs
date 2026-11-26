// Independent, replayable endpoint replies for the finale.  These are battle
// events, not cargo receipts, health-based completion, or region restoration.
export function newReplyEdge(region,next){
 return {region,next,cleared:false,clearAt:null,interference:0,interruptedAt:null,firstAt:null,secondAt:null,progress:0,done:false};
}
export function clearReplySource(edge,at){
 if(!edge||edge.cleared||!Number.isFinite(at)||at<0)return false;
 edge.cleared=true;edge.clearAt=at;return true;
}
export function disruptReply(edge,at){
 if(!edge||!Number.isFinite(at)||at<0)return false;
 edge.interference++;edge.interruptedAt=at;edge.firstAt=null;edge.secondAt=null;edge.progress=0;edge.done=false;return true;
}
export function advanceReply(edge,dt,at,near,required=2){
 if(!edge?.cleared||edge.done||!Number.isFinite(dt)||dt<=0||dt>.1||!Number.isFinite(at)||!Number.isFinite(required)||required<1.5)return null;
 if(!near){edge.progress=Math.max(0,edge.progress-dt*.5);if(edge.progress===0)edge.firstAt=null;return null;}
 edge.progress=Math.min(required,edge.progress+dt);
 if(edge.firstAt===null&&edge.progress>=required*.45){edge.firstAt=at;return 'first';}
 if(edge.firstAt!==null&&edge.progress>=required&&at-edge.firstAt>=.5){edge.secondAt=at;edge.done=true;return 'second';}
 return null;
}
export function replyProof(edge){return edge?.done?{region:edge.region,next:edge.next,clearAt:edge.clearAt,firstAt:edge.firstAt,secondAt:edge.secondAt,interference:edge.interference,interruptedAt:edge.interruptedAt}:null;}
export function validReplyProof(regions,proof,stableAt){
 if(!Array.isArray(proof)||proof.length!==regions.length||!Number.isFinite(stableAt)||stableAt<0)return false;
 return regions.every((region,i)=>{
  const p=proof[i],times=[p?.clearAt,p?.firstAt,p?.secondAt];
  return p?.region===region&&p.next===regions[(i+1)%regions.length]&&times.every(t=>Number.isFinite(t)&&t>=0)&&p.clearAt<=p.firstAt&&p.secondAt-p.firstAt>=.5&&stableAt-p.secondAt>=1&&Number.isSafeInteger(p.interference)&&p.interference>=0&&(p.interference===0?p.interruptedAt===null:Number.isFinite(p.interruptedAt)&&p.interruptedAt<=p.firstAt);
 });
}
