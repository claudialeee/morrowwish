import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {canonArt} from "../public/cat-bond/js/resonance/canon22-art.mjs";
const root="public/cat-bond/",names="forest-fork forest-landing forest-root-bridge forest-moonleaf-control lantern-theater garden-lantern shadow-fish shadow-butterfly shadow-cat lantern-vault lantern-stone-crossing shadow-beast sky-cloudfall sky-safety-island sky-glider history-impact garden-moonleaf-touch garden-moonleaf garden-teacup garden-route-map".split(" ");
const modules=["js/resonance/canon22-spatial.mjs","js/resonance/sky-flight.mjs","js/resonance/regional-combat.mjs","js/resonance/dialogue-ui.mjs","js/garden-exploration.js","js/resonance-cinematic.mjs","assets/cinematics/asset-manifest.json"];
const all=modules.map(p=>readFileSync(root+p,"utf8")).join("\n");
for(const n of names){assert(existsSync(root+"assets/canon22-final-art/"+n+".webp"),n+" missing");assert(all.includes(n),n+" unreferenced");}
assert.equal(canonArt("forest-fork"),null);
const manifest=JSON.parse(readFileSync(root+"assets/cinematics/asset-manifest.json","utf8"));
const impact=manifest.assets.find(a=>a.id==="canon22-history-impact");
assert.equal(impact.runtimeAllowed,false);assert.equal(impact.stagingAllowed,true);
console.log("20 art references present; production cinematic gate preserved");
