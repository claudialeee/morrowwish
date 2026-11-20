/* Morrow Wish: fullscreen only the playable surface, never the document.
   On iPhone Safari (no element Fullscreen API), the same surface is fixed to
   the visual viewport with a reversible in-page immersive mode. */
(()=>{
  'use strict';
  const route=location.pathname.split('/').filter(Boolean)[0];
  const config={
    'pawsibly-innocent':['.board-layout','.stealth-actionbar'],
    'elsewhere':['#play-view','.play-utilities'],
    'tiny-town':['.app','.top-actions'],
    'cat-bond':['#stage','#stage'],
    'flip-dash':['.game-shell','.scoreboard'],
    'parcel-panic':['.game-shell','.scoreboard'],
    'pocket-aquarium':['.shell','.shell']
  }[route];
  if(!config)return;
  // CrazyGames provides fullscreen and forbids a competing in-game button.
  if(route==='cat-bond'&&document.documentElement.classList.contains('cb-cg'))return;

  const root=document.documentElement;
  root.dataset.mwFullscreenGame=route;
  let surface,button,fallback=false,wasActive=false,scrollY=0;
  const nativeActive=()=>!!surface&&document.fullscreenElement===surface;
  const active=()=>nativeActive()||fallback;
  const zh=()=>window.MorrowwishI18n?.get?.()==='zh'||root.lang.toLowerCase().startsWith('zh');
  const notifyResize=()=>{
    requestAnimationFrame(()=>{
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
    });
  };
  // iOS Safari often has no element Fullscreen API. Match the visible viewport
  // exactly, including address-bar changes and safe-area shifts, only for Cat Bond.
  function syncCatBondViewport(){
    if(route!=='cat-bond'||!surface)return;
    const view=window.visualViewport;
    const w=Math.round(view?.width||window.innerWidth);
    const h=Math.round(view?.height||window.innerHeight);
    root.style.setProperty('--mw-cb-width',w+'px');
    root.style.setProperty('--mw-cb-height',h+'px');
    root.style.setProperty('--mw-cb-left',Math.round(view?.offsetLeft||0)+'px');
    root.style.setProperty('--mw-cb-top',Math.round(view?.offsetTop||0)+'px');
  }
  function update(){
    if(route==='cat-bond')syncCatBondViewport();
    const on=active();
    root.classList.toggle('mw-fs-active',on);
    if(surface)surface.classList.toggle('mw-immersive-fallback',fallback);
    if(button){
      const chinese=zh();
      const label=on?(chinese?'退出全屏':'Exit fullscreen'):(chinese?'游戏全屏':'Game fullscreen');
      button.textContent=(on?'↙ ':'⛶ ')+label;
      button.setAttribute('aria-label',label);
      button.setAttribute('aria-pressed',String(on));
      button.title=label;
    }
    if(on!==wasActive){
      if(!on)requestAnimationFrame(()=>window.scrollTo(0,scrollY));
      wasActive=on;
      notifyResize();
      window.dispatchEvent(new CustomEvent('morrowwish-fullscreen-change',{detail:{active:on,native:nativeActive(),surfaceOnly:true}}));
    }
  }
  async function enter(){
    scrollY=window.scrollY;
    // Touchscreen browsers can force an orientation change for native fullscreen.
    // Keep gameplay upright using the reversible, element-only in-page mode.
    const touchDevice=navigator.maxTouchPoints>0||window.matchMedia?.('(pointer:coarse)').matches;
    if(!touchDevice&&surface&&typeof surface.requestFullscreen==='function'){
      try{
        // Fullscreen only the gameplay subtree. Important: not documentElement.
        await surface.requestFullscreen({navigationUI:'hide'});
        fallback=false;
        update();
        return;
      }catch(_){ /* iOS and embedded portal frames may reject the request */ }
    }
    fallback=true;
    if(route==='cat-bond')syncCatBondViewport();
    update();
    surface.scrollTop=0;
  }
  async function leave(){
    fallback=false;
    if(nativeActive()){
      try{await document.exitFullscreen();}catch(_){}
    }
    update();
  }
  function mount(){
    surface=document.querySelector(config[0]);
    const controls=document.querySelector(config[1]);
    if(!surface||!controls||document.querySelector('#mw-fullscreen-toggle'))return;
    surface.classList.add('mw-immersive-target');

    // The Tiny Town result dialog must remain INSIDE the fullscreen subtree.
    // Moving an existing node keeps all event listeners and game state intact.
    if(route==='tiny-town'){
      const end=document.getElementById('end');
      if(end&&!surface.contains(end))surface.appendChild(end);
    }

    button=document.createElement('button');
    button.type='button';
    button.id='mw-fullscreen-toggle';
    button.className='mw-fullscreen-toggle';
    button.addEventListener('click',()=>{
      if(active())leave();
      else enter();
    });
    if(route==='pocket-aquarium'){
      const bar=document.createElement('div');
      bar.className='mw-fs-toolbar';
      bar.appendChild(button);
      controls.insertBefore(bar,controls.firstChild);
    }else{
      controls.appendChild(button);
    }
    installStyles();
    if(route==='cat-bond'){
      syncCatBondViewport();
      window.addEventListener('resize',syncCatBondViewport,{passive:true});
      window.addEventListener('orientationchange',syncCatBondViewport,{passive:true});
      window.visualViewport?.addEventListener('resize',syncCatBondViewport,{passive:true});
      window.visualViewport?.addEventListener('scroll',syncCatBondViewport,{passive:true});
    }
    update();
  }
  function installStyles(){
    if(document.getElementById('mw-fullscreen-styles'))return;
    const style=document.createElement('style');
    style.id='mw-fullscreen-styles';
    style.textContent=[
      '.mw-fullscreen-toggle{display:inline-flex;align-items:center;justify-content:center;min-height:42px;min-width:92px;padding:8px 11px;white-space:nowrap;flex:0 0 auto;border:1px solid #b9aabc;border-radius:999px;background:#fffaf7;color:#604c65;font:800 12px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;touch-action:manipulation;z-index:30}',
      '.mw-fullscreen-toggle:focus-visible{outline:3px solid #9271b3;outline-offset:2px}',
      '.mw-fullscreen-toggle[aria-pressed="true"]{background:#3c3247;color:white;border-color:#3c3247}',
      '.mw-fs-toolbar{display:flex;justify-content:flex-end;align-items:center;margin:0 0 8px}',
      'html.mw-fs-active,html.mw-fs-active body{overflow:hidden!important;overscroll-behavior:none!important}',
      '.mw-immersive-target:fullscreen,.mw-immersive-target.mw-immersive-fallback{box-sizing:border-box!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important;background:#fff8f0;overscroll-behavior:contain}',
      '.mw-immersive-target.mw-immersive-fallback{position:fixed!important;inset:0!important;z-index:2147482000!important;isolation:isolate!important}',
      'html.mw-fs-active #mw-audio-dock{display:none!important}',
      'html.mw-fs-active #mw-language,html.mw-fs-active .mw-language-float{display:none!important;pointer-events:none!important}',

      /* Flip Dash and Parcel Panic: keep original live score, best, restart
         and status inside the stage; no duplicated values or stale HUD. */
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-shell,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-shell{display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:7px!important;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px calc(env(safe-area-inset-bottom,0px) + 8px)!important;overflow:hidden!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-shell:before,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-shell:before{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-top,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-top{margin:0!important;display:flex!important;justify-content:center!important;flex:0 0 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-top>div:first-child,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-top>div:first-child{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .scoreboard,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .scoreboard{display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:wrap!important;gap:6px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .score-chip,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .score-chip{font-size:17px!important;padding:5px 9px!important;min-width:59px!important;box-shadow:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame{box-sizing:border-box!important;flex:0 1 auto!important;min-height:0!important;width:min(100%,calc((100dvh - 160px)*16/9))!important;max-width:100%!important;margin:auto!important;box-shadow:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame canvas,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame canvas{width:100%!important;height:auto!important;aspect-ratio:16/9!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-foot,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-foot{margin:0!important;flex:0 0 auto!important}',

      /* Pocket Aquarium: resize the live tank; retain score, time, water
         quality, combo and all three food buttons inside the fullscreen UI. */
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .shell{display:flex!important;flex-direction:column!important;gap:7px!important;overflow-y:auto!important;overflow-x:hidden!important;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px calc(env(safe-area-inset-bottom,0px) + 8px)!important;background:#fffdf8!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .mw-fs-toolbar{margin:0!important;flex:0 0 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .scores{margin:0!important;gap:5px!important;flex:0 0 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .stat{padding:5px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .tank{height:auto!important;flex:1 0 210px!important;min-height:210px!important;max-height:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .meters,html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .foods,html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .under{flex:0 0 auto!important;margin-top:0!important;margin-bottom:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .hint{display:none!important}',

      /* Pawsibly Innocent: game board plus a small in-game HUD, not the
         instructions, wardrobe, souvenir list or the entire page. */
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:7px!important;padding:calc(env(safe-area-inset-top,0px) + 8px) 9px calc(env(safe-area-inset-bottom,0px) + 8px)!important;overflow:hidden!important;background:#fff5ea!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout>div:first-child{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;align-items:center!important;justify-content:center!important;gap:7px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout .stealth-actionbar{order:2!important;flex:0 0 auto!important;width:100%!important;max-width:900px!important;justify-content:center!important;padding:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .stealth-help{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .cat-legend{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout .stage{box-sizing:border-box!important;order:1!important;flex:0 1 auto!important;aspect-ratio:10/7!important;width:min(100%,calc((100dvh - 195px)*10/7))!important;max-height:calc(100dvh - 195px)!important;margin:auto!important;border-width:4px!important;border-radius:16px!important;box-shadow:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout .stage canvas{width:100%!important;height:auto!important;aspect-ratio:10/7!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout>aside.panel{order:-1!important;display:flex!important;flex:0 0 auto!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;flex-wrap:wrap!important;width:100%!important;max-width:none!important;margin:0!important;padding:6px 8px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-mission,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-fish{padding:0!important;margin:0!important;border:0!important;flex:0 0 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .chapter,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .chapter-sub,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-fish .meter,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-fish .mission,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .collection-count,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .levels,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .clothes,html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-extra{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .panel .stats{display:flex!important;gap:5px!important;margin:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .panel .stat{padding:3px 8px!important;min-width:48px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .panel .stat strong{font-size:16px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-actions{margin:0!important;padding:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-actions .button{padding:7px 10px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-yarn{min-height:42px!important}',

      /* Tiny Town: preserve the working resident/map/build panels and live
         score, week and club metrics. Hide site news and introductory copy. */
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .app{display:flex!important;flex-direction:column!important;gap:6px!important;padding:calc(env(safe-area-inset-top,0px) + 7px) 9px calc(env(safe-area-inset-bottom,0px) + 7px)!important;overflow:hidden!important;background:#fff8ef!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .top{flex:0 0 auto!important;margin:0!important;padding:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .top>div:first-child{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .top-actions{display:flex!important;gap:5px!important;flex-wrap:wrap!important;justify-content:center!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .top-actions .btn{padding:7px 9px!important;font-size:11px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-news-panel,html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-journey{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .stats.tt-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;margin:0!important;flex:0 0 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .stats.tt-stats .stat{padding:5px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .stats.tt-stats .stat .v{font-size:clamp(13px,2vw,20px)!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-playstage{flex:1 1 auto!important;min-height:0!important;max-width:none!important;width:100%!important;overflow-y:auto!important;overscroll-behavior:contain!important;align-items:start!important;gap:8px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-playstage .panel{min-height:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-map-panel{min-width:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] #end{z-index:2147483000!important}',

      /* Elsewhere: story and chapter choices fill the screen, with a compact
         progress sidebar. The world-selection landing page stays untouched. */
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view{display:flex!important;flex-direction:column!important;gap:8px!important;padding:calc(env(safe-area-inset-top,0px) + 9px) 12px calc(env(safe-area-inset-bottom,0px) + 9px)!important;overflow:hidden!important;background:#fff8f1!important;color:#282637!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-top{flex:0 0 auto!important;display:flex!important;gap:8px!important;margin:0!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-layout{flex:1 1 auto!important;min-height:0!important;max-width:none!important;width:100%!important;display:grid!important;grid-template-columns:minmax(175px,230px) minmax(0,1fr)!important;gap:10px!important;padding:0!important;overflow:hidden!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar{min-height:0!important;position:static!important;overflow-y:auto!important;padding:12px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .story-paper{min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-footer{display:none!important}',

      /* Cat Bond already renders its game HUD and actions inside #stage. */
      'html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #stage{width:var(--mw-cb-width,100vw)!important;height:var(--mw-cb-height,100dvh)!important;max-width:none!important;max-height:none!important;border-radius:0!important;box-shadow:none!important;background:#e4ede0!important;overflow:hidden!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #stage.mw-immersive-fallback{top:var(--mw-cb-top,0px)!important;left:var(--mw-cb-left,0px)!important;right:auto!important;bottom:auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #stage:fullscreen{width:100vw!important;height:100dvh!important;top:0!important;left:0!important}',
      'html[data-mw-fullscreen-game="cat-bond"] #stage>.mw-fullscreen-toggle{position:absolute!important;top:calc(env(safe-area-inset-top,0px) + 94px)!important;right:calc(env(safe-area-inset-right,0px) + 8px)!important;z-index:2147483000!important;min-width:78px!important;min-height:44px!important;padding:9px 11px!important;background:rgba(255,251,242,.94)!important;color:#48624b!important;border-color:#b8cfb8!important;box-shadow:0 3px 12px rgba(49,80,52,.18)!important}',

      '@media(max-width:760px){',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-playstage{display:flex!important;flex-direction:column!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-map-panel{order:1!important;width:100%!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-builder-rail{order:2!important;width:100%!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-resident-rail{order:3!important;width:100%!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .stats.tt-stats .stat .k{font-size:9px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout>aside.panel{justify-content:center!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sidebar-mission .mini-label{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout .stage{width:min(100%,calc((100dvh - 215px)*10/7))!important;max-height:calc(100dvh - 215px)!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-layout{display:flex!important;flex-direction:column!important;gap:6px!important;overflow:hidden!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar{display:flex!important;flex:0 0 auto!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;padding:7px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar .aside-kicker,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar .sidebar-art,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar #sidebar-title,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar #sidebar-subtitle,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar .side-divider,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar .quality-bars,html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .play-sidebar .aside-quiet{display:none!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view .story-paper{flex:1 1 auto!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-foot>span:last-child,html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-foot>span:last-child{display:none!important}',
      '}',
      '@media(max-height:610px){',
      'html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .tank{flex-basis:180px!important;min-height:180px!important}',
      'html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout .stage{width:min(100%,calc((100dvh - 165px)*10/7))!important;max-height:calc(100dvh - 165px)!important}',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  document.addEventListener('fullscreenchange',update);
  document.addEventListener('webkitfullscreenchange',update);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&fallback){e.preventDefault();leave();}
  });
  window.addEventListener('morrowwish-language-change',update);
  window.addEventListener('pageshow',update);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();