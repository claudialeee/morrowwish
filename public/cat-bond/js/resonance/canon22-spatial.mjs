import {canonArt,paintArt,paintPlate,paintBridge} from "./canon22-art.mjs";
// Canon 2.2 spatial interactions. Each action is replayed before story evidence is granted.
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ops={"puzzle:moonleaf-crossing":"bridge","puzzle:moonleaf-loop":"bridge","puzzle:lantern-show":"light","puzzle:shadow-bridge":"light","puzzle:star-steps":"stars","puzzle:chime-chase":"bellPattern"};
export const spatialKind=op=>ops[op]||null;
const bridgeNodes=[[.16,.52],[.36,.52],[.62,.32],[.62,.72],[.84,.52]];
const starNodes=[[.12,.54],[.27,.32],[.27,.70],[.49,.27],[.49,.75],[.70,.35],[.70,.65],[.87,.50]];
const starEdges=[[1,2],[0,3],[0,4],[1,5,7],[2,6],[3,7],[4,7],[5,6,3]];
const starPosition=(p,i)=>p.starLocks?.[i]||((p.walk?.action?.i===i)?p.walk.to:([3,6].includes(i)?[starNodes[i][0],starNodes[i][1]+Math.sin((p.visualClock||0)*2+i)*.034]:starNodes[i]));
export const spatialNodes=p=>p.kind==="bridge"?bridgeNodes:p.kind==="stars"?starNodes.map((_,i)=>starPosition(p,i)):[];
export function animateStarPlatforms(p,dt){if(p?.kind==="stars"&&!p.solved&&Number.isFinite(dt)&&dt>0)p.visualClock=(p.visualClock||0)+Math.min(.1,dt);}

