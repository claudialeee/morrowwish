// Caption cleanup QA: latest native-video pixels after editorial text-overlap fix.
// V3 revision 2: refreshed first/last frame inspection after removal of cluttered menus.
// Export only seven small review frames as base64 TEXT. This allows a human
// editor to inspect actual rendered pixels, not merely declare ffprobe PASS.
// Never used as promotional gameplay or published social content.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const slugs=['pawsibly-innocent','cat-bond','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
fs.mkdirSync('promotion/video-qa-v3',{recursive:true});
for(const slug of slugs){
 const dir='public/promo/'+slug,src=dir+'/hook-v3-20261121.mp4';
 if(!fs.existsSync(src))throw Error('Missing verified real game video '+src);
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',src],{encoding:'utf8'}).trim());
 if(!(duration>4))throw Error('Bad video duration '+src);
 for(const [i,position] of [0.75,Math.max(1,duration*0.47),Math.max(1,duration-1)].entries()){
   const frame=dir+'/hook-v3-review-'+(i+1)+'.jpg';
   if(!fs.existsSync(frame)){
     execFileSync('ffmpeg',['-nostdin','-y','-v','error','-ss',position.toFixed(3),'-i',src,'-frames:v','1','-q:v','3',frame],{timeout:30000,stdio:'inherit'});
   }
   if(!fs.existsSync(frame)||fs.statSync(frame).size<11000)throw Error('Missing or blank actual video frame '+frame);
 }

 for(const n of [1,3]){
  const src='public/promo/'+slug+'/hook-v3-review-'+n+'.jpg';
  if(!fs.existsSync(src))throw Error('Real video review frame missing: '+src);
  const bytes=fs.readFileSync(src);
  if(bytes.length<11000||bytes[0]!==0xff||bytes[1]!==0xd8)throw Error('Invalid JPEG '+src);
  const dest='promotion/video-qa-v3/'+slug+'-'+n+'.b64';
  fs.writeFileSync(dest,bytes.toString('base64')+'\n');
  console.log('Exported '+slug+' frame '+n+' '+bytes.length+' bytes');
 }
}
