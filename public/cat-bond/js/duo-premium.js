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
function draw(ctx,W,H,seq){
 if(!seq||seq.t<=0)return false;if(!ready)return true;
 const key=Object.hasOwn(regions,seq.elements)?seq.elements:'grass+light',index=regions[key],tier=clamp(Math.round(Number(seq.tier)||1),1,3);
 const still=seq.thumbnail===true||seq.galleryPreview===true,p=clamp((seq.max-seq.t)/(seq.max||2.75));
 const alpha=still?1:smooth(p/.22)*(1-smooth((p-.71)/.275));if(alpha<=0)return true;
 const dpr=Math.min(2,window.devicePixelRatio||1),cw=Math.max(1,Math.round(W*dpr)),ch=Math.max(1,Math.round(H*dpr));
 if(stage.width!==cw||stage.height!==ch){stage.width=cw;stage.height=ch;}
 const artW=Math.min(W,H*ASPECT),artH=artW/ASPECT,artX=(W-artW)/2,artY=(H-artH)/2;
 const pw=Math.max(1,Math.round(artW*dpr)),ph=Math.max(1,Math.round(artH*dpr));
 if(painting.width!==pw||painting.height!==ph){painting.width=pw;painting.height=ph;}
 stageCtx.setTransform(dpr,0,0,dpr,0,0);stageCtx.clearRect(0,0,W,H);if(!still)atmosphere(stageCtx,W,H,index);
 paintingCtx.setTransform(dpr,0,0,dpr,0,0);paintingCtx.clearRect(0,0,artW,artH);
 paintingCtx.imageSmoothingEnabled=true;paintingCtx.imageSmoothingQuality='high';
 const frame=cellRect(index,tier);paintingCtx.drawImage(img,frame.x,frame.y,frame.w,frame.h,0,0,artW,artH);
 if(!still)feather(paintingCtx,artW,artH);
 stageCtx.drawImage(painting,artX,artY,artW,artH);
 if(!seq.hideCaptions){const title=seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||(window.MorrowwishI18n?.get?.()==='zh'?'双猫合击':'Duo Special');
  stageCtx.save();stageCtx.textAlign='center';stageCtx.textBaseline='alphabetic';stageCtx.shadowColor='#302747';stageCtx.shadowBlur=9;stageCtx.fillStyle='#fffbed';
  stageCtx.font='900 '+Math.round(clamp(artW*.043,15,34))+'px system-ui,sans-serif';stageCtx.fillText(title,artX+artW*.5,artY+artH*.93,artW*.88);stageCtx.restore();}
 lastLayout={source:'63-original-painted-storyboards',originalArt:true,actorFallback:false,viewport:{width:W,height:H},art:{x:artX,y:artY,width:artW,height:artH},artAspect:artW/artH,fullScreenAtmosphere:!still};
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(stage,0,0,W,H);ctx.restore();return true;
}
window.CatBondPremiumCinematics={draw,keys,regionFor:k=>regions[k],get ready(){return ready},get failed(){return failed},
 wholeSceneCount:21,paintedFrameCount:63,skillVariants:21,tierVariants:3,get source(){return img.src},get originalPaintingSource(){return img.src},
 get originalPaintingDefault(){return true},get restoredOriginalFrameCount(){return 63},get fullBleedResponsive(){return true},
 get portraitComposition(){return 'complete-16x9-original-centered-with-fullscreen-palette-atmosphere'},
 get actorFallbackEnabled(){return false},get lastLayout(){return lastLayout}};
})();
