// Canon 2.2 spatial interactions. Each action is replayed before story evidence is granted.
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ops={"puzzle:moonleaf-crossing":"bridge","puzzle:moonleaf-loop":"bridge","puzzle:lantern-show":"light","puzzle:shadow-bridge":"light","puzzle:star-steps":"stars","puzzle:chime-chase":"chase"};
export const spatialKind=op=>ops[op]||null;
const bridgeNodes=[[.16,.52],[.36,.52],[.62,.32],[.62,.72],[.84,.52]];
const starNodes=[[.12,.54],[.27,.32],[.27,.70],[.49,.27],[.49,.75],[.70,.35],[.70,.65],[.87,.50]];
const starEdges=[[1,2],[0,3],[0,4],[1,5],[2,6],[3,7],[4,7],[5,6]];
export const spatialNodes=p=>p.kind==="bridge"?bridgeNodes:p.kind==="stars"?starNodes:[];
export function newSpatial(op){
 const kind=spatialKind(op);if(!kind)return null;
 return {operation:op,kind,node:0,branch:0,angle:.5,shape:0,moves:0,route:null,trace:[],solved:false,warning:"",visited:[0],player:[.16,.74],target:[.16,.74],frame:0,acc:0};
}
function starStep(p,i){
 if(!starEdges[p.node].includes(i)){p.warning="fall";return;}
 p.node=i;p.visited.push(i);p.route=p.route||(i===1?"upper":"lower");p.solved=i===7;
}
function bridgeStep(p,i){
 const active=p.operation==="puzzle:moonleaf-loop"?1-p.branch:p.branch;
 const edge=([[1],[0,active===0?2:3],[4],[4],[active===0?2:3]])[p.node];
 if(!edge.includes(i)){p.warning="gap";return;}
 p.node=i;p.visited.push(i);if(i===2||i===3)p.route=i===2?"upper":"lower";p.solved=i===4;
}
const chaseLoop=[[.2,.27],[.8,.27],[.8,.73],[.2,.73]];
export function chasePoint(p){const t=(p.frame*.0045)%4,i=Math.floor(t),a=chaseLoop[i],b=chaseLoop[(i+1)%4];return [a[0]+(b[0]-a[0])*(t-i),a[1]+(b[1]-a[1])*(t-i)];}
function chaseStep(p){
 p.frame++;const d=dist(p.player,p.target),step=.009;if(d>step)p.player=p.player.map((x,i)=>x+(p.target[i]-x)*step/d);else p.player=[...p.target];
 if(p.moves>0&&p.frame>=12&&dist(p.player,chasePoint(p))<.065){p.solved=true;p.route=p.target[1]>.39&&p.target[1]<.61?"shortcut":"lane";}
}
export function tickSpatial(p,dt){if(p?.kind!=="chase"||p.solved||!Number.isFinite(dt)||dt<=0)return false;p.acc+=Math.min(.1,dt);while(p.acc+1e-9>=.02){p.acc-=.02;chaseStep(p);if(p.solved)return true;if(p.frame>=6000){Object.assign(p,newSpatial(p.operation),{warning:"retry"});return false;}}return false;}
export function spatialInput(p,a){
 if(!p||p.solved||!a||p.trace.length>=500)return false;
 p.warning="";
 if(a.type==="step"&&Number.isInteger(a.i)){
  if(p.kind==="bridge"&&a.i>=0&&a.i<5)bridgeStep(p,a.i);
  else if(p.kind==="stars"&&a.i>=0&&a.i<8)starStep(p,a.i);
  else return false;
 }else if(a.type==="leaf"&&p.kind==="bridge"){if(p.node!==1&&p.node!==4){p.warning="leaf";return false;}p.branch=1-p.branch;}
 else if(a.type==="aim"&&p.kind==="light"&&Number.isFinite(a.x)&&a.x>=0&&a.x<=1){if(Math.abs(p.angle-a.x)>.025)p.moves++;p.angle=a.x;}
 else if(a.type==="shape"&&p.operation==="puzzle:lantern-show"&&Number.isInteger(a.i)&&a.i>=0&&a.i<3){p.shape=a.i;}
 else if(a.type==="cross"&&p.kind==="light"){
  if(p.operation==="puzzle:lantern-show"){p.solved=true;}
  else if(Math.abs(p.angle-.72)<=.14&&p.moves>0){p.solved=true;}else p.warning="dark";
 }else if(a.type==="target"&&p.kind==="chase"&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>=.12&&a.x<=.88&&a.y>=.20&&a.y<=.80){p.target=[a.x,a.y];p.moves++;a={...a,frame:p.frame};}
 else return false;
 p.trace.push({...a});return p.solved;
}
export function spatialProof(p){return p?.solved?{operation:p.operation,trace:p.trace.map(x=>({...x})),frames:p.frame,route:p.route}:null;}
export function validSpatialProof(op,proof){
 const p=newSpatial(op);if(!p||proof?.operation!==op||!Array.isArray(proof.trace)||proof.trace.length<1||proof.trace.length>500||!Number.isInteger(proof.frames)||proof.frames<0||proof.frames>6000)return false;
 for(const a of proof.trace){if(p.solved)return false;if(p.kind==="chase"){if(!Number.isInteger(a.frame)||a.frame<p.frame||a.frame>=proof.frames)return false;while(p.frame<a.frame&&!p.solved)chaseStep(p);if(p.solved)return false;}const n=p.trace.length;spatialInput(p,a);if(p.trace.length!==n+1)return false;}
 if(p.kind==="chase")while(p.frame<proof.frames&&!p.solved)chaseStep(p);
 return p.solved&&p.frame===proof.frames&&p.route===proof.route;
}
export function spatialTap(p,x,y){
 if(p.kind==="chase")return {type:"target",x:clamp(x,.12,.88),y:clamp(y,.20,.80)};
 if(p.kind==="bridge"&&dist([x,y],[.36,.25])<.11)return {type:"leaf"};
 if(p.kind==="light")return y>.79?{type:"cross"}:{type:"aim",x:clamp(x,0,1)};
 const nodes=spatialNodes(p),i=nodes.findIndex(q=>dist(q,[x,y])<.095);return i<0?null:{type:"step",i};
}
export function spatialControls(p){
 if(p.kind==="bridge")return [{label:["拨动月叶","Turn moonleaf"],action:{type:"leaf"}},...bridgeNodes.map((_,i)=>({label:[["起点","岔路","树冠","地下","对岸"][i],["Start","Fork","Canopy","Roots","Far bank"][i]],action:{type:"step",i}}))];
 if(p.kind==="stars")return starEdges[p.node].map(i=>({label:["跳向星石 "+(i+1),"Jump to stone "+(i+1)],action:{type:"step",i}}));
 if(p.kind==="light")return [...(p.operation==="puzzle:lantern-show"?["鱼","蝴蝶","猫"].map((x,i)=>({label:[x,["Fish","Butterfly","Cat"][i]],action:{type:"shape",i}})):[]),...[[.2,"向左","Aim left"],[.5,"居中","Aim center"],[.72,"向右","Aim right"]].map(([x,zh,en])=>({label:[zh,en],action:{type:"aim",x}})),{label:p.operation==="puzzle:lantern-show"?["继续庆典","Continue festival"]:["走过石桥","Cross the bridge"],action:{type:"cross"}}];
 return chaseLoop.map(([x,y],i)=>({label:["跑向街角 "+(i+1),"Run to corner "+(i+1)],action:{type:"target",x,y}}));
}
export function paintSpatial(c,p,W,H,lang,drawCat,drawNpc){
 const tr=(a,b)=>lang==="zh"?a:b,pt=q=>[q[0]*W,q[1]*H],dot=(q,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(...pt(q),r,0,Math.PI*2);c.fill()},line=(a,b,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap="round";c.beginPath();c.moveTo(...pt(a));c.lineTo(...pt(b));c.stroke()},label=(s,q,size=18)=>{c.font="600 "+size+"px sans-serif";c.textAlign="center";c.fillStyle="#fff5db";c.fillText(s,...pt(q),W*.92)};
 c.save();c.fillStyle="#182a34b8";c.fillRect(0,0,W,H);
 if(p.kind==="bridge"){
  const a=p.operation==="puzzle:moonleaf-loop"?1-p.branch:p.branch;const nodes=bridgeNodes;line(nodes[0],nodes[1],"#9b9b74",22);line(nodes[2],nodes[4],"#9b9b74",22);line(nodes[3],nodes[4],"#9b9b74",22);line(nodes[1],nodes[a===0?2:3],"#b9df9c",24);line(nodes[1],nodes[a===0?3:2],"#5b786b55",5);nodes.forEach((q,i)=>dot(q,18,i===p.node?"#f6d98c":"#819e80"));dot([.36,.25],27,"#94cc7d");label(tr("月叶","Moonleaf"),[.36,.18]);label(tr("树冠日光台","Sunlit canopy"),[.62,.23]);label(tr("反光菌群","Glowing fungi"),[.62,.83]);for(let i=0;i<6;i++)dot([.55+i*.025,.77+Math.sin(i)*.02],3+i%3,"#b9e4db");drawCat?.(...nodes[p.node]);label(tr("拨月叶改变桥的落点，再走过去","Turn the moonleaf, then cross"),[.5,.08],22);
 }else if(p.kind==="stars"){
  for(let i=0;i<starNodes.length;i++){const q=starNodes[i],lit=i===p.node||starEdges[p.node].includes(i);if(lit){const [x,y]=pt(q),g=c.createRadialGradient(x,y,1,x,y,46);g.addColorStop(0,"#f4df8c88");g.addColorStop(1,"#f4df8c00");c.fillStyle=g;c.fillRect(x-46,y-46,92,92);}dot(q,18,lit?"#e7d59e":"#51616a");}drawCat?.(...starNodes[p.node]);label(tr("只有相邻星石被照亮","Only neighboring stones light up"),[.5,.08],22);
 }else if(p.kind==="light"){
  const angle=p.angle,show=p.operation==="puzzle:lantern-show",size=24+Math.abs(angle-.5)*110;const lamp=[angle,.24],shadow=[1-angle*.65,.57];dot(lamp,18,"#ffe5a7");const [lx,ly]=pt(lamp);const g=c.createRadialGradient(lx,ly,5,lx,ly,W*.58);g.addColorStop(0,"#ffdc9c88");g.addColorStop(1,"#ffdc9c00");c.fillStyle=g;c.fillRect(0,0,W,H);if(show){const [x,y]=pt(shadow);c.fillStyle="#17212d";c.beginPath();c.ellipse(x,y,size,size*.6,angle-.5,0,Math.PI*2);c.fill();if(p.shape===0){c.beginPath();c.moveTo(x-size,y);c.lineTo(x-size*1.6,y-size*.6);c.lineTo(x-size*1.6,y+size*.6);c.fill();}else if(p.shape===1){dot([shadow[0]-.045,.53],size*.65,"#17212d");dot([shadow[0]+.045,.53],size*.65,"#17212d");}else{for(const d of [-1,1]){c.beginPath();c.moveTo(x+d*size*.55,y-size*.25);c.lineTo(x+d*size*.9,y-size);c.lineTo(x+d*size*.15,y-size*.4);c.fill();}}drawNpc?.("xiaomao",shadow[0],.77,.65);label(tr("移动灯笼，看看影子怎么变","Move the lantern and watch the shadow"),[.5,.08],22);}else{const lit=Math.abs(angle-.72)<=.14;line([.22,.64],[.82,.64],lit?"#dbcba7":"#25323c",40);if(Math.abs(angle-.2)<.15)label(tr("壁龛：第一盏歪耳灯","Alcove: the first crooked-ear lantern"),[.28,.43]);drawCat?.(.19,.64);label(tr("照亮石桥，再走过去","Light the stone bridge before crossing"),[.5,.08],22);}label(tr("拖动灯光","Drag the light"),[angle,.34]);
 }else{
  for(let i=0;i<4;i++)line(chaseLoop[i],chaseLoop[(i+1)%4],"#cbb79855",15);line([.2,.5],[.8,.5],"#c7a87588",10);const q=chasePoint(p);dot(q,23,"#f3d68555");dot(q,10,"#fff3b3");drawCat?.(...p.player);label(tr("抄近路或沿街追上光团","Intercept the moving chime"),[.5,.08],22);
 }
 if(p.warning)label(tr("这条路不通，换个办法","That route is blocked. Try another."),[.5,.94],16);c.restore();
}
