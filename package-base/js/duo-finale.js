/* Original 21-way cinematic finale. Each elemental duo has a unique
 * silhouette, rhythm, direction and payoff, never a reused three-claw stamp.
 * Effects live INSIDE the clipped cut-in and cannot block the battle HUD.
 */
(function(){
'use strict';
const PI=Math.PI,TAU=PI*2,clamp=x=>Math.max(0,Math.min(1,x));
const palette={dark:'#baa4ef',elec:'#f8d577',fire:'#ffac88',grass:'#98cba7',light:'#fff0bb',water:'#97d7ef'};
function stroke(g,c,w=3){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round'}
function dot(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,Math.max(.1,r),0,TAU);g.fill()}
function ring(g,x,y,r,c,w=4){stroke(g,c,w);g.beginPath();g.arc(x,y,Math.max(1,r),0,TAU);g.stroke()}
function path(g,pts,c,w=4){stroke(g,c,w);g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i+5<pts.length;i+=6)g.bezierCurveTo(...pts.slice(i,i+6));g.stroke()}
function ray(g,x,y,dx,dy,c,w=4){stroke(g,c,w);g.beginPath();g.moveTo(x,y);g.lineTo(x+dx,y+dy);g.stroke()}
function rays(g,x,y,r,c,n=12){for(let i=0;i<n;i++){let a=TAU*i/n;ray(g,x+Math.cos(a)*r*.60,y+Math.sin(a)*r*.60,Math.cos(a)*r*.51,Math.sin(a)*r*.51,c,i%3===0?5:2)}}
function star(g,x,y,r,c,n=5){g.fillStyle=c;g.beginPath();for(let i=0;i<n*2;i++){let a=i*PI/n-PI/2,d=i%2?r*.43:r;if(i)g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);else g.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fill()}
function petal(g,x,y,r,angle,c){g.save();g.translate(x,y);g.rotate(angle);g.fillStyle=c;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(r*.8,-r*.75,r*1.4,r*.55,0,r*1.7);g.bezierCurveTo(-r*1.4,r*.55,-r*.8,-r*.75,0,0);g.fill();g.restore()}
function flower(g,x,y,r,c,p){for(let i=0;i<5;i++)petal(g,x,y,r,p+i*TAU/5,c);dot(g,x,y,r*.30,'#fff8c8')}
function bolt(g,x,y,r,c,flip=1){stroke(g,c,Math.max(3,r*.045));g.beginPath();g.moveTo(x-r*.30*flip,y-r);g.lineTo(x+r*.12*flip,y-r*.35);g.lineTo(x-r*.12*flip,y-r*.23);g.lineTo(x+r*.35*flip,y+r);g.lineTo(x-r*.04*flip,y+r*.24);g.stroke()}
function wave(g,W,H,x,y,r,c,p){path(g,[x-r*1.15,y,x-r*.88,y-r*.75,x-r*.25,y-r*.85,x,y-r*.25,
  x+r*.24,y+r*.20,x+r*.58,y+r*.10,x+r*1.20,y-r*.50],c,Math.max(5,H*.024))}
function ribbon(g,x,y,r,c,p,n=3){stroke(g,c,Math.max(3,r*.08));g.beginPath();for(let i=0;i<=55;i++){
 let t=i/55,a=t*TAU*n+p*TAU,rr=r*(.12+.90*t);
 if(i)g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.67);
 else g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.67);
 }g.stroke()}