export function newSpatial(op){
 const kind=spatialKind(op);if(!kind)return null;
 return {operation:op,kind,node:op==="puzzle:moonleaf-loop"?1:0,branch:0,angle:.5,shape:0,moves:0,route:null,trace:[],solved:false,warning:"",visited:[op==="puzzle:moonleaf-loop"?1:0],player:[.2,.73],target:[.2,.73],chime:[.30,.73],phase:0,chaseActive:false,readyPounce:false,pouncing:false,chimeWaypoints:[],frame:0,acc:0,waypoints:[],chaseRoute:null,jumping:false,wallCrossed:false,discoveries:[],audience:0,walk:null,visualClock:0,starLocks:{},patternRound:0,shadowRevision:op==="puzzle:shadow-bridge"?2:0,shadowPhase:0};
}
// Animation delays the actual node transition. Invalid edges never start motion;
// the underlying replay stays independent of frame rate.
export function startBridgeWalk(p,action){
 if(!["bridge","stars"].includes(p?.kind)||p.solved||p.walk||action?.type!=="step")return false;
 const copy=JSON.parse(JSON.stringify(p));spatialInput(copy,action);
 if(copy.node===p.node){spatialInput(p,action);return false;}
 const nodes=spatialNodes(p),from=nodes[p.node],to=nodes[copy.node];if(p.kind==="bridge"&&(copy.node===2||copy.node===3))p.branch=copy.node===2?0:1;p.warning="";p.walk={from:[...from],to:[...to],elapsed:0,duration:p.kind==="stars"?Math.max(.38,dist(from,to)/.9):Math.max(.60,dist(from,to)/.32),action:{...action}};return true;
}
export function bridgeWalkPosition(p){const w=p.walk;if(!w)return [...spatialNodes(p)[p.node]];const t=clamp(w.elapsed/w.duration,0,1);return w.from.map((v,i)=>v+(w.to[i]-v)*t);}
export function spatialTravelPose(p,lag=0){
 const w=p.walk;if(!w)return {point:[...spatialNodes(p)[p.node]],ground:[...spatialNodes(p)[p.node]],lift:0,moving:false,face:1};
 const t=clamp((w.elapsed-lag)/w.duration,0,1),ground=w.from.map((v,i)=>v+(w.to[i]-v)*t),lift=p.kind==="stars"?Math.sin(Math.PI*t)*.085:0;
 return {ground,point:[ground[0],ground[1]-lift],lift,moving:true,face:w.to[0]>=w.from[0]?1:-1};
}
export function advanceBridgeWalk(p,dt){if(!p?.walk||!Number.isFinite(dt)||dt<=0)return false;const w=p.walk;w.elapsed=Math.min(w.duration,w.elapsed+Math.min(.1,dt));if(w.elapsed<w.duration)return false;if(p.kind==="stars")p.starLocks[w.action.i]=[...w.to];p.walk=null;spatialInput(p,w.action);return true;}
const kittenPoint=[.70,.76];
const hiddenShadows=[[.19,.48],[.51,.37],[.82,.60]];
const shadowId=i=>"found-shadow-"+i;
const shadowTargets=[.19,.51,.68,.82,.18];
const shadowHints=[["左边传来窸窣声，照亮藏身处。","A rustle on the left. Light up its hiding place."],["第二只影子露出尾巴，跟上它！","A second tail appears. Follow it!"],["它跑向右边了，追上新的位置。","It darts right. Follow its new position."],["最后一只学着灯光移动，先照到它身上。","The last cat mimics the light. Shine on it first."],["它躲到灯光的反方向，试着照向对面。","It moves opposite the light. Shine across to the other side."],["三只影子都找到了，跟它们去古铃。","All three shadows found. Follow them to the bell."]];
export const shadowHint=p=>shadowHints[Math.min(5,p.shadowPhase||0)];
function advanceShadow(p,x){const phase=p.shadowPhase;if(phase>=5||Math.abs(shadowTargets[phase]-x)>=.065)return false;p.shadowPhase++;if(phase===0)p.discoveries.push(shadowId(0));if(phase===2)p.discoveries.push(shadowId(1));if(phase===4)p.discoveries.push(shadowId(2));return true;}
function starStep(p,i){
 if(!starEdges[p.node].includes(i)){p.warning="fall";return;}
 p.node=i;p.visited.push(i);p.route=p.route||(i===1?"upper":"lower");if((i===3||i===6)&&!p.discoveries.includes("starlight-"+i))p.discoveries.push("starlight-"+i);p.solved=i===7;
}
export function bridgeReachable(p){if(p.operation!=="puzzle:moonleaf-crossing")return ([[1],[2,3],[4],[4],[]])[p.node]||[];return p.node===0?[1]:p.node===1?[p.branch===0?2:3]:p.node===2?[1]:p.node===3?p.discoveries.includes("rescued-kitten")?[4]:[]:[];}
function bridgeStep(p,i){
 const edge=bridgeReachable(p);
 if(!edge.includes(i)){p.warning="gap";return;}
 if(i===2||i===3)p.branch=i===2?0:1;p.node=i;p.visited.push(i);if(i===2||i===3){p.route=i===2?"upper":"lower";const clue=i===2?"garden-view":"glowing-fungi";if(!p.discoveries.includes(clue))p.discoveries.push(clue);}p.solved=i===4;
}
// A finite, three-leg chase. The wisp waits at each destination; players never
// need to predict a circulating target or restart a completed leg.
// Preserve the old operation ID for saved chapter evidence only.
const bellPatterns=[[0,1,0,1],[2,0,2,0],[1,2,1,2]];
const bellGlyphs=["☀","☾","✦"];
const bellNames=[["太阳","Sun"],["月亮","Moon"],["星星","Star"]];
const bellOptions=[[.23,.68],[.5,.68],[.77,.68]];
const bellCorrect=p=>bellPatterns[p.patternRound]?.[3];
const chaseStages=[[[.5,.73]],[[.8,.73],[.8,.27],[.5,.27]],[[.2,.27]]];
export function chaseVisualY(y){return y<.5?.35+(y-.27)*(.15/.23):y;}
export function chaseLogicalY(y){return y<.5?.27+(y-.35)*(.23/.15):y;}
export function chasePoint(p){return [...p.chime];}
export function chaseTrail(p){return [p.chime,...p.chimeWaypoints];}
function followPath(point,queue,speed){const q=queue[0];if(!q)return point;const d=dist(point,q);if(d<=speed){queue.shift();return [...q];}return point.map((n,i)=>n+(q[i]-n)*speed/d);}
function routeChase(p,shortcut=false){
 if(p.chaseActive||p.phase>=chaseStages.length||shortcut&&p.phase!==1)return false;
 if(p.readyPounce){if(shortcut)return false;p.pouncing=true;p.chaseActive=true;p.waypoints=[[...p.chime]];p.moves++;return true;}
 const route=chaseStages[p.phase];
 p.chimeWaypoints=(shortcut?[[.5,.48],[.5,.27]]:route).map(q=>[...q]);
 p.waypoints=(shortcut?[[.5,.27]]:p.phase===2?[[.27,.27]]:route).map(q=>[...q]);
 p.chaseActive=true;p.moves++;p.jumping=shortcut;p.wallCrossed=p.wallCrossed||shortcut;
 return true;
}
function chaseStep(p){
 if(!p.chaseActive)return;
 p.frame++;
 const old=p.player;
 p.chime=followPath(p.chime,p.chimeWaypoints,.00225);
 p.player=followPath(p.player,p.waypoints,p.pouncing?.005:p.jumping?.0045:.0035);
 p.moving=dist(old,p.player)>.0001;
 if(!p.waypoints.length)p.jumping=false;
 if(!p.waypoints.length&&!p.chimeWaypoints.length){
  p.chaseActive=false;p.moving=false;
  if(p.pouncing){p.pouncing=false;p.readyPounce=false;p.phase=3;p.solved=true;p.route=p.wallCrossed?"shortcut":"lane";}
  else if(p.phase===2){p.readyPounce=true;}
  else {p.phase++;const next=chaseStages[p.phase][0],d=dist(p.chime,next);p.chime=p.chime.map((n,i)=>n+(next[i]-n)*Math.min(.08/d,1));}
 }
}
export function tickSpatial(p,dt){
 if(p?.kind!=="chase"||p.solved||!p.chaseActive||!Number.isFinite(dt)||dt<=0)return false;
 p.acc+=Math.min(.1,dt);
 while(p.acc+1e-9>=.02&&p.chaseActive){p.acc-=.02;chaseStep(p);if(p.solved)return true;}
 if(!p.chaseActive)p.acc=0;
 return false;
}
export function spatialInput(p,a){
 if(!p||p.solved||p.walk||!a||p.trace.length>=500)return false;
 p.warning="";
 if(p.kind==="bellPattern"&&a.type==="bell-tile"&&Number.isInteger(a.i)&&a.i>=0&&a.i<3){
  if(a.i!==bellCorrect(p)){p.warning="bell-mismatch";return false;}
  p.patternRound++;p.moves++;p.discoveries.push("bell-pattern-"+p.patternRound);
  if(p.patternRound===bellPatterns.length){p.solved=true;p.route="restored-pattern";}
 }else if(a.type==="step"&&Number.isInteger(a.i)){
  if(p.kind==="bridge"&&a.i>=0&&a.i<5){if(!bridgeReachable(p).includes(a.i)){p.warning=p.node===3?"rescue-first":"gap";return false;}bridgeStep(p,a.i);}
  else if(p.kind==="stars"&&a.i>=0&&a.i<8)starStep(p,a.i);
  else return false;
 }else if(a.type==="rescue"&&p.operation==="puzzle:moonleaf-crossing"){if(p.node!==3||p.discoveries.includes("rescued-kitten"))return false;p.discoveries.push("rescued-kitten");}
 else if(a.type==="leaf"&&p.kind==="bridge"){if(p.node!==1&&p.node!==4){p.warning="leaf";return false;}p.branch=1-p.branch;}
 else if(a.type==="aim"&&p.kind==="light"&&Number.isFinite(a.x)&&a.x>=0&&a.x<=1){if(Math.abs(p.angle-a.x)>.025){p.moves++;p.audience++;}p.angle=a.x;if(p.operation==="puzzle:shadow-bridge"){if(p.shadowRevision===2){if(!advanceShadow(p,a.x))return false;}else{const before=p.discoveries.length;hiddenShadows.forEach(([x],i)=>{if(Math.abs(x-a.x)<.085&&!p.discoveries.includes(shadowId(i)))p.discoveries.push(shadowId(i));});if(p.discoveries.length===before)return false;}}}
 else if(a.type==="shape"&&p.operation==="puzzle:lantern-show"&&Number.isInteger(a.i)&&a.i>=0&&a.i<3){p.shape=a.i;p.audience++;}
 else if(a.type==="cross"&&p.kind==="light"){
  if(p.operation==="puzzle:lantern-show"){p.solved=true;}
  else if(hiddenShadows.every((_,i)=>p.discoveries.includes(shadowId(i)))){p.solved=true;}else p.warning="dark";
 }else if(p.kind==="chase"&&a.type==="target"&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=.12&&a.x<=.88&&a.y>=.20&&a.y<=.80){if(dist([a.x,a.y],chasePoint(p))>.18||!routeChase(p))return false;a={...a,frame:p.frame};}
 else if(p.kind==="chase"&&a.type==="jump"){if(!routeChase(p,true))return false;a={...a,frame:p.frame};}
 else if(p.kind==="chase"&&a.type==="direction"&&[-1,0,1].includes(a.dx)&&[-1,0,1].includes(a.dy)&&Math.abs(a.dx)+Math.abs(a.dy)===1){if(!routeChase(p))return false;a={...a,frame:p.frame};}

 else return false;
 // Long optional lantern drags should never exceed the proof replay limit.
 if(p.operation==="puzzle:lantern-show"&&a.type==="aim"&&p.trace.at(-1)?.type==="aim")p.trace[p.trace.length-1]={...a};
 else p.trace.push({...a});return p.solved;
}
export function spatialProof(p){return p?.solved?{operation:p.operation,trace:p.trace.map(x=>({...x})),frames:p.frame,route:p.route,discoveries:[...p.discoveries],...(p.operation==="puzzle:lantern-show"?{shape:p.shape,angle:p.angle}: {}),...(p.shadowRevision===2?{shadowRevision:2}:{})}:null;}
export function validSpatialProof(op,proof){
 const p=newSpatial(op);if(p?.shadowRevision===2){if(proof?.shadowRevision===undefined)p.shadowRevision=0;else if(proof.shadowRevision!==2)return false;}if(!p||proof?.operation!==op||!Array.isArray(proof.trace)||proof.trace.length<1||proof.trace.length>500||!Number.isInteger(proof.frames)||proof.frames<0||proof.frames>6000)return false;
 for(const a of proof.trace){if(p.solved)return false;if(p.kind==="chase"){if(!Number.isInteger(a.frame)||a.frame<p.frame||a.frame>=proof.frames)return false;while(p.frame<a.frame&&!p.solved&&p.chaseActive)chaseStep(p);if(p.solved||p.frame!==a.frame)return false;}const n=p.trace.length;spatialInput(p,a);if(p.trace.length!==n+1)return false;}
 if(p.kind==="chase")while(p.frame<proof.frames&&!p.solved&&p.chaseActive)chaseStep(p);
 return p.solved&&p.frame===proof.frames&&p.route===proof.route&&JSON.stringify(p.discoveries)===JSON.stringify(proof.discoveries||[])&&(op!=="puzzle:lantern-show"||p.shape===proof.shape&&p.angle===proof.angle);
}
export function spatialTap(p,x,y){
 if(p.kind==="bellPattern"){const i=bellOptions.findIndex(([a,b])=>Math.abs(x-a)<.12&&Math.abs(y-b)<.12);return i<0?null:{type:"bell-tile",i};}
 if(p.kind==="chase"){
  if(p.chaseActive)return null;
  const q=chasePoint(p);
  return dist([q[0],chaseVisualY(q[1])],[x,y])<.15?{type:"target",x:q[0],y:q[1]}:null;
 }
 if(p.walk)return null;
 if(p.operation==="puzzle:moonleaf-crossing"&&p.node===3&&!p.discoveries.includes("rescued-kitten")&&dist([x,y],kittenPoint)<.07)return {type:"rescue"};
 if(p.kind==="bridge"&&p.node===1&&dist([x,y],[.36,.25])<.11)return {type:"leaf"};
 if(p.kind==="light")return y>.79?null:{type:"aim",x:clamp(x,0,1)};
 const nodes=spatialNodes(p),i=nodes.findIndex(q=>dist(q,[x,y])<.095);return i<0?null:{type:"step",i};
}
export function spatialControls(p){
 if(p.kind==="bellPattern")return bellNames.map(([zh,en],i)=>({label:[bellGlyphs[i]+" "+zh,bellGlyphs[i]+" "+en],action:{type:"bell-tile",i}}));
 if(p.kind==="bridge")return [...bridgeNodes.map((_,i)=>({label:[["起点","岔路","树冠","地下","对岸"][i],["Start","Fork","Canopy","Roots","Far bank"][i]],action:{type:"step",i},available:bridgeReachable(p).includes(i)})).filter(e=>e.available),...(p.node===1?[{label:["拨动月叶","Turn moonleaf"],action:{type:"leaf"}}]:[]),...(p.operation==="puzzle:moonleaf-crossing"&&p.node===3&&!p.discoveries.includes("rescued-kitten")?[{label:["帮小猫离开根丛","Free the trapped kitten"],action:{type:"rescue"}}]:[])];
 if(p.kind==="stars")return starEdges[p.node].filter(i=>!p.visited.includes(i)||starEdges[p.node].every(j=>p.visited.includes(j))).map(i=>({label:["跳向星石 "+(i+1),"Jump to stone "+(i+1)],action:{type:"step",i}}));
 if(p.operation==="puzzle:lantern-show")return [...["鱼","蝴蝶","猫"].map((x,i)=>({label:[x,["Fish","Butterfly","Cat"][i]],action:{type:"shape",i}})),{label:["结束表演","Finish the show"],action:{type:"cross"}}];
 if(p.kind==="light")return [{label:["灯光向左移","Sweep left"],action:{type:"aim",x:clamp(p.angle-.08,0,1)}},{label:["灯光向右移","Sweep right"],action:{type:"aim",x:clamp(p.angle+.08,0,1)}},{label:["追上逃走的影子","Follow the escaping shadows"],action:{type:"cross"},available:hiddenShadows.every((_,i)=>p.discoveries.includes(shadowId(i)))}];
 const [x,y]=chasePoint(p);
 return [{label:["追上铃光","Chase the light"],action:{type:"target",x,y},available:!p.chaseActive},...(p.phase===1?[{label:["翻过低墙","Jump the low wall"],action:{type:"jump"},available:!p.chaseActive}]:[])];
}
export function paintSpatial(c,p,W,H,lang,drawCat,drawNpc,time=0,nativeBackground=false){
 const tr=(a,b)=>lang==="zh"?a:b,pt=q=>[q[0]*W,q[1]*H],dot=(q,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(...pt(q),r,0,Math.PI*2);c.fill()},line=(a,b,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.beginPath();c.moveTo(...pt(a));c.lineTo(...pt(b));c.stroke()},label=(s,q,size=18)=>{c.font="600 "+size+"px sans-serif";c.textAlign="center";c.fillStyle="#fff5db";if(nativeBackground){c.strokeStyle="#263c43";c.lineWidth=3;c.strokeText(s,...pt(q),W*.92);}c.fillText(s,...pt(q),W*.92)};
 c.save();const painted=nativeBackground|| (p.kind==="bridge"?paintPlate(c,"forest-fork",W,H):p.kind==="light"?paintPlate(c,p.operation==="puzzle:lantern-show"?"lantern-theater":"lantern-vault",W,H):p.kind==="chase"?paintPlate(c,"windchime-chase",W,H):false);if(!nativeBackground){c.fillStyle=painted?"#182a3426":"#182a34b8";c.fillRect(0,0,W,H);}
 if(p.kind==="bellPattern"){
  const u=Math.min(W,H),round=Math.min(p.patternRound,2),pattern=bellPatterns[round],glyphSize=Math.max(23,u*.075);
  const panel=(x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();};
  panel(W*.07,H*.18,W*.86,H*.64,u*.035,"#fff2dbea","#b39059");
  const tile=(x,y,g,active)=>{const size=Math.min(W*.17,H*.18),r=size*.15;panel(x*W-size/2,y*H-size/2,size,size,r,active?"#ffe2a2":"#fff9e9",active?"#a77531":"#cbb387");c.fillStyle="#75502c";c.font="700 "+glyphSize+"px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(g,x*W,y*H);};
  c.fillStyle="#60482f";c.font="700 "+Math.max(18,u*.042)+"px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(tr("补全路标图案","Complete the pattern"),W*.5,H*.27);
  pattern.slice(0,3).forEach((i,n)=>tile(.19+n*.205,.43,bellGlyphs[i],false));tile(.805,.43,"?",true);
  bellOptions.forEach(([x,y],i)=>tile(x,y,bellGlyphs[i],true));
  c.font="600 "+Math.max(14,u*.032)+"px sans-serif";c.fillStyle="#75502c";c.fillText(tr("已修复 ","Restored ")+p.patternRound+"/3",W*.5,H*.77);
 }else if(p.kind==="bridge"){
  const a=p.operation==="puzzle:moonleaf-loop"?1-p.branch:p.branch,nodes=bridgeNodes,unit=Math.min(W,H),height=unit*.13;
  // All traversable spans use the painted root-bridge asset, not diagram strokes.
  // No line-art fallback: wait for the actual artwork rather than show a green bar.
  const rootArt=canonArt("forest-root-bridge"),landingArt=canonArt("forest-landing"),leafArt=canonArt("forest-moonleaf-control");
  const routeSegments=[[0,1],[1,a===0?2:3],[3,4]];
  if(p.operation!=="puzzle:moonleaf-crossing")routeSegments.push([2,4]);
  if(rootArt){
   for(const [i,j] of routeSegments){c.save();c.shadowColor="#243c3566";c.shadowBlur=unit*.012;c.shadowOffsetY=unit*.009;paintBridge(c,"forest-root-bridge",nodes[i],nodes[j],W,H,height);c.restore();}
  }
  if(landingArt)for(const i of [0,1,2,3,4]){const [x,y]=pt(nodes[i]);c.save();if(i===3)c.filter="brightness(.82) saturate(.85)";paintArt(c,"forest-landing",x,y,unit*.24,unit*.13,.5,.20);c.restore();}
  nodes.forEach((q,i)=>{if(!bridgeReachable(p).includes(i)&&i!==p.node)return;const [x,y]=pt(q),r=unit*.021,g=c.createRadialGradient(x,y,0,x,y,r*2.5);g.addColorStop(0,"#fff4c4b0");g.addColorStop(1,"#fff4c400");c.fillStyle=g;c.fillRect(x-r*2.5,y-r*2.5,r*5,r*5);c.strokeStyle=i===p.node?"#f5d28c":"#f5efc4";c.lineWidth=Math.max(1.5,unit*.003);c.beginPath();c.ellipse(x,y,r,r*.42,0,0,Math.PI*2);c.stroke();});
  if(leafArt)paintArt(c,"forest-moonleaf-control",W*.36,H*.25,unit*.145,unit*.145,.5,.55,Math.sin(time*2)*.09);
  if(p.node===1)label(tr("拨动月叶","Turn moonleaf"),[.36,.18],16);
  label(p.operation==="puzzle:moonleaf-crossing"?tr("树冠观景台 · 无出口","Canopy overlook · dead end"):tr("树冠日光台","Sunlit canopy"),[.62,.23],16);
  label(tr("反光菌群","Glowing fungi"),[.62,.83],16);
  if(!rootArt||!landingArt||!leafArt)label(tr("正在载入森林原画…","Loading forest artwork…"),[.5,.94],15);
  const pos=bridgeWalkPosition(p);
  // Two actual environments react to the route and footsteps, rather than
  // a tiny schematic pretending to be a panoramic view.
  if(p.node===2||p.walk?.to[1]===nodes[2][1]){
   const bloom=p.walk?Math.min(1,p.walk.elapsed/p.walk.duration):1;
   c.save();c.globalAlpha=.35*bloom;const sun=c.createLinearGradient(W*.55,0,W*.78,H*.58);sun.addColorStop(0,"#fff3ba88");sun.addColorStop(1,"#fff3ba00");c.fillStyle=sun;c.beginPath();c.moveTo(W*.46,0);c.lineTo(W*.62,0);c.lineTo(W*.88,H*.59);c.lineTo(W*.67,H*.59);c.fill();c.restore();
   for(let j=0;j<7;j++){const a=time*.7+j*2.399,q=[.54+j*.035,.23+Math.sin(a)*.04];c.save();c.globalAlpha=.28+.24*Math.sin(a)**2;paintArt(c,"garden-moonleaf",q[0]*W,q[1]*H,unit*.042,unit*.042,.5,.5,a*.3);c.restore();}
   if(!p.walk)label(tr("从这里能看见花园山谷！","You can see the garden valley!"),[.62,.43],16);
  }
  if(p.node===3||p.walk?.to[1]===nodes[3][1]||p.walk?.from[1]===nodes[3][1]){
   // Each cluster lights only when a cat comes near, with fading ripples.
   for(let j=0;j<12;j++){const q=[.46+(j%6)*.063,.72+Math.floor(j/6)*.055+Math.sin(j*2)*.011],d=dist(q,pos),lit=Math.max(0,1-d/.18),[x,y]=pt(q),rad=unit*(.022+lit*.03);
    const g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,"rgba(171,250,211,"+(.10+lit*.58)+")");g.addColorStop(1,"rgba(171,250,211,0)");c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);
    c.save();c.globalAlpha=.36+lit*.64;c.fillStyle="#baf0cf";c.beginPath();c.ellipse(x,y,unit*.009,unit*.004,0,0,Math.PI*2);c.fill();c.strokeStyle="#9ccfb7";c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+1);c.lineTo(x,y+unit*.012);c.stroke();c.restore();
   }
   if(!p.walk)label(tr("脚边的蘑菇亮起来了！","The mushrooms light up by your paws!"),[.62,.89],15);
  }
  const follower=spatialTravelPose(p,.16);const fp=follower.point;drawNpc?.("muling",clamp(fp[0]-.065,.05,.95),clamp(fp[1]+.038,.06,.94),.66,!!p.walk,follower.face);
  drawCat?.(pos[0],pos[1],!!p.walk);if(p.operation==="puzzle:moonleaf-crossing"){if(p.discoveries.includes("rescued-kitten")){drawCat?.(Math.max(.10,pos[0]-.056),Math.min(.91,pos[1]+.045),!!p.walk,"clover",.46);if(!p.walk&&p.node===3)label(tr("小猫跟上来啦！","The kitten is following!"),[.72,.60],16);}else if(p.node===3&&!p.walk){drawCat?.(...kittenPoint,false,"clover",.45);for(let i=0;i<3;i++){const x=.67+i*.025;line([x,.80],[x+.01,.70],"#9c7957",6);}label(tr("根丛里的小猫","A kitten caught in the roots"),[.73,.66],15);}}label(p.operation==="puzzle:moonleaf-crossing"?(p.node===2?tr("此处无法过河，返回岔路","No crossing here. Return to the fork"):p.node===3&&!p.discoveries.includes("rescued-kitten")?tr("先救出小猫，再一起过桥","Free the kitten before crossing"):tr("救出地下的小猫，再前往对岸","Rescue the kitten below, then cross")):tr("拨月叶改变桥的落点，再走过去","Turn the moonleaf, then cross"),[.5,.08],18);
 }else if(p.kind==="stars"){
  const pose=spatialTravelPose(p),unit=Math.min(W,H);
  // The trail remembers where the player actually jumped; two routes create
  // different constellations. Unvisited edges are never presented as earned.
  c.save();c.lineWidth=Math.max(1.5,unit*.004);c.strokeStyle="#f7e9baae";c.shadowColor="#efd7a9";c.shadowBlur=8;
  c.beginPath();p.visited.forEach((i,j)=>{const q=pt(starPosition(p,i));j?c.lineTo(...q):c.moveTo(...q);});if(p.walk)c.lineTo(...pt(pose.ground));c.stroke();c.restore();
  for(let i=0;i<starNodes.length;i++){const q=starPosition(p,i),visited=p.visited.includes(i),reachable=starEdges[p.node].includes(i),lit=i===p.node||reachable;const [x,y]=pt(q),radius=unit*(i===p.node?.055:reachable?.042:.024);
   if(lit){const g=c.createRadialGradient(x,y,1,x,y,radius);g.addColorStop(0,visited?"#fff0bdc0":"#d8e4ee80");g.addColorStop(1,"#f4df8c00");c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);}
   c.save();c.globalAlpha=lit?1:visited?.77:.48;paintArt(c,"star-step-stone",x,y,unit*.115,unit*.079,.5,.34);c.restore();
  }
  for(const i of [3,6]){const q=starPosition(p,i),collected=p.discoveries.includes("starlight-"+i);dot([q[0],q[1]-.055],unit*(collected?.008:.012),collected?"#f9e7a4":"#ffefb9");}
  const [gx,gy]=pt(pose.ground);c.save();c.fillStyle="rgba(24,27,52,"+(.25-pose.lift*1.5)+")";c.beginPath();c.ellipse(gx,gy+unit*.015,unit*.032,unit*.008,0,0,Math.PI*2);c.fill();c.restore();
  drawCat?.(pose.point[0],pose.point[1],pose.moving,null,.86,pose.face);
  label(p.node===0?tr("高路更短 · 下方留有古代路标","High route is shorter · Old markers lie below"):p.node===3?tr("看见圣所了！高处星石直通对岸","The sanctuary is in sight! Leap straight across"):p.node===6?tr("旧路标指向中央圣所，留下星纹拓片","An old marker points to the sanctuary; take a rubbing"):tr("沿相连的星石追上暮铃","Follow the connected stones toward Luna"),[.5,.08],Math.max(13,Math.min(19,unit*.035)));
 }else if(p.kind==="light"){
  const angle=p.angle,show=p.operation==="puzzle:lantern-show";
  if(show){
   // The painted audience is already part of the theater. Do not scatter tiny
   // unrelated cat sprites over it. Animate the actual chosen shadow instead.
   const unit=Math.min(W,H),lightX=.24+.52*angle,shadowX=.5+(.5-angle)*.30;
   const phase=time*2,shadowY=.45+(p.shape===0?Math.sin(phase*.9)*.023:p.shape===1?Math.sin(phase*1.8)*.036:-Math.abs(Math.sin(phase*.75))*.034);
   const size=unit*(.27+Math.abs(angle-.5)*.28),lx=lightX*W,ly=.24*H;
   const glow=c.createRadialGradient(lx,ly,0,lx,ly,unit*.38);
   glow.addColorStop(0,"#ffdc9c77");glow.addColorStop(1,"#ffdc9c00");c.fillStyle=glow;c.fillRect(0,0,W,H);
   c.save();c.beginPath();c.rect(W*.23,H*.29,W*.54,H*.35);c.clip();
   const x=(shadowX+(p.shape===0?Math.sin(phase*.85)*.035:p.shape===2?Math.sin(phase*.75)*.022:Math.cos(phase*.9)*.018))*W,y=shadowY*H;
   c.globalAlpha=.86;c.translate(x,y);
   if(p.shape===1)c.scale(.62+.38*Math.abs(Math.sin(phase*3)),1); // butterfly opens and closes wings
   if(p.shape===2)c.scale(1+.06*Math.sin(phase*1.5),.94+.10*Math.abs(Math.sin(phase*.75))); // crouch and pounce
   paintArt(c,["shadow-fish","shadow-butterfly","shadow-cat"][p.shape],0,0,size*1.35,size*(p.shape===1?.68:.85),.5,.5,Math.sin(phase)*(p.shape===2?.08:p.shape===0?.12:.045)+(angle-.5)*.22);
   c.restore();
   // The original theater painting owns the cat faces and lanterns. Only the movable light glow is composited; no solid prop can obscure the artwork.
   // Gentle audience acknowledgment in the illustrated foreground, not fake
   // animated actors. The story response is delivered in the readable caption.
   if(p.audience){for(const [i,ax] of [.14,.87].entries()){const k=.5+.5*Math.sin(phase+i),ay=.68-k*.025;c.save();c.globalAlpha=.35+.45*k;dot([ax,ay],unit*.008,"#fff0b3");dot([ax+(i?-.035:.035),ay-.035],unit*.005,"#ffe0a2");c.restore();}}
  }else{
   const unit=Math.min(W,H),lamp=[angle,.25],[lx,ly]=pt(lamp);
   const glow=c.createRadialGradient(lx,ly,0,lx,ly,unit*.52);glow.addColorStop(0,"#ffdc9caa");glow.addColorStop(1,"#ffdc9c00");c.fillStyle=glow;c.fillRect(0,0,W,H);
   for(const [i,[x,y]] of hiddenShadows.entries()){
    const found=p.discoveries.includes(shadowId(i)),pulse=.5+.5*Math.sin(time*4+i);
    if(found){const nearActive=p.shadowRevision===2&&p.shadowPhase<5&&Math.abs(shadowTargets[p.shadowPhase]-x)<.10;if(!nearActive){c.save();c.globalAlpha=.72;paintArt(c,"shadow-cat-listen",x*W,y*H,unit*.14,unit*.13,.5,.65);c.restore();}dot([x,y+.05],unit*.009,"#ffdf8d");}
    else if(p.shadowRevision!==2){dot([x-.013,y],unit*.006,"#ffe6a2"+Math.round(120+pulse*100).toString(16));dot([x+.013,y],unit*.006,"#ffe6a2");}
   }
   if(p.shadowRevision===2&&p.shadowPhase<5){const phase=p.shadowPhase,x=shadowTargets[phase],y=[.48,.37,.39,.60,.56][phase];c.save();c.globalAlpha=.64+.3*Math.sin(time*4)**2;const name=phase===0?"shadow-cat-crouch":phase<3?"shadow-cat":"shadow-cat-listen",running=phase===1||phase===2;const bob=running?Math.abs(Math.sin(time*4))*.018:0;c.translate(x*W,(y-bob)*H);if(phase===2||phase===4)c.scale(-1,1);if(!paintArt(c,name,0,0,unit*.21,unit*.17,.5,.5,running?Math.sin(time*3)*.06:0)){c.fillStyle="#ffe6a2";for(const dx of [-1,1]){c.beginPath();c.arc(dx*unit*.012,0,unit*.006,0,Math.PI*2);c.fill();}}c.restore();}drawCat?.(.19,.72);label(p.shadowRevision===2?shadowHint(p)[lang==="zh"?0:1]:tr("找到三只躲起来的影子猫","Find the three hidden shadow cats"),[.5,.08],Math.max(13,Math.min(20,unit*.035)));
   label(tr("已找到 ","Found ")+p.discoveries.filter(x=>x.startsWith("found-shadow-")).length+"/3",[.5,.90],18);
  }
 }else{
  const project=([x,y])=>[x,chaseVisualY(y)];
  const trail=chaseTrail(p).map(project);for(let i=1;i<trail.length;i++)line(trail[i-1],trail[i],"#ffe5a17a",4);
  const q=project(chasePoint(p)),pulse=18+Math.sin(time*5)*5;
  dot(q,pulse,"#f3d68588");if(!paintArt(c,"windchime-wisp",q[0]*W,q[1]*H,52,52,.5,.5))dot(q,10,"#fff3b3");
  const player=project(p.player);drawCat?.(player[0],player[1]-((p.jumping||p.pouncing)?.045:0),!!p.moving||p.jumping||p.pouncing);
  if(!p.chaseActive)label(p.readyPounce?tr("扑住铃光！","Pounce now!"):tr("点铃光追上去","Tap the light to chase"),[q[0],Math.max(.12,q[1]-.10)],18);
  label(tr("街巷追逐 ","Street chase ")+(p.phase+1)+"/3",[.5,.09],20);

 }
 if(p.warning&&p.kind!=="bellPattern")label(p.warning==="dark"?tr("还有影子没找到","More shadows are hiding"):tr("这条路不通，换个办法","That route is blocked. Try another."),[.5,.94],16);c.restore();
}
