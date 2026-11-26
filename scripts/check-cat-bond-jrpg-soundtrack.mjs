import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const dir='public/cat-bond/assets/quality-audio/';
const m=JSON.parse(fs.readFileSync(dir+'premium-manifest.json'));const c=JSON.parse(fs.readFileSync('docs/cat-bond-rpg/jrpg-soundtrack-catalog.json'));
assert.deepEqual(m.scenes,c.scenes);assert.deepEqual(Object.keys(m.tracks).sort(),Object.keys(c.tracks).sort());
assert.equal(Object.keys(m.scenes).length,25);assert.equal(new Set(['harbor','forest','forge','sky','library','starfall'].map(k=>m.scenes[k])).size,6);
assert.equal(new Set(['boss-harbor','boss-forest','boss-forge','boss-sky','boss-library','boss-starfall'].map(k=>m.scenes[k])).size,3);
for(const [id,e] of Object.entries(m.tracks)){const t=c.tracks[id];assert.equal(e.license,'CC BY 3.0');assert.equal(e.author,t.author);assert.equal(e.source,t.source);assert.equal(e.file,'premium-jrpg-'+id+'.mp3');const bytes=fs.readFileSync(dir+e.file);assert.equal(bytes.length,e.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),e.sha256);assert.ok(e.seconds>=40&&e.seconds<=480&&e.integratedLUFS>=-21.5&&e.integratedLUFS<=-16.5&&e.truePeakDBTP<=-.9&&e.sampleRate===44100&&e.channels===2);assert.ok(fs.readFileSync(dir+'music-credits.html','utf8').includes(e.source));}
console.log('JRPG candidate assets, exact cue coverage and attribution PASS. Listening remains pending.');
