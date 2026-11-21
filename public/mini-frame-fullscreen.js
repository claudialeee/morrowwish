/* Morrow Wish — gameplay-frame fullscreen for the three quick games only.
   Reparent the LIVE HUD/controls (never clone them) so scores and buttons stay
   synchronized with existing game scripts, including achievements and i18n. */
(()=>{
  'use strict';
  const route=location.pathname.split('/').filter(Boolean)[0];
  const games=['flip-dash','parcel-panic','pocket-aquarium','orbit-escape','tower-tuck','traffic-tangle','color-current','perfect-pour','grid-glider','mirror-mosaic','echo-heist'];
  if(!games.includes(route))return;

  const root=document.documentElement;
  let frame,button,fallback=false,wasActive=false,returnScroll=0,entryPortrait=false;
  const touchDevice=()=>navigator.maxTouchPoints>0||window.matchMedia?.('(pointer:coarse)').matches;
  function snapshotOrientation(){
    const view=window.visualViewport;
    const width=view?.width||window.innerWidth;
    const height=view?.height||window.innerHeight;
    entryPortrait=height>=width;
  }
  const nativeActive=()=>document.fullscreenElement===frame;
  const active=()=>!!frame&&(fallback||nativeActive());
  const zh=()=>document.documentElement.lang.toLowerCase().startsWith('zh')||
    window.MorrowwishI18n?.get?.()==='zh';

  function fitArcadeCanvas(){
    if(!frame)return;
    // iPhone Safari may shrink the visible viewport as browser chrome changes.
    const view=window.visualViewport;
    frame.style.setProperty('--mw-mini-fs-width',Math.round(view?.width||window.innerWidth)+'px');
    frame.style.setProperty('--mw-mini-fs-height',Math.round(view?.height||window.innerHeight)+'px');
    frame.style.setProperty('--mw-mini-fs-left',Math.round(view?.offsetLeft||0)+'px');
    frame.style.setProperty('--mw-mini-fs-top',Math.round(view?.offsetTop||0)+'px');
    if(route==='pocket-aquarium')return;
    // Freeze the selected gameplay orientation until the player exits fullscreen.
    // Browser chrome and gyroscope-driven viewport resizing must not flip the game.
    const screenPortrait=active()&&entryPortrait;
    // Only these games have a real 540x960 drawing implementation. Every
    // other puzzle retains its full 960x540 board: scale to fit, NEVER crop.
    const portrait=screenPortrait&&(route==='flip-dash'||route==='parcel-panic');
    const changed=frame.classList.contains('mw-mini-portrait')!==portrait;
    frame.classList.toggle('mw-mini-screen-portrait',screenPortrait);
    frame.classList.toggle('mw-mini-portrait',portrait);
    if(changed)window.dispatchEvent(new CustomEvent('morrowwish-mini-viewport-change',{detail:{portrait}}));
    const area=frame.querySelector('.mw-mini-playfield');
    if(!area)return;
    if(!active()){frame.style.removeProperty('--mw-mini-canvas-width');return;}
    const rect=area.getBoundingClientRect();
    const aspect=portrait?9/16:16/9;
    const width=Math.max(1,Math.floor(Math.min(rect.width,rect.height*aspect)));
    frame.style.setProperty('--mw-mini-canvas-width',width+'px');
  }
  function sizeChanged(){
    requestAnimationFrame(()=>{
      fitArcadeCanvas();
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(()=>{
        fitArcadeCanvas();
        window.dispatchEvent(new Event('resize'));
      });
    });
  }
  function update(){
    if(!frame)return;
    const on=active();
    root.classList.toggle('mw-mini-fullscreen-on',on);
    frame.classList.toggle('mw-mini-fullscreen-fallback',fallback);
    fitArcadeCanvas();
    if(button){
      const label=on?(zh()?'退出全屏':'Exit fullscreen'):(zh()?'全屏游戏':'Fullscreen game');
      button.textContent=(on?'↙ ':'⛶ ')+label;
      button.setAttribute('aria-label',label);
      button.setAttribute('aria-pressed',String(on));
      button.title=label;
    }
    if(on!==wasActive){
      wasActive=on;
      if(!on)requestAnimationFrame(()=>window.scrollTo(0,returnScroll));
      sizeChanged();
    }
  }
  async function enter(){
    returnScroll=window.scrollY;
    snapshotOrientation();
    // Native element fullscreen can force landscape on mobile browsers.
    // Use in-page immersive fullscreen instead, preserving entry orientation.
    if(!touchDevice()&&typeof frame.requestFullscreen==='function'){
      try{
        await frame.requestFullscreen({navigationUI:'hide'});
        fallback=false;
        update();
        return;
      }catch(_){/* iPhone Safari and some embedded frames disallow element fullscreen. */}
    }
    fallback=true;
    update();
  }
  async function leave(){
    fallback=false;
    if(nativeActive()){
      try{await document.exitFullscreen();}catch(_){}
    }
    update();
  }
  function createButton(){
    button=document.createElement('button');
    button.id='mw-mini-fullscreen';
    button.className='mw-mini-fullscreen-button';
    button.type='button';
    button.addEventListener('click',()=>active()?leave():enter());
    return button;
  }
  function setupArcade(){
    frame=document.querySelector('.game-frame');
    const canvas=frame?.querySelector('#game');
    const overlay=frame?.querySelector('#overlay');
    const scoreboard=document.querySelector('.game-top .scoreboard');
    const footer=document.querySelector('.game-shell>.game-foot');
    if(!frame||!canvas||!overlay||!scoreboard)return false;
    frame.classList.add('mw-mini-arcade-frame');

    // The HUD is now inside the colored interactive frame in regular AND
    // fullscreen play. Keeping the exact nodes preserves event listeners.
    frame.prepend(scoreboard);
    scoreboard.classList.add('mw-mini-frame-hud');
    scoreboard.append(createButton());

    const playfield=document.createElement('div');
    playfield.className='mw-mini-playfield';
    frame.append(playfield);
    playfield.append(canvas,overlay);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitArcadeCanvas).observe(playfield);
    if(footer){
      footer.classList.add('mw-mini-frame-status');
      frame.append(footer);
    }
    return true;
  }
  function setupAquarium(){
    frame=document.querySelector('#tank');
    const shell=document.querySelector('.shell');
    if(!frame||!shell)return false;
    const scores=shell.querySelector('.scores');
    const meters=shell.querySelector('.meters');
    const foods=shell.querySelector('.foods');
    const under=shell.querySelector('.under');
    if(!scores||!meters||!foods||!under)return false;
    frame.classList.add('mw-mini-aquarium-frame');

    const top=document.createElement('div');
    top.className='mw-mini-aqua-top';
    top.append(scores,createButton());
    const bottom=document.createElement('div');
    bottom.className='mw-mini-aqua-bottom';
    bottom.append(meters,foods,under);
    frame.append(top,bottom);
    return true;
  }
  function setupEcho(){
    frame=document.querySelector('.frame');
    const canvas=frame?.querySelector('#play');
    const cover=frame?.querySelector('#cover');
    const stats=document.querySelector('.stats');
    const tools=document.querySelector('.tools');
    if(!frame||!canvas||!cover||!stats||!tools)return false;
    frame.classList.add('mw-mini-echo-frame');
    const head=document.createElement('div');
    head.className='mw-mini-echo-head';
    head.append(stats,createButton());
    const area=document.createElement('div');
    area.className='mw-mini-playfield';
    area.append(canvas,cover);
    frame.append(head,area,tools);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitArcadeCanvas).observe(area);
    return true;
  }
  function mount(){
    if(document.getElementById('mw-mini-fullscreen'))return;
    const ok=route==='pocket-aquarium'?setupAquarium():(route==='echo-heist'?setupEcho():setupArcade());
    if(!ok)return;
    update();
    sizeChanged();
  }
  document.addEventListener('fullscreenchange',update);
  document.addEventListener('webkitfullscreenchange',update);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&fallback){event.preventDefault();leave();}
  });
  window.addEventListener('resize',fitArcadeCanvas);
  window.addEventListener('orientationchange',sizeChanged);
  window.visualViewport?.addEventListener('resize',sizeChanged);
  window.visualViewport?.addEventListener('scroll',fitArcadeCanvas);
  window.addEventListener('morrowwish-language-change',update);
  window.addEventListener('pageshow',update);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();