/* Cat Bond illustrated duo cut-ins: real roster species, light fantasy palettes.
 * The 25-breed transparent illustration atlas is already part of the game,
 * so the effect never swaps the player's cat for a generic black/white kitten.
 * Every animated kitten is always one COMPLETE image, never a split limb rig.
 */
(function(){
'use strict';
const order=['tangyuan','doudou','xiaohui','moqiu','nainai','nietu','niuniu',
 'sanhua','lixiao','lanbao','dundun','yunduo','zherdd','qisi','duanduan',
 'jinjc','xianluo','yinghua','senlin','youling','nuowei','baomao','jinwu','yuelian','xingchen',
 'abi','meidu','xuewa','mengmai','fanmao','bosi','wumao'];
const atIndex=Object.fromEntries(order.map((s,i)=>[s,i]));
// Reuse the game's CURRENT source-of-truth complete watercolor kittens.
// Loading an obsolete 5x5 atlas would change the visual style and violate the
// no-split, no-mirrored-face asset rule enforced by production CI.
const watercolorsReady=()=>!!(
 window.CatBondArtworkStatus?.breedsLoaded||
 window.CatBondArtworkStatus?.originalLoaded
);
// Warm, storybook environments. Avoid uniform solid-blue / solid-purple shots.
const palette={
 storm:['#f1e9e4','#faf2e9','#d9e9d6','#71857d'],
 moon:['#f3e9e6','#faf3e9','#dfdfcb','#847d82'],
 spring:['#f9eddf','#fff6e8','#cbe8c6','#5e8068'],
 water:['#f2f1dc','#fdf6eb','#bcded0','#5f8c84'],
 solar:['#ffe3c9','#fff8e6','#ebd9b8','#926f69']
};
// Variations make all 21 skill environments feel individually recognizable.
const localScenes={
 'dark+dark':['#f0e7e1','#faf3e9','#d8d9cd'],
 'dark+elec':['#f5e7dc','#fff8ea','#d2e7d7'],
 'dark+fire':['#f3e0d5','#fff0da','#e6cfb8'],
 'dark+grass':['#f6eada','#fff8e9','#c5ddbd'],
 'dark+light':['#f7e7e3','#fff7ed','#dcdcc4'],
 'dark+water':['#edede0','#fbf7e8','#c3dfcc'],
 'elec+elec':['#fbe8da','#fff5e5','#e5ddbd'],
 'elec+fire':['#f9dec8','#fff2dc','#f2d3ae'],
 'elec+grass':['#f4e5cf','#fdf6e8','#c6dfb8'],
 'elec+light':['#f8e5ce','#fff8ea','#dedfc1'],
 'elec+water':['#f1ecdc','#fff8ed','#c8e3cc'],
 'fire+fire':['#fad9c1','#fff0d9','#f1cfad'],
 'fire+grass':['#fbe6d8','#fff7ed','#d4e8c7'],
 'fire+light':['#ffe4ca','#fff9ec','#eed4b3'],
 'fire+water':['#f9e7d8','#fff6ed','#d0e4d3'],
 'grass+grass':['#f6e5ce','#fff8e7','#bedfbb'],
 'grass+light':['#f9e8dc','#fff9ee','#d7e7bd'],
 'grass+water':['#f3ecdd','#fff9ed','#b9ddca'],
 'light+light':['#fcf0dc','#fff9ef','#eadfbe'],
 'light+water':['#f1ebdb','#fff8ec','#c7dfcf'],
 'water+water':['#edeadc','#fff9ed','#b9d9c7']
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
 const kind=theme(key),colors=[...(localScenes[key]||palette[kind]),palette[kind][3]],idx=['storm','moon','spring','water','solar'].indexOf(kind);
 ctx.save();const gradient=ctx.createLinearGradient(0,0,W,H);
 gradient.addColorStop(0,colors[0]);gradient.addColorStop(.55,colors[1]);gradient.addColorStop(1,colors[2]);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 // Lightweight mist and directional motion: different elements are never
 // dark-purple copies of each other.
 ctx.save();ctx.globalAlpha=kind==='storm'?.07:.12;
 for(let i=0;i<7;i++){
  const x=W*(i+.15)/7+p*W*.065;
  ctx.fillStyle=colors[i%2?0:1];
  ctx.beginPath();ctx.ellipse(x,H*(.38+.08*Math.sin(i*1.9)),W*.10,H*.53,-.17,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 ctx.strokeStyle=colors[2];ctx.lineWidth=2;
 if(kind==='storm'){
  ctx.save();ctx.globalAlpha=.31;ctx.shadowColor='#e3c8a0';ctx.shadowBlur=8;
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
 // Quiet illustrated scenery creates depth without swallowing the kittens.
 ctx.save();ctx.globalAlpha=.78;
 const hill=ctx.createLinearGradient(0,H*.56,0,H);
 hill.addColorStop(0,colors[2]+'11');hill.addColorStop(1,colors[2]+'cf');
 ctx.fillStyle=hill;ctx.beginPath();ctx.moveTo(0,H*.81);
 ctx.quadraticCurveTo(W*.29,H*.67,W*.52,H*.81);
 ctx.quadraticCurveTo(W*.77,H*.70,W,H*.77);
 ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
 // Tiny meadow lights and blossom petals are on the floor, away from faces.
 for(let i=0;i<11;i++){
  const x=W*(.06+i*.088),y=H*(.78+.035*Math.sin(i*3.1));
  ctx.fillStyle=i%3===0?'#f9d1ce':i%3===1?'#fff5cf':'#d4e7c6';
  ctx.beginPath();ctx.ellipse(x,y,3.2,6,Math.sin(i)*.4,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 ctx.restore();
 return {kind,colors};
}
function speciesOf(cat){
 const raw=typeof cat?.species==='string'?cat.species:cat?.species?.id||cat?.id;
 return atIndex[raw]!==undefined?raw:'tangyuan';
}
function drawKitten(ctx,x,y,ht,cat,flip,p,style,color,tier=1,label){
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
 window.CatBondDuoPortraits?.draw(ctx,sp,scale,p,style,color,tier);
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