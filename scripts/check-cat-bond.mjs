/* Deterministic headless smoke test for Cat Bond (public/cat-bond/).
 *
 * Loads every game module in page order inside a minimal fake DOM + 2D canvas,
 * then drives the real systems: start the game, pick a starter, run a capture
 * battle to completion, and confirm the unified-analytics events fire. Also
 * checks that the bilingual (ZH->EN) layer resolves representative strings.
 * No network, no browser engine — mirrors scripts/check-pawsibly.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ---- minimal DOM ----
const listeners = {};               // "id:type" or "type" -> handler
const nodes = new Map();
const nop = () => {};
function classList() {
  const set = new Set();
  return { add: c => set.add(c), remove: c => set.delete(c), toggle: (c, on) => { on ? set.add(c) : set.delete(c); }, contains: c => set.has(c) };
}
const canvasCtx = new Proxy({
  createLinearGradient: () => ({ addColorStop: nop }),
  createRadialGradient: () => ({ addColorStop: nop }),
  getImageData: () => ({ data: [] }),
  measureText: () => ({ width: 10 }),
}, { get(o, k) { return k in o ? o[k] : nop; }, set() { return true; } });
function makeEl(id) {
  const el = {
    id, tagName: 'DIV', nodeName: 'DIV', nodeType: 1, style: { setProperty: nop }, dataset: {},
    classList: classList(), children: [], childNodes: [], attributes: {}, parentNode: null,
    _text: '', _html: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); if (c && typeof c === 'object') c.parentNode = this; return c; },
    removeChild: nop, remove: nop, insertBefore: (c) => c, prepend: nop,
    setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; },
    hasAttribute(k) { return k in this.attributes; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(t, cb) { listeners[id + ':' + t] = cb; }, removeEventListener: nop,
    getContext: () => canvasCtx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
    // Game UI builds markup via innerHTML then querySelector('canvas'); hand back
    // a canvas-capable stub so CatArt.renderCatThumb etc. never hit null.
    querySelector: (sel) => (/canvas/i.test(sel) ? makeEl('qs-canvas') : makeEl('qs-' + sel)),
    querySelectorAll: () => [], closest: () => null, focus: nop,
    width: 1000, height: 700,
  };
  return el;
}
const document = {
  readyState: 'complete',
  documentElement: makeEl('html'),
  body: makeEl('body'),
  title: 'Cat Bond',
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, makeEl(id)); return nodes.get(id); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) { const e = makeEl('new-' + tag); e.tagName = String(tag).toUpperCase(); return e; },
  createTextNode(t) { return { nodeType: 3, nodeValue: String(t), parentNode: null }; },
  addEventListener(t, cb) { listeners['doc:' + t] = cb; },
  removeEventListener: nop,
  // A real-enough TreeWalker: depth-first over a node's descendants, surfacing
  // element + text nodes so the i18n layer's live DOM path actually runs.
  createTreeWalker(root) {
    const out = [];
    (function visit(n) {
      for (const c of (n.childNodes || [])) { out.push(c); visit(c); }
    })(root);
    let i = -1;
    return { nextNode() { i++; return i < out.length ? out[i] : null; } };
  },
};
const events = [];
const rafQueue = [];
const windowObj = {
  document,
  addEventListener(t, cb) { listeners['win:' + t] = cb; },
  removeEventListener: nop,
  dispatchEvent: () => true,
  arcadeMetric(name, payload) { events.push({ name, payload }); },
  devicePixelRatio: 1,
  location: { pathname: '/cat-bond/', search: '', href: 'https://x/cat-bond/' },
  navigator: { language: 'en', userAgent: 'node' },
  requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: nop,
  setTimeout: (fn) => { try { fn(); } catch (e) {} return 1; },
  clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  CanvasRenderingContext2D: function () {},
  // v36 world.js loads a watercolor backdrop via new Image(); stub it (never "loads").
  Image: function () { return { width: 0, height: 0, set src(v) {}, get src() { return ''; }, onload: null, onerror: null }; },
  MutationObserver: function () { return { observe: nop, disconnect: nop }; },
  NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 },
  MorrowwishI18n: { get: () => 'en' },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  performance: { now: () => 1000 },
  console,
};
windowObj.CanvasRenderingContext2D.prototype = {};

const sandbox = {
  document, console,
  Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, WeakMap, Symbol, isNaN, isFinite, parseInt, parseFloat,
  requestAnimationFrame: windowObj.requestAnimationFrame, cancelAnimationFrame: nop,
  setTimeout: windowObj.setTimeout, clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  localStorage: windowObj.localStorage, navigator: windowObj.navigator, location: windowObj.location,
  performance: windowObj.performance, CanvasRenderingContext2D: windowObj.CanvasRenderingContext2D,
  MutationObserver: windowObj.MutationObserver, NodeFilter: windowObj.NodeFilter, Image: windowObj.Image,
};
vm.createContext(sandbox);
// In a browser, `window.Foo = x` also creates the bare global `Foo`. Emulate
// that: writes to window mirror onto the vm context (and vice versa) so modules
// that read bare `State`/`GameData`/`UI` resolve correctly.
windowObj.window = windowObj;
const winProxy = new Proxy(windowObj, {
  set(target, key, value) { target[key] = value; try { sandbox[key] = value; } catch (e) {} return true; },
  get(target, key) { return key in target ? target[key] : sandbox[key]; },
  has(target, key) { return (key in target) || (key in sandbox); },
});
sandbox.window = winProxy;
windowObj.window = winProxy;

// ---- load every module in page order; syntax + runtime load must succeed ----
for (const name of ORDER) {
  const src = fs.readFileSync(DIR + 'js/' + name + '.js', 'utf8');
  new vm.Script(src, { filename: name + '.js' });                 // syntax gate
  vm.runInContext(src, sandbox, { filename: name + '.js' });      // executes IIFEs / class defs
}
// i18n layer loads last on the page.
const i18nSrc = fs.readFileSync(DIR + 'js/i18n.js', 'utf8');
new vm.Script(i18nSrc, { filename: 'i18n.js' });
vm.runInContext(i18nSrc, sandbox, { filename: 'i18n.js' });

assert.ok(sandbox.window.GameData, 'GameData global present');
assert.equal(sandbox.window.CatBondPaintedRegions?.ids?.join(','),'home,sakura,creek,volcano,ruins',
  'Every one of the five exploration maps has distinct authored scenery');
const paintedSource=fs.readFileSync(DIR+'js/painted-regions.js','utf8');
for(const feature of ['function home(','function sakura(','function creek(','function volcano(','function ruins('])
  assert.ok(paintedSource.includes(feature),'Missing unique painted terrain for '+feature);
assert.equal(typeof sandbox.window.CatMotion?.draw,'function',
  'The original-watercolor motion renderer must load before yard, world and combat');
assert.ok(sandbox.window.CatMotion.scaleRatio<=.72
  &&sandbox.window.CatMotion.maxWorldScale<=.88,
  'All moving kittens must remain small relative to the game world');
assert.equal(sandbox.window.CatMotion.artStyle,'original-illustrated-25-breed',
  'No alternate vector/cartoony character style may replace the original kitten art');
assert.doesNotThrow(()=>sandbox.window.CatMotion.draw(canvasCtx,90,90,{
  species:sandbox.window.GameData.SPECIES[0],face:-1,t:1,
  pose:'run',motion:1,stride:1.3,scale:1
}), 'Animated world kittens draw as full-bodied animals in the canvas');
assert.ok(sandbox.window.Skills, 'Skills global present');
assert.ok(sandbox.window.Battle, 'Battle global present');
assert.ok(sandbox.window.CatBondI18n, 'Cat Bond i18n layer present');
assert.equal(sandbox.window.GameData.SPECIES.length, 25, '25 cat species');
const weights = sandbox.window.GameData.RARITY;
assert.deepEqual(['N', 'R', 'SR', 'SSR'].map(k => weights[k].weight), [68,24,7,1],
  'Base rare-cat odds should be intentionally lower than before');
assert.equal(['N', 'R', 'SR', 'SSR'].reduce((sum, k) => sum + weights[k].weight, 0), 100,
  'Rarity weights should sum to 100 for predictable base odds');
assert.equal(sandbox.window.Raising.config.PITY_CAP, 40, '40-pull SR pity protection must remain');
const duoSource=fs.readFileSync(DIR+'js/cat-relationships.js','utf8');
new vm.Script(duoSource,{filename:'cat-relationships.js'});
vm.runInContext(duoSource,sandbox,{filename:'cat-relationships.js'});
assert.ok(sandbox.window.CatRelations,'Signature relationship system loads');
const worldMapSource = fs.readFileSync(DIR+'js/worldmap.js','utf8');
assert.ok(worldMapSource.includes("kind:'secret'"),'Each region has a unique one-time landmark');
const qualityGame=fs.readFileSync(DIR+'js/game.js','utf8');
assert.ok(qualityGame.includes("querySelector('.mv-name')")&&qualityGame.includes("move-new-tag"),
  'Battle buttons show equipped skill names and newly learned skills');
assert.ok(fs.readFileSync(DIR+'js/scenery.js','utf8').includes('sceneIdentity('),
  'Different regions render actual authored animated landmarks');
assert.ok(fs.readFileSync(DIR+'js/cat-relationships.js','utf8').includes("'elec+fire'"),
  'Electric and fire form a real named elemental duo move');
assert.ok(worldMapSource.includes('sp: rollRegionCat()'),
  'Region spawns should use rarity-weighted encounters, not uniform legendary encounters');

// ---- boot the game the way main.js does (fire DOMContentLoaded) ----
const boot = listeners['win:DOMContentLoaded'];
assert.ok(typeof boot === 'function', 'main.js registered DOMContentLoaded');
boot();
const game = sandbox.window.__game;
assert.ok(game, 'Game instance created');
assert.equal(typeof game.refreshFirstQuest,'function','First session has a visible objective hint');

// start screen -> start the game (the intro-start click handler)
game.start();
const State = sandbox.window.State, UI = sandbox.window.UI, GameData = sandbox.window.GameData;
// Skill design: first battle is simple, first capture guarantees a new move.
// Ordinary and rare cats must not all start with the same fireball loadout.
const Skills=sandbox.window.Skills;
for(const id of ['tangyuan','doudou','xiaohui']){
  const kitten=State.makeCat(id,{affinity:20});
  const ownElement=Skills.elementOf(id);
  const before=Skills.learnableSkills(kitten);
  assert.ok(before.every(sk=>sk.element===ownElement),
    'Starter '+id+' begins with understandable own-element skills');
  Skills.ensureLoadout(kitten);
  const discovered=Skills.awakenFirstSkill(kitten);
  assert.ok(discovered,'First successful capture must reveal a new skill for '+id);
  assert.equal(discovered.element,Skills.SPLASH_ELEMENT[ownElement],
    'Skill discovery must reveal a DIFFERENT element');
  assert.equal(kitten.loadout[2],discovered.id,
    'The first discovered ability is already equipped to E');
  assert.equal(Skills.awakenFirstSkill(kitten),null,
    'The first-capture reward must be awarded only once per cat');
  assert.ok(Skills.progressionHint(kitten).length>5,'Next unlock must be visible');
}
const ordinary=State.makeCat('tangyuan',{affinity:40});
ordinary.level=8;Skills.ensureLoadout(ordinary);
assert.ok(Skills.skillById(ordinary.loadout[3])?.ultCost>0,
  'Lv8 + bond40 must unlock the ordinary cat elemental ultimate');
const legendary=State.makeCat('jinwu');
Skills.ensureLoadout(legendary);
assert.equal(legendary.loadout[3],'sunflare',
  'Legendary Fire cat must start with signature ultimate');
const legendaryThunder=State.makeCat('xianluo');
Skills.ensureLoadout(legendaryThunder);
assert.equal(legendaryThunder.loadout[3],'thunderYowl',
  'Epic electric cat must have unique elemental ultimate');
assert.notEqual(legendary.loadout[0],legendaryThunder.loadout[0],
  'Legendary and epic cats should have distinct normal attacks');


const earlyState=sandbox.window.State;
earlyState.S.cats=[earlyState.makeCat('tangyuan')];
earlyState.S.catchCount=0;
game.yard.startHideAndSeek();
assert.ok(game.yard.hide?.tutorial,'First find should be highlighted');
assert.equal(game.yard.hide.species.rarity,'N','First cat should be learnable');
assert.notEqual(game.yard.hide.species.id,'tangyuan','First catch should be a fresh breed');
game.yard.hide=null;
// New player discovery: duplicate common rolls must be diverted to unseen
// commons while a rare roll remains untouched (no SSR inflation).
const previousRoll=GameData.rollSpecies;
State.S.dex['tangyuan']=1;
State.S.catchCount=1;
GameData.rollSpecies=()=>GameData.speciesById('tangyuan');
game.yard.startHideAndSeek();
assert.equal(game.yard.hide.species.rarity,'N');
assert.ok(!State.S.dex[game.yard.hide.species.id],
  'Early repeated common must become a new common sighting');
game.yard.hide=null;
GameData.rollSpecies=()=>GameData.speciesById('jinwu');
game.yard.startHideAndSeek();
assert.equal(game.yard.hide.species.id,'jinwu',
  'Very rare encounters must NEVER be replaced by onboarding protections');
game.yard.hide=null;
GameData.rollSpecies=previousRoll;
State.S.catchCount=0;State.S.repeatSightings=0;
// Full cat rosters must NOT fill the yard or repeat species on screen.
// This also confirms every pre-existing individual is retained in its save.
const initialRoster=State.S.cats.slice();
const many=GameData.SPECIES.slice(0,11).flatMap(sp=>[
  State.makeCat(sp.id),State.makeCat(sp.id),State.makeCat(sp.id)
]);
State.S.cats=many;
game.yard.page=0;game.yard.rebuild();
assert.equal(State.S.cats.length,33,'Collecting duplicates does not erase saved individuals');
assert.ok(game.yard.entities.length<=6,'Desktop yard must show no more than six kittens');
assert.equal(new Set(game.yard.entities.map(e=>e.cat.species)).size,game.yard.entities.length,
  'Only one representative per breed appears in each yard batch');
assert.ok(game.yard.pageCount>=2,'Large collections use switchable visitor batches');
assert.equal(document.getElementById('yard-cat-switch').hidden,false,
  'Yard visitor rotation must be discoverable');
const oldFirst=game.yard.entities[0].cat.species;
game.yard.nextPage();
assert.notEqual(game.yard.entities[0].cat.species,oldFirst,'Next batch shows new breeds');
UI.openRoster();
const cardsHTML=document.getElementById('panel').innerHTML;
assert.equal((cardsHTML.match(/data-breed=/g)||[]).length,11,
  'Owned-cat menu groups duplicates into one card per breed');
UI.openBreedRoster(GameData.SPECIES[0]);
assert.ok(document.getElementById('panel').innerHTML.includes('data-cat-uid'),
  'Opening a breed still exposes individual cats for feeding, training and breeding');
UI.closeAll();
// Portrait capacity is stricter; mobile must not fill the entire canvas.
const origW=game.W,origH=game.H;
game.W=390;game.H=844;game.yard.page=0;game.yard.rebuild();
assert.ok(game.yard.entities.length<=4,'Portrait garden must display at most four kittens');
assert.ok(game.yard.entities.every(e=>e.x>=0&&e.x<=game.W&&e.y<=game.H),
  'Visitors must remain within the portrait canvas');
game.W=origW;game.H=origH;
State.S.cats=initialRoster;game.yard.page=0;game.yard.rebuild();

// Give the player a starter + a strong team, then run a real capture battle.
State.S.cats = [];
const starter = State.makeCat('tangyuan', { affinity: 60 });
starter.level = 40;
starter.stats = { pow: 200, agi: 120, vit: 200, cha: 80 };
State.S.cats.push(starter);
State.S.dex['tangyuan'] = 1;

const wild = GameData.speciesById('doudou');
const before = State.S.cats.length;
game.startBattle([starter], wild);
assert.equal(game.scene, 'battle', 'entered battle scene');
assert.ok(events.some(e => e.name === 'game_start'), 'game_start analytics fired');

// Drive the battle: force-defeat the wild pack, then let the loop end it.
const b = game.battle;
assert.ok(b && b.enemies.length >= 1, 'wild pack built');
const normalEnemy=b.enemies[0];
const normalScale=1+(normalEnemy.level-1)*0.08;
assert.equal(normalEnemy.maxhp, Math.round((140+wild.base.vit*7)*normalScale),
  'Normal battle HP must remain unchanged');
const eliteSpecies=GameData.speciesById('jinwu');
const eliteBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],eliteSpecies);
const eliteLead=eliteBattle.enemies[0];
const eliteScale=1+(eliteLead.level-1)*0.08;
assert.equal(eliteLead.maxhp,
  Math.round((140+eliteSpecies.base.vit*7)*(1+3*0.6)*eliteScale*1.22),
  'Legendary cat encounter should have extra defensive challenge');
assert.ok(eliteLead.dmg>(5+3*2.2)*eliteScale,
  'Legendary cat should hit harder than before');
let guard = 0;
while (!b.done && guard++ < 10000) {
  for (const e of b.enemies) { e.hp = 0; e.alive = false; }
  b.update(0.016);
}
assert.ok(b.done, 'battle resolved');
assert.equal(b.result, 'win', 'player won the capture');
game.endBattle();
assert.equal(State.S.cats.length, before + 1, 'captured cat added to roster');
assert.ok(events.some(e => e.name === 'game_complete'), 'game_complete analytics fired');
assert.ok(events.some(e => e.name === 'cat_capture'), 'cat_capture analytics fired');
assert.ok(events.some(e => e.name === 'bond_battle_grade'),'Battle grade event fired');
assert.equal(game.gradeBattle({team:[{hp:100,maxhp:100}],t:12,comboBest:10,perfectDodges:1}).grade,'S',
  'Swift, healthy, skillful battle merits S grade');
assert.equal(game.gradeBattle({team:[{hp:85,maxhp:100,alive:true}],t:12,comboBest:10,autoUsed:true}).grade,'A',
  'A normal good auto battle earns A, not automatic S');
assert.equal(game.gradeBattle({team:[{hp:98,maxhp:100,alive:true}],t:10,comboBest:19,autoUsed:true}).grade,'S',
  'An outstanding auto battle is still eligible for S');
assert.equal(game.gradeBattle({team:[{hp:70,maxhp:100,alive:true}],t:10,comboBest:19,autoUsed:true}).grade,'A',
  'A battered auto team cannot get S');
assert.equal(game.gradeBattle({team:[{hp:5,maxhp:100}],t:150,comboBest:0,perfectDodges:0}).grade,'C',
  'Slow battered capture without skill merits C grade');
assert.ok(document.getElementById('panel').innerHTML.includes('battle-grade'),
  'Capture result includes the earned grade and bonus');
// S-masteries are meaningful, breed-specific, saved achievements. The
// next rare encounter uses the permanent luck bonus; repeat wins cannot farm it.
const S=State.S;
const priorBadges={...(S.masteryBadges||{})};
const priorBest={...(S.bestGrades||{})};
const priorLures=S.luckLure||0;
const priorCatchCount=S.catchCount;
S.masteryBadges={};S.bestGrades={};
const masterCat=State.makeCat('doudou');
const rank={grade:'S'};
const firstMastery=game.recordBattleMastery(GameData.speciesById('doudou'),rank,masterCat);
assert.ok(firstMastery,'First S on a breed awards a Golden Paw');
assert.equal(firstMastery.status.medals,1);
assert.equal(S.masteryBadges.doudou,true,'Golden Paw stored per species');
assert.equal(S.bestGrades.doudou,'S','Best rank persisted in the codex');
assert.equal(masterCat.affinity,15,'First S improves the rescued cat bond');
assert.equal(S.luckLure,priorLures+1,'First S gives a useful rare-cat lure');
assert.equal(game.recordBattleMastery(GameData.speciesById('doudou'),{grade:'S'},masterCat),null,
  'Repeated S on the same breed cannot farm lures or mastery');
assert.equal(S.luckLure,priorLures+1,'Repeat S grants zero additional lures');
game.recordBattleMastery(GameData.speciesById('tangyuan'),{grade:'S'},State.makeCat('tangyuan'));
game.recordBattleMastery(GameData.speciesById('xiaohui'),{grade:'S'},State.makeCat('xiaohui'));
assert.equal(game.masteryStatus().medals,3);
assert.ok(Math.abs(game.masteryStatus().luckBonus-.12)<1e-8,
  'Three different S ranks unlock a modest permanent rare-sighting bonus');
UI.openDex();
const dexHTML=document.getElementById('panel').innerHTML;
assert.ok(dexHTML.includes('golden-paw-stamp'),'Codex must show earned S medals');
assert.ok(!dexHTML.includes('解锁隐藏传说种'),'Codex must not advertise fictional unlocks');
UI.closeAll();
const originalRoll=GameData.rollSpecies;
let effectiveLuck=-1;
S.luckLure=0;
S.catchCount=6;
GameData.rollSpecies=luck=>{
  effectiveLuck=luck;
  return GameData.speciesById('jinwu');
};
game.yard.startHideAndSeek();
assert.ok(effectiveLuck>=.12,'Permanent medals must improve actual world encounter weighting');
game.yard.hide=null;
GameData.rollSpecies=originalRoll;
S.masteryBadges=priorBadges;S.bestGrades=priorBest;S.luckLure=priorLures;
S.catchCount=priorCatchCount;

// Golden Paw rematch is an intentional challenge, not an unlimited
// source of duplicate cats or currency.
const targetBreed=GameData.speciesById('doudou');
const beforeMasteryRoster=State.S.cats.length;
const beforeMasteryCatches=State.S.catchCount;
const beforeMasteryCoins=State.S.coins;
const beforeMasteryDex=State.S.dex.doudou;
assert.equal(game.startMasteryChallenge(targetBreed),true);
assert.equal(game.battle,null,'A rematch must show battle-mode selection before combat starts');
assert.ok(document.querySelector('#panel #bp-go'),'A rematch needs a clear pre-battle choice');
document.getElementById('bp-go').click();
assert.equal(game.battle.masteryChallenge,true);
const masteryBattle=game.battle;
masteryBattle.team.forEach(f=>{f.hp=f.maxhp;});
masteryBattle.t=10;masteryBattle.comboBest=8;
masteryBattle.finish(true);game.endBattle();
assert.equal(State.S.cats.length,beforeMasteryRoster,'Rematch does not add duplicate cats');
assert.equal(State.S.catchCount,beforeMasteryCatches,'Rematch must not count as another capture');
assert.equal(State.S.dex.doudou,beforeMasteryDex,'Rematch does not inflate codex');
assert.equal(State.S.coins,beforeMasteryCoins,'Rematch does not farm normal capture coins');
assert.ok(document.getElementById('panel').innerHTML.includes('mc-retry'),
  'Victory shows a replay button, so S-rank medals are attainable without RNG');
UI.closeAll();
// Later encounters of a breed with two residents become helpful reunions.
State.S.cats.push(State.makeCat('doudou'));
const previousDupRoster=State.S.cats.length;
const prevTreats=State.S.treats;
game.startBattle([starter],targetBreed);
const duplicateBattle=game.battle;
duplicateBattle.team.forEach(f=>{f.hp=f.maxhp;});
duplicateBattle.t=30;duplicateBattle.comboBest=1;
duplicateBattle.finish(true);game.endBattle();
assert.equal(State.S.cats.length,previousDupRoster,
  'After two residents, repeat capture should nurture them, not add another clone');
assert.ok(document.getElementById('panel').innerHTML.includes('reunion-reward'),
  'Repeat catch result should communicate the useful bonding reward');
assert.ok(State.S.treats>=prevTreats+2,'Repeated catch awards treats instead of clutter');
assert.ok(events.some(e=>e.name==='bond_repeat_reunion'),
  'Reunion analytics distinguishes real new catches from duplicates');
UI.closeAll();

// One-time collection milestones reward actual new species, not repeated grinding.
const priorCoins=State.S.coins, priorTreats=State.S.treats, priorMilestones=[...(State.S.collectionMilestones||[])];
State.S.dex['xiaohui']=1;
const milestones=game.grantCollectionMilestones();
assert.equal(milestones.length,1,'Third distinct breed grants exactly one milestone');
assert.equal(milestones[0].count,3);
assert.equal(State.S.coins,priorCoins+60);
assert.equal(State.S.treats,priorTreats+2);
assert.equal(game.grantCollectionMilestones().length,0,'Collection rewards cannot be claimed twice');
assert.equal(game.collectionStatus().next,5,'Next collection goal progresses');
assert.ok(events.some(e=>e.name==='bond_collection_milestone'));
delete State.S.dex['xiaohui'];State.S.coins=priorCoins;State.S.treats=priorTreats;
State.S.collectionMilestones=priorMilestones;

// Bonding milestones require actual affection interactions and only pay once.
const oldPets=State.S.petCount,oldBond=State.S.bondingRewards?.slice()||[];
const bondCoins=State.S.coins,bondTreats=State.S.treats;
State.S.petCount=3;
const bondRewards=game.grantBondingRewards();
assert.equal(bondRewards.length,1,'Three real pet interactions grant first bonding reward');
assert.equal(bondRewards[0].coins,35);
assert.equal(State.S.coins,bondCoins+35);
assert.equal(State.S.treats,bondTreats+2);
assert.equal(game.grantBondingRewards().length,0,'Bonding milestone can only be claimed once');
const adventure=game.adventureStatus();
assert.ok(adventure.totalRegions>=5&&adventure.unlocked>=1,'Explore track uses real world unlocks');
UI.openJourney();
const journeyHTML=document.getElementById('panel').innerHTML;
assert.ok(['journey-collect','journey-bond','journey-workshop','journey-explore'].every(x=>journeyHTML.includes(x)),
  'Adventures must offer collecting, bonding and exploration actions');
UI.closeAll();
State.S.petCount=oldPets;State.S.bondingRewards=oldBond;
State.S.coins=bondCoins;State.S.treats=bondTreats;

// ---- loss path fires game_over ----
events.length = 0;
const weak = State.makeCat('nainai', { affinity: 0 });
weak.stats = { pow: 1, agi: 1, vit: 1, cha: 1 }; weak.level = 1;
game.startBattle([weak], GameData.speciesById('jinwu'));
const b2 = game.battle;
let g2 = 0;
while (!b2.done && g2++ < 20000) {
  for (const f of b2.team) { f.hp = 0; f.alive = false; }
  b2.update(0.016);
}
game.endBattle();
assert.ok(events.some(e => e.name === 'game_over'), 'game_over analytics fired on loss');

// ---- offline visitor gifts: never stringify an object into [object Object] ----
const welcome = {
  minutes: 120, capped: false, produced: {}, gains: { coins: 21, fish: 1, yarn: 3 },
  visitors: [
    { name: '汤圆', gift: { coins: 12, fish: 1, yarn: 3 }, rare: false },
    { name: '豆豆', gift: { coins: 9 }, rare: true },
    { name: '小灰', gift: {}, rare: false },
  ],
};
UI.openWelcomeBack(welcome);
const welcomeHtml = document.getElementById('panel').innerHTML;
assert.ok(welcomeHtml.includes('<b>汤圆</b> 来访 · 留下 🪙+12 🐟+1 🧶+3'), 'Visitor gifts should list resource icons and exact quantities');
assert.ok(welcomeHtml.includes('<b>豆豆</b> 来访 · 留下 🪙+9 ✨稀客!'), 'Rare visitor gift should also render correctly');
assert.ok(welcomeHtml.includes('<b>小灰</b> 来访</div>'), 'Empty visitor gifts must not show a placeholder');
assert.ok(!welcomeHtml.includes('[object Object]'), 'Welcome-back panel must not display object Object');
UI.closeAll();

// ---- bilingual layer: representative ZH strings must resolve to pure English ----
const tr = sandbox.window.CatBondI18n.translate;
const enVisit=tr('汤圆 来访 · 留下 🪙+12 🐟+1 🧶+3');
assert.match(enVisit, /Tangyuan/, 'Visitor name translates into English');
assert.match(enVisit, /visited|left/, 'Visitor action translates into English');
assert.ok(enVisit.includes('🪙+12') && enVisit.includes('🐟+1') && enVisit.includes('🧶+3'), 'Gift amounts survive English conversion');

const HAN = /[一-鿿]/;
for (const [zh, mustInclude] of [
  ['庭院', 'Yard'],
  ['野生猫猫', 'Wild cat'],
  ['开始冒险 🐱', 'Start'],
  ['必杀能量不足', 'ultimate'],
  ['升级成功！', 'Upgrade'],
  ['选择你的第一只猫猫', 'Choose your first cat'],
]) {
  const out = tr(zh);
  assert.ok(!HAN.test(out), 'no residual Chinese in: ' + zh + ' -> ' + out);
  assert.ok(out.toLowerCase().includes(mustInclude.toLowerCase()), 'translation of ' + zh + ' should include "' + mustInclude + '" (got: ' + out + ')');
}
// In Chinese mode the mode-aware translate() is a pass-through no-op.
sandbox.window.MorrowwishI18n.get = () => 'zh';
assert.equal(tr('庭院'), '庭院', 'Chinese mode leaves text untouched');

// Regression (live DOM path): a text node first SEEN by the layer while the page
// is in Chinese mode must still flip to English after a zh->en toggle. Before the
// fix, capture used the mode-aware translate() and poisoned the English form, so
// the toggle did nothing. Exercise the real render()/handleTextNode path.
const render = sandbox.window.CatBondI18n.render;
const zhNode = sandbox.document.createTextNode('🏡 庭院');
sandbox.document.body.appendChild(zhNode);
render();                                   // first seen in zh mode
assert.equal(zhNode.nodeValue, '🏡 庭院', 'zh-mode render leaves the node in Chinese');
sandbox.window.MorrowwishI18n.get = () => 'en';
render();                                   // toggle to English
assert.ok(!HAN.test(zhNode.nodeValue) && zhNode.nodeValue.includes('Yard'),
  'node first seen in zh renders English after toggle (got: ' + zhNode.nodeValue + ')');
sandbox.window.MorrowwishI18n.get = () => 'zh';
render();                                   // toggle back restores Chinese
assert.equal(zhNode.nodeValue, '🏡 庭院', 'toggling back to Chinese restores the original text');
sandbox.window.MorrowwishI18n.get = () => 'en';

console.log('Cat Bond: 13 modules loaded, starter + capture win/loss driven, game_start/complete/over/cat_capture analytics, and bilingual ZH->EN layer (incl. live zh<->en toggle) PASS.');
