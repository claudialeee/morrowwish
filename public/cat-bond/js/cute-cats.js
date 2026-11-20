/* Cat Bond: expressive storybook kittens. Shared renderer for every breed, scene, and thumbnail. */
(function () {
  'use strict';
  if (!window.CatArt) return;
  const api = window.CatArt;
  const palettes = api.CAT_PALETTES;
  const TAU = Math.PI * 2;
  function rgb(hex) {
    const raw = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#e9cba7';
    const num = parseInt(raw.slice(1),16);
    return [num>>16&255,num>>8&255,num&255];
  }
  function blend(hex, other, ratio) {
    const a=rgb(hex), b=rgb(other);
    return '#'+a.map((v,i)=>Math.round(v*(1-ratio)+b[i]*ratio).toString(16).padStart(2,'0')).join('');
  }
  const pale = (c,n) => blend(c,'#ffffff',n);
  const dark = (c,n) => blend(c,'#55473f',n);
  function ellipse(ctx,x,y,rx,ry,fill,stroke,sw) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw||1;ctx.stroke();}
  }
  function fur(ctx,x,y,rx,ry,c) {
    const g=ctx.createRadialGradient(x-rx*.4,y-ry*.5,1,x,y,Math.max(rx,ry)*1.55);
    g.addColorStop(0,pale(c,.42));g.addColorStop(.55,pale(c,.12));g.addColorStop(1,dark(c,.13));
    ellipse(ctx,x,y,rx,ry,g,dark(c,.23),.9);
  }
  function curve(ctx,pts,color,width) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
    if(pts.length===6)ctx.quadraticCurveTo(pts[2],pts[3],pts[4],pts[5]);
    for(let i=2;i+5<pts.length;i+=6)ctx.bezierCurveTo(pts[i],pts[i+1],pts[i+2],pts[i+3],pts[i+4],pts[i+5]);
    ctx.stroke();
  }
  function heart(ctx,x,y,r,c) {
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y+r);
    ctx.bezierCurveTo(x-1.5*r,y+.1*r,x-r,y-r,x,y-.45*r);
    ctx.bezierCurveTo(x+r,y-r,x+1.5*r,y+.1*r,x,y+r);ctx.fill();
  }
  function ear(ctx,side,p,point,fold,tuft) {
    const x=side*19;
    ctx.save();ctx.translate(x,-27);ctx.scale(side,1);
    const tip=fold?-11:-20;
    ctx.beginPath();ctx.moveTo(-12,8);
    ctx.quadraticCurveTo(-13,tip+8,0,tip);
    ctx.quadraticCurveTo(4,tip-4,12,7);
    ctx.quadraticCurveTo(1,11,-12,8);ctx.closePath();
    ctx.fillStyle=p;ctx.fill();ctx.strokeStyle=dark(p,.26);ctx.lineWidth=1.4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-6,4);ctx.quadraticCurveTo(-5,tip+9,0,tip+7);
    ctx.quadraticCurveTo(6,tip+9,6,5);ctx.closePath();
    ctx.fillStyle=point;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.56)';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-1,tip+11);ctx.stroke();
    if(tuft&&!fold)curve(ctx,[0,tip+4,-2,tip-5,4,tip-7],pale(p,.3),1.8);
    ctx.restore();
  }
  function markings(ctx,pattern,pal,point,part) {
    if(part==='body'){
      if(pattern==='tabby'||pattern==='silver'){
        for(let s of [-1,1])for(let j=0;j<2;j++){
          curve(ctx,[s*15,6+j*10,s*10,8+j*10,s*13,11+j*10],pal.mark,2.5);
        }
      }
      if(pattern==='spotted') for(let [x,y] of [[-11,10],[10,12],[-7,23],[8,24]]) ellipse(ctx,x,y,2.4,2,pal.mark);
      if(pattern==='calico'){
        ellipse(ctx,-12,8,8,10,'#473e42');ellipse(ctx,12,20,9,8,'#e99a52');
      }
      if(pattern==='bicolor'||pattern==='tuxedo'){
        ellipse(ctx,0,18,10,14,pal.belly);
      }
      if(pattern==='pointed')ellipse(ctx,0,27,8,6,pale(point,.27));
    }else{
      if(pattern==='tabby'||pattern==='silver'){
        for(let i=-1;i<=1;i++)curve(ctx,[i*5,-28,i*6,-24,i*4,-20,i*3,-18],pale(pal.mark,.1),2.6);
        for(let side of [-1,1])for(let j=0;j<2;j++)curve(ctx,[side*23,-12+j*6,side*19,-10+j*6,side*19,-7+j*6,side*22,-4+j*6],pal.mark,2);
      }
      if(pattern==='calico'){
        ellipse(ctx,-14,-21,14,13,'#4b3d40');ellipse(ctx,13,-21,13,12,'#e79750');
        ellipse(ctx,-1,-10,5,15,pal.belly);
      }
      if(pattern==='pointed'){
        ellipse(ctx,0,-9,20,16,blend(point,pal.body,.12));
      }
      if(pattern==='bicolor'){
        ellipse(ctx,-15,-20,13,10,blend(pal.mark,'#ce995e',.15));
        ellipse(ctx,4,-11,8,16,pal.belly);
      }
      if(pattern==='tuxedo'){
        ctx.fillStyle=pal.belly;ctx.beginPath();ctx.moveTo(-4,-29);
        ctx.quadraticCurveTo(-1,-18,-7,-9);ctx.quadraticCurveTo(0,14,7,-9);
        ctx.quadraticCurveTo(1,-18,4,-29);ctx.closePath();ctx.fill();
      }
    }
  }
  function eyes(ctx,color,mood,t) {
    const close=mood==='sleepy'||((t*.56)%5>4.88);
    const smiling=mood==='love';
    for(let s of [-1,1]){
      const x=s*10,y=-11;
      if(close||smiling){
        curve(ctx,[x-5,y+1,x-2,y-3,x+2,y-3,x+5,y+1],'#56443e',2.1);
      }else{
        ellipse(ctx,x,y,6.9,7.9,'#fffdf5',dark(color,.32),1.3);
        const g=ctx.createLinearGradient(x,y-7,x,y+7);
        g.addColorStop(0,pale(color,.25));g.addColorStop(1,dark(color,.12));
        ellipse(ctx,x,y+1,5.1,6.5,g);
        ellipse(ctx,x+.6,y+1,3.25,5.25,'#2f3035');
        ellipse(ctx,x-1.9,y-2.9,2.4,2.6,'#fff');
        ellipse(ctx,x+3,y+3,1.2,1.3,'rgba(255,255,255,.8)');
      }
    }
  }
  function face(ctx,pal,color,mood,t){
    ellipse(ctx,-8.3,1,10,7,pale(pal.belly,.15));
    ellipse(ctx,8.3,1,10,7,pale(pal.belly,.15));
    for(const s of [-1,1]){
      const g=ctx.createRadialGradient(s*17,2,0,s*17,2,6.2);
      g.addColorStop(0,'rgba(247,155,154,.48)');g.addColorStop(1,'rgba(247,155,154,0)');
      ellipse(ctx,s*17,2,6.2,5,g);
    }
    eyes(ctx,color,mood,t);
    ctx.fillStyle='#e99599';ctx.beginPath();ctx.moveTo(-3,1);
    ctx.quadraticCurveTo(0,0,3,1);ctx.quadraticCurveTo(0,5,0,5);ctx.closePath();ctx.fill();
    const happy=mood==='happy'||mood==='love';
    if(happy){
      ellipse(ctx,0,9,4.8,3.8,'#81464d');ellipse(ctx,0,11,2.5,1.4,'#f2a0a5');
    }else{
      curve(ctx,[0,4,-1,7,-3,8,-5,6],'#795d58',1.25);
      curve(ctx,[0,4,1,7,3,8,5,6],'#795d58',1.25);
    }
    for(const s of [-1,1]){
      ctx.strokeStyle='rgba(103,83,73,.56)';ctx.lineWidth=.9;ctx.lineCap='round';
      for(let j=0;j<2;j++){
        const y=2+j*4;
        ctx.beginPath();ctx.moveTo(s*16,y);ctx.quadraticCurveTo(s*26,y-3,s*32,y-3+j*4);ctx.stroke();
      }
      ellipse(ctx,s*14,3,0.75,0.75,dark(pal.body,.38));
    }
  }
  const ribbons={
    tangyuan:'#d96e65',doudou:'#8eb6a0',xiaohui:'#a29bc9',moqiu:'#9c8cba',
    nainai:'#e0b09e',nietu:'#a5bda1',niuniu:'#8da2c9',sanhua:'#a9be88',
    lixiao:'#7094bd',lanbao:'#d6ac6c',dundun:'#b6a2cb',yunduo:'#d79eb0',
    zherdd:'#afbb8d',qisi:'#ce9c65',duanduan:'#b6b19f',jinjc:'#d4b66f',
    xianluo:'#a29ac1',yinghua:'#e69da9',senlin:'#9bad84',youling:'#a997cb',
    nuowei:'#b6a681',baomao:'#cba273',jinwu:'#dfa77a',yuelian:'#a5badc',xingchen:'#b9acdb'
  };
  function accessory(ctx,id,rarity){
    const c=ribbons[id]||'#b29eb2';
    ellipse(ctx,0,13,12,3.5,dark(c,.08));
    ctx.fillStyle=c;
    for(const s of [-1,1]){
      ctx.beginPath();ctx.moveTo(0,14);ctx.quadraticCurveTo(s*10,8,s*10,15);
      ctx.quadraticCurveTo(s*10,20,0,16);ctx.closePath();ctx.fill();
    }
    ellipse(ctx,0,15,2.2,2.4,pale(c,.26));
    ellipse(ctx,0,20,3.3,3.5,rarity==='SSR'?'#f6d18c':rarity==='SR'?'#c7b6df':'#f4d7a4',dark(c,.25),.5);
    ellipse(ctx,-1,19,1,1,'#fff8e7');
  }
  function tail(ctx,pal,pattern,fluffy,t,pose){
    const wag=Math.sin(t*(pose==='play'?6:2.6))*.15;
    ctx.save();ctx.translate(-14,21);ctx.rotate(wag);
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-28,-3,-35,-33,-17,-39);
    ctx.strokeStyle=dark(pal.body,.2);ctx.lineWidth=fluffy?16:12;ctx.lineCap='round';ctx.stroke();
    ctx.strokeStyle=pal.body;ctx.lineWidth=fluffy?13:10;ctx.stroke();
    ellipse(ctx,-17,-39,fluffy?8:5.5,fluffy?8:6,pattern==='pointed'?pal.point:pal.body);
    if(pattern==='tabby'||pattern==='silver'){
      ctx.strokeStyle=pal.mark;ctx.lineWidth=2.8;
      for(const [xx,yy] of [[-32,-18],[-29,-29],[-18,-39]]){
        ctx.beginPath();ctx.moveTo(xx-2,yy-3);ctx.lineTo(xx+4,yy+2);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawCuteCat(ctx,x,y,opts){
    const o=opts||{};const sp=o.species||{};
    const pal=palettes[o.palette||sp.palette]||palettes.orange;
    const pattern=o.pattern||sp.pattern||'solid';
    const point=o.point||sp.point||pal.point;
    const fluffy=o.fluffy!==undefined?o.fluffy:!!sp.fluffy;
    const short=o.short!==undefined?o.short:!!sp.short;
    const ears=o.ears||sp.ears||'normal';
    const color=o.eyeColor||sp.eyeColor||'#a18258';
    const gr=o.growth||null;
    const scale=(o.scale||1)*(gr?.scale||1);
    const flip=o.face===-1?-1:1;
    const t=o.t||0;const pose=o.pose||'idle';const mood=o.mood||'neutral';
    const hop=pose==='play'?Math.abs(Math.sin(t*7))*5:0;
    const bob=pose==='walk'?Math.abs(Math.sin(t*9))*2:Math.sin(t*2)*.55;
    ctx.save();ctx.translate(x,y);
    if(gr?.aura){
      const g=ctx.createRadialGradient(0,0,5,0,0,52);
      g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,gr.aura+'36');g.addColorStop(1,gr.aura+'00');
      ellipse(ctx,0,0,53,53,g);
    }
    ctx.scale(flip*scale,scale);
    ellipse(ctx,0,36,fluffy?27:24,5.5,'rgba(65,59,48,.13)');
    ctx.translate(0,-hop-bob);
    const sleeping=pose==='sleep',loaf=pose==='loaf',belly=pose==='belly';
    if(belly)ctx.rotate(Math.sin(t*4)*.07);
    tail(ctx,pal,pattern,fluffy,t,pose);
    if(fluffy){
      for(let s of [-1,1])for(let j=0;j<3;j++){
        ellipse(ctx,s*(15+j*1.4),15+j*5,8,7,pale(pal.body,.05));
      }
    }
    fur(ctx,0,17,short?22:19,loaf||sleeping?16:21,pal.body);
    ctx.save();ctx.beginPath();ctx.ellipse(0,17,short?22:19,loaf||sleeping?16:21,0,0,TAU);ctx.clip();
    markings(ctx,pattern,pal,point,'body');ctx.restore();
    ellipse(ctx,0,24,11,12,pale(pal.belly,.15));
    if(!loaf&&!sleeping){
      const feet=pose==='walk'?Math.sin(t*9)*3:0;
      for(const side of [-1,1]){
        fur(ctx,side*12,33+side*feet,8,5.5,(pattern==='tuxedo'||pattern==='bicolor'||pattern==='pointed')?pal.belly:pal.body);
        for(let i=-1;i<=1;i++){
          ctx.strokeStyle='rgba(103,75,64,.26)';ctx.lineWidth=.75;
          ctx.beginPath();ctx.moveTo(side*12+i*2,35+side*feet);ctx.lineTo(side*12+i*2,37+side*feet);ctx.stroke();
        }
      }
    }
    const headY=loaf? -3 : sleeping ? -2:-9;
    ctx.save();ctx.translate(0,headY);
    ear(ctx,-1,pattern==='pointed'?point:pal.body,earColor(pal),ears==='fold',ears==='tufted');
    ear(ctx,1,pattern==='pointed'?point:pal.body,earColor(pal),ears==='fold',ears==='tufted');
    if(fluffy){for(let side of [-1,1]){
      ellipse(ctx,side*22,-2,6.8,8,pal.body);
      ellipse(ctx,side*20,6,8,7,pale(pal.body,.1));
    }}
    fur(ctx,0,-10,25,22,pal.body);
    ctx.save();ctx.beginPath();ctx.ellipse(0,-10,25,22,0,0,TAU);ctx.clip();
    markings(ctx,pattern,pal,point,'head');ctx.restore();
    face(ctx,pal,color,sleeping?'sleepy':mood,t);
    ctx.restore();
    if(!loaf&&!sleeping){
      const pawLift=pose==='play'?Math.sin(t*7)*4:0;
      for(const side of [-1,1]){
        const raise=side===1&&pose==='play'?-19-pawLift:0;
        const pawColor=pattern==='pointed'?point:(pattern==='tuxedo'||pattern==='bicolor')?pal.belly:pal.body;
        ctx.strokeStyle=dark(pawColor,.1);ctx.lineWidth=10;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(side*15,14);ctx.quadraticCurveTo(side*20,22+raise,side*14,31+raise);ctx.stroke();
        fur(ctx,side*14,31+raise,7.5,5.5,pawColor);
        if(raise<0)ellipse(ctx,side*14,32+raise,3.2,2.4,'#efb2b1');
      }
    }
    if(!sleeping)accessory(ctx,sp.id||'',sp.rarity||'N');
    if(mood==='love')heart(ctx,27,-43,6,'#ed9fa8');
    if(gr?.gem){
      ellipse(ctx,21,-49,4.5,5,gr.gemColor||'#f6d89e','#fff8ee',1);
    }
    if(gr?.sparkle){
      ctx.fillStyle=gr.gemColor||'#f1cf82';ctx.font='12px system-ui';ctx.fillText('✦',27,-34);
    }
    ctx.restore();
  }
  function earColor(pal){return pale(pal.ear||'#f4b9b8',.15)}
  function renderCuteThumb(canvas,species){
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sc=Math.min(canvas.width/74,canvas.height/100)*.94;
    drawCuteCat(ctx,canvas.width/2,canvas.height*.57,{species,scale:sc,pose:'sit',mood:'alert',t:.75});
  }
  api.drawCat=drawCuteCat;
  api.renderCatThumb=renderCuteThumb;
})();
