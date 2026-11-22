/* Cat Bond cinematic-only illustrator. NEVER calls yard/map CatArt sprites.
 * Each cat is a coherent storybook character with its own breed markings.
 * The full silhouette and attached paws are drawn in one local transform.
 */
(function(){
'use strict';
const P=Math.PI,T=P*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const coats={
 orange:['#f4b86d','#fff0c9','#bf743d'],brownTabby:['#a77c5d','#f6dfb9','#664a39'],
 silver:['#d9dfe8','#ffffff','#8e9cae'],black:['#34364b','#73758a','#1b1c2b'],
 white:['#f8f4ed','#fffefd','#c9c2c9'],cream:['#f5e3ba','#fff5dc','#ccad83'],
 tux:['#353b51','#fff8ef','#202738'],calico:['#fff1d8','#fffdfa','#c17d55'],
 blue:['#879eb5','#c8d9e8','#4c657e'],ragdoll:['#f5efe4','#fffafa','#8b7881'],
 cheese:['#f2b46f','#fff8e7','#bd753e'],apricot:['#e7c093','#fff5de','#ad8565'],
 goldShaded:['#e3c587','#fff4d1','#a18755'],siamese:['#f5e8c9','#fff5df','#4c3938'],
 maine:['#ad8766','#e4cfad','#69523f'],mystic:['#a5a2cb','#eee7fc','#645b9f'],
 norwegian:['#b4a18d','#f4e1c9','#746d6b'],bengal:['#d6a05f','#f8e0b5','#795037'],
 flame:['#eeb273','#fff0ba','#be5c43'],cloud:['#d5e2f6','#fff7ff','#8498b9']
};
const hex=(v)=>{let s=String(v||'#ffffff').replace('#','');if(s.length===3)s=s.split('').map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16)||0)};
const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
function el(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,T);g.fill()}
function curve(g,ps,fill,stroke,width=2){g.beginPath();g.moveTo(ps[0],ps[1]);for(let i=2;i+5<ps.length;i+=6)g.bezierCurveTo(...ps.slice(i,i+6));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}}
function line(g,pts,c,w=2){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i+5<pts.length;i+=6)g.bezierCurveTo(...pts.slice(i,i+6));g.stroke()}
function grad(g,a,b,c,lo=-250,hi=40){const v=g.createLinearGradient(-60,lo,95,hi);v.addColorStop(0,a);v.addColorStop(.52,b);v.addColorStop(1,c);return v}
function star(g,x,y,r,c){g.strokeStyle=c;g.lineWidth=2.8;g.beginPath();g.moveTo(x-r,y);g.lineTo(x+r,y);g.moveTo(x,y-r);g.lineTo(x,y+r);g.stroke();el(g,x,y,r*.25,r*.25,'#fffdf2')}
function paw(g,x,y,rx,ry,f,edge,claw){el(g,x,y,rx,ry,grad(g,mix(f,'#ffffff',.12),f,edge,-25,25));g.strokeStyle=edge;g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,rx,ry,0,0,T);g.stroke();for(let i=-1;i<=1;i++)line(g,[x+i*rx*.45,y-ry*.25,x+i*rx*.45,y-ry*.32,x+i*rx*.42,y-ry*.5,x+i*rx*.35,y-ry*.48],claw,1.6)}
function mark(g,sp,fur,dark,light){
 const pattern=sp.pattern||'solid',id=sp.id||'';
 g.save();
 g.beginPath();g.ellipse(0,-167,76,72,0,0,T);g.clip();
 if(pattern==='tabby'||pattern==='silver'){
  const m=mix(dark,fur,.34);
  // Signature M on brow plus tapered cheek stripes, adapted for round/long faces.
  for(let i=-1;i<=1;i++){
   const x=i*21;
   line(g,[x,-227,x+7,-212,x-5,-207,x,-196],m,5);
  }
  for(let s of [-1,1])for(let i=0;i<3;i++)
   line(g,[s*(58+i*5),-174+i*17,s*(52+i*2),-165+i*15,s*53,-160+i*15,s*41,-154+i*14],m,4-i*.6);
 }else if(pattern==='calico'||id==='sanhua'){
  curve(g,[-70,-233,-38,-255,-19,-235,-13,-191,-39,-176,-71,-194,-70,-233], '#ac7151');
  curve(g,[22,-241,51,-253,82,-215,67,-178,51,-162,22,-174,22,-241], '#353b48');
 }else if(pattern==='spotted'){
  for(let i=0;i<13;i++){const x=Math.sin(i*7.8)*56,y=-224+(i%5)*23;
   el(g,x,y,5+i%3*2,3+i%2*2,mix(dark,fur,.10))}
 }else if(pattern==='pointed'){
  el(g,0,-144,43,35,mix(dark,fur,.16));
  el(g,-61,-170,21,36,mix(dark,fur,.22));
  el(g,61,-170,21,36,mix(dark,fur,.22));
 }else if(pattern==='tuxedo'||pattern==='bicolor'){
  curve(g,[-28,-104,-44,-131,-45,-168,-26,-184,-16,-199,-12,-213,0,-217,
    12,-213,16,-199,26,-184,45,-168,44,-131,28,-104,-28,-104],light);
 }
 g.restore();
}
function face(g,sp,dark,light,p){
 const eye=sp.eyeColor||'#75b5a1';
 const blink=Math.max(0,Math.sin(p*P*2-1.8))>.995;
 for(const s of [-1,1]){
  // Eyes: high-gloss fantasy character close-up, distinct from small game sprites.
  const x=s*31,y=-178;
  el(g,x,y,19,25,mix(dark,'#160e25',.40));
  el(g,x,y+2,15,21,eye);
  el(g,x+s*1.5,y+4,6,16,mix(eye,'#162338',.76));
  el(g,x-5,y-7,6.3,8.2,'#ffffff');
  el(g,x+7,y+10,3.2,4,'#fffce8');
  line(g,[x-18,y-24,x-8,y-30,x+8,y-30,x+18,y-24],mix(dark,'#342432',.6),3);
 }
 // Soft painterly muzzle, triangular nose and expressive smile.
 el(g,-17,-131,30,20,mix(light,'#fffaf2',.55));
 el(g,17,-131,30,20,mix(light,'#fffaf2',.55));
 el(g,0,-142,9,5,'#b77c88');
 line(g,[0,-138,-2,-128,-12,-127,-16,-130],mix(dark,'#5f414c',.48),2.2);
 line(g,[0,-138,2,-128,12,-127,16,-130],mix(dark,'#5f414c',.48),2.2);
 for(const s of [-1,1]){
  for(let i=0;i<3;i++)line(g,[s*29,-133+i*6,s*55,-139+i*5,s*75,-142+i*10,s*86,-139+i*10],
      mix(dark,'#5b5261',.35),1.2);
  for(let i=0;i<3;i++)el(g,s*(25+i*5),-141+(i%2)*7,1.3,1.3,'#967f8d');
  el(g,s*64,-146,9,5,'#f5a7a6a0');
 }
}
function draw(g,sp,height,p,style,aura,tier=1){
 const [base,light,dark]=coats[sp.palette]||coats.orange;
 const outline=mix(dark,'#333349',.3);
 const fluff=!!sp.fluffy;
 const folded=sp.ears==='fold',tufted=sp.ears==='tufted';
 const bold=['blink','dash','zigzag','shadow','ember','cannon','spiral','fireworks','tides','petals'].includes(style);
 const guard=['eclipse','lake','snare','sprout','solar','highfive','stars'].includes(style);
 const energy=clamp(Math.sin(p*P*1.2));
 const gesture=clamp((p-.08)/.25)*(1-clamp((p-.43)/.3));
 const raise=guard?gesture*.58:gesture;
 const legLift=(bold?46:24)*raise*(tier>=3?1.32:tier===2?1.17:1);
 g.save();const s=height/280;g.scale(s,s);
 // Delicate colored character halo, never an opaque cut-out from the map.
 g.save();g.globalAlpha=.4+.26*energy;
 const auraGrad=g.createRadialGradient(0,-163,12,0,-150,160);
 auraGrad.addColorStop(0,mix(aura,'#ffffff',.4)+'b5');auraGrad.addColorStop(1,mix(aura,'#ffffff',.35)+'00');
 g.fillStyle=auraGrad;g.beginPath();g.ellipse(0,-145,150,130,0,0,T);g.fill();
 g.restore();
 // Elegant magic ribbon behind the shoulders, anchored to the same actor.
 g.save();g.globalAlpha=.50;
 curve(g,[-57,-123,-112,-168,-122,-207,-144,-199,-139,-152,-92,-87,-57,-73,-57,-123],
  mix(aura,'#ffffff',.40));
 curve(g,[56,-122,108,-167,118,-203,139,-198,135,-152,86,-87,56,-73,56,-122],
  mix(aura,'#ffffff',.56));
 g.restore();
 // Tail behind body, broad continuous fur stroke ending in soft tapered curl.
 g.lineCap='round';g.strokeStyle=outline;g.lineWidth=39;
 line(g,[54,-43,119,-44,143,-107,112,-141,94,-158,91,-132,121,-117],outline,39);
 line(g,[54,-43,119,-44,143,-107,112,-141,94,-158,91,-132,121,-117],base,34);
 if(sp.pattern==='tabby'||sp.pattern==='spotted'){
  g.strokeStyle=dark;g.lineWidth=6;
  for(let i=0;i<4;i++)line(g,[84+i*8,-48-i*19,89+i*7,-52-i*22,99+i*8,-54-i*22,105+i*8,-58-i*22],dark,6);
 }
 // Body and plush neck bib, painterly gradient and shadows.
 const rx=fluff?76:sp.short?65:68;
 const bodyGrad=grad(g,light,base,mix(dark,base,.6),-175,30);
 el(g,0,-67,rx,105,bodyGrad);
 // Coat pattern is visible on the WHOLE body, not only on a shared face.
 g.save();
 g.beginPath();g.ellipse(0,-67,rx-4,99,0,0,T);g.clip();
 if(['tabby','silver'].includes(sp.pattern)){
   g.strokeStyle=mix(dark,base,.32);g.lineWidth=7;g.lineCap='round';
   for(const side of [-1,1])for(let j=0;j<3;j++){
     g.beginPath();g.moveTo(side*(rx-2),-129+j*41);
     g.quadraticCurveTo(side*(rx-23),-133+j*39,side*(rx-36),-118+j*41);g.stroke();
   }
 }else if(sp.pattern==='spotted'){
   g.strokeStyle=mix(dark,base,.16);g.lineWidth=6;
   for(let i=0;i<13;i++){const x=Math.sin(i*3.47)*52,y=-135+(i%5)*37;
     g.beginPath();g.ellipse(x,y,7+i%3*2,5+i%2*2,i*.3,0,Math.PI*1.73);g.stroke();}
 }else if(sp.pattern==='calico'){
   el(g,-48,-93,25,43,'#c38b6a');el(g,45,-31,28,44,'#4c4951');
 }else if(sp.pattern==='pointed'){
   el(g,-56,-48,20,48,mix(dark,base,.35));
   el(g,56,-46,19,46,mix(dark,base,.35));
 }else if(sp.pattern==='tuxedo'||sp.pattern==='bicolor'){
   el(g,0,-74,30,83,mix(light,'#ffffff',.48));
 }
 if(sp.id==='sanhua')el(g,36,-106,17,21,'#a57965');
 if(sp.id==='jinwu')for(let i=0;i<5;i++)star(g,-43+i*21,-115+i%2*15,3,'#fff0a1');
 if(sp.id==='xingchen')for(let i=0;i<9;i++)star(g,Math.sin(i*5)*56,-137+(i%4)*33,3,'#fff7b3');
 g.restore();
 el(g,-46,-16,31,31,mix(base,dark,.14));el(g,45,-15,31,31,mix(base,dark,.14));
 curve(g,[-55,-112,-44,-154,-16,-156,0,-151,16,-156,44,-154,55,-112,
  37,-96,29,-52,0,-16,-29,-52,-37,-96,-55,-112],grad(g,'#ffffff',light,base,-150,-10));
 // Manga-comic silhouette fur spurs remain ATTACHED, not floating limbs.
 if(fluff)for(const sign of [-1,1])for(let n=0;n<3;n++)
  curve(g,[sign*(63+n*4),-118+n*21,sign*101,-119+n*17,sign*89,-106+n*19,
   sign*(65+n*4),-100+n*21,sign*(63+n*4),-118+n*21],base,outline,1.4);
 // Hind feet below chest, with clear paws and connected ankle.
 paw(g,-43,8,31,20,light,outline,dark);paw(g,44,8,31,20,base,outline,dark);
 // Elbows emerge smoothly from chest, wrists and pads remain attached to arms.
 for(const side of [-1,1]){
  const active=side===1||(tier>=3&&gesture>.46&&side===-1);
  const handX=side*(active?60+legLift:54);
  const handY=active?-75-legLift*.87:-53-raise*16;
  const shoulderX=side*49,shoulderY=-102;
  const innerX=side*(active?37:39),innerY=-60;
  curve(g,[shoulderX,shoulderY,side*(69+raise*3),-99,handX+side*11,handY-17,
    handX,handY-6,handX-side*7,handY+24,innerX,innerY+12,
    side*23,-60,side*24,-90,shoulderX,shoulderY],grad(g,light,base,dark,-135,-38),outline,2);
  paw(g,handX,handY,active?24:21,active?21:20,base,outline,dark);
 }
 // Head, integrated cheek tufts and triangular folded/tufted ear silhouettes.
 const ears=[-1,1];
 for(const side of ears){
  const tipY=folded?-237:-274-(tufted?6:0);
  const topX=side*(folded?66:79);
  curve(g,[side*38,-191,side*45,-225,side*60,tipY,topX,tipY+6,
    side*94,-263,side*89,-196,side*76,-168,side*55,-173,side*38,-191],
    grad(g,light,base,dark,-268,-150),outline,2.3);
  curve(g,[side*55,-208,side*61,-230,side*68,tipY+18,side*77,tipY+24,
    side*80,-240,side*74,-206,side*55,-208],mix('#d48d9d',light,.40));
  if(tufted)line(g,[side*77,tipY+13,side*84,tipY-17,side*91,tipY-24,side*87,tipY+13],light,3);
 }
 const headGrad=grad(g,light,base,mix(dark,base,.3),-255,-96);
 el(g,0,-169,80+(fluff?5:0),76+(fluff?4:0),headGrad);
 for(const side of [-1,1]){
  curve(g,[side*66,-140,side*91,-154,side*109,-137,side*90,-128,
    side*102,-115,side*76,-109,side*49,-111,side*66,-140],
     mix(light,base,.35),outline,1.8);
 }
 mark(g,sp,base,dark,light);
 face(g,sp,dark,light,p);
 // Pendant is subtle and keyed by the element, rather than breed-replacing armor.
 g.save();g.fillStyle=mix(aura,'#ffffff',.50);g.strokeStyle=outline;g.lineWidth=1.8;
 g.beginPath();g.moveTo(-18,-94);g.quadraticCurveTo(0,-102,18,-94);g.stroke();
 g.beginPath();g.moveTo(0,-99);g.lineTo(9,-86);g.lineTo(0,-76);g.lineTo(-9,-86);g.closePath();g.fill();g.stroke();
 el(g,-3,-89,2.5,3,'#ffffff');g.restore();
 // Brush glints originate from the animated forepaw, not around random stickers.
 if(p>.16&&p<.73){
  const f=Math.sin(clamp((p-.16)/.58)*P);
  g.globalAlpha=f*.85;g.shadowColor=aura;g.shadowBlur=12;
  star(g,80+legLift,-105-legLift*.87,11+f*9,'#fffced');
  for(let i=0;i<3;i++)el(g,66+legLift+i*11,-133-legLift*.67-i*9,2.5,2.5,aura);
 }
 g.restore();
}
window.CatBondDuoPortraits={draw,version:'storybook-breed-identity-three-stage-v2',breedCount:25};
})();