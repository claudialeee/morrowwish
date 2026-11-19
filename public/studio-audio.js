/* Morrow Wish — sound effects only. No background music or repeating audio.
   All tones are event-triggered and stop promptly. No external audio assets. */
(()=>{'use strict';
const route=location.pathname.split('/').filter(Boolean)[0];
const games=new Set(['pawsibly-innocent','elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium']);
if(!games.has(route))return;
const KEY='morrowwish-audio-enabled';
let enabled=true;
try{const stored=localStorage.getItem(KEY);enabled=stored===null?localStorage.getItem('lab-muted')!=='1':stored==='1'}catch{}
let ctx=null,master=null,unlocked=false,voices=0,effects=0,control=null;
const lang=()=>route==='pocket-aquarium'?(document.querySelector('.languages button.active')?.id==='zh'?'zh':'en'):(window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh')?'zh':'en');
const copy=()=>lang()==='zh'?(enabled?'音效：开':'音效：关'):(enabled?'Sound effects: On':'Sound effects: Off');
function sync(){
 if(!control)return;
 const compact=control.classList.contains('lab-mute');
 control.textContent=compact?(enabled?'🔊':'🔇'):((enabled?'🔊 ':'🔇 ')+copy());
 control.setAttribute('aria-label',copy());
 control.setAttribute('aria-pressed',String(enabled));
 control.title=lang()==='zh'?'开启或关闭游戏音效（没有背景音乐）':'Turn game sound effects on or off (no background music)';
}
function ensure(){if(ctx)return true;try{
 const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;
 ctx=new A();master=ctx.createGain();master.gain.value=enabled?.20:0;
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-22;comp.knee.value=10;comp.ratio.value=2;comp.attack.value=.007;comp.release.value=.11;
 master.connect(comp);comp.connect(ctx.destination);return true;
}catch{return false}}
function start(){if(!enabled||!ensure())return false;
 try{ctx.resume()?.catch?.(()=>{})}catch{}
 unlocked=true;master.gain.setTargetAtTime(.20,ctx.currentTime,.015);return true;
}
function stop(){if(ctx&&master)master.gain.setTargetAtTime(.00001,ctx.currentTime,.006)}
function toggle(){
 enabled=!enabled;
 try{localStorage.setItem(KEY,enabled?'1':'0');localStorage.setItem('lab-muted',enabled?'0':'1')}catch{}
 if(enabled)start();else stop();
 sync();return enabled;
}
const hz=n=>440*Math.pow(2,(n-69)/12);
function tone(midi,time,duration,kind='sine',volume=.025){
 if(!enabled||!ctx||!master)return;
 try{
  const t=Math.max(ctx.currentTime,time),attack=.006;
  const o=ctx.createOscillator(),env=ctx.createGain(),filter=ctx.createBiquadFilter();
  o.type=kind; o.frequency.setValueAtTime(hz(midi),t);
  filter.type='lowpass';filter.frequency.value=kind==='triangle'?1300:2050;
  env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(volume,t+attack);
  env.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.06,duration));
  o.connect(filter);filter.connect(env);env.connect(master);
  o.start(t);o.stop(t+Math.max(.06,duration)+.03);voices++;
 }catch{}
}
function sfx(midi,kind='tap'){
 if(!enabled||!unlocked||!ctx)return;
 const t=ctx.currentTime+.01;
 switch(kind){
 case 'success':
  tone(midi,t,.11,'sine',.029);tone(midi+5,t+.07,.14,'sine',.020);tone(midi+9,t+.15,.20,'triangle',.014);break;
 case 'fail':
  tone(midi-5,t,.12,'triangle',.023);tone(midi-12,t+.075,.20,'sine',.016);break;
 case 'bounce':
  tone(midi,t,.10,'sine',.026);tone(midi+7,t+.08,.15,'sine',.016);break;
 case 'crash':
  tone(midi-12,t,.09,'triangle',.028);tone(midi-19,t+.05,.13,'triangle',.017);break;
 case 'pop':
  tone(midi,t,.12,'sine',.025);break;
 case 'quiet':
  tone(midi,t,.08,'sine',.016);break;
 default:
  tone(midi,t,.075,'sine',.020);
 }
 effects++;
}
const mappings={
 fish:[77,'success'],win:[74,'success'],bad:[55,'fail'],caught:[52,'fail'],vase:[62,'crash'],
 yarn:[74,'bounce'],lured:[76,'bounce'],light:[69,'quiet'],souvenir:[81,'success'],milk:[77,'pop'],
 tap:[71,'quiet'],select:[72,'quiet'],step:[71,'quiet'],flip:[75,'bounce'],sort:[69,'pop'],
 bubble:[79,'pop'],page:[69,'quiet'],feed:[77,'pop'],combo:[81,'success'],build:[72,'success'],
 complete:[74,'success'],fail:[52,'fail'],retry:[67,'quiet'],start:[69,'quiet']
};
function effect(kind='tap'){const [n,s]=mappings[kind]||mappings.tap;sfx(n,s)}
function note(freq){if(enabled&&unlocked)sfx(69+12*Math.log2(Math.max(40,freq)/440),'pop')}
function status(){return{profile:route,enabled,unlocked,playing:false,backgroundMusic:false,oscillators:voices,loopSteps:0,effects,audioState:ctx?.state||'not-created'}}
window.MorrowwishAudio={start,toggle,effect,note,status,sync,isEnabled:()=>enabled};
// Browsers allow Web Audio only after a user gesture. Unlocking does NOT play a sound.
function gesture(e){
 if(e.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(e.key))return;
 if(enabled)start();
}
document.addEventListener('pointerdown',gesture,true);
document.addEventListener('keydown',gesture,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop()}else if(enabled&&unlocked)start()});
window.addEventListener('pagehide',stop);
window.addEventListener('morrowwish-language-change',()=>setTimeout(sync,0));
function onMetric(name){
 switch(String(name||'').toLowerCase()){
 case 'game_complete':case 'level_complete':case 'town_completed-win':case 'town_grade-a':case 'town_grade-s':effect('complete');break;
 case 'game_over':case 'town_completed-lose':effect('fail');break;
 case 'feed_success':effect('feed');break;
 case 'combo':case 'town_first-club':effect('combo');break;
 case 'run_end':effect('complete');break;
 case 'game_retry':case 'town_retry-click':effect('retry');break;
 case 'town_first-place-quick':case 'town_first-upgrade':effect('build');break;
 default:break;
 }
}
const originalMetric=window.arcadeMetric;
if(typeof originalMetric==='function')window.arcadeMetric=function(name,...args){const result=originalMetric.call(this,name,...args);onMetric(name);return result};
document.addEventListener('pointerdown',e=>{
 if(!enabled||!unlocked)return;
 const target=e.target;
 if(target.closest?.('[data-mw-audio], #sound, .lab-mute, #board'))return;
 if(target.closest?.('canvas')){effect(route==='flip-dash'?'flip':route==='parcel-panic'?'sort':'bubble');return}
 if(target.closest?.('button,[role="button"]'))effect(route==='elsewhere'?'page':route==='tiny-town'?'build':'tap');
},false);
function mount(){
 if(route==='pawsibly-innocent'){
  control=document.getElementById('sound');
  if(control){control.dataset.mwAudio='true';sync()}
  return;
 }
 const legacy=document.querySelector('.lab-mute');
 if(legacy){
  control=legacy;control.dataset.mwAudio='true';control.classList.add('mw-audio-control');control.onclick=toggle;sync();return;
 }
 control=document.createElement('button');control.type='button';control.dataset.mwAudio='true';control.className='mw-audio-control';control.onclick=toggle;sync();
 const css=document.createElement('style');
 css.textContent='.mw-audio-control{font:700 12px/1.35 system-ui,sans-serif;cursor:pointer;white-space:nowrap;padding:9px 13px;border-radius:999px;border:1px solid #b39da7aa;background:#fff9f2;color:#704f70;box-shadow:0 2px 8px #5c47601a;min-height:35px}.mw-audio-control:hover{filter:brightness(.97)}.mw-audio-control:focus-visible{outline:3px solid #bb91d7;outline-offset:2px}@media(max-width:700px){.mw-audio-control{font-size:11px;padding:7px 10px;white-space:normal;max-width:170px}}';
 document.head.appendChild(css);
 const holder=route==='pocket-aquarium'?document.querySelector('header'):route==='tiny-town'||route==='elsewhere'?document.querySelector('.top-actions'):document.querySelector('.scoreboard');
 if(holder)holder.appendChild(control);
 else{control.classList.add('mw-audio-fixed');css.textContent+='.mw-audio-fixed{position:fixed;right:14px;bottom:58px;z-index:9999}';document.body.appendChild(control)}
 if(route==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();