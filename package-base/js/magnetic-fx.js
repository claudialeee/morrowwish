/* Cat Bond magnetic field V5 — living plasma poles: purely visual, no gameplay state. */
(function(root){'use strict';
const PI=Math.PI,TAU=PI*2,cl=x=>Math.max(0,Math.min(1,x)),hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function draw(c,a,b,t,alpha=1,width=42){
 const L=Math.hypot(b.x-a.x,b.y-a.y);if(L<1)return false;
 const ux=(b.x-a.x)/L,uy=(b.y-a.y)/L,nx=-uy,ny=ux,A=cl(alpha),W=Math.max(8,width),rise=57;
 if(A<=0)return true;
 const P=(u,v=0,z=0)=>[a.x+ux*L*u+nx*v,a.y+uy*L*u+ny*v-z];
 function poly(p,col,op=1){c.globalAlpha=A*cl(op);c.fillStyle=col;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
 function line(p,col,w,op=1){c.globalAlpha=A*cl(op);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
 function ellipse(x,y,rx,ry,col,op){c.globalAlpha=A*cl(op);c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill()}
 function glow(x,y,r,col,op){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col+'c0');g.addColorStop(.2,col+'60');g.addColorStop(1,col+'00');ellipse(x,y,r,r,g,op)}
 function bolt(p,col,w,op){line(p,'#6654c9',w*5.2,op*.21);line(p,col,w*2.6,op*.78);line(p,'#fff9da',w*.68,op)}
 c.save();
 const g=c.createLinearGradient(...P(.5,-W),...P(.5,W));g.addColorStop(0,'#7c71e900');g.addColorStop(.12,'#8071e94d');g.addColorStop(.5,'#372a665c');g.addColorStop(.88,'#c8a5574d');g.addColorStop(1,'#c8a55700');
 poly([P(0,-W),P(1,-W),P(1,W),P(0,W)],g,.55);
 for(const side of [-1,1]){
  const pts=Array.from({length:25},(_,j)=>P(j/24,side*W));line(pts,'#beb0f0',1.2,.23);
  for(let j=0;j<9;j++){const u=(j/9+t*.52)%1,v=side*W*.86;line([P(u,v),P(Math.min(1,u+.045),v*.76),P(Math.min(1,u+.09),v)],side<0?'#a7b5ff':'#ffe097',1.7,.52)}
 }
 for(let i=0;i<7;i++){const u=(i/7+t*.25)%1;const pts=Array.from({length:17},(_,j)=>{const v=(j/16*2-1)*W;return P(u+.038*Math.sin(j*.8+t*3),v)});line(pts,'#bdb4ff',1,.24)}
 for(let j=0;j<5;j++){
  const pts=[],pts2=[];for(let i=0;i<=32;i++){const u=i/32,e=Math.sin(PI*u),v=Math.sin(u*16+t*5+j*1.4)*W*.28*e,z=rise*(.38+.13*j)+e*12*Math.sin(u*8-t*6+j);pts.push(P(u,v,z));pts2.unshift(P(u,v+9*Math.sin(u*PI),z-12-9*e))}
  poly(pts.concat(pts2),j%2?'#b0a1ff':'#e2b85c',.12+j*.024);
 }
 const tick=Math.floor(t*22);
 for(let j=0;j<4;j++){
  const pts=[];for(let i=0;i<=22;i++){const u=i/22,e=Math.sin(PI*u),v=e*(Math.sin(u*19+t*6+j*2)*W*.44+(hash(i+tick*71+j*137)-.5)*16),z=rise+e*((j-1.5)*15+(hash(i*3+tick*19+j*53)-.5)*22);pts.push(P(u,v,z))}
  bolt(pts,j%2?'#a49dff':'#f2d28b',j===0?3.1:1.7,.88);
  for(let i=4;i<21;i+=5){const u=i/22,side=hash(i+j*3+tick)>.5?1:-1;const end=P(Math.min(.98,u+.06),side*W*(.6+hash(i+j)*.38),3);const mid=P(u+.025,side*W*.45,24+hash(i+tick)*18);bolt([pts[i],mid,end],j%2?'#b0a7ff':'#ffe4a0',1.15,.68)}
 }
 for(let i=0;i<22;i++){
  const u=(hash(i+32)+t*(.20+hash(i)*.25))%1,v=(hash(i+77)-.5)*W*1.75,z=12+hash(i+47)*65;
  const [x,y]=P(u,v,z),life=.3+.7*Math.sin(PI*((t*1.7+hash(i+8))%1));
  const col=i%2?'#e4cbff':'#ffe2a0';glow(x,y,6+hash(i+3)*10,col,.32*life);
  line([[x-ux*8,y-uy*8+4],[x,y]],col,1.5,life*.9);
 }
 for(let i=1;i<8;i++){const u=i/8,[x,y]=P(u,0,rise);glow(x,y,26+5*Math.sin(t*6+i),'#b6a1ff',.27)}
 for(let k=0;k<2;k++){
  const x=k?b.x:a.x,y=k?b.y:a.y,Y=y-rise,C=k?'#ffd06d':'#a2adff',D=k?'#f48b32':'#6650ec',H=k?'#fff8d2':'#f0f5ff';
  const pulse=1+.075*Math.sin(t*11+k*2),r=14*pulse;
  // The pole is condensed lightning: no metal, housing, pedestal or hard crystal.
  glow(x,y,31,C,.30);glow(x,Y,r*3.9,C,.53);glow(x,Y,r*2.2,D,.71);
  const outline=(scale,phase)=>Array.from({length:48},(_,i)=>{const a=i*TAU/48,rr=r*scale*(1+.12*Math.sin(a*5+t*7+phase)+.07*Math.sin(a*9-t*11+phase));return [x+Math.cos(a)*rr,Y+Math.sin(a)*rr]});
  poly(outline(1.65,0),D,.40);poly(outline(1.23,2),C,.85);
  const plasma=c.createRadialGradient(x-r*.22,Y-r*.27,0,x,Y,r*1.16);
  plasma.addColorStop(0,'#ffffff');plasma.addColorStop(.35,H);plasma.addColorStop(.76,C);plasma.addColorStop(1,D);
  poly(outline(1,4),plasma,1);
  // Three plasma filaments wrap around the core at different inclinations.
  for(let j=0;j<3;j++){
   const phase=t*(j%2?-5:4.5)+j*2.1,tilt=j*1.09+.38,pts=[];
   for(let i=0;i<=29;i++){const a=phase+i/29*PI*1.48,rr=r*(1.6+.22*j)*(1+.12*Math.sin(a*7+t*13));const u=Math.cos(a)*rr,v=Math.sin(a)*rr*.46;pts.push([x+u*Math.cos(tilt)-v*Math.sin(tilt),Y+u*Math.sin(tilt)+v*Math.cos(tilt)])}
   line(pts,D,7,.27);line(pts,C,3.2,.85);line(pts,H,1.15,.93);
  }
  // Short jagged corona arcs, rooted at the bright sphere and peeling away.
  for(let j=0;j<6;j++){
   const a=j*TAU/6+t*.72+k,span=1.7+hash(j+tick*23)*.8,pts=[];
   for(let i=0;i<=6;i++){const u=i/6,rr=r*(.84+span*u),ang=a+Math.sin(i*2.8+j+tick*.64)*.23*u;pts.push([x+Math.cos(ang)*rr,Y+Math.sin(ang)*rr])}
   bolt(pts,C,j%3===0?1.7:1.05,.46+.38*hash(j+tick*17));
  }
  // Local charge is anchored by moving sparks at the ground, not a base plate.
  for(let j=0;j<8;j++){
   const u=(t*.85+j/8)%1,a=j*2.399+t*1.2,rr=8+20*u,xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.48;
   line([[xx-2,yy+2],[xx+3,yy-2]],C,1.5,(1-u)*.76);
  }
  for(let j=0;j<2;j++){
   const pts=[[x,Y+r*.75]];for(let i=1;i<=7;i++){const u=i/7;pts.push([x+Math.sin(PI*u)*(hash(i+tick*11+j*15)-.5)*19,Y+r*.75+(y-Y-r*.75)*u])}bolt(pts,C,j?1.1:1.8,.72);
  }
 }
 c.restore();return true;
}
root.CatBondMagneticFX={draw};
})(typeof window!=='undefined'?window:globalThis);
