/* Starbell duo cut-ins: the 63 complete approved paintings are the ONLY render path.
 * No roster sprite/portrait composites, even when both actors are known.
 * Missing art never substitutes a dynamic cut-in.
 */
(function(){'use strict';
function render(ctx,W,H,seq){
 if(!seq||seq.t<=0)return false;
 const art=window.CatBondPremiumCinematics;
 if(!art?.ready)return true;
 return art.draw(ctx,W,H,seq);
}
const d=window.CatBondDuoDirector;
window.CatBondDuoHero={draw:render,scenes:Object.fromEntries(Object.entries(d?.styles||{}).map(([k,v])=>[k,v])),sceneKeys:d?.keys||[],get assetReady(){return !!window.CatBondPremiumCinematics?.ready},get assetSource(){return '63-original-painted-storyboards'},assetCount:21,signatureCount:21,get originalArtOnly(){return true},get actorFallbackEnabled(){return false}};
})();
