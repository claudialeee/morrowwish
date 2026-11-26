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
function iceBurst(c,x,y,p,a,r=90){glow(c,x,y,r*.48,'#b5e9ff',a*.34);for(let j=0;j<18;j++){const th=j*2.399,d=r*(.12+.88*p)*(.48+.52*rnd(j));shard(c,x+Math.cos(th)*d,y+Math.sin(th)*d*.70-15*Math.sin(p*PI),th+PI/2,5+13*rnd(j+10),'#88c8ec',a);}for(let j=0;j<7;j++)arc(c,x,y,r*p,j*.91,.50,'#d8fbff',2,a*.65,.65);}
function vineField(c,f,t,water=false){const R=f.r||86,col=water?'#78d9ef':'#9ad17d';for(let j=0;j<7;j++){let a=j*TAU/7+t*.4,p=[];for(let k=0;k<=18;k++){const u=k/18,rr=R*(1-u*.85),th=a+u*(water?1.9:.8);p.push([f.x+Math.cos(th)*rr,f.y+Math.sin(th)*rr]);}line(c,p,water?'#2b8eb8':'#537f45',water?5:4,.65);line(c,p,col,2,.85);if(!water){const [x,y]=p[7];leaf(c,x,y,a,9,'#a8d87e',.8);}}}
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
 if(sp==='yunduo')for(const a2 of a._linked||[]){if(a2.alive&&Math.hypot(x-a2.x,y-a2.y)<180){line(c,[[x,y],[x+(a2.x-x)*.5,y+(a2.y-y)*.5-9],[a2.x,a2.y]],'#e7d7ab',1.5,.45);}}
 if(a._traitArmor>0){for(let j=0;j<4;j++)arc(c,x,y,29,j*TAU/4+t*.2,.75,'#ffedb3',3,.7,.82);}
 if((a._cleanseGuardUntil||0)>t)for(let j=0;j<3;j++)star(c,x+Math.cos(j*TAU/3+t)*24,y+Math.sin(j*TAU/3+t)*19,4,'#fff5df',.8);
 if(sp==='duanduan'||sp==='xuewa')for(const q of a[sp==='duanduan'?'_duanduanTrail':'_xuewaTrail']||[]){const k=cl(1-(t-q.t)/(sp==='duanduan'?1.6:2));if(k<=0)continue;
   if(sp==='duanduan')bolt(c,q.x1,q.y1+12,q.x2,q.y2+12,t,Math.floor(q.t*100),col,k*.8,1.6);
   else{ell(c,q.x,q.y+13,9,4,col,k*.25);for(let j=0;j<3;j++)ell(c,q.x+(j-1)*3,q.y+9,1.8,1.5,'#dbfaff',k*.7);}}
 if(sp==='xingchen')for(const q of a._xingchenRifts||[])rift(c,q.x,q.y+8,t,cl(1-(t-q.t)/2.5));
 for(const q of a._echoQueue||[])rift(c,q.x,q.y,t,cl((q.at-t)/1.1)*.65);
}
function drawEvent(c,v,t){const p=cl((t-v.start)/v.life),a=1-p,col=colors[v.species]||'#fff1cc',x=v.x,y=v.y-8,sp=v.species;if(a<=0)return;
 if(v.link){const dx=x-v.ox,dy=y-v.oy;for(let j=0;j<3;j++){const q=[];for(let i=0;i<=15;i++){const u=i/15;q.push([v.ox+dx*u,v.oy+dy*u-Math.sin(PI*u)*(12+j*5)+Math.sin(u*12+t*8+j)*3]);}line(c,q,col,2.2-j*.45,a*.75);}star(c,v.ox+dx*p,v.oy+dy*p-18*Math.sin(PI*p),7,col,a);return;}
 if(sp==='dundun'){iceBurst(c,x,y,p,a,v.radius||90);return;}
 if(sp==='lanbao'){if(v.phase==='ready')shard(c,x+22,y-17,t*.8,10,col,a);else iceBurst(c,x,y,p,a,43);return;}
 if(['tangyuan','jinwu','qisi','abi'].includes(sp)){ember(c,x,y,t,a,12+p*32);glow(c,x,y,19+p*18,col,a*.28);return;}
 if(['duanduan','niuniu','wumao','xianluo','jinjc'].includes(sp)){for(let j=0;j<6;j++){const th=j*TAU/6+p*1.5;bolt(c,x,y,x+Math.cos(th)*(9+30*p),y+Math.sin(th)*(9+30*p),t,j,col,a*.8,1.6);}return;}
 if(['moqiu','youling','baomao','mengmai','xingchen'].includes(sp)){rift(c,x,y,t,a);for(let j=0;j<3;j++)arc(c,x,y,10+25*p,j*TAU/3+t*2,.9,col,2.1,a*.65,.7);return;}
 if(['xiaohui','fanmao','xuewa'].includes(sp)){for(let j=0;j<9;j++){const th=j*TAU/9;ell(c,x+Math.cos(th)*(8+25*p),y+Math.sin(th)*(8+25*p)-13*Math.sin(p*PI),2.5,4,col,a*.8);}return;}
 if(['doudou','meidu','nietu','nuowei','senlin','zherdd'].includes(sp)){for(let j=0;j<7;j++){const th=j*TAU/7+t*.8;leaf(c,x+Math.cos(th)*(12+28*p),y+Math.sin(th)*(12+28*p),th,8,col,a);}return;}
 for(let j=0;j<7;j++){const th=j*TAU/7;star(c,x+Math.cos(th)*(9+24*p),y+Math.sin(th)*(9+24*p),5,col,a);}
}
function draw(c,b){if(!c||!b)return;const t=b.t||0;c.save();
 for(const f of b.fields||[]){if(f.t<=0)continue;const sp=species(f._traitCaster);if(sp==='meidu'||sp==='fanmao')vineField(c,f,t,sp==='fanmao');}
 for(const a of b.team||[]){if(a.alive)drawReady(c,a,b,t);}
 for(const e of b.enemies||[]){if(!e.alive)continue;if(e._frostStack>0&&t-(e._frostStackT||0)<5)for(let j=0;j<e._frostStack;j++)shard(c,e.x-12+j*6,e.y-29,0,5,'#b6e5fb',.9);
 if(e._hunterMark&&e._hunterMarkExpire>t){const x=e.x,y=e.y-38;for(let j=0;j<4;j++){const th=j*TAU/4;line(c,[[x+Math.cos(th)*10,y+Math.sin(th)*10],[x+Math.cos(th)*5,y+Math.sin(th)*5]],'#e0b5ff',2,.8);}}
 if(e.status?.suppress>0){arc(c,e.x,e.y-18,19,t*.7,PI*1.3,'#9e82c6',2.6,.7,.6);}}
 for(const v of b._traitFX||[])if(t-v.start<v.life)drawEvent(c,v,t);
 c.restore();}
window.CatBondTraitFX={draw,drawEvent,colors};
})();