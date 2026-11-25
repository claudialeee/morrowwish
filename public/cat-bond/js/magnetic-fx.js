/* Cat Bond magnetic field V4: purely visual, no gameplay state. */
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
 function bolt(p,col,w,op){line(p,'#403376',w*4.7,op*.36);line(p,col,w*2.4,op*.84);line(p,'#fff9da',w*.75,op)}
 c.save();
 const g=c.createLinearGradient(...P(.5,-W),...P(.5,W));g.addColorStop(0,'#7c71e900');g.addColorStop(.12,'#8071e94d');g.addColorStop(.5,'#372a665c');g.addColorStop(.88,'#c8a5574d');g.addColorStop(1,'#c8a55700');
 poly([P(0,-W),P(1,-W),P(1,W),P(0,W)],g,.9);
 for(const side of [-1,1]){
  const pts=Array.from({length:25},(_,j)=>P(j/24,side*W));line(pts,'#beb0f0',1.6,.55);
  for(let j=0;j<9;j++){const u=(j/9+t*.52)%1,v=side*W*.86;line([P(u,v),P(Math.min(1,u+.045),v*.76),P(Math.min(1,u+.09),v)],side<0?'#a7b5ff':'#ffe097',2.4,.8)}
 }
 for(let i=0;i<7;i++){const u=(i/7+t*.25)%1;const pts=Array.from({length:17},(_,j)=>{const v=(j/16*2-1)*W;return P(u+.038*Math.sin(j*.8+t*3),v)});line(pts,'#bdb4ff',1,.24)}
 for(let j=0;j<5;j++){
  const pts=[],pts2=[];for(let i=0;i<=32;i++){const u=i/32,e=Math.sin(PI*u),v=Math.sin(u*16+t*5+j*1.4)*W*.28*e,z=rise*(.38+.13*j)+e*12*Math.sin(u*8-t*6+j);pts.push(P(u,v,z));pts2.unshift(P(u,v+9*Math.sin(u*PI),z-12-9*e))}
  poly(pts.concat(pts2),j%2?'#b0a1ff':'#e2b85c',.12+j*.024);
 }
 const tick=Math.floor(t*22);
 for(let j=0;j<4;j++){
  const pts=[];for(let i=0;i<=22;i++){const u=i/22,e=Math.sin(PI*u),v=e*(Math.sin(u*19+t*6+j*2)*W*.44+(hash(i+tick*71+j*137)-.5)*16),z=rise+e*((j-1.5)*15+(hash(i*3+tick*19+j*53)-.5)*22);pts.push(P(u,v,z))}
  bolt(pts,j%2?'#a49dff':'#f2d28b',j===0?3.7:2.1,.9);
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
  const x=k?b.x:a.x,y=k?b.y:a.y,z=rise+Math.sin(t*4+k)*4,Y=y-z,C=k?'#ffd477':'#aa9eff',D=k?'#a36c36':'#5d52aa',H=k?'#fff5b8':'#e9edff';
  ellipse(x,y,25,9,'#192139',.8);ellipse(x,y,19,6,C,.27);glow(x,Y,55,C,.76);glow(x,y,29,C,.48);
  poly([[x-13,Y-24],[x+4,Y-35],[x+20,Y-17],[x+15,Y+14],[x-3,Y+30],[x-22,Y+9]],'#202437',.98);
  poly([[x,Y-24],[x+12,Y-7],[x+8,Y+15],[x,Y+22],[x-12,Y+3]],C,1);
  poly([[x,Y-24],[x+12,Y-7],[x,Y+1]],H,1);poly([[x,Y+1],[x+8,Y+15],[x,Y+22]],D,1);poly([[x,Y-24],[x-12,Y+3],[x,Y+1]],D,1);
  for(let side of [-1,1]){
   poly([[x+side*9,Y-28],[x+side*24,Y-16],[x+side*25,Y+9],[x+side*11,Y+26],[x+side*17,Y+4],[x+side*16,Y-11]],'#343344',1);
   line([[x+side*9,Y-28],[x+side*24,Y-16],[x+side*25,Y+9],[x+side*11,Y+26]],C,1.8,.95);
  }
  for(let i=0;i<5;i++){const h=(i/5+t*.6)%1,ang=t*4+i*TAU/5;const xx=x+Math.cos(ang)*(20+h*17),yy=Y+Math.sin(ang)*14-h*23;line([[xx,yy],[xx-3,yy+8]],H,1.7,1-h)}
  bolt([[x,Y+23],[x+4,y-17],[x-5,y-9],[x,y]],C,1.8,.8);
 }
 c.restore();return true;
}
root.CatBondMagneticFX={draw};
})(typeof window!=='undefined'?window:globalThis);
