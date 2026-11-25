import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const path='public/cat-bond/assets/quality-audio/';
const m=JSON.parse(fs.readFileSync(path+'premium-manifest.json'));
const c=JSON.parse(fs.readFileSync('docs/cat-bond-rpg/premium-soundtrack-catalog.json'));
assert.deepEqual(m.scenes,c.scenes);assert.equal(Object.keys(m.tracks).length,17);
assert.equal(new Set(['harbor','forest','forge','sky','library','starfall'].map(x=>m.scenes[x])).size,6);
for(const [id,e] of Object.entries(m.tracks)){
 assert.equal(e.title,c.tracks[id].title);assert.equal(e.license,'CC BY 4.0');assert.equal(e.source,c.tracks[id].source);
 const bytes=fs.readFileSync(path+e.file);assert.equal(bytes.length,e.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),e.sha256);
 assert.ok(e.seconds>=40&&e.seconds<=480&&e.integratedLUFS>=-21.5&&e.integratedLUFS<=-16.5&&e.truePeakDBTP<=-.9&&e.sampleRate===44100&&e.channels===2,JSON.stringify(e));
}
console.log('Premium candidate files, provenance, six distinct regions, and master measurements PASS. Human listening pending.');
