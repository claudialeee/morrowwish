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
#mw-game-settings{position:relative!important;inset:auto!important;transform:none!important;z-index:2147483000!important;display:inline-flex!important;align-items:center!important;gap:3px!important;padding:1px!important;margin:0 0 0 auto!important;flex:0 0 auto!important;width:auto!important;height:auto!important;background:transparent!important;border:0!important;box-shadow:none!important;pointer-events:auto!important}
#mw-game-settings button{position:relative!important;inset:auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:32px!important;min-width:32px!important;height:34px!important;min-height:34px!important;margin:0!important;padding:0!important;border:1px solid #e3d5df!important;border-radius:9px!important;background:#fffaf7!important;color:#624765!important;box-shadow:0 1px 4px #40304019!important;font:800 12px/1 system-ui,sans-serif!important;opacity:1!important;cursor:pointer!important;touch-action:manipulation!important}
#mw-game-settings button[aria-pressed="true"]{background:#f2e1f2!important;border-color:#c4a4c7!important}
#mw-game-settings button:focus-visible{outline:3px solid #aa80c4!important}
#mw-game-settings .mw-settings-language{width:39px!important;min-width:39px!important;font-size:11px!important}
#mw-game-settings .mw-settings-music{font-size:20px!important}
#mw-game-settings .mw-settings-sfx{font-size:15px!important}
#mw-language,#mw-audio-dock,.mw-language-float{display:none!important}
body [data-mw-music],body [data-mw-audio],body .lab-mute,body #music,body #sound,body .elsewhere-music{display:none!important}
.home-audio,.game-tools .dream-sound{display:none!important}
html[data-mw-settings-game="elsewhere"] .top-right .language-switch{display:none!important}
@media(max-width:700px){
html[data-mw-settings-game="pawsibly-innocent"] .single-screen-game .in-game-head-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'room tools' 'status status'!important;gap:3px!important;align-items:center!important}
html[data-mw-settings-game="pawsibly-innocent"] .single-screen-game .sticker{grid-area:room!important;max-width:100%!important;min-width:0!important}
html[data-mw-settings-game="pawsibly-innocent"] .single-screen-game .heist-status{grid-area:status!important;justify-self:start!important;margin:0!important}
html[data-mw-settings-game="pawsibly-innocent"] .single-screen-game #stageControls{grid-area:tools!important;justify-self:end!important}
html[data-mw-settings-game="pawsibly-innocent"] #menuButtonLabel{display:none!important}
html[data-mw-settings-game="pawsibly-innocent"] #stageControls #menuButton{font-size:21px!important}
}

