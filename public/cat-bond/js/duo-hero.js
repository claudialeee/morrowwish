// Illustrated double-paw cut-in: kinetic, expressive cats drawn independently
// of regular breed sprites. Fast Canvas2D, no image files or network requests.
(function(){
'use strict';
const coats=[
 ['#e8a26c','#fff0d9','#81533d'],['#a9abb5','#f0eff1','#626477'],
 ['#39465a','#d3dce6','#263448'],['#dbb7a3','#fff0e4','#9a6e65'],
 ['#bea4ca','#f7e8f5','#765f82'],['#9dbdab','#e7f4e8','#5f8171'],
 ['#f0e2ce','#fffdf2','#ab9688'],['#b9906c','#f5d7ad','#74553c']
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v,0,1),3);
function coat(c){const s=String(c?.species||c?.uid||'cat');let n=0;for(const letter of s)n=(n*31+letter.charCodeAt(0))>>>0;return coats[n%coats.length];}
function oval(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function path(ctx,pts,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.fill();}
function cat(ctx,x,y,size,subject,face,age,col){
 const [fur,white,outline]=coat(subject);
 const crouch=clamp(age/.27,0,1),swipe=clamp((age-.28)/.27,0,1);
 const leap=clamp((age-.2)/.31,0,1);
 ctx.save();ctx.translate(x,y-Math.sin(leap*Math.PI)*34*(size/180));
 ctx.scale(face*size/180,size/180);
 ctx.rotate(face*(-.10+crouch*.06+swipe*.08));
 // A proper cat tail connects to its torso and flicks during the launch.
 ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=22;ctx.strokeStyle=outline;
 ctx.beginPath();ctx.moveTo(49,34);ctx.bezierCurveTo(95,10,109,-57,72,-66);ctx.stroke();
 ctx.lineWidth=15;ctx.strokeStyle=fur;ctx.stroke();
 oval(ctx,14,25,67,71,outline);oval(ctx,12,23,63,67,fur);
 oval(ctx,-23,46,33,32,white);
 // Grounded hind legs / paws.
 oval(ctx,46,79,29,16,outline);oval(ctx,45,75,24,13,fur);
 oval(ctx,-35,79,30,16,outline);oval(ctx,-35,75,26,13,white);
 // Triangular ears with pale inner ear and outlined fluffy head.
 path(ctx,[[-63,-61],[-77,-141],[-22,-93]],outline);
 path(ctx,[[18,-91],[67,-146],[68,-57]],outline);
 path(ctx,[[-59,-71],[-66,-121],[-31,-89]],'#e6a1a7');
 path(ctx,[[32,-92],[58,-125],[57,-71]],'#e6a1a7');
 oval(ctx,0,-40,81,74,outline);oval(ctx,0,-40,76,69,fur);
 oval(ctx,0,-10,47,29,white);
 // Determined yet unmistakably friendly kitten expression.
 ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.beginPath();
 ctx.moveTo(-47,-65);ctx.lineTo(-22,-61);ctx.moveTo(18,-62);ctx.lineTo(47,-69);ctx.stroke();
 oval(ctx,-31,-48,13,9,'#293648');oval(ctx,32,-50,13,9,'#293648');
 oval(ctx,-28,-52,4,4,col||'#ffe0a4');oval(ctx,34,-54,4,4,col||'#ffe0a4');
 path(ctx,[[-7,-21],[8,-21],[1,-12]],'#d88a96');
 ctx.lineWidth=2.8;ctx.strokeStyle=outline;ctx.beginPath();
 ctx.moveTo(1,-12);ctx.quadraticCurveTo(-4,-3,-14,-10);
 ctx.moveTo(1,-12);ctx.quadraticCurveTo(9,-3,17,-11);ctx.stroke();
 for(const s of [-1,1])for(let j=0;j<2;j++){
  ctx.beginPath();ctx.moveTo(s*39,-20+j*11);ctx.lineTo(s*72,-25+j*19);ctx.stroke();
 }
 // One large articulated forepaw actually swings; three visible claw tips.
 ctx.save();ctx.translate(40,13);ctx.rotate(-.7+swipe*1.55);
 ctx.strokeStyle=outline;ctx.lineWidth=28;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(53,-10);ctx.stroke();
 ctx.strokeStyle=fur;ctx.lineWidth=22;ctx.stroke();
 oval(ctx,69,-11,27,24,outline);oval(ctx,68,-13,23,20,fur);
 for(let i=-1;i<=1;i++){
  ctx.lineWidth=6;ctx.strokeStyle='#fff9ed';
  ctx.beginPath();ctx.moveTo(82,-13+i*11);ctx.quadraticCurveTo(101,-20+i*11,110,-12+i*11);ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle=outline;ctx.stroke();
 }
 ctx.restore();ctx.restore();
}
function claws(ctx,cx,cy,angle,col,alpha,scale){
 ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.scale(scale,scale);
 ctx.globalAlpha=alpha;ctx.lineCap='round';
 for(let i=-1;i<=1;i++){
  const yy=i*22;
  ctx.strokeStyle=col;ctx.lineWidth=13;ctx.shadowColor=col;ctx.shadowBlur=20;
  ctx.beginPath();ctx.moveTo(-107,yy-37);ctx.quadraticCurveTo(-10,yy-8,105,yy+37);ctx.stroke();
  ctx.strokeStyle='#fffdf3';ctx.shadowBlur=0;ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-105,yy-37);ctx.quadraticCurveTo(-10,yy-8,103,yy+37);ctx.stroke();
 }
 ctx.restore();
}
function draw(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 const age=seq.max-seq.t;
 if(age>1.82)return true; // leave the actual arena visible for the lingering field
 const p=clamp(age/1.52,0,1),tier=seq.tier||1;
 const alpha=clamp(age/.16,0,1)*clamp((1.86-age)/.26,0,1);
 const h=Math.min(H*.78,380),cy=H*.50,top=cy-h/2;
 // Fit the ears, paws and connecting forearms INSIDE even a short mobile
 // landscape viewport. A full-body cat never gets cut at the letterbox edge.
 const size=Math.min(W*.30,h*.54,175)*(tier>=3?1.02:1);
 const xshift=ease((p-.15)/.42)*W*.24;
 const col1=seq.first||'#ffc38d',col2=seq.second||'#c0b6ff';
 const ids=seq.catUids||[];
 const signatures=window.CatBondDuoSignatures;
 const signature=signatures?.get?.(seq.elements);
 const choreography=signature?signatures.course(signature.style,p,W,h,cy,tier):null;
 ctx.save();ctx.globalAlpha=alpha;
 const grad=ctx.createLinearGradient(0,top,W,top+h);
 grad.addColorStop(0,'#15263c');grad.addColorStop(.50,'#343349');grad.addColorStop(1,'#193849');
 ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(W*.025,top,W*.95,h,Math.min(22,W*.05));ctx.fill();
 ctx.beginPath();ctx.roundRect(W*.025,top,W*.95,h,Math.min(22,W*.05));ctx.clip();
 // Art-directed scenery for this exact combination, BEHIND complete cat rigs.
 if(signature){
   ctx.save();ctx.translate(0,top);
   signatures.paint(ctx,W,h,p,tier,seq.elements);
   ctx.restore();
 }
 // Angular speed streaks, kicked forward only as the paws accelerate.
 for(let i=0;i<12;i++){
  ctx.save();ctx.globalAlpha=alpha*(.12+.12*(i%3));
  ctx.strokeStyle=i%2?col1:col2;ctx.lineWidth=i%3===0?8:3;
  const sx=W*((i+.4)/12)+p*W*.12;
  ctx.beginPath();ctx.moveTo(sx-140,top+h);ctx.lineTo(sx+70,top);ctx.stroke();ctx.restore();
 }
 // Limit the center crossing to CLAWS, not the kittens' heads. This avoids
 // a two-cat body overlap that looks like broken or split-up characters.
 const paintCat=(x,y,scale,id,face,phase,color)=>{
   const actualSize=size*scale;
   const safeMin=top+actualSize*1.04+10;
   const safeMax=top+h-actualSize*.54-10;
   const safeY=Math.max(safeMin,Math.min(safeMax,y));
   cat(ctx,x,safeY,actualSize,lookup(id),face,phase,color);
 };
 paintCat(Math.min(W*.35,choreography?.x1??W*.29),
   choreography?.y1??(cy+h*.15),choreography?.scale||1,ids[0],1,
   choreography?.phase1??p,col1);
 paintCat(Math.max(W*.65,choreography?.x2??W*.71),
   choreography?.y2??(cy+h*.15),choreography?.scale||1,ids[1],-1,
   choreography?.phase2??p,col2);
 // Vary movement, not just numerical damage, at each relationship tier.
 const hit=clamp((p-.43)/.24,0,1);
 if(hit>0){
  const burst=Math.sin(hit*Math.PI*.8);
  claws(ctx,W*.5,cy,Math.PI*.25,col1,burst,Math.min(1.05,W/370));
  if(tier>=2)claws(ctx,W*.5,cy,-Math.PI*.25,col2,burst,Math.min(1.05,W/370));
  if(tier>=3){
   ctx.globalAlpha=alpha*.65*burst;ctx.strokeStyle='#ffecb8';
   ctx.lineWidth=5;ctx.beginPath();ctx.arc(W*.5,cy,35+hit*W*.32,0,Math.PI*2);ctx.stroke();
   claws(ctx,W*.5,cy,Math.PI*.5,'#fff4c6',burst*.65,Math.min(.77,W/460));
  }
  // Lock-on / hit confirmation appears at the exact crossing beat.
  ctx.globalAlpha=alpha*burst;ctx.strokeStyle='#fff5d6';ctx.lineWidth=3;
  const rad=27+25*hit;
  ctx.beginPath();ctx.arc(W*.5,cy,rad,0,Math.PI*2);ctx.stroke();
 }
 const en=window.MorrowwishI18n?.get?.()!=='zh';
 const rank=tier>=3?(en?'SOULBOUND FINALE':'心意相通 · 终极连斩'):
   tier>=2?(en?'CROSS-CLAW COMBO':'默契进阶 · 交叉爪击'):
   (en?'TWIN PAW POUNCE':'双猫合击 · 联手飞扑');
 // Keep title readable over scenery/kitten feet, not as floating text.
 ctx.globalAlpha=alpha*.77;
 const titleFade=ctx.createLinearGradient(0,top+h*.7,0,top+h);
 titleFade.addColorStop(0,'rgba(9,22,37,0)');
 titleFade.addColorStop(1,'rgba(9,22,37,.96)');
 ctx.fillStyle=titleFade;ctx.fillRect(W*.025,top+h*.69,W*.95,h*.31);
 ctx.globalAlpha=alpha;ctx.textAlign='center';
 ctx.font='900 '+Math.round(Math.min(26,W*.052))+'px system-ui';
 ctx.fillStyle='#fff8ec';ctx.shadowColor=col1;ctx.shadowBlur=10;
 ctx.fillText(seq.name||rank,W*.5,top+h*.83,W*.85);
 ctx.shadowBlur=0;ctx.font='800 '+Math.round(Math.min(14,W*.033))+'px system-ui';
 ctx.fillStyle='#f9d79c';ctx.fillText(signature&&en?'SIGNATURE · '+signature.label:rank,W*.5,top+h*.92,W*.86);
 ctx.restore();return true;
}
window.CatBondDuoHero={draw,coat};
})();
