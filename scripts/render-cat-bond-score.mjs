// Render the ORIGINAL Cat Bond score using licensed FluidR3 orchestral samples.
// No copyrighted OST input; the only score source is rpg-audio-score.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='public/cat-bond/assets/audio';
const source=fs.readFileSync('public/cat-bond/js/rpg-audio-score.js','utf8'),window={};
vm.runInNewContext(source,{window});
const score=window.CatBondOriginalScore, sf=process.env.CAT_BOND_SOUNDFONT||'/usr/share/sounds/sf2/FluidR3_GM.sf2';
const copyright='/usr/share/doc/fluid-soundfont-gm/copyright';
if(!fs.existsSync(sf)||!fs.existsSync(copyright))throw Error('Licensed FluidR3 GM bank or package copyright missing');
fs.mkdirSync(dir,{recursive:true});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cat-bond-score-'));
const ppq=480;
const instruments={piano:[0,0,65],harp:[1,46,43],strings:[2,48,83],flute:[3,73,55],horn:[4,60,70],bell:[5,14,90],cello:[6,42,48],drum:[9,0,64]};
function vlq(n){let arr=[n&127];for(n>>=7;n;n>>=7)arr.unshift((n&127)|128);return arr;}
function chunk(tag,bytes){const size=Buffer.alloc(4);size.writeUInt32BE(bytes.length);return Buffer.concat([Buffer.from(tag),size,Buffer.from(bytes)]);}
function midi(arrangement,loops){
 const e=[];const add=(t,...bytes)=>e.push({t:Math.round(t),bytes});const tempo=Math.round(60000000/arrangement.bpm);
 add(0,0xff,0x51,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255);
 for(const [ch,prog,pan] of Object.values(instruments)){if(ch!==9)add(0,0xc0|ch,prog);add(0,0xb0|ch,7,ch===2?88:100);add(0,0xb0|ch,10,pan);add(0,0xb0|ch,91,45);}
 const groups=new Map();
 for(let repeat=0;repeat<loops;repeat++)for(const n of arrangement.notes){
  const inst=n.i==='strings'&&n.m<48?'cello':n.i,ch=instruments[inst][0],pitch=Math.max(0,Math.min(127,Math.round(n.m)));
  const start=Math.round((n.t+repeat*arrangement.beats)*ppq),end=Math.max(start+1,Math.round((n.t+repeat*arrangement.beats+n.d)*ppq));
  const vel=Math.round(Math.max(24,Math.min(112,n.v*95+12))),key=ch+':'+pitch;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push({start,end,ch,pitch,vel});
 }
 // Prevent an overlapping note-off from prematurely silencing a sustained instrument.
 for(const notes of groups.values()){notes.sort((a,b)=>a.start-b.start||a.end-b.end);const combined=[];for(const n of notes){const prev=combined.at(-1);if(prev&&n.start<prev.end){prev.end=Math.max(prev.end,n.end);prev.vel=Math.max(prev.vel,n.vel);}else combined.push({...n});}for(const n of combined){add(n.start,0x90|n.ch,n.pitch,n.vel);add(n.end,0x80|n.ch,n.pitch,0);}}
 add(arrangement.beats*ppq*loops,0xff,0x2f,0);e.sort((a,b)=>a.t-b.t||((a.bytes[0]&0xf0)===0x80?-1:(b.bytes[0]&0xf0)===0x80?1:0));
 let last=0;const bytes=[];for(const x of e){bytes.push(...vlq(x.t-last),...x.bytes);last=x.t;}
 const header=Buffer.from([0,0,0,1,ppq>>8,ppq&255]);return Buffer.concat([chunk('MThd',header),chunk('MTrk',bytes)]);
}
const manifest={schema:1,author:'Morrow Wish original score',instrumentBank:'FluidR3 GM — Frank Wen (MIT)',bankLicense:'FLUIDR3-LICENSE.txt',scoreSha256:crypto.createHash('sha256').update(source).digest('hex'),format:'mp3',tracks:{}};
try{
 for(const id of score.ids){
  const a=score.arrange(id),seconds=a.beats*60/a.bpm,once=id.startsWith('song-'),mid=path.join(tmp,id+'.mid'),wav=path.join(tmp,id+'.wav'),file=id+'.mp3',dest=path.join(dir,file);
  fs.writeFileSync(mid,midi(a,once?1:2));
  execFileSync('fluidsynth',['-ni','-F',wav,'-r','44100','-g','0.65',sf,mid],{stdio:'ignore'});
  const start=once?0:seconds,filter='atrim=start='+start+':duration='+seconds+',asetpts=PTS-STARTPTS,volume=0.9,alimiter=limit=0.82'+(once?',afade=t=out:st='+Math.max(0,seconds-1)+':d=1':'');
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',wav,'-af',filter,'-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','96k',dest],{stdio:'inherit'});
  const bytes=fs.statSync(dest).size,actual=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',dest],{encoding:'utf8'}));
  if(bytes<10000||!Number.isFinite(actual)||Math.abs(actual-seconds)>.20)throw Error('Invalid rendered asset '+id+' '+actual+' expected '+seconds);
  manifest.tracks[id]={file,seconds,bytes,sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')};
  fs.unlinkSync(wav);fs.unlinkSync(mid);console.log(id,seconds.toFixed(2)+'s',bytes+' bytes');
 }
 fs.copyFileSync(copyright,path.join(dir,'FLUIDR3-LICENSE.txt'));
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Total compressed score bytes:',Object.values(manifest.tracks).reduce((n,t)=>n+t.bytes,0));
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
