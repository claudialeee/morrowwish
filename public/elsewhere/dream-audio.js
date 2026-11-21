/* Elsewhere soundscape: licensed recorded music + short original event-triggered SFX.
 * Music: Kevin MacLeod (incompetech.com), CC BY 4.0.
 * https://incompetech.com/music/royalty-free/ | https://creativecommons.org/licenses/by/4.0/
 * Never claim autoplay works when browsers require an interaction. */
(()=>{"use strict";
const KEY="elsewhere.music.enabled",FX_KEY="elsewhere.effects.enabled";
const ROOT="https://incompetech.com/music/royalty-free/mp3-royaltyfree/";
const FALLBACK="https://static.incompetech.com/music/royalty-free/mp3-royaltyfree/";
const tracks={home:"Carefree.mp3",amalfi:"Bossa Antigua.mp3",paris:"Easy Lemon.mp3",
 tokyo:"Life of Riley.mp3",iceland:"Porch Swing Days - slower.mp3",
 maldives:"Carefree.mp3",swiss:"Bossa Antigua.mp3",moon:"Porch Swing Days - slower.mp3",monday:"Life of Riley.mp3"};
const read=(key,defaultOn)=>{try{let v=localStorage.getItem(key);return v===null?defaultOn:v==="1"}catch{return defaultOn}};
let musicOn=read(KEY,true),fxOn=read(FX_KEY,true),world="home",blocked=false,unavailable=false,usingFallback=false,ctx=null;
const audio=new Audio();
audio.loop=true;audio.autoplay=musicOn;audio.preload="auto";audio.volume=.12;
audio.src=ROOT+encodeURIComponent(tracks.home);
const zh=()=>document.documentElement.lang.startsWith("zh");
function controls(){
 return '<div class="dream-sound" role="group" aria-label="Music and effects"><button type="button" class="dream-sound-button" data-dream-music aria-pressed="'+musicOn+'"></button><button type="button" class="dream-sound-button" data-dream-fx aria-pressed="'+fxOn+'"></button></div>';
}
function sync(){
 document.querySelectorAll("[data-dream-music]").forEach(b=>{
  const text=musicOn?(unavailable?(zh()?"音乐暂不可用":"Music unavailable"):(blocked?(zh()?"点击播放":"Tap to play"):(zh()?"音乐：开":"Music: On"))):(zh()?"音乐：关":"Music: Off");
  b.innerHTML='<span aria-hidden="true">'+(musicOn?"♫":"♪")+'</span><span class="sound-label">'+text+'</span>';
  b.title=text;b.setAttribute("aria-label",text);b.setAttribute("aria-pressed",String(musicOn));
  b.classList.toggle("muted",!musicOn);
 });
 document.querySelectorAll("[data-dream-fx]").forEach(b=>{
  const text=zh()?(fxOn?"音效：开":"音效：关"):(fxOn?"Effects: On":"Effects: Off");
  b.innerHTML='<span aria-hidden="true">'+(fxOn?"◖))":"◖")+'</span><span class="sound-label">'+text+'</span>';
  b.title=text;b.setAttribute("aria-label",text);b.setAttribute("aria-pressed",String(fxOn));
  b.classList.toggle("muted",!fxOn);
 });
}
function play(){
 if(!musicOn||document.hidden||unavailable)return;
 if(!audio.paused){blocked=false;sync();return}
 try{const p=audio.play();
  if(p?.then)p.then(()=>{blocked=false;sync()}).catch(()=>{blocked=true;sync()});
 }catch{blocked=true;sync()}
}
function setWorld(id){
 const name=tracks[id]?id:"home";
 if(name!==world){
  world=name;usingFallback=false;unavailable=false;audio.pause();
  audio.src=ROOT+encodeURIComponent(tracks[name]);audio.load();
 }
 if(musicOn)play();sync();
}
function ensureFX(){
 if(!fxOn)return null;
 try{
  if(!ctx){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return null;ctx=new AudioCtx()}
  if(ctx.state==="suspended")ctx.resume()?.catch(()=>{});
  return ctx;
 }catch{return null}
}
function tone(c,t,f,d,volume,type="sine"){
 const osc=c.createOscillator(),gain=c.createGain();
 osc.type=type;osc.frequency.setValueAtTime(f,t);
 gain.gain.setValueAtTime(.0001,t);
 gain.gain.exponentialRampToValueAtTime(Math.max(.00011,volume),t+.016);
 gain.gain.exponentialRampToValueAtTime(.0001,t+d);
 osc.connect(gain);gain.connect(c.destination);osc.start(t);osc.stop(t+d+.025);
}
function fx(kind="tap"){
 const c=ensureFX();if(!c)return;
 const t=c.currentTime+.018;
 try{
  if(kind==="twist"){
   // A rising shimmering reveal, not a constant synthetic soundtrack.
   [392,523,659,784,1046].forEach((f,i)=>tone(c,t+i*.066,f,.29,.019-i*.002,"triangle"));
  }else if(kind==="ending"){
   [523,659,784,1046].forEach((f,i)=>tone(c,t+i*.095,f,.42,.018,"sine"));
  }else if(kind==="secret"){
   [784,1046,1318].forEach((f,i)=>tone(c,t+i*.085,f,.26,.014,"sine"));
  }else if(kind==="select"){
   tone(c,t,520,.065,.009,"sine");tone(c,t+.055,660,.10,.007,"sine");
  }else{
   tone(c,t,470,.075,.006,"sine");
  }
 }catch{}
}
function toggleMusic(){
 if(!musicOn){musicOn=true;unavailable=false;play()}else if(blocked||audio.paused){blocked=false;play()}else{musicOn=false;audio.pause();blocked=false}
 try{localStorage.setItem(KEY,musicOn?"1":"0")}catch{}sync();
}
function toggleFX(){
 fxOn=!fxOn;try{localStorage.setItem(FX_KEY,fxOn?"1":"0")}catch{}
 if(fxOn)fx("secret");sync();
}
audio.addEventListener("playing",()=>{blocked=false;unavailable=false;sync()});
audio.addEventListener("error",()=>{
 if(!usingFallback){usingFallback=true;audio.src=FALLBACK+encodeURIComponent(tracks[world]);audio.load();if(musicOn)play()}
 else{unavailable=true;blocked=false;sync()}
});
document.addEventListener("click",e=>{
 const el=e.target.closest?.("[data-dream-music],[data-dream-fx]");
 if(el?.matches("[data-dream-music]")){toggleMusic();return}
 if(el?.matches("[data-dream-fx]")){toggleFX();return}
 if(musicOn&&audio.paused&&!unavailable)play();
},true);
document.addEventListener("keydown",e=>{
 if(!["Tab","Shift","Control","Alt","Meta","Escape"].includes(e.key)&&musicOn&&audio.paused&&!unavailable)play();
},true);
document.addEventListener("visibilitychange",()=>{if(document.hidden)audio.pause();else if(musicOn)play()});
window.addEventListener("pagehide",()=>audio.pause());
window.DreamAudio={controls,sync,setWorld,fx,toggleMusic,toggleFX,status:()=>({world,musicOn,fxOn,blocked,unavailable,paused:audio.paused,src:audio.currentSrc||audio.src})};
if(musicOn)play();
})();