// Regression: the in-scene top-left button returns to the yard, not the map.
// Runs without a browser using the real WorldMap module and a minimal game stub.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('public/cat-bond/js/worldmap.js','utf8');
const html=fs.readFileSync('public/cat-bond/index.html','utf8');
assert.match(html,/worldmap\.js\?v=top-left-yard-and-raised-region-20261122/);
assert.match(source,/← 回庭院/);
assert.doesNotMatch(source,/← 回地图|← Map/, 'no redundant scene return-to-map sign');
assert.doesNotMatch(source,/Math\.hypot\(w\.px - w\.portal\.x/, 'no automatic portal exit');
assert.match(html,/id="map-menu"/, 'top-header menu opens world directory');
assert.match(html,/id="map-actions" hidden/, 'redundant map action row is hidden');

for(const {W,H,touch} of [
  {W:390,H:844,touch:true},      // portrait phone
  {W:320,H:568,touch:true},      // narrow phone
  {W:568,H:320,touch:true},      // small landscape phone
  {W:800,H:400,touch:true},      // wide landscape phone
  {W:1280,H:720,touch:false},    // desktop
]){
  const state={cats:[],dex:{},coins:0,fish:0};
  const window={
    State:{S:state,save(){}},
    GameData:{
      speciesById(id){return {id,rarity:'R'}},
      RARITY:{R:{weight:1}},
    },
    MorrowwishI18n:{get:()=> 'zh'},
  };
  vm.runInNewContext(source,{window,console});
  const map=window.WorldMap;
  let exits=0;
  map.init({W,H,isTouch:touch,toast(){}});
  map.onExit(()=>{exits++});
  assert.equal(map.enterRegion('home'),true,'can enter the default unlocked region (Sakura requires exploration)');
  const narrow=W<=360;
  const button={x:narrow?8:12,y:8,w:narrow?76:120,h:narrow?34:38};
  assert.ok(button.x+button.w<=W&&button.y+button.h<=H,'button stays on screen');
  const hudY=Math.max(W<650?125:80,button.y+button.h+14);
  assert.ok(hudY>=button.y+button.h+12,'region status stays below button');
  assert.equal(map.handleTap(button.x+button.w/2,button.y+button.h/2),true,
    'upper-left tap is handled in region');
  assert.equal(exits,1,'region control returns directly to yard');

  // The old bottom-left control and in-world map portal are fully inert.
  assert.equal(map.handleTap(20,H-24),false,'no hidden bottom-left map control');
  assert.equal(map.handleTap(144,650),false,'old portal cannot open world map');
  assert.equal(map.mode,'region','old map exit does not change the current scene');
  assert.equal(exits,1,'no duplicate back-to-map / yard action');
  map.enterMap();
  const worldButton={x:narrow?8:12,y:8,w:narrow?76:120,h:narrow?34:38};
  map.handleTap(worldButton.x+worldButton.w/2,worldButton.y+worldButton.h/2);
  assert.equal(exits,2,'world map still returns to yard');
}
console.log('Cat Bond in-scene upper-left yard return passed in portrait, landscape and desktop');
