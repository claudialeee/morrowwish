/* Cat Bond illustrated scenery: one coherent courtyard for battles and exploration.
   Scenery is decorative only. Canvas collision, camera and battle logic stay unchanged. */
(()=>{
  'use strict';
  const img = new Image();
  let ready=false;
  img.onload=()=>{ ready=img.naturalWidth>0; window.dispatchEvent(new Event('cat-bond-scenery-ready')); };
  img.onerror=()=>{ready=false;};
  img.src='assets/battle-garden.svg?v=2';
  const circle=(ctx,x,y,rx,ry,color)=>{
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  };
  function cover(ctx,W,H){
    if(!ready)return false;
    const ir=img.naturalWidth/img.naturalHeight,cr=W/H;
    const dw=cr>ir?W:H*ir,dh=cr>ir?W/ir:H;
    ctx.drawImage(img,(W-dw)/2,(H-dh)/2,dw,dh);
    return true;
  }
  function petals(ctx,W,H,t,count){
    const a=Math.min(1,Math.max(0,W/900));
    ctx.save();
    for(let i=0;i<count;i++){
      const sx=((i*139.7+t*(6+i%4)*(.7+a))%(W+50)+W+50)%(W+50)-25;
      const sy=((i*79.3+t*(11+i%3))%(H+60)+H+60)%(H+60)-30;
      ctx.save();ctx.translate(sx,sy);ctx.rotate(t*.4+i);
      circle(ctx,0,0,2.2+(i%3),1.3,'rgba(255,233,224,.55)');ctx.restore();
    }
    ctx.restore();
  }
  function fallback(ctx,W,H,t){
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#e0ecf0');sky.addColorStop(.55,'#fff0df');sky.addColorStop(1,'#c1d1b1');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#bfd3b6';
    ctx.beginPath();ctx.moveTo(0,H*.36);
    ctx.quadraticCurveTo(W*.2,H*.3,W*.45,H*.39);
    ctx.quadraticCurveTo(W*.8,H*.31,W,H*.36);
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    ctx.strokeStyle='#bea98b';ctx.lineWidth=6;
    for(let i=0;i<=16;i++){
      const x=i*W/16;ctx.beginPath();ctx.moveTo(x,H*.43);ctx.lineTo(x,H*.54);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(0,H*.49);ctx.lineTo(W,H*.49);ctx.stroke();
    const floor=ctx.createLinearGradient(0,H*.45,0,H);
    floor.addColorStop(0,'#fcf2e3');floor.addColorStop(1,'#d8c2ad');
    ctx.fillStyle=floor;ctx.beginPath();
    ctx.ellipse(W*.5,H*.77,W*.53,H*.32,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(168,135,108,.14)';ctx.lineWidth=2;
    for(let i=0;i<22;i++){
      const x=(i*127+30)%W,y=H*.52+(i*79)%(H*.45);
      circle(ctx,x,y,20+(i%5)*7,8+(i%3)*4,'rgba(255,255,255,.16)');
    }
  }
  // Distinct hand-authored animated landmarks, anchored in the scrollable world.
  function sceneIdentity(ctx,w,h,t,theme,cam){
    if(!theme?.region||theme.region==='home')return;
    ctx.save();if(cam)ctx.translate(-cam.x,-cam.y);
    const id=theme.region,sc=Math.max(.5,Math.min(1.2,w/1200));
    const dot=(x,y,rx,ry,c)=>circle(ctx,x,y,rx*sc,ry*sc,c);
    if(id==='sakura'){
      const gx=w*.56,gy=h*.62;
      ctx.strokeStyle='#926179';ctx.lineWidth=25*sc;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(gx,gy);ctx.quadraticCurveTo(gx-55*sc,gy-160*sc,gx-35*sc,gy-315*sc);ctx.stroke();
      for(let i=0;i<7;i++)dot(gx+Math.cos(i*2.4)*115*sc,gy-300*sc+Math.sin(i*2.4)*70*sc,95,60,
        i%2?'rgba(255,185,211,.85)':'rgba(246,210,226,.9)');
      for(let i=0;i<27;i++){
        const x=((i*139+t*(15+i%4))%(w+100)+w+100)%(w+100);
        const y=((i*93+t*(20+i%3))%(h+80)+h+80)%(h+80);
        dot(x,y,4,2,'rgba(255,199,215,.83)');
      }
    }else if(id==='creek'){
      ctx.lineCap='round';ctx.lineJoin='round';
      for(let layer=0;layer<3;layer++){
        ctx.beginPath();
        for(let i=0;i<=28;i++){
          const x=i*w/28,y=h*.73+Math.sin(i*.55+t*.55)*23*sc-layer*11*sc;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.strokeStyle=layer===0?'rgba(51,140,184,.56)':layer===1?'rgba(130,206,233,.7)':'rgba(238,251,248,.8)';
        ctx.lineWidth=(72-layer*25)*sc;ctx.stroke();
      }
      for(let i=0;i<12;i++)dot((i*157+t*14)%w,h*.7+Math.sin(i*1.6+t)*16,10,2,'rgba(244,255,253,.7)');
    }else if(id==='volcano'){
      ctx.fillStyle='rgba(93,66,61,.7)';
      ctx.beginPath();ctx.moveTo(w*.56,h*.77);ctx.lineTo(w*.72,h*.22);
      ctx.lineTo(w*.78,h*.22);ctx.lineTo(w*.96,h*.77);ctx.fill();
      dot(w*.75,h*.23,60,17,'rgba(255,167,84,.7)');
      ctx.strokeStyle='rgba(255,124,47,.78)';ctx.lineWidth=25*sc;
      ctx.beginPath();ctx.moveTo(w*.75,h*.26);ctx.bezierCurveTo(w*.66,h*.45,w*.88,h*.48,w*.78,h*.77);ctx.stroke();
      for(let i=0;i<20;i++){
        const x=w*.65+(i*53%170)*sc,y=h*.57-((i*47+t*(19+i%4))%(h*.5));
        dot(x,y,2+i%4,3,'rgba(255,166,67,.8)');
      }
    }else if(id==='ruins'){
      for(let i=0;i<4;i++){
        const x=w*(.3+i*.16),y=h*.6;
        ctx.fillStyle='rgba(156,157,199,.72)';
        ctx.fillRect(x-16*sc,y-205*sc,32*sc,205*sc);
        dot(x,y-205*sc,24,10,'rgba(223,216,249,.8)');
      }
      ctx.strokeStyle='rgba(186,185,235,.6)';ctx.lineWidth=17*sc;
      ctx.beginPath();ctx.arc(w*.54,h*.37,110*sc,Math.PI,2*Math.PI);ctx.stroke();
      dot(w*.81,h*.18,35,35,'rgba(244,244,210,.5)');
      for(let i=0;i<30;i++)dot((i*131+t*(3+i%5))%w,(i*97)%Math.max(1,h*.6),2,2,'rgba(242,234,255,.84)');
    }
    ctx.restore();
  }
  function drawBattle(ctx,W,H,t,theme){
    if(window.CatBondPaintedRegions?.drawBattle?.(ctx,W,H,t,theme))return true;
    if(!cover(ctx,W,H))fallback(ctx,W,H,t);
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'rgba(255,247,228,.14)');
    sky.addColorStop(.65,'rgba(255,246,237,0)');
    sky.addColorStop(1,'rgba(236,206,186,.12)');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Region distinction without masking the illustration with a solid color.
    if(theme?.sky1 && /^(#1|#2)/.test(theme.sky1)){
      ctx.fillStyle='rgba(42,47,79,.15)';ctx.fillRect(0,0,W,H);
    }
    petals(ctx,W,H,t,theme?.region==='sakura'?32:16);
    sceneIdentity(ctx,W,H,t,theme,null);
    return true;
  }
  function drawRegion(ctx,W,H,t,theme,cam,worldSize){
    // Every region has its own authored, world-anchored art; no shared tinted garden.
    if(window.CatBondPaintedRegions?.draw?.(ctx,W,H,t,theme,cam,worldSize))return true;
    // Legacy fallback only for browsers without Canvas2D support.
    if(cam&&worldSize){
      ctx.save();ctx.translate(-cam.x,-cam.y);
      if(!cover(ctx,worldSize.width,worldSize.height))fallback(ctx,worldSize.width,worldSize.height,t);
      ctx.restore();
    }else if(!cover(ctx,W,H))fallback(ctx,W,H,t);
    const faded=ctx.createLinearGradient(0,0,0,H);
    faded.addColorStop(0,'rgba(237,226,214,.08)');
    faded.addColorStop(1,'rgba(128,160,125,.08)');
    ctx.fillStyle=faded;ctx.fillRect(0,0,W,H);
    if(theme?.sky1 && /^(#1|#2)/.test(theme.sky1)){
      ctx.fillStyle='rgba(36,39,71,.17)';ctx.fillRect(0,0,W,H);
    }
    petals(ctx,W,H,t,theme?.region==='sakura'?24:10);
    sceneIdentity(ctx,worldSize?.width||W,worldSize?.height||H,t,theme,cam);
    return true;
  }
  function accentYard(ctx,W,H,t){
    // Sparse, translucent foreground touches. Keep the walking area unobstructed.
    ctx.save();
    for(let s of [-1,1]){
      const xx=s<0?16:W-16,yy=H*.75;
      const glow=ctx.createRadialGradient(xx,yy,3,xx,yy,60);
      glow.addColorStop(0,'rgba(251,224,181,.17)');glow.addColorStop(1,'rgba(251,224,181,0)');
      circle(ctx,xx,yy,60,65,glow);
      for(let j=0;j<7;j++){
        const x=xx-s*(8+j*12),y=H*(.69+.04*(j%3));
        if(x<6||x>W-6)continue;
        ctx.strokeStyle='rgba(98,137,95,.27)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x,y+9);ctx.quadraticCurveTo(x-4,y+3,x+2,y);ctx.stroke();
        circle(ctx,x+2,y,2.5+j%3,2.5+j%3,j%2?'rgba(250,222,182,.58)':'rgba(246,199,209,.60)');
        circle(ctx,x+2,y,.85,.85,'rgba(205,160,95,.72)');
      }
    }
    ctx.restore();
  }
  window.CatBondScenery={drawBattle,drawRegion,accentYard};
})();