function arc(g,x,y,r,c,start=0,span=PI*1.5,w=6){stroke(g,c,w);g.beginPath();g.arc(x,y,Math.max(1,r),start,start+span);g.stroke()}
function shield(g,x,y,r,c){stroke(g,c,5);g.beginPath();g.moveTo(x,y-r);g.bezierCurveTo(x+r*.6,y-r*.5,x+r*.7,y+r*.1,x,y+r);g.bezierCurveTo(x-r*.7,y+r*.1,x-r*.6,y-r*.5,x,y-r);g.stroke()}
function paw(g,x,y,r,c){dot(g,x,y,r*.48,c);for(let i=0;i<4;i++)dot(g,x+r*(-.85+i*.55),y-r*.72-(i%2)*r*.15,r*.24,c)}
function heart(g,x,y,r,c){stroke(g,c,5);g.beginPath();g.moveTo(x,y+r);g.bezierCurveTo(x-r*1.6,y,x-r*.84,y-r*1.25,x,y-r*.40);g.bezierCurveTo(x+r*.84,y-r*1.25,x+r*1.6,y,x,y+r);g.stroke()}
function draw(g,W,H,p,key,tier=1){
 if(p<.13||p>.86)return;
 const pair=key.split('+'),ca=palette[pair[0]]||'#d2bce7',cb=palette[pair[1]]||'#d9f0dd';
 const wind=clamp((p-.13)/.14),release=1-clamp((p-.57)/.26);
 const impact=Math.max(0,1-Math.abs(p-.283)/.075),s=wind*release;
 const cx=W*.5,cy=H*.51,r=Math.min(W*.26,H*.34),power=1+.14*Math.max(0,tier-1);
 g.save();g.globalAlpha*=.76*s;g.shadowColor=ca;g.shadowBlur=10+15*impact;
 // Each effect depicts a different magical consequence of the cats' teamwork.
 switch(key){
 case 'dark+dark':
  g.globalAlpha*=.72;for(let i=0;i<3;i++)arc(g,cx,cy,r*(.58+i*.18)*power,ca,-p*TAU+i,PI*1.20,5);
  for(let i=0;i<7;i++)star(g,cx+Math.cos(i*2.4+p*4)*r,cy+Math.sin(i*2.4+p*4)*r*.65,7,cb);
  dot(g,cx-r*.12,cy-r*.04,9,'#fff2c7');dot(g,cx+r*.12,cy-r*.04,9,'#fff2c7');
  break;
 case 'dark+elec':
  for(let i=0;i<5;i++){const x=W*(.20+i*.15);ring(g,x,cy+Math.sin(i*2)*25,r*.25,ca,4);bolt(g,x,cy,r*.38,cb,i%2?1:-1)}
  break;
 case 'dark+fire':
  for(let i=-1;i<=1;i++){path(g,[cx-r*.8,cy+i*17,cx-r*.2,cy-r*.65+i*17,cx+r*.2,cy+r*.53+i*17,cx+r*.85,cy-r*.35+i*17],cb,11)}
  for(let i=0;i<8;i++)petal(g,cx+Math.cos(i)*r,cy+Math.sin(i)*r*.7,7,i,ca);
  break;
 case 'dark+grass':
  for(let i=0;i<7;i++){let x=W*(.13+i*.125),swing=Math.sin(p*4+i);
   path(g,[x,H*.89,x+30*swing,H*.62,x-50*swing,H*.38,x+18*swing,H*.10],ca,5);
   petal(g,x+18*swing,H*.23,9,i*1.7,cb)}
  break;
 case 'dark+light':
  dot(g,cx,cy-r*.35,r*.56,cb);dot(g,cx+r*.25,cy-r*.44,r*.51,'#a4a0c7');
  arc(g,cx,cy-r*.32,r*.62,'#ffffff',p*3,PI*1.4,4);rays(g,cx,cy-r*.32,r*.84,ca,12);
  break;
 case 'dark+water':
  for(let i=0;i<7;i++){let x=W*(.1+i*.13);path(g,[x,H*.73,x+30,H*.50,x-30,H*.31,x+20,H*.16],i%2?ca:cb,4)}
  for(let i=0;i<4;i++)arc(g,cx,cy+r*.16,r*(.2+i*.17),cb,0,PI,3);
  break;
 case 'elec+elec':
  for(let i=0;i<7;i++)bolt(g,W*(.16+i*.115),H*(.20+(i%3)*.17),r*.25+i%2*9,i%2?ca:cb,i%2?1:-1);
  rays(g,cx,cy,r,'#fff6d7',16);
  break;
 case 'elec+fire':
  ribbon(g,cx,cy,r*.96,ca,p,2);ribbon(g,cx,cy,r*.86,cb,-p,3);
  for(let i=0;i<5;i++)bolt(g,cx+Math.cos(i*TAU/5)*r,cy+Math.sin(i*TAU/5)*r*.7,r*.19,ca);
  break;
 case 'elec+grass':
  for(let i=0;i<6;i++){let x=W*(.18+i*.13);path(g,[x,H*.78,x-15,H*.6,x+35,H*.4,x,H*.14],cb,6);bolt(g,x,H*.40,r*.16,ca)}
  ring(g,cx,cy,r*.52,ca,4);
  break;
 case 'elec+light':
  for(let i=0;i<9;i++)ray(g,W*.09,cy+r*.60-i*r*.18,W*.80,-r*.48,cb,3+i%3);
  ring(g,cx,cy,r*.72,ca,6);rays(g,cx,cy,r*.74,cb,10);
  break;
 case 'elec+water':
  for(let i=0;i<12;i++){let x=W*(.11+(i%6)*.145),y=H*(.19+Math.floor(i/6)*.30);
   ring(g,x,y,8+(i%3)*6,cb,3);if(i%3===0)bolt(g,x,y,16,ca)}
  wave(g,W,H,cx,cy,r,cb,p);
  break;
 case 'fire+fire':
  for(let i=0;i<6;i++){let x=cx+Math.cos(i*TAU/6)*r*.85,y=cy+Math.sin(i*TAU/6)*r*.65;
   rays(g,x,y,r*.26,i%2?ca:cb,8);star(g,x,y,r*.11,'#fff2d0')}
  rays(g,cx,cy,r,ca,14);break;
 case 'fire+grass':
  for(let i=0;i<8;i++){let a=i*TAU/8+p*4;flower(g,cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.8,7+i%3*2,i%2?ca:cb,a)}
  ribbon(g,cx,cy,r*.6,ca,p,2);break;
 case 'fire+light':
  dot(g,cx,cy,r*.4,cb);ring(g,cx,cy,r*.55,ca,8);rays(g,cx,cy,r*.96,ca,18);
  star(g,cx,cy,r*.33,'#fff9f0',9);break;
 case 'fire+water':
  for(let i=0;i<5;i++){let x=cx-r*.8+i*r*.4;
   dot(g,x,cy-r*.32+Math.sin(i*3+p*9)*13,r*.22,cb);ring(g,x,cy-r*.36,r*.25,ca,3)}
  wave(g,W,H,cx,cy+r*.24,r,ca,p);rays(g,cx,cy,r*.58,cb,8);break;
 case 'grass+grass':
  for(let i=0;i<11;i++){let x=W*(.12+i*.075);
   path(g,[x,H*.89,x-23,H*.67,x+14,H*.4,x,H*.18],ca,4);
   petal(g,x,H*.28,6+i%4*2,i*.6,cb)}
  ring(g,cx,cy,r*.4,cb,6);break;
 case 'grass+light':
  heart(g,cx,cy,r*.53,cb);paw(g,cx-r*.19,cy,r*.22,ca);paw(g,cx+r*.19,cy,r*.22,ca);
  rays(g,cx,cy,r*.91,cb,12);break;
 case 'grass+water':
  for(let i=0;i<12;i++){let x=W*(.1+i*.075);ray(g,x,H*.14,-r*.19,H*.35,cb,3);
   petal(g,x-r*.16,H*.57,8,i*.6,ca)}
  flower(g,cx,cy,r*.19,ca,p*3);break;
 case 'light+light':
  for(let i=0;i<8;i++){let a=TAU*i/8;star(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.77,12,cb);
   if(i)ray(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.77,-Math.sin(a)*r*.6,Math.cos(a)*r*.43,ca,2)}
  star(g,cx,cy,r*.32,'#fff9da',7);break;
 case 'light+water':
  shield(g,cx,cy,r*.78,cb);ring(g,cx,cy,r*.57,ca,5);
  dot(g,cx,cy-r*.30,r*.25,ca);
  for(let i=0;i<4;i++)arc(g,cx,cy+r*.65,r*(.26+i*.15),cb,0,PI,3);
  break;
 case 'water+water':
  for(let i=0;i<4;i++)wave(g,W,H,cx,cy-r*.44+i*r*.34,r*(1-i*.1),i%2?ca:cb,p);
  for(let i=0;i<10;i++){let a=i*TAU/10+p*2;dot(g,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8,5+i%3*2,'#eafcff')}
  break;
 }
 // Shared timing of a white impact glint is not a reused skill animation;
 // all full signature silhouettes above remain individually different.
 if(impact>.02){
  g.globalAlpha=Math.min(.55,impact*.42);ring(g,cx,cy,r*(.28+impact*.3),'#fffdf8',3);
  dot(g,cx,cy,r*.07*impact,'#fffefa');
 }
 g.restore();
}
window.CatBondDuoFinale={draw,keys:Object.keys(window.CatBondDuoDirector?.styles||{}),variantCount:21};
})();