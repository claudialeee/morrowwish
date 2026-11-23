/* Cat Bond host adapter: browser portals now, native wrappers later.
 * This is presentation/lifecycle configuration, never a security boundary.
 * Keep gameplay, collection rules and save format independent from host.
 */
(() => {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const named = (params.get('platform') || '').toLowerCase();
  const referrerHost = (() => {
    try { return new URL(document.referrer).hostname.toLowerCase(); }
    catch (_) { return ''; }
  })();
  const fromCrazyGames = /(^|\.)crazygames\.com$/.test(referrerHost);
  // A CrazyGames live iframe is submitted with utm_source=crazygames &
  // utm_medium=portal; it may have no referrer due to iframe privacy policy.
  const crazygames = named === 'crazygames' ||
    params.get('isCrazyGames') === 'true' ||
    fromCrazyGames ||
    (params.get('utm_source') === 'crazygames' && params.get('utm_medium') === 'portal');
  const native = !crazygames && ['steam', 'ios', 'android', 'native'].includes(named);
  const externalPortal = crazygames || named === 'portal' ||
    (!native && params.get('utm_medium') === 'portal');
  const host = crazygames ? 'crazygames' : native ? named : externalPortal ? 'portal' : 'web';
  const ownsFullscreen = crazygames || native;
  const platform = Object.freeze({
    host, crazygames, native, externalPortal, ownsFullscreen,
    // CrazyGames uses its own reporting rather than a persistent
    // first-party visitor ID; other portals retain existing attribution.
    firstPartyAnalytics: !crazygames,
  });
  window.CatBondPlatform = platform;
  if (crazygames) document.documentElement.classList.add('cb-cg');
  if (externalPortal) document.documentElement.classList.add('cb-third-party');
  if (native) document.documentElement.classList.add('cb-native-host');
  // CrazyGames has no Morrow Wish fullscreen toolbar. Anchor all ten yard
  // menu/action buttons to ONE responsive bottom dock instead of allowing
  // two independent absolute-positioned groups to float over the scenery.
  // Reparent the original nodes so existing game listeners and IDs survive.
  if(crazygames && typeof document.addEventListener==='function'){
    const mountYardDock=()=>{
      const stage=document.getElementById('stage');
      const tabs=document.getElementById('tabbar');
      const actions=document.getElementById('yard-actions');
      if(!stage||!tabs||!actions||document.getElementById('cg-yard-dock'))return;
      const dock=document.createElement('div');
      dock.id='cg-yard-dock';
      dock.setAttribute('role','group');
      dock.setAttribute('aria-label','Cat Bond game menus and yard actions');
      tabs.setAttribute('aria-label','Cat Bond game menus');
      actions.setAttribute('aria-label','Cat Bond yard actions');
      dock.appendChild(tabs);
      dock.appendChild(actions);
      stage.appendChild(dock);
    };
    if(document.readyState==='loading')
      document.addEventListener('DOMContentLoaded',mountYardDock,{once:true});
    else mountYardDock();
  }
})();
