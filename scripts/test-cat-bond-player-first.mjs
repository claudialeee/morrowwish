import assert from "node:assert/strict";
import {campaign} from "../public/cat-bond/js/resonance/campaign.mjs";
import {makeEngine} from "../public/cat-bond/js/resonance/engine.mjs";
const ok=r=>assert.equal(r.ok,true,r.reason);
for(const meet of [false,true]){const e=makeEngine(campaign);for(let i=0;i<4;i++){assert.deepEqual(e.view().objective,[]);ok(e.finish());}assert.equal(e.view().muling,"unmet");assert.equal(e.view().current.id,"prologue:P-05");assert.equal(e.finish().ok,false);if(meet){ok(e.meetTraveler());assert.equal(e.meetTraveler().ok,false);}ok(e.record("prologue:P-05","travel:harbor"));ok(e.finish());assert.equal(e.view().current.lines[1].text.zh.includes("我叫暮铃"),!meet);assert.equal(e.nextLine().ok,false);ok(e.record("harbor:H-01","npc:harbor-arrival"));while(e.view().cursor<e.view().current.lines.length)ok(e.nextLine());ok(e.finish());assert.equal(e.view().muling,"temporary");}
const old=makeEngine(campaign).snapshot();old.scene="prologue:P-02";old.completed=["prologue:P-01"];old.cursor=12;delete old.openingPresentationVersion;assert.equal(makeEngine(campaign,old).view().cursor,0);
console.log("Player-first opening and optional encounter passed");

// Chapter II: discover the evidence before choosing, then solve the rescue and local melody.
import {createPuzzle,movePuzzle} from "../public/cat-bond/js/resonance/world-exploration.mjs";
const firstForest=campaign.scenes.findIndex(s=>s.id==="forest:R-01");
const forestSave=makeEngine(campaign).snapshot();forestSave.scene="forest:R-01";forestSave.completed=campaign.scenes.slice(0,firstForest).map(s=>s.id);
const forest=makeEngine(campaign,forestSave);const drain=()=>{while(forest.view().cursor<forest.view().current.lines.length)ok(forest.nextLine());};
ok(forest.record("forest:R-01","npc:forest-dispute"));drain();ok(forest.finish());
assert.equal(forest.nextLine().ok,false);assert.equal(forest.record("forest:R-02","explore:scent-trail").ok,false);ok(forest.record("forest:R-02","puzzle:moonleaf-crossing"));drain();ok(forest.finish());
assert.equal(forest.record("forest:R-03","battle:root-echo").ok,false);ok(forest.record("forest:R-03","puzzle:moonleaf-loop"));drain();ok(forest.finish());
assert.equal(forest.record("forest:R-04","melody:forest").ok,false);ok(forest.record("forest:R-04","repair:forest"));const song=createPuzzle("melody:forest");song.participants=["yahe","yuchuan"];assert.equal(movePuzzle(song,1),false);assert.equal(movePuzzle(song,2),false);assert.deepEqual(song.values,[1]);assert.equal(movePuzzle(song,0),false);assert.equal(movePuzzle(song,2),true);ok(forest.record("forest:R-04","melody:forest"));drain();ok(forest.finish());assert.equal(forest.view().current.id,"forge:E-01");console.log("Moonleaf routes and forest melody passed");


// The landing screen is strictly single-language in both directions.
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const titleHtml=readFileSync(new URL("../public/cat-bond/index.html",import.meta.url),"utf8");
const titleMain=readFileSync(new URL("../public/cat-bond/js/main.js",import.meta.url),"utf8");
assert.doesNotMatch(titleHtml,/id="cb-title-subtitle"/,"Do not render a second-language subtitle");
const titleRenderer=titleMain.match(/const renderIntroLocale=\(\)=>\{[\s\S]*?\n  \};/);
assert.ok(titleRenderer,"Title locale renderer must exist");
const titleNodes=new Map();
const node=key=>{if(!titleNodes.has(key))titleNodes.set(key,{textContent:"",setAttribute(){}});return titleNodes.get(key);};
let titleLang="en";
const titleContext={window:{MorrowwishI18n:{get:()=>titleLang}},document:{getElementById:node,querySelector:node}};
const renderTitle=runInNewContext(titleRenderer[0]+"\nrenderIntroLocale",titleContext);
for(const [locale,expected,start,cont] of [["en","Echoes of the Starbell","New Adventure","Continue Story"],["zh","星铃回响","开始新的冒险","继续故事"],["en","Echoes of the Starbell","New Adventure","Continue Story"]]){
 titleLang=locale;renderTitle();assert.equal(node("cb-title-name").textContent,expected);assert.equal(node("#intro-start strong").textContent,start);assert.equal(node("#intro-continue strong").textContent,cont);assert.equal(/[\u4e00-\u9fff]/.test(node(".cb-intro-tagline").textContent),locale==="zh");assert.equal(titleNodes.has("cb-title-subtitle"),false);
}
console.log("Single-locale title and live EN/ZH/EN switching passed");

import {hasPendingDialogue,awaitingGameplay} from "../public/cat-bond/js/resonance/dialogue-ui.mjs";
{

 // Harbor dialogue must wait for actual battle evidence.
 const harborState=makeEngine(campaign).snapshot(),i=campaign.scenes.findIndex(s=>s.id==="harbor:H-04");
 harborState.scene="harbor:H-04";harborState.completed=campaign.scenes.slice(0,i).map(s=>s.id);
 const e=makeEngine(campaign,harborState),v=e.view();assert.equal(v.lineReady,false);assert.equal(awaitingGameplay(v),true);assert.equal(e.nextLine().ok,false);assert.equal(e.record(v.current.id,"rescue:storm-boat").ok,false);ok(e.record(v.current.id,"battle:chime-beast"));assert.equal(hasPendingDialogue(e.view()),true);while(e.view().cursor<e.view().current.lines.length)ok(e.nextLine());ok(e.finish());
}
