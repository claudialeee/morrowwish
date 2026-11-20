/* Morrow Wish fullscreen / mobile immersive mode for the seven published games.
   Desktop browsers use the real Fullscreen API. Browsers without element
   fullscreen (including iPhone Safari) get a reversible viewport-sized mode. */
(()=>{
  'use strict';
  const route=location.pathname.split('/').filter(Boolean)[0];
  const games=new Set(['pawsibly-innocent','elsewhere','tiny-town','cat-bond','flip-dash','parcel-panic','pocket-aquarium']);
  if(!games.has(route))return;
  const root=document.documentElement;
  root.dataset.mwFullscreenGame=route;
  let fallback=false,previousScroll=0,button=null,modeWasActive=false,originalContainer=null;
  const gameRegion=()=>{
    const selector={
      'pawsibly-innocent':'.board-layout',
      'tiny-town':'.tt-playstage',
      'cat-bond':'#stage',
      'flip-dash':'.game-frame',
      'parcel-panic':'.game-frame',
      'pocket-aquarium':'body>main',
      'elsewhere':'#play-view:not([hidden])'
    }[route];
    return document.querySelector(selector)||
      document.querySelector(route==='elsewhere'?'.site-wrap':route==='tiny-town'?'.app':route==='pocket-aquarium'?'body>main':'.game-shell');
  };
  function placeToggle(inGame){
    if(!button)return;
    const region=gameRegion();
    if(inGame&&region){
      if(!originalContainer)originalContainer=button.parentElement;
      region.classList.add('mw-fs-region');
      region.appendChild(button);
      button.classList.add('mw-fs-in-game');
    }else{
      button.classList.remove('mw-fs-in-game');
      if(originalContainer?.isConnected)originalContainer.appendChild(button);
    }
  }
  const zh=()=>window.MorrowwishI18n?.get?.()==='zh'||root.lang.toLowerCase().startsWith('zh');
  const nativeActive=()=>!!document.fullscreenElement;
  const active=()=>fallback||nativeActive();
  const isUnsupported=()=>typeof root.requestFullscreen!=='function';
  const copy=()=>{
    const chinese=zh(),on=active();
    if(on&&fallback)return chinese?['退出沉浸','退出沉浸模式（浏览器地址栏可能仍然显示）']:['Exit immersive','Exit immersive view (browser bars may remain visible)'];
    if(on)return chinese?['退出全屏','退出全屏']:['Exit fullscreen','Exit fullscreen'];
    return chinese?['全屏','进入全屏；不支持原生全屏的手机将进入沉浸模式']:['Fullscreen','Enter fullscreen; unsupported browsers use immersive view'];
  };
  function sync(){
    const on=active();
    root.classList.toggle('mw-fs-active',on);
    if(button){
      const [label,title]=copy();
      button.innerHTML='<span class="mw-fs-icon" aria-hidden="true">'+(on?'↙':'⛶')+'</span><span class="mw-fs-label">'+label+'</span>';
      button.setAttribute('aria-label',title);
      button.title=title;
      button.setAttribute('aria-pressed',String(on));
    }
    if(on&&!modeWasActive){
      // A scrollable in-app game viewport replaces document scrolling.
      window.scrollTo(0,0);
      document.querySelector(route==='elsewhere'?'.site-wrap':route==='tiny-town'?'.app':route==='pawsibly-innocent'?'.wrap':route==='pocket-aquarium'?'body>main':'.game-shell')?.scrollTo?.(0,0);
    }else if(!on&&modeWasActive){
      requestAnimationFrame(()=>window.scrollTo(0,previousScroll));
    }
    if(!on&&button?.classList.contains('mw-fs-in-game'))placeToggle(false);
    if(on!==modeWasActive){
      modeWasActive=on;
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new CustomEvent('morrowwish-fullscreen-change',{detail:{active:on,native:nativeActive()}}));
    }
  }
  async function enter(){
    previousScroll=window.scrollY;
    const region=gameRegion();
    if(!region)return;
    placeToggle(true);
    if(typeof region.requestFullscreen==='function'){
      try{
        // Fullscreen the actual play surface, NOT the entire website document.
        await region.requestFullscreen({navigationUI:'hide'});
        fallback=false;
        sync();
        return;
      }catch(_){ /* iOS Safari may reject even if it exposes the API. */ }
    }
    fallback=true;
    sync();
  }
  async function leave(){
    fallback=false;
    if(nativeActive()){
      try{await document.exitFullscreen()}catch(_){}
    }
    placeToggle(false);
    sync();
  }
  function style(){
    if(document.querySelector('#mw-fullscreen-styles'))return;
    const node=document.createElement('style');
    node.id='mw-fullscreen-styles';
    node.textContent=`

      /* Only the gameplay area gets the fullscreen presentation. The normal site design is untouched. */
      .mw-fs-in-game{position:fixed!important;top:max(8px,env(safe-area-inset-top,0px))!important;right:max(8px,env(safe-area-inset-right,0px))!important;left:auto!important;bottom:auto!important;z-index:2147483000!important;opacity:.93}
      .mw-fs-region:fullscreen{box-sizing:border-box;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;overflow:auto;overscroll-behavior:contain;border-radius:0!important;background:#f6f1eb}
      html.mw-fs-active .mw-fs-region{position:fixed!important;inset:0!important;box-sizing:border-box;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;border-radius:0!important;overflow:auto;overscroll-behavior:contain;z-index:2147482000}
      html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #stage,
      html[data-mw-fullscreen-game="cat-bond"] #stage:fullscreen{background:#1b1026}
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout{padding:58px 12px 20px;align-items:start;background:#fbf3ea}
      html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-playstage{padding:55px 12px 20px;background:#f7f3ed}
      html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] #play-view{padding:58px 12px 24px;background:#fcf8f2}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame{display:grid;place-items:center;padding:54px 8px 12px;background:#1c1928}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame canvas,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame canvas{height:auto!important;max-height:calc(100dvh - 90px);object-fit:contain}
      html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] body>main{padding:54px 10px 25px;background:#fbf5ef}
      .mw-fullscreen-toggle{display:inline-flex;gap:5px;align-items:center;justify-content:center;min-height:44px;min-width:80px;padding:8px 12px;
        border:1px solid #b8a8ba;border-radius:999px;background:#fffaf7;color:#624d68;
        font:750 12px/1.1 system-ui,-apple-system,BlinkMacSystemFont,sans-serif;white-space:nowrap;cursor:pointer;touch-action:manipulation;z-index:50}
      .mw-fullscreen-toggle:focus-visible{outline:3px solid #ba7cbf;outline-offset:2px}
      .mw-fullscreen-toggle[aria-pressed="true"]{background:#4c3759;color:white;border-color:#4c3759}
      .mw-fs-icon{font-size:18px;line-height:1}
      .mw-audio-dock .mw-fullscreen-toggle{min-width:76px!important;min-height:44px!important;font-weight:800!important;padding:9px 10px!important}
      html.mw-fs-active{height:100%;height:100dvh;overscroll-behavior:none;overflow:hidden}
      html.mw-fs-active body{height:100%;height:100dvh;overflow:hidden!important;overscroll-behavior:none;margin:0}
      html.mw-fs-active,html.mw-fs-active body{width:100%}
      /* Keep the entire story and town operable in a scrollable app, not a cropped canvas. */
      html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] .site-wrap{box-sizing:border-box;height:100dvh;max-width:none;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:0 clamp(12px,3vw,40px)}
      html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] .topbar{position:sticky;top:0;z-index:55;background:#121723f5;backdrop-filter:blur(10px)}
      html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] .play-layout{max-width:1500px;margin:auto}
      html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .app{box-sizing:border-box;height:calc(100dvh - 46px);max-width:none;overflow-y:auto;overscroll-behavior:contain;padding:12px clamp(10px,2vw,26px) 30px}
      html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .arcade-return{min-height:46px}
      html.mw-fs-active[data-mw-fullscreen-game="tiny-town"] .tt-playstage{max-width:1550px;margin:0 auto}
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .sitebar{box-sizing:border-box;width:100%;max-width:none;padding:7px 14px;min-height:55px}
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .wrap{box-sizing:border-box;height:calc(100dvh - 60px);width:100%;max-width:none;overflow-y:auto;overscroll-behavior:contain;padding:8px clamp(8px,2vw,25px) 25px}
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .heading,
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .explainer{display:none!important}
      html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout{max-width:1550px;margin:auto;grid-template-columns:minmax(0,1fr) minmax(250px,325px)}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-shell,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-shell{box-sizing:border-box;width:100%;max-width:none;height:100dvh;overflow-y:auto;overscroll-behavior:contain;padding:8px clamp(9px,2vw,22px) 16px;display:flex;flex-direction:column;align-items:stretch}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-shell:before,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-shell:before{display:none}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-top,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-top{margin-bottom:7px;gap:8px}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-title,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-title{font-size:clamp(22px,3vw,32px)}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame{width:min(100%,calc((100dvh - 160px)*16/9));flex:none;margin:auto;box-shadow:none}
      html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-foot,
      html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-foot{margin-top:6px}
      html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] body>header{box-sizing:border-box;width:100%;max-width:none;min-height:58px;padding:8px 12px;gap:7px}
      html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] body>main{box-sizing:border-box;height:calc(100dvh - 70px);max-width:1320px;overflow-y:auto;overscroll-behavior:contain;padding:10px clamp(9px,2vw,22px) 18px}
      html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .heading{display:none}
      html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .tank{height:clamp(260px,calc(100dvh - 300px),820px)}
      html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #game-root{height:100dvh;width:100vw}
      html.mw-fs-active[data-mw-fullscreen-game="cat-bond"] #stage{width:100vw;height:100dvh;max-width:none;max-height:none;border-radius:0;box-shadow:none}
      html[data-mw-fullscreen-game="cat-bond"] .mw-fullscreen-toggle{position:fixed;top:calc(env(safe-area-inset-top,0px) + 94px);right:calc(env(safe-area-inset-right,0px) + 10px);z-index:2147482200;background:#292038;color:#ffedf2;border-color:#896d9d}
      @media(max-width:700px){
        .mw-audio-dock .mw-fullscreen-toggle{min-width:68px!important;padding:9px 7px!important;font-size:10px!important}
        html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .board-layout{grid-template-columns:minmax(0,1fr)}
        html.mw-fs-active[data-mw-fullscreen-game="pawsibly-innocent"] .wrap{height:calc(100dvh - 64px)}
        html.mw-fs-active[data-mw-fullscreen-game="pocket-aquarium"] .tank{height:clamp(275px,calc(100dvh - 320px),580px)}
        html.mw-fs-active[data-mw-fullscreen-game="elsewhere"] .site-wrap{padding:0 12px}
        html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-sub,
        html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-sub{display:none}
        html.mw-fs-active[data-mw-fullscreen-game="flip-dash"] .game-frame,
        html.mw-fs-active[data-mw-fullscreen-game="parcel-panic"] .game-frame{width:100%;margin:10px auto}
      }
    `;
    document.head.appendChild(node);
  }
  function mount(){
    if(button||!document.body)return;
    style();
    const target=route==='cat-bond'?document.body:document.querySelector('#mw-audio-dock')
      ||document.querySelector(route==='pawsibly-innocent'?'.cat-sound-controls':route==='tiny-town'?'.top-actions':route==='elsewhere'?'.topbar':route==='pocket-aquarium'?'body>header':'.scoreboard');
    if(!target)return;
    button=document.createElement('button');
    button.type='button';
    button.id='mw-fullscreen-toggle';
    button.className='mw-fullscreen-toggle';
    button.addEventListener('click',()=>{if(active())leave();else enter();});
    target.appendChild(button);
    sync();
  }
  document.addEventListener('fullscreenchange',()=>{
    // Esc and browser fullscreen UI should always bring the original page back.
    if(!nativeActive()&&!fallback)sync();
    else sync();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&fallback){e.preventDefault();leave();}
  });
  window.addEventListener('morrowwish-language-change',sync);
  window.addEventListener('pageshow',sync);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();