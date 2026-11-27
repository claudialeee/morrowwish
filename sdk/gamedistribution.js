/* Official GameDistribution SDK; real events only. Existing game ID at export.
   Pre-roll is requested once on the actual Start Adventure button, not a timer.
   Verify activation and appropriate post-battle placement before review. */
(()=>{'use strict';let requested=false,inFlight=false;
window.GD_OPTIONS={gameId:__GAME_ID_JSON__,onEvent(event){switch(event.name){
case 'SDK_GAME_PAUSE':window.CatBondPortalLifecycle?.setAdPaused(true);break;
case 'SDK_GAME_START':inFlight=false;window.CatBondPortalLifecycle?.setAdPaused(false);break;
case 'SDK_ERROR':case 'AD_ERROR':inFlight=false;window.CatBondPortalLifecycle?.setAdPaused(false);break;
}}};
const script=document.createElement('script');script.id='gamedistribution-jssdk';script.src='https://html5.api.gamedistribution.com/main.min.js';script.async=true;document.head.appendChild(script);
document.addEventListener('click',event=>{
if(!event.isTrusted||!event.target.closest('#intro-start')||requested||inFlight||typeof window.gdsdk?.showAd!=='function')return;
requested=true;inFlight=true;
try{Promise.resolve(window.gdsdk.showAd()).catch(e=>{inFlight=false;window.CatBondPortalLifecycle?.setAdPaused(false);console.warn('[GD] Ad unavailable',e)})}catch(e){inFlight=false;window.CatBondPortalLifecycle?.setAdPaused(false);console.warn('[GD] Ad unavailable',e)}
},true);
})();
