/* Morrow Wish original procedural game soundtracks and interactive SFX.
   All notes are generated locally using Web Audio. No downloaded music,
   samples, tracking, or copyrighted recordings. */
(()=>{'use strict';
const route=location.pathname.split('/').filter(Boolean)[0];
const profiles={
  'pawsibly-innocent':{name:'Cat caper',bpm:111,wave:'triangle',bass:'sine',loud:.8,
    notes:[72,76,79,null,81,79,76,74,72,null,67,69,72,74,76,null],chords:[[48,55,60],[53,60,65],[50,57,62],[55,62,67]],step:'soft'},
  'elsewhere':{name:'Elsewhere dream',bpm:78,wave:'sine',bass:'sine',loud:.62,
    notes:[69,null,72,null,76,null,74,null,72,null,69,null,67,null,64,null],chords:[[45,52,57],[48,55,60],[43,50,55],[40,47,52]],step:'page'},
  'tiny-town':{name:'Sunny town',bpm:92,wave:'triangle',bass:'sine',loud:.68,
    notes:[67,72,74,null,76,74,72,null,69,72,74,76,72,null,67,null],chords:[[48,55,60],[53,60,65],[45,52,57],[55,62,67]],step:'build'},
  'flip-dash':{name:'Arcade pulse',bpm:138,wave:'square',bass:'triangle',loud:.56,
    notes:[72,null,79,76,81,null,79,76,74,null,79,74,76,null,72,null],chords:[[48,55,60],[53,60,65],[57,64,69],[55,62,67]],step:'flip'},
  'parcel-panic':{name:'Sorting groove',bpm:120,wave:'triangle',bass:'square',loud:.57,
    notes:[72,null,76,79,null,74,76,null,72,76,79,81,null,79,76,null],chords:[[48,55,60],[50,57,62],[53,60,65],[55,62,67]],step:'sort'},
  'pocket-aquarium':{name:'Aquarium lullaby',bpm:82,wave:'sine',bass:'sine',loud:.60,
    notes:[72,null,76,79,null,76,72,null,69,null,72,76,null,74,69,null],chords:[[48,55,60],[45,52,57],[53,60,65],[50,57,62]],step:'bubble'}
};
const score=profiles[route];if(!score)return;
const KEY='morrowwish-audio-enabled';
let enabled=true;
try{const stored=localStorage.getItem(KEY);enabled=stored===null?localStorage.getItem('lab-muted')!=='1':stored==='1'}catch{}
let ctx=null,bus=null,unlocked=false,beatTimer=null,next=0,step=0,oscillators=0,loops=0,sounds=0,button=null,firstHint=true;
const lang=()=>{if(route==='pocket-aquarium')return document.querySelector('.languages button.active')?.id==='zh'?'zh':'en';return window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh')?'zh':'en'};
function copy(){const zh=lang()==='zh';return enabled?(zh?'♫ 音乐与音效：开':'♫ Music & SFX: On'):(zh?'♪ 音乐与音效：关':'♪ Music & SFX: Off')}
function labels(){if(!button)return;button.textContent=copy();button.setAttribute('aria-label',copy());button.setAttribute('aria-pressed',String(enabled));button.title=lang()==='zh'?'点击切换音乐和音效。首次操作后播放。':'Toggle music and sound effects. Audio begins on your first interaction.'}
function midi(note){return 440*Math.pow(2,(note-69)/12)}
function ensure(){if(ctx)return true;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;ctx=new A();bus=ctx.createGain();bus.gain.value=.40;bus.connect(ctx.destination);return true}catch{return false}}
function voice(freq,time,duration,wave,amount,attack=.012){if(!ctx||!enabled||!bus)return;try{
 const osc=ctx.createOscillator(),env=ctx.createGain(),t=Math.max(time,ctx.currentTime);
 osc.type=wave||'sine';osc.frequency.setValueAtTime(Math.max(40,freq),t);
 env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(Math.max(.00015,amount),t+attack);
 env.gain.exponentialRampToValueAtTime(.0001,t+Math.max(attack+.03,duration));
 osc.connect(env);env.connect(bus);osc.start(t);osc.stop(t+Math.max(attack+.04,duration)+.04);oscillators++;
}catch{}}
function tick(){if(!unlocked||!enabled||!ctx||document.hidden)return;
 const beatDuration=60/score.bpm/2;
 if(next<ctx.currentTime-.5)next=ctx.currentTime+.035;
 let guard=0;
 while(next<ctx.currentTime+.25&&guard++<12){
  const slot=step%16,n=score.notes[slot],pattern=Math.floor(step/16)%4;
  if(slot%8===0){
   const chord=score.chords[(pattern*2+slot/8)%4];
   for(const [i,v] of chord.entries())voice(midi(v-12),next,score.bpm>110?.68:1.35,score.bass,.012*score.loud/(1+i*.36),.05);
  }
  if(n!=null){const accent=(slot===0||slot===8)?1.22:1;
    voice(midi(n),next,.30+(score.bpm<90?.25:.04),score.wave,.034*score.loud*accent,.013);
    if(route==='pocket-aquarium'&&slot%4===0)voice(midi(n+12),next+.11,.53,'sine',.009,.04);
  }
  if((route==='flip-dash'||route==='parcel-panic')&&slot%4===0)voice(midi(36),next,.07,'triangle',.015*score.loud,.007);
  step++;next+=beatDuration;loops++;
 }
}
function start(){if(!enabled||!ensure())return false;try{ctx.resume()?.catch?.(()=>{})}catch{}
 unlocked=true;bus.gain.setTargetAtTime(.40,ctx.currentTime,.08);if(beatTimer===null){next=ctx.currentTime+.075;beatTimer=setInterval(tick,100)}tick();labels();return true}
function stop(){if(beatTimer!==null){clearInterval(beatTimer);beatTimer=null}if(ctx&&bus)bus.gain.setTargetAtTime(.0001,ctx.currentTime,.04)}
function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
 if(enabled){start();effect('on')}else stop();labels();return enabled}
function burst(frequency,pattern='soft',amp=1){if(!enabled||!unlocked||!ctx)return;const t=ctx.currentTime+.012;
 if(pattern==='bad'||pattern==='hit'||pattern==='miss'){voice(frequency*.83,t,.24,'sawtooth',.052*amp);voice(frequency*.48,t+.035,.21,'triangle',.044*amp)}
 else if(pattern==='win'||pattern==='complete'){for(let i=0;i<4;i++)voice(frequency*Math.pow(2,[0,4,7,12][i]/12),t+i*.095,.29,'triangle',.045*amp)}
 else if(pattern==='yarn'||pattern==='lure'){voice(frequency,t,.10,'sine',.048*amp);voice(frequency*1.5,t+.08,.23,'triangle',.04*amp)}
 else if(pattern==='vase'||pattern==='crash'){for(let i=0;i<4;i++)voice(frequency*(1+i*.29),t+i*.025,.12,'triangle',.03*amp)}
 else if(pattern==='page'){voice(frequency,t,.19,'sine',.023*amp);voice(frequency*1.33,t+.045,.22,'sine',.015*amp)}
 else {voice(frequency,t,.095,'sine',.043*amp);voice(frequency*1.5,t+.08,.11,'triangle',.014*amp)}
 sounds++}
function effect(kind='select'){const map={
 fish:[790,'win'],win:[640,'win'],bad:[250,'bad'],caught:[260,'bad'],vase:[260,'vase'],
 yarn:[560,'yarn'],lured:[620,'lure'],light:[650,'page'],souvenir:[780,'win'],milk:[680,'win'],
 start:[540,'page'],tap:[600,'soft'],select:[550,'soft'],step:[475,'soft'],
 flip:[740,'soft'],sort:[680,'soft'],bubble:[530,'soft'],page:[580,'page'],
 feed:[870,'win'],combo:[850,'win'],build:[630,'win'],complete:[650,'win'],fail:[240,'bad'],
 on:[690,'win'],retry:[510,'page']
 };const p=map[kind]||map.select;burst(p[0],p[1],.9)}
function note(freq){if(!enabled||!unlocked)return;burst(freq,'soft',.68)}
function status(){return{profile:route,enabled,unlocked,playing:!!beatTimer&&enabled,oscillators,loopSteps:loops,effects:sounds,audioState:ctx?.state||'not-created'}}
function sync(){labels()}
window.MorrowwishAudio={start,toggle,effect,note,status,sync,isEnabled:()=>enabled};
function onGesture(e){if(e.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(e.key))return;if(enabled)start()}
document.addEventListener('pointerdown',onGesture,true);
document.addEventListener('keydown',onGesture,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(bus&&ctx)bus.gain.setTargetAtTime(.0001,ctx.currentTime,.05)}else if(enabled&&unlocked){ctx?.resume?.().catch?.(()=>{});if(bus&&ctx)bus.gain.setTargetAtTime(.4,ctx.currentTime,.08);tick()}});
window.addEventListener('pagehide',()=>stop());
window.addEventListener('morrowwish-language-change',()=>setTimeout(sync,0));
function onMetric(name){switch(String(name||'').toLowerCase()){
 case 'game_complete':case 'level_complete':case 'town_completed-win':case 'town_grade-a':case 'town_grade-s':effect('complete');break;
 case 'game_over':case 'town_completed-lose':effect('fail');break;
 case 'feed_success':effect('feed');break;
 case 'combo':case 'town_first-club':effect('combo');break;
 case 'run_end':effect('complete');break;
 case 'game_retry':case 'town_retry-click':effect('retry');break;
 case 'town_first-place-quick':case 'town_first-upgrade':effect('build');break;
 default:break}}
