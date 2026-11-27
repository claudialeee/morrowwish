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
  // CrazyGames has no Morrow Wish fullscreen toolbar. Reuse the two
  // original yard groups in ONE non-intercepting overlay: 5 named tabs
  // horizontal at bottom-centre and 5 garden icon actions vertical at right.
  // Hide both groups during map and battle; keep top settings independent.
  // Reparent the original nodes so existing game listeners and IDs survive.
  if(crazygames && typeof document.addEventListener==='function'){
    const updatePortalLabels=()=>{const zh=window.MorrowwishI18n?.get?.()==='zh';for(const [id,a,b] of [['cg-yard-dock','游戏菜单与庭院操作','Game menus and garden actions'],['tabbar','游戏菜单','Game menus'],['yard-actions','庭院操作','Garden actions'],['cg-top-tools','游戏设置与菜单','Game settings and menu'],['cg-battle-hud','战斗状态','Combat status']])document.getElementById(id)?.setAttribute('aria-label',zh?a:b);};
    const mountYardDock=()=>{
      // Portal players must not have outbound first-party navigation, even hidden.
      document.querySelectorAll('a.cb-home').forEach(el=>el.remove());
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

      // The ordinary fullscreen header is intentionally absent on CrazyGames,
      // but the game settings and exploration Menu must NEVER inherit the yard
      // resource HUD's hidden state. Keep one permanent portal utility anchor.
      if(!document.getElementById('cg-top-tools')){
        const top=document.createElement('div');
        top.id='cg-top-tools';
        top.setAttribute('role','group');
        top.setAttribute('aria-label','Cat Bond game settings and menu');
        const controls=document.createElement('div');
        controls.id='cb-header-actions';
        const menu=document.getElementById('map-menu');
        if(menu)controls.appendChild(menu);
        top.appendChild(controls);
        stage.appendChild(top);
      }

      // Single real-flow battle status stack. Previous unrelated absolute
      // offsets had the enemy poise/HP row clipping the cat cards, and the
      // ultimate/duo gauges crossing the enemy header on short iframes.
      if(!document.getElementById('cg-battle-hud')){
        const combat=document.getElementById('battle-ui');
        const header=combat?.querySelector('.battle-topbar');
        const squad=document.getElementById('battle-squad-rail');
        const ult=document.getElementById('ult-wrap');
        const duo=document.getElementById('duo-burst');
        if(combat&&header&&squad&&ult&&duo){
          const hud=document.createElement('div');
          hud.id='cg-battle-hud';
          hud.setAttribute('aria-label','Combat status');
          const lower=document.createElement('div');
          lower.id='cg-battle-lower';
          const charges=document.createElement('div');
          charges.id='cg-battle-charges';
          charges.appendChild(ult);
          charges.appendChild(duo);
          lower.appendChild(squad);
          lower.appendChild(charges);
          hud.appendChild(header);
          hud.appendChild(lower);
          combat.insertBefore(hud,combat.firstChild);
        }
      }
      updatePortalLabels();
    };
    window.addEventListener('morrowwish-language-change',updatePortalLabels);
    if(document.readyState==='loading')
      document.addEventListener('DOMContentLoaded',mountYardDock,{once:true});
    else mountYardDock();
  }
})();
