/* Cat Bond illustrated duo cut-ins: real roster species, light fantasy palettes.
 * The 25-breed transparent illustration atlas is already part of the game,
 * so the effect never swaps the player's cat for a generic black/white kitten.
 * Every animated kitten is always one COMPLETE image, never a split limb rig.
 */
(function(){
'use strict';
const order=['tangyuan','doudou','xiaohui','moqiu','nainai','nietu','niuniu',
 'sanhua','lixiao','lanbao','dundun','yunduo','zherdd','qisi','duanduan',
 'jinjc','xianluo','yinghua','senlin','youling','nuowei','baomao','jinwu','yuelian','xingchen'];
const atIndex=Object.fromEntries(order.map((s,i)=>[s,i]));
// Reuse the game's CURRENT source-of-truth complete watercolor kittens.
// Loading an obsolete 5x5 atlas would change the visual style and violate the
// no-split, no-mirrored-face asset rule enforced by production CI.
const watercolorsReady=()=>!!(
 window.CatBondArtworkStatus?.breedsLoaded||
 window.CatBondArtworkStatus?.originalLoaded
);
const scene=new Image();scene.decoding='async';
let sceneOK=false;
scene.onload=()=>{sceneOK=scene.naturalWidth===480&&scene.naturalHeight===405;
 window.dispatchEvent(new Event('cat-bond-duo-art-ready'));};
scene.onerror=()=>{sceneOK=false;};
scene.src=(window.CatBondDuoAssetBase||'assets/')+'duo-scene-backgrounds.webp?v=20261121-pastel-v1';
const palette={
 storm:['#171333','#36215b','#ab7ef4','#faf0ff'],
 moon:['#d9dbf9','#f3e8ff','#b5b4ef','#524e80'],
 spring:['#d2f7e8','#faf4ec','#b5e9d5','#376e72'],
 water:['#c9eff8','#f2fcff','#8bcee6','#396e95'],
 solar:['#ffebcf','#fff7e9','#ffcd93','#92604b']
};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const ease=n=>1-Math.pow(1-clamp(n),3);
function theme(key){
 if(['elec+elec','elec+fire','dark+elec'].includes(key))return 'storm';
 if(['dark+light','light+light','dark+dark'].includes(key))return 'moon';
 if(['grass+water','fire+grass','grass+grass','grass+light','dark+grass','elec+grass'].includes(key))return 'spring';
 if(key.includes('water'))return 'water';
 if(key.includes('light')||key.includes('fire'))return 'solar';
 return 'moon';
}
function backdrop(ctx,W,H,p,key){
 const kind=theme(key),colors=palette[kind],idx=['storm','moon','spring','water','solar'].indexOf(kind);
 ctx.save();const gradient=ctx.createLinearGradient(0,0,W,H);
 gradient.addColorStop(0,colors[0]);gradient.addColorStop(.55,colors[1]);gradient.addColorStop(1,colors[2]);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 if(sceneOK){
  ctx.save();ctx.globalAlpha=kind==='storm'?.67:.46;
  const sx=(idx%2)*240,sy=Math.floor(idx/2)*135;
  ctx.drawImage(scene,sx,sy,240,135,0,0,W,H);
  ctx.restore();
 }
 // Lightweight mist and directional motion: different elements are never
 // dark-purple copies of each other.
 ctx.save();ctx.globalAlpha=kind==='storm'?.10:.16;
 for(let i=0;i<7;i++){
  const x=W*(i+.15)/7+p*W*.065;
  ctx.fillStyle=colors[i%2?0:1];
  ctx.beginPath();ctx.ellipse(x,H*(.38+.08*Math.sin(i*1.9)),W*.10,H*.53,-.17,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 ctx.strokeStyle=colors[2];ctx.lineWidth=2;
 if(kind==='storm'){
  ctx.save();ctx.globalAlpha=.48;ctx.shadowColor='#a678ff';ctx.shadowBlur=13;
  for(let i=0;i<5;i++){
   const x=W*(i+.65)/6;
   ctx.beginPath();ctx.moveTo(x,H*.09);ctx.lineTo(x+9,H*.22);
   ctx.lineTo(x-5,H*.33);ctx.lineTo(x+18,H*.48);
   ctx.stroke();
  }ctx.restore();
 }else if(kind==='water'){
  ctx.save();ctx.globalAlpha=.30;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(W*(.2+.15*i),H*.74,25+i*7,7+i*2,0,0,Math.PI*2);ctx.stroke()}ctx.restore();
 }else if(kind==='spring'){
  ctx.save();ctx.globalAlpha=.33;
  for(let i=0;i<14;i++){let x=W*(i+.2)/14,y=H*(.18+Math.sin(i*1.8)*.22);
   ctx.fillStyle=i%2?'#ffd6e6':'#f4ffcf';ctx.beginPath();ctx.ellipse(x,y,5,9,i*.5,0,Math.PI*2);ctx.fill()}ctx.restore();
 }else if(kind==='solar'){
  const g=ctx.createRadialGradient(W*.62,H*.26,0,W*.62,H*.26,H*.52);
  g.addColorStop(0,'#fffefabb');g.addColorStop(1,'#fff7d000');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 }else{
  ctx.save();ctx.globalAlpha=.38;ctx.fillStyle='#fffdf8';ctx.beginPath();
  ctx.arc(W*.74,H*.27,Math.max(17,H*.16),0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.restore();
 return {kind,colors};
}
function speciesOf(cat){
 const raw=typeof cat?.species==='string'?cat.species:cat?.species?.id||cat?.id;
 return atIndex[raw]!==undefined?raw:'tangyuan';
}
function drawKitten(ctx,x,y,ht,cat,flip,p,style,color,label){
 const speciesId=speciesOf(cat),index=atIndex[speciesId],scale=clamp(ht,90,300);
 const pop=ease(p/.33),dash=ease((p-.22)/.44);
 const lead=['blink','dash','zigzag','shadow','ember'].includes(style);
 const spin=['spiral','tides','fireworks','petals'].includes(style);
 const highFive=['stars','halo','highfive'].includes(style);
 const protector=['eclipse','lake','snare'].includes(style);
 const gesture=highFive?'duo-highfive':
   protector&&!flip?'duo-guard':
   ['shadow','blink','dash','ember','zigzag','cannon','blossom','vine'].includes(style)
     ?'duo-swipe':'walk';
 const guard=['eclipse','lake','halo','snare','sprout','solar'].includes(style);
 const direction=flip?1:-1;
 // The director already animates height. A second large vertical offset
 // used to crop the head off airborne cats, so keep this grounded.
 const launch=spin?Math.sin(Math.PI*p)*scale*.055:
   guard&&!flip?0:Math.sin(Math.PI*p)*scale*.03;
 const tilt=highFive?direction*.045*Math.sin(Math.PI*p):
   spin?direction*(.16*Math.sin(Math.PI*p)):
   lead?direction*.14*dash:direction*.07*dash;
 const width=scale*200/300;
 ctx.save();ctx.translate(x,y-launch);
 ctx.rotate(tilt);ctx.scale(flip?-1:1,1);
 // Soft grounding, anchored under the same full-body sprite, no floating feet.
 ctx.save();ctx.globalAlpha=.16*pop;ctx.fillStyle=color||'#bcb2db';
 ctx.beginPath();ctx.ellipse(0,scale*.47,width*.50,scale*.075,0,0,Math.PI*2);ctx.fill();ctx.restore();
 // A single intact image preserves paws, tail, ears and breed-specific coat.
 // Same actual per-species full-body watercolor renderer as the yard,
 // exploration map and regular battle. No substitution with schematic cats.
 const sp=window.GameData?.speciesById?.(speciesId)||
    {id:speciesId,palette:'orange',pattern:'tabby',eyeColor:'#688c88'};
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 // Independent full-canvas cinematic artwork: absolutely no yard/map sprite
 // reuse in a special attack. Coat, ear silhouette, eyes and markings come
 // from the player's selected cat's actual GameData species.
 window.CatBondDuoPortraits?.draw(ctx,sp,scale,p,style,color);;
 // Paw spark originates BESIDE the leading actual illustrated forepaw.
 if(p>.20){
  // Each special reaches its forepaw differently; the actual watercolor
  // hand and wrist are animated in real-kittens.js before this glow is drawn.
  const f=Math.sin(clamp((p-.20)/.30)*Math.PI);
  ctx.globalAlpha=Math.max(0,f)*.79;
  const px=width*(highFive?.33:protector?.12:.22),
    py=scale*(highFive?-.09:protector?.06:.13);
  ctx.strokeStyle=color||'#d5a2f2';ctx.shadowColor=color||'#e3c5fb';
  ctx.shadowBlur=11;ctx.lineWidth=3;ctx.lineCap='round';
  if(highFive){
    // One brief paw contact spark (not a generic three-slash overlay).
    ctx.beginPath();ctx.arc(px+width*.15,py,5+f*8,0,Math.PI*2);ctx.stroke();
  }else if(protector){
    ctx.beginPath();ctx.arc(px+width*.20,py,12+f*12,-1.7,1.7);ctx.stroke();
  }else for(let k=-1;k<=1;k++){
    ctx.beginPath();ctx.moveTo(px-3,py+k*8);
    ctx.quadraticCurveTo(px+width*.21,py+k*8-10,px+width*.39,py+k*10+7);ctx.stroke();
  }
 }
 ctx.restore();
 return {species:speciesId,label:label||cat?.nickname||
   window.GameData?.speciesById?.(speciesId)?.name||speciesId,
   atlas:watercolorsReady(),x,y};
}
window.CatBondDuoArtwork={backdrop,drawKitten,theme,speciesOf,
 get ready(){return !!window.CatBondDuoPortraits?.draw},get backdropReady(){return true},
 breedCount:order.length,sceneKinds:Object.keys(palette)};
})();