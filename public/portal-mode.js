/* Portal edition for externally hosted game discovery.
 * This keeps the original game code and first-party gameplay analytics,
 * while disabling links to other Morrow Wish games in third-party portals.
 * Activated only by a deliberate ?utm_medium=portal&utm_source=crazygames URL.
 */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const campaignPortal=params.get('utm_medium')==='portal'&&params.get('utm_source')==='crazygames';
  const catBondPortal=location.pathname.replace(/\/+$/,'/')==='/cat-bond/' &&
    window.CatBondPlatform?.externalPortal===true;
  if(!campaignPortal&&!catBondPortal)return;
  document.documentElement.classList.add('mw-third-party-portal');
  function hideCrossPromotion(){
    const here=location.pathname.replace(/\/+$/,'/');
    for(const a of document.querySelectorAll('a[href]')){
      let link;
      try{link=new URL(a.getAttribute('href'),location.href);}catch{continue;}
      if(link.origin!==location.origin)continue;
      const dest=link.pathname.replace(/\/+$/,'/');
      if(dest==='/'|| (dest!==here && /^\/[a-z0-9-]+\/$/.test(dest))){
        a.hidden=true;a.setAttribute('aria-hidden','true');a.tabIndex=-1;
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideCrossPromotion,{once:true});
  else hideCrossPromotion();
})();
