// The two user-approved CC BY 4.0 recordings are self-hosted; no runtime external requests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir='public/cat-bond/assets/quality-audio', manifestPath=dir+'/premium-manifest.json',creditsPath=dir+'/music-credits.html';
const chosen=[
 {scene:'sky',id:'amberlight',title:'Amberlight',source:'https://www.scottbuckley.com.au/library/amberlight/',download:'https://www.scottbuckley.com.au/library/wp-content/uploads/2025/03/Amberlight.mp3',oldTitle:'Discovery',label:'云海 / Skyspine Isles and Farwind Isle',notes:'User-approved warm, nostalgic piano and orchestral score for cloud-sea exploration.'},
 {scene:'starfall',id:'a-kind-of-hope',title:'A Kind Of Hope',source:'https://www.scottbuckley.com.au/library/a-kind-of-hope/',download:'https://www.scottbuckley.com.au/library/wp-content/uploads/2022/10/AKindOfHope.mp3',oldTitle:'Golden Hour',label:'星坠原 / Starfall',notes:'User-approved bittersweet piano, strings and atmospheric synth for remembrance and hope.'}
];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const probe=p=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',p],{encoding:'utf8'}));
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
let credits=fs.readFileSync(creditsPath,'utf8');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'starbell-approved-music-'));
try{
 for(const t of chosen){
  const raw=path.join(temp,t.id+'-raw.mp3'),out=path.join(temp,t.id+'.mp3'),file='premium-'+t.id+'.mp3';
  execFileSync('curl',['--fail','--location','--silent','--show-error','--retry','2','--retry-max-time','40','--connect-timeout','10','--max-time','65',t.download,'-o',raw],{stdio:'inherit'});
  const original=fs.readFileSync(raw),before=probe(raw),duration=Number(before.format.duration);
  assert.ok(original.length>100000&&duration>40&&duration<480&&before.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='mp3'),'Invalid original '+t.title);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',raw,'-map','0:a:0','-af','loudnorm=I=-19:TP=-2:LRA=11','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','192k',out],{stdio:'inherit'});
  const bytes=fs.readFileSync(out),after=probe(out),seconds=Number(after.format.duration);
  assert.ok(bytes.length>100000&&Math.abs(seconds-duration)<1,'Audio conversion failed '+t.title);
  fs.writeFileSync(path.join(dir,file),bytes);
  for(const e of Object.values(manifest.tracks))e.scenes=(e.scenes||[]).filter(s=>s!==t.scene);
  manifest.scenes[t.scene]=t.id;
  manifest.tracks[t.id]={title:t.title,author:'Scott Buckley',license:'CC BY 4.0',source:t.source,download:t.download,notes:t.notes,scenes:[t.scene],sourceSha256:hash(original),edits:'Loudness normalization, 44.1 kHz stereo MP3; original tempo and duration retained; runtime loop smoothing.',file,seconds,bytes:bytes.length,sha256:hash(bytes),channels:2,sampleRate:44100};
  const article='<article id="'+t.id+'"><h2>'+t.title+'</h2><small>Scott Buckley · <a href="'+t.source+'">Original / license</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></small><small>'+t.label+'</small><p>'+t.notes+' Loudness normalized and converted for game use.</p><audio controls preload="none" src="'+file+'"></audio></article>';
  if(!credits.includes('id="'+t.id+'"')){const old=new RegExp('<article><h2>'+t.oldTitle+'</h2>[\\s\\S]*?</article>');assert.ok(old.test(credits),'Credits missing '+t.oldTitle);credits=credits.replace(old,article);}
  console.log('APPROVED REGION MUSIC VERIFIED',JSON.stringify({scene:t.scene,title:t.title,seconds,sha256:hash(bytes),sourceSha256:hash(original),source:t.source,bytes:bytes.length}));
 }
 assert.ok(Object.entries(manifest.scenes).every(([s,id])=>manifest.tracks[id]?.scenes.includes(s)));
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(creditsPath,credits);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
