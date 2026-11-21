// Export only seven small review frames as base64 TEXT. This allows a human
// editor to inspect actual rendered pixels, not merely declare ffprobe PASS.
// Never used as promotional gameplay or published social content.
import fs from 'node:fs';import path from 'node:path';
const slugs=['pawsibly-innocent','cat-bond','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
fs.mkdirSync('promotion/video-qa-v3',{recursive:true});
for(const slug of slugs){
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
