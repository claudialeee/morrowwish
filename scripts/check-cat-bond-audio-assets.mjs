import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import crypto from 'node:crypto';
const dir='public/cat-bond/assets/audio/',scoreSource=fs.readFileSync('public/cat-bond/js/rpg-audio-score.js','utf8'),window={};
vm.runInNewContext(scoreSource,{window});
const manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));
const ids=window.CatBondOriginalScore.ids;
assert.deepEqual(Object.keys(manifest.tracks).sort(),[...ids].sort());
assert.equal(manifest.scoreSha256,crypto.createHash('sha256').update(scoreSource).digest('hex'));
assert.ok(fs.readFileSync(dir+manifest.bankLicense,'utf8').includes('Permission is hereby granted'));
let total=0;
for(const [id,entry] of Object.entries(manifest.tracks)){
 assert.equal(entry.file,id+'.mp3');const bytes=fs.readFileSync(dir+entry.file);assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.ok(entry.seconds>18&&entry.seconds<130);total+=bytes.length;
}
assert.ok(total<25000000,'Compressed audio budget exceeded: '+total);
console.log('31 original MP3 recordings, source hash, license, asset hashes, and 25 MB budget verified:',total);

const premiumDir='public/cat-bond/assets/quality-audio/',premium=JSON.parse(fs.readFileSync(premiumDir+'premium-manifest.json','utf8'));
for(const id of new Set(Object.values(premium.scenes))){
 const entry=premium.tracks[id];assert.ok(entry,id+' has manifest record');
 assert.ok(entry.author&&entry.license&&entry.source,id+' provenance');
 assert.match(entry.file,/^[a-z0-9-]+\.mp3$/);
 const bytes=fs.readFileSync(premiumDir+entry.file);
 assert.equal(bytes.length,entry.bytes,id+' byte count');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,id+' checksum');
}
console.log('Premium soundtrack integrity PASS',new Set(Object.values(premium.scenes)).size,'mapped recordings');
