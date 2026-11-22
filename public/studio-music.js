/* Morrow Wish: four distinct bright CC0 game recordings.
 * Replaces overly bass-heavy, similar-sounding Lo-fi with lighter genres.
 * Source: FreePD (public-domain music), available via its FreePD mirror.
 * https://en.freepd.cn/music — CC0 / commercial use permitted.
 * Existing game sound effects are separate; no synthesised one-note music. */
(()=>{'use strict';
 const slug=location.pathname.split('/').filter(Boolean)[0]||'';
 const catalog={
   'tiny-town': {
     title:'Happy Whistling Ukulele',zh:'开心的口哨与尤克里里',genre:'bright acoustic',
     url:'https://en.freepd.cn/api/music/5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033',
     volume:.14
   },
   'flip-dash': {
     title:'Inventing Flight',zh:'轻快飞行',genre:'uplifting adventure',
     url:'https://en.freepd.cn/api/music/5570626561742f496e76656e74696e6720466c696768742e6d7033',
     volume:.13
   },
   'parcel-panic': {
     title:'Funshine',zh:'阳光好心情',genre:'light upbeat',
     url:'https://en.freepd.cn/api/music/5570626561742f46756e7368696e652e6d7033',
     volume:.09
   },
   'cat-bond': {
     title:'My Giant Bunny Friend',zh:'小动物的欢乐庭院',genre:'gentle playful acoustic',
     // Recorded CC0 track (Comedy collection); distinct from the other games.
     url:'https://en.freepd.cn/api/music/436f6d6564792f4d79204769616e742042756e6e7920467269656e642e6d7033',
     volume:.10
   },
   'pocket-aquarium': {
     title:'Connecting Rainbows',zh:'彩虹相连',genre:'gentle world music',
     url:'https://en.freepd.cn/api/music/576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033',
     volume:.11
   }
 };
 const track=catalog[slug];if(!track)return;
 // CC0 battle cue, quieter than the garden track so paw/element SFX stay clear.
 const combatTrack={title:'Jungle Mission',zh:'猫猫战斗',genre:'playful pursuit',
  url:'https://en.freepd.cn/api/music/436f6d6564792f4a756e676c65204d697373696f6e2e6d7033',volume:.042};
 let scene='yard',duckTimer=null;
 const active=()=>slug==='cat-bond'&&scene==='battle'?combatTrack:track;
 const KEY='morrowwish-music-enabled';
 let enabled=true;try{enabled=localStorage.getItem(KEY)!=='0'}catch{}
 let audio=null,button=null,gestureSeen=false,blocked=false,unavailable=false;
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
  button.title=(zh()?'轻盈配乐：':'Light background music: ')+(zh()?active().zh:active().title)+' · FreePD CC0';
  button.setAttribute('aria-label',label());
  button.setAttribute('aria-pressed',String(enabled));
  button.classList.toggle('mw-music-off',!enabled);
 }
 function ensureAudio(){
  if(audio)return audio;
  // HTMLMediaElement handles browser sleep, uninterrupted playback and looping
  // natively; the old Web Audio scheduler could get stuck after suspension.
  audio=document.createElement('audio');
  audio.preload='auto';audio.loop=true;audio.volume=active().volume;
  audio.setAttribute('playsinline','');
  audio.setAttribute('aria-hidden','true');
  audio.src=track.url;
  if(slug==='cat-bond'&&scene==='battle')audio.src=active().url;
  audio.addEventListener('playing',()=>{blocked=false;unavailable=false;sync()});
  audio.addEventListener('pause',()=>{if(enabled&&!document.hidden&&!audio.ended){blocked=!audio.error;sync()}});
  audio.addEventListener('error',()=>{
   // Optional local recorded-CC0 fallback for Cat Bond if the CDN is offline.
   if(slug==='cat-bond'&&!audio.dataset.catBondFallback){
     audio.dataset.catBondFallback='1';
     audio.src=scene==='battle'?catalog['flip-dash'].url:catalog['tiny-town'].url;
     audio.load();if(enabled&&gestureSeen)play();
     return;
   }
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
 function switchScene(next){
  if(slug!=='cat-bond')return false;
  const desired=next==='battle'?'battle':'yard';
  if(scene===desired)return true;
  scene=desired;
  if(duckTimer){clearTimeout(duckTimer);duckTimer=null;}
  if(audio){
   audio.pause();audio.dataset.catBondFallback='';
   audio.src=active().url;audio.volume=active().volume;audio.load();
  }
  unavailable=false;blocked=false;sync();
  if(enabled&&gestureSeen)play();
  return true;
 }
 function duckFor(ms=2200){
  if(slug!=='cat-bond'||scene!=='battle'||!audio)return;
  if(duckTimer)clearTimeout(duckTimer);
  audio.volume=Math.min(active().volume,.016);
  duckTimer=setTimeout(()=>{duckTimer=null;if(audio)audio.volume=active().volume;},
    Math.max(300,Math.min(4500,ms)));
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
  const holder=slug==='cat-bond'?document.querySelector('#stage'):
    slug==='tiny-town'?document.querySelector('.top-actions'):
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
 window.MorrowwishMusic={start:play,stop:pause,toggle,sync,switchScene,duckFor,status:()=>({scene,volume:audio?.volume??active().volume,
  game:slug,enabled,playing:!!audio&&!audio.paused,blocked,unavailable,source:audio?.currentSrc||audio?.src||track.url,
  track:active().title,currentTime:audio?.currentTime||0,loop:audio?.loop===true
 })};
})();