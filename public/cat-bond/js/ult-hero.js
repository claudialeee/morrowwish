/* Original watercolor kitten hero focus; six distinct live ult VFX.
 * Entirely Canvas2D; nonblocking, no static skill images. */
(()=>{'use strict';
const PI=Math.PI,TAU=2*PI;
const palette={
 fire:['#291923','#8a3d2c','#ffa34d','#fff4b5'],
 water:['#142c44','#246881','#75e2f1','#f5feff'],
 grass:['#213a2d','#5c8751','#b8ec9a','#fff5bc'],
 elec:['#192047','#3b53a3','#ffe39e','#ffffff'],
 dark:['#1c1932','#472a74','#b394ff','#f1e8ff'],
 light:['#362d4f','#857eae','#fff2c8','#ffffff']
};
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
const rnd=n=>{let x=Math.sin(n*124.38+12)*43758.54;return x-Math.floor(x)};
function mist(g,x,y,r,c,h,a){
 const q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,c);q.addColorStop(.35,h);q.addColorStop(1,'rgba(0,0,0,0)');
 g.globalAlpha=a;g.fillStyle=q;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();
}
function spark(g,x,y,r,c,a){
 g.strokeStyle=c;g.globalAlpha=a;g.lineWidth=1.5;g.lineCap='round';
 g.beginPath();g.moveTo(x-r,y);g.lineTo(x+r,y);g.moveTo(x,y-r);g.lineTo(x,y+r);g.stroke();
}
function drawMagic(g,type,cx,cy,R,p,alpha,front){
 const [d,m,e,h]=palette[type],spin=p*PI*2;
 g.save();g.translate(cx,cy);g.globalCompositeOperation='lighter';
 if(!front){
  mist(g,0,-R*.25,R*1.1,m,e,.23*alpha);
  if(type==='fire'){
   for(let i=0;i<16;i++){
    const x=(i-7.5)*R*.11,r=R*(.55+rnd(i)*.5),w=R*.15;
    g.globalAlpha=alpha*(i%3===0?.82:.51);g.fillStyle=i%3===0?'#ffec9e':i%3===1?'#ffab52':'#fa6937';
    g.beginPath();g.moveTo(x,R*.3);
    g.bezierCurveTo(x-w,-r*.2,x+w*1.7,-r*.77,x+Math.sin(i+spin)*R*.11,-r);
    g.bezierCurveTo(x+w*1.5,-r*.42,x+w,R*.1,x+w*.8,R*.3);g.closePath();g.fill();
   }
  }else if(type==='water'){
   for(let i=0;i<3;i++){
    g.strokeStyle=i===2?'#f5ffff':i===1?'#9aeaff':'#36b7d7';g.lineWidth=i===2?5:i===1?12:25;
    g.globalAlpha=alpha*(i===2?.92:.5);g.beginPath();g.moveTo(-R,-R*.06);
    g.bezierCurveTo(-R*.69,-R*1.24,R*.64,-R*1.22,R,-R*.14);g.stroke();
   }
  }else if(type==='grass'){
   for(let i=0;i<13;i++){
    g.save();g.rotate(i*TAU/13+spin*.06);const v=R*(.65+rnd(i)*.32);
    g.strokeStyle=i%2?'#b7e5a4':'#77ba8b';g.lineWidth=4.2;g.lineCap='round';g.globalAlpha=alpha*.8;
    g.beginPath();g.moveTo(0,R*.18);g.bezierCurveTo(-R*.3,-v*.16,R*.4,-v*.68,0,-v);g.stroke();
    for(let j=0;j<3;j++){
     g.save();g.translate(Math.sin(i+j)*R*.08,-v*(.27+j*.23));g.rotate(j%2?.7:-.7);
     g.fillStyle=j%2?'#8fce80':'#e2efad';g.beginPath();g.ellipse(0,0,R*.13,R*.04,0,0,TAU);g.fill();g.restore();
    }g.restore();
   }
   mist(g,0,-R*.7,R*.72,'#fff1a5','#fff1bc',alpha*.34);
  }else if(type==='elec'){
   for(let i=0;i<15;i++){
    const a=i*TAU/15,rr=R*(.75+rnd(i)*.26),x=Math.cos(a)*rr,y=Math.sin(a)*rr-R*.25;
    g.strokeStyle='#86a8fe';g.lineWidth=13;g.globalAlpha=alpha*.45;g.lineCap='round';g.beginPath();
    g.moveTo(0,0);g.lineTo(x*.48-R*.08,y*.52);g.lineTo(x*.72+R*.09,y*.76);g.lineTo(x,y);g.stroke();
    g.strokeStyle='#fff3bd';g.lineWidth=2.5;g.globalAlpha=alpha*.95;g.stroke();
   }
  }else if(type==='dark'){
   mist(g,0,-R*.2,R*.88,'#211139','#6d4ab0',alpha*.7);
   for(let i=0;i<8;i++){
    g.strokeStyle=i%2?'#a783e8':'#d9c5ff';g.lineWidth=i%2?13:5;g.globalAlpha=alpha*(i%2?.65:.89);
    g.lineCap='round';g.beginPath();
    for(let j=0;j<=27;j++){
     const t=j/27,a=i*TAU/8+t*PI*1.83-spin*.47,rr=R*(.85-t*.65);
     const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.82-R*.17;
     j?g.lineTo(x,y):g.moveTo(x,y);
    }g.stroke();
   }
  }else{
   mist(g,0,-R*.35,R*.82,'#fffae4','#d8c7ea',alpha*.62);
   for(let i=0;i<21;i++){
    const a=i*TAU/21;g.strokeStyle=i%2?'#fff5d9':'#d9edff';g.lineWidth=i%2?4:9;
    g.globalAlpha=alpha*.4;g.beginPath();
    g.moveTo(Math.cos(a)*R*.45,Math.sin(a)*R*.45-R*.35);
    g.lineTo(Math.cos(a)*R*.99,Math.sin(a)*R*.99-R*.35);g.stroke();
   }
   g.strokeStyle='#fffaf0';g.globalAlpha=alpha*.88;g.lineWidth=4;
   g.beginPath();g.arc(0,-R*.35,R*.68,0,TAU);g.stroke();
  }
 }else{
  if(type==='water'){g.strokeStyle='#efffff';g.lineWidth=6;g.globalAlpha=alpha*.8;
   g.beginPath();g.ellipse(0,R*.34,R*.81,R*.19,0,.1,PI*.9);g.stroke();}
  if(type==='fire'){for(let i=0;i<2;i++){g.strokeStyle=i?'#fff2c2':'#fb9f4b';g.lineWidth=i?4:10;
   g.globalAlpha=alpha*.7;g.beginPath();g.arc(0,R*.2,R*(.6+i*.16),0,PI*.85);g.stroke();}}
  if(type==='grass'){for(let i=0;i<10;i++){
    const a=i*2.39,r=R*(.42+rnd(i)*.4);
    g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);g.globalAlpha=alpha*.9;
    for(let k=0;k<5;k++){g.save();g.rotate(k*TAU/5);g.fillStyle='#ffeada';g.beginPath();
      g.ellipse(0,-R*.03,R*.026,R*.054,0,0,TAU);g.fill();g.restore();}g.restore();
  }}
  if(type==='dark'||type==='light'||type==='elec'){
    g.strokeStyle=type==='dark'?'#e6d1ff':type==='light'?'#fff7e2':'#fff5c4';g.lineWidth=3;g.globalAlpha=alpha*.8;
    g.beginPath();g.ellipse(0,R*.3,R*.8,R*.16,0,0,TAU);g.stroke();
  }
  for(let i=0;i<17;i++){
   const a=i*2.399+spin*.2,r=R*(.63+rnd(i+11)*.4),x=Math.cos(a)*r,y=Math.sin(a)*r-R*.13;
   if(Math.abs(x)<R*.35&&Math.abs(y)<R*.37)continue;
   spark(g,x,y,R*.02,h,alpha*.78);
  }
 }
 g.restore();
}
function begin(b,cat,s){
 if(!b||!cat||!(s?.ultCost>0)||!palette[s.element])return null;
 return {element:s.element,species:cat.cat?.species,name:s.name,age:0,max:1.17};
}
function update(b,dt){
 if(!b?.ultHero)return;
 b.ultHero.age+=Math.max(0,Math.min(.09,dt||0));
 if(b.ultHero.age>=b.ultHero.max)b.ultHero=null;
}
function draw(ctx,b,W,H){
 const h=b?.ultHero;if(!h||!palette[h.element]||b.duoCinematic?.t>0||b.ultCinematic)return;
 const p=clamp(h.age/h.max),alpha=ease(p/.15)*(1-ease((p-.75)/.25));
 if(alpha<.01)return;
 const [dark,mid,edge,hot]=palette[h.element],cx=W*.5,cy=H*.57,R=Math.min(W*.39,H*.45,330);
 ctx.save();
 ctx.globalAlpha=.96*alpha;
 const grad=ctx.createLinearGradient(0,0,W,H);
 grad.addColorStop(0,dark);grad.addColorStop(.5,mid);grad.addColorStop(1,dark);
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 ctx.globalCompositeOperation='lighter';mist(ctx,cx,cy,R*1.65,edge,mid,alpha*.24);
 ctx.globalCompositeOperation='source-over';
 drawMagic(ctx,h.element,cx,cy,R,p,alpha,false);
 const cat=window.GameData?.speciesById?.(h.species);
 if(cat){
  ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor=edge;ctx.shadowBlur=19;
  const scale=Math.min(3.8,Math.max(2.15,Math.min(W*.62,H*.46)/90));
  // CatMotion caps artwork at 0.86 world-scale and shifts its foot baseline.
  // Hero focus intentionally renders the SAME illustrated CatArt directly at
  // 2–4x scale; it never changes combat/world cat sizing.
  window.CatArt?.drawCat?.(ctx,cx,cy+R*.10,{
    species:cat,scale,pose:h.element==='fire'||h.element==='elec'?'play':'idle',
    face:1,t:b.t,motion:0,stride:0,mood:'happy'
  });ctx.restore();
 }
 drawMagic(ctx,h.element,cx,cy,R,p,alpha,true);
 const bar=Math.max(45,H*.09);
 ctx.fillStyle=dark;ctx.globalAlpha=.72*alpha;
 ctx.fillRect(0,0,W,Math.max(28,H*.06));ctx.fillRect(0,H-bar,W,bar);
 ctx.globalAlpha=alpha;ctx.fillStyle=hot;ctx.shadowColor=edge;ctx.shadowBlur=16;
 ctx.textAlign='center';ctx.font='900 '+Math.round(Math.min(W<550?19:30,W*.06))+'px system-ui';
 const name=window.MorrowwishI18n?.get?.()==='zh'?h.name:window.CatBondI18n?.translate?.(h.name)||h.name;
 ctx.fillText(name,cx,H-bar*.34,W*.85);
 ctx.restore();
}
window.CatBondUltHero={begin,update,draw};
})();