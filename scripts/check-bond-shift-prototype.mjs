import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STAGES, FORMS, nextStage, canUseGuardian, bondTier,
  shieldStrength, canIntercept, chapterGoal, compareForms
} from '../public/cat-bond/prototypes/bond-shift/logic.mjs';

const root=new URL('../public/cat-bond/prototypes/bond-shift/',import.meta.url);
const game=readFileSync(new URL('./game.js',root),'utf8');
const html=readFileSync(new URL('./index.html',root),'utf8');

test('five-stage progression always reaches a terminal state',()=>{
  assert.deepEqual(STAGES,['encounter','together','apart','reunion','complete']);
  let s=STAGES[0];for(let i=0;i<4;i++)s=nextStage(s);
  assert.equal(s,'complete');assert.equal(nextStage(s),'complete');
  assert.throws(()=>nextStage('invalid'));
  for(const stage of STAGES)assert.ok(chapterGoal(stage).length>10);
});
test('real combat identities, not a damage-only recolor',()=>{
  assert.equal(FORMS.hunter.role,'melee-burst');
  assert.equal(FORMS.guardian.role,'ranged-protection');
  assert.ok(FORMS.hunter.attackRange<FORMS.guardian.attackRange*.5);
  assert.ok(FORMS.hunter.speed>FORMS.guardian.speed);
  assert.notEqual(FORMS.hunter.attackCooldown,FORMS.guardian.attackCooldown);
  assert.equal(canUseGuardian(false),false);
  assert.equal(canUseGuardian(true),true);
});
test('separation preserves a viable echo and reunion improves it',()=>{
  const before=shieldStrength({guardianUnlocked:true,reunited:false,companionPresent:true});
  const apart=shieldStrength({guardianUnlocked:true,reunited:false,companionPresent:false});
  const reunited=shieldStrength({guardianUnlocked:true,reunited:true,companionPresent:true});
  assert.ok(apart>0&&apart<before&&reunited>before);
  assert.equal(shieldStrength({guardianUnlocked:false,reunited:true,companionPresent:true}),0);
  assert.equal(bondTier(0,false),'forming');
  assert.equal(bondTier(20,false),'remembered');
  assert.equal(bondTier(20,true),'renewed');
});
test('protect action requires actual timing and proximity, never passive farming',()=>{
  const good={guarding:true,distanceToCompanion:50,companionPresent:true,enemyTarget:'companion'};
  assert.equal(canIntercept(good),true);
  assert.equal(canIntercept({...good,guarding:false}),false);
  assert.equal(canIntercept({...good,distanceToCompanion:140}),false);
  assert.equal(canIntercept({...good,companionPresent:false}),false);
  assert.equal(canIntercept({...good,enemyTarget:'player'}),false);
});
test('do not claim both forms were used if only toggled',()=>{
  assert.equal(compareForms(2,2),true);
  assert.equal(compareForms(2,0),false);
  assert.equal(compareForms(0,2),false);
});
test('prototype does not import production state, write saves or send analytics',()=>{
  assert.ok(html.includes('type="module" src="./game.js"'));
  assert.ok(game.includes("from './logic.mjs'"));
  assert.ok(!/localStorage|sessionStorage|State\.hardReset|State\.save|fetch\s*\(|sendBeacon|arcadeMetric/.test(game.replace(/\/\/.*$/gm,'')));
  assert.ok(!/src="\/cat-bond\/js\/|src="\.\.\/\.\.\/js\//.test(html));
  assert.ok(game.includes('window.__bondShiftDebug'));
});
