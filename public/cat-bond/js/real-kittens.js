/* Cat Bond: source-of-truth visual renderer for the original illustrated kittens.
   Intentionally replaces only visuals. All game species IDs, movement, input,
   battles, saves, progression and collision systems remain untouched. */
(()=>{
  'use strict';
  if (!window.CatArt || !window.CAT_BOND_KITTEN_ATLAS) return;
  const drawing=window.CatArt;
  const source=new Image();
  let loaded=false;
  // New illustrated atlas keeps the original six breeds but supplies over
  // four times as many source pixels per character.
  const frame=window.CAT_BOND_KITTEN_FRAME||{w:60,h:90};
  const w=frame.w,h=frame.h;
  const indices={
    // Six original kitten illustrations, in the same order as the reference.
    tangyuan:0,doudou:3,xiaohui:3,moqiu:5,nainai:4,nietu:4,niuniu:2,
    sanhua:1,lixiao:2,lanbao:3,dundun:3,yunduo:4,zherdd:4,
    qisi:0,duanduan:0,jinjc:0,xianluo:4,yinghua:4,senlin:0,
    youling:5,nuowei:0,baomao:0,jinwu:0,yuelian:4,xingchen:5
  };
  const paletteIndex={
    orange:0,brownTabby:0,silver:3,tux:2,white:4,black:5,cream:4,
    calico:1,blue:3,ragdoll:4,siamese:4,maine:0,flame:0,cloud:4,
    mystic:5,goldShaded:0,apricot:0,cheese:0,norwegian:0,bengal:0
  };
  const fallbackDraw=drawing.drawCat;
  function indexOf(options){
    const sp=options.species||{};
    if(sp.id&&Object.prototype.hasOwnProperty.call(indices,sp.id)) return indices[sp.id];
    return paletteIndex[options.palette||sp.palette]??0;
  }
  function render(ctx,x,y,options){
    const o=options||{},t=o.t||0,pose=o.pose||'idle',mood=o.mood||'neutral';
    // An image draws as soon as its first frame has decoded. On older browsers
    // without AVIF decoding, preserve playability with the legacy renderer.
    if(!loaded){fallbackDraw(ctx,x,y,o);return;}
    const gr=o.growth||null;
    const scale=(o.scale||1)*(gr?.scale||1);
    const face=o.face===-1?-1:1;
    // Ease the sprite with a planted-feet pivot. A side-to-side nudge, gentle
    // stretch/compression and stride-dependent lean mimic shifting weight,
    // rather than spinning the entire illustration rigidly around its center.
    const movement=pose==='walk' ? Math.max(.12,Math.min(1,o.motion??.8)) : 0;
    const phase=o.stride===undefined?t*7:o.stride;
    const footfall=Math.sin(phase),lift=Math.max(0,Math.sin(phase*2));
    const hop=pose==='play'?Math.pow(Math.abs(Math.sin(t*5.2)),1.5)*9:0;
    const breathing=Math.sin(t*1.65)*.008;
    const sway=pose==='walk'?footfall*.019*movement:
      pose==='sleep'?Math.sin(t*1.5)*.008:
      pose==='belly'?Math.sin(t*4)*.09:Math.sin(t*1.6)*.012;
    const bob=movement*(.7+2.1*lift)+hop+(pose==='idle'?Math.sin(t*2)*.32:0);
    const stretchX=1+movement*(.025*Math.cos(phase*2)) - (pose==='play'?hop*.0014:0);
    const stretchY=1+breathing-movement*(.032*Math.cos(phase*2)) +(pose==='play'?hop*.002:0);
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(face*scale,scale);
    if(gr?.aura){
      const aura=ctx.createRadialGradient(0,0,3,0,0,55);
      aura.addColorStop(0,'rgba(255,255,255,0)');
      aura.addColorStop(.62,gr.aura+'30');
      aura.addColorStop(1,gr.aura+'00');
      ctx.fillStyle=aura;ctx.beginPath();ctx.ellipse(0,0,55,45,0,0,Math.PI*2);ctx.fill();
    }
    // Shadow stays on the ground even while the kitten is hopping.
    ctx.fillStyle='rgba(73,63,51,.12)';
    ctx.beginPath();ctx.ellipse(0,33,27-hop*.2,4.3-hop*.13,0,0,Math.PI*2);ctx.fill();
    ctx.translate(footfall*movement*.95,-bob);
    ctx.translate(0,33);
    ctx.rotate(sway);
    ctx.scale(stretchX,stretchY);
    ctx.translate(0,-33);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(source,indexOf(o)*w,0,w,h,-30,-55,60,90);
    if(mood==='love'){
      ctx.fillStyle='#ef8fa8';ctx.font='13px system-ui';
      ctx.fillText('♥',22,-38-Math.sin(t*3)*2);
    }
    if(gr?.gem){
      ctx.fillStyle=gr.gemColor||'#e8bb68';ctx.font='12px system-ui';
      ctx.fillText('✦',20,-47);
    }
    if(gr?.sparkle){
      ctx.fillStyle=gr.gemColor||'#e8bb68';ctx.font='10px system-ui';
      ctx.fillText('✧',-26,-36);
    }
    ctx.restore();
  }
  function thumbnail(canvas,species){
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // The same real illustration is used in every thumbnail and card.
    const scale=Math.min(canvas.width/63,canvas.height/90)*.88;
    render(ctx,canvas.width/2,canvas.height*.57,{
      species,scale,pose:'sit',mood:'neutral',t:0.6,motion:0
    });
  }
  drawing.drawCat=render;
  drawing.renderCatThumb=thumbnail;
  source.onload=()=>{
    loaded=source.naturalWidth===w*6&&source.naturalHeight===h;
    if(!loaded)return;
    // Intro uses a static canvas; repaint once the atlas is decoded.
    if(typeof window.paintIntroCatGallery==='function'){
      try{window.paintIntroCatGallery();}catch(_){}
    }
    window.dispatchEvent(new Event('cat-bond-illustrations-ready'));
  };
  source.onerror=()=>{
    console.warn('Cat Bond kitten art failed to load; retaining playable fallback.');
  };
  source.src=window.CAT_BOND_KITTEN_ATLAS;
})();
