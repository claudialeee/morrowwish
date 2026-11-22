/* Premium duo cinematic renderer: one uninterrupted watercolor painting
 * showing both complete cats in a shared setting. No clipped or pasted
 * silhouettes. 21 elemental choreographies over 63 cat-free watercolor
 * SCENES with the player's two real breed portraits as separate characters.
 * Never overlay fixed illustrated cats or use destructive fur recoloring.
 */
(function(){
'use strict';
const img=new Image();
img.decoding='async';
// Reuse a dedicated high-resolution compositing layer. We feather its alpha
// into the playable arena instead of drawing a hard-edged rectangular card.
const cinematicLayer=document.createElement('canvas');
const cinematicCtx=cinematicLayer.getContext('2d',{alpha:true});
let ready=false,broken=false,originalReady=false;
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
// All 21 skill pairs now resolve to their OWN painted storyboard row,
// not 8 recycled two-cat paintings. The four rejected old frames are gone.
const regions={
 'dark+dark':0,
 'dark+elec':1,
 'dark+fire':2,
 'dark+grass':3,
 'dark+light':4,
 'dark+water':5,
 'elec+elec':6,
 'elec+fire':7,
 'elec+grass':8,
 'elec+light':9,
 'elec+water':10,
 'fire+fire':11,
 'fire+grass':12,
 'fire+light':13,
 'fire+water':14,
 'grass+grass':15,
 'grass+light':16,
 'grass+water':17,
 'light+light':18,
 'light+water':19,
 'water+water':20
};
// Per-PAIR, not per-element: 21 independent watercolor scene color scripts.
// All inks use the approved muted, warm storybook aesthetic; no solid blue
// or saturated violet stage is shared between unrelated pairings.
const chromaticThemes={
 'dark+dark':['#eadfd5','#fff4e8','#d3d7c8','#d9b9bf'],
 'dark+elec':['#e8ecd9','#fff4dc','#cfdec9','#e4d3a2'],
 'dark+fire':['#f5e2ce','#fff1df','#e8d4c5','#ecbaa1'],
 'dark+grass':['#e9ecdd','#f7f0e4','#bed6bf','#dbc3b5'],
 'dark+light':['#e9e8e9','#fff9eb','#d9ded7','#efe1b8'],
 'dark+water':['#e4efe6','#f9f5e7','#c4dcd8','#c9d6cb'],
 'elec+elec':['#f4eddb','#fff5dc','#e7dfc5','#ebd298'],
 'elec+fire':['#f9e6d4','#fff1de','#ebd8c0','#f3bb9b'],
 'elec+grass':['#f0efd8','#fdf6dc','#cedfbc','#ead8a6'],
 'elec+light':['#f9eedb','#fffae8','#e6e2cd','#e9d9b5'],
 'elec+water':['#ebeee3','#faf8df','#c1ded2','#d4ddbf'],
 'fire+fire':['#f9e1ce','#fff1d9','#edceba','#f2b090'],
 'fire+grass':['#f9e8dd','#fff5e7','#cde3cb','#e4c0b8'],
 'fire+light':['#ffebd5','#fff9e8','#ecdcc8','#f5c691'],
 'fire+water':['#f5e9dc','#fff4e7','#cbdfd7','#e3c6b4'],
 'grass+grass':['#edf0dd','#fff9e8','#c0dbb4','#c7d4a2'],
 'grass+light':['#f8efde','#fff9e7','#d5e6cd','#e7dcb8'],
 'grass+water':['#eaf0e2','#fdf9e9','#bedcc9','#cedfbb'],
 'light+light':['#f9f1df','#fffdf2','#e8dfc8','#e9d7ba'],
 'light+water':['#f0eee5','#fcf9e9','#cde1d9','#dad4c4'],
 'water+water':['#e8f0e9','#f9faf1','#bfdcd4','#c8dfd6']
};

const tintRGB=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function paletteFor(key){return chromaticThemes[key]||chromaticThemes['grass+light']}
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
 const v=paletteFor(key);
 return {sky:v[0],mist:v[1],ground:v[2],light:v[3]};
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
const gradeCache=new Map();
// The new atlas arrives already painted in warm, varied storybook colors.
// Do NOT gray-wash the new cats or layer earlier rejected paintings underneath.
function preparePastelAtlas(){pastelAtlas=null;retouchedPixels=0;return true;}
function syncArtwork(){
 const actors=window.CatBondDuoBreedActors;
 ready=originalReady&&!!actors?.ready;
 if(actors?.failed)broken=true;
 if(ready){
  gradeCache.clear();
  window.dispatchEvent(new Event('cat-bond-premium-art-ready'));
 }else if(broken){
  window.dispatchEvent(new Event('cat-bond-premium-art-error'));
 }
}
window.addEventListener('cat-bond-breed-art-ready',syncArtwork);
window.addEventListener('cat-bond-breed-art-error',syncArtwork);
img.onload=()=>{
 originalReady=img.naturalWidth===3584&&img.naturalHeight===2592;
 broken=!originalReady;syncArtwork();
};
img.onerror=()=>{broken=true;syncArtwork()};
img.src=(window.CatBondDuoAssetBase||'assets/')+'duo-storyboard-21x3-v3.webp?v=original-63-poses-20261122';

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
const FRAME_W=512,FRAME_H=288;
function cellRect(panel,tier=1){
 const lv=Math.max(1,Math.min(3,Math.round(Number(tier)||1)));
 return {x:(panel%7)*FRAME_W,
         y:(Math.floor(panel/7)*3+(lv-1))*FRAME_H,
         w:FRAME_W,h:FRAME_H};
}
// Separate the 63 premium storybook SCENES from the two actor portraits.
// Every selected breed is an actual painterly transparent character in front
// of a cat-free scenic frame. Old baked-in cats can NEVER appear behind them.
function gradedScene(key,tier=1,actorA=null,actorB=null){
 const lv=Math.max(1,Math.min(3,Math.round(Number(tier)||1)));
 const cacheKey=key+'|'+lv;
 if(gradeCache.has(cacheKey))return gradeCache.get(cacheKey);
 const panel=regions[key];if(panel===undefined||!ready)return null;
 const layer=document.createElement('canvas');
 layer.width=FRAME_W;layer.height=FRAME_H;
 const g=layer.getContext('2d');if(!g)return null;
 const rect=cellRect(panel,lv);
 const breedArt=window.CatBondDuoBreedActors;
 if(!breedArt?.paintScene(g,key,lv,Object.keys(regions)))return null;
 gradeCache.set(cacheKey,layer);
 return layer;
}
function sourceCover(ctx,source,x,y,w,h,zoom=1,offsetX=0,offsetY=0,alpha=1,key=null,tier=1,actorA=null,actorB=null){
 const srcAspect=source.w/source.h,dstAspect=w/h;
 let sx=source.x,sy=source.y,sw=source.w,sh=source.h;
 if(srcAspect>dstAspect){sw=sh*dstAspect;sx+=(source.w-sw)/2}
 else{sh=sw/dstAspect;sy+=(source.h-sh)/2}
 sw/=zoom;sh/=zoom;
 sx+=Math.max(0,(source.w-sw)/2)+offsetX*sw;
 sy+=Math.max(0,(source.h-sh)/2)+offsetY*sh;
 sx=clamp(sx,source.x,source.x+source.w-sw);
 sy=clamp(sy,source.y,source.y+source.h-sh);
 const tex=key&&ready?gradedScene(key,tier,actorA,actorB):null;
 if(tex){sx-=source.x;sy-=source.y;}
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(tex||pastelAtlas||img,sx,sy,sw,sh,x,y,w,h);ctx.restore();
}
function paper(g,x,y,w,h){
 const v=g.createLinearGradient(0,y,0,y+h);
 v.addColorStop(0,'#f8f8ed18');v.addColorStop(.62,'#f7f2e100');v.addColorStop(1,'#6c77704f');
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

// Separate cinematic beats, not merely different particle intensities.
// All graphics hug the edges to keep the original complete painted cats
// and their paws/eyes readable. Each tier has a different hit timeline.
function bondTierChoreography(g,W,H,p,key,tier){
 const colors=paletteFor(key),w=Math.max(2,H*.012);
 const impact=(at,span=.115)=>Math.max(0,1-Math.abs(p-at)/span);
 g.save();g.lineCap='round';g.lineJoin='round';
 if(tier===1){
   // Lv 20: two-cat simultaneous approach -> one warm central paw impact.
   const v=impact(.31,.135);
   g.globalAlpha=.60*v;g.strokeStyle=colors[3];g.lineWidth=w*1.6;
   g.beginPath();g.arc(W*.50,H*.53,H*(.09+.08*(1-v)),-.3,Math.PI*1.2);g.stroke();
 }else if(tier===2){
   // Lv 60: A travels the upper crossing lane, B counters below.
   // TWO independent flashes at .20s and .52s.
   for(const [n,at] of [[0,.20],[1,.52]]){
     const v=impact(at,.12);
     g.globalAlpha=.64*v;g.strokeStyle=n?colors[3]:colors[2];g.lineWidth=w*(n?2.2:1.5);
     g.beginPath();g.moveTo(n?W*.88:W*.10,n?H*.76:H*.30);
     g.bezierCurveTo(W*.35,n?H*.12:H*.83,W*.62,n?H*.75:H*.14,
       n?W*.12:W*.88,n?H*.24:H*.69);g.stroke();
     g.globalAlpha=.60*v;g.fillStyle=colors[1];
     g.beginPath();g.arc(n?W*.42:W*.60,n?H*.61:H*.38,H*.055*v,0,Math.PI*2);g.fill();
   }
 }else{
   // Lv 90: guard shield -> aerial counter -> converging finisher.
   const guard=impact(.14,.16),vault=impact(.42,.16),fin=impact(.73,.18);
   g.globalAlpha=.57*guard;g.strokeStyle=colors[3];g.lineWidth=w*1.6;
   g.beginPath();g.ellipse(W*.30,H*.54,W*.16,H*.29,-.18,Math.PI*.80,Math.PI*2.25);g.stroke();
   g.globalAlpha=.55*vault;g.strokeStyle=colors[2];g.lineWidth=w*1.4;
   g.beginPath();g.moveTo(W*.22,H*.68);
   g.bezierCurveTo(W*.32,H*.04,W*.64,H*.13,W*.78,H*.66);g.stroke();
   g.globalAlpha=.70*fin;g.strokeStyle=colors[1];g.lineWidth=w*2.2;
   for(let n=0;n<12;n++){
     const a=n*Math.PI/6+p*.8;
     g.beginPath();
     g.moveTo(W*.51+Math.cos(a)*H*.14,H*.49+Math.sin(a)*H*.11);
     g.lineTo(W*.51+Math.cos(a)*H*.31,H*.49+Math.sin(a)*H*.27);
     g.stroke();
   }
   g.strokeStyle=colors[3];g.lineWidth=w*1.5;
   g.beginPath();g.ellipse(W*.51,H*.49,W*.28*fin,H*.34*fin,0,0,Math.PI*2);g.stroke();
 }
 g.restore();
}
function draw(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 if(!ready)return true; // avoid flashing the rejected procedural kittens during load
 const key=regions[seq.elements]!==undefined?seq.elements:'grass+light';
 const thumbnail=seq.thumbnail===true; // Gallery art must never have vines or flashes over faces.
 const p=clamp((seq.max-seq.t)/(seq.max||2.75)),tier=clamp(Number(seq.tier)||1,1,3);
 const opacity=smooth(p/.028)*(1-smooth((p-.965)/.035));
 if(opacity<=0)return true;
 const sw=Math.min(W,H*16/9),sh=sw*9/16,x=(W-sw)/2,y=(H-sh)/2;
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
 // Each 21x3 background is clean of fixed cat bodies; two TRUE species
 // watercolor portraits travel together with the same cinematic camera.
 // There is no fur polygon masking and no ghost of the old painted pair.
 const cam=thumbnail?{dx:0,dy:0,zoom:1.025,angle:0}:
   (window.CatBondDuoDirector?.camera?.(key,p,sw,sh,tier)||
    {dx:0,dy:0,zoom:1.12,angle:0,kind:'highfive'});
 ctx.save();
 ctx.translate(sw*.5+cam.dx,sh*.5+cam.dy);
 ctx.rotate(cam.angle);
 ctx.translate(-sw*.5,-sh*.5);
 sourceCover(ctx,cellRect(frame,tier),0,0,sw,sh,Math.min(cam.zoom,1.16),0,0,1,key,tier,actorA,actorB);
 const painted=window.CatBondDuoBreedActors?.draw?.(
   ctx,sw,sh,[actorA,actorB],key,p,tier);
 // An absent player breed may not be replaced by a generic grey cat.
 if(!painted){ctx.restore();ctx.restore();return true;}
 ctx.restore();
 // Elemental choreography is individually authored for all 21 combinations.
 // The photography-like painted cats are NOT replaced by canvas line drawings.
 if(!thumbnail&&dual>.09){
  // Previously both authored VFX layers were almost invisible: .27 × .31
  // opacity on top of signature opacity. Let the player actually distinguish
  // different attacks (starfall, jump, lightning, tide, vines, fireworks...)
  // while keeping the watercolor painting beneath them readable.
  ctx.save();ctx.globalAlpha*=Math.min(.24,dual*.22);
  window.CatBondDuoDirector?.footwork?.(ctx,sw,sh,p,key,tier);
  const fxTime=tier===1?p:tier===2?(p<.36?p+.09:p-.23):
     (p<.29?p+.10:p<.55?p-.11:p-.44);
  window.CatBondDuoDirector?.accent?.(ctx,sw,sh,fxTime,key,tier);
  window.CatBondDuoFinale?.draw?.(ctx,sw,sh,fxTime,key,tier);
  ctx.restore();
 }
 if(!thumbnail){ctx.save();ctx.globalAlpha*=.22;bondTierChoreography(ctx,sw,sh,p,key,tier);ctx.restore();}
 // The old generic claw stamp made all 21 skills look identical; the
 // individually drawn finale and key-specific palette now carry the impact.
 // Do not wash out the artist's real watercolor with a grey film.
 // Soft intro and final flare preserve the exquisite artwork (no full whiteout).
 const flare=Math.max(0,1-Math.abs(p-.31)/.065);
 if(!thumbnail&&flare>.01){ctx.save();ctx.globalAlpha=.055*flare;ctx.fillStyle='#fffef9';ctx.fillRect(0,0,sw,sh);ctx.restore()}
 // No English-only baked labels over the player's translated skill name.
 // One atlas panel contains a decorative old English title in the far top-right.
 // A soft semitransparent enamel banner reduces it behind localized UI.
 if(frame===0){
   const veil=ctx.createLinearGradient(sw*.58,0,sw,0);
   veil.addColorStop(0,'#e9e0f100');veil.addColorStop(.48,'#d9ccef99');veil.addColorStop(1,'#d5cdf0dc');
   ctx.fillStyle=veil;ctx.fillRect(sw*.57,0,sw*.43,sh*.155);
 }
 if(!seq.hideCaptions){
 const en=window.MorrowwishI18n?.get?.()!=='zh';
 const title=seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||(en?'Duo Special':'双猫合击');
 ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.shadowColor='#2d244a';ctx.shadowBlur=8;ctx.fillStyle='#fffbed';
 const px=clamp(sw*.054,17,36);
 ctx.font='900 '+Math.round(px)+'px system-ui,sans-serif';
 ctx.fillText(title,sw*.5,sh*.925,sw*.92);
 ctx.font='750 '+Math.round(clamp(sw*.024,10,16))+'px system-ui,sans-serif';
 // Breed information is shown in the separate roster UI; never overlay
 // a false claim of exact painted breed identity over fixed artist subjects.
 if(actorA&&actorB)ctx.fillText(label(actorA)+'  ×  '+label(actorB),sw*.5,sh*.984,sw*.86);
 ctx.restore();
 }
 ctx.restore();
 // Keep the full painted scene opaque and intact. The old four-sided
 // destination-in fade cut away fur, paws and scenery, making cats translucent.
 // A quiet seamless backdrop in Cat Bond's pastoral palette, tinted by
 // the region's existing battle theme instead of an unrelated purple card.
 const tone=harmony(key);
 battlefield.save();
 // No washed-out halo or colored rectangle behind the full bleed painting.
 battlefield.globalAlpha=1;
 battlefield.drawImage(cinematicLayer,x,y,sw,sh);
 battlefield.restore();
 return true;
}
window.CatBondPremiumCinematics={
 draw,actorSource,regionFor:key=>regions[key],get ready(){return ready},
 get breedMatchCount(){return window.CatBondDuoBreedActors?.ready?32:0},
 get breedProfileCount(){return window.CatBondDuoBreedActors?.breedCount||0},
 get liveBreedArtworkEnabled(){return !!window.CatBondDuoBreedActors?.ready},
 get activePaintCacheEntries(){return gradeCache.size},
 get realBreedOverpaintEnabled(){return false},
 coatOf,
 paletteFor,get scenePaletteCount(){return Object.keys(chromaticThemes).length},
 get gradedSceneCount(){return gradeCache.size},tierVariants:3,
 get failed(){return broken},wholeSceneCount:21,paintedFrameCount:63,skillVariants:Object.keys(regions).length,
 get pastelAdjusted(){return ready},
 get pastelPixelCount(){return retouchedPixels},
 get source(){return window.CatBondDuoBreedActors?.sceneSource||img.src},
 get characterSource(){return window.CatBondDuoBreedActors?.catSource||''}
};
})();
