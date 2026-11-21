// Shared track lookup for future human-reviewed short-video recuts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const catalog=JSON.parse(fs.readFileSync('promotion/promo-music-catalog.json','utf8'));
const directory=process.env.MW_PROMO_AUDIO_DIR || path.join(process.env.RUNNER_TEMP || os.tmpdir(),'morrowwish-promo-audio');
export function promoTrack(slug){
 const entry=catalog.tracks[slug];
 if(!entry)throw Error('No licensed music assigned to '+slug);
 const file=path.join(directory,slug+'.ogg');
 if(!fs.existsSync(file)||fs.statSync(file).size<20000)throw Error('Missing unique audio track for '+slug+'. Run scripts/fetch-promo-audio.mjs. Do not use a common fallback.');
 return file;
}
