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
 const x=.88*W,y=.30*H;ctx.save();
 if(!restored&&!testing){ctx.fillStyle="rgba(14,27,39,.26)";ctx.fillRect(0,0,W,H);}
 const glow=ctx.createRadialGradient(x,y,5,x,y,restored?320:155);
 glow.addColorStop(0,restored?"rgba(255,185,94,.55)":testing?"rgba(255,104,46,.28)":"rgba(156,167,180,.04)");
 glow.addColorStop(1,"rgba(255,140,50,0)");ctx.globalCompositeOperation="screen";ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 if(restored||testing){for(let i=0;i<(restored?55:22);i++){const a=(i*.173+t*(.09+(i%4)*.013))%1,px=x+Math.sin(i*2.4+t*.31)*a*185,py=y+25-a*160;ctx.globalAlpha=(1-a)*(.4+.25*Math.sin(i+t));ctx.fillStyle=i%3?"#ffb15e":"#ffe4ab";ctx.beginPath();ctx.ellipse(px,py,1+i%3*.55,2+i%3,0,0,Math.PI*2);ctx.fill();}}
 ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
 for(let i=0;i<9;i++){const a=(t*.16+i/9)%1,px=(.65+i%3*.065)*W+Math.sin(a*3+i)*24,py=.48*H-a*95;const g=ctx.createRadialGradient(px,py,1,px,py,16+a*28);g.addColorStop(0,"rgba(214,224,227,"+((1-a)*(testing?.18:restored?.09:.04))+")");g.addColorStop(1,"rgba(214,224,227,0)");ctx.fillStyle=g;ctx.fillRect(px-48,py-48,96,96);}
 ctx.restore();
}
export function paintForgeCeremony(ctx,img,t,l,actor){
 const u=Math.min(1,t/3),z=1+.27*u*u*(3-2*u);ctx.save();ctx.translate(-W*.83*(z-1),-H*.30*(z-1));ctx.scale(z,z);ctx.drawImage(img,0,0,W,H);paintForgeEnvironment(ctx,{melodies:[],sanctuaries:[],current:{id:"forge:E-03"}},t*60,t>1.2);
 actor("jinpo",[.76,.43]);actor("xiaomao",[.84,.42]);actor("muling",[.92,.44]);
 const x=.88*W,y=.30*H;for(let i=0;i<3;i++){const a=Math.max(0,t-.5-i*.6)%2;ctx.strokeStyle="rgba(255,218,151,"+Math.max(0,.65-a*.3)+")";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,18+a*75,8+a*29,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();const shade=ctx.createLinearGradient(0,H*.70,0,H);shade.addColorStop(0,"rgba(17,21,28,0)");shade.addColorStop(1,"rgba(17,21,28,.88)");ctx.fillStyle=shade;ctx.fillRect(0,H*.70,W,H*.30);ctx.textAlign="center";ctx.fillStyle="#ffe4b0";ctx.font="600 30px Georgia,serif";ctx.fillText(local(l,"承火调","The Song of Ember"),W/2,H*.86);ctx.font="500 16px system-ui";ctx.fillText(local(l,"中央熔炉重新点燃 · 城市开始回应","The central furnace reignites · The city answers"),W/2,H*.93);
}
