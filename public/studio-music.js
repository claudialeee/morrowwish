/* Morrow Wish — four original, harmonically arranged browser-game soundtracks.
   Instrumental Web Audio composition: pads, keys, bass, delicate percussion.
   No audio files, network calls or third-party music; sound effects remain separate. */
(()=>{'use strict';
 const game=(location.pathname.split('/').filter(Boolean)[0]||'');
 const scores={
  'tiny-town':{
   title:{en:'Afternoon in the Village',zh:'小镇的午后'},bpm:88,style:'cozy',
   chords:[[53,57,60,64],[50,53,57,60],[55,58,62,65],[48,52,55,62],[53,57,60,64],[57,60,64,67],[55,59,62,65],[48,52,55,60]],
   bass:[41,38,43,36,41,45,43,36],
   melody:[69,72,null,74,72,null,69,null,67,null,69,72,null,74,76,null,74,null,72,69,null,67,69,72,76,null,74,72,69,null,67,null],
   instrument:'keys'
  },
  'flip-dash':{
   title:{en:'Gravity After Dark',zh:'反重力夜行'},bpm:124,style:'drive',
   chords:[[52,55,59,62],[48,52,55,59],[55,59,62,64],[50,54,57,62],[52,55,59,62],[48,52,55,59],[57,60,64,67],[50,54,57,62]],
   bass:[40,36,43,38,40,36,45,38],
   melody:[76,null,79,74,null,76,72,null,74,null,79,76,74,null,72,null,76,null,79,81,null,79,76,null,74,72,null,74,76,null,71,null],
   instrument:'softsynth'
  },
  'parcel-panic':{
   title:{en:'Postcards & Parcels',zh:'包裹与明信片'},bpm:106,style:'bossa',
   chords:[[53,57,60,64],[50,53,57,60],[55,58,62,65],[48,52,58,62],[53,57,60,64],[57,60,64,67],[55,59,62,65],[48,52,58,62]],
   bass:[41,38,43,36,41,45,43,36],
   melody:[69,null,72,74,null,72,69,null,67,69,null,72,null,74,76,null,77,null,76,72,69,null,72,null,74,null,72,69,null,67,69,null],
   instrument:'marimba'
  },
  'pocket-aquarium':{
   title:{en:'Blue Hour Underwater',zh:'水下蓝调时光'},bpm:72,style:'ocean',
   chords:[[48,52,55,59,62],[50,54,57,62,64],[52,55,59,62,67],[55,59,62,64,69],[48,52,55,59,62],[45,48,52,55,59],[50,54,57,62,64],[55,59,62,64,69]],
   bass:[36,38,40,43,36,33,38,43],
   melody:[null,76,null,null,79,null,81,null,79,null,null,76,null,74,null,null,72,null,74,null,76,null,79,null,81,null,79,null,76,null,74,null],
   instrument:'glass'
  }
 };
 const score=scores[game];if(!score)return;
 const KEY='morrowwish-music-enabled';
 let enabled=true;try{enabled=localStorage.getItem(KEY)!=='0'}catch{}
 let ctx,output,wet,delay,feedback,noise,interval,nextTime=0,step=0,running=false,button,firstGesture=false;
 const isZh=()=>game==='pocket-aquarium'?(document.querySelector('.languages button.active')?.id==='zh'):
   (window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.startsWith('zh'));
 const label=()=>isZh()?('♫ 音乐：'+(enabled?'开':'关')):('♫ Music: '+(enabled?'On':'Off'));
 const hz=n=>440*Math.pow(2,(n-69)/12);
 function ensure(){
  if(ctx)return true;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC)return false;
   ctx=new AC();
   output=ctx.createGain();output.gain.value=.0001;
   const comp=ctx.createDynamicsCompressor();comp.threshold.value=-21;comp.knee.value=10;
   comp.ratio.value=2.2;comp.attack.value=.009;comp.release.value=.24;
   output.connect(comp);comp.connect(ctx.destination);
   delay=ctx.createDelay(.85);delay.delayTime.value=score.style==='ocean'?.44:.28;
   feedback=ctx.createGain();feedback.gain.value=score.style==='ocean'?.19:.12;
   wet=ctx.createGain();wet.gain.value=score.style==='ocean'?.20:.12;
   delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(output);
   noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.24),ctx.sampleRate);
   const data=noise.getChannelData(0);let state=7182;
   for(let i=0;i<data.length;i++){state=(state*1664525+1013904223)>>>0;data[i]=(state/2147483648-1)*.8}
   // Chrome/Safari can suspend an AudioContext AFTER the first few audible notes.
   // Always keep our scheduling state in sync with the actual playback state.
   ctx.onstatechange=()=>{
    if(ctx.state==='running'){
     if(enabled&&!document.hidden&&!running)activate();
    }else{
     pauseScheduling();
    }
    sync();
   };
   return true;
  }catch{return false}
 }
 function voice(note,time,length,instrument,vol=.05){
  if(!ctx)return;
  const t=Math.max(time,ctx.currentTime+.002);
  const pad=instrument==='pad',bass=instrument==='bass',glass=instrument==='glass',lead=instrument==='softsynth';
  const attack=pad?.30:bass?.015:glass?.012:lead?.02:.009;
  const release=pad?.65:glass?.9:lead?.19:bass?.18:.24;
  const amp=ctx.createGain(),filter=ctx.createBiquadFilter();
  filter.type='lowpass';filter.frequency.value=pad?1040:bass?480:glass?1900:lead?1650:2600;
  const sustainTime=t+Math.max(.13,length),end=sustainTime+release;
  amp.gain.setValueAtTime(.00001,t);
  amp.gain.linearRampToValueAtTime(vol,t+attack);
  if(pad){amp.gain.setValueAtTime(vol*.80,sustainTime);amp.gain.linearRampToValueAtTime(.00001,end)}
  else if(glass){amp.gain.exponentialRampToValueAtTime(vol*.40,t+Math.min(length,.6));amp.gain.exponentialRampToValueAtTime(.00001,end)}
  else {amp.gain.exponentialRampToValueAtTime(vol*.54,t+Math.min(.18,length*.7));
    amp.gain.setValueAtTime(vol*.38,sustainTime);amp.gain.exponentialRampToValueAtTime(.00001,end)}
  amp.connect(filter);filter.connect(output);
  if(!bass){const send=ctx.createGain();send.gain.value=pad?.16:.10;filter.connect(send);send.connect(delay)}
  const oscillator=ctx.createOscillator();
  oscillator.type=pad?'triangle':bass?'sine':glass?'sine':lead?'triangle':instrument==='marimba'?'triangle':'sine';
  oscillator.frequency.setValueAtTime(hz(note),t);
  oscillator.connect(amp);oscillator.start(t);oscillator.stop(end+.02);
  if(pad||instrument==='keys'||lead){
   const harmon=ctx.createOscillator(),hGain=ctx.createGain();
   harmon.type=pad?'sine':'triangle';harmon.frequency.setValueAtTime(hz(note)*(pad?1.005:2),t);
   hGain.gain.value=pad?.17:lead?.13:.08;harmon.connect(hGain);hGain.connect(amp);
   harmon.start(t);harmon.stop(end+.02);
  }
 }
 function brush(time,strength=1,kind='shake'){
  if(!ctx||!noise)return;
  const t=Math.max(ctx.currentTime+.002,time),src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=noise;filter.type=kind==='kick'?'lowpass':'highpass';
  filter.frequency.value=kind==='kick'?190:kind==='snare'?1800:4600;
  const length=kind==='kick'?.16:kind==='snare'?.095:.048;
  gain.gain.setValueAtTime(Math.max(.0001,(kind==='kick'?.034:kind==='snare'?.021:.010)*strength),t);
  gain.gain.exponentialRampToValueAtTime(.00001,t+length);
  src.connect(filter);filter.connect(gain);gain.connect(output);src.start(t);src.stop(t+length+.01);
 }
 function perform(index,t){
  const bar=Math.floor(index/8)%8,within=index%8,beat=60/score.bpm;
  const chord=score.chords[bar],root=score.bass[bar],style=score.style;
  if(within===0){
   for(const n of chord)voice(n,t,beat*3.7,'pad',style==='ocean'?.010:style==='drive'?.009:.012);
   if(style!=='ocean')voice(chord[2]+12,t+beat*.35,style==='bossa'?'marimba':'keys',.025);
  }
  if(style==='ocean'){
   if(within===0)voice(root,t,beat*3.6,'bass',.042);
   if(within===4)voice(chord[1]+12,t,beat*1.8,'glass',.040);
  }else if(style==='drive'){
   if(within%2===0)voice(root+(within===6?7:0),t,beat*.42,'bass',.080);
   if(within%2===0)brush(t,.75,within%8===4?'snare':'kick');
   if(within%2===1)brush(t,.65,'shake');
   if(within===3||within===7)voice(chord[(within===3?1:2)]+12,t,beat*.28,'softsynth',.031);
  }else if(style==='bossa'){
   if(within===0||within===3||within===5)voice(root+(within===5?7:0),t,beat*.46,'bass',.063);
   if(within===0||within===4)brush(t,.65,'kick');
   if(within===3||within===7)brush(t,.70,'shake');
   if(within===2||within===5)voice(chord[within===2?1:2]+12,t,beat*.6,'keys',.031);
  }else{
   if(within===0||within===4)voice(root+(within===4?7:0),t,beat*.8,'bass',.056);
   if(within===2||within===6)voice(chord[(within===2?1:2)]+12,t,beat*.45,'keys',.038);
   if(within===4)brush(t,.38,'shake');
  }
  const melody=score.melody[(index%32)];
  if(melody!=null){
   const sustain=style==='ocean'?beat*1.8:style==='drive'?beat*.48:beat*.72;
   voice(melody,t,sustain,score.instrument,style==='ocean'?.045:style==='drive'?.039:.050);
  }
 }
 function pauseScheduling(){
  if(interval){clearInterval(interval);interval=null}
  running=false;
 }
 function schedule(){
  if(!running||!ctx||!enabled)return;
  // A Web Audio context may become suspended or interrupted mid-game.
  if(ctx.state!=='running'){pauseScheduling();sync();return}
  const halfBeat=30/score.bpm;
  // Don't spend a long time catching up after throttled timers or device sleep.
  if(nextTime<ctx.currentTime-halfBeat*2)nextTime=ctx.currentTime+.012;
  let guard=0;
  while(nextTime<ctx.currentTime+.40&&guard++<10){
   perform(step,nextTime);step=(step+1)%64;nextTime+=halfBeat;
  }
 }
 function stop(){
  pauseScheduling();
  if(ctx&&output){try{output.gain.cancelScheduledValues(ctx.currentTime);output.gain.setTargetAtTime(.00001,ctx.currentTime,.055)}catch{}}
  sync();
 }
 function activate(){
  if(!ctx||ctx.state!=='running'||running||!enabled||document.hidden)return false;
  running=true;
  // Continue the same musical sequence after an interruption instead of replaying its first note.
  nextTime=ctx.currentTime+.008;
  output.gain.cancelScheduledValues(ctx.currentTime);
  output.gain.setTargetAtTime(.38,ctx.currentTime,.028);
  schedule();interval=setInterval(schedule,85);
  sync();return true;
 }
 function start(){
  if(!enabled||document.hidden||!ensure())return false;
  if(ctx.state==='running')return running?true:activate();
  // Never trust 'running' if the browser has suspended the actual audio engine.
  pauseScheduling();
  try{
   const result=ctx.resume();
   if(ctx.state==='running')return activate();
   if(result?.then)result.then(()=>{
    if(enabled&&!document.hidden&&ctx.state==='running')activate();
   }).catch(()=>sync());
  }catch{}
  sync();return false;
 }
 function toggle(){
  enabled=!enabled;try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
  if(enabled)start();else stop();
  sync();return enabled;
 }
 function sync(){
  if(!button)return;
  button.textContent=label();
  button.title=(isZh()?'原创循环配乐「':'Original looping music “')+score.title[isZh()?'zh':'en']+'”';
  const blocked=enabled&&ctx&&ctx.state!=='running';
  if(blocked)button.textContent=isZh()?'♫ 音乐：点击开启':'♫ Music: Tap to play';
  button.setAttribute('aria-label',button.textContent);button.setAttribute('aria-pressed',String(enabled));
  button.classList.toggle('mw-music-off',!enabled);
 }
 function mount(){
  button=document.createElement('button');button.type='button';button.className='mw-music-toggle';
  button.dataset.mwMusic='true';button.addEventListener('click',e=>{e.stopPropagation();if(enabled&&(!running||ctx?.state!=='running'))start();else toggle();});
  const css=document.createElement('style');
  css.textContent='.mw-music-toggle{font:750 12px/1.3 system-ui,sans-serif;background:#f7e9f2;color:#6c5077;border:1px solid #dec6db;border-radius:999px;padding:8px 12px;min-height:35px;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px #8a708619}.mw-music-toggle:hover{background:#f0dfed}.mw-music-toggle:focus-visible{outline:3px solid #bca1e0;outline-offset:2px}.mw-music-toggle.mw-music-off{background:#f6f4f2;color:#8b8187;border-color:#e6dedf}@media(max-width:620px){.mw-music-toggle{font-size:10px;padding:7px 9px}}';
  document.head.appendChild(css);
  const holder=game==='tiny-town'?document.querySelector('.top-actions'):
   game==='pocket-aquarium'?document.querySelector('header'):
   document.querySelector('.scoreboard');
  if(holder)holder.appendChild(button);else{
   button.classList.add('mw-music-fixed');css.textContent+='.mw-music-fixed{position:fixed;bottom:100px;right:12px;z-index:9999}';
   document.body.appendChild(button);
  }
  sync();
 }
 function unlock(evt){
  if(evt.type==='keydown'&&['Tab','Escape','Shift','Alt','Control','Meta'].includes(evt.key))return;
  firstGesture=true;
  if(enabled&&(!running||ctx?.state!=='running'))start();
 }
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',unlock,true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(enabled)start()});
 window.addEventListener('pagehide',stop);
 window.addEventListener('morrowwish-language-change',()=>setTimeout(sync,0));
 if(game==='pocket-aquarium')document.addEventListener('click',e=>{if(e.target.closest?.('.languages'))setTimeout(sync,0)});
 if(enabled)start(); // Immediately attempt at script execution, before DOMContentLoaded.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.MorrowwishMusic={start,stop,toggle,sync,status:()=>({game,enabled,running,unlocked:firstGesture,title:score.title.en,step,tempo:score.bpm})};
})();