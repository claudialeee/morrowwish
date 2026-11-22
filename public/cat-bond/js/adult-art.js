/* Cat Bond · 32 original illustrated adult breed forms.
 * Mature art is independent of the kitten atlas; no missing external image file. */
(function installAdultIllustrations(){
  'use strict';
  if(!window.CatArt)return;
  // Each entry specifies its OWN mature breed coat, silhouette, ear shape and eyes.
  // Original illustrated SVG assets are generated once, rasterized once and reused
  // by yard, combat, map, portraits and the growth ceremony.
  const breeds=[
    ['tangyuan','#df9f69','#ad6d49','tabby','round','#9ab879'],
    ['doudou','#9e745b','#5d443d','tabby','round','#98ae73'],
    ['xiaohui','#b7bdc4','#777b91','silver','round','#8dbb9c'],
    ['moqiu','#393444','#252435','solid','round','#d3b78e'],
    ['nainai','#f3efea','#b7b0b7','solid','longhair','#a7c5b5'],
    ['nietu','#e9cda8','#bd987d','solid','round','#c2b99b'],
    ['niuniu','#48434c','#292735','tux','round','#cfbd86'],
    ['sanhua','#f2e3cf','#a97962','calico','round','#91b8ac'],
    ['lixiao','#4d4555','#252636','tux','slim','#ccb680'],
    ['lanbao','#9cabc0','#677c9a','solid','british','#d7b47e'],
    ['dundun','#d6d0c4','#858791','silver','british','#aabf83'],
    ['yunduo','#f1e9e3','#8c7d8f','point','longhair','#8ab7d1'],
    ['zherdd','#efcab5','#c59795','solid','fold','#91bba4'],
    ['qisi','#e2a879','#b77558','bicolor','round','#b5ae75'],
    ['duanduan','#e9c995','#ae845d','tabby','short','#a1b98d'],
    ['jinjc','#e3c17b','#ad9056','gold','british','#9eb27c'],
    ['xianluo','#dbccb9','#695465','point','slim','#7db4d3'],
    ['yinghua','#f2d8dd','#c49cae','bicolor','round','#95bba1'],
    ['senlin','#aa8b79','#62534e','tabby','maine','#a5bd92'],
    ['youling','#a394ba','#5f567d','smoke','longhair','#b7d6ce'],
    ['nuowei','#b1a396','#756c6a','tabby','maine','#a9bf83'],
    ['baomao','#cc9f63','#78543d','rosette','slim','#a4c68c'],
    ['jinwu','#edb25d','#a96b3e','flame','maine','#dab676'],
    ['yuelian','#dce4ee','#7d849f','point','longhair','#9cd1df'],
    ['xingchen','#665b7d','#353252','star','longhair','#c5d2ba'],
    ['abi','#cf995e','#815b42','ticked','slim','#c3b67d'],
    ['meidu','#b6c5d6','#728baf','swirl','round','#9db3ba'],
    ['xuewa','#eadacb','#715a5e','snowshoe','slim','#91b9c8'],
    ['mengmai','#2e2932','#171b2c','solid','slim','#d3b883'],
    ['fanmao','#f1e6d5','#b88467','van','longhair','#b0bd94'],
    ['bosi','#ecd5bd','#ad938e','solid','persian','#9cac87'],
    ['wumao','#dda79b','#b4777c','sphynx','sphynx','#b5ca9b']
  ];
  const all=new Map(breeds.map((v,i)=>[v[0],{v,i}]));
  const cache=new Map(),pending=new Map(),activeThumbs=new Map();
  const prevDraw=CatArt.drawCat,prevThumb=CatArt.renderCatThumb;
  const circle=(x,y,r,fill,opacity=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
  function texture(look){
    const [id,base,dark,coat,shape,eye]=look.v;
    const fluffy=['longhair','maine','persian'].includes(shape);
    const lean=['slim','sphynx'].includes(shape);
    const flat=shape==='persian',fold=shape==='fold',short=shape==='short';
    const headW=lean?50:shape==='british'?61:flat?59:fluffy?56:54;
    const headH=flat?46:lean?50:49;
    const earY=fold?58:fluffy?32:lean?21:30;
    const flank=fluffy?61:lean?76:short?63:68;
    const back=fluffy?185:lean?173:179;
    const pawY=short?229:245;
    const tummyY=short?215:232;
    const body=`M 84 119 C ${flank} 128 ${flank-9} 181 72 ${tummyY} Q 76 ${pawY+7} 124 ${pawY+5} Q 176 ${pawY+5} ${back} ${tummyY} C ${back+10} 177 177 136 157 118 Q 120 100 84 119 Z`;
    const face=`M ${120-headW} 92 C ${120-headW-1} 61 91 48 120 48 C 153 48 ${120+headW+5} 69 ${120+headW} 101 Q ${120+headW-3} 133 120 144 Q ${120-headW+4} 131 ${120-headW} 92 Z`;
    const earLeft=fold?`M 73 74 Q 70 54 88 55 Q 99 61 100 75 Q 85 68 73 74 Z`
      :`M 75 76 Q ${lean?69:61} ${earY+13} 74 ${earY} Q 91 ${earY+2} 104 70 Z`;
    const earRight=fold?`M 140 76 Q 155 51 171 66 Q 173 75 163 78 Q 151 65 140 76 Z`
      :`M 138 70 Q 155 ${earY+1} 170 ${earY} Q 181 ${earY+22} 165 79 Z`;
    const catClip=`<clipPath id="fur"><path d="${body}"/><path d="${face}"/><path d="${earLeft}"/><path d="${earRight}"/></clipPath>`;
    const marks=[];
    const stripe=(x,y,z=1,opacity=.54)=>`<path d="M${x-8*z} ${y-4*z} Q${x} ${y-13*z} ${x+9*z} ${y+7*z}" fill="none" stroke="${dark}" stroke-width="${5*z}" opacity="${opacity}" stroke-linecap="round"/>`;
    if(['tabby','silver','gold','flame','swirl'].includes(coat)){
      marks.push(stripe(120,65,.68,.42),stripe(104,72,.45,.45),stripe(137,72,.45,.45));
      marks.push(stripe(87,111,.48,.32),stripe(159,108,.52,.36));
      for(let i=0;i<3;i++){marks.push(stripe(79+i*10,168+i*23,1.3,.27),stripe(170-i*10,179+i*19,1.05,.29));}
      if(coat==='swirl')marks.push(`<path d="M91 181 C114 154 147 176 133 204 C120 229 93 203 112 189" stroke="${dark}" stroke-width="7" opacity=".39" fill="none" stroke-linecap="round"/>`);
    }
    if(['tux','snowshoe','bicolor','van','calico'].includes(coat)){
      marks.push(`<path d="M 112 124 Q 119 117 130 124 C 155 148 150 184 128 214 Q 113 216 103 192 Q 97 158 112 124 Z" fill="#fff8ed" opacity=".94"/>`);
      marks.push(`<path d="M 87 ${pawY-25} Q 106 ${pawY-28} 109 ${pawY-4} L 110 ${pawY+5} L 83 ${pawY+5} Z M 146 ${pawY-25} Q 159 ${pawY-28} 164 ${pawY-4} L 162 ${pawY+5} L 142 ${pawY+5} Z" fill="#fff8ee" opacity=".86"/>`);
    }
    if(coat==='tux'||coat==='snowshoe'){
      marks.push(`<path d="M108 110 Q119 103 129 112 Q143 128 120 137 Q99 128 108 110 Z" fill="#fff9f0" opacity=".94"/>`);
    }
    if(coat==='point'||coat==='snowshoe'){
      marks.push(`<path d="M85 78 Q119 55 154 81 Q165 109 140 119 Q120 129 97 119 Q76 111 85 78 Z" fill="${dark}" opacity=".65"/>`);
      marks.push(`<path d="${earLeft} M 0 0 Z" fill="${dark}" opacity=".35"/><path d="${earRight}" fill="${dark}" opacity=".35"/>`);
    }
    if(coat==='calico'){
      marks.push(`<path d="M65 86 Q76 53 103 70 L117 105 Q107 134 83 126 Z" fill="#b46e4a" opacity=".91"/>`);
      marks.push(`<path d="M140 134 Q173 139 174 172 L151 206 Q128 202 137 171 Z" fill="#665562" opacity=".78"/>`);
      marks.push(`<path d="M75 194 Q97 185 105 217 L92 235 L66 231 Z" fill="#d7a16f" opacity=".78"/>`);
    }
    if(coat==='rosette'){
      for(let k=0;k<16;k++){const x=75+(k%4)*30+(k%2)*4,y=147+Math.floor(k/4)*22;marks.push(`<path d="M${x-7} ${y+2} Q${x-8} ${y-7} ${x+2} ${y-6} Q${x+14} ${y-4} ${x+7} ${y+7}" stroke="${dark}" stroke-width="4.3" opacity=".67" fill="none" stroke-linecap="round"/>`);}
      marks.push(stripe(120,62,.7,.6));
    }
    if(coat==='star'){
      for(let k=0;k<14;k++){const x=73+(k*41)%111,y=80+(k*59)%146;marks.push(`<path d="M${x} ${y-3} l1.2 2.4 3 1 -3 1.1 -1.2 3 -1.1 -3 -3 -1.1 3 -1 Z" fill="#e5e0ef" opacity="${.28+(k%3)*.12}"/>`);}
    }
    if(coat==='van'){
      marks.push(`<path d="M73 58 Q94 44 106 67 L103 91 L81 93 Z" fill="${dark}" opacity=".62"/>`);
      marks.push(`<path d="M150 57 Q175 48 171 78 L160 94 L140 91 Z" fill="${dark}" opacity=".51"/>`);
    }
    if(coat==='ticked'){
      for(let k=0;k<22;k++){const x=77+(k*37)%96,y=150+(k*23)%74;marks.push(`<path d="M${x-3} ${y} l6 4" stroke="${dark}" opacity=".27" stroke-width="2.4" stroke-linecap="round"/>`);}
    }
    if(coat==='smoke')marks.push(`<path d="M78 171 Q120 144 167 172 Q147 187 119 182 Q91 187 78 171Z" fill="#e0d9e8" opacity=".43"/>`);
    // Sphynx adult has deliberately different facial/skin anatomy and fine folds.
    if(coat==='sphynx'){
      marks.push(`<path d="M81 94 Q96 82 108 92 M131 92 Q143 79 159 94 M75 147 Q94 163 81 176 M161 146 Q151 165 161 181" stroke="${dark}" stroke-width="2.2" opacity=".40" fill="none"/>`);
    }
    const tuft=fluffy?`<path d="M78 116 Q58 126 56 145 L72 141 Q58 156 69 160 L86 148 M163 116 Q186 126 183 145 L169 142 Q180 160 168 162 L155 150" fill="${base}" stroke="${dark}" stroke-width="1.4" opacity=".85"/>`:'';
    const tail=lean?`M167 215 C220 220 219 143 204 132 C194 124 190 137 198 141`:
      `M175 216 C221 227 235 174 211 151 Q194 136 199 153`;
    const chest=fluffy?`<path d="M105 130 Q118 122 133 130 L146 169 L139 178 L131 171 L125 190 L117 172 L107 180 L105 162 L96 166 Z" fill="#fff9ec" opacity=".34"/>`:
      `<path d="M111 134 Q120 129 131 134 Q139 160 121 187 Q102 167 111 134Z" fill="#fff9ec" opacity=".23"/>`;
    const eyesY=flat?104:100,eyesDx=lean?26:25;
    const eyeArt=[-1,1].map(sign=>{
      const cx=120+sign*eyesDx;
      return `<path d="M${cx-14} ${eyesY} Q${cx} ${eyesY-12} ${cx+14} ${eyesY} Q${cx} ${eyesY+11} ${cx-14} ${eyesY}Z" fill="#faf7ed" stroke="${dark}" stroke-width="2.3" stroke-opacity=".76"/>
        <ellipse cx="${cx}" cy="${eyesY+1}" rx="7" ry="9.3" fill="${eye}"/>
        <ellipse cx="${cx}" cy="${eyesY+1}" rx="2.1" ry="8" fill="#292f38"/>
        ${circle(cx-2.2,eyesY-3,2.25,'#fffdf3',.94)}`;
    }).join('');
    const whisks=[-1,1].map(sign=>{
      const ax=120+sign*18, end=120+sign*94;
      return `<path d="M${ax} 124 Q${120+sign*55} 119 ${end} 117 M${ax} 128 Q${120+sign*56} 136 ${end} 145" stroke="#706b70" stroke-opacity=".36" fill="none" stroke-width="1.65" stroke-linecap="round"/>`;
    }).join('');
    const furStrokes=fluffy?`<path d="M86 157 Q81 178 91 192 M160 155 Q172 178 161 191 M101 183 Q107 194 102 209 M143 184 Q136 194 140 209" fill="none" stroke="#fff9ee" stroke-opacity=".41" stroke-width="3.2" stroke-linecap="round"/>`:'';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="270" viewBox="0 0 240 270">
      <defs>
        <linearGradient id="furColor" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fff6e9"/><stop offset=".22" stop-color="${base}"/>
          <stop offset=".76" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/>
        </linearGradient>
        <linearGradient id="fShade" x1=".15" x2=".9" y1="0" y2="1">
          <stop offset="0" stop-color="${base}"/><stop offset=".64" stop-color="${base}"/>
          <stop offset="1" stop-color="${dark}"/>
        </linearGradient>
        <radialGradient id="faceLight" cx=".41" cy=".24" r=".84">
          <stop offset="0" stop-color="#fff7e9" stop-opacity=".75"/>
          <stop offset=".45" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/>
        </radialGradient>
        <filter id="ink" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="${look.i+3}" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.7" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".11" numOctaves="3" seed="${look.i+17}" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".13"/></feComponentTransfer></filter>
        ${catClip}
      </defs>
      <path d="${tail}" stroke="${dark}" stroke-opacity=".24" stroke-width="${fluffy?31:21}" fill="none" stroke-linecap="round"/>
      <path d="${tail}" stroke="url(#fShade)" stroke-width="${fluffy?26:16}" fill="none" stroke-linecap="round"/>
      <path d="${body}" fill="url(#furColor)" stroke="${dark}" stroke-opacity=".27" stroke-width="2.8" filter="url(#ink)"/>
      ${chest}
      <path d="${earLeft}" fill="${base}" stroke="${dark}" stroke-opacity=".38" stroke-width="2.4"/>
      <path d="${earRight}" fill="${base}" stroke="${dark}" stroke-opacity=".38" stroke-width="2.4"/>
      <path d="M81 71 Q84 50 91 58 L99 75Z M150 73 Q160 53 169 63 L164 79Z" fill="#dfa4ae" opacity="${fold?.34:.68}"/>
      ${tuft}
      <path d="${face}" fill="url(#faceLight)" stroke="${dark}" stroke-opacity=".34" stroke-width="2.5" filter="url(#ink)"/>
      <g clip-path="url(#fur)">${marks.join('')}</g>
      ${furStrokes}
      <path d="M102 122 Q120 131 138 122 Q132 147 120 150 Q106 146 102 122" fill="#fff3e9" opacity=".35"/>
      ${eyeArt}
      <path d="M112 119 Q120 124 128 119 Q122 128 120 128 Q117 128 112 119Z" fill="#b77681"/>
      <path d="M120 127 Q119 135 113 135 M120 127 Q123 136 129 135" fill="none" stroke="${dark}" stroke-opacity=".78" stroke-width="1.6" stroke-linecap="round"/>
      ${whisks}
      <path d="M91 180 Q85 211 87 ${pawY-2} Q99 ${pawY+7} 112 ${pawY-1} L113 181 M141 181 L142 ${pawY-1} Q158 ${pawY+7} 168 ${pawY-3} Q163 201 155 179" fill="none" stroke="${dark}" stroke-opacity=".33" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M88 ${pawY-9} Q93 ${pawY-17} 101 ${pawY-7} M145 ${pawY-9} Q151 ${pawY-17} 157 ${pawY-7}" fill="none" stroke="${dark}" stroke-opacity=".39" stroke-width="1.65" stroke-linecap="round"/>
      <g clip-path="url(#fur)"><rect x="38" y="18" width="174" height="236" filter="url(#paper)" opacity=".23"/></g>
      <path d="M98 75 Q112 59 128 64 M79 151 Q83 142 90 141 M154 145 Q168 150 174 164" fill="none" stroke="#fff8eb" stroke-width="4.3" opacity=".21" stroke-linecap="round"/>
    </svg>`;
    return svg;
  }
  function imageFor(id){
    const look=all.get(id)||all.get('xiaohui');
    if(cache.has(look.v[0]))return cache.get(look.v[0]);
    const img=new Image();
    const entry={img,ready:false,failed:false,look};
    cache.set(look.v[0],entry);
    img.onload=()=>{
      entry.ready=img.naturalWidth>0;
      for(const [canvas,item] of pending){
        if(item[0]===look.v[0]){
          pending.delete(canvas);
          if(canvas.isConnected!==false)drawThumb(canvas,item[1],item[2]);
        }
      }
      window.dispatchEvent(new Event('cat-bond-adult-art-ready'));
    };
    img.onerror=()=>{
      entry.failed=true;
      for(const [canvas,item] of pending)if(item[0]===look.v[0]){
        pending.delete(canvas);if(canvas.isConnected!==false)prevThumb(canvas,item[1]);
      }
    };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(texture(look));
    return entry;
  }
  function draw(ctx,x,y,o={}){
    const gr=o.growth;
    if(!gr||gr.stage<1)return prevDraw(ctx,x,y,o);
    const entry=imageFor(o.species?.id);
    if(!entry.ready)return prevDraw(ctx,x,y,o);
    const t=o.t||0,pose=o.pose||'idle';
    const moving=pose==='walk'||pose==='run'||pose==='dash';
    const phase=o.stride===undefined?t*7:o.stride;
    const hop=pose==='play'?Math.abs(Math.sin(t*4.8))*3.5:0;
    const scale=(o.scale||1)*(gr.scale||1);
    const face=o.face===-1?-1:1;
    ctx.save();
    ctx.translate(x,y);ctx.scale(scale*face,scale);
    if(gr.aura){
      const gl=ctx.createRadialGradient(0,-19,2,0,-19,54);
      gl.addColorStop(0,'rgba(255,255,255,0)');
      gl.addColorStop(.53,gr.aura+'22');gl.addColorStop(1,gr.aura+'00');
      ctx.fillStyle=gl;ctx.fillRect(-56,-75,112,118);
    }
    ctx.fillStyle='rgba(72,62,61,.12)';
    ctx.beginPath();ctx.ellipse(0,32,26,4.2,0,0,Math.PI*2);ctx.fill();
    ctx.translate(moving?Math.sin(phase)*.7:0,-hop+(moving?Math.abs(Math.sin(phase*2))*.5:0));
    ctx.rotate(moving?Math.sin(phase)*.018:Math.sin(t*1.35)*.008);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(entry.img,-38,-69,76,104);
    if(gr.gem){
      ctx.fillStyle=gr.gemColor||'#cbd4ff';ctx.font='10px system-ui';
      ctx.textAlign='center';ctx.fillText('✦',29,-54);
    }
    if(gr.sparkle){
      ctx.fillStyle=gr.gemColor||'#e8ccaa';ctx.font='11px system-ui';
      ctx.fillText('✧',-31,-40);
    }
    ctx.restore();
  }
  function drawThumb(canvas,species,cat){
    if(!cat||(Number(cat.stage)||0)<1){activeThumbs.delete(canvas);return prevThumb(canvas,species);}
    activeThumbs.set(canvas,[species,cat]);
    const entry=imageFor(species?.id);
    if(!entry.ready){
      if(!entry.failed)pending.set(canvas,[species?.id,species,cat]);
      return prevThumb(canvas,species);
    }
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const rect=canvas.getBoundingClientRect?.();
    const w=Number(canvas.dataset?.thumbW)||(rect?.width>8?rect.width:canvas.width);
    const h=Number(canvas.dataset?.thumbH)||(rect?.height>8?rect.height:canvas.height);
    const ratio=Math.max(1,Math.min(3,window.devicePixelRatio||1));
    canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));
    if(canvas.dataset){canvas.dataset.thumbW=String(w);canvas.dataset.thumbH=String(h);}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    const gr=window.Growth?.visual(cat)||{stage:1,scale:1.07};
    const scl=Math.min(w/88,h/119)*1.02;
    draw(ctx,w/2,h*.67,{species,scale:scl,pose:'sit',face:1,t:0,growth:gr});
  }
  // Kitten atlas decoding can repaint an adult portrait after SVG decoding.
  // Reassert the mature illustration after BOTH pipelines finish.
  window.addEventListener('cat-bond-illustrations-ready',()=>{
    for(const [canvas,[sp,cat]] of activeThumbs){
      if(canvas.isConnected===false){activeThumbs.delete(canvas);continue;}
      drawThumb(canvas,sp,cat);
    }
  });
  CatArt.drawCat=draw;
  CatArt.renderCatThumb=drawThumb;
  window.CatBondAdultArt={
    breedCount:breeds.length,
    get loadedCount(){return [...cache.values()].filter(e=>e.ready).length},
    get failedCount(){return [...cache.values()].filter(e=>e.failed).length},
    speciesIds:breeds.map(v=>v[0]),
    drawAdult:draw,
    preview(id){return imageFor(id).img}
  };
})();
