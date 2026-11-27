// Live battles and galleries share the approved 63 complete watercolor paintings.
// Elemental artwork is shared; it is not an identity-specific NPC illustration.
(function(){'use strict';
function render(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 // No actor convergence or reused map sprites, including recruited story actors.
 return window.CatBondPremiumCinematics?.draw(ctx,W,H,seq,lookup)??true;
}
const d=window.CatBondDuoDirector;
window.CatBondDuoHero={draw:render,scenes:Object.fromEntries(Object.entries(d?.styles||{}).map(([k,v])=>[k,v])),sceneKeys:d?.keys||[],get assetReady(){return !!window.CatBondPremiumCinematics?.ready},get assetSource(){return '63-original-painted-storyboards'},assetCount:21,signatureCount:21,get originalArtOnly(){return true}};
})();
