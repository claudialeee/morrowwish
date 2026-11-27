import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../public/cat-bond/js/rpg-audio.js',import.meta.url),'utf8');
let visual='',region='harbor';
const sources=[],requests=[],gainEvents=[],regions=['harbor','forest','forge','sky','library','starfall'];
const p={value:0,setValueAtTime(v,t){gainEvents.push(['set',v,t]);},setTargetAtTime(){},linearRampToValueAtTime(v,t){gainEvents.push(['ramp',v,t]);},exponentialRampToValueAtTime(){},cancelScheduledValues(){}};
const node=()=>({gain:{...p},frequency:{...p},pan:{...p},connect(){},disconnect(){},start(){},stop(){if(this.ended)return;this.ended=true;queueMicrotask(()=>this.onended?.());}});
class Context{
 currentTime=0;state='suspended';sampleRate=24000;destination={};
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
 createGain(){return node();}createStereoPanner(){return node();}createOscillator(){return node();}createBufferSource(){const n=node();sources.push(n);return n;}
 createBuffer(c,l,s){const channels=Array.from({length:c},()=>new Float32Array(l));return {numberOfChannels:c,length:l,duration:l/s,sampleRate:s,getChannelData:i=>channels[i]};}
}
const state={resonance:{scene:'harbor:H-05',melodies:[],revision:0,evidence:{},completed:[],sanctuaries:[]}};
const document={hidden:false,currentScript:{src:'https://test.example/cat-bond/js/rpg-audio.js'},querySelector(q){return q.includes('.rw-world')?{dataset:{ceremony:visual}}:null;},addEventListener(){}};
const window={CatBondOriginalScore:{regions,render:async id=>{requests.push(id);return {length:24000,numberOfChannels:2,duration:1};}},State:{S:state},WorldMap:{mode:'region',get currentRegion(){return region;}},__game:{scene:'map'},__CAT_BOND_STARTED__:true,AudioContext:Context,addEventListener(){},MorrowwishAudio:{isEnabled:()=>true,setVolume(){}}};
vm.runInNewContext(code,{window,document,URL,localStorage:{getItem(){return null;},setItem(){}},fetch:async()=>({ok:false}),setInterval(){},Math,Date});
const music=window.MorrowwishMusic,settle=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
music.start();await settle();assert.equal(music.status().track,'harbor');
visual='harbor';music.sync();await settle();assert.equal(music.status().track,'song-harbor');
const song=sources.find(s=>s.buffer?.duration===1&&!s.loop&&!s.ended);assert.ok(song);
song.onended();await settle();
visual='';state.resonance.melodies.push('harbor');state.resonance.revision++;music.sync();await settle();
assert.equal(music.status().track,'harbor','completed visual song must not replay on commit');
assert.equal(requests.filter(x=>x==='song-harbor').length,1);
music.setEnabled(false);await settle();assert.equal(music.status().playing,false);
music.setEnabled(true);await settle();assert.equal(music.status().track,'harbor');
for(const next of ['forest','forge','sky','library','starfall']){region=next;music.sync();await settle();}
assert.equal(music.status().track,'starfall');assert.ok(music.status().activeMusicSources<=2);
// A later-region performance must play, and an explicit skip must not cause replay after the canonical commit.
visual='starfall';music.sync();await settle();assert.equal(music.status().track,'song-starfall');
assert.equal(music.skipCeremony('forest'),false,'cannot skip another region');
assert.equal(music.skipCeremony('starfall'),true);await settle();
visual='';state.resonance.melodies.push('starfall');state.resonance.revision++;music.sync();await settle();
assert.equal(music.status().track,'starfall');assert.equal(requests.filter(x=>x==='song-starfall').length,1,'no replay after explicit skip');
// Regression: title never uses the rejected fallback; every re-entry has a quick, gentle gain envelope.
window.__CAT_BOND_STARTED__=false;window.__game.scene='yard';gainEvents.length=0;music.sync();await settle();
assert.equal(music.status().track,'title');assert.ok(gainEvents.some(([k,v,t])=>k==='ramp'&&v===.52&&t===.5));assert.ok(!gainEvents.some(([k,v])=>k==='ramp'&&v===1));assert.ok(!requests.includes('title'));
music.setEnabled(false);await settle();gainEvents.length=0;music.setEnabled(true);await settle();assert.equal(music.status().track,'title');assert.ok(gainEvents.some(([k,v,t])=>k==='ramp'&&v===.52&&t===.5));
console.log('Audio lifecycle and gentle title onset regression PASS');

// Initial title starts automatically only if permitted; otherwise the preloaded
// buffer is reused on the first trusted gesture. Explicit mute is respected.
for(const mode of ['allowed','blocked','muted']){
 let permitted=mode==='allowed',decodeCount=0,resumes=0;const listeners=new Map();
 class InitialContext extends Context{resume(){resumes++;if(!permitted)return new Promise(()=>{});return super.resume();}}
 const doc={...document,addEventListener(type,fn){listeners.set(type,fn);}};
 const win={...window,__CAT_BOND_STARTED__:false,AudioContext:InitialContext,CatBondOriginalScore:{regions,render:async()=>{decodeCount++;return {length:24000,numberOfChannels:2,duration:1};}}};
 vm.runInNewContext(code,{window:win,document:doc,URL,localStorage:{getItem(k){return mode==='muted'&&k==='cat-bond-rpg-audio-v1'?JSON.stringify({enabled:false}):null;},setItem(){}},fetch:async()=>({ok:false}),setInterval(){},Math,Date});
 const m=win.MorrowwishMusic;await settle();
 if(mode==='muted'){assert.equal(resumes,0);assert.equal(decodeCount,0);listeners.get('click')({type:'click'});await settle();assert.equal(m.status().playing,false);continue;}
 assert.equal(decodeCount,1,'title predecoded before interaction');assert.ok(resumes>=1,'attempt autoplay');
 if(mode==='blocked'){assert.equal(m.status().playing,false);assert.equal(m.status().blocked,true);permitted=true;listeners.get('pointerup')({type:'pointerup'});await settle();}
 assert.equal(m.status().track,'title');assert.equal(m.status().playing,true);assert.equal(decodeCount,1,'reuse preloaded title');
}
console.log('Title autoplay, blocked first-touch recovery and persisted mute PASS');
