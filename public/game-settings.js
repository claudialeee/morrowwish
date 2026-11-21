/* Morrow Wish — one visible settings dock shared by every playable game.
   Buttons call the actual game's language, recorded music and sound APIs. */
(()=>{'use strict';
const route=location.pathname.split('/').filter(Boolean)[0]||'';
if(!route||route==='studio-insights')return;
const KEY='morrowwish.language';
const $=s=>document.querySelector(s);
const lang=()=>window.MorrowwishI18n?.get?.()||(document.documentElement.lang.toLowerCase().startsWith('zh')?'zh':'en');
const zh=()=>lang()==='zh';
const ensureLanguage=()=>{
 if(window.MorrowwishI18n||route==='elsewhere')return;
 if(!document.querySelector('script[src^="/lang.js"]')){
  const script=document.createElement('script');script.src='/lang.js';document.head.appendChild(script);
 }
};
const CSS=`
#mw-game-settings{position:fixed!important;top:max(8px,env(safe-area-inset-top))!important;right:max(8px,env(safe-area-inset-right))!important;left:auto!important;bottom:auto!important;z-index:2147483640!important;display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:nowrap!important;padding:5px!important;background:rgba(255,251,248,.94)!important;border:1px solid rgba(130,94,116,.22)!important;box-shadow:0 4px 14px rgba(56,39,64,.15)!important;backdrop-filter:blur(10px);border-radius:15px!important;max-width:calc(100vw - 16px)!important;pointer-events:auto!important;transform:none!important;isolation:isolate}
#mw-game-settings button{position:static!important;display:inline-flex!important;justify-content:center!important;align-items:center!important;flex:0 0 auto!important;padding:0!important;margin:0!important;width:37px!important;height:37px!important;min-width:37px!important;min-height:37px!important;border-radius:10px!important;background:#fffdf9!important;border:1px solid #e4d6df!important;color:#66496b!important;font:800 13px/1 system-ui,sans-serif!important;box-shadow:none!important;white-space:nowrap!important;opacity:1!important;visibility:visible!important;cursor:pointer!important;touch-action:manipulation!important}
#mw-game-settings button[aria-pressed="true"]{background:#f4e4f3!important;border-color:#c4a6c7!important}
#mw-game-settings button:focus-visible{outline:3px solid #aa80c4!important;outline-offset:1px!important}
#mw-game-settings button:disabled{opacity:.5!important;cursor:not-allowed!important}
#mw-game-settings .mw-settings-language{font-size:11px!important;width:42px!important;min-width:42px!important}
#mw-game-settings .mw-settings-music{font-size:23px!important}
#mw-game-settings .mw-settings-sfx{font-size:17px!important}
@media(max-width:450px){#mw-game-settings{top:max(5px,env(safe-area-inset-top))!important;right:max(5px,env(safe-area-inset-right))!important;gap:3px!important;padding:3px!important}#mw-game-settings button{width:33px!important;min-width:33px!important;height:35px!important;min-height:35px!important}#mw-game-settings .mw-settings-language{width:39px!important;min-width:39px!important}}
/* The old floating language and audio docks must not overlap the new controls. */
#mw-language,#mw-audio-dock,.mw-language-float{display:none!important}
`;
let dock,btnLang,btnMusic,btnSfx;
const hiddenMenuControls=()=>route==='pawsibly-innocent';
let fallbackMusic=null,fallbackEnabled=false;
function recordedFallback(){
 if(!fallbackMusic){
  fallbackMusic=new Audio('/audio/cat-happy-clappy.ogg');
  fallbackMusic.loop=true;fallbackMusic.preload='auto';fallbackMusic.volume=.12;
  fallbackEnabled=localStorage.getItem('morrowwish-universal-music')==='1';
 }
 return fallbackMusic;
}
function musicAPI(){
 if(route==='elsewhere')return {status:()=>window.DreamAudio?.status(),toggle:()=>window.DreamAudio?.toggleMusic()};
 if(route==='pawsibly-innocent')return window.MorrowwishCatMusic;
 if(window.MorrowwishMusic)return window.MorrowwishMusic;
 return null;
}
function fxAPI(){
 if(route==='elsewhere')return {status:()=>window.DreamAudio?.status(),toggle:()=>window.DreamAudio?.toggleFX()};
 return window.MorrowwishAudio;
}
function setLanguage(next){
 if(route==='elsewhere'){
  const native=$('[data-language="'+next+'"]');native?.click();
 }else if(window.MorrowwishI18n?.set){
  window.MorrowwishI18n.set(next);
 }else{
  try{localStorage.setItem(KEY,next)}catch(_){}
  document.documentElement.lang=next==='zh'?'zh-CN':'en';
  window.dispatchEvent(new CustomEvent('morrowwish-language-change',{detail:{lang:next}}));
 }
 sync();
}
function toggleMusic(){
 const api=musicAPI();
 if(api?.toggle){api.toggle();}
 else if(api){
  const native=$('[data-dream-music]');native?.click();
 }else{
  const a=recordedFallback();
  fallbackEnabled=!fallbackEnabled;
  try{localStorage.setItem('morrowwish-universal-music',fallbackEnabled?'1':'0')}catch(_){}
  if(fallbackEnabled)a.play().catch(()=>{});else a.pause();
 }
 sync();
}
function toggleEffects(){
 const api=fxAPI();
 if(api?.toggle)api.toggle();
 else if(route==='pawsibly-innocent')document.getElementById('sound')?.click();
 sync();
}
function sync(){
 if(!dock)return;
 const chinese=zh();
 btnLang.textContent=chinese?'EN':'中文';
 btnLang.title=chinese?'Switch to English':'切换成中文';
 btnLang.setAttribute('aria-label',btnLang.title);
 const api=musicAPI(),status=api?.status?.();
 const on=status?.musicOn??status?.enabled??fallbackEnabled;
 btnMusic.textContent=on?'♫':'♪';
 btnMusic.setAttribute('aria-pressed',String(!!on));
 btnMusic.title=chinese?(on?'关闭音乐':'播放音乐'):(on?'Turn music off':'Play music');
 btnMusic.setAttribute('aria-label',btnMusic.title);
 const fx=fxAPI(),fs=fx?.status?.();
 const fxOn=route==='elsewhere'?(fs?.fxOn!==false):(fx?.isEnabled?.()??fs?.enabled??true);
 btnSfx.textContent=fxOn?'◖))':'◖';
 btnSfx.setAttribute('aria-pressed',String(!!fxOn));
 btnSfx.title=chinese?(fxOn?'关闭音效':'开启音效'):(fxOn?'Turn sound effects off':'Turn sound effects on');
 btnSfx.setAttribute('aria-label',btnSfx.title);
}
function correctHost(){
 if(!dock)return;
 // Native fullscreen only shows descendants of the fullscreen element.
 const host=document.fullscreenElement||document.body;
 if(dock.parentElement!==host)host.appendChild(dock);
 // Hide legacy controls without deleting any underlying event listeners.
 if(route==='elsewhere'){
  document.querySelectorAll('.home-audio,.game-tools .dream-sound,.top-right .language-switch').forEach(el=>{el.style.display='none'});
 }
}
function mount(){
 if(dock||!document.body)return;
 ensureLanguage();
 const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
 dock=document.createElement('div');dock.id='mw-game-settings';
 dock.setAttribute('role','group');dock.setAttribute('aria-label','Language, music and sound settings');
 const button=(cls,click)=>{const el=document.createElement('button');el.type='button';el.className=cls;el.addEventListener('click',e=>{e.stopPropagation();click()});return el};
 btnLang=button('mw-settings-language',()=>setLanguage(zh()?'en':'zh'));
 btnMusic=button('mw-settings-music',toggleMusic);
 btnSfx=button('mw-settings-sfx',toggleEffects);
 dock.append(btnLang,btnMusic,btnSfx);
 correctHost();sync();
 window.addEventListener('morrowwish-language-change',sync);
 document.addEventListener('fullscreenchange',()=>{correctHost();sync()});
 document.addEventListener('webkitfullscreenchange',()=>{correctHost();sync()});
 window.addEventListener('pageshow',()=>{correctHost();sync()});
 window.addEventListener('morrowwish-fullscreen-change',()=>{correctHost();sync()});
 window.addEventListener('morrowwish-mini-viewport-change',()=>{correctHost();sync()});
 // Existing game scripts initialize audio lazily and may redraw their controls.
 setInterval(()=>{correctHost();sync()},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();