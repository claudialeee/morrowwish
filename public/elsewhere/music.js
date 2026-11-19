/* Elsewhere soundtrack: light, sunny, human-composed instrumental music.
 * Kevin MacLeod, https://incompetech.com/music/royalty-free/
 * CC BY 4.0, https://creativecommons.org/licenses/by/4.0/
 * Tracks: Carefree, Life of Riley, Bossa Antigua, Easy Lemon,
 *         Porch Swing Days - slower. Credits are visible in About.
 * Starts at page-load when the browser allows; first gesture otherwise.
 */
(()=>{'use strict';
const KEY='elsewhere.music.enabled';
const ROOT='https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
const RAW='https://static.incompetech.com/music/royalty-free/mp3-royaltyfree/';
const tracks={
 home:'Carefree.mp3',                       // cheerful ukulele / guitar / marimba (96 BPM)
 'no-work':'Life of Riley.mp3',            // friendly, uplifting and lightly playful (102 BPM)
 bookshop:'Bossa Antigua.mp3',            // mellow sunny jazz guitar (70 BPM)
 paris:'Easy Lemon.mp3',                  // relaxed everyday Paris, guitar / mallet keys (82 BPM)
 cabin:'Porch Swing Days - slower.mp3',  // flowing acoustic guitars, feel-good (calm)
 'end-no-work':'Life of Riley.mp3',
 'end-bookshop':'Bossa Antigua.mp3',
 'end-paris':'Easy Lemon.mp3',
 'end-cabin':'Porch Swing Days - slower.mp3'
}
let enabled=true;
try{const saved=localStorage.getItem(KEY);enabled=saved===null?true:saved==='1';}catch{}
const audio=new Audio();
audio.loop=true;audio.preload='auto';audio.autoplay=enabled;
audio.volume=.12;
let world='home',fallback=false,blocked=false,control=null;
audio.src=ROOT+encodeURIComponent(tracks[world]);
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
 // Keep the melody flowing when the story reaches its ending.
 if(tracks[world]===tracks[next]){world=next;if(enabled&&audio.paused)start();return;}
 world=next;fallback=false;
 audio.pause();audio.src=ROOT+encodeURIComponent(tracks[world]);audio.load();
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
 fallback=true; audio.src=RAW+encodeURIComponent(tracks[world]);audio.load();if(enabled)start();
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
window.ElsewhereMusic={setWorld:switchTo,setEnding:(id)=>switchTo('end-'+id),toggle,play:start,status:()=>({enabled,world,blocked,paused:audio.paused,track:tracks[world],src:audio.currentSrc||audio.src})};
if(enabled)start();
})();
