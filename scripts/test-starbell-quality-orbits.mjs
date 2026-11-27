import assert from 'node:assert/strict';
import {buildMasteryPattern,inPattern,guardianSteer} from '../public/cat-bond/js/resonance/regional-combat.mjs';
import {guardianProfile,regionalBossLevel} from '../public/cat-bond/js/resonance/regional-bosses.mjs';
let checks=0;
for(const [W,H] of [[960,540],[390,844],[844,390]])for(const element of ['light','dark'])for(let cycle=0;cycle<4;cycle++){
 const top=80,bottom=90,patterns=buildMasteryPattern(W,H,top,bottom,cycle,element);
 assert.equal(patterns.length,2);
 const b={autoMode:true,libraryEncounter:{bossId:'mastery'},regionalCombat:{cast:{element,patterns}}};
 for(const q of [.08,.35,.65,.92]){
  const f={x:W*q,y:top+(H-top-bottom)*q,alive:true};
  const danger=patterns.some(p=>inPattern(p,f)),dir=guardianSteer(b,f);
  if(danger)assert.ok(dir,'auto must evade marked lanes');
  if(dir){const axis=element==='light'?'x':'y',dest=(element==='light'?W:H-top-bottom)*(cycle%2===0?.35:.65)+(element==='dark'?top:0);
   assert.equal(dir[axis],Math.sign(dest-f[axis]));
   assert.equal(dir[axis==='x'?'y':'x'],0);
  }
  assert.equal(guardianSteer({...b,autoMode:false},f),null);
  assert.equal(guardianSteer({...b,libraryEncounter:{bossId:'starfall'}},f),null);
  checks++;
 }
}
for(const id of ['harbor','forest','forge','sky','library','starfall','mastery']){
 const low=[{cat:{level:10},maxhp:220},{cat:{level:10},maxhp:220}],high=low.map(f=>({...f,cat:{level:20},maxhp:440}));
 assert.ok(guardianProfile(id,high,'casual').hp<guardianProfile(id,low,'casual').hp*2);
 assert.ok(guardianProfile(id,low,'hardcore').hp>guardianProfile(id,low,'casual').hp);
 assert.equal(regionalBossLevel(id,[{level:10},{level:10},{level:99}]),regionalBossLevel(id,[{level:10},{level:10}]));
}
console.log('PASS: '+checks+' real safe-lane geometry/steering fixtures; chapter scaling and reserve invariants.');
