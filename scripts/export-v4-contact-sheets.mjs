// Editor visual QA: contact sheets from ACTUAL rendered V4 video frames.
// Never counts exports as a social publication or approval.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const slugs=['pawsibly-innocent','cat-bond','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
fs.mkdirSync('promotion/video-qa-v4',{recursive:true});
for(const slug of slugs){
 const dir='public/promo/'+slug,src=dir+'/trailer-v4-20261121.mp4';
 if(!fs.existsSync(src))throw Error('V4 preview missing '+src);
 const inputs=[1,2,3].map(n=>dir+'/v4-review-'+n+'.jpg');
 for(const f of inputs)if(!fs.existsSync(f)||fs.statSync(f).size<12000)throw Error('Empty visual checkpoint '+f);
 const sheet=path.join('promotion/video-qa-v4',slug+'-sheet.jpg');
 const command=['-nostdin','-y','-v','error'];
 for(const file of inputs)command.push('-i',file);
 command.push('-filter_complex','[0:v]scale=360:640:flags=lanczos[v0];[1:v]scale=360:640:flags=lanczos[v1];[2:v]scale=360:640:flags=lanczos[v2];[v0][v1][v2]hstack=inputs=3[v]',
  '-map','[v]','-frames:v','1','-q:v','4',sheet);
 execFileSync('ffmpeg',command,{timeout:40000,stdio:'inherit'});
 const bytes=fs.readFileSync(sheet);
 if(bytes.length<22000||bytes[0]!==0xff||bytes[1]!==0xd8)throw Error('Invalid visual contact sheet '+sheet);
 fs.writeFileSync(path.join('promotion/video-qa-v4',slug+'-sheet.b64'),bytes.toString('base64')+'\n');
 console.log('EXPORT AUTHENTIC TRAILER IMAGE FOR REVIEW '+slug+' / '+bytes.length+' bytes');
}
