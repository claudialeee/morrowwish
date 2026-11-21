/* Morrow Wish: one predictable top-right location for music and sound effects across every game. */
(()=>{'use strict';
 const route=location.pathname.split('/').filter(Boolean)[0];
 const games=['pawsibly-innocent','elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium','cat-bond'];
 if(!games.includes(route))return;
 function mount(){
  if(document.getElementById('mw-audio-dock'))return;
  const music=document.querySelector('#music,.elsewhere-music,[data-mw-music]');
  const effects=document.querySelector('#sound,[data-mw-audio],.lab-mute');
  if(!music||!effects)return;
  const header=route==='cat-bond'?document.querySelector('#stage'):
    route==='tiny-town'?document.querySelector('.top'):
    route==='elsewhere'?document.querySelector('.topbar'):
    route==='pawsibly-innocent'?document.querySelector('.cat-sound-controls'):
    route==='pocket-aquarium'?document.querySelector('body>header'):
    document.querySelector('.game-top');
  if(!header)return;
  const dock=document.createElement('div');dock.id='mw-audio-dock';dock.className='mw-audio-dock';
  dock.setAttribute('role','group');dock.setAttribute('aria-label','Background music and sound effects');
  dock.append(music,effects);
  header.appendChild(dock);
  // A blocked-autoplay permission prompt stays in its fixed page position.
  const css=document.createElement('style');
  css.textContent=`
  .mw-audio-dock{display:flex!important;align-items:center;justify-content:flex-end;flex:0 0 auto;gap:6px;margin-left:auto;max-width:100%;z-index:30}
  .mw-audio-dock button{display:inline-flex!important;align-items:center;justify-content:center;box-sizing:border-box;position:static!important;
    width:auto!important;min-height:42px!important;max-width:100%;padding:9px 11px!important;margin:0!important;
    font:700 11px/1.2 system-ui,-apple-system,sans-serif!important;white-space:nowrap!important;border-radius:999px!important;cursor:pointer}
  .mw-audio-dock .lab-mute{font-size:14px!important;min-width:45px!important}
  .mw-audio-dock button:focus-visible{outline:3px solid #ab7bc7;outline-offset:2px}
  .game-top,.topbar,.sitebar,.top{flex-wrap:wrap}
  .game-top .mw-audio-dock,.top .mw-audio-dock{align-self:flex-start}
  @media(max-width:700px){
   .mw-audio-dock{gap:5px;width:auto;order:-1;margin-left:auto}
   .mw-audio-dock button{font-size:10px!important;padding:9px 8px!important;min-height:44px!important}
   .game-top,.topbar,.sitebar,.top{min-width:0}
   .game-top .mw-audio-dock,.top .mw-audio-dock{width:100%;justify-content:flex-end}
   body[data-game="pocket-aquarium"]>header{flex-wrap:wrap}
  }
  @media(max-width:350px){.mw-audio-dock button{font-size:9px!important;padding:8px 6px!important}}
  `;
  document.head.appendChild(css);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.addEventListener('pageshow',mount);
})();