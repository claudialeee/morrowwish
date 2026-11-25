// Lighting and cinematic treatment over the existing original Emberforge painting.
const W=960,H=540;
const local=(l,zh,en)=>l==="zh"?zh:en;
export function forgeObjective(v,explorer,l){
 const part=explorer?.forgeStep?.();
 if(part)return local(l,"旧工坊 · "+part.name[0],"Old workshop · "+part.name[1]);
 return local(l,...(v.current?.id==="forge:E-01"?["沿街道找到烬婆和小铆，了解停炉原因","Meet Jinpo and Xiaomao along the street"]:v.current?.id==="forge:E-02"?["重组安全图纸，了解旧事故","Reassemble the safety blueprint and uncover the accident"]:v.current?.id==="forge:E-03"?["调节炉温与压力，协力击败机械守卫","Balance heat and pressure, then face the guardian"]:["修复炉心，邀请两位居民共同奏响承火调","Repair the hearth and invite both residents to perform the Song of Ember"]));
}
export function paintForgeEnvironment(ctx,v,frame,forced=null){
 const t=frame/60,restored=forced??v.melodies.includes("forge"),testing=!restored&&(v.current?.id==="forge:E-03"||v.sanctuaries.includes("forge"));
 const x=.59*W,y=.27*H;ctx.save();
 if(!restored&&!testing){ctx.fillStyle="rgba(14,27,39,.28)";ctx.fillRect(0,0,W,H);}if(!restored){const cold=ctx.createRadialGradient(x,y,18,x,y,165);cold.addColorStop(0,testing?"rgba(25,37,48,.28)":"rgba(25,37,48,.86)");cold.addColorStop(.56,testing?"rgba(25,37,48,.14)":"rgba(25,37,48,.65)");cold.addColorStop(1,"rgba(25,37,48,0)");ctx.fillStyle=cold;ctx.fillRect(x-165,y-165,330,330);}
 const glow=ctx.createRadialGradient(x,y,5,x,y,restored?320:155);
 glow.addColorStop(0,restored?"rgba(255,185,94,.55)":testing?"rgba(255,104,46,.28)":"rgba(156,167,180,.04)");
 glow.addColorStop(1,"rgba(255,140,50,0)");ctx.globalCompositeOperation="screen";ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 if(restored||testing){for(let i=0;i<(restored?55:22);i++){const a=(i*.173+t*(.09+(i%4)*.013))%1,px=x+Math.sin(i*2.4+t*.31)*a*185,py=y+25-a*160;ctx.globalAlpha=(1-a)*(.4+.25*Math.sin(i+t));ctx.fillStyle=i%3?"#ffb15e":"#ffe4ab";ctx.beginPath();ctx.ellipse(px,py,1+i%3*.55,2+i%3,0,0,Math.PI*2);ctx.fill();}}
 ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
 for(let i=0;i<9;i++){const a=(t*.16+i/9)%1,px=(.65+i%3*.065)*W+Math.sin(a*3+i)*24,py=.48*H-a*95;const g=ctx.createRadialGradient(px,py,1,px,py,16+a*28);g.addColorStop(0,"rgba(214,224,227,"+((1-a)*(testing?.18:restored?.09:.04))+")");g.addColorStop(1,"rgba(214,224,227,0)");ctx.fillStyle=g;ctx.fillRect(px-48,py-48,96,96);}
 ctx.restore();
}
export function paintForgeCeremony(ctx,img,t,l,actor){
 const u=Math.min(1,t/3),z=1+.27*u*u*(3-2*u);ctx.save();ctx.translate(-W*.67*(z-1),-H*.32*(z-1));ctx.scale(z,z);ctx.drawImage(img,0,0,W,H);paintForgeEnvironment(ctx,{melodies:[],sanctuaries:[],current:{id:"forge:E-03"}},t*60,t>1.2);
 actor("jinpo",[.54,.48]);actor("xiaomao",[.64,.48]);actor("muling",[.70,.51]);
 const x=.59*W,y=.27*H;for(let i=0;i<3;i++){const a=Math.max(0,t-.5-i*.6)%2;ctx.strokeStyle="rgba(255,218,151,"+Math.max(0,.65-a*.3)+")";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,18+a*75,8+a*29,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();const shade=ctx.createLinearGradient(0,H*.70,0,H);shade.addColorStop(0,"rgba(17,21,28,0)");shade.addColorStop(1,"rgba(17,21,28,.88)");ctx.fillStyle=shade;ctx.fillRect(0,H*.70,W,H*.30);ctx.textAlign="center";ctx.fillStyle="#ffe4b0";ctx.font="600 30px Georgia,serif";ctx.fillText(local(l,"承火调","The Song of Ember"),W/2,H*.86);ctx.font="500 16px system-ui";ctx.fillText(local(l,"中央熔炉重新点燃 · 城市开始回应","The central furnace reignites · The city answers"),W/2,H*.93);
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
