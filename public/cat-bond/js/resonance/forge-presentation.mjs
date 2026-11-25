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
 ctx.restore();if(t>2.8){ctx.save();ctx.globalAlpha=Math.min(1,(t-2.8)*2.4);forgeRouteDiagram(ctx,l);ctx.restore();}const shade=ctx.createLinearGradient(0,H*.70,0,H);shade.addColorStop(0,"rgba(17,21,28,0)");shade.addColorStop(1,"rgba(17,21,28,.88)");ctx.fillStyle=shade;ctx.fillRect(0,H*.70,W,H*.30);ctx.textAlign="center";ctx.fillStyle="#ffe4b0";ctx.font="600 30px Georgia,serif";ctx.fillText(local(l,"承火调","The Song of Ember"),W/2,H*.86);ctx.font="500 16px system-ui";ctx.fillText(local(l,"中央熔炉重新点燃 · 城市开始回应","The central furnace reignites · The city answers"),W/2,H*.93);
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
 const metal=c.createLinearGradient(-34,-20,28,22);metal.addColorStop(0,"#7d5a40");metal.addColorStop(.46,"#ddbb7d");metal.addColorStop(1,"#755941");c.fillStyle=metal;c.strokeStyle="#ddc08a";c.lineWidth=2;
 if(n===0){c.beginPath();c.moveTo(-29,15);c.lineTo(-29,-9);c.quadraticCurveTo(-29,-23,-14,-23);c.lineTo(13,-23);c.quadraticCurveTo(28,-23,28,-8);c.lineTo(28,15);c.strokeStyle="#b18b5b";c.lineWidth=13;c.stroke();c.strokeStyle="#ebc88d";c.lineWidth=2;c.stroke();for(const xx of [-29,28]){c.fillRect(xx-9,10,18,9);forgeBolt(c,xx,14);}}
 else if(n===1){c.fillRect(-29,-8,58,16);c.strokeRect(-29,-8,58,16);c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.fill();c.stroke();forgeLine(c,[[0,-17],[0,-27]],"#d4b481",5);c.beginPath();c.arc(0,-27,12,0,Math.PI*2);c.strokeStyle="#e2c18c";c.lineWidth=3;c.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;forgeLine(c,[[0,-27],[Math.cos(a)*11,-27+Math.sin(a)*11]],"#c4a16b",1.6);}}
 else {c.fillRect(-29,-22,9,44);c.fillRect(20,-22,9,44);c.fillRect(-29,-22,58,8);c.fillRect(-29,14,58,8);forgeLine(c,[[-21,-14],[20,14],[20,-14],[-21,14]],"#b99362",5);for(const xx of [-25,25])for(const yy of [-18,18])forgeBolt(c,xx,yy);}
 c.restore();
}
function forgeGauge(c,x,y,v,target,max,name,color){const r=54,a0=Math.PI*.75,arc=Math.PI*1.5;c.save();c.translate(x,y);c.beginPath();c.arc(0,0,r+7,0,Math.PI*2);c.fillStyle="#253842";c.fill();c.strokeStyle="#ab875a";c.lineWidth=3;c.stroke();c.beginPath();c.arc(0,0,r-4,a0,a0+arc);c.strokeStyle="#3e5358";c.lineWidth=6;c.stroke();c.beginPath();c.arc(0,0,r-4,a0,a0+arc*Math.max(0,Math.min(1,v/max)));c.strokeStyle=color;c.lineWidth=6;c.stroke();for(let i=0;i<=10;i++){const a=a0+arc*i/10;forgeLine(c,[[Math.cos(a)*(r-9),Math.sin(a)*(r-9)],[Math.cos(a)*(r-17),Math.sin(a)*(r-17)]],"#b7bcaa",1.2);}const at=a0+arc*target/max;forgeLine(c,[[Math.cos(at)*(r-13),Math.sin(at)*(r-13)],[Math.cos(at)*(r+1),Math.sin(at)*(r+1)]],"#a5ecdb",4);const a=a0+arc*v/max;forgeLine(c,[[0,0],[Math.cos(a)*(r-17),Math.sin(a)*(r-17)]],color,3);c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fillStyle="#d6c098";c.fill();forgeText(c,name,0,-r-19,17);forgeText(c,v+" / "+target,0,31,16,v===target?"#b4f4d7":"#f2c68f");c.restore();}
export function paintForgePuzzle(c,p,l,actor){
 if(!["heat","blueprint"].includes(p.type))return false;
 c.save();c.fillStyle="rgba(9,17,22,.63)";c.fillRect(0,0,W,H);forgePlate(c,100,50,760,436,"#304047","#c8a06a");
 for(const x of [115,845])for(const y of [65,471])forgeBolt(c,x,y);
 const heat=p.type==="heat";
 forgeText(c,heat?local(l,"熔炉控制台","Furnace control station"):local(l,"旧工坊 · 安全图纸","Old workshop · Safety blueprint"),480,83,26);
 forgeText(c,heat?local(l,"加热升温升压 · 泄压保留温度 · 冷却同时降低两者","Heat raises both readings · Vent holds heat · Coolant lowers both"):local(l,"承重结构在先，冷却管路其次，独立泄压装置最后。","Fit the frame, connect the cooling circuit, then install the relief valve."),480,116,15,"#d7d7c4");
 if(heat){
  forgeGauge(c,350,209,p.values[0],p.goal[0],70,local(l,"炉温","Temperature"),"#f5b06b");
  forgeGauge(c,610,209,p.values[1],p.goal[1],45,local(l,"炉压","Pressure"),"#98e2d8");
  actor?.("jinpo",[.16,.46],.8);actor?.("xiaomao",[.84,.46],.8);
  forgeText(c,local(l,"烬婆 · 冷却","Jinpo · Coolant"),158,264,12,"#d4c3a7");forgeText(c,local(l,"小铆 · 泄压","Xiaomao · Relief"),802,264,12,"#d4c3a7");
 }else{
  const xs=[330,480,630];forgeLine(c,[[330,208],[630,208]],"#c3aa7b",3);
  for(const [i,x] of xs.entries()){forgePlate(c,x-53,153,106,108,"#31464f",i<p.values.length?"#9cdac6":"#a88c61");if(i<p.values.length)forgePart(c,p.values[i],x,204,.96);else forgeText(c,"?",x,205,30,"#cfb685");forgeText(c,String(i+1),x,274,13,"#d7c294");}
 }
 const names=heat?[[local(l,"加热","Heat"),"+5 / +5"],[local(l,"泄压","Vent"),"0 / −5"],[local(l,"冷却","Cool"),"−5 / −10"]]:[[local(l,"管路","Pipes"),""],[local(l,"阀门","Valve"),""],[local(l,"炉架","Frame"),""]];
 for(const [i,[name,sub]] of names.entries()){const x=(.3+i*.2)*W;forgePlate(c,x-65,294,130,92,"#4a463d","#b79b6d");if(heat){forgeText(c,["↑","↘","↓"][i],x,318,25,i===0?"#f5b06b":"#a6e6d4");forgeText(c,sub,x,365,12,"#cdd5c7");}else forgePart(c,i,x,324,.63);forgeText(c,name,x,347,17);}
 const foot=heat?(p.mistakes?local(l,"安全联锁已触发 · 重新校准","Safety interlock triggered · Recalibrate"):local(l,"绿色刻线为目标值。两项同时达标才会启动。","Green ticks mark the targets. Both readings must match.")):(p.mistakes?local(l,"安装顺序不正确 · 已拆回零件","Incorrect assembly order · Parts returned"):local(l,"已收集三件零件 · 按照图纸重组","All three parts collected · Rebuild the assembly"));
 forgeText(c,foot,480,430,15,p.mistakes?"#f5bc99":"#a7e6d3");c.restore();return true;
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
