// Reproducible transformation of the original licensed score. Run before the existing FluidR3 renderer.
import fs from "node:fs";
const file="public/cat-bond/js/rpg-audio-score.js";
let source=fs.readFileSync(file,"utf8");
if(!source.includes("BRIGHT_ORCHESTRATION_V2")){
 const changes=[
  [
    "title:[68,62,'minor','star','piano','strings','bell',[0,5,2,6,0,3,5,4]]",
    "title:[84,62,'major','star','piano','strings','harp',[0,4,5,3,0,2,1,4]]"
  ],
  [
    "opening:[76,62,'minor','star','horn','strings','bell',[0,5,3,6,0,1,5,4]]",
    "opening:[88,62,'major','star','flute','strings','harp',[0,4,5,3,0,2,1,4]]"
  ],
  [
    "garden:[70,60,'major','star','piano','harp','flute'",
    "garden:[86,64,'major','star','piano','strings','harp'"
  ],
  [
    "harbor:[72,62,'dorian','harbor','flute','strings','harp'",
    "harbor:[84,62,'major','harbor','flute','strings','harp'"
  ],
  [
    "forest:[78,64,'dorian','forest','harp','strings','flute'",
    "forest:[88,67,'major','forest','harp','strings','flute'"
  ],
  [
    "forge:[96,57,'minor','forge','horn','strings','piano'",
    "forge:[102,62,'dorian','forge','piano','strings','harp'"
  ],
  [
    "library:[62,60,'minor','library','piano','strings','bell'",
    "library:[80,67,'major','library','piano','strings','bell'"
  ],
  [
    "starfall:[64,59,'dorian','starfall','horn','strings','bell'",
    "starfall:[78,62,'dorian','starfall','flute','strings','bell'"
  ],
  [
    "muling:[58,62,'minor','star','piano','strings','bell'",
    "muling:[74,64,'dorian','star','piano','strings','harp'"
  ],
  [
    "identity:[66,62,'dorian','star','bell','strings','piano'",
    "identity:[78,62,'major','star','bell','strings','piano'"
  ],
  [
    "betrayal:[64,61,'minor'",
    "betrayal:[72,64,'minor'"
  ],
  [
    "ending:[73,62,'major'",
    "ending:[84,64,'major'"
  ],
  [
    "postgarden:[80,60,'major'",
    "postgarden:[88,64,'major'"
  ],
  [
    "root=degree(key-24,mode,c);",
    "root=degree(key-(battle?24:12),mode,c);"
  ],
  [
    "add(t,3.7,root,pad,.68,-.22);add(t+2,1.8,root+12,pad,.28,.18);",
    "add(t,battle?3.7:2.6,root,pad,battle?.60:.38,-.22);add(t+2,battle?1.8:1.4,root+12,pad,.24,.18);"
  ],
  [
    "degree(key-12,mode,c+2*j),pad,.40+part*.025",
    "degree(key-(battle?12:0),mode,c+2*j),pad,.28+part*.018"
  ],
  [
    "degree(key-12,mode,c+arp[(j+bar)%arp.length])",
    "degree(key-(battle?12:0),mode,c+arp[(j+bar)%arp.length])"
  ]
];
 for(const [before,after] of changes){if(source.split(before).length!==2)throw Error("Score source has changed: "+before);source=source.replace(before,after);}
 fs.writeFileSync(file,"// BRIGHT_ORCHESTRATION_V2 — lyrical woodwinds, luminous harp and lighter chamber strings.\n"+source);
}
