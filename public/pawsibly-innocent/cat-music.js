/* Pawsibly Innocent — recorded, CC0 piano loop. Separate from game SFX.
   Happy Clappy Loop, OwlishMedia (2018), CC0 1.0, OpenGameArt:
   https://opengameart.org/content/happy-clappy-loop
   Other games remain SFX-only. */
(()=>{'use strict';
const button=document.getElementById('music'),credit=document.getElementById('musicCredit');
if(!button)return;
const KEY='morrowwish-cat-music-enabled';
let wanted=true,started=false,error='';
try{const saved=localStorage.getItem(KEY);if(saved==='0'||saved==='1')wanted=saved==='1'}catch{}
const audio=document.createElement('audio');
audio.id='catRecordedMusic';audio.loop=true;audio.preload=wanted?'auto':'none';audio.volume=.16;
audio.src='/audio/cat-happy-clappy.ogg';audio.setAttribute('aria-hidden','true');
document.body.appendChild(audio);
// Start transferring and decoding the recording immediately, BEFORE the first click.
// Browsers may block autoplay with sound, but they do permit early buffering.
if(wanted)audio.load();
const lang=()=>window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh')?'zh':'en';
function sync(){
 const zh=lang()==='zh';
 button.textContent=wanted?(zh?'♫ 背景音乐：开':'♫ Background music: On'):(zh?'♫ 背景音乐：关':'♫ Background music: Off');
 button.setAttribute('aria-pressed',String(wanted));
 button.setAttribute('aria-label',button.textContent);
 if(credit){credit.querySelector('a').textContent=zh?'配乐：轻快钢琴曲（CC0 公共领域）':'Music: Happy Clappy Loop · OwlishMedia (CC0)'}
}
function start(){
 if(!wanted||document.hidden)return false;
 // Calling play() directly from the trusted interaction preserves autoplay permission.
 // The file was already requested on page load, so the first click should play quickly.
 const result=audio.play();
 if(result&&typeof result.then==='function')result.then(()=>{started=true;error='';}).catch(e=>{
  // A blocked autoplay is normal: the next real click will retry.
  if(e?.name!=='NotAllowedError'&&e?.name!=='AbortError')error=e?.message||'Playback failed';
 });
 else started=true;
 return true;
}
function stop(){audio.pause()}
function toggle(){
 wanted=!wanted;try{localStorage.setItem(KEY,wanted?'1':'0')}catch{}
 if(wanted){audio.preload='auto';audio.load();start()}else stop();
 sync();return wanted;
}
function status(){return{enabled:wanted,playing:!audio.paused&&!audio.ended,started,preload:audio.preload,source:'recorded-cc0',src:audio.currentSrc||audio.src,readyState:audio.readyState,duration:Number.isFinite(audio.duration)?audio.duration:0,volume:audio.volume,error}}
button.addEventListener('click',toggle);
function gesture(e){
 if(e.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(e.key))return;
 if(e.target?.closest?.('#music,#sound,#mw-language'))return;
 if(wanted&&audio.paused)start();
}
document.addEventListener('pointerdown',gesture,true);
document.addEventListener('keydown',gesture,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(wanted&&started)start()});
window.addEventListener('pagehide',stop);
window.addEventListener('morrowwish-language-change',sync);
audio.addEventListener('error',()=>{error='Audio asset unavailable';stop()});
window.MorrowwishCatMusic={start,stop,toggle,status,sync};
sync();
// On browsers that explicitly permit autoplay (e.g. returning players), start at once;
// otherwise the fully buffered recording starts on their first interaction.
if(wanted)start();
})();