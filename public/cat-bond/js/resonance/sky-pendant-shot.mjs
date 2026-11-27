// A close shot from Luna's existing painted traveler portrait. No duplicate story state.
// Warp only the pendant's pixels for a short damped swing, leaving the surrounding painting still.
export function mountSkyPendantShot(panel,url){
 const canvas=document.createElement("canvas");canvas.className="res-sky-pendant-shot";canvas.width=480;canvas.height=300;canvas.hidden=true;
 canvas.setAttribute("role","img");panel.append(canvas);
 const ctx=canvas.getContext("2d"),art=new Image(),handArt=new Image();art.decoding="async";art.src=url;
 // Isolate only Luna's painted hand. The finale's environment and bell never appear here.
 handArt.decoding="async";handArt.src=new URL("../../assets/cinematics/closing/pendant-signal.webp",import.meta.url).href;
 let hand=null;
 function prepareHand(){
  if(!handArt.naturalWidth)return;
  const layer=document.createElement("canvas");layer.width=220;layer.height=180;
  const p=layer.getContext("2d"),sw=handArt.naturalWidth,sh=handArt.naturalHeight;
  // Trace the existing hand and cuff, excluding the held bell and background.
  p.drawImage(handArt,sw*.592,sh*.298,sw*.207,sh*.355,0,0,220,180);
  const mask=document.createElement("canvas");mask.width=220;mask.height=180;
  const m=mask.getContext("2d");m.fillStyle="#fff";m.beginPath();
  m.moveTo(10,147);m.bezierCurveTo(24,130,32,106,48,94);m.bezierCurveTo(63,75,64,52,87,42);
  m.bezierCurveTo(97,19,124,17,149,24);m.bezierCurveTo(173,24,192,43,203,62);
  m.bezierCurveTo(213,76,199,87,189,84);m.bezierCurveTo(179,89,179,105,163,102);
  m.bezierCurveTo(151,119,137,126,121,129);m.bezierCurveTo(92,149,80,160,62,176);
  m.lineTo(10,176);m.closePath();m.fill();
  p.globalCompositeOperation="destination-in";p.filter="blur(2px)";p.drawImage(mask,0,0);p.filter="none";p.globalCompositeOperation="source-over";hand=layer;
 }
 handArt.onload=()=>{prepareHand();if(!canvas.hidden&&!raf)raf=requestAnimationFrame(draw);};
 let cursor=-1,start=0,tapAt=0,tapDirection=0,raf=0,closed=false;
 const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 function draw(now){
  raf=0;if(closed||canvas.hidden||!art.naturalWidth)return;
  const W=canvas.width,H=canvas.height,sw=art.naturalWidth,sh=art.naturalHeight;
  const progress=Math.max(0,(now-start)/1000),zoom=reduce()?1:1+.055*Math.min(1,progress/.85);
  const cropW=sw*.49/zoom,cropH=cropW*H/W,centerX=sw*.465,centerY=sh*.747;
  const sx=centerX-cropW/2,sy=centerY-cropH/2;
  const t=(now-tapAt)/1000,angle=reduce()||!tapAt||t>.68?0:tapDirection*Math.sin(t*22)*Math.exp(-t*6);
  ctx.fillStyle="#24354c";ctx.fillRect(0,0,W,H);
  // Tile the actual painting; a feathered displacement field gives the hanging brass bell inertia.
  const step=10;
  if(!angle)ctx.drawImage(art,sx,sy,cropW,cropH,0,0,W,H);
  else for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){
   const ox=(sx+(x+step/2)*cropW/W)/sw,oy=(sy+(y+step/2)*cropH/H)/sh;
   const influence=Math.exp(-(((ox-.457)/.082)**2+((oy-.798)/.095)**2)*1.65);
   const shift=angle*7*influence*Math.max(0,Math.min(1,(oy-.69)/.10));
   const dx=x-shift;ctx.drawImage(art,sx+dx*cropW/W,sy+y*cropH/H,(step+1)*cropW/W,(step+1)*cropH/H,x,y,step+1,step+1);
  }
  // Each repair beat approaches the clasp, makes a small adjustment, then withdraws.
  // Use the real painted cutout rather than a replacement cartoon paw.
  const repair=[0,1,3].includes(cursor),tapping=cursor===4&&tapAt&&t<.55;
  if(hand&&(repair||tapping)){
   const easing=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
   const approach=repair?(reduce()?.78:easing(progress/.65)*(1-.85*easing((progress-1.8)/.55))):easing(t/.10)*(1-easing((t-.16)/.37));
   const bellX=(sw*.461-sx)*W/cropW,bellY=(sh*.735-sy)*H/cropH;
   const motion=repair?Math.sin(progress*9)*1.5*approach:Math.sin(t*18)*1.2*approach;
   const size=W*.43;
   // The wrist enters from the left; the painted fingers meet the brass loop.
   ctx.save();ctx.translate(bellX-size*.88-(1-approach)*W*.35,bellY-size*.39+motion);
   ctx.rotate(-.09+approach*.055);
   ctx.globalAlpha=Math.min(1,approach*2.4);
   ctx.drawImage(hand,0,0,size,size*hand.height/hand.width);ctx.restore();canvas.dataset.repairAction=repair&&approach>.7?"adjusting":tapping&&approach>.4?"tapping":"moving";
  }
  if(repair&&progress>.65&&progress<1.6&&!reduce()){
   const px=(sw*.467-sx)*W/cropW,py=(sh*.714-sy)*H/cropH;
   ctx.save();ctx.globalAlpha=Math.sin(Math.PI*Math.min(1,(progress-.65)/.95))*.6;
   const gl=ctx.createRadialGradient(px,py,0,px,py,12);gl.addColorStop(0,"#fff1c5");gl.addColorStop(1,"#fff1c500");ctx.fillStyle=gl;ctx.fillRect(px-12,py-12,24,24);ctx.restore();
  }
  const shade=ctx.createRadialGradient(W*.50,H*.58,H*.20,W*.50,H*.55,W*.62);shade.addColorStop(0,"#15203400");shade.addColorStop(1,"#101d32ac");ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  if(!reduce()&&[1,3].includes(cursor)){
   const p=Math.min(1,(now-start)/1100);const px=W*(.31+p*.27),py=H*.56;
   const glint=ctx.createRadialGradient(px,py,0,px,py,42);glint.addColorStop(0,"rgba(255,230,177,"+(.24*Math.sin(Math.PI*p))+")");glint.addColorStop(1,"#ffe7b100");
   ctx.fillStyle=glint;ctx.fillRect(px-42,py-42,84,84);
  }
  canvas.dataset.ready="true";
  if(!reduce()&&(now-start<(repair?2400:1150)||tapAt&&t<.7))raf=requestAnimationFrame(draw);
 }
 function update(next,language){
  const active=[0,1,3,4].includes(next);canvas.setAttribute("aria-label",language==="zh"?"暮铃旧铃坠特写":"Close-up of Luna’s old bell pendant");
  if(!active){canvas.hidden=true;delete canvas.dataset.repairAction;cursor=next;cancelAnimationFrame(raf);raf=0;return;}
  if(cursor!==next){delete canvas.dataset.repairAction;cursor=next;start=performance.now();tapAt=0;tapDirection=0;}
  canvas.hidden=!art.naturalWidth;if(!canvas.hidden&&!raf)raf=requestAnimationFrame(draw);
 }
 art.onload=()=>{if([0,1,3,4].includes(cursor)){canvas.hidden=false;if(!raf)raf=requestAnimationFrame(draw);}};
 function tap(index){tapAt=performance.now();tapDirection=index===1?-1:1;if(!canvas.hidden&&!raf)raf=requestAnimationFrame(draw);}
 return {update,tap,dispose(){closed=true;cancelAnimationFrame(raf);art.onload=null;handArt.onload=null;canvas.remove();}};
}
