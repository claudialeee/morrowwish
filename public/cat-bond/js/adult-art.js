/* Adult Cat Bond forms: distinct watercolor adult portrait artwork.
   Preserves kitten art at stage 0. One transparent adult painted master is
   individually color-graded for each of the game's 32 breeds. */
(()=>{
  'use strict';
  if(!window.CatArt)return;
  const drawKitten=CatArt.drawCat;
  const thumbKitten=CatArt.renderCatThumb;
  const asset=new Image();
  const cache=new Map();
  const pending=new Map();
  let ready=false;
  const COLORS={
    tangyuan:'#d39a68',doudou:'#9c7353',xiaohui:'#aeb7c4',moqiu:'#35303d',
    nainai:'#eee9e2',nietu:'#e6c99f',niuniu:'#45444d',sanhua:'#cc9f77',
    lixiao:'#414455',lanbao:'#7f96b3',dundun:'#ccc2ad',yunduo:'#eee5ea',
    zherdd:'#e9bda0',qisi:'#d1a170',duanduan:'#d6ba87',jinjc:'#ddbd71',
    xianluo:'#ba9786',yinghua:'#e7b3bc',senlin:'#927967',youling:'#7c719e',
    nuowei:'#b1a19a',baomao:'#ba8b54',jinwu:'#edac5b',yuelian:'#c9d5e9',
    xingchen:'#5c5b7e',abi:'#c78e56',meidu:'#aabbd0',xuewa:'#dcd2bd',
    mengmai:'#252331',fanmao:'#eee3cd',bosi:'#e5c8b1',wumao:'#d59d92'
  };
  const SPECIAL={
    moqiu:'dark',niuniu:'tux',lixiao:'tux',sanhua:'calico',
    xianluo:'point',yunduo:'point',yuelian:'point',baomao:'rosette',
    meidu:'tabby',xiaohui:'tabby',doudou:'tabby',tangyuan:'tabby',
    jinwu:'tabby',wumao:'sphynx',xuewa:'snowshoe',fanmao:'van'
  };
  function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
  const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
  function artFor(id){
    id=(id&&COLORS[id])?id:'xiaohui';
    if(cache.has(id))return cache.get(id);
    if(!ready)return null;
    const cv=document.createElement('canvas');cv.width=asset.naturalWidth;cv.height=asset.naturalHeight;
    const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(asset,0,0);
    const img=c.getImageData(0,0,cv.width,cv.height),d=img.data,coat=rgb(COLORS[id]);
    const style=SPECIAL[id]||'';
    for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){
      const i=(y*cv.width+x)*4,alpha=d[i+3];
      if(alpha<18)continue;
      const r=d[i],g=d[i+1],b=d[i+2];
      const max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max-min;
      // Keep the painted blue cape, golden bell, green eyes, pink ears intact.
      const cape=b>r*1.14 && b>g*1.11;
      const golden=r>g*1.22 && g>b*1.16 && g>85;
      const eyes=g>r*1.08 && g>b*1.08;
      const pink=r>g*1.21 && b>g*.91;
      if(cape||golden||eyes||pink||sat>67)continue;
      const luminosity=.30*r+.59*g+.11*b;
      const shade=Math.max(.36,Math.min(1.46,Math.pow(luminosity/172,.8)));
      const body=y>cv.height*.28, dark=style==='dark'||id==='mengmai';
      const strength=dark?.90:.76;
      const target=coat.map(v=>clamp(v*shade+(luminosity>194?(luminosity-194)*.26:0)));
      for(let ch=0;ch<3;ch++)d[i+ch]=clamp(d[i+ch]*(1-strength)+target[ch]*strength);
    }
    c.putImageData(img,0,0);
    // Breed-specific adult fur markings: always clipped inside painted silhouette.
    if(['tux','calico','snowshoe','van','rosette','point','tabby'].includes(style)){
      c.save();c.globalCompositeOperation='source-atop';
      if(style==='calico'){
        c.fillStyle='rgba(103,72,65,.49)';
        for(const [x,y,rx,ry] of [[58,58,15,15],[117,137,21,29],[55,176,17,24]]){c.beginPath();c.ellipse(x*cv.width/190,y*cv.height/262,rx,ry,-.3,0,Math.PI*2);c.fill();}
      }else if(style==='tux'||style==='snowshoe'||style==='van'){
        c.fillStyle='rgba(255,251,240,.85)';
        c.beginPath();c.ellipse(cv.width*.67,cv.height*.68,16,52,-.05,0,Math.PI*2);c.fill();
      }else if(style==='point'){
        c.fillStyle='rgba(100,76,83,.24)';
        c.beginPath();c.ellipse(cv.width*.61,cv.height*.27,31,19,.1,0,Math.PI*2);c.fill();
      }else if(style==='rosette'){
        c.strokeStyle='rgba(93,60,47,.65)';c.lineWidth=3;
        for(const [x,y] of [[56,161],[75,183],[54,203],[95,191]]){c.beginPath();c.ellipse(x,y,8,5,.35,0,Math.PI*1.75);c.stroke();}
      }else if(style==='tabby'){
        c.strokeStyle='rgba(83,72,67,.19)';c.lineWidth=2;
        for(let y=164;y<211;y+=17){c.beginPath();c.moveTo(62,y);c.quadraticCurveTo(86,y-9,100,y+9);c.stroke();}
      }
      c.restore();
    }
    cache.set(id,cv);
    return cv;
  }
  function drawAdult(ctx,x,y,o){
    if(!o?.growth || o.growth.stage<1)return drawKitten(ctx,x,y,o);
    const art=artFor(o.species?.id);
    if(!art)return drawKitten(ctx,x,y,o);
    const gr=o.growth,t=o.t||0,pose=o.pose||'idle';
    const face=o.face===-1?-1:1,scale=(o.scale||1)*(gr.scale||1);
    const walk=pose==='walk'||pose==='run'||pose==='dash';
    const hop=pose==='play'?Math.abs(Math.sin(t*4.8))*5:0;
    ctx.save();ctx.translate(x,y);ctx.scale(scale*face,scale);
    if(gr.aura){
      const halo=ctx.createRadialGradient(0,-18,2,0,-18,65);
      halo.addColorStop(0,'rgba(255,255,255,0)');
      halo.addColorStop(.65,gr.aura+'40');
      halo.addColorStop(1,gr.aura+'00');
      ctx.fillStyle=halo;ctx.beginPath();ctx.ellipse(0,-18,63,67,0,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='rgba(65,52,65,.13)';ctx.beginPath();ctx.ellipse(0,31,29,5,0,0,Math.PI*2);ctx.fill();
    const step=walk?Math.sin(o.stride??t*7)*.03:Math.sin(t*1.5)*.008;
    ctx.translate(0,-hop+(walk?Math.abs(Math.sin(o.stride??t*7))*.8:0));
    ctx.rotate(step);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Feet anchor at +31, identical to the kitten art and map collision.
    ctx.drawImage(art,-40,-83,80,114);
    if(gr.gem){ctx.font='11px system-ui';ctx.fillStyle=gr.gemColor||'#cbd4ff';ctx.textAlign='center';ctx.fillText('✦',32,-72);}
    if(gr.sparkle){ctx.font='13px system-ui';ctx.fillStyle=gr.gemColor||'#ffd6ac';ctx.fillText('✧',-38,-65);}
    ctx.restore();
  }
  function thumbnail(canvas,species,cat){
    if(!cat||((cat.stage||0)<1))return thumbKitten(canvas,species);
    if(!ready){pending.set(canvas,[species,cat]);return thumbKitten(canvas,species);}
    const c=canvas.getContext('2d');if(!c)return;
    const rect=canvas.getBoundingClientRect?.();
    const w=Number(canvas.dataset?.thumbW)||(rect?.width>8?rect.width:canvas.width);
    const h=Number(canvas.dataset?.thumbH)||(rect?.height>8?rect.height:canvas.height);
    const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
    if(canvas.dataset){canvas.dataset.thumbW=String(w);canvas.dataset.thumbH=String(h);}
    c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);
    const gr=window.Growth?.visual(cat)||{stage:1,scale:1.07};
    const scale=Math.min(w/90,h/122)*1.02;
    drawAdult(c,w/2,h*.70,{species,growth:gr,scale,pose:'sit',t:1,face:1});
  }
  CatArt.drawCat=drawAdult;
  CatArt.renderCatThumb=thumbnail;
  asset.onload=()=>{
    ready=asset.naturalWidth>0;cache.clear();
    for(const [cv,[species,cat]] of pending)if(cv?.isConnected!==false)thumbnail(cv,species,cat);
    pending.clear();
    window.dispatchEvent(new Event('cat-bond-adult-art-ready'));
  };
  asset.onerror=()=>console.warn('Adult watercolor asset missing; kitten fallback kept playable');
  asset.src='/cat-bond/assets/adult-watercolor-20261121.webp';
  window.CatBondAdultArt={get loaded(){return ready;},get paletteSize(){return Object.keys(COLORS).length;},drawAdult};
})();