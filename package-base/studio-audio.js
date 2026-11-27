/* Morrow Wish — sound effects only. No background music or repeating audio.
   All tones are event-triggered and stop promptly. No external audio assets. */
(()=>{'use strict';
const route='cat-bond';
const games=new Set(['pawsibly-innocent','elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium','cat-bond']);
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
 control.title=lang()==='zh'?'开启或关闭音效（背景音乐可单独控制）':'Turn sound effects on or off (music has a separate control)';
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
 if(enabled){start();for(const kind of Object.keys(combatAt))delete combatAt[kind];}
 else stop();
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
 case 'gameover':
  tone(midi+7,t,.13,'triangle',.024);tone(midi+3,t+.09,.17,'sine',.022);tone(midi-2,t+.22,.28,'sine',.019);break;
 case 'pop':
  tone(midi,t,.12,'sine',.025);break;
 case 'quiet':
  tone(midi,t,.08,'sine',.016);break;
 default:
  tone(midi,t,.075,'sine',.020);
 }
 effects++;
}

// Cat Bond battle-specific foley. Uses the global sound toggle and the browser's
// already-unlocked AudioContext. No loops/downloads, no beeps on every frame.
const combatKinds=new Set(['combat_swing','combat_claw','combat_projectile','combat_magic',
 'combat_beam','combat_dash','combat_hit','combat_dodge','combat_hurt',
 'combat_duo','combat_duo_impact','combat_ultimate','combat_win']);
const combatAt=Object.create(null);
function combatSound(kind){
 if(route!=='cat-bond'||!enabled||!unlocked||!ctx||!master)return;
 const now=ctx.currentTime+.007;
 const gaps={combat_hit:.11,combat_hurt:.23,combat_swing:.16,combat_duo:.6,
  combat_duo_impact:.50,combat_magic:.16,combat_claw:.18,combat_ultimate:.35};
 if(now-(combatAt[kind]??-99)<(gaps[kind]||.15))return;
 combatAt[kind]=now;
 const sweep=(a,b,d,v=.08,type='triangle',delay=0)=>{
  try{
   const t=now+delay,o=ctx.createOscillator(),amp=ctx.createGain(),f=ctx.createBiquadFilter();
   o.type=type;o.frequency.setValueAtTime(a,t);
   o.frequency.exponentialRampToValueAtTime(Math.max(40,b),t+d);
   f.type='lowpass';f.frequency.value=type==='sawtooth'?1100:2300;
   amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(v,t+.007);
   amp.gain.exponentialRampToValueAtTime(.0001,t+d);
   o.connect(f);f.connect(amp);amp.connect(master);o.start(t);o.stop(t+d+.015);
  }catch{}
 };
 const brush=(d,hz,v,delay=0)=>{
  try{
   const t=now+delay,b=ctx.createBuffer(1,Math.max(128,Math.floor(ctx.sampleRate*d)),ctx.sampleRate);
   const dat=b.getChannelData(0);for(let i=0;i<dat.length;i++)dat[i]=Math.random()*2-1;
   const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),amp=ctx.createGain();
   src.buffer=b;f.type='bandpass';f.frequency.value=hz;f.Q.value=.75;
   amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(v,t+.008);
   amp.gain.exponentialRampToValueAtTime(.0001,t+d);
   src.connect(f);f.connect(amp);amp.connect(master);src.start(t);src.stop(t+d+.01);
  }catch{}
 };
 switch(kind){
 case 'combat_swing':brush(.09,1650,.10);sweep(750,330,.10,.04);break;
 case 'combat_claw':brush(.15,1880,.15);sweep(920,250,.17,.075,'sawtooth');break;
 case 'combat_projectile':brush(.12,970,.11);sweep(460,970,.13,.06);break;
 case 'combat_magic':sweep(360,950,.18,.07,'sine');sweep(800,560,.18,.035,'triangle',.045);break;
 case 'combat_beam':sweep(380,1190,.24,.09,'sawtooth');brush(.22,1800,.08);break;
 case 'combat_dash':brush(.20,2200,.14);sweep(880,320,.18,.055);break;
 case 'combat_hit':brush(.075,850,.17);sweep(220,105,.13,.13);break;
 case 'combat_dodge':brush(.17,2450,.13);sweep(630,1190,.16,.06,'sine');break;
 case 'combat_hurt':brush(.10,560,.11);sweep(270,125,.20,.09);break;
 case 'combat_duo':sweep(170,335,.37,.11);sweep(280,670,.32,.073,'sine',.11);brush(.33,1400,.08,.1);break;
 case 'combat_duo_impact':brush(.26,860,.25);sweep(175,72,.34,.18,'sawtooth');sweep(800,260,.23,.09,'triangle',.04);break;
 case 'combat_ultimate':brush(.25,1400,.13);sweep(260,730,.27,.1,'sawtooth');sweep(950,360,.25,.06,'sine',.065);break;
 case 'combat_win':sweep(520,660,.17,.048,'sine');sweep(660,880,.21,.044,'triangle',.13);sweep(880,1040,.25,.033,'sine',.27);break;
 }
 effects++;
}

