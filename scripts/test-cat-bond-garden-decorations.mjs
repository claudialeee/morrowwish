import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('../public/cat-bond/js/world.js',import.meta.url),'utf8');
const fresh=()=>({coins:100,yardBuildings:[],sunlitGarden:{schema:1},resonance:{completed:[]}});
const State={S:fresh(),save:()=>({ok:true})};
class Image{
 constructor(){this.complete=true;this.naturalWidth=160;this.naturalHeight=200}
 set src(value){this._src=value;if(value.includes('sunlit-garden-landscape')){this.naturalWidth=1600;this.naturalHeight=900;}else if(value.includes('sunlit-garden-portrait')){this.naturalWidth=900;this.naturalHeight=1600;}}
 get src(){return this._src;}
}
const window={};vm.runInNewContext(src,{State,Image,window,console});
const W=window.World,yard=Object.assign(Object.create(W.YardScene.prototype),{game:{W:800,H:600,scene:'yard'},entities:[],bushes:[]});
assert.ok(yard.beginPlacement('garden-lantern'));assert.ok(yard.movePlacement(180,350));assert.ok(yard.confirmPlacement());
assert.equal(State.S.coins,82);assert.equal(State.S.yardBuildings.length,0);assert.equal(W.gardenDecorations().length,1);assert.equal(W.BUILDING_PRODUCTION['garden-lantern'],undefined);
assert.equal(yard.buildingSpotValid(180,350),false);
assert.ok(yard.beginPlacement('moonflower-planter'));assert.equal(yard.movePlacement(180,350),false);assert.equal(yard.confirmPlacement(),false);assert.ok(yard.movePlacement(340,420));assert.ok(yard.confirmPlacement());
assert.equal(State.S.coins,68);
const b=W.gardenDecorations()[0];assert.ok(yard.beginRelocation(0,true));assert.ok(yard.movePlacement(420,350));assert.ok(yard.confirmPlacement());assert.equal(b,W.gardenDecorations()[0]);assert.ok(Math.abs(b.x-420)<.001);assert.equal(State.S.coins,68);
State.save=()=>({ok:false});const snapshot=JSON.stringify(State.S);
assert.ok(yard.beginRelocation(0,true));assert.ok(yard.movePlacement(250,450));assert.equal(yard.confirmPlacement(),false);assert.equal(JSON.stringify(State.S),snapshot);yard.cancelPlacement();
assert.equal(yard.removeDecoration(0).ok,false);assert.equal(JSON.stringify(State.S),snapshot);
assert.ok(yard.beginPlacement('garden-lantern'));assert.ok(yard.movePlacement(600,450));assert.equal(yard.confirmPlacement(),false);assert.equal(JSON.stringify(State.S),snapshot);yard.cancelPlacement();
State.save=()=>({ok:true});assert.ok(yard.beginPlacement('moonflower-planter'));assert.ok(yard.movePlacement(600,450));const original=State.S;State.S=fresh();assert.equal(yard.confirmPlacement(),false);assert.equal(W.gardenDecorations().length,0);assert.equal(State.S.coins,100);yard.cancelPlacement();State.S=original;
assert.equal(yard.removeDecoration(1).refund,7);assert.equal(W.gardenDecorations().length,1);assert.equal(State.S.coins,75);assert.equal(State.S.resonance.completed.length,0);
console.log('PASS actual decoration methods: placement, overlap, relocation, refund, rollback, slot isolation');
