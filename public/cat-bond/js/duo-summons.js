/* Cat Bond: six giant original celestial summons behind 21 unique finishers.
 * Designed for the hero's cinematic layer, not reused yard actors/assets.
 * The animal silhouettes remain one continuous body, with attached tails/fins.
 */
(function(){
'use strict';
const T=Math.PI*2,P=Math.PI;
const clamp=x=>Math.max(0,Math.min(1,x));
const palettes={
 dark:['#574778','#a997e5','#e7dcff'],elec:['#6c6b9b','#aec9ff','#fff5b4'],
 fire:['#a96765','#ffb67d','#fff4c9'],grass:['#568f8c','#b5dbc6','#ffffe4'],
 light:['#c8af8d','#fff5d6','#ffffff'],water:['#6da9bb','#a8e4ee','#f1fdff']
};
function shape(c,d,fill,stroke,w=2){
 c.beginPath();c.moveTo(d[0],d[1]);
 for(let i=2;i+5<d.length;i+=6)c.bezierCurveTo(...d.slice(i,i+6));
 c.closePath();if(fill){c.fillStyle=fill;c.fill()}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}
}
function line(c,d,color,w=3){
 c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(d[0],d[1]);
 for(let i=2;i+5<d.length;i+=6)c.bezierCurveTo(...d.slice(i,i+6));
 c.stroke();
}
function dot(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,T);c.fill()}
function shine(c,x,y,r,color){c.strokeStyle=color;c.lineWidth=2;c.beginPath();
 c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke()}
