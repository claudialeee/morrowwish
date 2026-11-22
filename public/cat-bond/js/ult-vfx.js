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
 'voidMaw','moonlitHalo','moonfang','purrNova']);
const col={
 sunflare:['#e95231','#ffb352','#fff4c9'],
 tsunamiPaw:['#2784b5','#7bdded','#eefeff'],
 sunbloom:['#559d65','#c8ed93','#fff4b8'],
 thunderYowl:['#779ddc','#ffe29a','#ffffff'],
 voidMaw:['#514079','#a983dd','#f4dcff'],
 moonlitHalo:['#a5a4d4','#fff0bf','#ffffff'],
 moonfang:['#7d80c7','#d3d3ff','#fffcf2'],
 purrNova:['#db4e32','#ffae60','#fff0a6']
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
function sunbloom(c,s){
 const {x,y,R,p,a,front}=s;
 if(front){
  for(let j=0;j<13;j++){
   const th=j*2.399,rr=R*p*(.23+h(j+7)*.77);
   star(c,x+Math.cos(th)*rr,y+Math.sin(th)*rr,2.7,j%2?'#fff1ad':'#f6d3c6',a*.77);
  }
 }else{
  glow(c,x,y,R*.87,'#e3eda5',a*.09);
  for(let j=0;j<15;j++){
   c.save();c.translate(x,y);c.rotate(j*T/15+.1);
   const len=R*p*(.70+.30*h(j+4));
   c.strokeStyle=j%2?'#7bc187':'#d4e79c';c.globalAlpha=a*.85;
   c.lineWidth=2.8;c.beginPath();c.moveTo(6,0);
   c.bezierCurveTo(len*.27,-20,len*.61,23,len,Math.sin(j)*10);c.stroke();
   for(let k=1;k<=3;k++){
    const bx=len*k/4,by=Math.sin(j+k)*11;
    c.save();c.translate(bx,by);c.rotate(k%2?-.55:.65);
    c.fillStyle=k%2?'#81c687':'#e1e99f';c.globalAlpha=a*.75;
    c.beginPath();c.ellipse(0,0,8*p+1,3.8*p+1,0,0,T);c.fill();c.restore();
   }
   c.restore();
  }
  ring(c,x,y,20+R*p,'#eaf4bd',2.8,a*.4,.40);
 }
}
function thunderYowl(c,s){
 const {x,y,R,p,a,front,targets,time}=s;
 const dst=targets.length?targets:[{x:x+R,y:y-80},{x:x-R*.64,y:y-45},{x,y:y-R}];
 // Arcs must finish reaching real enemy positions early in the cast. The
 // old p fraction only reached half the target at the hero frame.
 const reach=Math.min(1,p*2.8);
 if(front){
  for(let j=0;j<Math.min(6,dst.length);j++){
   const d=dst[j];bolt(c,x,y,x+(d.x-x)*reach,y+(d.y-y)*reach,j,time,a*.70);
  }
  for(let j=0;j<11;j++){
   const th=j*T/11+time*2,rr=20+R*p*.82;
   star(c,x+Math.cos(th)*rr,y+Math.sin(th)*rr,2.8,'#ffe7a1',a*.85);
  }
 }else{
  for(let j=0;j<Math.min(7,dst.length);j++){
   const d=dst[j],dx=d.x-x,dy=d.y-y;
   bolt(c,x,y,x+dx*reach,y+dy*reach,j,time,a*.78);
   star(c,x+dx*reach,y+dy*reach,4.8,'#fff8e4',a*.8);
  }
  ring(c,x,y,16+R*.45*p,'#eccf71',2.8,a*.32,.70);
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
 const cx=x+(target.x-x)*Math.min(1,p*2.5),cy=y+(target.y-y)*Math.min(1,p*2.5);
 const ang=Math.atan2(target.y-y,target.x-x);
 c.save();c.translate(cx,cy);c.rotate(ang);
 // Huge separate double moon-fang CROSS-SLASH, not the nova's centered rings.
 for(let j=0;j<2;j++){
  if(front!==!!j)continue;
  c.globalAlpha=a*(j?.86:.67);c.strokeStyle=j?'#fff9eb':'#a9b9f7';
  c.lineWidth=j?3.2:12;c.lineCap='round';c.beginPath();
  c.moveTo(-R*.48,-R*.46+j*12);
  c.bezierCurveTo(R*.18,-R*.40,R*.50,R*.03,R*.38,R*.50+j*5);
  c.stroke();
  c.beginPath();c.moveTo(-R*.20,R*.47-j*9);
  c.bezierCurveTo(R*.42,R*.25,R*.52,-R*.24,R*.14,-R*.52-j*5);c.stroke();
 }
 if(front)for(let j=0;j<8;j++){
  const th=j*2.4,rr=R*.36*p;
  star(c,Math.cos(th)*rr,Math.sin(th)*rr,2.5,'#fff5ed',a*.8);
 }
 c.restore();
}
function purrNova(c,s){
 const {x,y,R,p,a,front,time}=s;
 if(front){
  for(let j=0;j<20;j++){
   const th=j*T/20+time*.6,rr=R*p*(.65+.30*h(j));
   star(c,x+Math.cos(th)*rr,y+Math.sin(th)*rr,2.5,'#fff2b2',a*.78);
  }
 }else{
  // FULL CIRCLE EXPLOSION: a scorched ground disc with 12 jagged radial petals.
  // Visually and geometrically distinct from sunflare's forward cone.
  const r=R*p;ring(c,x,y,18+r,'#ffbf64',7,a*.7,.68);
  for(let j=0;j<14;j++){
   const th=j*T/14+time*.3,reach=r*(.7+.28*h(j+8));
   c.save();c.translate(x,y);c.rotate(th);
   c.globalAlpha=a*(j%3?.58:.88);
   c.fillStyle=j%3===0?'#fff0a8':j%3===1?'#ffb357':'#fc6b3e';
   c.beginPath();c.moveTo(20,-12);c.quadraticCurveTo(reach*.53,-24,reach+12,0);
   c.quadraticCurveTo(reach*.62,18,20,12);c.closePath();c.fill();
   c.restore();
  }
  glow(c,x,y,Math.max(30,r*.55),'#ffbd74',a*.16);
 }
}
const paint=Object.freeze({
 sunflare,tsunamiPaw,sunbloom,thunderYowl,voidMaw,
 moonlitHalo,moonfang,purrNova
});
function has(id){return !!paint[id]}
function draw(ctx,v,W,H,time=0,layer='back'){
 if(!ctx||v?.kind!=='ultimate'||!has(v.skillId))return false;
 const p=ease(1-clamp(v.life/Math.max(.001,v.max))),fade=clamp(v.life/Math.max(.001,v.max)*2.3);
 if(fade<.004)return true;
 const R=Math.min(300,Math.max(108,Math.min(W,H)*.40));
 const s={x:v.x,y:v.y,R,p,a:fade*(layer==='front'?.85:1),
  angle:v.angle||0,targets:v.targets||[],time,front:layer==='front'};
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
 paint[v.skillId](ctx,s);
 ctx.restore();return true;
}
window.CatBondUltVFX={ids:ID,has,draw};
})();