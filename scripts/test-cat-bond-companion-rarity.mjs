import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {storyPartyPatch,recruitment,optionalRecruitment} from '../public/cat-bond/js/resonance/story-party.mjs';
const context=vm.createContext({window:{},console});
context.window=context;
for(const name of ['data','state','skills','battle'])vm.runInContext(fs.readFileSync(new URL('../public/cat-bond/js/'+name+'.js',import.meta.url),'utf8'),context,{filename:name+'.js'});
const {GameData,State,Skills}=context;
const total=c=>Object.values(c.stats).reduce((a,b)=>a+b,0);
const expected={N:32,R:34,SR:35,SSR:37};
const all=[...GameData.SPECIES,...Object.values(GameData.STORY_SPECIES)];
assert.equal(GameData.SPECIES.length,16);
assert.equal(all.length,29);
assert.deepEqual([...all.filter(s=>s.rarity==='SSR').map(s=>s.element)].sort(),['dark','elec','fire','grass','light','water']);
assert.equal(Object.keys(GameData.STORY_SPECIES).length,13);
const counts={N:0,R:0,SR:0,SSR:0};
for(const s of Object.values(GameData.STORY_SPECIES)){counts[s.rarity]++;assert.ok(!GameData.SPECIES.some(w=>w.id===s.id));assert.ok(s.storyRole);}
assert.deepEqual(counts,{N:3,R:4,SR:3,SSR:3});
for(const sp of all){
  const c=State.makeCat(sp.id);
  assert.equal(total(c),expected[sp.rarity],sp.id);
  assert.ok(Object.values(c.stats).every(x=>x>0));
  assert.equal(GameData.rarityInfo(c).key,sp.rarity);
  if(sp.storyActor)assert.equal(Skills.buildTypeForBreed(c),sp.storyRole);
  for(let i=1;i<20;i++)State.addXp(c,State.xpToNext(c.level));
  assert.equal(c.level,20);
  assert.ok(Math.abs(total(c)-(expected[sp.rarity]+19*5.5*GameData.ownedBudget(c)))<=4,sp.id);
}
const hero=State.makeCat('jinjc',{protagonist:true}),wild=State.makeCat('jinjc');
assert.equal(GameData.rarityInfo(hero).key,'hero');
assert.equal(GameData.rarityInfo(wild).key,'R');
const m=State.makeCat('story_muling',{affinity:35});
assert.equal(GameData.rarityInfo(m).key,'SSR');
assert.ok(!Skills.learnableSkills(m).some(s=>s.ultCost>0));
m.level=3;assert.ok(Skills.learnableSkills(m).some(s=>s.ultCost>0));
const root={cats:[hero],battlePrefs:{teamUids:[hero.uid]}};
let previous={completed:[],postgame:[]};
for(const id of [...Object.keys(recruitment),'epilogue:E-03']){
  const next={...previous,completed:[...previous.completed,id]};
  const patch=storyPartyPatch(root,previous,next,State.makeCat);
  if(patch)Object.assign(root,patch.fields);
  previous=next;
}
for(const id of Object.keys(optionalRecruitment)){
  const next={...previous,postgame:[...previous.postgame,id]};
  const patch=storyPartyPatch(root,previous,next,State.makeCat);
  if(patch)Object.assign(root,patch.fields);
  previous=next;
}
assert.equal(root.cats.length,14);
assert.equal(root.cats.find(c=>c.storyActor==='muling').species,'story_muling');
const legacy=JSON.parse(JSON.stringify({cats:[{uid:'old',species:'jinjc',level:7,xp:15,affinity:60,stats:{pow:40,agi:40,vit:40,cha:40},learned:['a']}],storyAway:{muling:{uid:'m',species:'story_muling',level:5,stats:{pow:30,agi:30,vit:30,cha:30}}}}));
context.legacy=legacy;
const migrated=vm.runInContext('normalizeLoadedState(legacy)',context);
assert.equal(migrated.cats[0].protagonist,true);
assert.equal(migrated.cats[0].level,7);
assert.equal(migrated.cats[0].xp,15);
assert.equal(migrated.cats[0].learned[0],'a');
assert.equal(migrated.storyAway.muling._ownedStatVersion,2);
context.migrated=migrated;
assert.equal(JSON.stringify(vm.runInContext('normalizeLoadedState(migrated)',context)),JSON.stringify(migrated));
console.log('Companion rarity, role, stat budgets, growth, protagonist, recruitment and save migration passed');

const proto=context.Battle.CaptureBattle.prototype;
const fighter=id=>({cat:{species:id},alive:true,hp:100,maxhp:100,x:0,y:0,cd:{q:3,e:3}});
const muling=fighter('story_muling'),yuchuan=fighter('story_yuchuan'),xingya=fighter('story_xingya'),ally=fighter('biscuit');
const fake={t:0,team:[muling,yuchuan,xingya,ally],vfx:{text(){}},castWard(a,type,sk){a.shieldT=sk.wardDuration;a._wardReduction=sk.wardReduction;return true;}};
const event=(a,e,slot)=>proto.storyPassiveEvent.call(fake,a,e,slot);
assert.ok(event(muling,'dodge'));assert.equal(Skills.breedPassiveFactor(muling,'damage',1),1.18);assert.equal(Skills.breedPassiveFactor(muling,'damage',3),1);assert.equal(event(muling,'dodge'),false);fake.t=10;assert.ok(event(muling,'dodge'));
ally.hp=35;assert.ok(event(yuchuan,'guard'));assert.equal(ally.shieldT,3);assert.equal(ally._wardReduction,.35);assert.equal(event(yuchuan,'guard'),false);
assert.equal(event(xingya,'alternate','q'),false);assert.ok(event(xingya,'alternate','e'));assert.equal(xingya.cd.q,1.8);assert.equal(event(xingya,'alternate','q'),false);
assert.equal(event(ally,'dodge'),false);assert.equal(event({...muling,alive:false},'dodge'),false);
console.log('Three story SSR event passives and cooldown limits passed');
