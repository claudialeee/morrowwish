/* Cat Bond single-cat ULT effects: eight distinct spells, keyed by skill.id.
 * Localized Canvas2D combat VFX; NO full-screen blackout, flash, freeze, cut-in
 * or separate images. Back pass sits under kittens; sparse front pass preserves
 * kitten faces and all HUD/aim information. Duo cinematics are not touched.
 */
(()=>{'use strict';
const PI=Math.PI,T=PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const h=n=>{const x=Math.sin(n*91.97+33.07)*43758.545;return x-Math.floor(x)};
const ID=Object.freeze(['sunflare','tsunamiPaw','sunbloom','thunderYowl',
 'voidMaw','moonlitHalo','moonfang']);
const col={
 sunflare:['#e95231','#ffb352','#fff4c9'],
 tsunamiPaw:['#2784b5','#7bdded','#eefeff'],
 sunbloom:['#559d65','#c8ed93','#fff4b8'],
 thunderYowl:['#779ddc','#ffe29a','#ffffff'],
 voidMaw:['#514079','#a983dd','#f4dcff'],
 moonlitHalo:['#a5a4d4','#fff0bf','#ffffff'],
 moonfang:['#7d80c7','#d3d3ff','#fffcf2']
};
function ring(c,x,y,r,c0,w,a,yr=1){
 c.globalAlpha=a;c.lineWidth=w;c.strokeStyle=c0;c.beginPath();
 c.ellipse(x,y,Math.max(1,r),Math.max(1,r*yr),0,0,T);c.stroke();
}
function glow(c,x,y,r,color,a){
 const g=c.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,color);g.addColorStop(.35,color);g.addColorStop(1,'rgba(0,0,0,0)');
 c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,T);c.fill();
}
function star(c,x,y,r,color,a){
 c.globalAlpha=a;c.strokeStyle=color;c.lineWidth=Math.max(.8,r*.18);c.lineCap='round';
 c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);
 c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();
}
function bolt(c,x,y,ex,ey,i,time,alpha){
 const dx=ex-x,dy=ey-y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
 const pts=[[x,y]],tick=Math.floor(time*20);
 for(let j=1;j<10;j++){
  const t=j/10,off=(h(i*23+j*1.2+tick)-.5)*d*.13;
  pts.push([x+dx*t+nx*off,y+dy*t+ny*off]);
 }pts.push([ex,ey]);
 // Indigo outline preserves contrast on the bright watercolor garden floor.
 for(const [w,color,a] of [[15,'#4b55aa',.29],[8,'#5f80d5',.60],[3.5,'#ffe5a0',1],[1.6,'#fffdf0',1]]){
  c.globalAlpha=alpha*a;c.lineWidth=w;c.strokeStyle=color;c.beginPath();
  pts.forEach((p,j)=>j?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();
 }
 for(let j=3;j<8;j+=3){
  const p=pts[j];c.globalAlpha=alpha*.5;c.strokeStyle='#e6f7ff';c.lineWidth=1.6;
  c.beginPath();c.moveTo(p[0],p[1]);
  c.lineTo(p[0]+dx*.23,p[1]-dy*.13);c.stroke();
 }
}
function sunflare(c,s){
 const {x,y,R,p,a,angle,front}=s;
 c.save();c.translate(x,y);c.rotate(angle);
 if(front){
  for(let j=0;j<12;j++){
   const ang=(h(j+2)-.5)*1.13,rad=40+R*p*(.4+.6*h(j+20));
   star(c,Math.cos(ang)*rad,Math.sin(ang)*rad,2.3,'#fff7b8',a*.67);
  }
 }else{
  glow(c,R*p*.35,0,R*.85,'#ff9a4b',a*.12);
  for(let j=0;j<19;j++){
   const ang=(h(j+7)-.5)*1.14,len=R*p*(.5+.48*h(j+18));
   c.save();c.rotate(ang);c.globalAlpha=a*(j%3===0?.85:.62);
   const grad=c.createLinearGradient(0,-14,len,0);
   grad.addColorStop(0,'#d94330');grad.addColorStop(.5,j%2?'#ffae56':'#ff7d38');
   grad.addColorStop(1,j%3===0?'#fff3aa':'#ffc66e');c.fillStyle=grad;
   c.beginPath();c.moveTo(8,-7);c.bezierCurveTo(len*.15,-25,len*.62,-26,len+16,0);
   c.bezierCurveTo(len*.62,17,len*.2,21,8,7);c.closePath();c.fill();c.restore();
  }
 }c.restore();
}
function tsunamiPaw(c,s){
 const {x,y,R,p,a,front,time}=s,r=24+R*p;
 if(front){
  for(let j=0;j<17;j++){
   const th=j*2.4,rr=35+R*p*(.3+h(j+21)*.7);
   const xx=x+Math.cos(th)*rr,yy=y+Math.sin(th)*rr*.53;
   c.globalAlpha=a*.68;c.fillStyle=j%3?'#d1fdff':'#fff';
   c.beginPath();c.arc(xx,yy,2+h(j+3)*3,0,T);c.fill();
  }
 }else{
  glow(c,x,y,R*.9,'#6dd6ed',a*.11);
  for(let band=0;band<3;band++){
   const rad=r-band*12;
   const g=c.createLinearGradient(x,y-r*.70,x,y+r*.25);
   g.addColorStop(0,'rgba(212,251,255,.80)');
   g.addColorStop(.5,band?'rgba(92,202,236,.42)':'rgba(39,126,191,.46)');
   g.addColorStop(1,'rgba(53,144,181,.02)');
   c.globalAlpha=a*(band===2?.73:.52);c.fillStyle=g;c.beginPath();
   c.moveTo(x-rad,y+6);
   c.bezierCurveTo(x-rad*.89,y-rad*.75,x+rad*.15,y-rad*(1.18+Math.sin(time*7)*.03),x+rad,y-3);
   c.bezierCurveTo(x+rad*.44,y-rad*.42,x-rad*.51,y-rad*.39,x-rad,y+6);
   c.closePath();c.fill();
   c.globalAlpha=a*(band===2?.88:.47);c.strokeStyle=band===2?'#eaffff':'#76d5eb';
   c.lineWidth=band===2?3:7;c.beginPath();c.moveTo(x-rad,y+6);
   c.bezierCurveTo(x-rad*.89,y-rad*.75,x+rad*.15,y-rad*1.18,x+rad,y-3);c.stroke();
  }
  ring(c,x,y,r,r>0?'#b3f8ff':'#fff',3,a*.44,.32);
 }
}
function drawSolarCharge(c,g,p,time){
 p=clamp(p);const r=9+19*p;
 c.save();c.translate(g.x,g.y);c.rotate(g.aim);
 const trail=c.createLinearGradient(0,0,g.reach,0);trail.addColorStop(0,'rgba(240,242,150,.24)');trail.addColorStop(1,'rgba(231,242,155,.04)');
 c.fillStyle=trail;c.globalAlpha=.45;c.fillRect(0,-g.width,g.reach,g.width*2);
 for(let j=0;j<13;j++){const th=j*T/13+time*2.7,rr=58*(1-p)+r,xx=Math.cos(th)*rr,yy=Math.sin(th)*rr*.82;c.strokeStyle=j%2?'#d4e89c':'#fff2ae';c.lineWidth=2;c.globalAlpha=.35+.45*p;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx*.6+7,yy*.35,5,0);c.stroke();}
 glow(c,7,0,r*1.7,'#e9f6b0',.55*p);glow(c,7,0,r,'#fff7ba',.85);c.restore();
}
function sunbloom(c,s){
 const {x,y,R,p,a,front,time,angle}=s,L=s.reach||R*2,w=(s.width||36)*.72,k=Math.min(1,p*5);
 if(!Number.isFinite(L)||L<=0)return;
 c.save();c.translate(x,y);c.rotate(angle);
 if(!front){
  const g=c.createLinearGradient(0,-w,0,w);g.addColorStop(0,'rgba(101,163,80,0)');g.addColorStop(.16,'#c99a42');g.addColorStop(.42,'#ffe8a0');g.addColorStop(.5,'#ffffdf');g.addColorStop(.58,'#fff3b4');g.addColorStop(.84,'#d3a84e');g.addColorStop(1,'rgba(104,154,76,0)');
  const end=L*k;
  c.globalAlpha=a*.84;c.fillStyle=g;c.beginPath();c.moveTo(0,-9);
  for(let i=0;i<=24;i++){let u=i/24,xx=end*u,yy=-w*(.30+.70*Math.sin(Math.PI*u*.84))*(1+.09*Math.sin(u*24-time*16));c.lineTo(xx,yy);}
  for(let i=24;i>=0;i--){let u=i/24,xx=end*u,yy=w*(.30+.70*Math.sin(Math.PI*u*.84))*(1+.09*Math.sin(u*24+time*15));c.lineTo(xx,yy);}c.closePath();c.fill();
  c.globalAlpha=a*.92;c.strokeStyle='#fffde0';c.lineWidth=w*.36;c.lineCap='round';c.beginPath();c.moveTo(4,0);c.lineTo(end,0);c.stroke();
  glow(c,10,0,w*.8,'#fff6bb',a*.65);
 }else{
  for(let j=0;j<16;j++){const u=(h(j+4)+time*1.7)%1;if(u>k)continue;const xx=u*L,yy=(h(j+8)-.5)*w*1.6;c.globalAlpha=a*.75;c.strokeStyle=j%3?'#e9f6be':'#fffbe8';c.lineWidth=1.6+h(j)*2;c.beginPath();c.moveTo(xx-10,yy);c.lineTo(xx+14,yy*.8);c.stroke();}
 }
 c.restore();
}
function thunderYowl(c,s){
 const {x,y,p,a,front,targets,time}=s;
 // Vertical strikes are anchored to enemies the actual ultimate hit.
 if(!targets.length)return;
 for(let j=0;j<Math.min(7,targets.length);j++){
   const d=targets[j],q=clamp(p*2.8-j*.06),r=21+12*q;
   if(front){if(q>0&&q<.9)bolt(c,d.x-7,d.y-88*q,d.x,d.y,j,time,a*.9);
     star(c,d.x,d.y-8,6*(1-q)+2,'#fffbe1',a*.86);
   }else{glow(c,d.x,d.y-6,r,'#a99bfa',a*.35);
     ring(c,d.x,d.y+9,r*q,'#c9c2ff',2.4,a*.67,.52);
     for(let k=0;k<4;k++){const th=k*T/4+q;bolt(c,d.x,d.y,d.x+Math.cos(th)*r,d.y+Math.sin(th)*r*.65,k+j*4,time,a*.55);}
   }
 }
}
function voidMaw(c,s){
 const {x,y,R,p,a,front,time}=s;
 if(front){
  for(let j=0;j<13;j++){
   const ang=j*2.4-time*2.5,rr=R*(.85-.68*p)*(h(j)+.16);
   star(c,x+Math.cos(ang)*rr,y+Math.sin(ang)*rr*.82,2.4,'#e9caff',a*.65);
  }
 }else{
  const r=Math.max(18,R*(1-.82*p));
  // A true dark event horizon UNDER the existing cat, not white rings on grass.
  c.globalAlpha=a*.23;c.fillStyle='#32204f';c.beginPath();
  c.ellipse(x,y,r*.67,r*.52,0,0,T);c.fill();
  glow(c,x,y,r*.86,'#57327d',a*.17);
  for(let j=0;j<8;j++){
   c.strokeStyle=j%2?'#7447b3':'#ac78d3';c.lineWidth=j%2?7:3;
   c.globalAlpha=a*(j%2?.6:.91);c.beginPath();
   for(let k=0;k<=26;k++){
    const t=k/26,theta=j*T/8+t*PI*1.8-time*2.4,rad=r*(1-t*.86);
    const px=x+Math.cos(theta)*rad,py=y+Math.sin(theta)*rad*.82;
    k?c.lineTo(px,py):c.moveTo(px,py);
   }c.stroke();
  }
  ring(c,x,y,r,'#8652c0',2.8,a*.66,.82);
 }
}
function moonlitHalo(c,s){
 const {x,y,R,p,a,front}=s,rad=25+R*p;
 if(front){
  for(let j=0;j<13;j++){
   const th=j*T/13,rr=rad*(.7+.3*h(j+2));
   star(c,x+Math.cos(th)*rr,y+Math.sin(th)*rr,3,'#fffbec',a*.75);
  }
 }else{
  for(let j=0;j<20;j++){
   const th=j*T/20,dx=Math.cos(th),dy=Math.sin(th);
   c.globalAlpha=a*.2;c.strokeStyle=j%2?'#fff5da':'#c8e8fa';
   c.lineWidth=j%2?4:8;c.beginPath();
   c.moveTo(x+dx*25,y+dy*25);c.lineTo(x+dx*rad,y+dy*rad);c.stroke();
  }
  ring(c,x,y,rad,'#fff5d5',5,a*.72);
  ring(c,x,y,rad*.69,'#d1e9ff',2.2,a*.62);
  glow(c,x,y,rad*.66,'#fff4dc',a*.12);
 }
}
function moonfang(c,s){
 const {x,y,R,p,a,front,angle,targets}=s;
 const target=targets[0]||{x:x+Math.cos(angle)*R*.64,y:y+Math.sin(angle)*R*.64};
 const ang=Math.atan2(target.y-y,target.x-x),r=Math.min(65,R*.52);
 if(front){
   window.CatBondMoonFX?.drawImpact(c,{x:target.x,y:target.y,angle:ang+.5,life:1-p,max:1,radius:r},s.time);
   window.CatBondMoonFX?.drawImpact(c,{x:target.x,y:target.y,angle:ang-.65,life:1-p,max:1,radius:r*.88},s.time);
 }else{
   const q=Math.min(1,p*3.4);
   for(const [offset,dy] of [[0,-12],[.18,12]]){
     const u=Math.max(0,q-offset);
     const dx=target.x-x,ddy=target.y-y;
     window.CatBondMoonFX?.drawProjectile(c,{kind:'crescent',x:x+dx*u,y:y+ddy*u+dy*Math.sin(PI*u),r:22,vx:dx,vy:ddy,ang},s.time);
   }
 }
}
// Seven currently registered ultimates. Starfall is a separate unimplemented design.
const paint=Object.freeze({sunflare,tsunamiPaw,sunbloom,thunderYowl,voidMaw,moonlitHalo,moonfang});
function has(id){return !!paint[id]}
function draw(ctx,v,W,H,time=0,layer='back'){
 if(!ctx||v?.kind!=='ultimate'||!has(v.skillId))return false;
 const p=ease(1-clamp(v.life/Math.max(.001,v.max))),fade=clamp(v.life/Math.max(.001,v.max)*2.3);
 if(fade<.004)return true;
 const R=Math.min(190,Math.max(72,Math.min(W,H)*.27));
 const s={x:v.x,y:v.y,R,p,a:fade*(layer==='front'?.85:1),
  angle:v.angle||0,targets:v.targets||[],reach:v.reach,width:v.width,time,front:layer==='front'};
 // Purple shadow and dark-blue thunder must not be bleached into white by
 // additive compositing over a bright garden floor. Other spells keep glow.
 ctx.save();ctx.globalCompositeOperation=
   v.skillId==='voidMaw'||v.skillId==='thunderYowl'?'source-over':'lighter';
 ctx.lineCap='round';ctx.lineJoin='round';
 paint[v.skillId](ctx,s);
 ctx.restore();return true;
}
window.CatBondUltVFX={ids:ID,has,draw,drawSolarCharge};
})();