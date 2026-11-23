/* Cat Bond duo renderer: ONLY the 63 complete approved watercolor paintings.
 * No two-actor convergence animation, breed fallback, or rectangular art overlay.
 */
(function(){
'use strict';
const img=new Image();img.decoding='async';
const stage=document.createElement('canvas'),stageCtx=stage.getContext('2d',{alpha:true});
const painting=document.createElement('canvas'),paintingCtx=painting.getContext('2d',{alpha:true});
let ready=false,failed=false,lastLayout=null;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const keys=['dark+dark','dark+elec','dark+fire','dark+grass','dark+light','dark+water','elec+elec','elec+fire','elec+grass','elec+light','elec+water','fire+fire','fire+grass','fire+light','fire+water','grass+grass','grass+light','grass+water','light+light','light+water','water+water'];
const regions=Object.fromEntries(keys.map((k,i)=>[k,i]));
const palettes=[
 ['#eadfd5','#fff4e8','#d3d7c8','#d9b9bf'],['#e8ecd9','#fff4dc','#cfdec9','#e4d3a2'],['#f5e2ce','#fff1df','#e8d4c5','#ecbaa1'],
 ['#e9ecdd','#f7f0e4','#bed6bf','#dbc3b5'],['#e9e8e9','#fff9eb','#d9ded7','#efe1b8'],['#e4efe6','#f9f5e7','#c4dcd8','#c9d6cb'],
 ['#f4eddb','#fff5dc','#e7dfc5','#ebd298'],['#f9e6d4','#fff1de','#ebd8c0','#f3bb9b'],['#f0efd8','#fdf6dc','#cedfbc','#ead8a6'],
 ['#f9eedb','#fffae8','#e6e2cd','#e9d9b5'],['#ebeee3','#faf8df','#c1ded2','#d4ddbf'],['#f9e1ce','#fff1d9','#edceba','#f2b090'],
 ['#f9e8dd','#fff5e7','#cde3cb','#e4c0b8'],['#ffebd5','#fff9e8','#ecdcc8','#f5c691'],['#f5e9dc','#fff4e7','#cbdfd7','#e3c6b4'],
 ['#edf0dd','#fff9e8','#c0dbb4','#c7d4a2'],['#f8efde','#fff9e7','#d5e6cd','#e7dcb8'],['#eaf0e2','#fdf9e9','#bedcc9','#cedfbb'],
 ['#f9f1df','#fffdf2','#e8dfc8','#e9d7ba'],['#f0eee5','#fcf9e9','#cde1d9','#dad4c4'],['#e8f0e9','#f9faf1','#bfdcd4','#c8dfd6']
];
const FRAME_W=512,FRAME_H=288,ASPECT=16/9;
function cellRect(index,tier){return{x:(index%7)*FRAME_W,y:(Math.floor(index/7)*3+(tier-1))*FRAME_H,w:FRAME_W,h:FRAME_H};}
function atmosphere(g,W,H,index){
 const c=palettes[index]||palettes[16],wash=g.createLinearGradient(0,0,W,H);
 wash.addColorStop(0,c[0]);wash.addColorStop(.34,c[1]);wash.addColorStop(.72,c[2]);wash.addColorStop(1,c[3]);
 g.fillStyle=wash;g.fillRect(0,0,W,H);
 const glow=g.createRadialGradient(W*.5,H*.48,0,W*.5,H*.48,Math.max(W,H)*.76);
 glow.addColorStop(0,'rgba(255,255,255,.34)');glow.addColorStop(.48,'rgba(255,255,255,.13)');glow.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=glow;g.fillRect(0,0,W,H);
}
function feather(g,W,H){
 g.save();g.globalCompositeOperation='destination-in';
 let f=g.createLinearGradient(0,0,W,0);
 for(const [p,a] of [[0,0],[.035,.02],[.09,.16],[.16,.68],[.23,1],[.77,1],[.84,.68],[.91,.16],[.965,.02],[1,0]])f.addColorStop(p,'rgba(255,255,255,'+a+')');
 g.fillStyle=f;g.fillRect(0,0,W,H);
 f=g.createLinearGradient(0,0,0,H);
 for(const [p,a] of [[0,0],[.045,.02],[.12,.16],[.22,.72],[.31,1],[.69,1],[.78,.72],[.88,.16],[.955,.02],[1,0]])f.addColorStop(p,'rgba(255,255,255,'+a+')');
 g.fillStyle=f;g.fillRect(0,0,W,H);
 g.save();g.scale(W,H);const v=g.createRadialGradient(.5,.5,.34,.5,.5,.79);
 v.addColorStop(0,'#fff');v.addColorStop(.65,'#fff');v.addColorStop(.79,'rgba(255,255,255,.94)');
 v.addColorStop(.90,'rgba(255,255,255,.52)');v.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=v;g.fillRect(0,0,1,1);g.restore();g.restore();
}
img.onload=()=>{ready=img.naturalWidth===3584&&img.naturalHeight===2592;failed=!ready;window.dispatchEvent(new Event(ready?'cat-bond-premium-art-ready':'cat-bond-premium-art-error'));};
img.onerror=()=>{ready=false;failed=true;window.dispatchEvent(new Event('cat-bond-premium-art-error'));};
img.src=(window.CatBondDuoAssetBase||'assets/')+'duo-storyboard-21x3-v3.webp?v=original-63-poses-20261122';
function drawOriginalArtEffects(g,x,y,w,h,p,key,tier){
 const ink={dark:'#cbb6e8',elec:'#e9d58e',fire:'#f1b39b',
  grass:'#b7d9ad',light:'#fff0bd',water:'#a7d8e8'};
 const [first,second]=key.split('+'),ca=ink[first]||ink.light,cb=ink[second]||ink.water;
 const tau=Math.PI*2;
 g.save();g.globalCompositeOperation='screen';g.lineCap='round';g.lineJoin='round';
 // Fine watercolor energy trails travel around the outside of the original
 // painting. They never split, replace, or redraw either illustrated cat.
 for(let side=0;side<2;side++){
  const phase=p*tau*.8+side*Math.PI;
  g.save();g.globalAlpha=.13+.035*Math.sin(phase);
  g.strokeStyle=side?cb:ca;g.shadowColor=side?cb:ca;g.shadowBlur=Math.max(3,h*.018);
  g.lineWidth=Math.max(1.2,h*.006);g.setLineDash([w*.022,w*.018]);
  g.lineDashOffset=-p*w*.42;
  g.beginPath();
  if(!side){
   g.moveTo(x+w*.025,y+h*.63);
   g.bezierCurveTo(x+w*.035,y+h*.36,x+w*.10,y+h*.13,x+w*.29,y+h*.075);
   g.bezierCurveTo(x+w*.36,y+h*.055,x+w*.43,y+h*.07,x+w*.48,y+h*.12);
  }else{
   g.moveTo(x+w*.975,y+h*.63);
   g.bezierCurveTo(x+w*.965,y+h*.36,x+w*.90,y+h*.13,x+w*.71,y+h*.075);
   g.bezierCurveTo(x+w*.64,y+h*.055,x+w*.57,y+h*.07,x+w*.52,y+h*.12);
  }
  g.stroke();g.restore();
 }
 // A soft lower ribbon gives the two painted paws a shared landing beat.
 const lower=.5+.5*Math.sin(p*tau*1.15);
 g.save();g.globalAlpha=.11+.045*lower;g.strokeStyle=cb;g.shadowColor=cb;
 g.shadowBlur=h*.025;g.lineWidth=Math.max(1.5,h*.008);g.setLineDash([]);
 g.beginPath();g.moveTo(x+w*.07,y+h*.91);
 g.bezierCurveTo(x+w*.25,y+h*(.96+.012*lower),x+w*.75,y+h*(.96-.012*lower),x+w*.93,y+h*.91);
 g.stroke();g.restore();
 // Small motes orbit the painted scene perimeter, not the cats' faces.
 for(let i=0;i<14;i++){
  const a=i*tau/14+p*tau*.58;
  const px=x+w*.5+Math.cos(a)*w*.463,py=y+h*.5+Math.sin(a)*h*.435;
  const twinkle=.35+.65*(.5+.5*Math.sin(p*tau*2+i*1.73));
  const r=Math.max(1.1,h*(.0035+(i%3)*.0012));
  g.save();g.globalAlpha=.18+.24*twinkle;g.fillStyle=i%2?ca:cb;
  g.shadowColor=i%2?ca:cb;g.shadowBlur=h*.018;
  g.beginPath();g.arc(px,py,r,0,tau);g.fill();g.restore();
 }
 // Each trust tier gets its own impact rhythm: one landing, two cross-beats,
 // or guard -> counter -> finale. The original paw/character artwork remains.
 const beats=tier===1?[{at:.31,x:.50}]:
  tier===2?[{at:.20,x:.37},{at:.52,x:.63}]:
  [{at:.14,x:.30},{at:.40,x:.69},{at:.73,x:.50}];
 for(const beat of beats){
  const hit=clamp(1-Math.abs(p-beat.at)/.115);if(hit<=.01)continue;
  const cx=x+w*beat.x,cy=y+h*.815,rad=h*(.065+.075*hit);
  g.save();g.globalCompositeOperation='screen';g.globalAlpha=.27*hit;
  const halo=g.createRadialGradient(cx,cy,1,cx,cy,rad*1.8);
  halo.addColorStop(0,'#fffdf0');halo.addColorStop(.28,ca+'bb');
  halo.addColorStop(.68,cb+'55');halo.addColorStop(1,cb+'00');
  g.fillStyle=halo;g.fillRect(cx-rad*1.9,cy-rad*1.9,rad*3.8,rad*3.8);
  g.globalAlpha=.46*hit;g.strokeStyle=ca;g.shadowColor=ca;g.shadowBlur=h*.025;
  g.lineWidth=Math.max(1.4,h*.006);g.beginPath();
  g.ellipse(cx,cy,rad,rad*.42,-.08,0,tau);g.stroke();
  g.globalAlpha=.36*hit;g.strokeStyle=cb;g.lineWidth=Math.max(1,h*.0035);
  for(let n=0;n<8;n++){
   const a=n*Math.PI/4+p*2;
   g.beginPath();g.moveTo(cx+Math.cos(a)*rad*.56,cy+Math.sin(a)*rad*.25);
   g.lineTo(cx+Math.cos(a)*rad*(.94+.16*hit),cy+Math.sin(a)*rad*(.42+.08*hit));g.stroke();
  }
  g.restore();
 }
 // Reuse the game's 21 individually painted elemental signatures, but confine
 // them to the lower foreground so they never cover the cats' eyes or faces.
 if(window.CatBondDuoFinale?.draw&&p>=.13&&p<=.86){
  const fw=w*.72,fh=h*.58,fx=x+(w-fw)/2,fy=y+h*.43;
  g.save();g.beginPath();g.rect(x,y+h*.62,w,h*.36);g.clip();
  g.translate(fx,fy);g.globalAlpha*=.30;
  window.CatBondDuoFinale.draw(g,fw,fh,p,key,tier);
  g.restore();
 }
 // A restrained moving glint sweeps across the watercolor, like light catching
 // the original brushwork. It is deliberately low-opacity, never a white flash.
 const sweep=p*1.62-.28;
 if(sweep>-.2&&sweep<1.2){
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.globalCompositeOperation='screen';g.globalAlpha=.055;
  g.translate(x+w*sweep,y);g.rotate(-.24);
  const grad=g.createLinearGradient(-w*.13,0,w*.13,0);
  grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.5,'rgba(255,255,255,.9)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grad;g.fillRect(-w*.14,-h*.1,w*.28,h*1.2);g.restore();
 }
 g.restore();
}
function draw(ctx,W,H,seq){
 if(!seq||seq.t<=0)return false;if(!ready)return true;
 const key=Object.hasOwn(regions,seq.elements)?seq.elements:'grass+light',index=regions[key],tier=clamp(Math.round(Number(seq.tier)||1),1,3);
 const still=seq.thumbnail===true,gallery=seq.galleryPreview===true,p=clamp((seq.max-seq.t)/(seq.max||2.75));
 // Gallery previews stay fully visible, but unlike thumbnails they still play
 // the original painting's camera drift, energy trails and elemental effects.
 const alpha=still?1:(gallery?1:smooth(p/.22)*(1-smooth((p-.71)/.275)));if(alpha<=0)return true;
 const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,Math.round(W*dpr)),ch=Math.max(1,Math.round(H*dpr));
 if(stage.width!==cw||stage.height!==ch){stage.width=cw;stage.height=ch;}
 const artW=Math.min(W,H*ASPECT),artH=artW/ASPECT,artX=(W-artW)/2,artY=(H-artH)/2;
 const pw=Math.max(1,Math.round(artW*dpr)),ph=Math.max(1,Math.round(artH*dpr));
 if(painting.width!==pw||painting.height!==ph){painting.width=pw;painting.height=ph;}
 stageCtx.setTransform(dpr,0,0,dpr,0,0);stageCtx.clearRect(0,0,W,H);if(!still)atmosphere(stageCtx,W,H,index);
 const cameraPhase=p*Math.PI*2;
 const zoom=still?1:1.003+.004*(.5+.5*Math.sin(cameraPhase-.7));
 const driftX=still?0:Math.sin(cameraPhase)*artW*.002;
 const driftY=still?0:Math.cos(cameraPhase*.7)*artH*.0015;
 const rotation=still?0:Math.sin(cameraPhase*.55)*.0014;
 paintingCtx.setTransform(dpr,0,0,dpr,0,0);paintingCtx.clearRect(0,0,artW,artH);
 paintingCtx.imageSmoothingEnabled=true;paintingCtx.imageSmoothingQuality='high';
 const frame=cellRect(index,tier);
 paintingCtx.save();paintingCtx.translate(artW*.5,artH*.5);paintingCtx.rotate(rotation);
 paintingCtx.scale(zoom,zoom);paintingCtx.translate(-artW*.5+driftX,-artH*.5+driftY);
 paintingCtx.drawImage(img,frame.x,frame.y,frame.w,frame.h,0,0,artW,artH);paintingCtx.restore();
 if(!still&&!gallery)feather(paintingCtx,artW,artH);
 stageCtx.drawImage(painting,artX,artY,artW,artH);
 if(!still)drawOriginalArtEffects(stageCtx,artX,artY,artW,artH,p,key,tier);
 if(!seq.hideCaptions){const title=seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||(window.MorrowwishI18n?.get?.()==='zh'?'双猫合击':'Duo Special');
  stageCtx.save();stageCtx.textAlign='center';stageCtx.textBaseline='alphabetic';stageCtx.shadowColor='#302747';stageCtx.shadowBlur=9;stageCtx.fillStyle='#fffbed';
  stageCtx.font='900 '+Math.round(clamp(artW*.043,15,34))+'px system-ui,sans-serif';stageCtx.fillText(title,artX+artW*.5,artY+artH*.93,artW*.88);stageCtx.restore();}
 lastLayout={source:'63-original-painted-storyboards',originalArt:true,actorFallback:false,viewport:{width:W,height:H},art:{x:artX,y:artY,width:artW,height:artH},artAspect:artW/artH,fullScreenAtmosphere:!still,
  animatedEffects:!still,paintingDrawCount:1,actorLayerCount:0,camera:{zoom,panX:driftX,panY:driftY,rotationRadians:rotation},effectPhase:p,effectTier:tier};
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(stage,0,0,W,H);ctx.restore();return true;
}
window.CatBondPremiumCinematics={draw,keys,regionFor:k=>regions[k],get ready(){return ready},get failed(){return failed},
 wholeSceneCount:21,paintedFrameCount:63,skillVariants:21,tierVariants:3,get source(){return img.src},get originalPaintingSource(){return img.src},
 get originalPaintingDefault(){return true},get restoredOriginalFrameCount(){return 63},get fullBleedResponsive(){return true},
 get portraitComposition(){return 'complete-16x9-original-centered-with-fullscreen-palette-atmosphere'},
 get actorFallbackEnabled(){return false},get lastLayout(){return lastLayout}};
})();
