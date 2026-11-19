/* Morrow Wish — six separately composed miniature soundtracks.
   Original melodies/arrangements, rendered in-browser with Web Audio.
   Quiet by design: filtered instruments, sparse melodies, no external assets. */
(()=>{'use strict';
const route=location.pathname.split('/').filter(Boolean)[0];
// Each soundtrack has its own melody, harmonic sequence, timbres, rhythm and pulse.
// Values are MIDI pitches; null is a deliberate rest. Steps are eighth notes.
const tracks={
'pawsibly-innocent':{
 name:'Cat Waltz',kind:'playful-plucked-waltz',bpm:97,lead:'kalimba',bass:'softBass',harmony:'felt',
 leadVolume:.73,harmonyVolume:.45,echo:.17,groove:'waltz',
 melody:[74,null,78,81,null,79,78,null,76,null,74,71,null,74,null,69,72,null,74,78,null,74,72,null,71,null,69,71,74,null,76,null],
 roots:[50,47,43,45],chords:[[50,54,57],[47,50,54],[43,47,50],[45,49,52]],bassPattern:[0,null,null,7,null,null,0,null],padEvery:8
},
'elsewhere':{
 name:'Letters from Elsewhere',kind:'felt-piano-ambient',bpm:66,lead:'felt',bass:'softBass',harmony:'cloud',
 leadVolume:.55,harmonyVolume:.60,echo:.31,groove:'ambient',
 melody:[69,null,null,null,72,null,null,76,null,null,null,72,null,null,67,null,65,null,null,null,69,null,null,72,null,null,null,74,null,null,69,null],
 roots:[45,41,48,43],chords:[[45,48,52],[41,45,48],[48,52,55],[43,47,50]],bassPattern:[0,null,null,null,null,null,null,null],padEvery:8
},
'tiny-town':{
 name:'A Sunny New Day',kind:'wooden-marimba-acoustic',bpm:108,lead:'marimba',bass:'softBass',harmony:'felt',
 leadVolume:.73,harmonyVolume:.47,echo:.13,groove:'acoustic',
 melody:[64,null,67,69,72,null,69,67,65,null,69,72,74,null,72,null,69,null,67,64,null,67,69,null,72,74,76,null,72,null,67,null],
 roots:[48,53,45,55],chords:[[48,52,55],[53,57,60],[45,48,52],[55,59,62]],bassPattern:[0,null,null,7,null,7,null,null],padEvery:8
},
'flip-dash':{
 name:'Velocity Lane',kind:'low-pulse-arcade',bpm:150,lead:'softPulse',bass:'pulseBass',harmony:'pulse',
 leadVolume:.45,harmonyVolume:.22,echo:.06,groove:'runner',
 melody:[62,null,null,null,65,null,null,69,null,null,65,null,62,null,null,null,69,null,null,72,null,69,null,65,67,null,null,65,62,null,null,null],
 roots:[38,38,41,45],chords:[[50,53,57],[50,53,57],[53,57,60],[57,60,64]],bassPattern:[0,null,0,null,7,null,0,null],padEvery:8
},
'parcel-panic':{
 name:'Parcel Groove',kind:'woodblock-funk',bpm:116,lead:'wood',bass:'roundBass',harmony:'marimba',
 leadVolume:.66,harmonyVolume:.30,echo:.08,groove:'funk',
 melody:[64,null,null,67,69,null,71,null,73,null,71,null,69,67,null,null,64,null,67,null,71,null,73,71,null,69,67,null,64,null,null,null],
 roots:[40,45,47,42],chords:[[52,55,59],[57,61,64],[59,62,66],[54,57,61]],bassPattern:[0,null,7,null,null,0,7,null],padEvery:8
},
'pocket-aquarium':{
 name:'Under Glass',kind:'slow-water-glass-bells',bpm:76,lead:'waterBell',bass:'softBass',harmony:'cloud',
 leadVolume:.55,harmonyVolume:.52,echo:.32,groove:'aquatic',
 melody:[74,null,null,79,null,81,null,null,76,null,74,null,69,null,null,null,71,null,null,76,null,79,null,83,null,null,79,null,76,null,null,null],
 roots:[43,40,48,50],chords:[[43,47,50],[40,43,47],[48,52,55],[50,54,57]],bassPattern:[0,null,null,null,null,null,null,null],padEvery:8
}
};
const track=tracks[route];if(!track)return;
const KEY='morrowwish-audio-enabled';
let enabled=true;try{const stored=localStorage.getItem(KEY);enabled=stored===null?localStorage.getItem('lab-muted')!=='1':stored==='1'}catch{}
let ctx=null,master=null,echo=null,unlocked=false,clock=null,nextAt=0,step=0,voices=0,ticks=0,effects=0,control=null,noiseBuffer=null;
const lang=()=>route==='pocket-aquarium'?(document.querySelector('.languages button.active')?.id==='zh'?'zh':'en'):(window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh')?'zh':'en');
const label=()=>lang()==='zh'?(enabled?'♫ 音乐与音效：开':'♪ 音乐与音效：关'):(enabled?'♫ Music & SFX: On':'♪ Music & SFX: Off');
function sync(){if(!control)return;control.textContent=control.classList.contains('lab-mute')?(enabled?'♫':'♪'):(route==='pawsibly-innocent'?(lang()==='zh'?(enabled?'♫ 音乐音效开启':'♪ 音乐音效关闭'):(enabled?'♫ Music & SFX on':'♪ Music & SFX off')):label());control.setAttribute('aria-label',label());control.setAttribute('aria-pressed',String(enabled));control.title=lang()==='zh'?'音乐和音效开关。点击或按键后播放。':'Toggle music and sound. Playback begins after your first interaction.'}
const hz=m=>440*Math.pow(2,(m-69)/12);
function initAudio(){if(ctx)return true;try{
 const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;ctx=new A();
 master=ctx.createGain();master.gain.value=.0001;
 const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-22;compressor.knee.value=12;compressor.ratio.value=2;compressor.attack.value=.016;compressor.release.value=.18;
 master.connect(compressor);compressor.connect(ctx.destination);
 echo=ctx.createDelay(.8);echo.delayTime.value=track.echo||.18;const wet=ctx.createGain();wet.gain.value=track.groove==='ambient'||track.groove==='aquatic'?.16:.08;echo.connect(wet);wet.connect(master);
 const frames=Math.floor(ctx.sampleRate*.19);noiseBuffer=ctx.createBuffer(1,frames,ctx.sampleRate);const channel=noiseBuffer.getChannelData(0);
 for(let i=0;i<frames;i++)channel[i]=(Math.random()*2-1)*Math.pow(1-i/frames,.35);
 return true;
}catch{return false}}
const patches={
 kalimba:{wave:'sine',harm:'triangle',harmMix:.22,attack:.009,hold:.29,cutoff:1550},
 felt:{wave:'sine',harm:'triangle',harmMix:.25,attack:.025,hold:1.0,cutoff:1100},
 cloud:{wave:'sine',harm:'triangle',harmMix:.14,attack:.30,hold:3.1,cutoff:690},
 marimba:{wave:'sine',harm:'triangle',harmMix:.19,attack:.008,hold:.30,cutoff:1600},
 wood:{wave:'triangle',harm:'sine',harmMix:.12,attack:.006,hold:.14,cutoff:1180},
 waterBell:{wave:'sine',harm:'sine',harmMix:.13,attack:.012,hold:1.35,cutoff:2050,overtone:2},
 softBass:{wave:'sine',harm:'triangle',harmMix:.24,attack:.025,hold:.56,cutoff:580},
 roundBass:{wave:'triangle',harm:'sine',harmMix:.25,attack:.008,hold:.30,cutoff:540},
 pulseBass:{wave:'triangle',harm:'sine',harmMix:.11,attack:.006,hold:.20,cutoff:500},
 softPulse:{wave:'triangle',harm:'square',harmMix:.09,attack:.009,hold:.17,cutoff:1150},
 pulse:{wave:'triangle',harm:'sine',harmMix:.10,attack:.020,hold:.21,cutoff:700}
};
function play(midi,when,kind,level=.03,seconds=null){if(!enabled||!ctx||!master)return;try{
 const p=patches[kind]||patches.felt;const t=Math.max(ctx.currentTime,when),duration=seconds??p.hold;
 const env=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=p.cutoff;
 env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(Math.max(.0001,level),t+p.attack);
 env.gain.exponentialRampToValueAtTime(.0001,t+Math.max(p.attack+.055,duration));
 filter.connect(env);env.connect(master);if(['felt','waterBell','cloud','kalimba'].includes(kind))env.connect(echo);
 const fundamental=ctx.createOscillator();fundamental.type=p.wave;fundamental.frequency.setValueAtTime(hz(midi),t);
 fundamental.connect(filter);fundamental.start(t);fundamental.stop(t+duration+.08);voices++;
 if(p.harmMix){const overtone=ctx.createOscillator(),harmEnv=ctx.createGain();overtone.type=p.harm;
 overtone.frequency.setValueAtTime(hz(midi)*(p.overtone||2),t);
 harmEnv.gain.value=p.harmMix;harmEnv.connect(filter);overtone.connect(harmEnv);overtone.start(t);overtone.stop(t+duration+.08);voices++}
}catch{}}
function drum(when,type,level=.3){if(!enabled||!ctx)return;const t=Math.max(ctx.currentTime,when);
 try{
  if(type==='kick'){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(105,t);osc.frequency.exponentialRampToValueAtTime(47,t+.15);
   gain.gain.setValueAtTime(level*.037,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.19);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+.21);voices++}
  else if(noiseBuffer){const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=noiseBuffer;
   filter.type=type==='hat'?'highpass':'bandpass';filter.frequency.value=type==='hat'?4200:1100;gain.gain.setValueAtTime(level*(type==='hat'?.008:.017),t);
   gain.gain.exponentialRampToValueAtTime(.0001,t+(type==='hat'?.054:.115));src.connect(filter);filter.connect(gain);gain.connect(master);src.start(t);src.stop(t+.14);voices++}
 }catch{}}
function schedule(pos,at){const i=pos%track.melody.length;
 if(i%track.padEvery===0){const chord=track.chords[Math.floor(i/8)%track.chords.length],quarter=60/track.bpm;
  const pad=track.harmony==='cloud'?3.3:track.harmony==='pulse'?.24:.72;
  for(let k=0;k<chord.length;k++){
    const m=chord[k]+(track.harmony==='cloud'?-12:0);
    play(m,at,track.harmony,.011*track.harmonyVolume/(1+k*.34),Math.min(pad,quarter*4));
  }
 }
 const n=track.melody[i];if(n!=null)play(n,at,track.lead,.030*track.leadVolume*(i%8===0?1.13:.88));
 const bassNote=track.bassPattern[i%track.bassPattern.length];
 if(bassNote!=null){
  const root=track.roots[Math.floor(i/8)%track.roots.length]-12;
  play(root+bassNote,at,track.bass,.029*(track.groove==='runner'?.75:.57));
 }
 if(track.groove==='runner'){if(i%4===0)drum(at,'kick',.65);if(i%8===4)drum(at,'snare',.38);if(i%2===1)drum(at,'hat',.28)}
 else if(track.groove==='funk'){if(i%8===0||i%8===5)drum(at,'kick',.53);if(i%8===4)drum(at,'snare',.32);if(i%4===2)drum(at,'hat',.20)}
 else if(track.groove==='acoustic'){if(i%8===0)drum(at,'kick',.30);if(i%4===2)drum(at,'hat',.15)}
 else if(track.groove==='waltz'){if(i%6===0)drum(at,'kick',.18)}
 else if(track.groove==='aquatic'&&i%8===6){play(86,at,'waterBell',.004,.48)}
 ticks++;
}
function tick(){if(!unlocked||!enabled||!ctx||document.hidden)return;
 const interval=30/track.bpm;if(nextAt<ctx.currentTime-.5)nextAt=ctx.currentTime+.05;
 let remaining=10;while(nextAt<ctx.currentTime+.24&&remaining-->0){schedule(step,nextAt);step++;nextAt+=interval}
}
function start(){if(!enabled||!initAudio())return false;try{ctx.resume()?.catch?.(()=>{})}catch{}
 unlocked=true;master.gain.setTargetAtTime(.23,ctx.currentTime,.38);
 if(clock===null){nextAt=ctx.currentTime+.085;clock=setInterval(tick,95)}
 tick();sync();return true}
function stop(){if(clock!==null){clearInterval(clock);clock=null}if(ctx&&master)master.gain.setTargetAtTime(.0001,ctx.currentTime,.035)}
function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}if(enabled){start();effect('on')}else stop();sync();return enabled}
function sfx(midi,kind,vol=.027){if(!enabled||!unlocked||!ctx)return;const t=ctx.currentTime+.01;
 if(kind==='fail'){play(midi-6,t,'roundBass',.028,.22);play(midi-12,t+.09,'softBass',.020,.25)}
 else if(kind==='success'){play(midi,t,'kalimba',.029,.26);play(midi+4,t+.10,'kalimba',.022,.32);play(midi+7,t+.20,'waterBell',.017,.48)}
 else if(kind==='bounce'){play(midi,t,'kalimba',.022,.15);play(midi+7,t+.075,'kalimba',.015,.18)}
 else if(kind==='pop'){play(midi,t,'waterBell',.018,.28)}
 else if(kind==='crash'){drum(t,'snare',.38);play(midi-12,t,'roundBass',.021,.15)}
 else if(kind==='quiet'){play(midi,t,'felt',.014,.27)}
 else play(midi,t,route==='flip-dash'?'softPulse':route==='parcel-panic'?'wood':'kalimba',vol,.13);
 effects++}
