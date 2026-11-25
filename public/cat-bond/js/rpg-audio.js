/* Single Cat Bond RPG music and ambience director. No legacy/external BGM. */
(()=>{
'use strict';
const score=window.CatBondOriginalScore;
const key='cat-bond-rpg-audio-v1',clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
let prefs={enabled:true,music:.65,fx:.8};
try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old)prefs={enabled:old.enabled!==false,music:clamp(old.music),fx:clamp(old.fx)};else prefs.enabled=localStorage.getItem('morrowwish-music-enabled')!=='0';}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}}
let ctx,bus,ambBus,active=null,pending=null,serial=0,desired='title',unlocked=false,hidden=document.hidden,paused=false,blocked=false,unavailable=false,duckUntil=0,amb=null,ambId='',ceremony=null,root=null,seen=new Set(),lastFx,ambientTick=0,cache=new Map(),started=false,renderQueue=Promise.resolve(),stopped=false;
const regions=score.regions;
const now=()=>ctx?.currentTime||0;
function ensure(){
 if(ctx)return true;
 try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return false;ctx=new A();bus=ctx.createGain();ambBus=ctx.createGain();bus.gain.value=0;ambBus.gain.value=0;bus.connect(ctx.destination);ambBus.connect(ctx.destination);return true;}catch{return false;}
}
function target(node,value,sec=.12){if(!node||!ctx)return;const t=now();node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(value,t,sec);}
function mix(){
 const cinematic=document.querySelector('.cbcp-root:not([hidden])'),talk=document.querySelector('.res-host.is-visible,.res-npc-dialogue');
 target(bus,prefs.enabled&&!hidden&&!paused?prefs.music*(now()<duckUntil?.28:cinematic?.65:talk?.48:.82):0);
 target(ambBus,!hidden&&!paused&&window.MorrowwishAudio?.isEnabled?.()!==false?prefs.fx*.18:0);
}
async function getBuffer(id){
 if(cache.has(id)){const v=cache.get(id);cache.delete(id);cache.set(id,v);return v;}
 const task=renderQueue.then(()=>score.render(id));renderQueue=task.catch(()=>{});cache.set(id,task);
 try{const b=await task;while(cache.size>3){const first=cache.keys().next().value;if(first===id)break;cache.delete(first);}return b;}catch(e){cache.delete(id);throw e;}
}
function dispose(s,fade=.7){
 if(!s||s.stopping)return;s.stopping=true;const t=now();try{s.gain.gain.cancelScheduledValues(t);s.gain.gain.setTargetAtTime(.00001,t,fade/4);s.source.stop(t+fade);}catch{}
}
function clear(){++serial;pending=null;dispose(active,.12);active=null;}
function select(id){
 desired=id;
 if(!ctx||!unlocked||!prefs.enabled||hidden||paused||stopped)return;
 if(active?.id===id&&!active.stopping){if(pending&&pending.id!==id){++serial;pending=null;}return;}
 if(pending?.id===id)return;
 const token=++serial;pending={id,token};
 getBuffer(id).then(buffer=>{
  if(token!==serial||desired!==id||!prefs.enabled||hidden||paused)return;
  pending=null;const old=active,source=ctx.createBufferSource(),gain=ctx.createGain(),t=now();
  source.buffer=buffer;source.loop=!id.startsWith('song-');gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(1,t+.72);source.connect(gain);gain.connect(bus);
  const next={id,source,gain,buffer,started:t,stopping:false};active=next;
  source.onended=()=>{source.disconnect();gain.disconnect();if(active===next){active=null;if(ceremony?.id===id)ceremony=null;tick();}};
  source.start();dispose(old,.8);blocked=false;unavailable=false;
  if(ceremony?.id===id)ceremony.started=true;
 }).catch(()=>{if(token===serial){pending=null;unavailable=true;}});
}
function noise(region){
 const sr=ctx.sampleRate,len=Math.round(sr*5),b=ctx.createBuffer(1,len,sr),a=b.getChannelData(0);let x=0,y=0,seed=1997;
 const profile={garden:[.025,.10,2],harbor:[.025,.24,1],forest:[.08,.12,3],forge:[.045,.16,2],sky:[.022,.22,1],library:[.02,.055,1],starfall:[.016,.10,2]}[region];
 if(!profile)return null;const [speed,level,pulses]=profile;
 for(let i=0;i<len;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296*2-1;x+=(n-x)*speed;y+=(x-y)*.12;const phase=i/len;const pulse=.60+.40*Math.sin(2*Math.PI*pulses*phase)**2;a[i]=(x*.6+y*.4)*level*pulse;}
 // Close the join, rather than allowing a discontinuous noise sample.
 for(let i=0;i<Math.min(600,len/2);i++){const q=i/600;a[i]*=q;a[len-1-i]*=q;}
 return b;
}
function ambience(id){
 if(!ctx||!unlocked||id===ambId)return;
 if(amb)dispose(amb,.6);amb=null;ambId=id;
 const b=noise(id);if(!b)return;
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=b;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(ambBus);gain.gain.setTargetAtTime(1,now(),.18);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();amb={source,gain};
}
function foley(id){
 if(!ctx||hidden||paused||window.MorrowwishAudio?.isEnabled?.()===false||prefs.fx===0)return;
 const t=now(),osc=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();
 const shapes={garden:[980,1450,.22],forest:[1370,1880,.25],harbor:[175,110,.43],forge:[260,115,.36],sky:[340,180,.55],library:[810,600,.46],starfall:[415,620,.65]};
 const s=shapes[id];if(!s)return;osc.type='sine';osc.frequency.setValueAtTime(s[0],t);osc.frequency.exponentialRampToValueAtTime(s[1],t+s[2]*.75);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.035,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+s[2]);p.pan.value=Math.sin(t)*.7;osc.connect(g);g.connect(p);p.connect(ambBus);osc.onended=()=>{osc.disconnect();g.disconnect();p.disconnect();};osc.start();osc.stop(t+s[2]+.03);
}
function read(){
 const game=window.__game,state=window.State?.S,story=state?.resonance,id=story?.scene||'',region=window.WorldMap?.mode==='region'?window.WorldMap.currentRegion:null;
 const cinematic=document.querySelector('.cbcp-root:not([hidden])'),dialogue=document.querySelector('.res-host.is-visible,.res-npc-dialogue');
 const finale=game?.battle?.resonanceFinale?.id;
 if(finale)return {id:({'finale:B-01':'finale1','finale:B-02':'finale2','finale:B-03':'finale3'})[finale]||'battle',amb:''};
 if(game?.scene==='battle'){
  const b=game.battle,reg=game._battleTheme?.region||region||state?.resonanceExploration?.location;
  return {id:(b?.storyEncounter||b?.enemies?.some(e=>e.isBoss))&&regions.includes(reg)?'boss-'+reg:'battle',amb:''};
 }
 if(cinematic){
  if(id.startsWith('prologue:'))return{id:'opening',amb:''};
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
 if(state!==root){root=state;seen=new Set(melodies);ceremony=null;}
 else for(const r of melodies)if(!seen.has(r)){seen.add(r);if(regions.includes(r)&&window.__CAT_BOND_STARTED__)ceremony={id:'song-'+r,root,started:false};}
 if(ceremony&&(ceremony.root!==root||window.__game?.scene==='battle'||!window.__CAT_BOND_STARTED__||!prefs.enabled))ceremony=null;
 const cinematic=document.querySelector('.cbcp-root:not([hidden])');
 const nextPause=cinematic?.dataset.paused==='true';
 if(nextPause!==paused){paused=nextPause;if(ctx&&unlocked){if(paused){++serial;pending=null;ctx.suspend().catch(()=>{});}else if(!hidden)ctx.resume().catch(()=>{});}}
 if(window.MorrowwishAudio?.setVolume&&lastFx!==prefs.fx){lastFx=prefs.fx;window.MorrowwishAudio.setVolume(prefs.fx);}
 desired=ceremony?.id||scene.id;
 if(!ctx||!unlocked)return;
 mix();if(!hidden&&!paused){select(desired);ambience(scene.amb);if(now()>ambientTick){ambientTick=now()+8+Math.sin(now())*3;foley(scene.amb);}}
}
function start(){
 if(!ensure())return false;
 started=true;stopped=false;if(hidden||paused)return true;
 try{const p=ctx.resume();p.then(()=>{unlocked=ctx.state==='running';blocked=!unlocked;tick();}).catch(()=>{blocked=true;});}catch{blocked=true;}
 return true;
}
function setEnabled(on){prefs.enabled=!!on;save();if(!prefs.enabled){ceremony=null;clear();mix();}else{start();tick();}return prefs.enabled;}
function setVolume(v){prefs.music=clamp(v);save();mix();return prefs.music;}
function setEffectsVolume(v){prefs.fx=clamp(v);save();tick();return prefs.fx;}
function sync(){tick();}
function visibility(){hidden=document.hidden;if(hidden){++serial;pending=null;ctx?.suspend().catch(()=>{});}else if(started&&!paused)start();tick();}
function gesture(e){if(e.type==='keydown'&&['Tab','Shift','Control','Alt','Meta','Escape'].includes(e.key))return;if(!paused&&!hidden&&(!unlocked||ctx?.state!=='running'))start();}
document.addEventListener('pointerdown',gesture,{capture:true,passive:true});document.addEventListener('keydown',gesture,true);
document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',()=>{hidden=true;++serial;pending=null;ctx?.suspend().catch(()=>{});});window.addEventListener('pageshow',visibility);
window.addEventListener('cat-bond-resonance-changed',tick);window.addEventListener('cat-bond-active-save-changed',()=>{root=null;ceremony=null;tick();});
setInterval(tick,250);
window.MorrowwishMusic=Object.freeze({start,stop:()=>{stopped=true;clear();},toggle:()=>setEnabled(!prefs.enabled),setEnabled,setVolume,setEffectsVolume,sync,switchScene:tick,duckFor:(ms=2200)=>{duckUntil=Math.max(duckUntil,now()+Math.min(6,Math.max(.3,ms/1000)));mix();},status:()=>({game:'cat-bond',enabled:prefs.enabled,volume:prefs.music,effectsVolume:prefs.fx,scene:desired,track:active?.id||null,source:active?'original-score:'+active.id:null,playing:!!active&&ctx?.state==='running'&&prefs.enabled,blocked,unavailable,loop:!!active?.source.loop,currentTime:active?now()-active.started:0,audioState:ctx?.state||'not-created',cache:cache.size,pending:pending?.id||null,ambient:ambId})});
})();