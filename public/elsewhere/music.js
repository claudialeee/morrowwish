/* Elsewhere only: original, fully orchestrated game soundtrack by Melissa Elliott (0xabad1dea).
   Music repository: https://github.com/0xabad1dea/glorytales
   License: CC BY 4.0 https://creativecommons.org/licenses/by/4.0/
   The game credits the composer and license in the About letter.
   Replaces the earlier CC0 lo-fi score with fantasy-acoustic themes.
   Start immediately on load where browser policy permits; otherwise on first gesture.
   No timers, artificial delays or synthesized repeating tones. */
(()=>{'use strict';
const KEY='elsewhere.music.enabled';
const ROOT='https://cdn.jsdelivr.net/gh/0xabad1dea/glorytales@master/tracks/';
const RAW='https://raw.githubusercontent.com/0xabad1dea/glorytales/master/tracks/';
const tracks={
 home:'002-StartMenuScreen-80BPM-loop.mp3',        // harp and gentle bells, reflective invitation
 'no-work':'013-LongRoad-100BPM-loop.mp3',      // warm traveling ensemble, more motion
 bookshop:'005-HistoricVillage-99BPM-loop.mp3',// wistful cello, old bookshop and harbor
 paris:'014-CatsEyeWaltz-96BPM-loop.mp3',      // romantic waltz for a changing city
 cabin:'007-MagicalForest-85BPM-loop.mp3',    // woodwind, violin, soft forest mystery
 'end-no-work':'008-TheSkyClears-88BPM-loop.mp3',
 'end-bookshop':'002-StartMenuScreen-80BPM-loop.mp3',
 'end-paris':'002-StartMenuScreen-80BPM-loop.mp3',
 'end-cabin':'002-StartMenuScreen-80BPM-loop.mp3'
}
let enabled=true;
try{const saved=localStorage.getItem(KEY);enabled=saved===null?true:saved==='1';}catch{}
const audio=new Audio();
audio.loop=true;audio.preload='auto';audio.autoplay=enabled;
audio.volume=.13;
let world='home',fallback=false,blocked=false,control=null;
audio.src=ROOT+tracks[world];
function zh(){return window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh');}
function sync(){
 if(!control)return;
 const name=zh()?(enabled?'音乐：开':'音乐：关'):(enabled?'Music: On':'Music: Off');
 const action=blocked?(zh()?' · 点击播放':' · Tap to play'):'';
 control.textContent=(enabled?'♫ ':'♪ ')+name+action;
 control.setAttribute('aria-label',zh()?'背景音乐开关':'Background music toggle');
 control.setAttribute('aria-pressed',String(enabled));
 control.title=zh()?'Elsewhere 专属背景音乐，可随时关闭':'Elsewhere soundtrack. Switch off any time.';
}
function start(){
 if(!enabled)return;
 audio.muted=false;
 const p=audio.play();
 if(p&&typeof p.then==='function')p.then(()=>{blocked=false;sync()}).catch(()=>{blocked=true;sync()});
}
function switchTo(id){
 const next=tracks[id]?id:'home';
 if(world===next){if(enabled&&audio.paused)start();return;}
 world=next;fallback=false;
 audio.pause();audio.src=ROOT+tracks[world];audio.load();
 if(enabled)start();
}
function toggle(){
 enabled=!enabled;
 try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
 if(enabled)start();else{audio.pause();blocked=false;}
 sync();
}
audio.addEventListener('error',()=>{
 if(fallback)return;
 fallback=true; audio.src=RAW+tracks[world];audio.load();if(enabled)start();
});
document.addEventListener('pointerdown',()=>{if(enabled&&audio.paused)start();},true);
document.addEventListener('keydown',e=>{
 if(!['Tab','Escape','Shift','Alt','Control','Meta'].includes(e.key)&&enabled&&audio.paused)start();
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else if(enabled)start()});
window.addEventListener('pagehide',()=>audio.pause());
window.addEventListener('morrowwish-language-change',sync);
function mount(){
 if(control)return;
 control=document.createElement('button');control.type='button';control.className='elsewhere-music';
 control.addEventListener('click',e=>{e.stopPropagation();toggle();});
 (document.querySelector('.top-actions')||document.body).appendChild(control);
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.ElsewhereMusic={setWorld:switchTo,setEnding:(id)=>switchTo('end-'+id),toggle,play:start,status:()=>({enabled,world,blocked,paused:audio.paused,src:audio.currentSrc||audio.src})};
if(enabled)start();
})();
