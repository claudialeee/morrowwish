/* Cat Bond: source-of-truth visual renderer for the original illustrated kittens.
   Intentionally replaces only visuals. All game species IDs, movement, input,
   battles, saves, progression and collision systems remain untouched. */
(()=>{
  'use strict';
  if (!window.CatArt) return;
  const drawing=window.CatArt;
  const source=new Image();
  const breedSheet=new Image();
  // The SR Exotic Shorthair has its own real illustrated 2D sprite, not the
  // generic fallback or an out-of-bounds 33rd atlas cell.
  const jiafeiSprite=new Image();
  let loaded=false,breedLoaded=false,jiafeiLoaded=false;
  const jiafeiPortraits=new Map();
  // One illustrated frame per species, matching the order in data.js.
  const BREED_ORDER=[
    'tangyuan','doudou','xiaohui','moqiu','nainai',
    'nietu','niuniu','sanhua','lixiao','lanbao',
    'dundun','yunduo','zherdd','qisi','duanduan',
    'jinjc','xianluo','yinghua','senlin','youling',
    'nuowei','baomao','jinwu','yuelian','xingchen',
    'abi','meidu','xuewa','mengmai','fanmao','bosi','wumao'
  ];
  const breedFrameSize={w:110,h:130,cols:3,rows:1};
  // New illustrated atlas keeps the original six breeds but supplies over
  // four times as many source pixels per character.
  const frame=window.CAT_BOND_KITTEN_FRAME||{w:60,h:90};
  const w=frame.w,h=frame.h;
  const indices={
    // Six original kitten illustrations, in the same order as the reference.
    tangyuan:0,doudou:3,xiaohui:3,moqiu:5,nainai:4,nietu:4,niuniu:2,
    sanhua:1,lixiao:2,lanbao:3,dundun:3,yunduo:4,zherdd:4,
    qisi:0,duanduan:0,jinjc:0,xianluo:4,yinghua:4,senlin:0,
    youling:5,nuowei:0,baomao:0,jinwu:0,yuelian:4,xingchen:5,
    abi:0,meidu:3,xuewa:4,mengmai:5,fanmao:0,bosi:4,wumao:4
  };
  const paletteIndex={
    orange:0,brownTabby:0,silver:3,tux:2,white:4,black:5,cream:4,
    calico:1,blue:3,ragdoll:4,siamese:4,maine:0,flame:0,cloud:4,
    mystic:5,goldShaded:0,apricot:0,cheese:0,norwegian:0,bengal:0
  };

  // One deliberate look per catalogue species. The original watercolor kitten
  // painting is always the underlying artwork; no vector/model replacement.
  // [original illustrated kitten, target fur color, blend strength, coat traits]
  // Three COMPLETE hand-painted, transparent kittens. Individual breeds get
  // characteristic coat colors and markings without mirrored or sliced faces.
  // Values: [source kitten, fur tint, tint amount, anatomy/coat cues]
  const BREED_LOOKS={
    tangyuan:[0,null,0,'orange-tabby'],
    doudou:[0,'#ac7953',.72,'brown-tabby'],
    xiaohui:[1,null,0,'silver-tabby'],
    moqiu:[1,'#332f43',.91,'black'],
    nainai:[2,'#f9f8f0',.84,'white'],
    nietu:[2,'#f4d6ae',.46,'cream'],
    niuniu:[1,'#33303c',.78,'tuxedo'],
    sanhua:[2,'#d5ad84',.25,'calico'],
    lixiao:[1,'#4c4351',.68,'formal-tuxedo'],
    lanbao:[1,'#8a9eb8',.72,'british-blue'],
    dundun:[1,'#d0c6b9',.43,'silver-shaded'],
    yunduo:[2,null,0,'ragdoll'],
    zherdd:[2,'#edcaaf',.44,'folded-cream'],
    qisi:[0,'#e4ad83',.37,'orange-white'],
    duanduan:[0,'#f4cf9a',.55,'short-legged'],
    jinjc:[0,'#d2ac58',.76,'golden-shaded'],
    xianluo:[2,'#bfa18c',.52,'seal-point'],
    yinghua:[2,'#f5d6df',.65,'cherry-pink'],
    senlin:[0,'#987b6c',.75,'maine-coon'],
    youling:[1,'#75638f',.76,'spirit-purple'],
    nuowei:[1,'#af978a',.66,'norwegian-forest'],
    baomao:[0,'#bf935e',.64,'bengal-rosettes'],
    jinwu:[0,'#ffb65b',.39,'flame-tabby'],
    yuelian:[2,'#dce2ee',.57,'moon-point'],
    xingchen:[1,'#5d557e',.86,'starry-black'],
    abi:[0,'#d6a46a',.71,'abyssinian-ticked'],
    meidu:[1,'#bec7d5',.55,'american-swirl'],
    xuewa:[2,'#e2d1bc',.56,'snowshoe'],
    mengmai:[1,'#25232c',.96,'bombay-black'],
    fanmao:[2,'#f2e3d0',.40,'turkish-van'],
    bosi:[2,'#f4dab0',.63,'persian-fluffy'],
    wumao:[2,'#e8ae9c',.88,'sphynx-skin']
  };
  const breedCache=Object.create(null);
  const framedBreedCache=Object.create(null);
  const starterFrames=new Map(),starterImages=new Map();
  for(const id of ['jinjc','yunduo']){const image=new Image();starterImages.set(id,image);image.onload=()=>{delete breedCache[id];for(const key of Object.keys(animatedRigCache))if(key.includes(':'+id+':'))delete animatedRigCache[key];replayPortraits();};image.src='/cat-bond/assets/starter-portraits/'+id+'.webp';}
  function starterFrame(id){const im=starterImages.get(id);if(!im?.complete||!im.naturalWidth)return null;if(starterFrames.has(id))return starterFrames.get(id);const c=document.createElement('canvas');c.width=breedFrameSize.w;c.height=breedFrameSize.h;const ctx=c.getContext('2d'),s=Math.min(c.width/im.naturalWidth,c.height/im.naturalHeight);ctx.drawImage(im,(c.width-im.naturalWidth*s)/2,c.height-im.naturalHeight*s,im.naturalWidth*s,im.naturalHeight*s);starterFrames.set(id,c);return c;}
  const animatedRigCache=Object.create(null);
  // Never mirror a half-cat. Every source contains a whole face, paws and tail.
  function framedBreed(slot){
    if(framedBreedCache[slot])return framedBreedCache[slot];
    const frame=document.createElement('canvas');
    frame.width=breedFrameSize.w;frame.height=breedFrameSize.h;
    const ctx=frame.getContext('2d');
    ctx.drawImage(breedSheet,slot*breedFrameSize.w,0,
      breedFrameSize.w,breedFrameSize.h,0,0,frame.width,frame.height);
    const pixels=ctx.getImageData(0,0,frame.width,frame.height),a=pixels.data,W=frame.width,H=frame.height,seen=new Uint8Array(W*H),queue=[];
    const exterior=i=>{const p=i*4,r=a[p],g=a[p+1],b=a[p+2];return a[p+3]<24||(g>=r*.90&&g>b*1.16&&g-r>-18);};
    const visit=i=>{if(i<0||i>=W*H||seen[i]||!exterior(i))return;seen[i]=1;queue.push(i);};
    for(let x=0;x<W;x++){visit(x);visit((H-1)*W+x);}for(let y=0;y<H;y++){visit(y*W);visit(y*W+W-1);}
    for(let q=0;q<queue.length;q++){const i=queue[q],x=i%W,y=Math.floor(i/W);a[i*4+3]=0;if(x>0)visit(i-1);if(x<W-1)visit(i+1);if(y>0)visit(i-W);if(y<H-1)visit(i+W);}
    ctx.putImageData(pixels,0,0);framedBreedCache[slot]=frame;
    return frame;
  }
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
  function illustratedGaitFrames(art,id,sprint,gesture='walk'){
    const key=(breedLoaded?'breed:':'classic:')+(id||art.sx)+':'+art.sw+'x'+art.sh+':'+(sprint?'run':'walk')+':'+gesture;
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
            // Paw gestures are smooth *whole-silhouette deformations* from
            // shoulder to pad. The watercolor remains a contiguous body —
            // no cutout paws, floating heads or broken limb attachments.
            const raised=Math.max(0,Math.sin(phase));
            const guard=Math.max(0,Math.cos(phase));
            const dx=gesture==='highfive'
              ?flex*rightWeight*raised*11.0+flex*leftWeight*raised*2.5
              :gesture==='guard'
                ?flex*(rightWeight+leftWeight)*guard*3.5
                :gesture==='swipe'
                  ?flex*rightWeight*Math.sin(phase)*9.5
                  :flex*(sprint?7.6:4.6)*reach;
            const dy=gesture==='highfive'
              ?flex*rightWeight*raised*11.5+flex*leftWeight*raised*2.8
              :gesture==='guard'
                ?-flex*(rightWeight+leftWeight)*guard*3
                :gesture==='swipe'
                  ?flex*rightWeight*Math.max(0,Math.cos(phase))*7
                  :flex*(sprint?5.2:3.2)*lift;
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
    const gesture=options.pose==='duo-highfive'?'highfive':
      options.pose==='duo-guard'?'guard':
      options.pose==='duo-swipe'?'swipe':'walk';
    const sprite=illustratedGaitFrames(art,options.species?.id,options.gait==='sprint',gesture);
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
  function breedFrame(o){
    const species=o.species||{},id=species.id||'tangyuan';
    if(!breedLoaded)return {image:source,sx:0,sy:0,sw:w,sh:h};
    const starter=starterFrame(id);if(starter)return {image:starter,sx:0,sy:0,sw:starter.width,sh:starter.height};
    if(breedCache[id])return {image:breedCache[id],sx:0,sy:0,sw:breedFrameSize.w,sh:breedFrameSize.h};
    const [base,tone,strength,kind]=BREED_LOOKS[id]||BREED_LOOKS.tangyuan;
    const canvas=document.createElement('canvas');
    canvas.width=breedFrameSize.w;canvas.height=breedFrameSize.h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(framedBreed(base),0,0);
    if(tone&&strength>0){
      const image=ctx.getImageData(0,0,canvas.width,canvas.height),data=image.data;
      const target=[1,3,5].map(i=>parseInt(tone.slice(i,i+2),16));
      const ref=[154,173,190][base];
      for(let i=0;i<data.length;i+=4){
        if(data[i+3]<24)continue;
        const r=data[i],g=data[i+1],b=data[i+2],lum=r*.3+g*.59+b*.11;
        const sat=Math.max(r,g,b)-Math.min(r,g,b);
        // Fur-only recoloring: retain eyes, mouth, blue ribbon, red bell,
        // painted shadows and facial expression from the source illustration.
        const fur=base===0?(r>g*1.07&&g>b*1.09&&g>56):
          base===1?(sat<64&&lum>56&&b<r*1.25):
          (lum>91&&r>=g*.83&&g>=b*.82&&!(b>g*1.27));
        if(!fur)continue;
        const factor=Math.max(.30,Math.min(1.5,Math.pow(lum/ref,.82)));
        const k=strength*Math.min(1,lum/64);
        for(let ch=0;ch<3;ch++){
          const tr=Math.min(255,Math.max(0,target[ch]*factor));
          data[i+ch]=Math.round(data[i+ch]*(1-k)+tr*k);
        }
      }
      ctx.putImageData(image,0,0);
    }
    if(['bengal-rosettes','maine-coon','norwegian-forest','brown-tabby','american-swirl','abyssinian-ticked'].includes(kind)){
      ctx.save();ctx.globalCompositeOperation='source-atop';
      ctx.strokeStyle=kind==='bengal-rosettes'?'#79533f80':kind==='american-swirl'?'#61778f77':'#97785b55';
      ctx.lineWidth=['bengal-rosettes','american-swirl'].includes(kind)?2.3:1.4;
      for(const [x,y] of [[39,93],[78,100],[46,115],[72,119]]){
        ctx.beginPath();ctx.ellipse(x,y,7,3,-.27,.3,Math.PI*1.9);ctx.stroke();
      }
      ctx.restore();
    }
    if(['cherry-pink','starry-black','moon-point'].includes(kind)){
      ctx.save();ctx.globalCompositeOperation='source-atop';
      ctx.fillStyle='#fbebadbb';ctx.font='11px system-ui';ctx.textAlign='center';
      for(const [x,y] of [[28,59],[80,85]])ctx.fillText('✧',x,y);
      ctx.restore();
    }
    if(kind==='snowshoe'||kind==='turkish-van'){
      ctx.save();ctx.globalCompositeOperation='source-atop';
      ctx.fillStyle=kind==='snowshoe'?'#fffaf2ca':'#f9f3e4ae';
      ctx.beginPath();ctx.ellipse(52,102,24,24,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }else if(kind==='sphynx-skin'){
      ctx.save();ctx.globalCompositeOperation='source-atop';
      ctx.strokeStyle='#aa706c85';ctx.lineWidth=1.4;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(38,56+i*8);
        ctx.quadraticCurveTo(54,48+i*8,69,57+i*8);ctx.stroke();}
      ctx.restore();
    }
    breedCache[id]=canvas;
    return {image:canvas,sx:0,sy:0,sw:canvas.width,sh:canvas.height};
  }
  // Soft contact shadows have a dense center and transparent perimeter,
  // preserving the actual painted sprite and its grounded position.
  function contactShadow(ctx,x,y,rx,ry,opacity){
    ctx.save();ctx.translate(x,y);ctx.scale(Math.max(.1,rx),Math.max(.1,ry));
    const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,'rgba(35,38,32,'+opacity+')');
    g.addColorStop(.55,'rgba(35,38,32,'+(opacity*.55)+')');
    g.addColorStop(1,'rgba(35,38,32,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function paintJiafei(ctx,x,y,o){
    if(!jiafeiLoaded)return false;
    const growth=o.growth||null,s=(o.scale||1)*(growth?.scale||1);
    const face=o.face===-1?-1:1,t=o.t||0,pose=o.pose||'idle';
    const moving=pose==='walk'||pose==='run'||pose==='dash'||pose.startsWith('duo-');
    const bob=moving?Math.abs(Math.sin(t*8))*.8:
      pose==='play'?Math.abs(Math.sin(t*7))*5:Math.sin(t*2)*.3;
    ctx.save();ctx.translate(x,y);ctx.scale(face*s,s);
    if(growth?.aura){
      const grad=ctx.createRadialGradient(0,0,2,0,0,56);
      grad.addColorStop(0,'rgba(255,255,255,0)');
      grad.addColorStop(.6,growth.aura+'33');
      grad.addColorStop(1,growth.aura+'00');
      ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,56,0,Math.PI*2);ctx.fill();
    }
    contactShadow(ctx,0,32,31,5,.24);
    // Feet stay planted at y≈+33 as in the 32 watercolor breeds.
    ctx.translate(0,-bob);
    if(pose==='sleep'||pose==='loaf'){ctx.translate(0,7);ctx.scale(1,.82);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // The approved flat-faced painting has a broad transparent top margin;
    // calibrate the VISIBLE fur pixels against an ordinary watercolor breed,
    // not the WebP canvas's empty pixels. Uniform scaling preserves the wide
    // cheeks, short paws, planted baseline and all gameplay hitboxes.
    const visualScale=.86;
    const nativeW=jiafeiSprite.naturalWidth,nativeH=jiafeiSprite.naturalHeight;
    const fit=Math.min(92*visualScale/nativeW,105*visualScale/nativeH);
    const artW=nativeW*fit,artH=nativeH*fit;
    ctx.drawImage(jiafeiSprite,-artW/2,36-artH,artW,artH);
    if(growth?.gem){ctx.font='12px system-ui';ctx.fillStyle=growth.gemColor||'#e8bb68';ctx.fillText('✦',20,-47);}
    ctx.restore();
    return true;
  }
  function indexOf(options){
    const sp=options.species||{};
    if(sp.id&&Object.prototype.hasOwnProperty.call(indices,sp.id)) return indices[sp.id];
    return paletteIndex[options.palette||sp.palette]??0;
  }
  // Use the actual named NPC watercolor artwork for every gameplay render.
  const storyImages=new Map(),storyPortraits=new Map();
  function storyImage(sp){
    if(!storyImages.has(sp.id)){const img=new Image();storyImages.set(sp.id,img);img.onload=()=>{for(const [canvas,species] of storyPortraits){if(species.id!==sp.id)continue;storyPortraits.delete(canvas);if(canvas.isConnected!==false)thumbnail(canvas,species);}window.dispatchEvent(new Event('cat-bond-illustrations-ready'));};img.src='/cat-bond/'+sp.storyArt;}
    return storyImages.get(sp.id);
  }
  function paintStory(ctx,x,y,o){
    const image=storyImage(o.species);if(!image.complete||!image.naturalWidth)return;
    const s=(o.scale||1)*(o.growth?.scale||1),t=o.t||0,pose=o.pose||'idle',moving=['walk','run','dash','duo-swipe','duo-highfive','duo-guard'].includes(pose);
    const fit=Math.min(90/image.naturalWidth,102/image.naturalHeight),aw=image.naturalWidth*fit,ah=image.naturalHeight*fit;
    ctx.save();ctx.translate(x,y);ctx.scale((o.face===-1?-1:1)*s,s);contactShadow(ctx,0,32,31,5,.24);
    ctx.translate(0,moving?-Math.abs(Math.sin(t*9))*2:Math.sin(t*2)*.4);if(pose==='sleep'||pose==='loaf'){ctx.translate(0,7);ctx.scale(1,.82);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,-aw/2,36-ah,aw,ah);ctx.restore();
  }
  function render(ctx,x,y,options){
    const o=options||{},t=o.t||0,pose=o.pose||'idle',mood=o.mood||'neutral';
    // Jiafei isn't in the fixed 8x4 breed atlas. Render its own original
    // transparent 2D watercolor asset for map, yard, battle, and portraits.
    if(o.species?.storyArt){paintStory(ctx,x,y,o);return;}
    if(o.species?.id==='jiafei'){
      paintJiafei(ctx,x,y,o);
      return;
    }
    // An image draws as soon as its first frame has decoded. On older browsers
    // without AVIF decoding, preserve playability with the legacy renderer.
    if(!loaded&&!breedLoaded)return;
    const gr=o.growth||null;
    const scale=(o.scale||1)*(gr?.scale||1);
    const face=o.face===-1?-1:1;
    // Ease the sprite with a planted-feet pivot. A side-to-side nudge, gentle
    // stretch/compression and stride-dependent lean mimic shifting weight,
    // rather than spinning the entire illustration rigidly around its center.
    const duoMotion=pose==='duo-highfive'||pose==='duo-guard'||pose==='duo-swipe';
    const movement=pose==='walk'||duoMotion
      ?Math.max(.04,Math.min(1,o.motion??.8)) : 0;
    const phase=o.stride===undefined?t*(o.gait==='sprint'?11:7):o.stride;
    const footfall=Math.sin(phase),lift=Math.max(0,Math.sin(phase*2));
    const hop=pose==='play'?Math.pow(Math.abs(Math.sin(t*5.2)),1.5)*9:0;
    const breathing=Math.sin(t*1.65)*.008;
    const sway=pose==='walk'||duoMotion?footfall*.012*movement:
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
    contactShadow(ctx,0,33,27-hop*.2,4.3-hop*.13,.22);
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
    const originalDest=build==='short-legged'?[-30,-46,60,79]:
      build==='seal-point'?[-27,-55,54,90]:
      build==='british-blue'?[-33,-53,66,86]:
      build==='maine-coon'?[-33,-57,66,92]:
      build==='norwegian-forest'?[-32,-56,64,91]:
      build==='folded-cream'?[-30,-52,60,87]:
      [-30,-55,60,90];
    // The complete watercolor is wider than the cropped historical sprite.
    // Preserve its painted proportions instead of squeezing a whole cat into
    // the old, narrow half-cat rectangle. Keep feet planted at +35 and limit
    // the width so mobile garden/battle cats are still compact.
    const dest=breedLoaded?(()=>{
      const width=Math.min(81,originalDest[2]*1.22);
      const height=width*(art.sh/art.sw);
      const feetY=originalDest[1]+originalDest[3];
      return [-width/2,feetY-height,width,height];
    })():originalDest;
    if((pose==='walk'||duoMotion)&&movement>.075){
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
    // Leave an illustrated margin on all four sides in portrait cards.
    const scale=Math.min(logicalW/72,logicalH/104)*.86;
    render(ctx,logicalW/2,logicalH*.60,{
      species,scale,pose:'sit',mood:'neutral',t:.6,motion:0
    });
    if(species?.storyArt&&!storyImage(species).naturalWidth)storyPortraits.set(canvas,species);
    if(species?.id==='jiafei'&&!jiafeiLoaded)jiafeiPortraits.set(canvas,species);
    if(!breedLoaded)pendingPortraits.set(canvas,species);
  }
  drawing.drawCat=render;
  drawing.renderCatThumb=thumbnail;
  // Surface decoding state for the automated 25-breed art audit.
  window.CatBondArtworkStatus={
    get breedsLoaded(){return breedLoaded;},
    get originalLoaded(){return loaded;},
    get gaitLayersBuilt(){return gaitLayersBuilt;},
    get jiafeiLoaded(){return jiafeiLoaded;},
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
    console.warn('Cat Bond watercolor art failed to load; no legacy vector substitute.');
  };
  breedSheet.onload=()=>{
    breedLoaded=breedSheet.naturalWidth===breedFrameSize.w*3
      &&breedSheet.naturalHeight===breedFrameSize.h;
    if(breedLoaded){
      for(const key of Object.keys(framedBreedCache))delete framedBreedCache[key];
      for(const key of Object.keys(animatedRigCache))delete animatedRigCache[key];
      try{window.paintIntroCatGallery?.()}catch(_){}
      replayPortraits();
      window.dispatchEvent(new Event('cat-bond-illustrations-ready'));
    }
  };
  breedSheet.onerror=()=>{pendingPortraits.clear();console.warn('Breed illustrations unavailable; original cat sprites retained')};
  breedSheet.src='/cat-bond/assets/watercolor-cats-v2.webp';
  jiafeiSprite.onload=()=>{
    jiafeiLoaded=jiafeiSprite.naturalWidth===160&&jiafeiSprite.naturalHeight===180;
    if(!jiafeiLoaded)return;
    try{window.paintIntroCatGallery?.()}catch(_){}
    for(const [canvas,species] of jiafeiPortraits){
      if(canvas?.isConnected!==false)thumbnail(canvas,species);
    }
    jiafeiPortraits.clear();
    window.dispatchEvent?.(new Event('cat-bond-illustrations-ready'));
  };
  jiafeiSprite.onerror=()=>{console.warn('Jiafei watercolor sprite unavailable; no legacy vector substitute');};
  jiafeiSprite.src='/cat-bond/assets/jiafei-watercolor-v2.webp?v=approved-flat-face-watercolor-20261122';
  
})();