function effect(event='tap'){const map={
 fish:[77,'success'],win:[74,'success'],bad:[55,'fail'],caught:[52,'fail'],vase:[62,'crash'],
 yarn:[74,'bounce'],lured:[76,'bounce'],light:[69,'quiet'],souvenir:[81,'success'],milk:[77,'pop'],
 tap:[71,'quiet'],select:[72,'quiet'],step:[71,'quiet'],flip:[75,'bounce'],sort:[69,'pop'],
 bubble:[79,'pop'],page:[69,'quiet'],feed:[77,'pop'],combo:[81,'success'],build:[72,'success'],
 complete:[74,'success'],fail:[52,'fail'],on:[79,'quiet'],retry:[67,'quiet'],start:[69,'quiet']
 };const x=map[event]||map.tap;sfx(x[0],x[1])}
function note(freq){if(enabled&&unlocked)sfx(69+12*Math.log2(Math.max(40,freq)/440),'pop',.017)}
function status(){return{profile:route,track:track.name,arrangement:track.kind,bpm:track.bpm,lead:track.lead,enabled,unlocked,playing:clock!==null&&enabled,oscillators:voices,loopSteps:ticks,effects,audioState:ctx?.state||'not-created'}}
window.MorrowwishAudio={start,toggle,effect,note,status,sync,isEnabled:()=>enabled};
function gesture(e){if(e.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(e.key))return;if(enabled)start()}
document.addEventListener('pointerdown',gesture,true);
document.addEventListener('keydown',gesture,true);
document.addEventListener('visibilitychange',()=>{if(document.hidden){master?.gain.setTargetAtTime(.0001,ctx.currentTime,.035)}else if(enabled&&unlocked){ctx?.resume?.().catch?.(()=>{});master?.gain.setTargetAtTime(.23,ctx.currentTime,.38);tick()}});
window.addEventListener('pagehide',stop);
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
const original=window.arcadeMetric;
if(typeof original==='function')window.arcadeMetric=function(name,...args){const result=original.call(this,name,...args);onMetric(name);return result};
document.addEventListener('pointerdown',e=>{
 if(!enabled||!unlocked)return;const target=e.target;
 if(target.closest?.('[data-mw-audio], #sound, .lab-mute, #board'))return;
 if(target.closest?.('canvas')){effect(route==='flip-dash'?'flip':route==='parcel-panic'?'sort':'bubble');return}
 if(target.closest?.('button,[role="button"]'))effect(route==='elsewhere'?'page':route==='tiny-town'?'build':'tap');
},false);
function mount(){
 if(route==='pawsibly-innocent'){control=document.getElementById('sound');if(control){control.dataset.mwAudio='true';sync()}return}
 const legacy=document.querySelector('.lab-mute');
 if(legacy){control=legacy;control.dataset.mwAudio='true';control.classList.add('mw-audio-control');control.onclick=()=>toggle();sync();return}
 control=document.createElement('button');control.type='button';control.dataset.mwAudio='true';control.className='mw-audio-control';control.onclick=()=>toggle();sync();
 const css=document.createElement('style');
 css.textContent='.mw-audio-control{font:700 12px/1.35 system-ui,sans-serif;letter-spacing:0;cursor:pointer;white-space:nowrap;padding:9px 13px;border-radius:999px;border:1px solid #b39da7aa;background:#fff9f2;color:#704f70;box-shadow:0 2px 8px #5c47601a;min-height:35px}.mw-audio-control:hover{filter:brightness(.97)}.mw-audio-control:focus-visible{outline:3px solid #bb91d7;outline-offset:2px}@media(max-width:700px){.mw-audio-control{font-size:11px;padding:7px 10px;white-space:normal;max-width:170px}}';document.head.appendChild(css);
 const holder=route==='pocket-aquarium'?document.querySelector('header'):route==='tiny-town'?document.querySelector('.top-actions'):route==='elsewhere'?document.querySelector('.top-actions'):document.querySelector('.scoreboard');
 if(holder)holder.appendChild(control);else{control.classList.add('mw-audio-fixed');css.textContent+='.mw-audio-fixed{position:fixed;right:14px;bottom:58px;z-index:9999}';document.body.appendChild(control)}
 if(route==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();