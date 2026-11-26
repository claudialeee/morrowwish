// Keep the 63 original element paintings for collectible pairs. A named
// story pair instead uses the actual actors, so the cut-in never shows two unrelated cats.
(function(){'use strict';
function render(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 const actors=(seq.actorUids||[]).map(uid=>lookup?.(uid));const named=actors.length===2&&actors.every(Boolean)&&actors.some(c=>c.storyActor);
 if(!named){const p=window.CatBondPremiumCinematics;return p?p.draw(ctx,W,H,seq,lookup):true;}
 const p=Math.max(0,Math.min(1,(seq.max-seq.t)/(seq.max||3.2))),alpha=Math.min(1,p*9,(1-p)*9);
 const size=Math.min(W*.0031,H*.0044),y=H*.57;
 ctx.save();ctx.globalAlpha*=Math.max(0,alpha);
 const g=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.6);g.addColorStop(0,'#f4dca866');g.addColorStop(1,'#172c3ad9');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const sig=window.CatBondDuoSignatures;sig?.paint?.(ctx,W,H,p,seq.tier||1,seq.elements);
 for(const [i,cat] of actors.entries()){const sp=window.GameData.speciesById(cat.species),x=W*(i?.68:.32)+(i?-1:1)*Math.sin(p*Math.PI)*W*.055;window.CatArt?.drawCat?.(ctx,x,y,{species:sp,scale:size,face:i?-1:1,t:p*3.2,pose:'duo-swipe'});ctx.font='600 '+Math.max(13,Math.min(25,H*.045))+'px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3d3';ctx.fillText(window.State.catName(cat),x,H*.76);}
 ctx.font='800 '+Math.max(17,Math.min(34,H*.065))+'px system-ui';ctx.fillStyle='#fff3d3';ctx.textAlign='center';ctx.fillText(seq.name||'Duo',W*.5,H*.88,W*.9);ctx.restore();return true;
}
const d=window.CatBondDuoDirector;window.CatBondDuoHero={draw:render,scenes:Object.fromEntries(Object.entries(d?.styles||{}).map(([k,v])=>[k,v])),sceneKeys:d?.keys||[],get assetReady(){return !!window.CatBondPremiumCinematics?.ready},get assetSource(){return '63-original-painted-storyboards'},assetCount:21,signatureCount:21,get originalArtOnly(){return true}};})();
