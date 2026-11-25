/* Single Cat Bond RPG music and ambience director. No legacy/external BGM. */
(()=>{
'use strict';
const score=window.CatBondOriginalScore;
const assetRoot=new URL('../assets/audio/',document.currentScript.src);
let manifestTask=null;const recordedIds=new Set();
// Preserve loop duration while removing the small discontinuity at the decoded MP3 join.
function smoothLoop(buffer){const edge=Math.min(Math.round(buffer.sampleRate*.008),Math.floor(buffer.length/4));if(edge<2)return;for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c),last=a.length-1,middle=(a[0]+a[last])*.5;const firstDelta=middle-a[0];for(let i=0;i<edge;i++){const weight=.5+.5*Math.cos(Math.PI*i/(edge-1));a[i]+=firstDelta*weight;}const delta=middle-a[last];for(let i=0;i<edge;i++){const weight=.5+.5*Math.cos(Math.PI*i/(edge-1));a[last-i]+=delta*weight;}}}
function assetManifest(){return manifestTask??=(fetch(new URL('manifest.json',assetRoot),{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null));}
async function loadRecorded(id){const manifest=await assetManifest(),entry=manifest?.tracks?.[id];if(!entry)return null;try{const response=await fetch(new URL(entry.file,assetRoot));if(!response.ok)throw Error('Audio HTTP '+response.status);const bytes=await response.arrayBuffer();const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;const decoder=new O(2,1,24000);const decoded=await decoder.decodeAudioData(bytes);const samples=Math.min(decoded.length,Math.round(entry.seconds*decoded.sampleRate));const trim=decoder.createBuffer(decoded.numberOfChannels,samples,decoded.sampleRate);for(let c=0;c<decoded.numberOfChannels;c++)trim.copyToChannel(decoded.getChannelData(c).subarray(0,samples),c);if(!id.startsWith('song-'))smoothLoop(trim);recordedIds.add(id);return trim;}catch{return null;}}
const key='cat-bond-rpg-audio-v1',clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
let prefs={enabled:true,music:.65,fx:.8};
try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old)prefs={enabled:old.enabled!==false,music:typeof old.music==='number'?clamp(old.music):.65,fx:typeof old.fx==='number'?clamp(old.fx):.8};else prefs.enabled=localStorage.getItem('morrowwish-music-enabled')!=='0';}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}}
let ctx,bus,ambBus,active=null,pending=null,serial=0,desired='title',unlocked=false,hidden=document.hidden,paused=false,blocked=false,unavailable=false,duckUntil=0,amb=null,ambId='',ceremony=null,root=null,seen=new Set(),lastFx,ambientTick=0,cache=new Map(),started=false,renderQueue=Promise.resolve(),stopped=false,visualCeremony='',supportSeen=new Set(),supportRoot=null,voiceNodes=new Set(),lastErrorAt=0,cinematicVoiceNodes=new Set(),lastSceneKey='',lastNarrativeRevision=-1,lastCompleted=0,lastSanctuaries=new Set(),lastEvidence=new Set(),lastBattle=null,retiring=null,musicSources=new Set(),foleyNodes=new Set(),performedVisual=new Set(),cacheBytes=new Map();
const regions=score.regions;
// Preserve the soundtrack's authored melody and duration of sanctuary replies, but make exploratory scoring lighter.
function musicMix(id){
 const dramatic=id==='betrayal'||id==='finale1'||id==='finale2'||id.startsWith('boss-');
 const ceremony=id.startsWith('song-');
 return {low:dramatic?-2:ceremony?-2.5:-3.5,high:dramatic?1:1.8,rate:1};
}
function connectMusic(source,gain,id){
 const profile=musicMix(id);if(source.playbackRate)source.playbackRate.value=profile.rate;
 if(typeof ctx.createBiquadFilter!=='function'){source.connect(gain);gain.connect(bus);return [];}
 const bass=ctx.createBiquadFilter(),air=ctx.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=210;bass.gain.value=profile.low;air.type='highshelf';air.frequency.value=1900;air.gain.value=profile.high;
 source.connect(bass);bass.connect(air);air.connect(gain);gain.connect(bus);return [bass,air];
}
const now=()=>ctx?.currentTime||0;
function ensure(){
 if(ctx)return true;
 try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;ctx=new A();bus=ctx.createGain();ambBus=ctx.createGain();bus.gain.value=0;ambBus.gain.value=0;bus.connect(ctx.destination);ambBus.connect(ctx.destination);return true;}catch{return false;}
}
function target(node,value,sec=.12){if(!node||!ctx)return;const t=now();node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(value,t,sec);}
function mix(){
 const cinematic=document.querySelector('.cbcp-root:not([hidden])'),talk=document.querySelector('.res-host.is-visible,.res-npc-dialogue');
 target(bus,prefs.enabled&&!hidden&&!paused?prefs.music*(now()<duckUntil?.28:cinematic?.65:talk?.48:.82):0);
 target(ambBus,!hidden&&!paused&&window.MorrowwishAudio?.isEnabled?.()!==false?prefs.fx*.23:0);
}
async function getBuffer(id){
 if(cache.has(id)){const v=cache.get(id);cache.delete(id);cache.set(id,v);return v;}
 const task=renderQueue.then(async()=>{if(id!==desired&&pending?.id!==id&&id!=='song-'+read().amb)throw Error('Superseded audio request');return await loadRecorded(id)||await score.render(id);});renderQueue=task.catch(()=>{});cache.set(id,task);
 try{const b=await task;cacheBytes.set(id,b.length*b.numberOfChannels*4);trimCache(id);return b;}catch(e){cache.delete(id);cacheBytes.delete(id);throw e;}
}
function trimCache(keep){let bytes=[...cacheBytes.values()].reduce((n,b)=>n+b,0);for(const id of cache.keys()){if(cache.size<=3&&bytes<=24*1024*1024)break;if(id===keep||id===active?.id||id===retiring?.id||id===pending?.id||!cacheBytes.has(id))continue;bytes-=cacheBytes.get(id);cacheBytes.delete(id);cache.delete(id);}}
function cancelCinematicSounds(){for(const n of cinematicVoiceNodes){try{n.stop();}catch{}}cinematicVoiceNodes.clear();}
function cue(kind,frequency=0){
 if(!ctx||!unlocked||hidden||paused||window.MorrowwishAudio?.isEnabled?.()===false||!prefs.fx)return false;
 const t=now()+.015, configs={
  sanctuary:[[1, .90,.055],[2.01,.60,.020],[3.9,.38,.008]],
  bell:[[1,1.10,.08],[2.007,.65,.030],[4.11,.32,.011]],
  seal:[[1,.88,.07],[1.5,.73,.033],[2.01,.55,.018]],
  impact:[[1,.55,.11],[1.49,.33,.042],[2.06,.21,.026]],
  seasons:[[1,.72,.04],[1.5,.55,.023],[2.01,.36,.011]],
  memory:[[1,.70,.055],[1.5,.58,.022],[2.01,.40,.009]],
  mechanism:[[1,.16,.045],[2.7,.12,.016],[4.1,.08,.007]],
  reward:[[1,.40,.045],[1.5,.52,.030],[2,.68,.020]],
  melody:[[1,.48,.075],[2.002,.26,.018],[3.01,.15,.006]],
  error:[[1,.20,.027],[1.5,.15,.010]]
 },f=frequency>40?frequency:({sanctuary:392,bell:523.25,seal:196,impact:64,seasons:440,memory:330,mechanism:210,reward:523,error:146}[kind]||392),def=configs[kind];
 if(!def)return false;const cinematic=['sanctuary','seal','impact','seasons','memory','bell'].includes(kind);
 if(cinematic)cancelCinematicSounds();
 for(const [ratio,d,amp] of def){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f*ratio,t);if(kind==='impact')o.frequency.exponentialRampToValueAtTime(f*ratio*.45,t+d*.8);g.gain.setValueAtTime(.00001,t);g.gain.linearRampToValueAtTime(amp,t+.012);g.gain.exponentialRampToValueAtTime(.00001,t+d);o.connect(g);g.connect(ambBus);if(cinematic)cinematicVoiceNodes.add(o);o.onended=()=>{cinematicVoiceNodes.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+d+.02);}
 if(cinematic){duckUntil=Math.max(duckUntil,t+.85);mix();}
 return true;
}
function dispose(s,fade=.7,t=now()){
 if(!s||s.stopping)return;s.stopping=true;try{s.gain.gain.cancelScheduledValues(t);s.gain.gain.setTargetAtTime(.00001,t,fade/4);s.source.stop(t+fade);}catch{}
}
function clear(){++serial;pending=null;for(const s of musicSources){try{s.source.stop(now()+.02);}catch{}}active=null;retiring=null;}
function select(id){
 desired=id;
 if(!ctx||!unlocked||!prefs.enabled||hidden||paused||stopped)return;
 if(active?.id===id&&!active.stopping){if(pending&&pending.id!==id){++serial;pending=null;}return;}
 if(pending?.id===id||unavailable&&Date.now()-lastErrorAt<3000)return;
 const token=++serial;pending={id,token};
 getBuffer(id).then(buffer=>{
  if(token!==serial||desired!==id||!prefs.enabled||hidden||paused)return;
  pending=null;const old=active,source=ctx.createBufferSource(),gain=ctx.createGain(),switchTime=now(),t=switchTime+(old?.source? .14 : 0);
  source.buffer=buffer;source.loop=!id.startsWith('song-');gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(1,t+.25);const filters=connectMusic(source,gain,id);
  const next={id,source,gain,buffer,filters,started:t,stopping:false};active=next;
  musicSources.add(next);source.onended=()=>{musicSources.delete(next);if(retiring===next)retiring=null;source.disconnect();gain.disconnect();for(const filter of filters)filter.disconnect();if(active===next){active=null;if(ceremony?.id===id){if(ceremony.visual&&ceremony.root===root)performedVisual.add(ceremony.region);ceremony=null;}tick();}trimCache(desired);};
  if(retiring&&retiring!==old){try{retiring.gain.gain.setValueAtTime(0,now());retiring.source.stop(now());}catch{}}retiring=old;dispose(old,.13,switchTime);source.start(t);blocked=false;unavailable=false;
  if(ceremony?.id===id)ceremony.started=true;
 }).catch(()=>{if(token===serial){pending=null;unavailable=true;lastErrorAt=Date.now();}});
}
function noise(region){
 const sr=24000,len=Math.round(sr*12),b=ctx.createBuffer(2,len,sr),profile={
  garden:{wind:.20,water:.24,leaves:.23,rumble:0},harbor:{wind:.18,water:.78,leaves:0,rumble:.09},forest:{wind:.14,water:.28,leaves:.64,rumble:0},
  forge:{wind:.07,water:0,leaves:.14,rumble:.38},sky:{wind:.83,water:0,leaves:.02,rumble:.08},library:{wind:.045,water:0,leaves:.13,rumble:.02},starfall:{wind:.53,water:0,leaves:.18,rumble:.16}
 }[region];if(!profile)return null;
 for(let ch=0;ch<2;ch++){
  let seed=1997+ch*321,x=0,y=0,z=0;const a=b.getChannelData(ch);
  for(let i=0;i<len;i++){
   const t=i/sr,p=i/len;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296*2-1;
   x+=(n-x)*.014;y+=(n-y)*.11;z+=(n-z)*.003;
   const swell=.32+.68*Math.pow(.5+.5*Math.sin(2*Math.PI*(p*3+ch*.07)),2),gust=.22+.78*Math.pow(.5+.5*Math.sin(2*Math.PI*(p*2+.17)),2);
   const waves=(x*.9+(y-x)*.24)*swell,wind=(z*2.3+x*.3)*gust,leaf=(n-y)*(.12+.88*gust)*.11;
   const machine=(z*.8+Math.sin(2*Math.PI*48*t)*.016+Math.sin(2*Math.PI*96*t)*.007)*(.55+.45*Math.sin(2*Math.PI*p*4)**2);
   a[i]=profile.water*waves*.55+profile.wind*wind*.35+profile.leaves*leaf*.23+profile.rumble*machine*.55;
  }
  for(let i=0;i<Math.min(900,len/2);i++){const q=Math.sin(i/900*Math.PI/2);a[i]*=q;a[len-1-i]*=q;}
 }
 return b;
}
function ambience(id){
 if(!ctx||!unlocked||id===ambId)return;
 if(amb)dispose(amb,.6);for(const n of foleyNodes){try{n.stop();}catch{}}foleyNodes.clear();amb=null;ambId=id;
 const b=noise(id);if(!b)return;
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=b;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(ambBus);gain.gain.setTargetAtTime(1,now(),.18);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();amb={source,gain};
}
function stopVoices(){for(const n of voiceNodes){try{n.stop();}catch{}}voiceNodes.clear();}
function playResponse(region){
 if(!ctx||!unlocked||hidden||paused||!prefs.enabled)return false;
 const phrase=score.response(region);if(!phrase)return false;
 const start=now()+.045;duckUntil=Math.max(duckUntil,start+phrase.seconds*.58);mix();
 for(const note of phrase.notes){
  const t=start+note.t*.58,d=Math.max(.09,note.d*.55),freq=440*2**((note.m-69)/12);
  for(const [ratio,amp] of [[1,.055],[2.01,.020],[3.98,.009]]){
   const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq*ratio;
   g.gain.setValueAtTime(.00001,t);g.gain.linearRampToValueAtTime(amp,t+.012);g.gain.exponentialRampToValueAtTime(.00001,t+d+.20);
   o.connect(g);g.connect(bus);voiceNodes.add(o);o.onended=()=>{voiceNodes.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+d+.23);
  }
 }
 return true;
}
function foley(id){
 if(!ctx||hidden||paused||window.MorrowwishAudio?.isEnabled?.()===false||prefs.fx===0)return;
 const t=now(),pan=Math.sin(t*.83)*.8;
 const chirp=(at,from,to,d,amp,ratio=1)=>{
  const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type='sine';o.frequency.setValueAtTime(from*ratio,at);o.frequency.exponentialRampToValueAtTime(to*ratio,at+d*.75);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(amp,at+d*.18);g.gain.exponentialRampToValueAtTime(.0001,at+d);p.pan.value=pan;o.connect(g);g.connect(p);p.connect(ambBus);foleyNodes.add(o);o.onended=()=>{foleyNodes.delete(o);o.disconnect();g.disconnect();p.disconnect();};o.start(at);o.stop(at+d+.02);
 };
 const texture=(at,d,center,q,amp)=>{
  const len=Math.ceil(ctx.sampleRate*d),b=ctx.createBuffer(1,len,ctx.sampleRate),a=b.getChannelData(0);let seed=Math.floor(at*100000)+13;
  for(let i=0;i<len;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const env=Math.sin(Math.PI*i/len)**2;a[i]=(seed/4294967296*2-1)*env;}
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),p=ctx.createStereoPanner();s.buffer=b;f.type='bandpass';f.frequency.value=center;f.Q.value=q;g.gain.value=amp;p.pan.value=pan;s.connect(f);f.connect(g);g.connect(p);p.connect(ambBus);foleyNodes.add(s);s.onended=()=>{foleyNodes.delete(s);s.disconnect();f.disconnect();g.disconnect();p.disconnect();};s.start(at);
 };
 if(id==='forest'||id==='garden'){
  // Two soft bird calls with overtone and independently moving pitch.
  for(let j=0;j<3;j++){const a=t+j*.19,f=(id==='forest'?1580:1190)+j*90;chirp(a,f,f*1.37,.13,.045);chirp(a,f*1.01,f*1.36,.11,.013,2);}
  texture(t+.6,.7,1300,.8,.08);
 }else if(id==='harbor'){
  texture(t,1.6,420,.7,.16);chirp(t+.55,155,110,.7,.026);chirp(t+.55,155,110,.4,.009,2.1);
 }else if(id==='forge'){
  texture(t,.7,1900,1.3,.14);for(const r of [1,2.76,4.15])chirp(t+.35,220*r,210*r,.6/r,.038/r);
 }else if(id==='sky'){texture(t,1.8,580,.65,.15);texture(t+.8,.9,1700,.7,.09);}
 else if(id==='library'){texture(t,.46,2300,1.4,.075);for(const r of [1,2.02,3.9])chirp(t+.42,510*r,505*r,.8/r,.018/r);}
 else if(id==='starfall'){texture(t,1.4,850,.75,.12);for(const r of [1,2.01,4.16])chirp(t+.5,310*r,310*r,1.1/r,.025/r);}
}
function read(){
 const game=window.__game,state=window.State?.S,story=state?.resonance,id=story?.scene||'',region=window.WorldMap?.mode==='region'?window.WorldMap.currentRegion:null;
 const cinematic=document.querySelector('.cbcp-root:not([hidden]),#cb-opening-cover'),dialogue=document.querySelector('.res-host.is-visible,.res-npc-dialogue');
 const finale=game?.scene==='battle'?game.battle?.resonanceFinale?.id:null;
 if(finale)return {id:({'finale:B-01':'finale1','finale:B-02':'finale2','finale:B-03':'finale3'})[finale]||'battle',amb:''};
 if(game?.scene==='battle'){
  const b=game.battle,reg=b?.regionalCombat?.region||game._battleTheme?.region||region||state?.resonanceExploration?.location;
  return {id:(b?.storyEncounter||b?.enemies?.some(e=>e.isBoss))&&regions.includes(reg)?'boss-'+reg:'battle',amb:''};
 }
 if(cinematic){
  if(id==='prologue:P-01')return{id:'opening',amb:''};
  if(id==='prologue:P-02')return{id:'muling',amb:''};
  if(id==='prologue:P-03')return{id:'ending',amb:''};
  if(id==='library:M-03')return{id:'identity',amb:''};
  if(id==='library:M-04'||id==='starfall:F-03')return{id:'betrayal',amb:''};
  if(id==='sky:S-04')return{id:'muling',amb:''};
  if(id==='finale:B-04'||id.startsWith('epilogue:'))return{id:'ending',amb:''};
  if(id==='starfall:F-05')return{id:'finale1',amb:''};
 }
 if(!window.__CAT_BOND_STARTED__)return{id:'title',amb:''};
 if(id.startsWith('epilogue:')&&!story?.completed?.includes('epilogue:E-03'))return{id:'ending',amb:game?.scene==='yard'?'garden':''};
 if(dialogue&&id==='sky:S-04')return{id:'muling',amb:region||''};
 if(dialogue&&id==='library:M-03')return{id:'identity',amb:region||''};
 if(dialogue&&(id==='library:M-04'||id==='starfall:F-03'))return{id:'betrayal',amb:region||''};
 if(game?.scene==='map')return{id:regions.includes(region)?region:'atlas',amb:regions.includes(region)?region:''};
 return{id:story?.completed?.includes('epilogue:E-03')?'postgarden':'garden',amb:'garden'};
}
function tick(){
 const state=window.State?.S,melodies=state?.resonance?.melodies||[],scene=read();
 if(state!==root){if(root)clear();root=state;seen=new Set(melodies);ceremony=null;visualCeremony='';performedVisual.clear();supportRoot=null;stopVoices();cancelCinematicSounds();lastNarrativeRevision=-1;lastCompleted=0;lastSanctuaries=new Set();lastEvidence=new Set();lastBattle=null;}
 const narrative=state?.resonance,rev=narrative?.revision??-1;
 if(rev!==lastNarrativeRevision){
  const sanctuaries=new Set(narrative?.sanctuaries||[]),completed=narrative?.completed?.length||0,evidence=new Set(Object.entries(narrative?.evidence||{}).flatMap(([id,ops])=>(Array.isArray(ops)?ops:[]).map(op=>id+'|'+op)));
  if(lastNarrativeRevision>=0){
   if([...sanctuaries].some(x=>!lastSanctuaries.has(x)))cue('bell');
   else if([...evidence].some(x=>!lastEvidence.has(x)&&/\|(?:puzzle|mechanism|repair|explore):/.test(x)))cue('mechanism');
   else if(completed>lastCompleted)cue('reward');
  }
  lastNarrativeRevision=rev;lastCompleted=completed;lastSanctuaries=sanctuaries;lastEvidence=evidence;
 }
 const game=window.__game,battle=game?.scene==='battle'?game.battle:null;
 if(battle!==lastBattle){stopVoices();if(battle)cue('impact');lastBattle=battle;}
 if(lastSceneKey!==scene.id){if(lastSceneKey&&lastSceneKey!=='title'&&scene.id!=='opening')cancelCinematicSounds();lastSceneKey=scene.id;}
 const visual=document.querySelector('.rw-world:not([hidden])')?.dataset.ceremony||'';
 if(visual!==visualCeremony){
  visualCeremony=visual;
  if(regions.includes(visual)&&!seen.has(visual)&&prefs.enabled){performedVisual.delete(visual);ceremony={id:'song-'+visual,root,region:visual,started:false,visual:true};}
  else if(!visual&&ceremony?.visual&&!melodies.includes(ceremony.region))ceremony=null;
 }
 for(const r of melodies)if(!seen.has(r)){seen.add(r);if(regions.includes(r)&&window.__CAT_BOND_STARTED__&&ceremony?.id!=='song-'+r&&!performedVisual.has(r)&&prefs.enabled&&prefs.music>0)ceremony={id:'song-'+r,root,region:r,started:false};performedVisual.delete(r);}
 const finale=battle?.resonanceFinale;
 if(finale?.id==='finale:B-03'){
  const support=state?.resonance?.support||[];
  if(supportRoot!==finale){supportRoot=finale;supportSeen=new Set(support);}
  else for(const r of support)if(!supportSeen.has(r)){supportSeen.add(r);if(regions.includes(r))playResponse(r);}
 }else{if(supportRoot)stopVoices();supportRoot=null;supportSeen.clear();}
 if(ceremony&&(ceremony.root!==root||window.__game?.scene==='battle'||!window.__CAT_BOND_STARTED__||!prefs.enabled||!ceremony.visual&&scene.amb!==ceremony.region&&scene.id!=='atlas'))ceremony=null;
 const cinematic=document.querySelector('.cbcp-root:not([hidden])');
 const nextPause=cinematic?.dataset.paused==='true';
 if(nextPause!==paused){paused=nextPause;if(paused)cancelCinematicSounds();if(ctx&&unlocked){if(paused){++serial;pending=null;ctx.suspend().catch(()=>{});}else if(!hidden)ctx.resume().catch(()=>{});}}
 if(window.MorrowwishAudio?.setVolume&&lastFx!==prefs.fx){lastFx=prefs.fx;window.MorrowwishAudio.setVolume(prefs.fx);}
 desired=ceremony?.id||scene.id;
 if(ctx&&unlocked&&!hidden&&!paused&&!stopped&&prefs.enabled){const region=scene.amb;if(regions.includes(region)&&!seen.has(region)&&!cache.has('song-'+region)&&!pending&&active?.id===desired)getBuffer('song-'+region).catch(()=>{});}
 if(!ctx||!unlocked)return;
 mix();if(!hidden&&!paused){trimCache(desired);select(desired);ambience(scene.amb);if(now()>ambientTick){ambientTick=now()+8+Math.sin(now())*3;foley(scene.amb);}}
}
function start(){
 if(!ensure())return false;
 started=true;stopped=false;if(hidden||paused)return true;
 try{const p=ctx.resume();p.then(()=>{unlocked=ctx.state==='running';blocked=!unlocked;tick();}).catch(()=>{blocked=true;});}catch{blocked=true;}
 return true;
}
function skipCeremony(region){if(!regions.includes(region)||ceremony?.region!==region||ceremony.root!==root)return false;performedVisual.add(region);ceremony=null;const id="song-"+region;if(pending?.id===id){++serial;pending=null;}if(active?.id===id){const old=active;active=null;dispose(old,.3);}tick();return true;}
function setEnabled(on){prefs.enabled=!!on;save();if(!prefs.enabled){ceremony=null;stopVoices();clear();mix();}else{start();tick();}return prefs.enabled;}
function setVolume(v){prefs.music=clamp(v);save();mix();return prefs.music;}
function setEffectsVolume(v){prefs.fx=clamp(v);save();tick();return prefs.fx;}
function sync(){tick();}
function visibility(){hidden=document.hidden;if(hidden){++serial;pending=null;ctx?.suspend().catch(()=>{});}else if(started&&!paused)start();tick();}
function gesture(e){if(e.type==='keydown'&&['Tab','Shift','Control','Alt','Meta','Escape'].includes(e.key))return;if(!paused&&!hidden&&(!unlocked||ctx?.state!=='running'))start();}
document.addEventListener('pointerdown',gesture,{capture:true,passive:true});document.addEventListener('keydown',gesture,true);
document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',()=>{hidden=true;++serial;pending=null;ctx?.suspend().catch(()=>{});});window.addEventListener('pageshow',visibility);
window.addEventListener('cat-bond-resonance-changed',tick);window.addEventListener('cat-bond-active-save-changed',()=>{clear();root=null;ceremony=null;tick();});
setInterval(tick,250);
window.MorrowwishMusic=Object.freeze({start,stop:()=>{stopped=true;stopVoices();clear();},toggle:()=>setEnabled(!prefs.enabled),setEnabled,setVolume,setEffectsVolume,sync,cue,skipCeremony,cancelCinematicSounds,switchScene:tick,duckFor:(ms=2200)=>{duckUntil=Math.max(duckUntil,now()+Math.min(6,Math.max(.3,ms/1000)));mix();},status:()=>({game:'cat-bond',enabled:prefs.enabled,volume:prefs.music,effectsVolume:prefs.fx,scene:desired,track:active?.id||null,source:active?(recordedIds.has(active.id)?'recorded-mp3:':'original-score:')+active.id:null,playing:!!active&&ctx?.state==='running'&&prefs.enabled,blocked,unavailable,loop:!!active?.source.loop,currentTime:active?now()-active.started:0,duration:active?.buffer?.duration||0,audioState:ctx?.state||'not-created',cache:cache.size,decodedCacheBytes:[...cacheBytes.values()].reduce((n,b)=>n+b,0),activeMusicSources:musicSources.size,pending:pending?.id||null,ambient:ambId,ceremony:ceremony?.region||null,regionalResponses:[...supportSeen],responseVoices:voiceNodes.size})});
})();