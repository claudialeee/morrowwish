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
  function drawBattle(ctx,W,H,t,theme){
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
    petals(ctx,W,H,t,16);
    return true;
  }
  function drawRegion(ctx,W,H,t,theme){
    if(!cover(ctx,W,H))fallback(ctx,W,H,t);
    const faded=ctx.createLinearGradient(0,0,0,H);
    faded.addColorStop(0,'rgba(237,226,214,.08)');
    faded.addColorStop(1,'rgba(128,160,125,.08)');
    ctx.fillStyle=faded;ctx.fillRect(0,0,W,H);
    if(theme?.sky1 && /^(#1|#2)/.test(theme.sky1)){
      ctx.fillStyle='rgba(36,39,71,.17)';ctx.fillRect(0,0,W,H);
    }
    petals(ctx,W,H,t,10);
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