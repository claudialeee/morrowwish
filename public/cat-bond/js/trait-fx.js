/* Cat Bond trait VFX — localized, game-state driven, no gameplay writes.
 * First art pass. Effects read the same coordinates and lifetime as mechanics.
 * No full-screen tint or persistent decoration when the trait is inactive. */
(()=>{'use strict';
const TAU=Math.PI*2,PI=Math.PI,cl=x=>Math.max(0,Math.min(1,x)),rnd=n=>{let q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q)};
const species=a=>a?.cat?.species||a?.species;
const colors={
 tangyuan:'#ff9b49',dundun:'#b4f3ff',lanbao:'#8fdcff',senlin:'#9dbd73',abi:'#ffb25b',wumao:'#ffe394',moqiu:'#b49ad8',niuniu:'#f1d3ff',meidu:'#9fce72',duanduan:'#d9cdff',yunduo:'#f6edcf',bosi:'#f8e6a8',nietu:'#a3cc82',jiafei:'#ffbd82',qisi:'#ffba75',jinwu:'#ff7f36',nuowei:'#92b864',lixiao:'#d9b1e9',sanhua:'#ffdfac',xiaohui:'#8fe0f1',xianluo:'#e6ceff',youling:'#bda4fa',yuelian:'#d7edff',doudou:'#b9df8e',baomao:'#cba1df',xingchen:'#c9bcff',fanmao:'#78d4ef',mengmai:'#9c8abf',yinghua:'#ffb9d0',xuewa:'#b5f2ff',zherdd:'#b9e894',jinjc:'#ffdb77',nainai:'#fff6dc'};
function line(c,p,col,w,a){if(p.length<2)return;c.globalAlpha=cl(a);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function poly(c,p,col,a){c.globalAlpha=cl(a);c.fillStyle=col;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function ell(c,x,y,rx,ry,col,a){if(rx<=0||ry<=0)return;c.globalAlpha=cl(a);c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function glow(c,x,y,r,col,a){if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ell(c,x,y,r,r,g,a);}
function shard(c,x,y,a,r,col,op){c.save();c.translate(x,y);c.rotate(a);poly(c,[[0,-r],[r*.43,-r*.1],[0,r*.7],[-r*.36,-r*.1]],col,op);poly(c,[[0,-r],[0,r*.7],[-r*.36,-r*.1]],'#f3ffff',op*.6);c.restore();}
function leaf(c,x,y,a,r,col,op){c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=cl(op);c.fillStyle=col;c.beginPath();c.moveTo(-r,0);c.quadraticCurveTo(0,-r*.8,r,0);c.quadraticCurveTo(0,r*.8,-r,0);c.fill();line(c,[[-r,0],[r,0]],'#e5f3be',.9,op*.7);c.restore();}
function star(c,x,y,r,col,a){const p=[];for(let j=0;j<8;j++){const th=j*PI/4,rr=r*(j%2?.21:1);p.push([x+Math.cos(th)*rr,y+Math.sin(th)*rr]);}poly(c,p,col,a);}
function arc(c,x,y,r,ang,sweep,col,w,a,yr=1){c.globalAlpha=cl(a);c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.ellipse(x,y,r,r*yr,0,ang,ang+sweep);c.stroke();}
function bolt(c,x,y,X,Y,t,seed,col,a,w=2){let p=[[x,y]],dx=X-x,dy=Y-y,d=Math.hypot(dx,dy)||1;for(let j=1;j<9;j++){const u=j/9,k=(rnd(seed*71+j+Math.floor(t*19)*103)-.5)*12*Math.sin(PI*u);p.push([x+dx*u-dy/d*k,y+dy*u+dx/d*k]);}p.push([X,Y]);line(c,p,'#6650b8',w*3,a*.24);line(c,p,col,w,a*.9);line(c,p,'#fff8dc',w*.45,a*.9);}
function ember(c,x,y,t,k,R){for(let j=0;j<10;j++){const a=j*TAU/10+t*.6,d=R*(.45+rnd(j)*.6),xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.65;
 c.globalAlpha=k*.7;c.fillStyle=j%3?'#ffad55':'#fff0ad';c.beginPath();c.moveTo(xx-3,yy+4);c.quadraticCurveTo(xx-9,yy-4,xx+Math.sin(t*9+j)*6,yy-15);c.quadraticCurveTo(xx+10,yy-3,xx+3,yy+4);c.fill();}}
function iceBurst(c,x,y,p,a,r=90){
 const k=1-Math.pow(1-p,3),flash=Math.max(0,1-p*5);
 glow(c,x,y,r*.58,'#8dcbea',a*.30);glow(c,x,y,r*.38,'#edffff',flash*.86);
 // Shattered sheet: large faceted slabs accelerate outward, then tumble and settle.
 for(let j=0;j<20;j++){
   const th=j*2.399,rr=r*(.15+.85*k)*(.48+.52*rnd(j)),xx=x+Math.cos(th)*rr,yy=y+Math.sin(th)*rr*.72-22*Math.sin(p*PI);
   const size=(6+15*rnd(j+10))*(1-.27*p),ang=th+PI/2+p*(rnd(j+22)-.5)*3;
   const tx=x+Math.cos(th)*rr*.52,ty=y+Math.sin(th)*rr*.4;
   line(c,[[tx,ty],[xx,yy]],'#78b4db',size*.46,a*.23);
   line(c,[[tx,ty],[xx,yy]],'#d8faff',size*.15,a*.76);
   c.save();c.translate(xx,yy);c.rotate(ang);
   poly(c,[[0,-size],[size*.5,-size*.2],[size*.26,size*.8],[-size*.5,size*.4],[-size*.28,-size*.5]],'#4b91c0',a);
   poly(c,[[0,-size],[size*.5,-size*.2],[0,size*.18],[-size*.28,-size*.5]],'#d6faff',a*.96);
   poly(c,[[0,size*.18],[size*.5,-size*.2],[size*.26,size*.8],[-size*.5,size*.4]],'#8accea',a);
   line(c,[[0,-size],[size*.5,-size*.2],[size*.26,size*.8]],'#f4ffff',1.1,a*.8);c.restore();
 }
 for(let j=0;j<11;j++){const th=j*2.399,rr=r*k*(.5+rnd(j+34)*.5);ell(c,x+Math.cos(th)*rr,y+Math.sin(th)*rr*.67,2+rnd(j)*2,1.5,'#d9f8ff',a*.9);}
 for(let j=0;j<7;j++)arc(c,x,y,Math.max(1,r*k),j*.91,.38,'#d8fbff',3.2,a*.65,.72);
}
function waterSpiral(c,x,y,R,t,a,phase=0){
 const N=36;
 // Broad translucent water sheets wind inward; foam rides the faster inner rim.
 for(let j=0;j<5;j++){
   const th0=j*TAU/5-t*.9+phase,outer=[],inner=[],rim=[];
   for(let i=0;i<=N;i++){
     const u=i/N,th=th0+u*2.65,rr=R*(1-u*.88),w=R*(.045+.095*Math.sin(PI*u)),r1=rr+w,r2=Math.max(1,rr-w);
     outer.push([x+Math.cos(th)*r1,y+Math.sin(th)*r1]);inner.unshift([x+Math.cos(th)*r2,y+Math.sin(th)*r2]);
     rim.push([x+Math.cos(th)*rr,y+Math.sin(th)*rr]);
   }
   const g=c.createRadialGradient(x,y,0,x,y,R*1.12);g.addColorStop(0,'#b7f7ff');g.addColorStop(.26,'#68cee3');g.addColorStop(.67,'#247fa8');g.addColorStop(1,'rgba(37,129,177,0)');
   poly(c,outer.concat(inner),g,a*.72);line(c,rim,'#9aeafa',2.2,a*.78);
   for(let i=0;i<9;i++){const u=(i/9+t*.86+j*.11)%1,th=th0+u*2.65,rr=R*(1-u*.88),xx=x+Math.cos(th)*rr,yy=y+Math.sin(th)*rr;
     ell(c,xx,yy,2.2+rnd(i+j)*2.6,1.4,'#e8ffff',a*(.35+.6*Math.sin(PI*u)));}
 }
 glow(c,x,y,R*.22,'#9ce4fa',a*.45);
}
function vineField(c,f,t,water=false){
 const R=f.r||86;if(water){waterSpiral(c,f.x,f.y,R,t,.86);return;}
 for(let j=0;j<7;j++){
   const th=j*TAU/7+t*.16,pts=[];
   for(let k=0;k<=24;k++){const u=k/24,rr=R*(1-u*.85),a=th+u*.95+.1*Math.sin(u*11+t);pts.push([f.x+Math.cos(a)*rr,f.y+Math.sin(a)*rr]);}
   line(c,pts,'#344d36',7,.75);line(c,pts,'#69994c',4.8,.95);line(c,pts,'#b7d77d',1.35,.8);
   for(let k=4;k<20;k+=5){const [x,y]=pts[k];leaf(c,x,y,th+k*.31,9,'#a8d87e',.9);}
 }
}
function aura(c,x,y,t,col){for(let i=0;i<9;i++){const a=i*TAU/9+t*.25,xx=x+Math.cos(a)*37,yy=y+Math.sin(a)*17;leaf(c,xx,yy,a,6,col,.65);const h=(t*.5+i/9)%1;star(c,xx,yy-h*22,3,col,(1-h)*.6);}}
function rift(c,x,y,t,a){glow(c,x,y,21,'#9574ea',a*.22);const pts=[[x-14,y+8],[x-5,y-2],[x-7,y-7],[x+4,y-4],[x+13,y-14]];line(c,pts,'#39244f',7,a*.8);line(c,pts,'#a991fb',2.6,a);star(c,x+5,y-6,5,'#f2eaff',a*.8);}
function drawReady(c,a,b,t){const sp=species(a),x=a.x,y=a.y-4,col=colors[sp]||'#fff1cc';
 if(sp==='tangyuan'&&a._emberCharge>0)ember(c,x,y,t,cl(a._emberCharge/(a.maxhp*.25)),21);
 if(sp==='dundun'&&a.shieldT>0&&a._traitWardHP>0){const hp=cl(a._traitWardHP/(a.maxhp*.28));for(let i=0;i<6;i++){const th=i*TAU/6;shard(c,x+Math.cos(th)*29,y+Math.sin(th)*23,th,5+3*hp,col,.65);if(hp<.45)line(c,[[x+Math.cos(th)*19,y+Math.sin(th)*19],[x+Math.cos(th+.15)*25,y+Math.sin(th+.15)*25],[x+Math.cos(th-.08)*31,y+Math.sin(th-.08)*25]],'#e4fbff',1.8,.85);}}
 if(sp==='nietu'&&a._nietuRootT>=1.5){for(let j=0;j<7;j++){const th=j*TAU/7;line(c,[[x,y+18],[x+Math.cos(th)*16,y+18+Math.sin(th)*8],[x+Math.cos(th+.25)*34,y+18+Math.sin(th+.25)*13]],'#567c43',3,.8);leaf(c,x+Math.cos(th+.25)*34,y+18+Math.sin(th+.25)*13,th,8,col,.8);}}
 if(sp==='abi'&&a._abiCharged){for(let j=0;j<3;j++)arc(c,x,y,25,t*3+j*TAU/3,.55,col,3,.8,.65);}
 if(sp==='wumao'&&a._wumaoCharged>0){for(let j=0;j<4;j++){const th=j*TAU/4+t*2;bolt(c,x,y,x+Math.cos(th)*30,y+Math.sin(th)*25,t,j,col,a._wumaoCharged*.7,1.2);}}
 if(sp==='moqiu'&&a._moqiuStalk){for(let j=0;j<4;j++)ell(c,x+Math.cos(t+j)*15,y+12+Math.sin(t+j)*4,18,5,'#433051',.25);}
 if(sp==='niuniu'&&a._niuniuEchoReady&&t<(a._niuniuEchoUntil||0)){arc(c,x,y,28,t*4,PI*.75,col,2,.8,.7);}
 if(sp==='qisi'&&a._qisiStreak>0&&t-a._qisiStreakT<3)ember(c,x,y,t,a._qisiStreak/10,24);
 if(sp==='zherdd'&&a._zherddStillT>=1.5&&a._zherddStillT<=7.5)aura(c,x,y+12,t,col);
 if(sp==='nuowei'&&a._nuoweiTerritory)aura(c,x,y+12,t,col);
 if(sp==='yunduo')for(const a2 of a._linked||[]){if(a2.alive&&(a._linkUntil?.get(a2)||0)>t&&Math.hypot(x-a2.x,y-a2.y)<300){line(c,[[x,y],[x+(a2.x-x)*.5,y+(a2.y-y)*.5-9],[a2.x,a2.y]],'#e7d7ab',1.5,.45);}}
 if(a._traitArmor>0)shell(c,x,y,30,'#ffe6a3',.42+.40*cl(a._traitArmor/(a.maxhp*.25)),t*.15);
 if((a._cleanseGuardUntil||0)>t)for(let j=0;j<3;j++)star(c,x+Math.cos(j*TAU/3+t)*24,y+Math.sin(j*TAU/3+t)*19,4,'#fff5df',.8);
 if(sp==='duanduan'||sp==='xuewa')for(const q of a[sp==='duanduan'?'_duanduanTrail':'_xuewaTrail']||[]){const k=cl(1-(t-q.t)/(sp==='duanduan'?1.6:2));if(k<=0)continue;
   if(sp==='duanduan')bolt(c,q.x1,q.y1+12,q.x2,q.y2+12,t,Math.floor(q.t*100),col,k*.8,1.6);
   else{ell(c,q.x,q.y+13,9,4,col,k*.25);for(let j=0;j<3;j++)ell(c,q.x+(j-1)*3,q.y+9,1.8,1.5,'#dbfaff',k*.7);}}
 if(sp==='xingchen')for(const q of a._xingchenRifts||[])rift(c,q.x,q.y+8,t,cl(1-(t-q.t)/2.5));
 for(const q of a._echoQueue||[])rift(c,q.x,q.y,t,cl((q.at-t)/1.1)*.65);
}

/* Distinct silhouettes, not one element-colored emitter. Every painter is
 * purely visual; drawEvent uses the immutable impact coordinates. */
function curve(c,pts,col,w,a){c.globalAlpha=cl(a);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(...pts[0]);c.bezierCurveTo(...pts[1],...pts[2],...pts[3]);c.stroke();}
function sweep(c,x,y,angle,r,w,col,a){
 c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(-r,0,r,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.6,col);g.addColorStop(1,'#fff9dc');c.fillStyle=g;c.globalAlpha=cl(a);
 c.beginPath();c.moveTo(-r,0);c.bezierCurveTo(-r*.4,-w,r*.45,-w*1.25,r,0);c.bezierCurveTo(r*.2,-w*.34,-r*.45,w*.14,-r,0);c.fill();c.restore();
}
function flameTongue(c,x,y,angle,size,a,col='#ff9a42'){c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(0,0,size,0);g.addColorStop(0,'#fff4ae');g.addColorStop(.40,col);g.addColorStop(1,'rgba(165,45,30,0)');c.globalAlpha=cl(a);c.fillStyle=g;c.beginPath();c.moveTo(0,-size*.12);c.quadraticCurveTo(size*.4,-size*.40,size,0);c.quadraticCurveTo(size*.45,size*.10,0,size*.20);c.closePath();c.fill();c.restore();}
function flower(c,x,y,r,col,a,t=0){for(let i=0;i<5;i++){const th=i*TAU/5+t;ell(c,x+Math.cos(th)*r*.54,y+Math.sin(th)*r*.54,r*.48,r*.42,col,a);}ell(c,x,y,r*.22,r*.22,'#fff0af',a);}
function shell(c,x,y,r,col,a,p){
 // Two layers of translucent curved plates, with sharp light catching the seams.
 const g=c.createRadialGradient(x-r*.23,y-r*.38,0,x,y,r);
 g.addColorStop(0,'rgba(255,248,205,.05)');g.addColorStop(.68,'rgba(232,193,101,.14)');g.addColorStop(1,'rgba(255,235,173,.67)');
 ell(c,x,y,r,r*.9,g,a);
 for(let j=0;j<6;j++){
   const th=j*TAU/6,pt=(q,rr)=>[x+Math.cos(q)*rr,y+Math.sin(q)*rr*.9];
   const corners=[pt(th,r*.69),pt(th+.42,r),pt(th+.94,r*.69),pt(th+.47,r*.29)];
   poly(c,corners,col,a*.25);poly(c,[corners[0],corners[1],corners[3]],'#fff4bf',a*.38);
   line(c,[corners[0],corners[1],corners[2]],'#b88c49',4,a*.55);line(c,[corners[0],corners[1],corners[2]],'#fff9dd',1.7,a*.91);
 }
 arc(c,x,y,r,-2.8,1.45,'#ffffe5',2.6,a,.9);
 for(let j=0;j<3;j++){const th=p*2+j*TAU/3;star(c,x+Math.cos(th)*r,y+Math.sin(th)*r*.9,4,'#fffde6',a*.8);}
}
function ribbonLink(c,v,p,a,col,electric=false){
 const dx=v.x-v.ox,dy=v.y-v.oy,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 if(electric){bolt(c,v.ox,v.oy-8,v.x,v.y-8,v.start+p,v.species.length,col,a,2.6);return;}
 // Two tapered intertwined ribbons, with discrete motes carrying energy along them.
 const at=(u,j)=>{const bend=Math.sin(PI*u),h=Math.sin(u*TAU*1.7+p*9+j*PI)*bend*9;
   return [v.ox+dx*u+nx*h,v.oy-8+dy*u-17*bend+ny*h];};
 for(let j=0;j<2;j++){
   const front=[],back=[],center=[];
   for(let i=0;i<=32;i++){const u=i/32,[x,y]=at(u,j),w=1.2+3.1*Math.sin(PI*u);front.push([x+nx*w,y+ny*w]);back.unshift([x-nx*w,y-ny*w]);center.push([x,y]);}
   poly(c,front.concat(back),j?'#f5edc8':col,a*.45);line(c,center,j?'#fffbe4':'#d4b987',j?1.45:2.7,a*.8);
 }
 for(let j=0;j<5;j++){const u=(p*1.6+j*.22)%1,[x,y]=at(u,j%2);glow(c,x,y,8,'#fff1b8',a*.55);star(c,x,y,3.4+j*.4,'#fff9e2',a);}
 glow(c,v.x,v.y-8,18,col,a*.34);
}
function echoSilhouette(c,x,y,angle,col,a,speciesId,t=0){
 // The runtime can provide a tinted render of the actual cat sprite. The lab
 // has no art assets, so its honest fallback is a full-body moving silhouette.
 if(activeGhost&&activeGhost(c,x,y,angle,col,a,speciesId,t))return;
 c.save();c.translate(x,y);c.scale(Math.cos(angle)<0?-1:1,1);c.rotate(-.08);
 glow(c,0,-6,39,col,a*.25);
 const g=c.createLinearGradient(-35,0,26,0);g.addColorStop(0,'rgba(90,65,138,0)');g.addColorStop(.55,col);g.addColorStop(1,'#dce2ff');
 ell(c,-11,3,24,12,g,a*.65);
 curve(c,[[-29,4],[-52,1],[-46,-21],[-29,-10]],col,7,a*.58);
 poly(c,[[5,1],[4,-14],[9,-23],[15,-13],[26,-15],[31,-24],[34,-7],[31,8],[18,13]],g,a*.82);
 const step=Math.sin(t*22)*6;
 for(const [xx,yy,ex,ey] of [[-20,7,-29-step,19],[-10,7,-1+step,15],[10,7,22+step,17],[20,7,31-step,12]])curve(c,[[xx,yy],[xx+3,yy+6],[ex-3,ey-3],[ex,ey]],col,5,a*.72);
 line(c,[[9,-23],[15,-13],[26,-15],[31,-24]],'#e8e0ff',1.4,a*.9);
 ell(c,25,-3,2,2,'#fff6da',a);c.restore();
}
let activeGhost=null;

const PAINT={
 tangyuan(c,v,t,p,a){const x=v.x,y=v.y-8,th=Math.atan2(y-v.oy,x-v.ox);glow(c,x,y,36,'#ff7e37',a*.34);for(let j=0;j<9;j++)flameTongue(c,x,y,th+(j-4)*.31,28+48*p*(.55+rnd(j)*.45),a,'#f47735');for(let j=0;j<5;j++)sweep(c,x,y,th+j*.52,20+22*p,7,'#ffad4a',a*.7);},
 dundun(c,v,t,p,a){iceBurst(c,v.x,v.y-8,p,a,v.radius||90);},
 lanbao(c,v,t,p,a){if(v.phase==='ready')shard(c,v.x+17,v.y-27,t*.8,11,'#aeefff',a);else{iceBurst(c,v.x,v.y-8,p,a,49);for(let j=0;j<4;j++)shard(c,v.x+Math.cos(j*1.57)*p*30,v.y-9+Math.sin(j*1.57)*p*24,j,15,'#569dd8',a);}},
 senlin(c,v,t,p,a){const x=v.x,y=v.y+8;for(let j=0;j<9;j++){const th=j*TAU/9,rr=12+45*p,xx=x+Math.cos(th)*rr,yy=y+Math.sin(th)*rr*.55;line(c,[[x,y],[x+Math.cos(th+.18)*rr*.55,y+Math.sin(th+.18)*rr*.28],[xx,yy]],'#634c39',2.8,a);poly(c,[[xx-5,yy],[xx+1,yy-11*Math.sin(PI*p)-7],[xx+7,yy-3],[xx+3,yy+4]],'#a69b75',a);}},
 abi(c,v,t,p,a){const th=Math.atan2(v.y-v.oy,v.x-v.ox);for(let j=0;j<7;j++){const xx=v.x-Math.cos(th)*(p*56+j*4),yy=v.y-8-Math.sin(th)*(p*56+j*4);flameTongue(c,xx,yy,th+PI+(rnd(j)-.5)*.65,18+j*3,a*(1-j*.08));}},
 wumao(c,v,t,p,a){glow(c,v.x,v.y-10,24+13*p,'#d0b3ff',a*.4);for(let j=0;j<5;j++){const th=j*TAU/5+p*2;bolt(c,v.x,v.y-10,v.x+Math.cos(th)*(20+29*p),v.y-10+Math.sin(th)*(20+29*p),t,j,'#f6de7b',a,2);}},
 moqiu(c,v,t,p,a){for(let j=0;j<5;j++)ell(c,v.x-16+j*8,v.y+7+Math.sin(j)*5,22+12*p,9+5*p,'#372444',a*.32);sweep(c,v.x,v.y-9,-.5,42+12*p,17,'#9670ba',a);},
 niuniu(c,v,t,p,a){const x=v.ox+(v.x-v.ox)*p,y=v.oy+(v.y-v.oy)*p;echoSilhouette(c,x,y,Math.atan2(v.y-v.oy,v.x-v.ox),'#a8b5ff',a,'niuniu',t);bolt(c,x,y-7,v.x,v.y-7,t,7,'#f5df92',a,2.4);sweep(c,v.x,v.y-7,-.45,30,10,'#c9c5ff',a);},
 meidu(c,v,t,p,a){for(let j=0;j<4;j++){const th=j*TAU/4,rr=35*(1-p)+12,xx=v.x+Math.cos(th)*rr,yy=v.y+Math.sin(th)*rr;curve(c,[[xx,yy],[xx-12,yy-25],[v.x+18,v.y+17],[v.x,v.y]],'#527a44',5,a);leaf(c,xx,yy,th,9,'#a9dc79',a);}},
 duanduan(c,v,t,p,a){const x=v.x,y=v.y+8;for(let j=0;j<5;j++){const th=j*TAU/5;bolt(c,x,y,x+Math.cos(th)*(10+25*p),y+Math.sin(th)*(10+25*p)*.5,t,j,'#cebaff',a,1.6);}},
 yunduo(c,v,t,p,a){ribbonLink(c,v,p,a,'#ebd9b1');for(let j=0;j<4;j++)star(c,v.x+Math.cos(j*TAU/4)*22,v.y-6+Math.sin(j*TAU/4)*15-13*p,4,'#fff7df',a);},
 bosi(c,v,t,p,a){shell(c,v.x,v.y-8,22+12*p,'#ffe7a1',a,p);},
 nietu(c,v,t,p,a){for(let j=0;j<6;j++){const th=j*TAU/6,rr=16+21*p;curve(c,[[v.x,v.y+12],[v.x+Math.cos(th)*rr*.3,v.y+5],[v.x+Math.cos(th+.5)*rr*.7,v.y+22],[v.x+Math.cos(th)*rr,v.y+12+Math.sin(th)*rr*.5]],'#7b6240',4,a);}},
 jiafei(c,v,t,p,a){ribbonLink(c,v,p,a,'#ff9856');shell(c,v.ox,v.oy-7,26,'#ffcf93',a*.65,p);},
 qisi(c,v,t,p,a){for(let j=0;j<3;j++)sweep(c,v.x,v.y-15+j*10,-.35,27+8*j+12*p,7,'#ff9b50',a);},
 jinwu(c,v,t,p,a){glow(c,v.x,v.y-10,32+20*p,'#f47232',a*.35);for(let j=0;j<12;j++)flameTongue(c,v.x,v.y-8,j*TAU/12,23+42*p,a,'#ff762b');},
 nuowei(c,v,t,p,a){for(let j=0;j<7;j++){const th=j*TAU/7;leaf(c,v.x+Math.cos(th)*(25+20*p),v.y+12+Math.sin(th)*(12+10*p),th,9,'#a9c976',a);}},
 lixiao(c,v,t,p,a){sweep(c,v.x,v.y-8,-.85,43,8,'#cbb0f3',a);if(p>.17)sweep(c,v.x,v.y-8,.78,37,7,'#eee1ff',a);},
 sanhua(c,v,t,p,a){for(let j=0;j<3;j++){const th=(j-1)*.65+p*.9;sweep(c,v.x,v.y-8,th,28+12*j,8,'#f9d98a',a*(1-.12*j));star(c,v.x+Math.cos(th)*34,v.y-8+Math.sin(th)*34,4,'#fff5ca',a);}},
 xiaohui(c,v,t,p,a){const th=Math.atan2(v.y-v.oy,v.x-v.ox);for(let j=0;j<3;j++){const dx=Math.cos(th+j*.33)*p*38,dy=Math.sin(th+j*.33)*p*38;curve(c,[[v.x-14,v.y+4],[v.x+dx*.4,v.y-25],[v.x+dx*.7,v.y+dy-15],[v.x+dx,v.y+dy]],j?'#b9f4ff':'#429ccb',5-j,a);}for(let j=0;j<6;j++)ell(c,v.x+(rnd(j)-.5)*p*56,v.y-16*Math.sin(PI*p)+rnd(j+9)*15,2,4,'#d7fbff',a);},
 xianluo(c,v,t,p,a){
   const x=v.x,y=v.y-10,level=Math.max(1,Math.min(6,v.level||3));
   // Three expanding pressure fronts visibly distort into a scalloped wave.
   for(let j=0;j<3;j++){const q=(p+j*.28)%1,rr=9+q*(27+level*4),pts=[];
     for(let i=0;i<=48;i++){const th=i*TAU/48,r=rr*(1+.095*Math.sin(th*7-t*18+j));pts.push([x+Math.cos(th)*r,y+Math.sin(th)*r*.8]);}
     line(c,pts,'#705db3',7,(1-q)*a*.36);line(c,pts,'#d6caff',3.6,(1-q)*a*.85);line(c,pts,'#fff5bf',1.3,(1-q)*a*.9);
   }
   for(let j=0;j<level;j++){const th=j*TAU/level+t*2;bolt(c,x+Math.cos(th)*12,y+Math.sin(th)*9,x+Math.cos(th)*(20+28*p),y+Math.sin(th)*(16+20*p),t,j,'#c4b7ff',a*.65,1.6);}
 },
 youling(c,v,t,p,a){echoSilhouette(c,v.x-16,v.y-8,Math.atan2(v.y-v.oy,v.x-v.ox),'#a18acc',a,'youling',t);if(v.phase!=='ready'){for(let j=0;j<2;j++)sweep(c,v.x,v.y-8,j?-.65:.65,36+14*p,13,'#7956af',a);}},
 yuelian(c,v,t,p,a){if(window.CatBondMoonFX){window.CatBondMoonFX.drawPassive(c,v,t,p,a);return;}sweep(c,v.x,v.y-8,-.95,39,16,'#c9e5ff',a);},
 doudou(c,v,t,p,a){const th=Math.atan2(v.y-v.oy,v.x-v.ox);for(let j=0;j<3;j++)sweep(c,v.x,v.y-13+j*7,th-.6,25+8*p,6,'#a7d989',a);},
 baomao(c,v,t,p,a){for(let j=0;j<4;j++){const th=j*TAU/4+PI/4,r=19+10*(1-p);line(c,[[v.x+Math.cos(th)*r,v.y-12+Math.sin(th)*r],[v.x+Math.cos(th)*9,v.y-12+Math.sin(th)*9]],'#e6b4ed',3,a);}if(v.phase==='fire')sweep(c,v.x,v.y-7,-.35,39,11,'#b287d9',a);},
 xingchen(c,v,t,p,a){rift(c,v.x,v.y-8,t,a);for(let j=0;j<7;j++){const th=j*TAU/7;star(c,v.x+Math.cos(th)*p*34,v.y-8+Math.sin(th)*p*34,5,'#e5dcff',a);}},
 fanmao(c,v,t,p,a){waterSpiral(c,v.x,v.y,28+18*(1-p),t,a,p*2);},
 mengmai(c,v,t,p,a){for(let j=0;j<3;j++){const th=j*TAU/3;arc(c,v.x,v.y-11,21-5*p,th,.9,'#70548e',5,a,.75);line(c,[[v.x+Math.cos(th)*18,v.y-11+Math.sin(th)*14],[v.x+Math.cos(th)*6,v.y-11+Math.sin(th)*6]],'#c0a2db',2,a);}},
 yinghua(c,v,t,p,a){for(let j=0;j<15;j++){const th=j*2.399,r=(8+55*p)*(.4+.6*rnd(j));leaf(c,v.x+Math.cos(th)*r,v.y+Math.sin(th)*r-18*Math.sin(PI*p),th+t,6,'#ffc6dc',a);}},
 xuewa(c,v,t,p,a){for(let j=0;j<5;j++){const xx=v.x+(j-2)*9,yy=v.y+8-22*p;ell(c,xx,yy,4,2.8,'#b5ebff',a);for(let k=0;k<3;k++)ell(c,xx+(k-1)*3,yy-4,1.3,1.4,'#e3fcff',a);}},
 zherdd(c,v,t,p,a){for(let j=0;j<5;j++){const th=j*TAU/5;flower(c,v.x+Math.cos(th)*22,v.y+Math.sin(th)*13-17*p,5,'#d6ebae',a,t);}},
 jinjc(c,v,t,p,a){ribbonLink(c,v,p,a,'#ffe095',true);star(c,v.x,v.y-12,9,'#fff5be',a);},
 nainai(c,v,t,p,a){for(let j=0;j<5;j++){const th=j*TAU/5;star(c,v.x+Math.cos(th)*(15+16*p),v.y-7+Math.sin(th)*(15+16*p),6,'#fff6d9',a);}shell(c,v.x,v.y-8,26,'#f8f0cc',a*.6,p);}
};
function drawEvent(c,v,t){const p=cl((t-v.start)/Math.max(.01,v.life)),a=1-p;if(a<=0)return false;const fn=PAINT[v.species];if(!fn)return false;c.save();fn(c,v,t,p,a);c.restore();return true;}
function draw(c,b,ghost=null){if(!c||!b)return;const t=b.t||0;c.save();activeGhost=ghost;
 for(const f of b.fields||[]){if(f.t<=0)continue;const sp=species(f._traitCaster);if(sp==='meidu'||sp==='fanmao')vineField(c,f,t,sp==='fanmao');}
 for(const a of b.team||[]){if(a.alive)drawReady(c,a,b,t);}
 for(const e of b.enemies||[]){if(!e.alive)continue;if(e._frostStack>0&&t-(e._frostStackT||0)<5)for(let j=0;j<e._frostStack;j++)shard(c,e.x-12+j*6,e.y-29,0,5,'#b6e5fb',.9);
 if(e._hunterMark&&e._hunterMarkExpire>t){const x=e.x,y=e.y-38;for(let j=0;j<4;j++){const th=j*TAU/4;line(c,[[x+Math.cos(th)*10,y+Math.sin(th)*10],[x+Math.cos(th)*5,y+Math.sin(th)*5]],'#e0b5ff',2,.8);}}
 if(e.status?.suppress>0){arc(c,e.x,e.y-18,19,t*.7,PI*1.3,'#9e82c6',2.6,.7,.6);}}
 try{for(const v of b._traitFX||[])if(t-v.start<v.life)drawEvent(c,v,t);}finally{activeGhost=null;c.restore();}}
function drawFront(c,b){c.save();for(const e of b.enemies||[]){if(!e.alive||!(e.status?.chill>0))continue;const fade=cl(e.status.chill/.18);for(let j=0;j<5;j++){const th=PI*.14+j*PI*.18;shard(c,e.x+Math.cos(th)*26,e.y+Math.sin(th)*17-7,th-PI/2,9+4*rnd(j),'#b3eafa',fade*.68);}}c.restore();}
window.CatBondTraitFX={draw,drawFront,drawEvent,colors,ids:Object.freeze(Object.keys(PAINT))};
})();