// Run only after the complete artist-reviewed pack is merged. Never waive missing files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='public/cat-bond/',dir=root+'assets/mobile-portrait/duo/';
const src=fs.readFileSync(root+'js/duo-premium.js','utf8');
const keys=JSON.parse(src.match(/const keys=(\[[^;]+\]);/)[1].replaceAll("'",'"'));
assert.equal(keys.length,21);
const expected=keys.flatMap(k=>[1,2,3].map(t=>k.replace('+','-')+'-tier-'+t+'.webp'));
assert.deepEqual(fs.readdirSync(dir).filter(f=>f.endsWith('.webp')).sort(),expected.sort(),'every elemental pair and tier needs its own native painting');
function size(b){
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 const f=b.toString('ascii',12,16);
 if(f==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
 if(f==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];
 if(f==='VP8L'){const n=b.readUInt32LE(21);return [1+(n&16383),1+((n>>>14)&16383)];}
 throw Error('Unsupported WebP header');
}
const hashes=new Set();
for(const f of expected){const b=fs.readFileSync(dir+f),[w,h]=size(b);assert.ok(w>=720&&h>=1280&&Math.abs(w/h-9/16)<.025,f+' native portrait dimensions '+w+'x'+h);const hash=crypto.createHash('sha256').update(b).digest('hex');assert.ok(!hashes.has(hash),f+' duplicate painting');hashes.add(hash);}
const native=src.slice(src.indexOf('function drawNativePortrait('),src.indexOf('function draw(ctx,W,H,seq)'));
assert.ok(native.includes('stageCtx.drawImage(im,artX,artY,artW,artH)')&&native.includes('extendedPainting:false')&&native.includes('actorLayerCount:0'));
assert.ok(!/blur\(|feather\(|drawKitten|drawCat|atmosphere\(/.test(native),'no portrait fallback or extension');
console.log('Native portrait duo assets and renderer gate PASS: 63 unique original paintings');
