import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root='public/cat-bond/',dir=root+'assets/core-art-remaster/';
const manifest=JSON.parse(await fs.readFile(dir+'manifest.json','utf8'));
const context=vm.createContext({window:{},console});
for(const file of ['data.js','skills.js'])vm.runInContext(await fs.readFile(root+'js/'+file,'utf8'),context,{filename:file});
const {GameData,Skills}=context.window;
const cats=manifest.characters.filter(c=>c.group==='collectibles'),ids=new Set(cats.map(c=>c.id));
assert.equal(ids.size,16);assert.equal(GameData.SPECIES.length,16);
assert.deepEqual([...GameData.SPECIES.map(c=>c.id)].sort(),[...ids].sort());
const elements={'火':'fire','水':'water','草':'grass','电':'elec','暗':'dark','光':'light'};
for(const tier of ['N','R','SR','SSR'])assert.equal(GameData.SPECIES.filter(c=>c.rarity===tier).length,{N:4,R:6,SR:4,SSR:2}[tier]);
assert.equal(new Set(GameData.SPECIES.filter(c=>c.rarity==='R').map(c=>c.element)).size,6);
for(const c of cats){
 const sp=GameData.speciesById(c.id);assert.equal(sp.name,c.name);assert.equal(sp.rarity,c.rarity);assert.equal(sp.storyArt,'assets/'+c.asset);
 assert.equal(Skills.elementOf(c.id),elements[c.element]);
 assert.equal(Skills.buildTypeForBreed({species:c.id}),sp.role);
 for(const level of [1,8,16]){
  const kit=Skills.enemyKitFor(c.id,level);assert.ok(kit,c.id+' legal enemy kit');
 }
 const evo=Skills.evolutionOf(c.id);if(evo){assert.ok(ids.has(evo.evolvesTo));assert.equal(Skills.elementOf(evo.evolvesTo),sp.element);}
 const signature=Skills.SIGNATURE_SKILL[c.id];if(signature)assert.equal(Skills.skillById(signature).element,sp.element);
}
assert.ok(!ids.has('jinjc'));assert.equal(GameData.speciesById('jinjc').storyArt,'assets/core-art-remaster/leads/player.webp');
assert.equal(GameData.speciesById('story_muling').storyArt,'assets/core-art-remaster/leads/muling.webp');
for(let i=0;i<2000;i++)assert.ok(ids.has(GameData.rollSpecies().id),'draw cannot return a retired species');
for(const c of [...manifest.characters,...manifest.story]){
 const data=await fs.readFile(root+'assets/'+c.asset);
 assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');
}
const world=await fs.readFile(root+'js/resonance/world-runtime.mjs','utf8');
const pools=vm.runInNewContext('('+world.match(/const pools=(\{[\s\S]*?\n\});/)[1]+')');
assert.equal(Object.keys(pools).length,6);
const found=new Set(Object.values(pools).flat());
assert.deepEqual([...found].sort(),[...ids].sort(),'All active species must be reachable through the six regions; no legacy species');
const legacy=await fs.readFile(root+'js/worldmap.js','utf8');
for(const m of legacy.matchAll(/speciesPool: (\[[^\]]+\])/g))for(const id of vm.runInNewContext(m[1]))assert.ok(ids.has(id),'retired legacy map encounter '+id);
const raising=await fs.readFile(root+'js/raising.js','utf8');
const combos=vm.runInNewContext(raising.match(/const BREED_COMBOS = (\[[\s\S]*?\n\]);/)[1]);
for(const c of combos)for(const id of [c.a,c.b,c.result])assert.ok(ids.has(id),'retired breeding species '+id);
console.log('CORE ART ROSTER PASS',ids.size,'collectibles, 24 WebP headers, six regional pools, element/role/skill mappings, draw and breeding contracts');
