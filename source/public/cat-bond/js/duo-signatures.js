// Distinct hand-authored attack choreography for every pair of elements.
// 21 independent beats: movement, stage motif, and a recognizable finisher.
// This layer NEVER breaks kitten sprites apart: both complete kitten rigs are
// drawn after the backdrops, with paw attacks animated on the same body rig.
(function(){
'use strict';
const PI=Math.PI, TAU=PI*2;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>1-(1-clamp(v))**3;
const C={dark:'#bcb0ea',light:'#fff0bd',fire:'#ffab80',water:'#9fdbf7',
 grass:'#b2e3a1',elec:'#ffe58a',cream:'#fff5df',pink:'#f7c0d6',sea:'#6aafe0'};
function ln(g,x,y,X,Y,c,w=3){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke()}
function orb(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,Math.max(0,r),0,TAU);g.fill()}
function ring(g,x,y,r,c,w=3){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.arc(x,y,Math.max(0,r),0,TAU);g.stroke()}
function oval(g,x,y,rx,ry,c,angle=0){g.save();g.translate(x,y);g.rotate(angle);g.fillStyle=c;g.beginPath();g.ellipse(0,0,Math.max(0,rx),Math.max(0,ry),0,0,TAU);g.fill();g.restore()}
function bez(g,coords,c,w=4){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(coords[0],coords[1]);g.bezierCurveTo(...coords.slice(2));g.stroke()}
function flower(g,x,y,r,c,turn=0){for(let i=0;i<5;i++){let a=turn+i*TAU/5;oval(g,x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,r*.36,r*.62,c,a)}orb(g,x,y,r*.24,C.cream)}
function leaf(g,x,y,r,a,c){g.save();g.translate(x,y);g.rotate(a);g.fillStyle=c;g.beginPath();g.moveTo(-r,0);g.quadraticCurveTo(0,-r,r,0);g.quadraticCurveTo(0,r,-r,0);g.fill();g.restore()}
function star(g,x,y,r,c,points=5){g.fillStyle=c;g.beginPath();for(let i=0;i<points*2;i++){let a=-PI/2+i*PI/points,d=i%2?r*.42:r;let xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d;if(!i)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.closePath();g.fill()}
function bolt(g,x,y,r,c){g.strokeStyle=c;g.lineWidth=5;g.lineJoin='miter';g.beginPath();g.moveTo(x-15,y-r);g.lineTo(x+12,y-r*.35);g.lineTo(x-9,y);g.lineTo(x+17,y+r*.52);g.lineTo(x-2,y+r);g.stroke()}
function arc(g,x,y,r,p,c,w=5){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.arc(x,y,r,-PI*.7+p*.45,PI*.8+p*.45);g.stroke()}
function scratch(g,x,y,r,a,c){
 g.save();g.translate(x,y);g.rotate(a);g.strokeStyle=c;g.lineWidth=5;g.lineCap='round';
 for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(-r*.52,i*13-r*.18);g.quadraticCurveTo(-r*.10,i*12,r*.5,i*13+r*.2);g.stroke()}g.restore()}
function swirl(g,x,y,r,p,c,twists=2){
 g.strokeStyle=c;g.lineWidth=5;g.lineCap='round';g.beginPath();
 for(let i=0;i<=64;i++){let t=i/64,a=t*TAU*twists+p*TAU,rr=r*(.12+.88*t);
 let xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.72;if(i)g.lineTo(xx,yy);else g.moveTo(xx,yy)}g.stroke()}
function ripples(g,x,y,r,c){for(let i=0;i<3;i++){g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(x,y+(i-1)*10,r+i*14,(r+i*14)*.28,0,0,TAU);g.stroke()}}
function wing(g,x,y,r,a,c){g.save();g.translate(x,y);g.rotate(a);g.fillStyle=c;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(r,-r*1.3,r*1.65,-r*.1);g.quadraticCurveTo(r*.85,r*.9,0,0);g.fill();g.restore()}
function burst(g,x,y,r,c,count=8){for(let i=0;i<count;i++){let a=i*TAU/count;ln(g,x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25,x+Math.cos(a)*r,y+Math.sin(a)*r,c,i%2?2:4)}}
function snow(g,x,y,r,c){ln(g,x-r,y,x+r,y,c,2);ln(g,x,y-r,x,y+r,c,2);ln(g,x-r*.7,y-r*.7,x+r*.7,y+r*.7,c,2);ln(g,x+r*.7,y-r*.7,x-r*.7,y+r*.7,c,2)}
function motif(g,W,H,p,fn,n=7){for(let i=0;i<n;i++){let a=i*TAU/n+p*.6,r=Math.min(W,H)*(.24+.045*Math.sin(i*1.5));fn(W*.5+Math.cos(a)*r,H*.5+Math.sin(a)*r,i,a)}}
function curtain(g,W,H,col,p){g.save();g.globalAlpha=.13+.13*Math.sin(p*PI);for(let i=0;i<5;i++)oval(g,W*(i+.5)/5,H*.49,25+32*p,H*.7,col);g.restore()}
function trails(g,W,H,p,c,n=4){for(let i=0;i<n;i++){
 let y=H*(.28+.14*i),x=W*(.15+.18*i+p*.2);ln(g,x-90,y+25,x+90,y-25,c,2+i%2*3)}}
const entries={
 'dark+dark':{style:'shadow',label:'Shadow Hunt',draw(g,W,H,p){
  curtain(g,W,H,C.dark,p);motif(g,W,H,p,(x,y,i)=>{oval(g,x,y,20+18*p,8,C.dark,i%2*.5);scratch(g,x,y,43,i*.4,C.cream)},5);
  if(p>.38)scratch(g,W*.5,H*.48,140,-.5,C.dark);
 }},
 'dark+elec':{style:'blink',label:'Shadowbolt Teleport',draw(g,W,H,p){
  for(let i=0;i<4;i++){let x=W*(.19+.21*i),y=H*(.31+.15*(i%2));ring(g,x,y,23+20*p,C.dark,4);bolt(g,x,y,30+18*p,C.elec)}
  if(p>.36){scratch(g,W*.5,H*.5,160,.4,C.elec);star(g,W*.5,H*.35,20,C.cream)}
 }},
 'dark+fire':{style:'ember',label:'Midnight Ember Claws',draw(g,W,H,p){
  motif(g,W,H,p,(x,y,i,a)=>{wing(g,x,y,24+10*p,a,C.fire);star(g,x+9,y-10,7,C.dark)},9);
  if(p>.30){scratch(g,W*.5,H*.48,166,-.15,C.fire);arc(g,W*.5,H*.5,56+28*p,p,C.dark,8)}
 }},
 'dark+grass':{style:'vine',label:'Nightvine Ambush',draw(g,W,H,p){
  for(let i=0;i<5;i++){const x=W*(.13+.18*i);bez(g,[x,H*.82,x-30,H*.48,x+50,H*.42,x+30,H*.2],C.grass,5);wing(g,x+30,H*.38,15,p+i,C.dark)}
  if(p>.35){scratch(g,W*.5,H*.5,140,.25,C.cream);ring(g,W*.5,H*.5,24+18*p,C.grass)}
 }},
 'dark+light':{style:'eclipse',label:'Moonlight Eclipse',draw(g,W,H,p){
  orb(g,W*.5,H*.40,71+18*p,C.light);orb(g,W*.53,H*.38,67,C.dark);
  motif(g,W,H,p,(x,y,i)=>star(g,x,y,9+i%3*5,C.cream),8);
  if(p>.40){scratch(g,W*.5,H*.53,158,-.38,C.light);arc(g,W*.5,H*.49,97,p,C.dark,6)}
 }},
 'dark+water':{style:'mist',label:'Deepwater Mirage',draw(g,W,H,p){
  curtain(g,W,H,C.water,p);for(let i=0;i<7;i++){let x=W*(.1+.13*i);
   bez(g,[x,H*.69,x+40,H*.35,x-40,H*.4,x+20,H*.20],i%2?C.water:C.dark,3)}
  if(p>.35){ripples(g,W*.5,H*.52,59+23*p,C.cream);scratch(g,W*.5,H*.5,136,.4,C.water)}
 }},
 'elec+elec':{style:'zigzag',label:'Twin Lightning Dash',draw(g,W,H,p){
  for(let i=0;i<5;i++)bolt(g,W*(.18+.16*i),H*(.31+.12*(i%2)),36+16*p,i%2?C.cream:C.elec);
  trails(g,W,H,p,C.elec,6);if(p>.42)burst(g,W*.5,H*.5,92,C.cream,12)
 }},
 'elec+fire':{style:'spiral',label:'Thunderfire Pawstorm',draw(g,W,H,p){
  swirl(g,W*.5,H*.50,75+65*p,p,C.fire,2);
  swirl(g,W*.5,H*.50,55+77*p,-p,C.elec,3);
  for(let i=0;i<4;i++)bolt(g,W*(.22+.19*i),H*.22,40,C.elec);
  if(p>.47)scratch(g,W*.5,H*.50,177,-.4,C.cream)
 }},
 'elec+grass':{style:'snare',label:'Thunderroot Snare',draw(g,W,H,p){
  for(let i=0;i<6;i++){let x=W*(.12+i*.15),a=i*.8+p;
   bez(g,[x,H*.8,x-30,H*.65,x+30,H*.39,x+15,H*.25],C.grass,5);
   bolt(g,x+15,H*.27,20+12*p,C.elec)}
  if(p>.4){scratch(g,W*.5,H*.48,160,.3,C.cream);ring(g,W*.5,H*.5,72,C.elec,4)}
 }},
 'elec+light':{style:'dash',label:'Radiant Spark Rush',draw(g,W,H,p){
  trails(g,W,H,p,C.cream,7);motif(g,W,H,p,(x,y,i)=>star(g,x,y,10+i%3*5,C.elec),9);
  if(p>.38){burst(g,W*.5,H*.47,90,C.light,12);scratch(g,W*.5,H*.5,158,-.35,C.elec)}
 }},
 'elec+water':{style:'bubbles',label:'Thunder Bubble Rain',draw(g,W,H,p){
  motif(g,W,H,p,(x,y,i)=>{ring(g,x,y,16+i%3*5,C.water,3);bolt(g,x,y,13,C.elec)},10);
  for(let i=0;i<5;i++)orb(g,W*(.2+i*.15),H*(.3+.1*(i%2)),8+5*p,C.cream);
  if(p>.41){ripples(g,W*.5,H*.52,78,C.water);scratch(g,W*.5,H*.5,140,-.3,C.elec)}
 }},
 'fire+fire':{style:'fireworks',label:'Twin Ember Festival',draw(g,W,H,p){
  motif(g,W,H,p,(x,y,i)=>{burst(g,x,y,22+17*p,i%2?C.fire:C.cream,7);orb(g,x,y,5,C.fire)},7);
  burst(g,W*.5,H*.4,103*p+35,C.fire,14);
  if(p>.42){scratch(g,W*.5,H*.48,170,.25,C.cream);star(g,W*.5,H*.28,35,C.fire)}
 }},
 'fire+grass':{style:'petals',label:'Blossomfire Pawdance',draw(g,W,H,p){
  motif(g,W,H,p,(x,y,i,a)=>{flower(g,x,y,15+i%3*4,i%2?C.fire:C.pink,p*3);wing(g,x+15,y,16,a,C.grass)},8);
  if(p>.4){scratch(g,W*.5,H*.48,158,-.4,C.fire);flower(g,W*.5,H*.33,33,C.pink,p*4)}
 }},
 'fire+light':{style:'solar',label:'Sunflare Pawburst',draw(g,W,H,p){
  ring(g,W*.5,H*.47,72+14*p,C.light,9);burst(g,W*.5,H*.47,108+35*p,C.fire,15);
  motif(g,W,H,p,(x,y)=>star(g,x,y,9,C.cream),9);
  if(p>.37)scratch(g,W*.5,H*.5,165,.5,C.cream)
 }},
 'fire+water':{style:'cannon',label:'Steamcloud Cat Cannon',draw(g,W,H,p){
  for(let i=0;i<6;i++)oval(g,W*(.15+i*.14),H*(.39+.12*(i%2)),25+25*p,16+15*p,C.cream);
  ripples(g,W*.5,H*.51,65+30*p,C.water);
  if(p>.4){burst(g,W*.5,H*.5,84+26*p,C.fire,9);scratch(g,W*.5,H*.5,162,-.24,C.water)}
 }},
 'grass+grass':{style:'sprout',label:'Twinleaf Awakening',draw(g,W,H,p){
  for(let i=0;i<8;i++){let x=W*(.1+i*.11);bez(g,[x,H*.80,x+5,H*.55,x-20,H*.38,x+8,H*.19],C.grass,4);
   wing(g,x+8,H*.30,18+9*p,i*.3,C.cream)}
  if(p>.35){ring(g,W*.5,H*.48,84+25*p,C.grass,5);scratch(g,W*.5,H*.49,143,-.3,C.cream)}
 }},
 'grass+light':{style:'halo',label:'Dawnbloom Halo',draw(g,W,H,p){
  for(let i=0;i<3;i++)ring(g,W*.5,H*.48,40+27*i+p*18,i===1?C.grass:C.light,4);
  motif(g,W,H,p,(x,y,i)=>flower(g,x,y,11+i%3*3,C.cream,p),8);
  if(p>.4){star(g,W*.5,H*.39,32,C.light);scratch(g,W*.5,H*.51,146,.30,C.grass)}
 }},
 'grass+water':{style:'blossom',label:'Spring Rain Bloom',draw(g,W,H,p){
  for(let i=0;i<10;i++){let x=W*(.07+i*.09);
   ln(g,x,H*.2,x-25,H*(.45+.1*p),C.water,3);wing(g,x,H*.57,15,i*.4,C.grass)}
  motif(g,W,H,p,(x,y,i)=>flower(g,x,y,11+i%2*3,C.cream,p),7);
  if(p>.45){ripples(g,W*.5,H*.56,83,C.water);scratch(g,W*.5,H*.47,138,-.4,C.grass)}
 }},
 'light+light':{style:'stars',label:'Twin Starlight Blessing',draw(g,W,H,p){
  const constellation=[[.23,.27],[.38,.33],[.5,.17],[.67,.33],[.79,.23],[.5,.65]];
  constellation.forEach(([x,y],i)=>{star(g,W*x,H*y,12+i%3*4,C.light);
   if(i)ln(g,W*constellation[i-1][0],H*constellation[i-1][1],W*x,H*y,C.cream,2)});
  if(p>.35){ring(g,W*.5,H*.5,90,C.light,7);burst(g,W*.5,H*.5,125,C.cream,8);scratch(g,W*.5,H*.5,126,.1,C.cream)}
 }},
 'light+water':{style:'lake',label:'Moonlit Lake Ward',draw(g,W,H,p){
  orb(g,W*.5,H*.33,38+13*p,C.light);ripples(g,W*.5,H*.6,66+25*p,C.water);
  motif(g,W,H,p,(x,y,i)=>{orb(g,x,y,4+i%2*3,C.cream);ring(g,x,y,10,C.water,2)},7);
  if(p>.42){ring(g,W*.5,H*.5,98,C.cream,5);scratch(g,W*.5,H*.51,138,.27,C.water)}
 }},
 'water+water':{style:'tides',label:'Twin Tidal Echo',draw(g,W,H,p){
  for(let i=0;i<4;i++){let y=H*(.34+i*.13);
   bez(g,[W*.12,y,W*.36-20*p,y-60,W*.64+20*p,y+60,W*.89,y-15],
    i%2?C.cream:C.water,5)}
  motif(g,W,H,p,(x,y,i)=>{ring(g,x,y,16+i%3*5,C.water,2);if(i%2===0)snow(g,x,y,8,C.cream)},8);
  if(p>.41){scratch(g,W*.5,H*.5,153,-.35,C.cream);ripples(g,W*.5,H*.55,103,C.water)}
 }}
};
function course(style,p,W,h,cy,tier=1){
 // Every pair uses its own footwork while the whole cat stays a single rigid
 // articulated subject (forearm, paw and claws all follow the same transform).
 const q=ease((p-.08)/.53),bounce=Math.sin(clamp((p-.10)/.75)*PI);
 const y0=cy+h*.20;
 let x1=W*(.24+.20*q),x2=W*(.76-.20*q);
 let y1=y0-bounce*h*.12,y2=y0-bounce*h*.10;
 let phase1=p,phase2=p,scale=1;
 switch(style){
  case 'shadow':x1=W*(.20+.23*q);x2=W*(.80-.23*q);y1+=Math.sin(PI*4*p)*8;y2-=Math.sin(PI*4*p)*8;break;
  case 'blink':x1=W*(.17+.26*q);x2=W*(.83-.26*q);y1-=bounce*h*.11;y2+=bounce*h*.06;break;
  case 'ember':y1-=bounce*h*.21;y2+=bounce*h*.04;break;
  case 'vine':x1=W*(.22+.13*q);x2=W*(.78-.27*q);y2-=bounce*h*.14;break;
  case 'eclipse':y1-=Math.sin(PI*2*p)*h*.1;y2+=Math.sin(PI*2*p)*h*.1;break;
  case 'mist':x1=W*(.17+.26*q);x2=W*(.82-.21*q);y1-=bounce*h*.07;break;
  case 'zigzag':x1=W*(.16+.29*q);x2=W*(.84-.29*q);y1+=Math.sin(PI*6*p)*h*.09;y2-=Math.sin(PI*6*p)*h*.09;break;
  case 'spiral':x1=W*(.31+.14*q+Math.sin(p*PI*2)*.05);x2=W*(.69-.14*q-Math.sin(p*PI*2)*.05);y1-=bounce*h*.15;y2+=bounce*h*.08;break;
  case 'snare':x1=W*(.23+.16*q);x2=W*(.77-.27*q);y2-=bounce*h*.17;break;
  case 'dash':x1=W*(.15+.29*q);x2=W*(.84-.26*q);phase2=clamp(p+.13);break;
  case 'bubbles':y1-=bounce*h*.19;y2-=bounce*h*.13;break;
  case 'fireworks':y1-=bounce*h*.27;y2-=bounce*h*.27;scale=1.03;break;
  case 'petals':y1-=bounce*h*.14;y2-=bounce*h*.24;break;
  case 'solar':x1=W*(.24+.26*q);x2=W*(.75-.19*q);y1-=bounce*h*.19;break;
  case 'cannon':x1=W*(.28+.13*q);x2=W*(.72-.13*q);y1+=bounce*h*.06;y2+=bounce*h*.06;break;
  case 'sprout':x1=W*(.28+.12*q);x2=W*(.72-.12*q);y1-=bounce*h*.08;y2-=bounce*h*.08;break;
  case 'halo':y1-=bounce*h*.09;y2-=bounce*h*.17;break;
  case 'blossom':y1-=bounce*h*.18;y2-=bounce*h*.08;break;
  case 'stars':y1-=Math.sin(PI*2*p)*h*.1;y2+=Math.sin(PI*2*p)*h*.1;break;
  case 'lake':x1=W*(.26+.15*q);x2=W*(.74-.15*q);y1-=bounce*h*.06;break;
  case 'tides':x1=W*(.17+.26*q);x2=W*(.83-.26*q);y1-=bounce*h*.17;y2-=bounce*h*.17;scale=1.04;break;
 }
 // Guaranteed separate heads even at the crossover hit beat; their PAWS
 // reach across the center while each whole cat remains individually readable.
 x1=Math.min(x1,W*.35);x2=Math.max(x2,W*.65);
 return {x1,x2,y1,y2,phase1,phase2,scale:scale*(tier>=3?1.04:1)};
}
function paint(ctx,W,H,p,tier,key){
 const sig=entries[key];if(!sig)return false;
 ctx.save();
 // translucent background effects, keeping kitten faces visible.
 ctx.globalAlpha*=.80;
 sig.draw(ctx,W,H,p,tier);
 ctx.restore();
 return true;
}
window.CatBondDuoSignatures={
 entries,keys:Object.keys(entries),get:key=>entries[key]||null,course,paint
};
})();
