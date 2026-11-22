/* Cat Bond · watercolor-safe growth forms for all 32 breeds.
 *
 * IMPORTANT: the previous "adult" implementation silently replaced the real
 * painted kitten with a synthesized SVG. It elongated the body, changed eyes,
 * and broke the look in the Moonshadow Ruins. Never replace a painted breed
 * with a new vector cat just because its stage changes.
 *
 * Maturity is expressed through the conservative uniform Growth.visual scale
 * (adult 1.06x, awakened 1.10x), paw-grounding, gem and awakening aura.
 * Every mature cat retains EXACTLY the same original watercolor breed source,
 * colors, expression and natural body proportions as its kitten form.
 */
(function installWatercolorGrowthForms(){
  'use strict';
  if(!window.CatArt)return;
  const originalDraw=window.CatArt.drawCat;
  const originalThumb=window.CatArt.renderCatThumb;
  const ids=(window.GameData?.SPECIES||[]).map(s=>s.id);
  const activeThumbs=new Map();

  // Keep the canonical original-watercolor renderer in charge of world,
  // exploration, yard, battle, celebration and all other cat appearances.
  // It already applies a UNIFORM Growth.visual scale and draws awakening art.
  function drawAdult(ctx,x,y,opts={}){
    return originalDraw(ctx,x,y,opts);
  }

  function drawThumb(canvas,species,cat){
    if(!canvas||!species)return;
    if(!cat||(Number(cat.stage)||0)<1){
      activeThumbs.delete(canvas);
      return originalThumb(canvas,species);
    }
    activeThumbs.set(canvas,[species,cat]);
    const ctx=canvas.getContext('2d');
    if(!ctx)return;
    const rect=canvas.getBoundingClientRect?.();
    const w=Number(canvas.dataset?.thumbW)||(rect?.width>8?rect.width:canvas.width);
    const h=Number(canvas.dataset?.thumbH)||(rect?.height>8?rect.height:canvas.height);
    const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    const pw=Math.max(1,Math.round(w*ratio)),ph=Math.max(1,Math.round(h*ratio));
    if(canvas.width!==pw)canvas.width=pw;
    if(canvas.height!==ph)canvas.height=ph;
    if(canvas.dataset){
      canvas.dataset.thumbW=String(w);
      canvas.dataset.thumbH=String(h);
    }
    ctx.setTransform?.(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,w,h);
    // The same base anchor/scale as the kitten thumbnail; age scale is
    // applied by the original renderer exactly once. Feet remain planted.
    const scale=Math.min(w/72,h/104)*.86;
    const growth=window.Growth?.visual(cat)||null;
    originalDraw(ctx,w/2,h*.60,{
      species,scale,face:1,t:.6,pose:'sit',mood:'happy',motion:0,growth
    });
  }

  // AVIF/WebP atlas decoding can complete after portraits were first drawn.
  // The canonical art-ready event repaints all mature thumbnails from the
  // CURRENT watercolor original (never a stale vector or blank fallback).
  function repaint(){
    for(const [canvas,[species,cat]] of activeThumbs){
      if(canvas.isConnected===false){activeThumbs.delete(canvas);continue;}
      drawThumb(canvas,species,cat);
    }
    window.dispatchEvent?.(new Event('cat-bond-adult-art-ready'));
  }
  window.addEventListener('cat-bond-illustrations-ready',repaint);

  // Do not replace CatArt.drawCat. Its illustrated renderer is authoritative.
  // Only thumbnails need a stage-aware wrapper to compare growth forms.
  window.CatArt.renderCatThumb=drawThumb;
  window.CatBondAdultArt={
    breedCount:ids.length,
    speciesIds:ids,
    sourceKind:'original-watercolor-atlas',
    preservesOriginalProportions:true,
    matureArtIsSeparateImage:false,
    get loadedCount(){
      return window.CatBondArtworkStatus?.breedsLoaded?ids.length:0;
    },
    get failedCount(){
      // Missing art should be reported by the source decoder, not claimed
      // as a successfully decoded synthetic adult sprite.
      return 0;
    },
    drawAdult,
    preview(id){return window.GameData?.speciesById?.(id)||null;}
  };
})();