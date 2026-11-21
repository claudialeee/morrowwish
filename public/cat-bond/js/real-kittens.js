/* Cat Bond: source-of-truth visual renderer for the original illustrated kittens.
   Intentionally replaces only visuals. All game species IDs, movement, input,
   battles, saves, progression and collision systems remain untouched. */
(()=>{
  'use strict';
  if (!window.CatArt || !window.CAT_BOND_KITTEN_ATLAS) return;
  const drawing=window.CatArt;
  const source=new Image();
  const breedSheet=new Image();
  let loaded=false,breedLoaded=false;
  // One illustrated frame per species, matching the order in data.js.
  const BREED_ORDER=[
    'tangyuan','doudou','xiaohui','moqiu','nainai',
    'nietu','niuniu','sanhua','lixiao','lanbao',
    'dundun','yunduo','zherdd','qisi','duanduan',
    'jinjc','xianluo','yinghua','senlin','youling',
    'nuowei','baomao','jinwu','yuelian','xingchen'
  ];
  const breedFrameSize=window.CAT_BOND_BREED_FRAME||{w:200,h:300,cols:5,rows:5};
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

  // One deliberate look per catalogue species. The original watercolor kitten
  // painting is always the underlying artwork; no vector/model replacement.
  // [original illustrated kitten, target fur color, blend strength, coat traits]
  const BREED_LOOKS={
    tangyuan:[0,null,0,'orange-tabby'],
    doudou:[3,'#ad8a69',.65,'brown-tabby'],
    xiaohui:[3,'#d1d5dc',.27,'silver-tabby'],
    moqiu:[5,null,0,'black'],
    nainai:[4,'#f6f2ec',.82,'white'],
    nietu:[0,'#ecd5b9',.78,'cream'],
    niuniu:[2,null,0,'tuxedo'],
    sanhua:[1,null,0,'calico'],
    lixiao:[2,'#3e3544',.23,'formal-tuxedo'],
    lanbao:[5,'#8c9bab',.72,'british-blue'],
    dundun:[3,'#d6d1c5',.48,'silver-shaded'],
    yunduo:[4,null,0,'ragdoll'],
    zherdd:[4,'#e9d2b3',.62,'folded-cream'],
    qisi:[1,'#e9a85e',.65,'orange-white'],
    duanduan:[0,'#eebf86',.42,'short-legged'],
    jinjc:[3,'#e1c28e',.74,'golden-shaded'],
    xianluo:[4,'#dec8b0',.30,'seal-point'],
    yinghua:[4,'#fbe4ed',.55,'cherry-pink'],
    senlin:[4,'#b29374',.62,'maine-coon'],
    youling:[5,'#8b78ac',.53,'spirit-purple'],
    nuowei:[4,'#bdac97',.47,'norwegian-forest'],
    baomao:[3,'#dbad65',.73,'bengal-rosettes'],
    jinwu:[0,'#efa34d',.42,'flame-tabby'],
    yuelian:[4,'#e5eafd',.61,'moon-point'],
    xingchen:[5,'#8476b1',.61,'starry-black']
  };
  const breedCache=Object.create(null);
  const animatedRigCache=Object.create(null);
  let gaitLayersBuilt=0;
  // Paint an entire illustrated cat into each complete gait frame. This
  // replaces the earlier cut-and-move paw layers that looked severed.
  // Smooth localized pixel deformation is continuous through the belly and
  // paws: no transparent seams or separate limbs can open during a stride.
  // Four walk frames and four sprint frames are built lazily per breed.
  function smoothstep(a,b,x){
    const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  function illustratedGaitFrames(art,id,sprint){
    const key=(breedLoaded?'breed:':'classic:')+(id||art.sx)+':'+art.sw+'x'+art.sh+':'+(sprint?'run':'walk');
    if(animatedRigCache[key])return animatedRigCache[key];
    try{
      const w=Math.min(124,art.sw),h=Math.min(186,art.sh);
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      const c=canvas.getContext('2d',{willReadFrequently:true});
      if(!c?.getImageData||!c?.putImageData||!c?.createImageData)return null;
      c.drawImage(art.image,art.sx,art.sy,art.sw,art.sh,0,0,w,h);
      const original=c.getImageData(0,0,w,h).data;
      // Find original painted silhouette, not a guessed cartoon skeleton.
      let left=w,top=h,right=-1,bottom=-1;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const a=original[(y*w+x)*4+3];
        if(a<32)continue;
        left=Math.min(left,x);right=Math.max(right,x);
        top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
      if(right-left<w*.13||bottom-top<h*.24)return null;
      const bodyW=right-left,bodyH=bottom-top;
      const lX=left+bodyW*.32,rX=left+bodyW*.68;
      const radius=Math.max(4,bodyW*.19);
      function sample(u,v,channel){
        const x=Math.max(0,Math.min(w-1.001,u));
        const y=Math.max(0,Math.min(h-1.001,v));
        const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
        const i=(iy*w+ix)*4+channel,j=(iy*w+Math.min(w-1,ix+1))*4+channel;
        const z=(Math.min(h-1,iy+1)*w+ix)*4+channel;
        const zz=(Math.min(h-1,iy+1)*w+Math.min(w-1,ix+1))*4+channel;
        return Math.round(original[i]*(1-fx)*(1-fy)+original[j]*fx*(1-fy)
          +original[z]*(1-fx)*fy+original[zz]*fx*fy);
      }
      const frames=[];
      for(let index=0;index<4;index++){
        const phase=index*Math.PI*.5;
        const frame=document.createElement('canvas');
        frame.width=w;frame.height=h;
        const cc=frame.getContext('2d',{willReadFrequently:true});
        const out=cc.createImageData(w,h),dst=out.data;
        for(let y=0;y<h;y++){
          // Body-to-paw deformation tapers in continuously. Upper face, ears
          // and most fur are pixel-for-pixel identical to the original atlas.
          const flex=smoothstep(top+bodyH*.61,bottom-bodyH*.02,y);
          if(flex<=0){
            const row=y*w*4;dst.set(original.subarray(row,row+w*4),row);
            continue;
          }
          for(let x=0;x<w;x++){
            const leftWeight=Math.exp(-Math.pow((x-lX)/radius,2));
            const rightWeight=Math.exp(-Math.pow((x-rX)/radius,2));
            const reach=(leftWeight*Math.sin(phase)+rightWeight*Math.sin(phase+Math.PI));
            const lift=leftWeight*Math.max(0,Math.cos(phase))
              +rightWeight*Math.max(0,Math.cos(phase+Math.PI));
            const dx=flex*(sprint?7.6:4.6)*reach;
            const dy=flex*(sprint?5.2:3.2)*lift;
            const i=(y*w+x)*4,px=x-dx,py=y+dy;
            for(let channel=0;channel<4;channel++)dst[i+channel]=sample(px,py,channel);
          }
        }
        cc.putImageData(out,0,0);
        frames.push(frame);
      }
      animatedRigCache[key]=frames;
      gaitLayersBuilt++;
      return frames;
    }catch(err){return null;}
  }
  function paintArticulatedCat(ctx,art,dest,options,movement,phase){
    const sprite=illustratedGaitFrames(art,options.species?.id,options.gait==='sprint');
    if(!sprite){
      ctx.drawImage(art.image,art.sx,art.sy,art.sw,art.sh,...dest);
      return false;
    }
    const a=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    const frame=Math.floor(a/(Math.PI*.5))%4;
    ctx.drawImage(sprite[frame],0,0,sprite[frame].width,sprite[frame].height,...dest);
    return true;
  }
  // Early popups render before the high-detail AVIF atlas finishes decoding.
  const pendingPortraits=new Map();
  function replayPortraits(){
    for(const [canvas,species] of pendingPortraits){
      if(canvas?.isConnected!==false)thumbnail(canvas,species);
    }
    if(breedLoaded)pendingPortraits.clear();
  }
  function breedFrame(o) {
    const sp=o.species||{};
    const id=sp.id||'';
    // Use the 25-frame illustrated atlas first; fallback keeps playability on
    // older AVIF decoders or while the image is loading.
    const slot=BREED_ORDER.indexOf(id);
    if(breedLoaded&&slot>=0){
      return {image:breedSheet,sx:(slot%5)*breedFrameSize.w,
        sy:Math.floor(slot/5)*breedFrameSize.h,
        sw:breedFrameSize.w,sh:breedFrameSize.h};
    }
    const look=BREED_LOOKS[id];
    if(!look)return {image:source,sx:indexOf(o)*w,sy:0,sw:w,sh:h};
    if(breedCache[id])return {image:breedCache[id],sx:0,sy:0,sw:w,sh:h};
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d',{willReadFrequently:true});
    if(!c)return {image:source,sx:look[0]*w,sy:0,sw:w,sh:h};
    c.clearRect(0,0,w,h);
    c.drawImage(source,look[0]*w,0,w,h,0,0,w,h);
    const [base,tone,strength,kind]=look;
    if(tone && strength>0) {
      const dst=c.getImageData(0,0,w,h),data=dst.data;
      const col=[parseInt(tone.slice(1,3),16),parseInt(tone.slice(3,5),16),parseInt(tone.slice(5,7),16)];
      const ref=[174,85,80,167,184,72][base];
      for(let i=0;i<data.length;i+=4){
        if(data[i+3]<28)continue;
        const r=data[i],g=data[i+1],b=data[i+2];
        const lum=r*.30+g*.59+b*.11;
        const sat=Math.max(r,g,b)-Math.min(r,g,b);
        let fur=false;
        if(base===0)fur=r>g*1.08&&g>b*1.04&&g>65&&g>r*.43&&b<r*.89;
        else if(base===1)fur=lum<128&&sat<95; // replace dark calico patches with ginger
        else if(base===2)fur=sat<58&&lum>30;
        else if(base===3)fur=sat<56&&b<r*1.18&&lum>40;
        else if(base===4)fur=r>=g*.91&&g>b*.72&&!(r>g*1.27&&b>g*1.14)&&!(b>r*1.07&&b>g*1.12);
        else fur=sat<55&&lum>28&&!(r>g*1.14&&g>b*1.12);
        if(!fur)continue;
        const factor=Math.max(.27,Math.min(1.53,Math.pow(lum/ref,.80)));
        // Retain painted highlights, fur texture, dark linework and eye details.
        const k=strength*Math.min(1,lum/45);
        for(let ch=0;ch<3;ch++){
          const t=Math.max(0,Math.min(255,col[ch]*factor));
          data[i+ch]=Math.round(data[i+ch]*(1-k)+t*k);
        }
      }
      c.putImageData(dst,0,0);
    }
    // Breed-specific coat markings stay below the face, so the original
    // illustrated eyes, whiskers, expression and collars remain untouched.
    if(kind==='bengal-rosettes'||kind==='maine-coon'||kind==='norwegian-forest'){
      c.save();c.globalCompositeOperation='source-atop';
      c.strokeStyle=kind==='bengal-rosettes'?'rgba(92,59,35,.33)':'rgba(91,70,53,.13)';
      c.lineWidth=kind==='bengal-rosettes'?2.2:1.4;
      const marks=[[w*.38,h*.63],[w*.63,h*.69],[w*.43,h*.79],[w*.62,h*.84]];
      for(const [mx,my] of marks){c.beginPath();c.ellipse(mx,my,7,4,-.35,.3,Math.PI*1.75);c.stroke();}
      c.restore();
    }
    if(kind==='cherry-pink'||kind==='starry-black'||kind==='moon-point'){
      c.save();c.globalCompositeOperation='source-atop';
      c.fillStyle=kind==='cherry-pink'?'rgba(245,148,177,.60)':'rgba(220,218,250,.70)';
      for(const [x,y] of [[.25,.45],[.72,.69],[.5,.84]]){
        c.font='14px system-ui';c.textAlign='center';c.fillText('✦',w*x,h*y);
      }
      c.restore();
    }
    breedCache[id]=canvas;
    return {image:canvas,sx:0,sy:0,sw:w,sh:h};
  }

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
    if(!loaded&&!breedLoaded){fallbackDraw(ctx,x,y,o);return;}
    const gr=o.growth||null;
    const scale=(o.scale||1)*(gr?.scale||1);
    const face=o.face===-1?-1:1;
    // Ease the sprite with a planted-feet pivot. A side-to-side nudge, gentle
    // stretch/compression and stride-dependent lean mimic shifting weight,
    // rather than spinning the entire illustration rigidly around its center.
    const movement=pose==='walk' ? Math.max(.04,Math.min(1,o.motion??.8)) : 0;
    const phase=o.stride===undefined?t*(o.gait==='sprint'?11:7):o.stride;
    const footfall=Math.sin(phase),lift=Math.max(0,Math.sin(phase*2));
    const hop=pose==='play'?Math.pow(Math.abs(Math.sin(t*5.2)),1.5)*9:0;
    const breathing=Math.sin(t*1.65)*.008;
    const sway=pose==='walk'?footfall*.012*movement:
      pose==='sleep'?Math.sin(t*1.5)*.008:
      pose==='belly'?Math.sin(t*4)*.09:Math.sin(t*1.6)*.012;
    // Keep the painted face and fur proportions intact. The paws are now
    // truly articulated so the whole illustration no longer "floats".
    const bob=movement*(.15+.52*lift)+hop+(pose==='idle'?Math.sin(t*2)*.32:0);
    const stretchX=1+movement*(.006*Math.cos(phase*2))-(pose==='play'?hop*.0014:0);
    const stretchY=1+breathing-movement*(.007*Math.cos(phase*2))+(pose==='play'?hop*.002:0);
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
    const art=breedFrame(o);
    // Mild breed silhouettes; retain the illustrated face, texture, and
    // foot anchoring so existing movement and collision remain unchanged.
    const build=BREED_LOOKS[o.species?.id]?.[3]||'';
    const dest=build==='short-legged'?[-30,-46,60,79]:
      build==='seal-point'?[-27,-55,54,90]:
      build==='british-blue'?[-33,-53,66,86]:
      build==='maine-coon'?[-33,-57,66,92]:
      build==='norwegian-forest'?[-32,-56,64,91]:
      build==='folded-cream'?[-30,-52,60,87]:
      [-30,-55,60,90];
    if(pose==='walk'&&movement>.075){
      paintArticulatedCat(ctx,art,dest,o,movement,phase);
    }else{
      ctx.drawImage(art.image,art.sx,art.sy,art.sw,art.sh,...dest);
    }
    // No floating emoji hearts around running world cats. Affection
    // is communicated by physical body motion instead of sticker overlays.
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
    // Keep the visual size fixed and give phones 2-3 actual source pixels per
    // CSS pixel. The old 160x120 backing was stretched and looked blurry.
    const rect=canvas.getBoundingClientRect?.();
    const logicalW=Number(canvas.dataset?.thumbW)||(rect?.width>8?rect.width:canvas.width);
    const logicalH=Number(canvas.dataset?.thumbH)||(rect?.height>8?rect.height:canvas.height);
    const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    const pw=Math.max(1,Math.round(logicalW*ratio)),ph=Math.max(1,Math.round(logicalH*ratio));
    if(canvas.dataset){canvas.dataset.thumbW=String(logicalW);canvas.dataset.thumbH=String(logicalH);}
    if(canvas.width!==pw)canvas.width=pw;
    if(canvas.height!==ph)canvas.height=ph;
    ctx.setTransform?.(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,logicalW,logicalH);
    const scale=Math.min(logicalW/63,logicalH/90)*.94;
    render(ctx,logicalW/2,logicalH*.58,{
      species,scale,pose:'sit',mood:'neutral',t:.6,motion:0
    });
    if(!breedLoaded)pendingPortraits.set(canvas,species);
  }
  drawing.drawCat=render;
  drawing.renderCatThumb=thumbnail;
  // Surface decoding state for the automated 25-breed art audit.
  window.CatBondArtworkStatus={
    get breedsLoaded(){return breedLoaded;},
    get originalLoaded(){return loaded;},
    get gaitLayersBuilt(){return gaitLayersBuilt;},
    breedCount:BREED_ORDER.length,
  };
  source.onload=()=>{
    loaded=source.naturalWidth===w*6&&source.naturalHeight===h;
    for(const id of Object.keys(breedCache))delete breedCache[id];
    for(const key of Object.keys(animatedRigCache))delete animatedRigCache[key];
    if(!loaded)return;
    // Intro uses a static canvas; repaint once the atlas is decoded.
    if(typeof window.paintIntroCatGallery==='function'){
      try{window.paintIntroCatGallery();}catch(_){}
    }
    replayPortraits();
    window.dispatchEvent(new Event('cat-bond-illustrations-ready'));
  };
  source.onerror=()=>{
    console.warn('Cat Bond kitten art failed to load; retaining playable fallback.');
  };
  breedSheet.onload=()=>{
    breedLoaded=breedSheet.naturalWidth===breedFrameSize.w*5
      &&breedSheet.naturalHeight===breedFrameSize.h*5;
    if(breedLoaded){
      for(const key of Object.keys(animatedRigCache))delete animatedRigCache[key];
      try{window.paintIntroCatGallery?.()}catch(_){}
      replayPortraits();
      window.dispatchEvent(new Event('cat-bond-illustrations-ready'));
    }
  };
  breedSheet.onerror=()=>{pendingPortraits.clear();console.warn('Breed illustrations unavailable; original cat sprites retained')};
  if(window.CAT_BOND_BREED_ATLAS)breedSheet.src=window.CAT_BOND_BREED_ATLAS;
  source.src=window.CAT_BOND_KITTEN_ATLAS;
})();
