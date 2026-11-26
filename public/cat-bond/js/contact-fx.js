/* Compact contact art. All positions are resolved contact positions; no gameplay writes.
   The maximum local silhouette is about one cat body wide for regular hits. */
(()=>{'use strict';
const PI=Math.PI,T=2*PI,cl=x=>Math.max(0,Math.min(1,x)),h=n=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x)};
const PAL={fire:['#a84027','#ff963f','#fff3bd'],water:['#246a9d','#68cce9','#eaffff'],ice:['#4f8bc1','#a6e2fa','#f2ffff'],grass:['#3d613b','#93c664','#e9f5b6'],elec:['#58449e','#b5a6ff','#fff3b5'],dark:['#30213e','#a47bdc','#f6dfff'],light:['#9d8cba','#d3e7ff','#fffcef'],neutral:['#805e45','#e4bc8e','#fff3d5']};
function shape(c,pts,col,a){c.globalAlpha=cl(a);c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function line(c,pts,col,w,a){c.globalAlpha=cl(a);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
function ellipse(c,x,y,rx,ry,col,a){c.globalAlpha=cl(a);c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,T);c.fill()}
function glow(c,x,y,r,col,a){const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ellipse(c,x,y,r,r,g,a)}
function edge(c,x,y,r,w,ang,col,a){c.save();c.translate(x,y);c.rotate(ang);c.globalAlpha=cl(a);c.fillStyle=col;c.beginPath();c.moveTo(-r,0);c.bezierCurveTo(-r*.25,-w,r*.66,-w*.9,r,0);c.bezierCurveTo(r*.35,-w*.23,-r*.2,w*.18,-r,0);c.fill();c.restore()}
function spike(c,ang,d,l,w,col,a){const x=Math.cos(ang),y=Math.sin(ang);shape(c,[[x*d,y*d],[x*(d+l*.38)-y*w,y*(d+l*.38)+x*w],[x*(d+l),y*(d+l)],[x*(d+l*.38)+y*w,y*(d+l*.38)-x*w]],col,a)}
function shard(c,x,y,r,ang,P,a){c.save();c.translate(x,y);c.rotate(ang);shape(c,[[0,-r],[r*.45,0],[0,r*.65],[-r*.38,0]],P[0],a);shape(c,[[0,-r],[r*.45,0],[0,r*.65]],P[1],a);line(c,[[0,-r],[-r*.38,0],[0,r*.65]],P[2],1,a);c.restore()}
function shock(c,r,p,P,a){c.globalAlpha=a*.68;c.strokeStyle=P[1];c.lineWidth=2.2*(1-p)+.6;c.beginPath();c.ellipse(0,9,r,r*.43,0,0,T);c.stroke()}
function bolt(c,ang,r,t,j,P,a){const x=Math.cos(ang),y=Math.sin(ang),pts=[[0,0]];for(let i=1;i<=6;i++){const q=i/6,d=(h(j*17+i+Math.floor(t*18)*31)-.5)*r*.22;pts.push([x*q*r-y*d,y*q*r+x*d])}line(c,pts,P[0],5,a*.48);line(c,pts,P[1],2.6,a);line(c,pts,P[2],1,a);const m=pts[3];line(c,[m,[m[0]+x*r*.18-y*8,m[1]+y*r*.18+x*8],[m[0]+x*r*.32-y*12,m[1]+y*r*.32+x*12]],P[1],1.5,a*.65)}
function classify(type,sk){
 if(['heal','cleanse','guard','reflect','barrier','wardFade','shieldBreak','kill','stagger'].includes(type))return type;
 const tags=[...(sk?.tags||[]),...([sk?.appliesTag].flat().filter(Boolean))];
 if(tags.includes('chill')||['frostLance','frostClaw'].includes(sk?.id))return 'ice';
 if(sk?.id==='meteor'||sk?.id==='quakeStomp')return 'smash';
 if(sk?.element==='fire')return 'fire';if(sk?.element==='water')return 'water';if(sk?.element==='elec')return 'elec';if(sk?.element==='dark')return 'dark';
 if(sk?.element==='grass')return sk.kind==='melee'?'vine':'grass';
 if(sk?.element==='light')return sk.kind==='melee'||sk.id==='crescentFan'?'slash':'light';
 return ['melee','pounce','dash'].includes(sk?.kind)?'slash':type;
}
function draw(c,e,t=0){
 const p=cl(1-e.life/e.max),a=1-p;if(a<=0)return true;
 const kind=e.style||'light',strong=e.tier==='heavy'||e.tier==='crit'||e.tier==='kill',critical=e.tier==='crit';
 const R=(e.tier==='kill'?36:critical?31:strong?26:18)*(e.scale||1),q=1-Math.pow(1-p,2.8),flash=Math.max(0,1-p*5),ang=e.angle||0;
 const P=PAL[kind==='vine'?'grass':kind==='slash'?(e.element||'light'):kind==='smash'?'neutral':kind==='shieldBreak'||kind==='barrier'||kind==='reflect'?'ice':kind==='heal'||kind==='cleanse'?'grass':kind]||PAL.neutral;
 c.save();c.translate(e.x,e.y-6);
 if(!['heal','cleanse','guard','barrier','wardFade'].includes(kind))glow(c,0,0,R*.75,P[2],flash*.7);
 if(kind==='fire'){for(let j=0;j<6;j++){const th=ang+(j-2.5)*.53+Math.sin(j)*.22,r=R*(.55+q*.7);c.save();c.rotate(th);const g=c.createLinearGradient(0,0,r,0);g.addColorStop(0,P[2]);g.addColorStop(.42,P[1]);g.addColorStop(1,'rgba(160,44,20,0)');c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(r*.35,-r*.43,r,0);c.quadraticCurveTo(r*.4,r*.15,0,7);c.fill();c.restore()}}
 else if(kind==='water'){for(let j=0;j<6;j++){const th=ang+(j-2.5)*.54,rr=R*(.5+.6*q);c.save();c.rotate(th);const g=c.createLinearGradient(0,0,rr,0);g.addColorStop(0,P[2]);g.addColorStop(.55,P[1]);g.addColorStop(1,'rgba(45,137,187,0)');c.globalAlpha=a*.9;c.fillStyle=g;c.beginPath();c.moveTo(0,-3);c.bezierCurveTo(rr*.28,-rr*.55,rr*.74,-rr*.25,rr,0);c.quadraticCurveTo(rr*.3,-rr*.06,0,5);c.fill();c.restore();ellipse(c,Math.cos(th)*rr,Math.sin(th)*rr,2.4,3.5,P[1],a)}}
 else if(kind==='ice'||kind==='shieldBreak'){for(let j=0;j<(strong?12:8);j++){const th=j*2.399,d=R*(.20+q)*(.65+.35*h(j));shard(c,Math.cos(th)*d,Math.sin(th)*d,4+6*h(j+8),th+p*2,P,a)}}
 else if(kind==='elec'){for(let j=0;j<5;j++)bolt(c,j*T/5+ang,R*(.7+q*.4),t,j,P,a)}
 else if(kind==='dark'){for(let j=0;j<4;j++){const th=ang+j*PI/2+p*.65;edge(c,Math.cos(th)*q*R*.28,Math.sin(th)*q*R*.28,R*.88,8,th,P[0],a*.85);edge(c,0,0,R*.8,4,th+.18,P[1],a*.86)}}
 else if(kind==='slash'){edge(c,0,0,R*1.26,8,ang-.6,P[0],a*.65);edge(c,0,0,R*1.17,6,ang-.6,P[1],a);edge(c,0,0,R*1.08,2.7,ang-.6,P[2],a)}
 else if(kind==='smash'||kind==='heavy'||kind==='kill'||kind==='stagger'){
   shock(c,R*(.4+q*.9),p,P,a);for(let j=0;j<7;j++){const th=j*2.399,d=R*q;shard(c,Math.cos(th)*d,Math.sin(th)*d*.65-10*Math.sin(PI*p),3+5*h(j),th+p,P,a)}
 }
 else if(kind==='grass'||kind==='vine'){for(let j=0;j<5;j++){const th=j*T/5+ang,r=R*(.5+q*.6);c.save();c.rotate(th);c.globalAlpha=a;c.strokeStyle=P[0];c.lineWidth=5;c.beginPath();c.moveTo(-5,5);c.quadraticCurveTo(r*.4,-12,r,0);c.stroke();c.strokeStyle=P[1];c.lineWidth=2;c.stroke();c.restore();ellipse(c,Math.cos(th)*r,Math.sin(th)*r,6,2.6,P[1],a)}}
 else if(kind==='heal'||kind==='cleanse'){for(let j=0;j<5;j++){const th=j*T/5+p*2,rr=R*.72;edge(c,Math.cos(th)*rr,Math.sin(th)*rr-16*p,8,5,th,P[1],a);glow(c,Math.cos(th)*rr,Math.sin(th)*rr-16*p,5,P[2],a*.6)}}
 else if(['guard','barrier','reflect','wardFade'].includes(kind)){c.globalAlpha=a*.7;c.strokeStyle=P[1];c.lineWidth=3;c.beginPath();c.arc(0,0,R*(.8+.15*q),-.9,2.8);c.stroke();c.strokeStyle=P[2];c.lineWidth=1;c.stroke()}
 if(!['heal','cleanse','guard','barrier','wardFade'].includes(kind)){for(let j=0;j<(strong?9:5);j++){const th=ang+(h(j+12)-.5)*3.9,d=R*q*(.35+h(j)*.43);spike(c,th,d,(4+10*h(j+2))*(1-.55*p),1.4+h(j+1),j%2?P[2]:P[1],a)}}
 if(critical){edge(c,0,0,R*1.12,3,ang+.48,'#fff7d6',a*.92)}
 c.restore();return true;
}
window.CatBondContactFX={classify,draw};
})();