import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{},console,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}};
const storage=new Map();
vm.createContext(context);
vm.runInContext(read('public/cat-bond/js/state.js'),context);
vm.runInContext(read('public/cat-bond/js/resonance-world-model.js'),context);
const {State,CatBondResonanceModel:m}=context.window;
assert.equal(m.REGIONS.length,6);
assert.equal(m.LINKS.length,6);
assert.equal(State.startNewGame('slot1'),true);
const w=m.attach(State);
assert.equal(w.visit('forest'),false);
assert.equal(w.record('identity-reveal'),false);
assert.equal(w.visit('harbor',{x:100,y:200}),true);
assert.equal(w.record('meet:qilan'),true);
assert.equal(w.view().scene,'H-02');
assert.equal(State.startNewGame('slot2'),true);
assert.equal(w.view().scene,'H-01');
assert.equal(w.view().regions[0].visited,false);
assert.equal(State.startNewGame('slot3'),true);
assert.equal(w.visit('harbor'),true);
assert.equal(State.loadSlot('slot1'),true);
assert.equal(w.view().scene,'H-02');
assert.equal(State.S.lastResonanceWorld.position.x,100);
assert.equal(State.loadSlot('slot2'),true);
assert.equal(w.view().scene,'H-01');
const s=m.fresh();
for(const region of m.REGIONS){
  assert.equal(m.visit(s,region.id),true);
  for(const [scene,actions] of region.scenes){
    for(const action of actions){
      assert.equal(s.scene,scene);
      if(action==='local-response')assert.equal(m.record(s,action,{participants:[region.npcs[0]]}),false);
      if(action==='ring-ready'){
        assert.equal(m.record(s,action),false);
        for(const link of m.LINKS){
          assert.equal(m.visit(s,link.a),true);
          assert.equal(m.exchange(s,link.id,'baReceived',link.a),false);
          assert.equal(m.exchange(s,link.id,'abSent',link.a),true);
          assert.equal(m.exchange(s,link.id,'abSent',link.a),false);
          assert.equal(m.ringReady(s),false);
          assert.equal(m.visit(s,link.b),true);
          assert.equal(m.exchange(s,link.id,'abReceived',link.b),true);
          assert.equal(m.exchange(s,link.id,'baSent',link.b),true);
          assert.equal(m.visit(s,link.a),true);
          assert.equal(m.exchange(s,link.id,'baReceived',link.a),true);
        }
        assert.equal(m.visit(s,region.id),true);
      }
      assert.equal(m.record(s,action,{choice:region.choices[0],participants:region.npcs}),true,action);
    }
  }
}
assert.equal(m.ringReady(s),true);
assert.equal(s.scene,'B-01');
assert.equal(s.finale.phase,1);
assert.equal(s.reveals.reversePlan,true);
console.log('PASS: canonical campaign gates, 24 exchange transitions, three actual SaveManager slots');
