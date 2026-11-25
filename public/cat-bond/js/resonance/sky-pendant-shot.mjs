// A close shot from Muling's existing painted traveler portrait. No duplicate story state.
// Warp only the pendant's pixels for a short damped swing, leaving the surrounding painting still.
export function mountSkyPendantShot(panel,url){
 const canvas=document.createElement("canvas");canvas.className="res-sky-pendant-shot";canvas.width=480;canvas.height=300;canvas.hidden=true;
 canvas.setAttribute("role","img");panel.append(canvas);
 const ctx=canvas.getContext("2d"),art=new Image();art.decoding="async";art.src=url;
 let cursor=-1,start=0,tapAt=0,tapDirection=0,raf=0,closed=false;
 const reduce=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 function draw(now){
  raf=0;if(closed||canvas.hidden||!art.naturalWidth)return;
  const W=canvas.width,H=canvas.height,sw=art.naturalWidth,sh=art.naturalHeight;
  const zoom=reduce()?1:1+.055*Math.min(1,(now-start)/850);
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
  const shade=ctx.createRadialGradient(W*.50,H*.58,H*.20,W*.50,H*.55,W*.62);shade.addColorStop(0,"#15203400");shade.addColorStop(1,"#101d32ac");ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
  if(!reduce()&&[1,3,5].includes(cursor)){
   const p=Math.min(1,(now-start)/1100);const px=W*(.31+p*.27),py=H*.56;
   const glint=ctx.createRadialGradient(px,py,0,px,py,42);glint.addColorStop(0,"rgba(255,230,177,"+(.24*Math.sin(Math.PI*p))+")");glint.addColorStop(1,"#ffe7b100");
   ctx.fillStyle=glint;ctx.fillRect(px-42,py-42,84,84);
  }
  canvas.dataset.ready="true";
  if(!reduce()&&(now-start<1150||tapAt&&t<.7))raf=requestAnimationFrame(draw);
 }
 function update(next,language){
  const active=[1,3,5,11].includes(next);canvas.setAttribute("aria-label",language==="zh"?"暮铃旧铃坠特写":"Close-up of Muling’s old bell pendant");
  if(!active){canvas.hidden=true;cursor=next;cancelAnimationFrame(raf);raf=0;return;}
  if(cursor!==next){cursor=next;start=performance.now();tapAt=0;tapDirection=0;}
  canvas.hidden=!art.naturalWidth;if(!canvas.hidden&&!raf)raf=requestAnimationFrame(draw);
 }
 art.onload=()=>{if([1,3,5,11].includes(cursor)){canvas.hidden=false;if(!raf)raf=requestAnimationFrame(draw);}};
 function tap(index){tapAt=performance.now();tapDirection=index===1?-1:1;if(!canvas.hidden&&!raf)raf=requestAnimationFrame(draw);}
 return {update,tap,dispose(){closed=true;cancelAnimationFrame(raf);art.onload=null;canvas.remove();}};
}
