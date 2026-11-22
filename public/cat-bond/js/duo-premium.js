/* Premium duo cinematic renderer: one uninterrupted watercolor painting
 * showing both complete cats in a shared setting. No clipped or pasted
 * silhouettes. 21 elemental choreographies over eight complete painted scenes.
 * Further breed-specific scenes can be added without reintroducing seams.
 */
(function(){
'use strict';
const img=new Image();
img.decoding='async';
// Reuse a dedicated high-resolution compositing layer. We feather its alpha
// into the playable arena instead of drawing a hard-edged rectangular card.
const cinematicLayer=document.createElement('canvas');
const cinematicCtx=cinematicLayer.getContext('2d',{alpha:true});
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
// Muted fantasy palettes are coordinated with Cat Bond's actual scenery:
// gentle lilac skies, sage gardens, warm peach sunlight and pale blue rivers.
// Never impose a solid purple battle card or a bright saturated rectangle.
const harmonies={
 storm:{sky:'#a998ce',mist:'#e7dbf4',ground:'#879bb8',light:'#e7d7ff'},
 moon:{sky:'#b6b0d5',mist:'#e9e5f7',ground:'#a4bdc4',light:'#fff1dc'},
 spring:{sky:'#a4c8b9',mist:'#eaf5e8',ground:'#a9cba6',light:'#ffeadb'},
 water:{sky:'#a5cbd5',mist:'#e2f4ee',ground:'#98bcb7',light:'#e4f7ff'},
 solar:{sky:'#e3bfa7',mist:'#f8ebd8',ground:'#c5c5ac',light:'#fff2d8'}
};
function harmony(key){
 const els=key.split('+');
 if(els.includes('elec')&&els.includes('dark'))return harmonies.storm;
 if(els.includes('water'))return harmonies.water;
 if(els.includes('grass'))return harmonies.spring;
 if(els.includes('fire'))return harmonies.solar;
 return harmonies.moon;
}
const accents={
 dark:'#d0a8ff',elec:'#c6d4ff',fire:'#ffcc9b',grass:'#c8f4c6',
 light:'#fff9d9',water:'#c5ecff'
};
// The source illustration's final four frames are deep neon purple.
// Regrade ONLY purple-heavy pixels ONCE when the asset loads, preserving
// the painted cats, facial details, black coats, paws, outfits and line work.
// This changes the actual painted BACKGROUND, not merely an external overlay.
let pastelAtlas=null,retouchedPixels=0;
const panelTones=[
 [211,226,235], // moon: pale blue-white / silver mist
 [210,237,222], // blossoms: soft garden mint
 [207,233,245], // water: clear cloud blue
 [248,227,211], // sunlight: peach cream
 [215,223,230], // shadow: pearl silver, never deep violet
 [205,233,236], // storm: pale rainy cyan
 [246,224,205], // embers: pastel peach
 [221,235,220]  // moonlit wards: sage-white
];
function preparePastelAtlas(){
 const w=img.naturalWidth,h=img.naturalHeight;
 const off=document.createElement('canvas');off.width=w;off.height=h;
 const cx=off.getContext('2d',{willReadFrequently:true});
 if(!cx)return false;
 cx.drawImage(img,0,0);
 const frame=cx.getImageData(0,0,w,h),rgba=frame.data;
 const cellW=w/2,cellH=h/4;
 for(let y=0;y<h;y++){
   const row=Math.min(3,Math.floor(y/cellH));
   // Top floral / water / peach scenes are intentionally almost untouched.
   if(row===1)continue;
   for(let x=0;x<w;x++){
     const panel=row*2+Math.min(1,Math.floor(x/cellW));
     if(panel===1||panel===2||panel===3)continue;
     const i=(y*w+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
     const luminance=r*.299+g*.587+b*.114,avg=(r+g+b)/3;
     const purple=clamp((Math.min(r,b)-g-4)/52)*
       clamp((b-g)/43);
     // Areas below brightness 75 are often black coats, eye details and
     // whisker outlines. Protect them from being washed to white.
     const darkProtect=Math.max(r,g,b)<75?.37:1;
     const alpha=panel>=4?Math.min(.92,.22+purple*.72)*darkProtect:
       Math.min(.65,purple*.65)*darkProtect;
     if(alpha<.015)continue;
     const tone=panelTones[panel];
     for(let ch=0;ch<3;ch++){
       const desired=panel>=4?
         clamp((tone[ch]+(luminance-105)*.59+
            ([r,g,b][ch]-avg)*.16)/255,65/255,1)*255:
         clamp((tone[ch]+(luminance-145)*.40)/255,90/255,1)*255;
       rgba[i+ch]=Math.round([r,g,b][ch]*(1-alpha)+desired*alpha);
     }
     retouchedPixels++;
   }
 }
 cx.putImageData(frame,0,0);
 pastelAtlas=off;
 return true;
}
img.onload=()=>{
 ready=img.naturalWidth>=512&&img.naturalHeight>=512;broken=!ready;
 if(ready){
  try{preparePastelAtlas();}
  catch(err){pastelAtlas=null;console.warn('[Cat Bond] pastel art fallback',err)}
 }
 window.dispatchEvent(new Event('cat-bond-premium-art-ready'));
};
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
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(pastelAtlas||img,sx,sy,sw,sh,x,y,w,h);ctx.restore();
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
 const frame=regions[key];
 const strength=smooth((p-.09)/.19)*(1-smooth((p-.75)/.18));
 const dual=clamp(strength);
 // Render the complete illustration, signatures and captions together into
 // a scratch canvas so all edges can fade naturally into the battle behind it.
 const battlefield=ctx;
 const dpr=Math.min(2,window.devicePixelRatio||1);
 const pw=Math.max(1,Math.round(sw*dpr)),ph=Math.max(1,Math.round(sh*dpr));
 if(cinematicLayer.width!==pw||cinematicLayer.height!==ph){
   cinematicLayer.width=pw;cinematicLayer.height=ph;
 }
 ctx=cinematicCtx;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,sw,sh);
 ctx.save();ctx.globalAlpha=opacity;
 // One complete, illustrated two-cat tableau per attack, NEVER two sliced
 // paintings or a pair of cropped heads glued across a visible vertical seam.
 // Pan and zoom the entire coherent painting together.
 const driftX=Math.sin(p*4.1+frame*.7)*.012;
 const driftY=Math.cos(p*3.3+frame*.4)*.008;
 const zoom=1.04+.035*smooth(p/.30)+.009*Math.sin(p*4);
 sourceCover(ctx,cellRect(frame),0,0,sw,sh,zoom,driftX,driftY,1);
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
 ctx.fillText(title,sw*.5,sh*.76,sw*.91);
 ctx.font='750 '+Math.round(clamp(sw*.024,10,16))+'px system-ui,sans-serif';
 if(actorA&&actorB)ctx.fillText(label(actorA)+'  ×  '+label(actorB),sw*.5,sh*.855,sw*.88);
 ctx.restore();
 ctx.restore();
 // Four overlapping soft alpha masks: zero visible hard edges, even in
 // portrait / landscape game modes. No rectangular stroke or clip border.
 ctx.save();
 ctx.globalCompositeOperation='destination-in';
 const fx=Math.max(14,sw*.085),fy=Math.max(12,sh*.13);
 function fade(x0,y0,x1,y1){
   const m=ctx.createLinearGradient(x0,y0,x1,y1);
   m.addColorStop(0,'rgba(255,255,255,0)');
   m.addColorStop(1,'rgba(255,255,255,1)');
   ctx.fillStyle=m;ctx.fillRect(0,0,sw,sh);
 }
 fade(0,0,fx,0);
 fade(sw,0,sw-fx,0);
 fade(0,0,0,fy);
 fade(0,sh,0,sh-fy);
 ctx.restore();
 // A quiet seamless backdrop in Cat Bond's pastoral palette, tinted by
 // the region's existing battle theme instead of an unrelated purple card.
 const tone=harmony(key);
 battlefield.save();
 const surrounding=battlefield.createLinearGradient(0,H*.15,W,H*.85);
 surrounding.addColorStop(0,tone.sky+'38');
 surrounding.addColorStop(.48,tone.mist+'20');
 surrounding.addColorStop(1,tone.ground+'22');
 battlefield.globalAlpha=opacity*.55;
 battlefield.fillStyle=surrounding;
 battlefield.fillRect(0,0,W,H);
 // One subtle colored halo belongs to the entire two-cat composition.
 // Its outer edge blends to the same green/blue/purple as the actual arena.
 const aura=battlefield.createRadialGradient(W*.5,H*.47,sw*.09,W*.5,H*.47,sw*.7);
 aura.addColorStop(0,tone.light+'4b');
 aura.addColorStop(.48,tone.mist+'26');
 aura.addColorStop(1,tone.ground+'00');
 battlefield.globalAlpha=opacity*.55;
 battlefield.fillStyle=aura;
 battlefield.fillRect(0,0,W,H);
 battlefield.globalAlpha=1;
 battlefield.drawImage(cinematicLayer,x,y,sw,sh);
 battlefield.restore();
 return true;
}
window.CatBondPremiumCinematics={
 draw,actorSource,regionFor:key=>regions[key],get ready(){return ready},
 get failed(){return broken},wholeSceneCount:8,skillVariants:Object.keys(regions).length,
 get pastelAdjusted(){return !!pastelAtlas&&retouchedPixels>0},
 get pastelPixelCount(){return retouchedPixels},
 get source(){return img.src}
};
})();
