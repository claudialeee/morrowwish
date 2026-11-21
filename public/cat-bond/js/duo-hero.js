/* Cat Bond — PREMIUM 21-combination duo cinematic.
 * Uses the eight ORIGINAL finished illustrations approved in this chat, not
 * recycled generic vector kittens. Each elemental pairing has an independent
 * attack choreography (camera, speed, magic and impact). Team names and breed
 * watercolor badges are taken from the two actual deployed starter cats.
 *
 * Source sheet: 2 columns × 4 rows, each finished painting 650×366 WebP.
 * Art: moon ward, spring rain, tidal chase, solar carousel, thunder spiral,
 * shadow ambush, cross-claw storm, lunar thunder counter.
 */
(function(){
'use strict';
const sheet=new Image();sheet.decoding='async';
sheet.src='assets/duo-premium-sheet.webp?v=catbond-original-art-20261121';
let ready=false;sheet.onload=()=>{ready=true;window.dispatchEvent(new Event('catbond-premium-cutin-ready'))};
sheet.onerror=()=>{ready=false};
const keys=['dark+dark','dark+elec','dark+fire','dark+grass','dark+light','dark+water',
 'elec+elec','elec+fire','elec+grass','elec+light','elec+water',
 'fire+fire','fire+grass','fire+light','fire+water',
 'grass+grass','grass+light','grass+water','light+light','light+water','water+water'];
// Distinct painting + shot composition + elemental effect for every pairing.
// The eight paintings remain intact: no detached cat limbs, no fake cats.
const scenes={
 'dark+dark':[5,'shadow', '#a88bff','low-left'],
 'dark+elec':[7,'blink',  '#d4a8ff','high-right'],
 'dark+fire':[5,'ember', '#ffb1b8','high-left'],
 'dark+grass':[1,'vine', '#b7e8b6','low-right'],
 'dark+light':[0,'eclipse','#e6d7ff','guard'],
 'dark+water':[2,'mist','#9cc9e9','diagonal'],
 'elec+elec':[4,'zigzag','#db9dff','spiral'],
 'elec+fire':[6,'spiral','#f5b2ff','cross'],
 'elec+grass':[4,'snare','#ccf5a3','low-left'],
 'elec+light':[7,'dash','#e5ccff','rush'],
 'elec+water':[2,'bubbles','#b4e4ff','high-right'],
 'fire+fire':[3,'fireworks','#ffd49d','high-left'],
 'fire+grass':[1,'petals','#ffe0ab','bloom'],
 'fire+light':[3,'solar','#fff1ae','orbit'],
 'fire+water':[2,'cannon','#facda4','burst'],
 'grass+grass':[1,'sprout','#b8e9c0','guard'],
 'grass+light':[3,'halo','#f7eac6','orbit'],
 'grass+water':[1,'blossom','#a6f0dd','bloom'],
 'light+light':[0,'stars','#f6eafc','guard'],
 'light+water':[0,'lake','#cce9fb','diagonal'],
 'water+water':[2,'tides','#a9e2ff','rush']
};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const colors={dark:'#c7adeb',elec:'#e8bafa',fire:'#ffbf91',grass:'#c2e8af',
 light:'#fff3d2',water:'#a3dafa'};
const brightPairs=new Set(['dark+dark','dark+elec','elec+elec','elec+fire','elec+grass','elec+light']);
const en=()=>window.MorrowwishI18n?.get?.()!=='zh';
function label(cat){
 if(!cat)return '';
 if(window.State?.catName)try{return window.State.catName(cat)}catch{}
 return cat.nickname||window.GameData?.speciesById?.(cat.species)?.name||String(cat.species||'');
}
function paintFallback(ctx,W,H,seq,lookup,p){
 // Never revert to old low-quality pseudo-cat rig if asset fetch is delayed.
 // Retain the game’s existing coherent full-watercolor species renderer.
 const elem=seq.elements||'water+water';
 if(window.CatBondDuoArtwork?.backdrop)window.CatBondDuoArtwork.backdrop(ctx,W,H,p,elem);
 const ids=seq.catUids||[];
 if(window.CatBondDuoArtwork?.drawKitten){
  window.CatBondDuoArtwork.drawKitten(ctx,W*.27,H*.70,Math.min(H*.72,W*.34),lookup(ids[0]),false,p,'dash',seq.first);
  window.CatBondDuoArtwork.drawKitten(ctx,W*.73,H*.70,Math.min(H*.72,W*.34),lookup(ids[1]),true,p,'dash',seq.second);
 }
}
function shot(entry,index,p){
 // Global camera in/out + pair-specific movement; whole illustrated cats
 // remain one coherent image and are never mirrored or split into body pieces.
 const style=entry[3],release=smooth((p-.04)/.43);
 const energy=smooth((p-.24)/.30);
 const swing=Math.sin(Math.PI*clamp(p/.86));
 const dir=index%2?-1:1;
 let dx=0,dy=0,zoom=1.027+.055*release+.035*energy;
 switch(style){
  case 'shadow': dx=-.048*(1-release);dy=.03*swing;break;
  case 'low-left':dx=-.065*(1-release);dy=.04*swing;break;
  case 'high-right':dx=.05*(1-release);dy=-.045*swing;break;
  case 'high-left':dx=-.04*(1-release);dy=-.044*swing;break;
  case 'low-right':dx=.035*(1-release);dy=.035*swing;break;
  case 'guard':dx=.008*Math.sin(2*Math.PI*p);zoom=1.025+.037*release;break;
  case 'diagonal':dx=.048*(1-release);dy=-.036*(1-release);break;
  case 'spiral':dx=.035*Math.cos(3*Math.PI*p)*swing;dy=.025*Math.sin(3*Math.PI*p)*swing;break;
  case 'cross':dx=.017*Math.sin(5*Math.PI*p)*swing;zoom=1.045+.08*release;break;
  case 'rush':dx=-.075*(1-release);zoom=1.03+.065*release;break;
  case 'bloom':dy=-.03*(1-release);zoom=1.015+.05*release;break;
  case 'orbit':dx=.025*Math.sin(3*Math.PI*p);dy=.02*Math.cos(3*Math.PI*p);break;
  case 'burst':zoom=1.015+.09*smooth((p-.37)/.25);break;
 }
 // Small signature-specific offset makes repeated paintings feel authored.
 dx+=dir*.006*Math.sin((index%5+2)*Math.PI*p)*swing;
 return {dx,dy,zoom};
}
function render(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 const age=seq.max-seq.t, p=clamp(age/Math.max(1,seq.max));
 const key=scenes[seq.elements]?seq.elements:'elec+fire';
 const cfg=scenes[key],idx=keys.indexOf(key),tile=cfg[0];
 const alpha=smooth(age/.20)*(1-smooth((age-2.48)/.27));
 if(alpha<=0)return true;
 const W0=Math.max(1,W),H0=Math.max(1,H);
 const w=Math.min(W0*.965,H0*.83*650/366),h=w*366/650;
 const x=(W0-w)/2,y=(H0-h)/2;
 const areaH=Math.min(H0*.94,h+44),areaY=(H0-areaH)/2;
 ctx.save();ctx.globalAlpha=alpha;
 // soft backdrop evokes this scene's colors even on a tall phone canvas.
 const bg=ctx.createLinearGradient(0,0,W,H);
 bg.addColorStop(0,brightPairs.has(key)?'#251842':'#e6e8f1');
 bg.addColorStop(.55,brightPairs.has(key)?'#56376a':'#f5eef0');
 bg.addColorStop(1,brightPairs.has(key)?'#171b39':'#e7f3ef');
 ctx.fillStyle=bg;ctx.fillRect(0,areaY,W0,areaH);
 if(ready){
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(17,w*.04));ctx.clip();
  const move=shot(cfg,idx,p);
  const zoom=move.zoom,drawW=w*zoom,drawH=h*zoom;
  ctx.drawImage(sheet,(tile%2)*650,Math.floor(tile/2)*366,650,366,
    x+(w-drawW)/2+move.dx*w,y+(h-drawH)/2+move.dy*h,drawW,drawH);
  // Each of 21 techniques already has an authored elemental attack drawn
  // in duo-signatures.js. Add it as a short, restrained hit-beat overlay ONLY.
  if(p>.25&&p<.68&&window.CatBondDuoSignatures?.paint){
    ctx.save();ctx.translate(x,y);
    ctx.globalAlpha=.10+Math.sin(Math.PI*clamp((p-.25)/.43))*.15;
    window.CatBondDuoSignatures.paint(ctx,w,h,p,seq.tier||1,key);
    ctx.restore();
  }
  if(p>.31&&p<.59){
    ctx.save();
    const impact=Math.sin(Math.PI*clamp((p-.31)/.28));
    ctx.globalAlpha=.18*impact;
    const cx=x+w*.55,cy=y+h*.57;
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.37);
    glow.addColorStop(0,cfg[2]);glow.addColorStop(1,'#ffffff00');
    ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
    ctx.restore();
  }
  ctx.restore();
 }else{
  ctx.save();ctx.translate(x,y);
  paintFallback(ctx,w,h,seq,lookup,p);
  ctx.restore();
 }
 // Only the impact beat receives a brief flash, matching real damage at
 // strikeAt=0.78s. This communicates contact, never masks the cats for seconds.
 const strikeAge=seq.strikeAt||.78;
 const strike=Math.max(0,1-Math.abs(age-strikeAge)/.11);
 if(strike>0){
  ctx.save();ctx.globalAlpha=strike*.25;ctx.fillStyle='#fff8fa';ctx.fillRect(x,y,w,h);ctx.restore();
 }
 const panelH=Math.min(73,Math.max(48,h*.18));
 const strip=ctx.createLinearGradient(0,y+h-panelH,0,y+h);
 strip.addColorStop(0,'#111c3000');strip.addColorStop(1,'#111b30db');
 ctx.fillStyle=strip;ctx.fillRect(x,y+h-panelH,w,panelH);
 const sz=Math.round(clamp(w*.038,12,25));
 ctx.textAlign='center';ctx.shadowColor='#19253a';ctx.shadowBlur=4;
 ctx.font='900 '+sz+'px system-ui,-apple-system,sans-serif';ctx.fillStyle='#fffdf7';
 ctx.fillText(seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||
     (en()?'Duo Special':'双猫合击'),W0*.5,y+h-panelH*.36,w*.87);
 const cats=(seq.catUids||[]).map(uid=>lookup(uid)).filter(Boolean);
 if(cats.length>=2){
  ctx.shadowBlur=0;ctx.fillStyle='#f5ebdd';
  ctx.font='700 '+Math.round(clamp(w*.020,10,13))+'px system-ui,sans-serif';
  ctx.fillText(label(cats[0])+'  ×  '+label(cats[1]),
    W0*.5,y+h-Math.max(7,panelH*.08),w*.87);
 }
 ctx.shadowBlur=0;
 if((seq.tier||1)>=3&&age>.3&&age<1.2){
  ctx.save();ctx.globalAlpha=.6*Math.sin(Math.PI*clamp((age-.3)/.9));
  ctx.strokeStyle=cfg[2];ctx.lineWidth=4;
  ctx.strokeRect(x+4,y+4,w-8,h-8);
  ctx.restore();
 }
 ctx.restore();return true;
}
window.CatBondDuoHero={draw:render,scenes,sceneKeys:keys,get assetReady(){return ready},
 assetSource:'original-approved-illustrations',assetCount:8};
})();
