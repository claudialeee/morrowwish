/* Complete, transparent, front-facing kitten portraits for all 25 breeds.
   Each cat is drawn independently INSIDE a padded 240x280 canvas. No
   tiled sprite sheets, clipped faces, white matte, or sideways cat model. */
(()=>{
 'use strict';
 const cache=new Map(),W=240,H=280;
 const coats={
  orange:['#e9a35c','#ffddae','#b7663d'],brownTabby:['#a9784d','#dfb68d','#75523c'],
  silver:['#bac1cc','#f0eef1','#77818d'],black:['#383540','#76707e','#25202d'],
  white:['#ebe9e4','#ffffff','#a8aab6'],cream:['#efcb9b','#fff1d2','#bb9673'],
  tux:['#35343f','#777582','#22232f'],calico:['#eee1cc','#fff7ed','#d49b62'],
  blue:['#858f9f','#c1cad5','#626b80'],ragdoll:['#e9dfce','#fff5e6','#bdb0a0'],
  cheese:['#eab174','#ffe3bd','#bc7041'],apricot:['#e8bb8e','#ffdfb9','#bd8e70'],
  goldShaded:['#dcb671','#f8e5b2','#a98958'],siamese:['#e4d2b4','#f4e8d7','#a78a73'],
  maine:['#ab8c71','#e1c8a2','#755f51'],mystic:['#696077','#b4a7c7','#44415f'],
  norwegian:['#b8a591','#e7d6c3','#86735e'],bengal:['#dba96b','#f2d39a','#86583a'],
  flame:['#e89f55','#ffda90','#b55b35'],cloud:['#dfe9f7','#fffaff','#acb8df']
 };
 const mix=(a,b,t)=>{const to=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const x=to(a),y=to(b);return '#'+x.map((v,i)=>Math.round(v*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('')};
 function ellipse(ctx,x,y,rx,ry,fill,rot=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill()}
 function line(ctx,pts,color,width){ctx.beginPath();ctx.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)ctx.lineTo(pts[i],pts[i+1]);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
 function gradient(ctx,x,y,r,light,dark){const g=ctx.createRadialGradient(x-r*.35,y-r*.48,r*.04,x,y,r*1.30);g.addColorStop(0,light);g.addColorStop(.58,mix(light,dark,.27));g.addColorStop(1,dark);return g}
 function ear(ctx,x,side,base,inner,fold,fluffy){
   const top=fold?59:(fluffy?31:37),out=x+side*(fold?40:30),inX=x-side*21;
   ctx.beginPath();ctx.moveTo(x-side*31,103);ctx.quadraticCurveTo(out,top-14,out,top+4);
   ctx.quadraticCurveTo(x+side*30,top+6,x+side*30,top+24);
   ctx.lineTo(x+side*17,106);ctx.closePath();
   ctx.fillStyle=base;ctx.fill();
   ctx.beginPath();ctx.moveTo(x-side*12,89);
   ctx.quadraticCurveTo(out,top+5,x+side*17,top+24);
   ctx.quadraticCurveTo(x+side*20,top+37,x+side*16,90);ctx.closePath();
   ctx.fillStyle=inner;ctx.fill();
   for(let i=0;i<3;i++)line(ctx,[x+side*(7+i*3),87,x+side*(18+i*2),65+i*7], '#fff9f17c',1.6);
 }
 function draw(ctx,sp){
   const p=sp||{},id=p.id||'tangyuan',coat=coats[p.palette]||coats.orange;
   const [base,light,dark]=coat;const bodyShade=mix(base,dark,.18);
   const ink=mix(dark,'#302836',.30),pink='#df9996';
   const tabby=p.pattern==='tabby'||p.pattern==='silver'||p.pattern==='spotted';
   const tux=p.pattern==='tuxedo'||p.palette==='tux';
   const point=p.pattern==='pointed'||p.palette==='siamese'||p.palette==='ragdoll';
   const calico=p.pattern==='calico'||p.palette==='calico';
   const fluffy=!!p.fluffy,fold=p.ears==='fold',short=!!p.short;
   const faceY=112,bodyTop=155;
   ctx.clearRect(0,0,W,H);ctx.save();
   // Painted tail curves behind the body, keeping the entire curl inside canvas.
   ctx.beginPath();ctx.moveTo(72,220);ctx.bezierCurveTo(44,215,31,193,35,165);
   ctx.bezierCurveTo(36,142,56,133,68,147);
   ctx.strokeStyle=gradient(ctx,51,172,39,light,bodyShade);
   ctx.lineWidth=30;ctx.lineCap='round';ctx.stroke();
   if(tabby){
     for(let i=0;i<3;i++){
       ctx.beginPath();ctx.moveTo(39+i*2,177+i*13);ctx.lineTo(59+i*2,176+i*9);
       ctx.lineWidth=5;ctx.strokeStyle=mix(base,dark,.43)+'9b';ctx.stroke();
     }
   }
   // Rounded compact seated body and belly, front-facing (never side-profile).
   ellipse(ctx,120,194,fluffy?66:58,short?51:62,gradient(ctx,101,176,82,light,bodyShade));
   if(fluffy){
     for(let i=0;i<8;i++){
       const a=Math.PI*(.1+i*.115),x=120+61*Math.cos(a),y=185+52*Math.sin(a);
       ellipse(ctx,x,y,7,12,mix(base,light,.40),a);
     }
   }
   if(tux||calico||p.pattern==='bicolor'){
     ellipse(ctx,122,198,32,53,light);
     if(calico)ellipse(ctx,156,198,15,36,'#b57951ad',-.17);
   } else ellipse(ctx,120,207,29,42,mix(light,'#fffdf6',.30));
   // Full paws with soft painted highlights, including short-legged breeds.
   ellipse(ctx,94,244,26,17,gradient(ctx,89,235,34,light,bodyShade),-.10);
   ellipse(ctx,145,244,26,17,gradient(ctx,138,236,34,light,bodyShade),.10);
   line(ctx,[90,245,90,251],mix(ink,light,.38)+'70',1.1);
   line(ctx,[98,245,98,252],mix(ink,light,.38)+'70',1.1);
   line(ctx,[141,245,141,252],mix(ink,light,.38)+'70',1.1);
   line(ctx,[150,245,150,250],mix(ink,light,.38)+'70',1.1);
   // Both ears are constructed BEFORE the intact head, so no rectangular edge.
   ear(ctx,74,-1,gradient(ctx,77,57,59,light,dark),'#f0b6b2',fold,fluffy);
   ear(ctx,166,1,gradient(ctx,168,58,59,light,dark),'#f0b6b2',fold,fluffy);
   if(fluffy){
     ellipse(ctx,55,133,20,26,mix(base,light,.48),-.4);
     ellipse(ctx,185,133,20,26,mix(base,light,.48),.4);
   }
   ellipse(ctx,120,119,fluffy?82:76,fluffy?73:69,gradient(ctx,103,92,98,light,base));
   // Coat identity: tabby, tuxedo blaze, calico patches, or Siamese points.
   if(tux){
     ctx.beginPath();ctx.moveTo(120,70);ctx.bezierCurveTo(103,94,108,124,108,143);
     ctx.quadraticCurveTo(120,163,133,143);ctx.bezierCurveTo(133,120,140,97,120,70);
     ctx.fillStyle='#faf4ec';ctx.fill();
     ellipse(ctx,119,156,27,19,'#fff9f1');
   }
   if(point){
     ellipse(ctx,120,124,48,39,mix(dark,'#5b4b55',.25)+'b9');
     ellipse(ctx,120,151,29,18,mix(light,'#fffaf0',.50));
   }
   if(calico){
     ctx.save();ctx.globalAlpha=.85;
     ellipse(ctx,88,91,31,26,'#a87655',-.20);
     ellipse(ctx,148,86,25,33,'#57525a',.35);ctx.restore();
   }
   if(tabby){
     const mark=mix(dark,base,.28)+'b5';
     line(ctx,[107,69,116,92],mark,6);
     line(ctx,[125,72,125,91],mark,5);
     line(ctx,[141,70,134,92],mark,5);
     line(ctx,[72,117,88,125],mark,5);
     line(ctx,[153,124,169,117],mark,5);
     line(ctx,[77,141,90,145],mark,3);
     line(ctx,[152,146,164,140],mark,3);
     if(p.pattern==='spotted'){
       for(const [x,y] of [[83,99],[165,104],[86,156],[154,160]]){
         ellipse(ctx,x,y,5,3,mark,.25);
       }
     }
   }
   // Rosette marks distinguish Bengal from plain tabby.
   if(p.palette==='bengal'){
     for(const [x,y] of [[82,174],[155,175],[71,204],[167,209]]){
       ctx.beginPath();ctx.ellipse(x,y,8,5,.3,0,Math.PI*1.7);
       ctx.lineWidth=3;ctx.strokeStyle=dark+'9b';ctx.stroke();
     }
   }
   // Round cheeks, tiny nose and mouth: readable at 40-60 CSS pixels.
   ellipse(ctx,83,145,21,15,light+'ac',-.1);
   ellipse(ctx,156,145,21,15,light+'ac',.1);
   ellipse(ctx,90,143,13,8,'#f3abb02d',-.2);
   ellipse(ctx,153,143,13,8,'#f3abb02d',.2);
   ellipse(ctx,109,152,18,12,'#fff5e5cb');
   ellipse(ctx,133,152,18,12,'#fff5e5cb');
   const opened=['niuniu','xiaohui','lanbao','xianluo','sanhua','baomao','xingchen','yunduo','moqiu'].includes(id);
   if(opened){
     const eye=p.eyeColor||'#6e8f7b';
     ellipse(ctx,91,124,10,13,mix(ink,'#282331',.55));
     ellipse(ctx,149,124,10,13,mix(ink,'#282331',.55));
     ellipse(ctx,91,125,6,9,eye);ellipse(ctx,149,125,6,9,eye);
     ellipse(ctx,89,120,3.1,4.1,'#fff');ellipse(ctx,147,120,3.1,4.1,'#fff');
   }else{
     ctx.beginPath();ctx.moveTo(77,127);ctx.quadraticCurveTo(89,110,105,127);
     ctx.moveTo(135,127);ctx.quadraticCurveTo(150,110,163,127);
     ctx.strokeStyle=ink;ctx.lineWidth=5.2;ctx.lineCap='round';ctx.stroke();
   }
   // An adorable natural open-mouth smile (never cut or off canvas).
   ctx.beginPath();ctx.moveTo(117,150);ctx.lineTo(123,150);ctx.lineTo(120,157);
   ctx.closePath();ctx.fillStyle=pink;ctx.fill();
   ctx.beginPath();ctx.moveTo(111,160);ctx.quadraticCurveTo(119,175,127,160);
   ctx.quadraticCurveTo(122,178,118,178);ctx.quadraticCurveTo(109,175,111,160);
   ctx.fillStyle='#995d63';ctx.fill();
   ellipse(ctx,119,173,5,3,'#ed9b9d');
   for(const side of [-1,1]){
     const ox=side<0?102:138;
     for(const dy of [-7,0,7]){
       ctx.beginPath();ctx.moveTo(ox,154+dy*.35);
       ctx.quadraticCurveTo(ox+side*20,149+dy,ox+side*42,148+dy*1.15);
       ctx.lineWidth=1.5;ctx.strokeStyle=ink+'79';ctx.stroke();
     }
   }
   // Bright little neck ribbon and small bell like the approved kitten style.
   const ribbon=['moqiu','xingchen','youling'].includes(id)?'#b69adf':'#cf656b';
   ellipse(ctx,121,186,20,10,ribbon);
   ctx.beginPath();ctx.moveTo(117,183);ctx.lineTo(91,178);ctx.quadraticCurveTo(88,191,101,197);ctx.lineTo(119,189);
   ctx.closePath();ctx.fillStyle=ribbon;ctx.fill();
   ctx.beginPath();ctx.moveTo(122,185);ctx.lineTo(149,178);ctx.quadraticCurveTo(153,191,139,197);ctx.lineTo(122,191);
   ctx.closePath();ctx.fillStyle=mix(ribbon,'#fff9f4',.17);ctx.fill();
   ellipse(ctx,122,194,10,11,gradient(ctx,119,189,17,'#ffeb96','#c48d35'));
   ellipse(ctx,123,197,2.5,3.5,'#866331');ellipse(ctx,121,187,4,2,'#fff6be');
   // Rare glitter stays subtle and attached to fur rather than floating heads.
   if(['jinwu','yuelian','xingchen','yinghua'].includes(id)){
     for(const [x,y] of [[79,166],[171,177]]){
       ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+2,y-1);ctx.lineTo(x+7,y+1);
       ctx.lineTo(x+2,y+3);ctx.lineTo(x,y+8);ctx.lineTo(x-2,y+3);ctx.lineTo(x-6,y+1);
       ctx.lineTo(x-2,y-1);ctx.closePath();ctx.fillStyle='#f8e4a4bf';ctx.fill();
     }
   }
   ctx.restore();
 }
 function frameFor(species){
  const sp=species||{id:'tangyuan',palette:'orange'};
  const key=sp.id||sp.palette||'orange';
  if(!cache.has(key)){
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   draw(canvas.getContext('2d'),sp);cache.set(key,canvas);
  }
  return {image:cache.get(key),sx:0,sy:0,sw:W,sh:H};
 }
 window.CatBondCompleteKittens={frameFor,breedCount:25,transparent:true};
})();