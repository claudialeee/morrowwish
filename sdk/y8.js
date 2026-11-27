/* Official Y8 SDK initialization, with existing portal App ID supplied at export.
   Guest gameplay remains available. No unverified ad calls. */
(()=>{'use strict';let started=false;const appId=__APP_ID_JSON__;if(!appId){console.warn('[Y8] actual portal App ID required');return}
function init(){if(started||!window.y8||typeof window.y8.sdk!=='function')return;
started=true;try{const sdk=window.y8.sdk();window.CatBondY8=sdk;
sdk.init({appId,autoLogin:true});sdk.onAuth((user,error)=>{if(error)console.warn('[Y8] Auth unavailable; guest play remains available',error)});}catch(e){console.warn('[Y8] Initialization error',e);}}
window.addEventListener('y8sdk.ready',init);
const script=document.createElement('script');script.src='https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';script.async=true;script.onload=()=>{window.y8?.emitReadyEvent?.();init()};script.onerror=()=>console.warn('[Y8] SDK unavailable');document.head.appendChild(script);})();
