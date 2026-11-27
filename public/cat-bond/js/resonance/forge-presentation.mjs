// Lighting and cinematic treatment over the existing original Emberforge painting.
const W=960,H=540;
const local=(l,zh,en)=>l==="zh"?zh:en;
export function forgeObjective(v,explorer,l){
 const s=v.current?.id;
 return local(l,...(s==="forge:E-01"?["选择灯的形状，给小猫们表演影子戏","Choose a lantern shape and put on a shadow show"]:s==="forge:E-02"?["移动灯光，照出真正的石桥","Move the lantern to reveal the real stone bridge"]:s==="forge:E-03"?["利用彩灯与伙伴击退剪影兽","Use the lanterns and your companions to defeat the shadow beast"]:["修复千灯圣所，邀请两位居民共同奏响承火调","Restore the Lantern sanctuary and invite both residents to perform the Song of Ember"]));
}
export function paintForgeEnvironment(ctx,v,frame,forced=null){
 const t=frame/60,restored=forced??v.melodies.includes("forge"),testing=!restored&&(v.current?.id==="forge:E-03"||v.sanctuaries.includes("forge"));
 ctx.save();
 // Discrete festival lanterns, not furnace plumes or steam.
 for(const [i,[nx,ny]] of [[.88,.30],[.74,.40],[.63,.50],[.35,.50],[.35,.76],[.24,.80]].entries()){
  const x=nx*W,y=ny*H,phase=.5+.5*Math.sin(t*2.1+i*1.7),radius=restored?49:testing?36:22;
  const g=ctx.createRadialGradient(x,y,1,x,y,radius);
  g.addColorStop(0,"rgba(255,202,113,"+((restored?.32:testing?.19:.10)*(.7+.3*phase))+")");g.addColorStop(1,"rgba(255,202,113,0)");
  ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
 }
 ctx.restore();
}
export function paintForgeCeremony(ctx,img,t,l,actor){
 const u=Math.min(1,t/3),z=.96+.04*u*u*(3-2*u);ctx.save();ctx.translate(W*(1-z)/2,H*(1-z)/2);ctx.scale(z,z);window.CatBondSceneFit.draw(ctx,img,W,H,{top:"#172532",bottom:"#574037"});paintForgeEnvironment(ctx,{melodies:[],sanctuaries:[],current:{id:"forge:E-03"}},t*60,t>1.2);
 actor("jinpo",[.54,.48]);actor("xiaomao",[.64,.48]);
 const x=.59*W,y=.27*H;for(let i=0;i<3;i++){const a=Math.max(0,t-.5-i*.6)%2;ctx.strokeStyle="rgba(255,218,151,"+Math.max(0,.65-a*.3)+")";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,18+a*75,8+a*29,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();if(t>2.8){ctx.save();ctx.globalAlpha=Math.min(1,(t-2.8)*2.4);forgeRouteDiagram(ctx,l);ctx.restore();}const shade=ctx.createLinearGradient(0,H*.70,0,H);shade.addColorStop(0,"rgba(17,21,28,0)");shade.addColorStop(1,"rgba(17,21,28,.88)");ctx.fillStyle=shade;ctx.fillRect(0,H*.70,W,H*.30);ctx.textAlign="center";ctx.fillStyle="#ffe4b0";ctx.font="600 30px Georgia,serif";ctx.fillText(local(l,"承火调","The Song of Ember"),W/2,H*.86);ctx.font="500 16px system-ui";ctx.fillText(local(l,"千灯重新亮起 · 城市开始回应","The lanterns shine again · The city answers"),W/2,H*.93);
}

export function paintForgeMarkers(ctx,markers,symbol,width){
 const small=width<650,r=small?15:12,fs=small?18:14,h=small?26:21;
 const cells=markers.map(m=>({...m,X:m.x*W,Y:m.y*H}));
 const boxes=cells.map(m=>[m.X-r-2,m.Y-r-2,2*r+4,2*r+4]);
 const overlap=(a,b)=>Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
 ctx.save();ctx.font="600 "+fs+"px system-ui";
 for(const m of cells){const {X,Y}=m;ctx.beginPath();ctx.arc(X,Y,r,0,Math.PI*2);ctx.fillStyle="#182a33e8";ctx.fill();ctx.strokeStyle=m.col;ctx.lineWidth=2;ctx.stroke();symbol(ctx,m.k,X,Y,small?.62:.54,m.col);}
 for(const m of cells){const {X,Y}=m,tw=Math.min(small?190:165,ctx.measureText(m.t).width+12);const candidates=[[X-tw/2,Y+r+5],[X+r+7,Y-h/2],[X-tw-r-7,Y-h/2],[X-tw/2,Y-r-h-5],[X-tw/2,Y+r+h+9],[X-tw/2,Y-r-2*h-10]].map(([x,y])=>[Math.max(3,Math.min(W-tw-3,x)),Math.max(3,Math.min(H-h-3,y)),tw,h]);let best=candidates[0],score=Infinity;for(const [i,q] of candidates.entries()){const n=boxes.reduce((s,b)=>s+overlap(q,b),0)*10+i*5;if(n<score){best=q;score=n;}}const [x,y]=best;boxes.push(best);ctx.strokeStyle=m.col+"a0";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X,Y);ctx.lineTo(Math.max(x,Math.min(x+tw,X)),Math.max(y,Math.min(y+h,Y)));ctx.stroke();ctx.beginPath();ctx.roundRect(x,y,tw,h,5);ctx.fillStyle="#142630ed";ctx.fill();ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff0d3";ctx.fillText(m.t,x+tw/2,y+h/2,tw-5);}
 ctx.restore();
}

function forgePlate(c,x,y,w,h,fill="#20313b",stroke="#b89562"){
 const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,fill);g.addColorStop(1,"#18252d");c.beginPath();c.roundRect(x,y,w,h,11);c.fillStyle=g;c.fill();c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();
}
function forgeText(c,s,x,y,size=16,color="#f3dfb8"){c.font="600 "+size+"px system-ui";c.textAlign="center";c.textBaseline="middle";c.fillStyle=color;c.fillText(s,x,y);}
function forgeLine(c,points,col,width=3){c.beginPath();for(const [i,p] of points.entries())i?c.lineTo(...p):c.moveTo(...p);c.strokeStyle=col;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();}
function forgeBolt(c,x,y){c.beginPath();c.arc(x,y,3.2,0,Math.PI*2);c.fillStyle="#b9a17b";c.fill();forgeLine(c,[[x-1.8,y],[x+1.8,y]],"#5d503d",.9);}
function forgePart(c,n,x,y,scale=1,lit=true){c.save();c.translate(x,y);c.scale(scale,scale);c.globalAlpha=lit?1:.28;
 c.strokeStyle="#ebc88d";c.lineWidth=3;c.fillStyle="#e7ad78";
 if(n===0){c.beginPath();c.ellipse(0,0,26,32,0,0,Math.PI*2);c.fill();c.stroke();}
 else if(n===1){forgeText(c,"✦",0,0,42,"#ffe3a7");}
 else {forgeLine(c,[[-24,24],[-24,-22],[24,-22],[24,24],[-24,24]],"#ebc88d",4);}

 c.restore();
}
function paintFestivalStars(c,p,l){
 const centers=[.30,.50,.70].map(x=>x*W), colors=["#ffd594","#b6e9fc","#ffd2e0"];
 c.save();
 forgePlate(c,166,103,628,342,"#604665","#dfbf96");
 forgeText(c,local(l,"点亮三盏星灯","Light the three festival stars"),480,137,25);
 for(let i=0;i<centers.length;i++){
  const x=centers[i],target=x+(p.goal[i]-1)*50,aim=x+(p.values[i]-1)*50,color=colors[i],lit=target===aim;
  for(const step of [-1,0,1]){c.beginPath();c.arc(x+step*50,228,3,0,Math.PI*2);c.fillStyle="#ba9eb0";c.fill();}
  const beam=c.createLinearGradient(x,340,aim,228);beam.addColorStop(0,color+"cc");beam.addColorStop(1,color+(lit?"ab":"44"));
  c.beginPath();c.moveTo(x-10,337);c.lineTo(aim-24,228);c.lineTo(aim+24,228);c.lineTo(x+10,337);c.closePath();c.fillStyle=beam;c.fill();
  if(lit){
   const glow=c.createRadialGradient(target,228,4,target,228,50);glow.addColorStop(0,color+"bb");glow.addColorStop(1,color+"00");c.fillStyle=glow;c.fillRect(target-50,178,100,100);
  }
  forgeText(c,lit?"✦":"✧",target,228,43,lit?color:"#f2e5ec");
  forgePlate(c,x-63,319,126,74,"#594563",color);
  forgeText(c,["↙","↑","↗"][p.values[i]],x,339,25,color);
  forgeText(c,[local(l,"左灯","Left light"),local(l,"中灯","Center light"),local(l,"右灯","Right light")][i],x,371,16);
 }
 c.restore();return true;
}
export function paintForgePuzzle(c,p,l){
 if(p.type==="lanternFocus")return paintFestivalStars(c,p,l);
 if(p.type!=="blueprint")return false;
 c.save();
 forgePlate(c,100,50,760,436,"#574551","#ddbb94");
 for(const x of [115,845])for(const y of [65,471])forgeBolt(c,x,y);
 forgeText(c,local(l,"旧工坊 · 节灯图纸","Old workshop · Festival lantern blueprint"),480,83,26);
 forgeText(c,local(l,"先搭灯架，再安灯罩，最后挂上灯芯。","Build the frame, fit the shade, then hang the light."),480,116,15,"#d7d7c4");
 forgeLine(c,[[330,208],[630,208]],"#c3aa7b",3);
 for(const [i,x] of [330,480,630].entries()){forgePlate(c,x-53,153,106,108,"#31464f",i<p.values.length?"#9cdac6":"#a88c61");if(i<p.values.length)forgePart(c,p.values[i],x,204,.96);else forgeText(c,"?",x,205,30,"#cfb685");}
 const names=[local(l,"灯罩","Shade"),local(l,"灯芯","Light"),local(l,"灯架","Frame")];
 for(const [i,name] of names.entries()){const x=(.3+i*.2)*W;forgePlate(c,x-65,294,130,92,"#4a463d","#b79b6d");forgePart(c,i,x,324,.63);forgeText(c,name,x,356,17);}
 c.restore();return true;
}
function forgeRouteDiagram(c,l){
 forgePlate(c,636,22,300,155,"#263942","#d2b683");
 forgeText(c,local(l,"圣所路由图","Sanctuary routing"),786,42,14);
 const a=[693,101],b=[868,72],d=[868,132];forgeLine(c,[a,b],"#e0c18a",3);c.setLineDash([7,5]);forgeLine(c,[a,d],"#a3d9cc",3);c.setLineDash([]);
 for(const [i,p] of [a,b,d].entries()){c.beginPath();c.arc(p[0],p[1],6,0,Math.PI*2);c.fillStyle=i===2?"#a3d9cc":"#e0c18a";c.fill();}
 forgeText(c,local(l,"赤炉","Forge"),a[0],a[1]+21,12);
 forgeText(c,local(l,"中央路径","Central route"),b[0],b[1]-15,12);
 forgeText(c,local(l,"相邻路径（中断）","Neighbor route · broken"),820,151,12,"#b4dacf");
}
