// BRIGHT_ORCHESTRATION_V2 — lyrical woodwinds, luminous harp and lighter chamber strings.
/* Cat Bond: The Last Resonance — original score, written for Morrow Wish.
   No samples, game OSTs, or third-party musical works are used. */
(()=>{
'use strict';
const R=['harbor','forest','forge','sky','library','starfall'];
// Phrases are scale degrees and beats, not a fixed repeated arpeggio.
const motifs={
 star:[[0,1.5],[2,.5],[4,1],[3,1],[1,1],[2,1.5],[0,1.5]],
 harbor:[[4,1],[5,.5],[4,.5],[2,1],[1,1],[0,1.5],[2,.5],[1,1],[0,1]],
 forest:[[0,.5],[2,.5],[4,1.5],[6,.5],[5,1],[3,1],[4,1],[2,1],[0,1]],
 forge:[[0,1],[0,.5],[4,.5],[3,1],[2,1],[5,1.5],[4,.5],[2,1],[0,1]],
 sky:[[2,.5],[4,.5],[7,1.5],[6,.5],[4,1],[5,1],[3,.5],[2,.5],[1,1],[2,1]],
 library:[[0,1.5],[3,.5],[2,1],[6,1],[5,1.5],[2,.5],[1,1],[0,1]],
 starfall:[[0,2],[4,1],[2,1],[6,1.5],[5,.5],[3,1],[0,1]]
};
const P={
 title:[84,62,'major','star','piano','strings','harp',[0,4,5,3,0,2,1,4]],
 opening:[88,62,'major','star','flute','strings','harp',[0,4,5,3,0,2,1,4]],
 garden:[86,64,'major','star','piano','strings','harp',[0,4,5,3,1,4,0,4]],
 atlas:[86,62,'major','star','flute','strings','harp',[0,5,3,4,0,2,3,4]],
 harbor:[84,62,'major','harbor','flute','strings','harp',[0,3,6,4,0,5,3,4]],
 forest:[88,67,'major','forest','harp','strings','flute',[0,2,3,4,0,6,3,4]],
 forge:[102,62,'dorian','forge','piano','strings','harp',[0,0,5,6,0,3,1,4]],
 sky:[92,65,'major','sky','flute','strings','harp',[0,3,5,4,2,3,1,4]],
 library:[80,67,'major','library','piano','strings','bell',[0,2,5,4,0,6,1,4]],
 starfall:[78,62,'dorian','starfall','flute','strings','bell',[0,3,5,6,0,2,3,4]],
 battle:[114,62,'minor','star','strings','horn','drum',[0,5,6,4,0,3,5,4]],
 muling:[74,64,'dorian','star','piano','strings','harp',[0,5,3,6,0,1,5,4]],
 identity:[78,62,'major','star','bell','strings','piano',[0,5,2,4,0,3,6,4]],
 betrayal:[72,64,'minor','star','strings','piano','bell',[0,1,5,4,0,6,1,4]],
 finale1:[116,62,'minor','star','horn','strings','drum',[0,5,3,4,0,6,1,4]],
 finale2:[91,61,'minor','library','bell','strings','drum',[0,1,5,6,0,2,1,4]],
 finale3:[108,62,'major','star','horn','strings','harp',[0,5,3,4,0,2,3,4]],
 ending:[84,64,'major','star','piano','strings','flute',[0,5,3,4,2,3,1,4]],
 postgarden:[88,64,'major','star','harp','strings','flute',[0,4,5,3,1,4,0,4]]
};
for(const r of R){const [b,k,m,mot,lead,pad,acc,ch]=P[r];P['boss-'+r]=[Math.min(132,b+32),k,'minor',mot,'horn','strings','drum',ch];P['song-'+r]=[b,k,m,mot,lead,pad,acc,ch];}
const scales={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10]};
const degree=(k,m,d)=>k+12*Math.floor(d/7)+scales[m][((d%7)+7)%7];
const instruments={
 piano:{h:[1,.47,.22,.12,.055,.026],a:.012,r:.65,g:.10},
 harp:{h:[1,.32,.15,.09,.04],a:.007,r:.85,g:.085},
 strings:{h:[1,.44,.27,.17,.12,.07,.04],a:.19,r:.45,g:.053,v:4.8},
 flute:{h:[1,.16,.08,.03],a:.11,r:.24,g:.095,v:5.2},
 horn:{h:[1,.44,.27,.10,.045],a:.09,r:.31,g:.083,v:4.2},
 bell:{h:[1,.04,.48,.05,.12,.025],a:.004,r:1.1,g:.063},
 drum:{h:[1,.45,.18,.08],a:.008,r:.20,g:.075}
};
function arrange(id){
 const p=P[id]||P.title,[bpm,key,mode,motif,lead,pad,acc,chords]=p;
 const song=id.startsWith('song-'),climax=id==='finale3'||id==='ending'||id==='opening',battle=id.startsWith('boss-')||id.startsWith('finale')||id==='battle';
 const bars=song?8:climax?32:16,notes=[];
 const add=(t,d,m,i,v,pan=0)=>{if(t>=0&&t<bars*4&&d>0)notes.push({t,d:Math.min(d,bars*4-t),m,i,v,pan});};
 for(let bar=0;bar<bars;bar++){
  const t=bar*4,c=chords[bar%chords.length],part=Math.floor(bar/4),root=degree(key-(battle?24:12),mode,c);
  add(t,battle?3.7:2.6,root,pad,battle?.60:.38,-.22);add(t+2,battle?1.8:1.4,root+12,pad,.24,.18);
  for(let j=0;j<3;j++)add(t+.04*j,3.6,degree(key-(battle?12:0),mode,c+2*j),pad,.28+part*.018,(j-1)*.34);
  const arp=[0,2,4,7,4,2,5,4],rhythm=battle?8:6;
  for(let j=0;j<rhythm;j++){const dt=j*4/rhythm;add(t+dt,Math.min(.8,4/rhythm),degree(key-(battle?12:0),mode,c+arp[(j+bar)%arp.length]),acc==='drum'?'piano':acc,.32+(j%3===0?.15:0),j%2?.39:-.39);}
  if(battle){for(const beat of [0,1.5,2.5])add(t+beat,.28,beat===0?36:43,'drum',beat===0?.95:.48,-.1);}
  if(bar%2===0){
   const selected=climax?(bar<4||bar>=28?'star':R[Math.floor(bar/4)-1]):motif;
   const phrase=motifs[selected];let at=t;
   for(let j=0;j<phrase.length;j++){
    const [d,len]=phrase[j],variation=(bar%8===6&&j>=phrase.length-3)?-1:0;
    const pitch=degree(key,mode,d+variation+(part%3===2&&j===0?7:0));
    add(at,len*.93,pitch,lead,.81+(j%3===0?.15:0),-.12);
    if(part>0&&j%2===0)add(at+.06,len*.81,degree(key,mode,d-2),pad,.30,.35);
    if(climax&&part>=3)add(at+.04,len*.85,pitch+12,'bell',.28,.40);
    if((id==='finale3'||id==='ending')&&part>=5&&j%2===0){const returnNote=motifs.star[j%motifs.star.length][0];add(at+.12,len*.8,degree(key,mode,returnNote-7),'flute',.34,-.37);}
    at+=len;
   }
  }
  if((bar+1)%4===0){add(t+2,1.8,degree(key,mode,c+4),'bell',.45,.33);}
 }
 return {id,bpm,bars,beats:bars*4,notes};
}
function instrument(ctx,name,midi,when,duration,velocity,pan,dest,waves){
 const cfg=instruments[name],f=440*2**((midi-69)/12);
 const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),panner=ctx.createStereoPanner();
 if(!waves[name]){const h=cfg.h;waves[name]=ctx.createPeriodicWave(new Float32Array(h.length+1),new Float32Array([0,...h]));}
 osc.setPeriodicWave(waves[name]);osc.frequency.setValueAtTime(f,when);
 if(name==='drum')osc.frequency.exponentialRampToValueAtTime(f*.54,when+.14);
 filter.type='lowpass';filter.frequency.value=Math.min(6800,Math.max(800,f*(name==='strings'?6:10)));
 panner.pan.value=pan;
 const end=when+duration,release=Math.min(cfg.r,1.1),attack=Math.min(cfg.a,duration*.4),peak=cfg.g*velocity;
 gain.gain.setValueAtTime(.00001,when);gain.gain.linearRampToValueAtTime(peak,when+attack);
 gain.gain.exponentialRampToValueAtTime(Math.max(.00002,peak*(name==='piano'||name==='harp'||name==='bell'?.16:.73)),end);
 gain.gain.exponentialRampToValueAtTime(.00001,end+release);
 osc.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(dest);
 if(cfg.v){const vib=ctx.createOscillator(),depth=ctx.createGain();vib.frequency.value=cfg.v;depth.gain.value=name==='strings'?5:3;vib.connect(depth);depth.connect(osc.detune);vib.start(when);vib.stop(end+release+.02);}
 osc.start(when);osc.stop(end+release+.02);
}
async function render(id){
 const s=arrange(id),beat=60/s.bpm,sr=24000,pre=2.2,seconds=s.beats*beat,len=Math.round(seconds*sr),offset=Math.ceil(pre*sr),total=(offset+len+Math.ceil(sr*1.3));
 const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)throw Error('Offline audio unavailable');
 const ctx=new O(2,total,sr),dry=ctx.createGain(),wet=ctx.createGain(),room=ctx.createConvolver(),master=ctx.createGain(),waves={};
 dry.gain.value=.92;wet.gain.value=.16;master.gain.value=.68;
 let seed=391;const ir=ctx.createBuffer(2,Math.round(sr*1.15),sr);
 for(let c=0;c<2;c++){const a=ir.getChannelData(c);for(let n=0;n<a.length;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[n]=(seed/4294967296*2-1)*Math.pow(1-n/a.length,3)*.42;}}
 room.buffer=ir;dry.connect(master);dry.connect(room);room.connect(wet);wet.connect(master);master.connect(ctx.destination);
 for(const n of s.notes){
  const at=offset/sr+n.t*beat;instrument(ctx,n.i,n.m,at,n.d*beat,n.v,n.pan,dry,waves);
  // The last phrase's release is carried into the first sample of the loop.
  const previous=at-seconds;if(previous>=0&&previous<offset/sr)instrument(ctx,n.i,n.m,previous,n.d*beat,n.v,n.pan,dry,waves);
 }
 const rendered=await ctx.startRendering(),out=ctx.createBuffer(2,len,sr);
 let peak=0;for(let c=0;c<2;c++){const data=out.getChannelData(c);data.set(rendered.getChannelData(c).subarray(offset,offset+len));for(const x of data)peak=Math.max(peak,Math.abs(x));}
 const norm=peak>.82?.82/peak:1;for(let c=0;c<2;c++){const data=out.getChannelData(c);for(let i=0;i<len;i++)data[i]*=norm;}
 return out;
}
function response(region){
 const p=P[region];if(!p)return null;
 const [bpm,k,m,motif]=p,phrase=motifs[motif],notes=[];let t=0;
 for(const [d,len] of phrase){notes.push({m:degree(k,m,d),t:t*60/bpm,d:len*60/bpm});t+=len;}
 return {notes,seconds:t*60/bpm};
}
window.CatBondOriginalScore=Object.freeze({regions:R,ids:Object.keys(P),arrange,render,response});
})();