const original=window.arcadeMetric;if(typeof original==='function'){window.arcadeMetric=function(name,...args){const value=original.call(this,name,...args);onMetric(name);return value}}
document.addEventListener('pointerdown',e=>{if(!enabled||!unlocked)return;const target=e.target;
 if(target.closest?.('[data-mw-audio], #sound, .lab-mute'))return;
 if(target.closest?.('#board'))return; // cat has dedicated game event effects
 if(target.closest?.('canvas')){if(route==='flip-dash')effect('flip');else if(route==='parcel-panic')effect('sort');else if(route==='pocket-aquarium')effect('bubble');return}
 if(target.closest?.('button,[role="button"]'))effect(route==='elsewhere'?'page':route==='tiny-town'?'build':'tap');
},false);
function mount(){
 if(route==='pawsibly-innocent'){button=document.getElementById('sound');if(button){button.dataset.mwAudio='true';labels()}return}
 const legacy=document.querySelector('.lab-mute');
 if(legacy){button=legacy;button.dataset.mwAudio='true';button.classList.add('mw-audio-control');button.onclick=()=>toggle();labels();return}
 button=document.createElement('button');button.type='button';button.dataset.mwAudio='true';button.className='mw-audio-control';button.onclick=()=>toggle();labels();
 const css=document.createElement('style');css.textContent='.mw-audio-control{font:700 12px/1.35 system-ui,sans-serif;letter-spacing:0;cursor:pointer;white-space:nowrap;padding:9px 13px;border-radius:999px;border:1px solid #b39da7aa;background:#fff9f2;color:#704f70;box-shadow:0 2px 8px #5c47601a;min-height:35px}.mw-audio-control:hover{filter:brightness(.97)}.mw-audio-control:focus-visible{outline:3px solid #bb91d7;outline-offset:2px}@media(max-width:700px){.mw-audio-control{font-size:11px;padding:7px 10px;white-space:normal;max-width:170px}}';document.head.appendChild(css);
 const holder=route==='pocket-aquarium'?document.querySelector('header'):route==='tiny-town'?document.querySelector('.top-actions'):route==='elsewhere'?document.querySelector('.top-actions'):document.querySelector('.scoreboard');
 if(holder){holder.appendChild(button)}else{button.classList.add('mw-audio-fixed');css.textContent+='.mw-audio-fixed{position:fixed;right:14px;bottom:58px;z-index:9999}';document.body.appendChild(button)}
 if(route==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();