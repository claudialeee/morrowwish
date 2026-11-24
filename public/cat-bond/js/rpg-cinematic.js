/* Cat Bond RPG cinematic renderer.
   Uses the existing painted region artwork and the approved 2.5D CatArt models.
   No line-art stand-ins, enlarged sticker sprites, or horizontal cat-slide tricks. */
(()=> {
'use strict';
const artCache=new Map();
const reduceMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function regionArt(id){
 if(artCache.has(id))return artCache.get(id);
 let art=null;
 try{art=window.CatBondPaintedRegions?.build?.(id,1800,1300)||null;}catch(e){console.warn('RPG scene art unavailable',id,e);}
 artCache.set(id,art);
 return art;
}
function catSpecies(id){
 const base=window.GameData?.speciesById?.(id);
 if(!base)return null;
 if(id==='xingchen')return {...base,palette:'black',pattern:'spotted',eyeColor:'#e5b6ff',
  point:'#79648f',fluffy:true,ears:'tufted'};
 return base;
}
function coverScene(ctx,art,w,h,t,region){
 if(!art){const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#19283a');g.addColorStop(1,'#21152d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);return;}
 const zoom=1.025+.022*(.5+.5*Math.sin(t*.22));
 const scale=Math.max(w/art.width,h/art.height)*zoom;
 const sw=w/scale,sh=h/scale;
 const focus={
  home:[.49,.47],sakura:[.53,.48],creek:[.48,.50],
  volcano:[.51,.46],ruins:[.55,.47]
 }[region]||[.5,.5];
 const panX=Math.sin(t*.105)*.035+Math.sin(t*.037)*.012;
 const panY=Math.cos(t*.083)*.022;
 const sx=Math.max(0,Math.min(art.width-sw,(art.width-sw)*focus[0]+(art.width-sw)*panX));
 const sy=Math.max(0,Math.min(art.height-sh,(art.height-sh)*focus[1]+(art.height-sh)*panY));
 ctx.drawImage(art,sx,sy,sw,sh,0,0,w,h);
 const wash={
  home:'rgba(255,218,156,.08)',sakura:'rgba(237,163,199,.10)',
  creek:'rgba(105,183,217,.12)',volcano:'rgba(247,104,62,.16)',
  ruins:'rgba(139,119,201,.17)'
 }[region]||'rgba(20,24,43,.1)';
 ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
}
function drawBell(ctx,x,y,r,t,energy){
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.9)*.035);
 const pulse=.5+.5*Math.sin(t*2.1);
 const halo=ctx.createRadialGradient(0,0,r*.12,0,0,r*2.8);
 halo.addColorStop(0,'rgba(255,230,170,'+(.22+energy*.14)+')');
 halo.addColorStop(.42,'rgba(255,196,118,'+(.09+pulse*.04)+')');
 halo.addColorStop(1,'rgba(255,196,118,0)');
 ctx.fillStyle=halo;ctx.fillRect(-r*3,-r*3,r*6,r*6);
 ctx.strokeStyle='rgba(255,235,191,'+(.25+pulse*.2)+')';ctx.lineWidth=Math.max(1,r*.012);
 ctx.beginPath();ctx.ellipse(0,0,r*1.22,r*.36,-.2,0,Math.PI*2);ctx.stroke();
 const metal=ctx.createLinearGradient(-r*.48,0,r*.48,0);
 metal.addColorStop(0,'#8c5c37');metal.addColorStop(.22,'#f4d59b');
 metal.addColorStop(.48,'#fff0c2');metal.addColorStop(.72,'#bd8850');metal.addColorStop(1,'#71462f');
 ctx.fillStyle=metal;ctx.strokeStyle='#fff0c8';ctx.lineWidth=Math.max(1.5,r*.035);
 ctx.beginPath();ctx.moveTo(-r*.33,-r*.2);
 ctx.bezierCurveTo(-r*.32,-r*.62,r*.32,-r*.62,r*.33,-r*.2);
 ctx.lineTo(r*.48,r*.36);ctx.quadraticCurveTo(0,r*.62,-r*.48,r*.36);ctx.closePath();
 ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=Math.max(1,r*.025);
 ctx.beginPath();ctx.moveTo(-r*.21,-r*.32);ctx.quadraticCurveTo(-r*.1,-r*.54,r*.02,-r*.52);ctx.stroke();
 ctx.fillStyle='#f9e4ae';ctx.beginPath();ctx.ellipse(0,r*.43,r*.11,r*.075,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(255,239,194,.8)';ctx.lineWidth=Math.max(1,r*.018);
 ctx.beginPath();ctx.moveTo(0,-r*.78);ctx.lineTo(0,-r*.51);ctx.stroke();
 ctx.fillStyle='#fff1c9';ctx.beginPath();ctx.arc(0,-r*.82,r*.075,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function drawPetals(ctx,w,h,t,region){
 const sakura=region==='sakura'||region==='home';
 for(let i=0;i<30;i++){
  const phase=t*(sakura?.18:.10)+i*2.399;
  const x=((i*83.7+Math.sin(phase*.8+i)*42+t*(sakura?8:2))%(w+70))-35;
  const y=((i*47.9+Math.cos(phase+i*.7)*36+t*(sakura?12:4))%(h+60))-30;
  const size=(sakura?2.5:1.4)+(i%4)*.75;
  ctx.save();ctx.translate(x,y);ctx.rotate(phase*.7);
  ctx.globalAlpha=.18+.28*(.5+.5*Math.sin(phase+i));
  ctx.fillStyle=sakura?(i%3?'#ffd8e4':'#fff0ce'):(region==='volcano'?'#ffb06e':'#f7e5b8');
  ctx.beginPath();ctx.ellipse(0,0,size*1.7,size,0,0,Math.PI*2);ctx.fill();
  if(sakura){ctx.beginPath();ctx.ellipse(size*.8,-size*.15,size*.9,size*.55,-.7,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 ctx.globalAlpha=1;
}
function drawWaterMemory(ctx,w,h,t){
 const y=h*.60;
 for(let i=0;i<5;i++){
  const pulse=(t*.22+i*.19)%1;
  ctx.save();ctx.globalAlpha=(1-pulse)*.26;
  ctx.strokeStyle=i%2?'#c8edff':'#fff0c7';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.ellipse(w*.5,y+Math.sin(t*.4+i)*7,24+pulse*100,5+pulse*22,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
 for(let i=0;i<7;i++){
  const x=w*(.32+i*.055),y2=h*(.54+Math.sin(t*.55+i)*.035);
  const a=.35+.45*(.5+.5*Math.sin(t*1.4+i));
  ctx.save();ctx.globalAlpha=a;ctx.fillStyle=i%2?'#d7f3ff':'#ffe6a8';
  ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=14;
  ctx.beginPath();ctx.moveTo(x,y2-7);ctx.lineTo(x+4,y2);ctx.lineTo(x,y2+7);ctx.lineTo(x-4,y2);ctx.closePath();ctx.fill();ctx.restore();
 }
}
function drawShockwaves(ctx,w,h,t){
 const max=Math.min(w,h)*.45;
 for(let i=0;i<3;i++){
  const phase=(t*.28+i/3)%1,r=max*(.25+phase);
  ctx.save();ctx.globalAlpha=(1-phase)*.38;
  ctx.strokeStyle=i%2?'#ffc27d':'#f9e5bd';ctx.lineWidth=1.5+phase*2;
  ctx.beginPath();ctx.ellipse(w*.52,h*.42,r,r*.42,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
}
function drawCat(ctx,species,x,ground,scale,face,pose,mood,t,alpha,glow){
 if(!species||!window.CatArt?.drawCat)return;
 ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
 if(glow){ctx.shadowColor=glow;ctx.shadowBlur=18;}
 window.CatArt.drawCat(ctx,x,ground-36*scale,{
  species,scale,face,t,pose,mood
 });
 ctx.restore();
}
function drawScene(ctx,w,h,page,kind,t){
 const region=page.region||'home',art=regionArt(region);
 coverScene(ctx,art,w,h,t,region);
 const portrait=h>w;
 const scale=Math.max(1.25,Math.min(2.55,Math.min(w,h)/245));
 const ground=h*(portrait?.55:.56);
 const player=catSpecies('tangyuan'),muling=catSpecies('xingchen');
 const beat=t%12;
 let ax=w*.36,bx=w*.64,poseA='idle',poseB='sit',moodA='alert',moodB='happy',alphaB=1;
 if(region==='sakura'){
  ax=w*.34+Math.sin(t*.55)*5;bx=w*.65;poseA='walk';poseB='sit';moodA='happy';
 }else if(region==='creek'){
  ax=w*.40;bx=w*.67;poseA='sit';poseB='idle';moodA='alert';alphaB=.42;
 }else if(region==='volcano'){
  ax=w*.35+Math.sin(t*.8)*5;bx=w*.66+Math.cos(t*.75)*4;
  poseA='play';poseB='walk';moodA='alert';moodB='alert';
 }else if(region==='ruins'){
  ax=w*.34;bx=w*.69;poseA='sit';poseB='idle';moodA='alert';moodB='alert';
 }
 if(kind==='ending'){ax=w*.39;bx=w*.61;poseA='sit';poseB='sit';moodA='happy';moodB='happy';alphaB=1;}
 const sceneLift=region==='volcano'?Math.sin(t*2.7)*2.5:Math.sin(t*.8)*1.2;
 if(region==='creek')drawWaterMemory(ctx,w,h,t);
 if(region==='volcano')drawShockwaves(ctx,w,h,t);
 const bellX=region==='volcano'?w*.52:(region==='creek'?w*.55:w*.73);
 const bellY=region==='ruins'?h*.30:(region==='creek'?h*.36:h*.32);
 const bellR=Math.min(w,h)*(region==='volcano'?.155:.112);
 drawBell(ctx,bellX,bellY+sceneLift,bellR,t,region==='volcano'?.95:.6);
 if(region==='ruins'){
  ctx.save();ctx.globalAlpha=.26+.12*Math.sin(t*.7);ctx.strokeStyle='#c8b4f3';ctx.lineWidth=2;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(bellX,bellY,bellR*(1.3+i*.22),t*.08+i,Math.PI*1.4+t*.08+i);ctx.stroke();}
  ctx.restore();
 }
 drawCat(ctx,player,ax,ground,scale,1,poseA,moodA,t,1,region==='volcano'?'rgba(255,183,112,.35)':null);
 drawCat(ctx,muling,bx,ground,scale,-1,poseB,moodB,t+1.7,alphaB,
  region==='ruins'?'rgba(174,146,230,.3)':null);
 if(region==='creek'){
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='rgba(198,231,242,.72)';
  ctx.beginPath();ctx.ellipse(bx,ground+7,scale*22,scale*5,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
 if(region==='volcano'){
  const flash=Math.max(0,Math.sin(t*2.9-1.2))*.10;
  if(flash){ctx.fillStyle='rgba(255,223,181,'+flash+')';ctx.fillRect(0,0,w,h);}
 }
 if(region==='home'||region==='sakura'||kind==='ending'){
  ctx.save();ctx.globalAlpha=.65;
  const cx=(ax+bx)*.5,cy=ground-scale*49;
  ctx.strokeStyle='rgba(255,232,190,.52)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*(.07+.006*Math.sin(t)),0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
 drawPetals(ctx,w,h,t,region);
 const vignette=ctx.createRadialGradient(w*.5,h*.42,Math.min(w,h)*.2,w*.5,h*.45,Math.max(w,h)*.78);
 vignette.addColorStop(0,'rgba(5,9,20,0)');
 vignette.addColorStop(.62,'rgba(5,9,20,.08)');
 vignette.addColorStop(1,'rgba(5,9,20,.54)');
 ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 const fade=Math.min(1,t/.8);
 if(fade<1){ctx.fillStyle='rgba(8,10,20,'+(1-fade)+')';ctx.fillRect(0,0,w,h);}
}
function play(canvas,page,meta){
 if(!canvas)return ()=>{};
 let stopped=false,raf=0,start=performance.now(),lastW=0,lastH=0;
 const region=page?.region||'home',kind=meta?.kind||'memory';
 const reduced=reduceMotion();
 function frame(now){
  if(stopped)return;
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,rect.width||window.innerWidth||800);
  const h=Math.max(1,rect.height||window.innerHeight||600);
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
  if(canvas.width!==pw||canvas.height!==ph||w!==lastW||h!==lastH){
   canvas.width=pw;canvas.height=ph;lastW=w;lastH=h;
  }
  const ctx=canvas.getContext('2d');
  if(ctx){
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.clearRect(0,0,w,h);
   drawScene(ctx,w,h,page,kind,reduced?2.2:(now-start)/1000);
  }
  if(!reduced)raf=requestAnimationFrame(frame);
 }
 frame(start);
 return ()=>{stopped=true;if(raf)cancelAnimationFrame(raf);};
}
window.CatBondRpgCinematic={play,drawScene,version:'2026-11-23-rpg-cinematic-v1'};
})();