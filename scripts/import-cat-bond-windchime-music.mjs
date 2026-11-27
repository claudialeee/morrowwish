// Prepare the user-selected Windchime Town recording at build time.
// No runtime external requests; fail the build if the official recording cannot be verified.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir='public/cat-bond/assets/quality-audio';
const manifestPath=path.join(dir,'premium-manifest.json');
const creditsPath=path.join(dir,'music-credits.html');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const isrc='USUAN2300003', id='morning', file='premium-morning.mp3';
const source='https://incompetech.com/music/royalty-free/index.html?isrc='+isrc;
const base='https://incompetech.com/music/royalty-free/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'windchime-morning-'));
const get=(url,dest)=>execFileSync('curl',['--fail','--location','--silent','--show-error','--retry','2','--retry-max-time','40','--connect-timeout','10','--max-time','50',url,'-o',dest],{stdio:'inherit'});
try{
 const catalog=path.join(temp,'catalog.json'),raw=path.join(temp,'original.mp3'),output=path.join(temp,file);
 get(base+'pieces.json',catalog);
 const data=JSON.parse(fs.readFileSync(catalog,'utf8'));
 function find(o){if(!o||typeof o!=='object')return null;if(o.isrc===isrc)return o;for(const v of Object.values(o)){const t=find(v);if(t)return t;}return null;}
 const track=find(data);
 assert.ok(track&&track.title==='Morning'&&typeof track.filename==='string','Official catalog must identify Morning by ISRC');
 assert.ok(!/[\\/]/.test(track.filename)&&/\.mp3$/i.test(track.filename),'Unsafe or unexpected music filename');
 get(base+'mp3-royaltyfree/'+encodeURIComponent(track.filename),raw);
 const original=fs.readFileSync(raw);
 assert.ok(original.length>100000,'Truncated recording');
 const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',f],{encoding:'utf8'}));
 const before=probe(raw),duration=Number(before.format.duration);
 assert.ok(duration>150&&duration<157&&before.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='mp3'),'Unexpected Morning recording duration or codec');
 // Gentle volume consistent with the rest of the recorded score; retain the original tempo.
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',raw,'-map','0:a:0','-af','loudnorm=I=-19:TP=-2:LRA=11','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','192k',output],{stdio:'inherit'});
 const bytes=fs.readFileSync(output),after=probe(output),seconds=Number(after.format.duration);
 assert.ok(Math.abs(seconds-duration)<1&&seconds>150&&bytes.length>100000,'Converted recording is invalid');
 fs.writeFileSync(path.join(dir,file),bytes);
 for(const t of Object.values(manifest.tracks))t.scenes=(t.scenes||[]).filter(s=>s!=='harbor');
 manifest.scenes.harbor=id;
 manifest.tracks[id]={title:'Morning',author:'Kevin MacLeod (incompetech.com)',license:'CC BY 4.0',source,notes:'User-selected Windchime Town exploration: 60 BPM, classical guitar, harp and flutes.',scenes:['harbor'],sourceSha256:hash(original),edits:'Loudness normalization, 44.1 kHz stereo MP3; loop smoothing in game audio director; original tempo preserved.',file,seconds,bytes:bytes.length,sha256:hash(bytes),channels:2,sampleRate:44100};
 assert.ok(Object.entries(manifest.scenes).every(([scene,track])=>manifest.tracks[track]?.scenes.includes(scene)),'Inconsistent soundtrack mapping');
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 const credits=fs.readFileSync(creditsPath,'utf8');
 const article='<article id="windchime-morning"><h2>Morning</h2><small>Kevin MacLeod (incompetech.com) · <a href="'+source+'">Original / license</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></small><small>Windchime Town / 风铃镇</small><p>60 BPM. Classical guitar, harp and flutes. Loudness normalized and converted for game use; original tempo retained.</p><audio controls preload="none" src="'+file+'"></audio></article>';
 const old=/<article><h2>Quirky Lane<\/h2>[\s\S]*?<\/article>/;
 assert.ok(credits.includes('id="windchime-morning"')||old.test(credits),'Missing expected music credits entry');
 if(!credits.includes('id="windchime-morning"'))fs.writeFileSync(creditsPath,credits.replace(old,article));
 console.log('WINDCHIME MORNING VERIFIED',JSON.stringify({isrc,seconds,sha256:hash(bytes),bytes:bytes.length,source}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
