import assert from "node:assert/strict";
import {ambientGames,createAmbientGame} from "../public/cat-bond/js/resonance/ambient-puzzles.mjs";
for(const [id,g] of Object.entries(ambientGames)){
 const p=createAmbientGame(id);
 assert.equal(p.drop("wrong",.5,.5).ok,false);assert.equal(p.stage(),0);
 for(const s of g.steps){const target=g.props.find(x=>x.id===s.target);assert.equal(p.drop(s.piece,0,0).ok,false);assert.equal(p.drop(s.piece,target.x,target.y).ok,true)}
 assert.equal(p.done(),true);assert.equal(p.drop(g.steps[0].piece,.5,.5).ok,false);
}
console.log("Physical ambient puzzles PASS: ordered drops, invalid targets rejected, completion only after all steps");
