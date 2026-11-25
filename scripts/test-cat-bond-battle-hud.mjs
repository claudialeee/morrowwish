import assert from "node:assert/strict";
import {objectiveTop,cinematicActive,syncCinematicHud} from "../public/cat-bond/js/resonance/battle-hud.mjs";
assert.equal(objectiveTop({top:20},[{width:300,height:42,bottom:62},{width:90,height:38,bottom:145},{width:0,height:0,bottom:500}]),132);
assert.equal(objectiveTop({top:10},[{width:200,height:35,bottom:45}]),42);
const panel={dataset:{}};
for(const battle of [{},{duoCinematic:{}},{ultCinematic:{}},{}]){syncCinematicHud(panel,battle);assert.equal(panel.dataset.cinematic,String(cinematicActive(battle)));}
console.log("Shared battle HUD position and cinematic state regression PASS");