#hud #mw-game-settings{pointer-events:auto!important;margin-left:auto!important}
#hud .scene-title{display:none!important}
#stageControls #mw-game-settings{order:5;margin-left:2px!important}
.top-right #mw-game-settings,.top-actions #mw-game-settings{margin-left:5px!important}
.mw-mini-arcade-frame>.mw-mini-frame-hud{display:flex!important;align-items:center!important;flex-wrap:nowrap!important;gap:3px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none}
.mw-mini-arcade-frame>.mw-mini-frame-hud::-webkit-scrollbar{display:none}
.mw-mini-arcade-frame .mw-mini-fullscreen-button{margin-left:0!important}
html.mw-fs-active #mw-game-settings,html.mw-mini-fullscreen-on #mw-game-settings{display:inline-flex!important;pointer-events:auto!important}
@media(max-width:700px){
#mw-game-settings{gap:2px!important;padding:0!important}
#mw-game-settings button{width:28px!important;min-width:28px!important;height:32px!important;min-height:32px!important;border-radius:8px!important}
#mw-game-settings .mw-settings-language{width:36px!important;min-width:36px!important;font-size:10px!important}
html[data-mw-settings-game="cat-bond"] #hud{top:0!important;flex-wrap:nowrap!important;gap:3px!important;padding:5px!important}
html[data-mw-settings-game="cat-bond"] #hud .hud-pill{padding:5px!important;font-size:11px!important;gap:2px!important}
html[data-mw-settings-game="cat-bond"] #hud .hud-pill .ico{font-size:12px!important}
html[data-mw-settings-game="cat-bond"] #hud .hud-spacer{flex:1 1 1px;min-width:0}
html[data-mw-settings-game="pawsibly-innocent"] .single-screen-game .in-game-top{top:0!important}
html[data-mw-settings-game="pawsibly-innocent"] .in-game-controls{flex-wrap:nowrap!important;gap:3px!important}
html[data-mw-settings-game="pawsibly-innocent"] .in-game-controls .hud-icon,html[data-mw-settings-game="pawsibly-innocent"] .in-game-controls .mw-fullscreen-toggle{width:32px!important;min-width:32px!important;height:34px!important;min-height:34px!important;font-size:15px!important}
.mw-mini-arcade-frame .mw-mini-frame-hud{padding:5px!important;gap:3px!important}
.mw-mini-arcade-frame .mw-mini-frame-hud .score-chip{min-width:43px!important;padding:3px 4px!important;font-size:13px!important}
.mw-mini-arcade-frame .mw-mini-frame-hud .icon-btn{min-width:29px!important;width:29px!important;min-height:32px!important;height:32px!important;padding:0!important}
.mw-mini-arcade-frame .mw-mini-fullscreen-button{font-size:0!important;min-width:30px!important;width:30px!important;min-height:32px!important;padding:0!important}
.mw-mini-arcade-frame .mw-mini-fullscreen-button::after{content:'⛶';font:800 20px/1 system-ui}
.mw-mini-arcade-frame .mw-mini-fullscreen-button[aria-pressed="true"]::after{content:'↙'}
.mw-mini-aquarium-frame .mw-mini-aqua-top{flex-wrap:nowrap!important;gap:3px!important}
.mw-mini-aquarium-frame .mw-mini-aqua-top .mw-mini-fullscreen-button{font-size:0!important;min-width:30px!important;width:30px!important;padding:0!important}
.mw-mini-aquarium-frame .mw-mini-aqua-top .mw-mini-fullscreen-button::after{content:'⛶';font:800 19px/1 system-ui}
}
`;
let dock,btnLang,btnMusic,btnSfx;
const hiddenMenuControls=()=>route==='pawsibly-innocent';
let fallbackMusic=null,fallbackEnabled=false,fallbackFxEnabled=true,fallbackFxCtx=null;
try{fallbackFxEnabled=localStorage.getItem('morrowwish-universal-fx')!=='0';fallbackEnabled=localStorage.getItem('morrowwish-universal-music')==='1'}catch(_){}
function recordedFallback(){
 if(!fallbackMusic){
  fallbackMusic=new Audio('/audio/cat-happy-clappy.ogg');
  fallbackMusic.loop=true;fallbackMusic.preload='auto';fallbackMusic.volume=.12;
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
 else{
  fallbackFxEnabled=!fallbackFxEnabled;
  try{localStorage.setItem('morrowwish-universal-fx',fallbackFxEnabled?'1':'0')}catch(_){}
 }
 sync();
}
function gameTapSound(event){
 if(fxAPI()||!fallbackFxEnabled||event.target.closest?.('#mw-game-settings'))return;
 if(!event.target.closest?.('canvas,button,[role="button"]'))return;
 try{
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)return;
  fallbackFxCtx??=new AudioContextClass();
  if(fallbackFxCtx.state==='suspended')fallbackFxCtx.resume().catch(()=>{});
  const o=fallbackFxCtx.createOscillator(),v=fallbackFxCtx.createGain(),t=fallbackFxCtx.currentTime;
  o.type='sine';o.frequency.setValueAtTime(510,t);
  o.frequency.exponentialRampToValueAtTime(660,t+.06);
  v.gain.setValueAtTime(.0001,t);
  v.gain.linearRampToValueAtTime(.014,t+.008);
  v.gain.exponentialRampToValueAtTime(.0001,t+.09);
  o.connect(v);v.connect(fallbackFxCtx.destination);o.start(t);o.stop(t+.1);
 }catch(_){}
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
 const fxOn=route==='elsewhere'?(fs?.fxOn!==false):(fx?.isEnabled?.()??fs?.enabled??fallbackFxEnabled);
 btnSfx.textContent=fxOn?'◖))':'◖';
 btnSfx.setAttribute('aria-pressed',String(!!fxOn));
 btnSfx.title=chinese?(fxOn?'关闭音效':'开启音效'):(fxOn?'Turn sound effects off':'Turn sound effects on');
 btnSfx.setAttribute('aria-label',btnSfx.title);
}
function correctHost(){
 if(!dock)return;
 const full=document.fullscreenElement;
 const root=full||document;
 const candidates=route==='pawsibly-innocent'?['#stageControls','.in-game-controls']:
 route==='cat-bond'?['#hud']:
 route==='elsewhere'?['.game-top .game-tools','.top-right','.game-top']:
 route==='tiny-town'?['.top-actions','.header']:
 route==='pocket-aquarium'?['.mw-mini-aqua-top','.scores','header']:
 ['.mw-mini-frame-hud','.game-top .scoreboard','.scoreboard','.game-top','.topbar','header'];
 let anchor=null;
 for(const selector of candidates){const el=root.querySelector?.(selector);if(el){anchor=el;break;}}
 if(!anchor&&full)anchor=full.querySelector?.('.game-top,header,.game-tools,#hud')||full;
 if(!anchor){for(const selector of candidates){anchor=document.querySelector(selector);if(anchor)break;}}
 if(anchor&&dock.parentElement!==anchor)anchor.appendChild(dock);
 if(route==='elsewhere')document.querySelectorAll('.home-audio,.game-tools .dream-sound').forEach(el=>{el.style.display='none'});
}
function mount(){
 if(dock||!document.body)return;
 document.documentElement.dataset.mwSettingsGame=route;
 ensureLanguage();
 const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
 dock=document.createElement('div');dock.id='mw-game-settings';
 dock.setAttribute('role','group');dock.setAttribute('aria-label','Language, music and sound settings');
 const button=(cls,click)=>{const el=document.createElement('button');el.type='button';el.className=cls;el.addEventListener('click',e=>{e.stopPropagation();click()});return el};
 btnLang=button('mw-settings-language',()=>setLanguage(zh()?'en':'zh'));
 btnMusic=button('mw-settings-music',toggleMusic);
 btnSfx=button('mw-settings-sfx',toggleEffects);
 dock.append(btnLang,btnMusic,btnSfx);
 document.addEventListener('pointerdown',gameTapSound,{passive:true});
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