const duoSoundCatalog={"dark+dark":[43,3,7,10,420,48,0],"dark+elec":[51,12,7,18,1720,80,1],"dark+fire":[47,5,10,14,1150,82,2],"dark+grass":[49,3,8,5,720,57,3],"dark+light":[55,7,12,9,1380,70,4],"dark+water":[46,5,2,9,510,67,5],"elec+elec":[67,9,14,21,2580,90,6],"elec+fire":[52,12,7,20,1840,96,7],"elec+grass":[57,5,8,15,1280,73,8],"elec+light":[65,11,15,24,2400,82,9],"elec+water":[60,7,3,17,1500,76,10],"fire+fire":[48,7,12,19,850,98,11],"fire+grass":[56,4,11,16,1090,73,12],"fire+light":[61,7,14,19,1850,90,13],"fire+water":[45,7,3,12,580,92,14],"grass+grass":[53,4,7,13,870,62,15],"grass+light":[62,4,7,12,1670,74,16],"grass+water":[58,3,10,6,960,70,17],"light+light":[68,4,9,15,2500,82,18],"light+water":[57,7,12,8,1350,77,19],"water+water":[50,7,2,14,680,80,20]};
let duoSignatureEvents=0,lastSignature=null;
function duoSignature(pair,tier=1,beat='cast'){
 if(route!=='cat-bond'||!enabled||!unlocked||!ctx||!master)return false;
 const v=duoSoundCatalog[pair];if(!v)return false;
 const [root,d1,d2,d3,color,weight,shape]=v;
 const lvl=Math.max(1,Math.min(3,Math.floor(Number(tier)||1)));
 const when=ctx.currentTime+.014,impact=beat==='impact',release=beat==='release';
 const timbre=['triangle','sine','sawtooth'][shape%3];
 const notes=[root,root+d1,root+d2,root+d3];
 const rhythms=[0,.058+shape%4*.018,.14+shape%5*.021,.23+shape%3*.028];
 if(release){
  // Short, satisfying elemental echo AFTER the painting clears, not a
  // replay of the cast melody. Existing mute/unlock rules still apply.
  tone(root+d2+7,when,.26,'triangle',.064);
  tone(root+d3+12,when+.085,.32,'sine',.056);
  if(lvl>=2)tone(root+d1+19,when+.15,.22,timbre,.040);
  if(lvl>=3)tone(root+12,when+.22,.34,'triangle',.043);
 }else if(impact){
  tone(root-19-(shape%3)*2,when,.34+(lvl-1)*.05,'sawtooth',.09+weight/1000);
  tone(root-26,when+.016,.38,'sine',.062+weight/2000);
  tone(root+d3,when+.043,.23,timbre,.076);
  if(lvl>=2)tone(root+d2+12,when+.09,.21,'triangle',.060);
  if(lvl>=3)tone(root+d3+19,when+.15,.30,'sawtooth',.054);
 }else notes.forEach((note,i)=>
  tone(note,when+rhythms[i],.12+i*.035,timbre,(i===3?.083:.045)*(1+(lvl-1)*.12)));
 try{
  const duration=release?.31:impact?.26:.15,t=when+(impact||release?0:.02);
  const buffer=ctx.createBuffer(1,Math.ceil(duration*ctx.sampleRate),ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=buffer;filter.type=shape%4===0?'lowpass':'bandpass';
  filter.frequency.value=color;filter.Q.value=.8+(shape%3)*.25;
  gain.gain.setValueAtTime(.0001,t);
  gain.gain.exponentialRampToValueAtTime((impact?.15:release?.085:.08)*(1+(lvl-1)*.18),t+.009);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  src.connect(filter);filter.connect(gain);gain.connect(master);
  src.start(t);src.stop(t+duration+.01);
 }catch{}
 duoSignatureEvents++;effects++;
 lastSignature={pair,beat,tier:lvl,identity:notes.join('-')+'/'+rhythms.join('-')+'/'+color};
 return true;
}
// Individual Q/E/ultimate abilities get their own short musical/foley fingerprint.
// Reuse the SAME WebAudio/mute state as the rest of Morrow Wish.
const skillAt=Object.create(null);
let skillSignatureEvents=0,lastSkillSignature=null;
function skillSignature(skillId,element='light',strength=1){
 if(route!=='cat-bond'||!enabled||!unlocked||!ctx||!master||!skillId)return false;
 const key=String(skillId);
 const now=ctx.currentTime+.008;
 if(now-(skillAt[key]??-99)<.15)return true;
 skillAt[key]=now;
 const profiles={
  dark:[47,'triangle',580],elec:[64,'sawtooth',2200],
  fire:[53,'sawtooth',1450],grass:[58,'sine',920],
  light:[71,'sine',2550],water:[60,'triangle',1250]
 };
 const [base,wave,filterHz]=profiles[element]||profiles.light;
 let id=5381;for(const c of key)id=(Math.imul(id,33)^c.charCodeAt(0))>>>0;
 const root=base+(id%9)-4,interval=3+id%9,delay=.04+(id%5)*.014;
 const power=Math.max(1,Math.min(3,Number(strength)||1));
 tone(root,now,.11+.04*(id%3),wave,.033+.006*power);
 tone(root+interval,now+delay,.16+.04*(id%4),wave,.026+.006*power);
 if(power>=2){
  // Heavy skills should sound heavier before players look at the screen.
  tone(root-12,now,.25,power>=3?'sawtooth':'triangle',.063+.015*(power-2));
  tone(root-19,now+.065,.33,'sine',.055);
 }
 try{
  const len=power>=3?.29:power>=2?.20:.12;
  const buffer=ctx.createBuffer(1,Math.max(128,Math.floor(ctx.sampleRate*len)),ctx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  src.buffer=buffer;filter.type=['dark','water','grass'].includes(element)?'lowpass':'bandpass';
  filter.frequency.value=filterHz+id%3*120;filter.Q.value=.55+(id%4)*.2;
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.055+.025*(power-1),now+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,now+len);
  src.connect(filter);filter.connect(gain);gain.connect(master);
  src.start(now);src.stop(now+len+.01);
 }catch{}
 effects++;skillSignatureEvents++;
 lastSkillSignature={id:key,element,power,signature:root+'/'+interval+'/'+delay+'/'+wave+'/'+filterHz};
 return true;
}
const mappings={
 fish:[77,'success'],win:[74,'success'],bad:[55,'fail'],caught:[52,'fail'],vase:[62,'crash'],
 yarn:[74,'bounce'],lured:[76,'bounce'],light:[69,'quiet'],souvenir:[81,'success'],milk:[77,'pop'],
 pet:[72,'bounce'],rustle:[69,'quiet'],paw:[74,'quiet'],discover:[79,'success'],capture:[77,'success'],
 tap:[71,'quiet'],select:[72,'quiet'],step:[71,'quiet'],flip:[75,'bounce'],sort:[69,'pop'],
 bubble:[79,'pop'],page:[69,'quiet'],feed:[77,'pop'],combo:[81,'success'],build:[72,'success'],
 complete:[74,'success'],fail:[52,'fail'],end_fail:[65,'gameover'],retry:[67,'quiet'],start:[69,'quiet'],
 // Cat Bond combat beats: a heavy ultimate boom, a bright "ult ready" chime, and a
 // soft channel hiss — previously these keys fell through to the quiet UI blip.
 ultimate:[48,'crash'],ready:[84,'success'],beam:[66,'quiet'],charge:[60,'bounce']
};
function effect(kind='tap'){
 if(combatKinds.has(kind)){combatSound(kind);return;}
 // Cat Bond's gentle layered gestures avoid beeps on every canvas movement.
 if(route==='cat-bond'&&['pet','rustle','paw','discover'].includes(kind)){
   if(!enabled||!unlocked||!ctx)return;
   const now=ctx.currentTime+.008;
   // Soft filtered air/brush noises — not a continuous set of beeping notes.
   const brush=(duration,frequency,level,filterType='lowpass')=>{
     try{
       const length=Math.max(1,Math.floor(ctx.sampleRate*duration));
       const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
       const arr=buffer.getChannelData(0);
       for(let i=0;i<length;i++)arr[i]=(Math.random()*2-1);
       const src=ctx.createBufferSource();src.buffer=buffer;
       const filter=ctx.createBiquadFilter();filter.type=filterType;filter.frequency.value=frequency;
       const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,now);
       gain.gain.linearRampToValueAtTime(level,now+.012);
       gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
       src.connect(filter);filter.connect(gain);gain.connect(master);
       src.start(now);src.stop(now+duration+.005);
     }catch{}
   };
   if(kind==='rustle'){brush(.19,1200,.065,'bandpass');brush(.12,2200,.022,'highpass');}
   else if(kind==='paw'){brush(.10,360,.045);tone(61,now,.09,'triangle',.009);}
   else if(kind==='pet'){
     brush(.19,520,.018);
     tone(52,now,.16,'sine',.010);tone(57,now+.075,.20,'triangle',.009);
   }else{
     tone(74,now,.12,'triangle',.014);
     tone(79,now+.075,.18,'sine',.014);
     tone(83,now+.15,.25,'sine',.012);
   }
   effects++;return;
 }
 const [n,s]=mappings[kind]||mappings.tap;sfx(n,s);
}
function note(freq){if(enabled&&unlocked)sfx(69+12*Math.log2(Math.max(40,freq)/440),'pop')}
function status(){return{profile:route,enabled,unlocked,playing:false,backgroundMusic:false,oscillators:voices,loopSteps:0,effects,audioState:ctx?.state||'not-created',combatSounds:route==='cat-bond'?combatKinds.size:0,duoSignatureCount:route==='cat-bond'?Object.keys(duoSoundCatalog).length:0,duoSignatureEvents,lastSignature,skillSignatureEvents,lastSkillSignature}}
window.MorrowwishAudio={start,stop,toggle,effect,note,status,sync,duoSignature,skillSignature,isEnabled:()=>enabled};
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
function onMetric(name,data){
 switch(String(name||'').toLowerCase()){
 case 'game_complete':effect(route==='cat-bond'?'capture':(data?.reason==='dirty'||data?.grade==='D'?'end_fail':'complete'));break;
 case 'level_complete':case 'town_completed-win':case 'town_grade-a':case 'town_grade-s':effect('complete');break;
 case 'game_over':case 'town_completed-lose':effect('end_fail');break;
 case 'feed_success':effect('feed');break;
 case 'combo':case 'town_first-club':effect('combo');break;
 case 'run_end':effect(Number(data?.won)===0?'end_fail':'complete');break;
 case 'game_retry':case 'town_retry-click':effect('retry');break;
 case 'town_first-place-quick':case 'town_first-upgrade':effect('build');break;
 default:break;
 }
}
const originalMetric=window.arcadeMetric;
if(typeof originalMetric==='function')window.arcadeMetric=function(name,...args){const result=originalMetric.call(this,name,...args);onMetric(name,args[0]);return result};
document.addEventListener('pointerdown',e=>{
 if(!enabled||!unlocked)return;
 const target=e.target;
 if(target.closest?.('[data-mw-audio], [data-mw-music], #sound, .lab-mute, #board'))return;
 if(target.closest?.('canvas')){if(route==='cat-bond')return;effect(route==='flip-dash'?'flip':route==='parcel-panic'?'sort':'bubble');return}
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
 const holder=route==='cat-bond'?document.querySelector('#stage'):
    route==='pocket-aquarium'?document.querySelector('header'):route==='tiny-town'||route==='elsewhere'?document.querySelector('.top-actions'):document.querySelector('.scoreboard');
 if(holder)holder.appendChild(control);
 else{control.classList.add('mw-audio-fixed');css.textContent+='.mw-audio-fixed{position:fixed;right:14px;bottom:58px;z-index:9999}';document.body.appendChild(control)}
 if(route==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();