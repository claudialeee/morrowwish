/* Morrow Wish licensed game BGM
 * Replaces beep-like procedural tones with finished instrumental recordings.
 * Tracks by AERIS MUSIC, released under CC0 1.0:
 * https://github.com/farmmer938-lgtm/aeris-cc0-music
 * Independent of all gameplay sound effects. */
(()=>{'use strict';
 const slug=location.pathname.split('/').filter(Boolean)[0]||'';
 const catalog={
  'tiny-town':       {title:'Bedroom Window Vast',zh:'窗边的午后',file:'bedroom-window-vast.mp3',volume:.24},
  'flip-dash':       {title:'Overdrive Signal Lost',zh:'疾速信号',file:'overdrive-signal-lost.mp3',volume:.25},
  'parcel-panic':    {title:'Evergreen (Open Road)',zh:'沿途好心情',file:'evergreen-open-road.mp3',volume:.25},
  'pocket-aquarium': {title:'Quiet Room',zh:'静谧时光',file:'quiet-room.mp3',volume:.21}
 };
 const track=catalog[slug];if(!track)return;
 const SOURCE='https://cdn.jsdelivr.net/gh/farmmer938-lgtm/aeris-cc0-music@main/tracks/';
 const FALLBACK='https://raw.githubusercontent.com/farmmer938-lgtm/aeris-cc0-music/main/tracks/';
 const KEY='morrowwish-music-enabled';
 let enabled=true;try{enabled=localStorage.getItem(KEY)!=='0'}catch{}
 let audio=null,button=null,gestureSeen=false,blocked=false,unavailable=false,fallbackUsed=false;
 const zh=()=>slug==='pocket-aquarium'?
  (document.querySelector('.languages button.active')?.id==='zh'):
  (window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh'));
 const label=()=>{
  if(!enabled)return zh()?'♫ 音乐：关':'♫ Music: Off';
  if(unavailable)return zh()?'♫ 音乐暂不可用':'♫ Music unavailable';
  if(blocked)return zh()?'♫ 点击播放音乐':'♫ Tap to play music';
  return zh()?'♫ 音乐：开':'♫ Music: On';
 };
 function sync(){
  if(!button)return;
  button.textContent=label();
  button.title=(zh()?'背景音乐：':'Music: ')+(zh()?track.zh:track.title)+' · CC0';
  button.setAttribute('aria-label',label());
  button.setAttribute('aria-pressed',String(enabled));
  button.classList.toggle('mw-music-off',!enabled);
 }
 function ensureAudio(){
  if(audio)return audio;
  // HTMLMediaElement handles browser sleep, uninterrupted playback and looping
  // natively; the old Web Audio scheduler could get stuck after suspension.
  audio=document.createElement('audio');
  audio.preload='auto';audio.loop=true;audio.volume=track.volume;
  audio.setAttribute('playsinline','');
  audio.setAttribute('aria-hidden','true');
  audio.src=SOURCE+track.file;
  audio.addEventListener('playing',()=>{blocked=false;unavailable=false;sync()});
  audio.addEventListener('pause',()=>{if(enabled&&!document.hidden&&!audio.ended){blocked=!audio.error;sync()}});
  audio.addEventListener('error',()=>{
   if(!fallbackUsed){fallbackUsed=true;const wasEnabled=enabled;audio.src=FALLBACK+track.file;audio.load();if(wasEnabled)play();return}
   unavailable=true;blocked=false;sync();
  });
  return audio;
 }
 function play(){
  if(!enabled||document.hidden||unavailable)return false;
  const player=ensureAudio();
  if(!player.paused){blocked=false;sync();return true}
  try{
   const result=player.play();
   if(result&&typeof result.then==='function'){
    result.then(()=>{blocked=false;unavailable=false;sync()}).catch(e=>{
     if(enabled){blocked=e?.name==='NotAllowedError'||e?.name==='AbortError';sync()}
    });
   }else{blocked=false;sync()}
  }catch{blocked=true;sync();return false}
  return true;
 }
 function pause(){
  if(audio&&!audio.paused)audio.pause();
  blocked=false;sync();
 }
 function setEnabled(on){
  enabled=!!on;
  try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
  if(enabled){unavailable=false;play()}else pause();
  sync();return enabled;
 }
 function toggle(){
  if(enabled&&(blocked||audio?.paused||!audio))return play();
  return setEnabled(!enabled);
 }
 function mount(){
  if(button)return;
  button=document.createElement('button');button.type='button';
  button.className='mw-music-toggle';button.dataset.mwMusic='true';
  button.addEventListener('click',evt=>{evt.stopPropagation();gestureSeen=true;toggle()});
  const css=document.createElement('style');
  css.textContent='.mw-music-toggle{font:750 12px/1.3 system-ui,sans-serif;background:#f7e9f2;color:#6c5077;border:1px solid #dec6db;border-radius:999px;padding:8px 12px;min-height:35px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px #8a708619}.mw-music-toggle:hover{background:#f0dfed}.mw-music-toggle:focus-visible{outline:3px solid #bca1e0;outline-offset:2px}.mw-music-toggle.mw-music-off{background:#f6f4f2;color:#8b8187;border-color:#e6dedf}@media(max-width:620px){.mw-music-toggle{font-size:10px;padding:7px 9px}}';
  document.head.appendChild(css);
  const holder=slug==='tiny-town'?document.querySelector('.top-actions'):
    slug==='pocket-aquarium'?document.querySelector('header'):document.querySelector('.scoreboard');
  if(holder)holder.appendChild(button);
  else{button.classList.add('mw-music-fixed');css.textContent+='.mw-music-fixed{position:fixed;bottom:100px;right:12px;z-index:9999}';document.body.appendChild(button)}
  sync();
 }
 function unlock(evt){
  if(evt.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(evt.key))return;
  if(evt.target?.closest?.('[data-mw-music]'))return; // Prevent pointerdown + click double-toggle.
  gestureSeen=true;
  if(enabled&&(!audio||audio.paused))play();
 }
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',unlock,true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){audio?.pause();sync()}else if(enabled)play()});
 window.addEventListener('pageshow',()=>{if(enabled)play()});
 window.addEventListener('pagehide',()=>{audio?.pause()});
 window.addEventListener('morrowwish-language-change',()=>setTimeout(sync,0));
 if(slug==='pocket-aquarium')document.addEventListener('click',e=>{if(e.target.closest?.('.languages'))setTimeout(sync,0)});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 if(enabled)play(); // Attempt immediately; browsers may require first user gesture.
 window.MorrowwishMusic={start:play,stop:pause,toggle,sync,status:()=>({
  game:slug,enabled,playing:!!audio&&!audio.paused,blocked,unavailable,source:audio?.currentSrc||audio?.src||SOURCE+track.file,
  track:track.title,currentTime:audio?.currentTime||0,loop:audio?.loop===true
 })};
})();