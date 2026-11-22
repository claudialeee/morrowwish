/* Premium Cat Bond duo cinematic renderer.
 * Uses the studio's high-resolution PAINTED ACTION ART, not schematic
 * yard sprites or reused procedural cartoon heads. The illustrated cut-in
 * is composed from the true pair's closest coat archetypes, while each
 * of the 21 elemental pairs retains its own motion / finisher.
 *
 * IMPORTANT: the current 8 painting panels contain 9 coat archetypes,
 * not a full 25-breed art inventory. Keep this in studio review until
 * all breed-specific final paintings are approved.
 */
(function(){
'use strict';
const img=new Image();
img.decoding='async';
let ready=false,broken=false;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const label=(cat)=>{
 try{return window.State?.catName?.(cat)||cat?.nickname||window.GameData?.speciesById?.(cat?.species)?.name||''}
 catch{return cat?.nickname||'猫猫'}
};
const coats={
 orange:[1,0],brownTabby:[0,1],silver:[0,1],black:[4,0],
 white:[0,0],cream:[3,0],tux:[4,0],calico:[1,1],
 blue:[2,0],ragdoll:[0,0],cheese:[1,0],apricot:[3,0],
 goldShaded:[3,0],siamese:[2,1],maine:[0,1],
 mystic:[5,1],norwegian:[0,1],bengal:[1,1],
 flame:[3,1],cloud:[0,0]
};
const regions={
 'dark+dark':4,'dark+elec':5,'dark+fire':6,'dark+grass':7,
 'dark+light':0,'dark+water':2,
 'elec+elec':5,'elec+fire':6,'elec+grass':1,'elec+light':0,
 'elec+water':2,'fire+fire':3,'fire+grass':1,
 'fire+light':3,'fire+water':2,'grass+grass':1,
 'grass+light':1,'grass+water':2,'light+light':0,
 'light+water':0,'water+water':2
};
const accents={
 dark:'#d0a8ff',elec:'#c6d4ff',fire:'#ffcc9b',grass:'#c8f4c6',
 light:'#fff9d9',water:'#c5ecff'
};
img.onload=()=>{ready=img.naturalWidth>=512&&img.naturalHeight>=512;broken=!ready;
 window.dispatchEvent(new Event('cat-bond-premium-art-ready'))};
img.onerror=()=>{broken=true;window.dispatchEvent(new Event('cat-bond-premium-art-error'))};
img.src=(window.CatBondDuoAssetBase||'assets/')+'duo-premium-sheet.webp?v=duo-studio-approved-art';

function coatOf(cat){
 const species=window.GameData?.speciesById?.(
   typeof cat?.species==='string'?cat.species:cat?.species?.id||cat?.id
 );
 return species?.palette||'orange';
}
function actorSource(cat){
 const coat=coatOf(cat);
 // Closer painted archetypes instead of changing a ginger cat into a
 // monochrome kitten for dramatic effect.
 return coats[coat]||coats.orange;
}
function cellRect(panel,half=null){
 const cellW=img.naturalWidth/2,cellH=img.naturalHeight/4;
 if(half===null)return {x:(panel%2)*cellW,y:Math.floor(panel/2)*cellH,w:cellW,h:cellH};
 const fraction=.59,start=half===0?.005:.405;
 return {x:(panel%2)*cellW+cellW*start,y:Math.floor(panel/2)*cellH+cellH*.014,
   w:cellW*fraction,h:cellH*.97};
}
function sourceCover(ctx,source,x,y,w,h,zoom=1,offsetX=0,offsetY=0,alpha=1){
 const srcAspect=source.w/source.h,dstAspect=w/h;
 let sx=source.x,sy=source.y,sw=source.w,sh=source.h;
 if(srcAspect>dstAspect){sw=sh*dstAspect;sx+=(source.w-sw)/2}
 else{sh=sw/dstAspect;sy+=(source.h-sh)/2}
 sw/=zoom;sh/=zoom;
 sx+=Math.max(0,(source.w-sw)/2)+offsetX*sw;
 sy+=Math.max(0,(source.h-sh)/2)+offsetY*sh;
 sx=clamp(sx,source.x,source.x+source.w-sw);
 sy=clamp(sy,source.y,source.y+source.h-sh);
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);ctx.restore();
}
function paper(g,x,y,w,h){
 const v=g.createLinearGradient(0,y,0,y+h);
 v.addColorStop(0,'#ebe0f933');v.addColorStop(.68,'#f5e9f100');v.addColorStop(1,'#1b1d3bb9');
 g.fillStyle=v;g.fillRect(x,y,w,h);
}
function slash(g,W,H,p,key,tier){
 const pair=key.split('+'),a=accents[pair[0]],b=accents[pair[1]];
 const hit=clamp(1-Math.abs(p-.35)/.16);
 if(!hit)return;
 g.save();g.globalCompositeOperation='screen';g.lineCap='round';
 g.shadowBlur=Math.min(30,H*.08);g.shadowColor=a;
 const centerX=W*.52,centerY=H*.57;
 const n=key.includes('elec')?4:key.includes('fire')?6:3;
 for(let i=0;i<n;i++){
   const ang=p*4+i*Math.PI*2/n,r=H*(.09+.2*hit);
   const x=centerX+Math.cos(ang)*r,y=centerY+Math.sin(ang)*r*.75;
   g.globalAlpha=(.12+.24*hit)*(1-.08*(i%3));
   g.strokeStyle=i%2?b:a;g.lineWidth=(i%2?4:7)*hit+1;
   g.beginPath();g.arc(x,y,8+H*.16*hit,ang+Math.PI*.16,ang+Math.PI*.86);
   g.stroke();
 }
 g.globalAlpha=.48*hit;g.fillStyle='#fffefa';
 g.beginPath();g.ellipse(centerX,centerY,H*.11*hit,H*.075*hit,0,0,Math.PI*2);g.fill();
 g.restore();
}
function draw(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 if(!ready)return true; // avoid flashing the rejected procedural kittens during load
 const key=regions[seq.elements]!==undefined?seq.elements:'grass+light';
 const p=clamp((seq.max-seq.t)/(seq.max||2.75)),tier=clamp(Number(seq.tier)||1,1,3);
 const opacity=smooth(p/.07)*(1-smooth((p-.89)/.11));
 if(opacity<=0)return true;
 const sw=Math.min(W*.97,H*.93*16/9),sh=sw*9/16,x=(W-sw)/2,y=(H-sh)/2;
 const actors=(seq.catUids||[]).map(uid=>lookup?.(uid));
 const actorA=actors[0],actorB=actors[1];
 const frame=regions[key],W2=sw*.5;
 const strength=smooth((p-.09)/.19)*(1-smooth((p-.75)/.18));
 const dual=clamp(strength);
 ctx.save();ctx.globalAlpha*=opacity;
 ctx.beginPath();ctx.roundRect(x,y,sw,sh,Math.max(11,Math.min(22,sw*.025)));ctx.clip();
 ctx.translate(x,y);
 // First establish a distinct painted landscape and then bring each REAL
 // pair's closest full illustrated cat into the middle of the cut-in.
 sourceCover(ctx,cellRect(frame),0,0,sw,sh,1.13-.09*smooth(p/.31),
    Math.sin(p*4.8)*.013,Math.cos(p*3)*.012,1);
 if(dual>.01&&actorA&&actorB){
  const sources=[actorSource(actorA),actorSource(actorB)];
  for(let i=0;i<2;i++){
    const src=cellRect(sources[i][0],sources[i][1]);
    ctx.save();
    ctx.beginPath();ctx.rect(i*W2,0,W2,sh);ctx.clip();
    // Move the CAMERA inside each crop, not the painted panels. Sliding the
    // panels exposed an ugly vertical stripe from the unrelated backdrop.
    const speed=1-smooth((p-.16)/.20);
    const zoom=1.09+.035*Math.sin(p*7+i*2);
    sourceCover(ctx,src,i*W2,0,W2,sh,zoom,
      (i===0?-.07:.07)*speed+(i===0?-.012:.012)*Math.sin(p*7),
      -.018*Math.sin(p*3+i),dual*.99);
    ctx.restore();
  }
  const blend=ctx.createLinearGradient(sw*.36,0,sw*.64,0);
  blend.addColorStop(0,'#fff8ee00');blend.addColorStop(.5,'#fff9eb7b');blend.addColorStop(1,'#fff8ee00');
  ctx.save();ctx.globalAlpha*=dual*.75;ctx.fillStyle=blend;ctx.fillRect(sw*.36,0,sw*.28,sh);ctx.restore();
 }
 // Elemental choreography is individually authored for all 21 combinations.
 // The photography-like painted cats are NOT replaced by canvas line drawings.
 if(dual>.10){
  ctx.save();ctx.globalAlpha*=Math.min(.31,dual*.27);
  window.CatBondDuoDirector?.accent?.(ctx,sw,sh,p,key,tier);
  window.CatBondDuoFinale?.draw?.(ctx,sw,sh,p,key,tier);
  ctx.restore();
 }
 slash(ctx,sw,sh,p,key,tier);
 paper(ctx,0,0,sw,sh);
 // Soft intro and final flare preserve the exquisite artwork (no full whiteout).
 const flare=Math.max(0,1-Math.abs(p-.31)/.065);
 if(flare>.01){ctx.save();ctx.globalAlpha=.055*flare;ctx.fillStyle='#fffef9';ctx.fillRect(0,0,sw,sh);ctx.restore()}
 // No English-only baked labels over the player's translated skill name.
 // One atlas panel contains a decorative old English title in the far top-right.
 // A soft semitransparent enamel banner reduces it behind localized UI.
 if(frame===0){
   const veil=ctx.createLinearGradient(sw*.58,0,sw,0);
   veil.addColorStop(0,'#e9e0f100');veil.addColorStop(.48,'#d9ccef99');veil.addColorStop(1,'#d5cdf0dc');
   ctx.fillStyle=veil;ctx.fillRect(sw*.57,0,sw*.43,sh*.155);
 }
 const en=window.MorrowwishI18n?.get?.()!=='zh';
 const title=seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||(en?'Duo Special':'双猫合击');
 ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.shadowColor='#2d244a';ctx.shadowBlur=8;ctx.fillStyle='#fffbed';
 const px=clamp(sw*.054,17,36);
 ctx.font='900 '+Math.round(px)+'px system-ui,sans-serif';
 ctx.fillText(title,sw*.5,sh*.82,sw*.91);
 ctx.font='750 '+Math.round(clamp(sw*.024,10,16))+'px system-ui,sans-serif';
 if(actorA&&actorB)ctx.fillText(label(actorA)+'  ×  '+label(actorB),sw*.5,sh*.915,sw*.88);
 ctx.restore();
 ctx.restore();
 return true;
}
window.CatBondPremiumCinematics={
 draw,actorSource,regionFor:key=>regions[key],get ready(){return ready},
 get failed(){return broken},paintedCatArchetypes:9,skillVariants:Object.keys(regions).length,
 get source(){return img.src}
};
})();