function phoenix(c,a,b,d,p){
 // Tail, attached to the same body. A glowing phoenix is unmistakable even
 // on a phone, unlike a repeated three-claw slash.
 for(let i=-2;i<=2;i++){
   shape(c,[0,46,i*12,102,i*45,126,i*22,158,i*39,102,i*8,73,0,46],
      i%2?b:a,d,1.5);
 }
 for(let s of [-1,1]){
  shape(c,[s*20,-37,s*90,-100,s*129,-135,s*154,-120,
    s*160,-96,s*138,-44,s*68,8,s*50,15,s*29,-20,s*20,-37],
    a,d,3);
  for(let i=0;i<7;i++){
   shape(c,[s*(32+i*14),-48-i*5,s*(82+i*12),-77-i*7,
     s*(107+i*10),-120+i*5,s*(116+i*7),-102+i*8,
     s*(92+i*8),-38+i*6,s*52,-8,s*(32+i*14),-48-i*5],i%2?b:a,d,1.3);
  }
 }
 shape(c,[0,-102,-27,-81,-40,-38,-26,19,-11,60,18,59,28,18,
  43,-22,22,-83,0,-102],a,d,3);
 shape(c,[-13,-104,-26,-123,-26,-146,0,-146,22,-142,25,-120,16,-99,0,-93,-13,-104],b,d,2);
 shape(c,[15,-124,34,-121,45,-107,20,-102,16,-107,15,-116,15,-124],d);
 dot(c,7,-128,4,4,'#fefde8');
 for(let i=0;i<5;i++)shine(c,Math.sin(i*7)*120,-90+Math.cos(i*5)*64,7,d);
}
function whale(c,a,b,d,p){
 // Vast curved body, forked tail and both connected fins.
 shape(c,[-142,11,-80,-69,45,-100,126,-51,169,-19,139,33,75,49,
   30,66,-40,95,-126,52,-142,11],a,d,3);
 shape(c,[117,-16,139,-63,166,-67,183,-75,169,-38,166,4,140,26,
   144,55,160,72,177,82,144,80,119,63,95,36,117,-16],b,d,2);
 shape(c,[-55,-37,-33,-79,-5,-103,22,-97,25,-81,7,-48,-15,-30,-55,-37],b,d,2);
 shape(c,[5,40,-10,74,6,92,52,103,88,104,93,83,75,49,5,40],b,d,2);
 dot(c,-83,-7,5,5,d);dot(c,-84,-9,1.8,2.2,'#ffffff');
 line(c,[-126,31,-82,47,-38,43,24,40,58,37,89,31,103,30],d,2.3);
 for(let i=0;i<8;i++){let x=-135+i*35,y=-70-22*Math.sin(i*3+p*6);
  dot(c,x,y,5+i%3*3,5+i%3*3,'#eaffff');shine(c,x+4,y-3,3,d)}
}
function stag(c,a,b,d,p){
 // A branching antler crown attached to a slender deer head and chest.
 shape(c,[-36,-84,-50,-38,-47,16,-28,63,-12,94,14,94,28,63,
   47,16,51,-38,35,-84,-36,-84],a,d,2.6);
 shape(c,[-40,-78,-78,-121,-85,-126,-64,-109,-49,-101,-35,-95,-40,-78],b,d,2);
 shape(c,[40,-78,78,-121,85,-126,64,-109,49,-101,35,-95,40,-78],b,d,2);
 for(let s of [-1,1]){
  line(c,[s*17,-97,s*38,-144,s*63,-156,s*76,-193],d,8);
  line(c,[s*38,-144,s*40,-180,s*28,-199,s*13,-217],d,6);
  line(c,[s*59,-158,s*90,-174,s*102,-193,s*118,-203],d,5);
  line(c,[s*63,-156,s*83,-139,s*108,-130,s*131,-144],d,5);
  for(let i=0;i<6;i++){const x=s*(48+i*14),y=-143-8*Math.sin(i*2);
   shape(c,[x,y,x+s*8,y-18,x+s*28,y-22,x+s*25,y-8,x+s*14,y,x+s*6,y,x,y],b)}
  dot(c,s*19,-37,5,8,d);dot(c,s*18,-40,2,4,'#ffffff');
 }
 shape(c,[-16,-13,-11,13,-6,21,0,24,6,21,11,13,16,-13,-16,-13],b,d,2);
}
function mooncat(c,a,b,d,p){
 // Continuous round face and three tails; no reused battle/yarn cat.
 for(let s of [-1,0,1]){
  line(c,[s*30,53,s*80,96,s*139,57,s*121,-15,s*119,-55,s*104,-71,s*95,-62],d,25);
  line(c,[s*30,53,s*80,96,s*139,57,s*121,-15,s*119,-55,s*104,-71,s*95,-62],a,20);
 }
 shape(c,[-92,-42,-102,-91,-100,-142,-77,-169,-46,-171,-40,-126,0,-130,
    40,-126,46,-171,77,-169,100,-142,102,-91,92,-42,
    92,32,41,70,0,67,-41,70,-92,32,-92,-42],a,d,3);
 shape(c,[-91,-116,-83,-148,-65,-156,-52,-117,-61,-105,-91,-116],b,d,1.5);
 shape(c,[91,-116,83,-148,65,-156,52,-117,61,-105,91,-116],b,d,1.5);
 dot(c,-39,-39,13,19,d);dot(c,39,-39,13,19,d);
 dot(c,-42,-46,4,7,'#fffde9');dot(c,36,-46,4,7,'#fffde9');
 shape(c,[-8,-7,-4,-12,4,-12,8,-7,4,1,-4,1,-8,-7],b);
 line(c,[-2,0,-12,13,-20,9,-21,4],d,2);line(c,[2,0,12,13,20,9,21,4],d,2);
 for(let s of [-1,1])for(let i=0;i<3;i++)line(c,[s*48,-4+i*12,s*84,-9+i*8,s*100,-13+i*5,s*112,-14+i*5],d,1.4);
}
function tiger(c,a,b,d,p){
 // Lightning tiger, recognizably different silhouette to the moon cat.
 shape(c,[-88,-80,-105,-151,-84,-170,-59,-133,-32,-149,
  0,-159,32,-149,59,-133,84,-170,105,-151,88,-80,
  108,-17,72,72,0,79,-72,72,-108,-17,-88,-80],a,d,3);
 for(let s of [-1,1]){
  shape(c,[s*67,-111,s*77,-143,s*88,-154,s*86,-104,s*67,-111],b,d,1.5);
  dot(c,s*39,-47,13,20,d);dot(c,s*41,-54,4,6,'#fffde8');
  for(let i=0;i<3;i++)line(c,[s*(68+i*9),-76+i*25,s*55,-69+i*23,s*47,-66+i*22,s*30,-61+i*23],d,6);
  line(c,[s*17,-138,s*29,-123,s*22,-109,s*14,-102],d,7);
 }
 line(c,[-13,-7,0,-17,13,-7,0,7,-13,-7],d,4);
 for(let i=-2;i<=2;i++){let x=i*53;line(c,[x,-146,x-31,-164,x+17,-180,x-16,-212],b,4)}
}
function angel(c,a,b,d,p){
 // Winged guardian cat with sweeping feather blades and golden halo.
 for(let s of [-1,1]){
  shape(c,[s*50,-50,s*101,-137,s*142,-150,s*160,-145,s*142,-92,s*100,-30,
    s*65,24,s*50,-50],b,d,2);
  for(let i=0;i<7;i++)line(c,[s*64,-47,s*(102+i*5),-72-i*7,
       s*(128+i*4),-96-i*7,s*(137+i*2),-116-i*5],d,1.8);
 }
 shape(c,[-71,-60,-88,-117,-78,-157,-56,-152,-33,-149,-39,-115,
  0,-124,39,-115,33,-149,56,-152,78,-157,88,-117,71,-60,
  78,18,45,56,0,59,-45,56,-78,18,-71,-60],a,d,3);
 dot(c,-35,-42,10,14,d);dot(c,35,-42,10,14,d);
 dot(c,-39,-48,4,6,'#ffffff');dot(c,31,-48,4,6,'#ffffff');
 shape(c,[-8,-7,-4,-14,4,-14,8,-7,0,0,-8,-7],b,d,1);
 c.strokeStyle=d;c.lineWidth=7;c.beginPath();c.ellipse(0,-169,60,18,0,0,T);c.stroke();
 for(let i=0;i<10;i++)shine(c,Math.cos(i*7)*145,-30+Math.sin(i*7)*100,5,d);
}
const painters={dark:mooncat,elec:tiger,fire:phoenix,grass:stag,light:angel,water:whale};
function draw(c,W,H,p,key,tier){
 if(p<.10||p>.90)return;
 const a=key.split('+')[0],b=key.split('+')[1]||a,pal=palettes[a]||palettes.light;
 const entry=clamp((p-.10)/.20),leave=1-clamp((p-.66)/.24);
 const pulse=Math.min(1,entry)*leave*(tier>=3?1:.74);
 const s=H/360*(W/H<1.35?.78:1);
 c.save();c.globalAlpha*=.12+.48*pulse;c.globalCompositeOperation='screen';
 c.translate(W*.51,H*.51);c.rotate(.06*Math.sin(p*6));c.scale(s,s);
 const bg=c.createRadialGradient(0,-20,20,0,-20,180);
 bg.addColorStop(0,pal[1]+'88');bg.addColorStop(1,pal[0]+'00');
 c.fillStyle=bg;c.beginPath();c.ellipse(0,-20,170,145,0,0,T);c.fill();
 c.shadowColor=pal[1];c.shadowBlur=18;
 (painters[a]||angel)(c,pal[0],pal[1],pal[2],p);
 c.restore();
}
window.CatBondDuoSummons={draw,styles:Object.keys(painters),styleFor:key=>key.split('+')[0]};
})();