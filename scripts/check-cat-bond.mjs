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
const ORDER = ['vfx','ward-art','ult-vfx','skill-fx','catart','cute-cats','real-kittens','data','running-cats','skills','growth','adult-art','state','cat-relationships','raising','painted-regions','scenery','world','worldmap','duo-signatures','duo-hero','battle','duo-bond','ui','game','main'];

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
    replaceChildren() { this.children = []; this.childNodes = []; },
    setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; },
    hasAttribute(k) { return k in this.attributes; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(t, cb) { listeners[id + ':' + t] = cb; }, removeEventListener: nop,
    getContext: () => canvasCtx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
    // Game UI builds markup via innerHTML then querySelector('canvas'); hand back
    // a canvas-capable stub so CatArt.renderCatThumb etc. never hit null.
    querySelector: (sel) => (/canvas/i.test(sel) ? makeEl('qs-canvas') : makeEl('qs-' + sel)),
    querySelectorAll: () => [], closest: () => null, focus: nop,
    // UI wires dialog buttons via onclick; tests invoke .click() to drive them.
    onclick: null, click() { if (typeof this.onclick === 'function') this.onclick({ target: this, preventDefault: nop, stopPropagation: nop }); },
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
  // Resolve a trailing "#id" selector (e.g. "#panel #bp-go") via getElementById so
  // tests that probe freshly-rendered dialog buttons find a real stub node.
  querySelector(sel) { const m = /#([\w-]+)\s*$/.exec(sel || ''); return m ? this.getElementById(m[1]) : null; },
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
// Every breed's lore must be translated in English battle, starter and dex
// panels, not just its displayed nickname. Seven new species were missing.
const allBreeds=sandbox.window.GameData.SPECIES;
assert.equal(allBreeds.length,32,'full breed roster remains intact');
for(const breed of allBreeds){
  assert.equal(typeof sandbox.window.CatBondI18n?.dict?.[breed.desc],'string',
    'English breed description missing for '+breed.id);
}

// WARD-ART REGRESSION: the shield rim must be at the kitten's PLANTED PAWS,
// not 26px too high across every device / ally / enemy. Growth multiplies
// both the rendered cat and shield by exactly the same scale.
// Standardized local hit feedback: every hit tier produces a different
// bounded effect mix without painting a full-screen frame.
const effectTypes=['light','heavy','crit','stagger','kill','heal','guard','reflect','shieldBreak'];
const tierFx=new sandbox.window.VFX();
for(const type of effectTypes){
  const before=tierFx.fx.length;
  assert.doesNotThrow(()=>tierFx.impactType(180,245,type,{color:'#ffe19a'}));
  assert.ok(tierFx.fx.length>before,'hit tier generated particles: '+type);
}
assert.ok(tierFx.fx.length<160,'hit feedback cannot exhaust the VFX budget');
assert.ok(tierFx.fx.some(q=>q.type==='guardShards'),
  'single-use protect must fracture into localized shards, not a fullscreen wash');
// Rendering a scene more often must NOT modify combat state. Text follows dt,
// not refresh rate; this is especially important on 120Hz phones.
const pureFx=new sandbox.window.VFX();
pureFx.text(130,175,'+20','#b7eac7',12);
const textMark=pureFx.fx.find(q=>q.type==='text');
assert.ok(textMark);
const initialY=textMark.y;
pureFx.draw(canvasCtx);pureFx.draw(canvasCtx);
assert.equal(textMark.y,initialY,'VFX.draw cannot advance a text animation');
pureFx.update(.10);
assert.ok(Math.abs(textMark.y-(initialY-3.4))<1e-6,
  'VFX text moves via real elapsed time, not frame count');
pureFx.draw(canvasCtx);
assert.ok(Math.abs(textMark.y-(initialY-3.4))<1e-6,
  'extra draw does not shift a popup again');
const supportFx=new sandbox.window.VFX();
for(const type of ['cleanse','barrier','wardFade']){
  const before=supportFx.fx.length;
  supportFx.impactType(170,200,type);
  assert.ok(supportFx.fx.length>before,
    'support transition must be visible: '+type);
}
assert.equal(typeof sandbox.window.CatBondWardArt?.draw,'function',
  'three ward VFX must use the same live battle renderer as the kittens');
for(const ward of ['shieldT','protectT','reflectT']){
  for(const stage of [0,1,2]){
    for(const layer of ['back','front']){
      const cat={stage},fighter={cat,[ward]:1},origin=[];
      const capture=new Proxy(canvasCtx,{get(target,key){
        if(key==='translate')return(x,y)=>origin.push({x,y});
        return target[key];
      }});
      assert.equal(sandbox.window.CatBondWardArt.draw(capture,fighter,136,281,1.1,1.04,layer),true);
      const effectiveScale=1.04*(sandbox.window.Growth?.visual?.(cat)?.scale||1);
      assert.ok(origin.length>0,ward+' must issue a translate on '+layer);
      assert.ok(Math.abs(origin[0].x-136)<1e-5);
      assert.ok(Math.abs(origin[0].y-(281+33*effectiveScale))<.01,
        ward+' '+layer+' stage '+stage+' must touch planted kitten paws');
    }
  }
}
assert.equal(sandbox.window.CatBondWardArt.draw(canvasCtx,{shieldT:0},136,281,1,1,'front'),false,
  'inactive shield must never appear');

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
assert.equal(sandbox.window.CatBondAdultArt?.sourceKind,'original-watercolor-atlas',
  'Adult growth must preserve the same authentic watercolor breed art used by kittens');
assert.equal(sandbox.window.CatBondAdultArt?.preservesOriginalProportions,true,
  'Growth must not stretch the cat silhouette or replace its face');
assert.equal(sandbox.window.CatBondAdultArt?.matureArtIsSeparateImage,false,
  'Never substitute a procedural SVG for the painted cat when it matures');
const growthSource=fs.readFileSync(DIR+'js/adult-art.js','utf8');
assert.ok(!growthSource.includes('data:image/svg+xml')&&!growthSource.includes('drawImage(entry.img'),
  'Reject the stretched procedural adult renderer seen in Moonshadow Ruins');

assert.doesNotThrow(()=>sandbox.window.CatMotion.draw(canvasCtx,90,90,{
  species:sandbox.window.GameData.SPECIES[0],face:-1,t:1,
  pose:'run',motion:1,stride:1.3,scale:1
}), 'Animated world kittens draw as full-bodied animals in the canvas');
assert.ok(sandbox.window.Skills, 'Skills global present');
assert.ok(sandbox.window.Battle, 'Battle global present');
assert.ok(sandbox.window.CatBondI18n, 'Cat Bond i18n layer present');
assert.equal(sandbox.window.GameData.SPECIES.length, 32, '32 collectible cat species');
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
// Shield/Protect/Reflect cannot persist beyond their timers, and a broken
// or expired shield should dissolve ONCE, never flash repeatedly in the arena.
const expireBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('tangyuan')],GameData.speciesById('doudou'));
const expiring=expireBattle.me();
expiring.shieldT=.01;expiring.protectT=0;expiring.reflectT=0;
const beforeExpire=expireBattle.vfx.fx.length;
expireBattle.tickWards(expiring,.05);
assert.equal(expiring.shieldT,0,'expired barrier is no longer active');
assert.ok(expireBattle.vfx.fx.length>beforeExpire,
  'barrier expiry must create a localized dissolve');
const afterExpire=expireBattle.vfx.fx.length;
expireBattle.tickWards(expiring,.05);
assert.equal(expireBattle.vfx.fx.length,afterExpire,
  'expired barriers must not spray repeated particles');

// DIRECTIONAL REFLECT REGRESSION: half speed, front-only bounce, rear vulnerability,
// and a fresh shield cast must use the latest direction (not a previous cast).
const directionalBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('tangyuan')],GameData.speciesById('doudou'));
const wardCat=directionalBattle.me();
wardCat.inv=0;wardCat.flash=0;wardCat.shieldT=0;wardCat.protectT=0;
wardCat._moveFacing=0;
assert.equal(directionalBattle.castWard(wardCat,'reflect'),true);
assert.equal(wardCat.rootT,0,'reflect stance must permit half-speed movement');
assert.ok(Math.abs(directionalBattle.moveMul(wardCat)-.5)<1e-6,
  'reflect stance must reduce speed by 50%');
assert.equal(directionalBattle.reflectCovers(wardCat,wardCat.x+100,wardCat.y),true,
  'reflect wall covers its facing direction');
assert.equal(directionalBattle.reflectCovers(wardCat,wardCat.x-100,wardCat.y),false,
  'reflect wall must not cover behind the cat');
const incomingFront={x:wardCat.x+20,y:wardCat.y,vx:-200,vy:0,owner:'wild',life:2};
const frontResult=directionalBattle.resolveHit(wardCat,'wild',{element:'fire'},4,
  incomingFront.x,incomingFront.y,incomingFront);
assert.equal(frontResult.reflected,true,'front projectile must bounce');
assert.equal(incomingFront.owner,'me','reflected projectile must change owner');
const incomingRear={x:wardCat.x-20,y:wardCat.y,vx:200,vy:0,owner:'wild',life:2};
const rearResult=directionalBattle.resolveHit(wardCat,'wild',{element:'fire'},4,
  incomingRear.x,incomingRear.y,incomingRear);
assert.equal(rearResult.reflected,false,'rear projectile must not bounce');
assert.equal(incomingRear.owner,'wild','rear projectile must retain owner');
wardCat.reflectT=0;wardCat._moveFacing=Math.PI;
assert.equal(directionalBattle.castWard(wardCat,'reflect'),true);
assert.ok(Math.abs(wardCat._reflectFacing-Math.PI)<1e-6,
  'recast must face the new travel direction');
assert.equal(directionalBattle.reflectCovers(wardCat,wardCat.x-100,wardCat.y),true);
wardCat.reflectT=0;
assert.equal(directionalBattle.moveMul(wardCat),1,
  'movement speed must recover after reflect expires');

const skillFx=sandbox.window.CatBondSkillFX;
// One-use Guard Stance must stop ONE real contact, shatter, then enter
// vulnerability. A second hit must be able to land, not become 0.8s god mode.
const guardBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('yuelian',{level:8,affinity:40})],
  GameData.speciesById('doudou'));
guardBattle.coach=null;
const guarded=guardBattle.me();
guarded.protectT=.8;guarded._protectVuln=1.2;
guarded.inv=0;guarded.flash=0;
const guardHp=guarded.hp;
const firstBlock=guardBattle.resolveHit(guarded,'wild',
  {id:'wildStrike',kind:'melee',element:'grass'},10,guarded.x,guarded.y);
assert.equal(firstBlock.blocked,true,'Guard Stance blocks the next strike');
assert.equal(guarded.hp,guardHp,'the guarded contact deals zero HP damage');
assert.equal(guarded.protectT,0,'one-hit guard must be consumed');
assert.ok(guarded.vulnerableT>=1.2,'guard starts its vulnerable recovery');
assert.ok(guardBattle.vfx.fx.some(x=>x.type==='guardShards'),
  'guard impact plays one localized shield-break animation');
const followup=guardBattle.resolveHit(guarded,'wild',
  {id:'wildStrike',kind:'melee',element:'grass'},10,guarded.x,guarded.y);
assert.equal(followup.blocked,false,'the second blow can land after guard breaks');
assert.ok(guarded.hp<guardHp,'post-block recovery is genuinely vulnerable');
 
// Heavy-tag skills must read as weight even if difficulty settings reduce
// the damage number; striking an ALREADY staggered target earns crit visuals.
const impactBattle=new sandbox.window.Battle.CaptureBattle(game,
 [State.makeCat('jinwu',{level:8,affinity:40})],GameData.speciesById('doudou'));
impactBattle.coach=null;
const styles=[],impactFn=impactBattle.vfx.impactType;
impactBattle.vfx.impactType=function(x,y,tier,opts){
  styles.push(tier);return impactFn.call(this,x,y,tier,opts);
};
const targetImpact=impactBattle.enemies[0];
targetImpact.inv=0;targetImpact.flash=0;targetImpact.staggerT=0;
impactBattle.resolveHit(targetImpact,'me',
  {id:'emberClaw',kind:'melee',heavy:true,element:'fire'},8,
  targetImpact.x,targetImpact.y);
assert.ok(styles.includes('heavy'),'heavy melee has its own impact tier');
targetImpact.flash=0;targetImpact.inv=0;targetImpact.staggerT=1.2;
impactBattle.resolveHit(targetImpact,'me',
  {id:'emberClaw',kind:'melee',heavy:true,element:'fire'},8,
  targetImpact.x,targetImpact.y);
assert.ok(styles.includes('crit'),'existing stagger vulnerability uses crit tier');
assert.ok(impactBattle.floaters.some(f=>f.size===21&&f.color==='#ffe2a2'),
  'stagger critical numbers must visually pop gold instead of standard white');
assert.ok(impactBattle.floaters.some(f=>f.max===.62),
  'damage popups have normalized timing for animation across frame rates');

// Damage-vulnerability balance: ordinary Q/E should not explode under layered debuffs.
assert.equal(Skills.TAG_INFO.expose.dmgTaken,1.2,'expose must remain a modest +20%');
assert.equal(Skills.TAG_INFO.rust.dmgTaken,1.12,'rust must remain a modest +12%');
// BASE DAMAGE BALANCE: fighter strength 36 should start near 19.34 attack,
// rather than the prior 22.46, before bond/difficulty/skill modifiers.
const baseFighterBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('tangyuan')],GameData.speciesById('doudou'));
const baseFighter=baseFighterBattle.me();
const basePow=baseFighter.cat.stats.pow;
const baseSpeedExpected=120*(1+Math.min(.20,Math.max(0,baseFighter.cat.stats.agi||0)*.0035));
assert.ok(Math.abs(baseFighter.speed-baseSpeedExpected)<1e-9,
  'AGI move bonus uses 0.35% per point, capped at +20%');
const fastCat=State.makeCat('tangyuan');
fastCat.stats={...fastCat.stats,agi:200};
const fastBattle=new sandbox.window.Battle.CaptureBattle(game,
  [fastCat],GameData.speciesById('doudou'));
assert.ok(fastBattle.me().speed<=144+1e-9,
  'even extremely high AGI cannot increase run speed above 120%');
const baseExpected=(6+basePow*.7)*(baseFighter.bond.dmgMult||1)*.62;
assert.ok(Math.abs(baseFighter.dmg-baseExpected)<1e-9,
  'player base attack uses the toned-down 0.62 coefficient');

const damageBalance=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('tangyuan')],GameData.speciesById('doudou'));
damageBalance.coach=null;
damageBalance.levelSuppression=1;
damageBalance.combo=0;
const balanceEnemy=damageBalance.enemies[0];
balanceEnemy.maxhp=10000;balanceEnemy.hp=10000;balanceEnemy.alive=true;
balanceEnemy.status={expose:4,rust:4};
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,true);
assert.ok(Math.abs((10000-balanceEnemy.hp)-118.8)<.001,
  'expose +20% and rust +12% stack additively, then player damage is scaled to 90%');
balanceEnemy.hp=1000;balanceEnemy.flash=0;
balanceEnemy.status={};
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,false);
assert.ok((1000-balanceEnemy.hp)<160,
  'low-health execution must no longer inflate a 100-base Q/E hit above 160');
balanceEnemy.hp=1000;balanceEnemy.flash=0;balanceEnemy.role='boss';damageBalance.combo=0;
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,false);
assert.ok(Math.abs((1000-balanceEnemy.hp)-90)<.001,
  'explicit boss role ignores automatic low-HP execute bonus');
balanceEnemy.hp=1000;balanceEnemy.flash=0;balanceEnemy.role='elite';damageBalance.combo=0;
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,false);
assert.ok(Math.abs((1000-balanceEnemy.hp)-108)<.001,
  'elite execution is fixed +20% rather than escalating toward +55%');
balanceEnemy.hp=100;balanceEnemy.flash=0;damageBalance.combo=0;
damageBalance.hurtEnemy(balanceEnemy,30,balanceEnemy.x,balanceEnemy.y,false);
assert.ok(Math.abs((100-balanceEnemy.hp)-32.4)<.001,
  'even near zero HP elite execute remains a fixed +20%');
balanceEnemy.role='boss';
// Audited damage buckets: 100 raw x [1 + .30 stagger + .12 armor +
// .15 combo] x .9 = 141.3, NOT a stack of four multipliers.
balanceEnemy.hp=10000;balanceEnemy.maxhp=10000;balanceEnemy.flash=0;
balanceEnemy.status={rust:10};balanceEnemy.staggerT=2;damageBalance.combo=50;
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,false);
assert.ok(Math.abs((10000-balanceEnemy.hp)-141.3)<.001,
  'stagger, armor break and capped 15% combo are one additive hit bucket');
balanceEnemy.hp=10000;balanceEnemy.flash=0;
balanceEnemy.status={rust:10,expose:4};damageBalance.combo=50;
damageBalance.hurtEnemy(balanceEnemy,100,balanceEnemy.x,balanceEnemy.y,false);
assert.ok(Math.abs((10000-balanceEnemy.hp)-148.5)<.001,
  'vulnerability caps at +50%, combo caps at +15%');
assert.ok(damageBalance.comboMult()<=1.15,'combo never exceeds +15%');
const playerVulnerable=damageBalance.me();
playerVulnerable.status={expose:4,rust:8};
const incomingDamage=damageBalance.applyEnemyHitEffects(playerVulnerable,{element:null},100,
  playerVulnerable.x,playerVulnerable.y);
assert.ok(Math.abs(incomingDamage-130)<.001,
  'incoming expose/rust damage is additive and capped for player cats too');
const statusEnemy=damageBalance.enemies[0];
statusEnemy.status={burn:3,soak:3,shock:3,oil:3,chill:3,expose:3,rust:3};
statusEnemy.tags=Object.keys(statusEnemy.status);
const basicDmg=damageBalance.applyHitEffects(statusEnemy,{isBasic:true,element:null},100,
  statusEnemy.x,statusEnemy.y);
assert.ok(basicDmg<=130+1e-9,'basic status setup bonus caps at +30%');
const baseBuffCat=damageBalance.me();
baseBuffCat.damageBoostT=1;baseBuffCat.kneadStacks=4;baseBuffCat.weakened=false;
assert.ok(Math.abs(damageBalance.outgoingBuffMult(baseBuffCat)-1.73)<1e-9,
  'attack buff +25% and four knead stacks +48% add to +73%');
baseBuffCat.weakened=true;
assert.ok(Math.abs(damageBalance.outgoingBuffMult(baseBuffCat)-.865)<1e-9,
  'weaken halves outgoing damage after additive positive buffs');
const battleSource=fs.readFileSync(DIR+'js/battle.js','utf8');
assert.ok(battleSource.includes('vulnerabilityBonus += 0.30') && !battleSource.includes('target.staggerT > 0) dmg *= 1.3'),
  'stagger belongs to the additive vulnerability bucket, not a separate multiplier');

// Regular Q/E cause armor break, never poise drain or Stagger. Dedicated
// 泰山压顶 keeps the three-second Stagger window and visible countdown.
assert.equal(Skills.TAG_INFO.rust.ttl,10,'armor break persists for ten seconds');
assert.equal(Skills.TAG_INFO.rust.dps,0,'armor break is not an added DOT');
const poiseBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('tangyuan')],GameData.speciesById('doudou'));
poiseBattle.coach=null;
const poiseEnemy=poiseBattle.enemies[0];
poiseEnemy.inv=0;poiseEnemy.flash=0;
poiseEnemy.poise=1;poiseEnemy.staggerT=0;
poiseBattle.resolveHit(poiseEnemy,'me',
  {id:'emberClaw',kind:'melee',element:'fire',power:1.3},10,
  poiseEnemy.x,poiseEnemy.y);
assert.equal(poiseEnemy.staggerT,0,'ordinary Q/E cannot trigger stagger');
assert.equal(poiseEnemy.poise,1,'ordinary Q/E cannot drain poise');
assert.equal(poiseEnemy.status.rust,10,'ordinary Q/E applies ten-second armor break');
poiseEnemy.flash=0;poiseEnemy.inv=0;
const slamCat=poiseBattle.me();
slamCat._leapTo={x:poiseEnemy.x,y:poiseEnemy.y};
slamCat._leapR=54;slamCat._leapDmg=10;slamCat._leapCol='#7ee787';
slamCat._leapSkill={id:'quakeStomp',kind:'leap',element:'grass',tags:['stagger']};
poiseBattle.leapLand(slamCat);
assert.equal(poiseEnemy.staggerT,3,'dedicated stagger slam lasts three seconds');
assert.equal(poiseEnemy.poise,0,'dedicated stagger visibly empties the poise gauge');
poiseEnemy.staggerT=0;
poiseEnemy.poise=0;
poiseEnemy.poise+=poiseEnemy.poiseMax/3; // one second of post-stagger recovery
assert.ok(poiseEnemy.poise<poiseEnemy.poiseMax,'poise recovery is gradual, not an instant refill');
poiseEnemy.poise=0;
poiseEnemy.staggerT=3;

const gaugeText=[];
const gaugeCtx=new Proxy(canvasCtx,{get(target,key){
  if(key==='fillText')return label=>gaugeText.push(String(label));
  return target[key];
}});
poiseBattle.hpTag(gaugeCtx,poiseEnemy.x,poiseEnemy.y-42,.8,'#aaaaaa',
  'Wild Cat',{current:poiseEnemy.poise,max:poiseEnemy.poiseMax,stagger:poiseEnemy.staggerT});
assert.ok(gaugeText.some(x=>x.includes('虚弱 3.0s')),
  'enemy poise gauge must display stagger countdown');
assert.ok(battleSource.includes('const amount=broken?0:'),
  'stagger empties the gauge rather than drawing the countdown as remaining poise');
poiseEnemy.staggerT=0;
gaugeText.length=0;
poiseBattle.hpTag(gaugeCtx,poiseEnemy.x,poiseEnemy.y-42,.8,'#aaaaaa',
  'Wild Cat',{current:poiseEnemy.poiseMax*.3,max:poiseEnemy.poiseMax,stagger:0});
assert.ok(gaugeText.includes('韧性'),'enemy poise gauge must show toughness label');
gaugeText.length=0;
poiseBattle.hpTag(gaugeCtx,poiseEnemy.x,poiseEnemy.y-42,.8,'#aaaaaa','Friendly Cat');
assert.ok(!gaugeText.includes('韧性'),'normal HP labels should not gain enemy poise gauge');

// Even legacy 'always basic' gambits cannot prevent adaptive ranged skills.
const prismAutoBattle=new sandbox.window.Battle.CaptureBattle(game,
  [State.makeCat('yinghua')],GameData.speciesById('doudou'));
prismAutoBattle.coach=null;
const prismCat=prismAutoBattle.me(),prismTarget=prismAutoBattle.enemies[0];
prismCat.qSkill=Skills.skillById('prismBeam');
prismCat.cd.q=0;
prismCat.cat.gambits=[{cond:'always',act:'basic'}];
prismTarget.x=prismCat.x+480;prismTarget.y=prismCat.y;
prismAutoBattle.evalGambits(prismCat,prismTarget,480,null,Infinity);
assert.ok(prismCat.cd.q>0,
  'adaptive AI casts ready prism beam at 480px despite legacy basic gambit');
assert.equal(prismCat.cat.gambits[0].act,'basic',
  'existing saved gambit data is preserved without being executed');

assert.ok(skillFx,'skill-signature renderers must load');
const signatureIDs=Array.from(skillFx.ids);
const normalIDs=Skills.SKILLS.filter(sk=>!sk.ultCost).map(sk=>sk.id);
// The invariant is 1:1 coverage (every non-ult skill has a unique VFX signature, none
// omitted) — derived from the live roster, not a brittle hard-coded count, so adding
// skills (incl. the #56 generic element-template kit) can't silently skip VFX.
const expectedN=normalIDs.length;
assert.ok(expectedN>=40,'skill list keeps at least the 40 base normal moves ('+expectedN+')');
assert.equal(signatureIDs.length,expectedN,'all normal skills must have VFX');
assert.equal(new Set(signatureIDs).size,expectedN,'each signature id must be unique');
assert.deepEqual([...signatureIDs].sort(),[...normalIDs].sort(),
  'new moves (including Knead + generic element templates) may not be omitted from VFX registry');
for(const id of signatureIDs){
  const skill=Skills.skillById(id);
  assert.ok(skill&&!(skill.ultCost>0),'normal skill has registered FX: '+id);
  const example={kind:'signatureCast',skillId:id,x:220,y:260,angle:0,
    life:.2,max:.4};
  assert.doesNotThrow(()=>skillFx.draw(canvasCtx,example,.25),
    'unique cast must draw without a canvas error: '+id);
  const impact={...example,kind:'signatureHit',life:.15,max:.3};
  assert.doesNotThrow(()=>skillFx.draw(canvasCtx,impact,.3),
    'unique hit must draw without a canvas error: '+id);
}
assert.equal(skillFx.drawStatus(canvasCtx,{x:0,y:0,status:{shock:1,burn:2,expose:3}},1),true,
  'persistent status overlays render for ongoing debuffs');
for(const tag of Object.keys(Skills.TAG_INFO)){
  assert.equal(skillFx.drawStatus(canvasCtx,{x:120,y:180,status:{[tag]:2}},1),true,
    'missing localized battle status symbol: '+tag);
}
assert.equal(skillFx.drawStatus(canvasCtx,{
 x:120,y:180,status:{},kneadStacks:4,kneadT:3},1),true,
 'Knead buffs require on-cat paw-pad stack feedback');
assert.equal(skillFx.drawStatus(canvasCtx,{x:120,y:180,status:{}},1),false,
 'no phantom status VFX on a healthy unbuffed cat');

 

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
// Slot 0 is the fixed innate cat-toy toss for every cat (null in loadout); their
// distinct identity now lives in the equipped Q skill (slot 1).
assert.equal(legendary.loadout[0],null,'Basic (slot 0) is the innate toy toss, not a chosen skill');
assert.notEqual(legendary.loadout[1],legendaryThunder.loadout[1],
  'Legendary and epic cats should have distinct equipped Q skills');
// Role-build regression: a developed cat with a broad unlocked pool should
// have genuinely different Q/E choices; manual equipment survives battle init.
const roleCat=State.makeCat('yinghua',{affinity:90});
roleCat.level=15;roleCat.skillAwakened=true;
const dpsKit=Skills.recommendLoadout(roleCat,'dps');
const tankKit=Skills.recommendLoadout(roleCat,'tank');
const controlKit=Skills.recommendLoadout(roleCat,'control');
assert.ok([dpsKit,tankKit,controlKit].some((kit,i,all)=>all.some(other=>
  kit[1]!==other[1]||kit[2]!==other[2])),
  'distinct build roles should yield different Q/E skills when the unlocked pool allows');
Skills.applyBuild(roleCat,'dps');
assert.deepEqual(Array.from(roleCat.loadout),Array.from(dpsKit),
  'applying a build immediately installs its recommended skill IDs');
assert.equal(roleCat.buildType,'dps','build choice is stored on the cat');
assert.equal(roleCat.skillEdited,true,'builds are protected from default loadout reset');
Skills.ensureLoadout(roleCat);
assert.deepEqual(Array.from(roleCat.loadout),Array.from(dpsKit),
  'ensureLoadout does not overwrite a manually selected build');
const roleBattle=new sandbox.window.Battle.CaptureBattle(game,
  [roleCat],GameData.speciesById('doudou'));
assert.equal(roleBattle.me().qSkill?.id,dpsKit[1],
  'battle Q reads equipped build skill');
assert.equal(roleBattle.me().eSkill?.id,dpsKit[2],
  'battle E reads equipped build skill');


// Consolidated picker must not erase choices, including legacy generic moves.
const skillPickerSource=fs.readFileSync(DIR+'js/ui.js','utf8');
assert.ok(skillPickerSource.includes('skill-extra-options') &&
  skillPickerSource.includes('展开其他已解锁技能') &&
  skillPickerSource.includes('const extra=ordered.filter'),
  'skill picker offers compact featured moves and a full expandable library');
assert.ok(skillPickerSource.includes('data-sk=') &&
  skillPickerSource.includes('extra.map(chip)'),
  'hidden-by-default learned moves remain selectable through the full library');

// ---- GATED SKILL-LEARNING: powerful skills must be LEARNED, not free ----
// A paid skill (cometClaw: 🪙150) is invisible to learnableSkills until bought;
// buying deducts coins and adds the id to cat.learned, then it becomes equippable.
{
  const buyer=State.makeCat('tangyuan',{affinity:10}); // fire cat, low level
  const comet=Skills.skillById('cometClaw');
  assert.ok(comet&&comet.unlock&&comet.unlock.cost&&comet.unlock.cost.coins===150,
    'cometClaw is a coin-gated skill');
  assert.ok(!Skills.learnableSkills(buyer).some(s=>s.id==='cometClaw'),
    'A paid skill is NOT learnable/equippable before it is learned');
  // Too poor to learn: currency unchanged, nothing learned.
  State.S.coins=100;
  const poor=Skills.learnSkill(buyer,'cometClaw');
  assert.equal(poor.ok,false,'Cannot learn a paid skill without enough coins');
  assert.equal(State.S.coins,100,'A failed purchase deducts nothing');
  assert.ok(!Skills.hasLearned(buyer,'cometClaw'),'A failed purchase learns nothing');
  // Afford it: coins deducted, skill learned, now in the pool.
  State.S.coins=200;
  const bought=Skills.learnSkill(buyer,'cometClaw');
  assert.equal(bought.ok,true,'Learning a paid skill succeeds when affordable');
  assert.equal(bought.via,'cost','Paid learning is tagged via:cost for analytics');
  assert.equal(State.S.coins,50,'Learning a paid skill deducts exactly its coin cost');
  assert.ok(buyer.learned.includes('cometClaw'),'Learned skill id is pushed to cat.learned');
  assert.ok(Skills.learnableSkills(buyer).some(s=>s.id==='cometClaw'),
    'A learned skill becomes equippable (appears in learnableSkills)');

  // A level-gated 领悟 skill (frostLance: Lv.10) is hidden until the level is
  // reached, then AUTO-learned by learnableSkills (pure non-cost gate).
  const climber=State.makeCat('xiaohui',{affinity:10}); // water cat
  assert.ok(!Skills.learnableSkills(climber).some(s=>s.id==='frostLance'),
    'A level-gated skill is hidden below its level');
  climber.level=10;
  assert.ok(Skills.learnableSkills(climber).some(s=>s.id==='frostLance'),
    'Reaching the level auto-learns the 领悟 skill');
  assert.ok(climber.learned.includes('frostLance'),'Auto-领悟 records the skill in cat.learned');

  // ensureLoadout must never auto-equip a still-locked skill.
  const fresh=State.makeCat('moqiu',{affinity:0}); fresh.level=1; // dark cat
  Skills.ensureLoadout(fresh);
  const equipped=new Set((fresh.loadout||[]).filter(Boolean));
  for(const id of equipped){
    const sk=Skills.skillById(id);
    if(sk&&Skills.isGated(sk))
      assert.ok(fresh.learned.includes(id),'ensureLoadout only equips learned/innate skills, never a locked gate: '+id);
  }
  // A breed-locked signature auto-learns for the right breed only.
  const moon=State.makeCat('yuelian',{affinity:50});
  Skills.learnableSkills(moon);
  assert.ok(moon.learned.includes('moonfang'),'A breed-locked signature auto-learns for its breed');
  const notMoon=State.makeCat('moqiu',{affinity:50});
  assert.ok(!Skills.learnableSkills(notMoon).some(s=>s.id==='moonfang'),
    'The wrong breed can never learn a breed-locked signature');
}


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

// Hit-feel regression: impact coordinates are normally the TARGET center, not
// the attacking cat. Knockback/attacker recoil and directional sparks must
// still receive a real normalized direction.
const contactB=new sandbox.window.Battle.CaptureBattle(game,[starter],
  GameData.speciesById('doudou'));
contactB.coach=null;
const contactEnemy=contactB.enemies[0],contactCat=contactB.me();
contactEnemy.kbx=0;contactEnemy.kby=0;contactCat._recoilX=0;
contactB.hurtEnemy(contactEnemy,2,contactEnemy.x,contactEnemy.y,false);
assert.ok(Math.hypot(contactEnemy.kbx||0,contactEnemy.kby||0)>30,
  'enemy gets real knockback even when attack impact is its own center');
assert.ok(Math.hypot(contactCat._recoilX||0,contactCat._recoilY||0)>1,
  'attacker sprite reacts against the impact normal');
contactCat.kbx=0;contactCat.kby=0;
contactB.hurtMe(2,contactCat.x,contactCat.y,contactCat);
assert.ok(Math.hypot(contactCat.kbx||0,contactCat.kby||0)>30,
  'player cat also moves on contact instead of zero knockback');

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
// HP now includes the early-game onboarding damp (Lv1 ~0.55 → full by Lv6) and the
// logistic enemy-HP gap factor, so recompute with those rather than the flat base.
const edamp=(lvl,starter)=> (starter?.48:.55)+(starter?.32:.45)*Math.min(1,(lvl-1)/5);
assert.equal(normalEnemy.maxhp,
  Math.round((140+wild.base.vit*7)*normalScale*edamp(normalEnemy.level,b.starterRegion)*(b.enemyHpScaleGap||1)),
  'Normal battle HP matches early-damp + gap scaling');
const eliteSpecies=GameData.speciesById('jinwu');
const eliteBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],eliteSpecies);
const eliteLead=eliteBattle.enemies[0];
const eliteScale=1+(eliteLead.level-1)*0.08;
assert.equal(eliteLead.maxhp,
  Math.round((140+eliteSpecies.base.vit*7)*(1+3*0.6)*eliteScale*1.22*edamp(eliteLead.level,eliteBattle.starterRegion)*(eliteBattle.enemyHpScaleGap||1)),
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
// The old fixture assumed 85% HP always qualified for auto-S. New players
// can earn one with approachable, explicit requirements instead of free HP-only S.
const noviceAuto=game.sRankRequirements('N').auto;
assert.equal(game.gradeBattle({team:[{hp:Math.ceil(noviceAuto.hp*100+.01),maxhp:100,alive:true}],
  t:noviceAuto.seconds,comboBest:noviceAuto.combo,autoUsed:true,wild:{rarity:'N'}}).grade,'S',
  'A well-managed beginner auto battle still earns S');
assert.notEqual(game.gradeBattle({team:[{hp:99,maxhp:100,alive:true}],
  t:10,comboBest:0,autoUsed:true,wild:{rarity:'N'}}).grade,'S',
  'Full health without combat contribution must not grant automatic S');
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
assert.ok(document.getElementById('panel').innerHTML.includes('id="bp-go"'),'A rematch needs a clear pre-battle choice');
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
// Currencies collapsed to coins + fish; the old reunion treats reward now pays fish.
const prevFish=State.S.fish;
game.startBattle([starter],targetBreed);
const duplicateBattle=game.battle;
duplicateBattle.team.forEach(f=>{f.hp=f.maxhp;});
duplicateBattle.t=30;duplicateBattle.comboBest=1;
duplicateBattle.finish(true);game.endBattle();
assert.equal(State.S.cats.length,previousDupRoster,
  'After two residents, repeat capture should nurture them, not add another clone');
assert.ok(document.getElementById('panel').innerHTML.includes('reunion-reward'),
  'Repeat catch result should communicate the useful bonding reward');
assert.ok(State.S.fish>=prevFish+2,'Repeated catch awards fish instead of clutter');
assert.ok(events.some(e=>e.name==='bond_repeat_reunion'),
  'Reunion analytics distinguishes real new catches from duplicates');
UI.closeAll();

// One-time collection milestones reward actual new species, not repeated grinding.
const priorCoins=State.S.coins, priorFish=State.S.fish, priorMilestones=[...(State.S.collectionMilestones||[])];
State.S.dex['xiaohui']=1;
const milestones=game.grantCollectionMilestones();
assert.equal(milestones.length,1,'Third distinct breed grants exactly one milestone');
assert.equal(milestones[0].count,3);
assert.equal(State.S.coins,priorCoins+60);
assert.equal(State.S.fish,priorFish+2);   // milestone treats reward folded into fish
assert.equal(game.grantCollectionMilestones().length,0,'Collection rewards cannot be claimed twice');
assert.equal(game.collectionStatus().next,5,'Next collection goal progresses');
assert.ok(events.some(e=>e.name==='bond_collection_milestone'));
delete State.S.dex['xiaohui'];State.S.coins=priorCoins;State.S.fish=priorFish;
State.S.collectionMilestones=priorMilestones;

// Bonding milestones require actual affection interactions and only pay once.
const oldPets=State.S.petCount,oldBond=State.S.bondingRewards?.slice()||[];
const bondCoins=State.S.coins,bondFish=State.S.fish;
State.S.petCount=3;
const bondRewards=game.grantBondingRewards();
assert.equal(bondRewards.length,1,'Three real pet interactions grant first bonding reward');
assert.equal(bondRewards[0].coins,35);
assert.equal(State.S.coins,bondCoins+35);
assert.equal(State.S.fish,bondFish+2);   // bonding treats reward folded into fish
assert.equal(game.grantBondingRewards().length,0,'Bonding milestone can only be claimed once');
const adventure=game.adventureStatus();
assert.ok(adventure.totalRegions>=5&&adventure.unlocked>=1,'Explore track uses real world unlocks');
UI.openJourney();
const journeyHTML=document.getElementById('panel').innerHTML;
assert.ok(['journey-collect','journey-bond','journey-workshop','journey-explore'].every(x=>journeyHTML.includes(x)),
  'Adventures must offer collecting, bonding and exploration actions');
UI.closeAll();
State.S.petCount=oldPets;State.S.bondingRewards=oldBond;
State.S.coins=bondCoins;State.S.fish=bondFish;

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
// Only 🪙 coins + 🐠 fish currencies remain (treats/yarn were merged away).
const welcome = {
  minutes: 120, capped: false, produced: {}, gains: { coins: 21, fish: 1 },
  visitors: [
    { name: '汤圆', gift: { coins: 12, fish: 1 }, rare: false },
    { name: '豆豆', gift: { coins: 9 }, rare: true },
    { name: '小灰', gift: {}, rare: false },
  ],
};
UI.openWelcomeBack(welcome);
const welcomeHtml = document.getElementById('panel').innerHTML;
assert.ok(welcomeHtml.includes('<b>汤圆</b> 来访 · 留下 🪙+12 🐠+1'), 'Visitor gifts should list resource icons and exact quantities');
assert.ok(welcomeHtml.includes('<b>豆豆</b> 来访 · 留下 🪙+9 ✨稀客!'), 'Rare visitor gift should also render correctly');
assert.ok(welcomeHtml.includes('<b>小灰</b> 来访</div>'), 'Empty visitor gifts must not show a placeholder');
assert.ok(!welcomeHtml.includes('[object Object]'), 'Welcome-back panel must not display object Object');
UI.closeAll();

// ---- bilingual layer: representative ZH strings must resolve to pure English ----
const tr = sandbox.window.CatBondI18n.translate;
const enVisit=tr('汤圆 来访 · 留下 🪙+12 🐠+1');
assert.match(enVisit, /Tangyuan/, 'Visitor name translates into English');
assert.match(enVisit, /visited|left/, 'Visitor action translates into English');
assert.ok(enVisit.includes('🪙+12') && enVisit.includes('🐠+1'), 'Gift amounts survive English conversion');

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

// A duo ultimate must be a real two-cat signature move, not a one-second
// toast. It has a long, finite elemental aftereffect with real combat value.
const duoA=State.makeCat('tangyuan',{affinity:90}),duoB=State.makeCat('xiaohui',{affinity:90});
State.S.cats=[duoA,duoB];
sandbox.window.CatRelations.choose(duoA,duoB);
sandbox.window.CatRelations.pair(duoA,duoB).value=95;
const duoTest=new sandbox.window.Battle.CaptureBattle(game,[duoA,duoB],GameData.speciesById('jinwu'));
duoTest.duoCharge=100;duoTest.duoCd=0;
assert.ok(duoTest.duoReady(),'trust unlocks an actual team ultimate');
assert.equal(duoTest.castDuo(),true,'two cats cast their ultimate');
const fieldSecs=duoTest.duoField.duration;
assert.ok(duoTest.duoCinematic.max>=2.7,'signature cinematic is not a one-second flash');
assert.ok(duoTest.duoRun.duration>=2.3,'both kitten bodies visibly perform the attack');
assert.ok(fieldSecs>=8&&fieldSecs<=11,'elemental aftereffect lasts through multiple beats');
assert.ok(duoTest.team.every(f=>f.inv>=2.7),'cats are safe during the signature animation');
const duoHpBefore=duoTest.enemies.reduce((n,e)=>n+e.hp,0);
for(let k=0;k<115;k++)duoTest.tickDuoField(.016);
const duoHpAfter=duoTest.enemies.reduce((n,e)=>n+e.hp,0);
assert.ok(duoHpAfter<duoHpBefore,'the lingering field deals real follow-up damage');
for(let k=0;k<710;k++)duoTest.tickDuoField(.016);
assert.equal(duoTest.duoField,null,'lingering ultimate always ends without leaking');
assert.ok(duoTest.skillStrokes.some(v=>v.kind==='duoImpact'&&v.life===.65),
  'closing beat is a distinct twin-element flourish');
assert.equal(Object.keys(sandbox.window.CatRelations.DUO_ARTS).length,21,'all 21 elemental pairs keep authored signatures');
// Dedicated summon resonance only: other element pairs cannot call a reserve.
const grassPair=[State.makeCat('senlin',{affinity:90}),State.makeCat('zherdd',{affinity:90})];
const bench=State.makeCat('yinghua',{affinity:90});
sandbox.window.CatRelations.choose(grassPair[0],grassPair[1]);
sandbox.window.CatRelations.pair(grassPair[0],grassPair[1]).value=95;
const summonBattle=new sandbox.window.Battle.CaptureBattle(game,
  [...grassPair,bench],GameData.speciesById('doudou'));
assert.equal(summonBattle.duo?.effect?.support,'summon',
  'grass-grass duo alone has the team summon effect');
summonBattle.duoCharge=100;summonBattle.duoCd=0;
assert.equal(summonBattle.castDuo(),true,'summon-type resonance is castable');
summonBattle.duoCinematic.payload();
assert.equal(summonBattle.team.length,3,'summon duo calls a third reserve');
assert.ok(summonBattle.reinforceT>12,'summoned ally remains temporarily');
const normalPair=[duoA,duoB];
sandbox.window.CatRelations.choose(normalPair[0],normalPair[1]);
sandbox.window.CatRelations.pair(normalPair[0],normalPair[1]).value=95;
const noSummonBattle=new sandbox.window.Battle.CaptureBattle(game,
  [...normalPair,bench],GameData.speciesById('doudou'));
noSummonBattle.duoCharge=100;noSummonBattle.duoCd=0;
assert.equal(noSummonBattle.castDuo(),true,'normal duo resonance castable');
noSummonBattle.duoCinematic.payload();
assert.equal(noSummonBattle.team.length,2,'normal duo does not call third cat');
const fieldVisualSource=fs.readFileSync(DIR+'js/battle.js','utf8');
assert.ok(fieldVisualSource.includes('Pulse damage')&&
  fieldVisualSource.includes('v.remaining')&&fieldVisualSource.includes('召唤队友'),
  'resonance shows pulse damage, support identity and timer on the battlefield');

 
// Balance regression: all normal skills respect the difficulty modifier,
// but a full resonance (opening + field + late cross-claw) cannot one-shot.
assert.ok(State.DIFFICULTY_MULTS.casual.playerDmg<1.35);
assert.ok(State.DIFFICULTY_MULTS.hardcore.playerDmg<State.DIFFICULTY_MULTS.casual.playerDmg);
assert.ok(State.DIFFICULTY_MULTS.hardcore.enemyHp>State.DIFFICULTY_MULTS.casual.enemyHp);
const savedDifficulty=State.difficulty();
for(const mode of ['casual','hardcore']){
  State.setDifficulty(mode);
  const cfg=State.difficultyMult();
  const b=new sandbox.window.Battle.CaptureBattle(game,[duoA,duoB],
    GameData.speciesById('jinwu'));
  b.coach=null;b.duoCharge=100;b.duoCd=0;
  assert.equal(b.castDuo(),true,mode+' duo cast succeeds');
  const foe=b.enemies[0],max=foe.maxhp;
  b.duoCinematic.payload();
  for(let step=0;step<900;step++)b.tickDuoField(.016);
  const delta=max-foe.hp;
  assert.ok(delta>0,mode+' resonance still does nonzero damage');
  assert.ok(delta<=max*cfg.duoHpBudget+1e-6,
    mode+' opening plus persistent field obeys per-cast budget');
  assert.ok(foe.alive&&foe.hp>=max*.52,
    mode+' first resonance must leave substantial enemy HP');
  assert.equal(b.duoDamageMult,cfg.duoDmg);
  // Direct extra cross-paw hits also share the SAME budget after status
  // multipliers; new resonance casts start with a fresh Map.
  b.duoField={damageByEnemy:new Map([[foe.i,delta]])};
  b.hurtEnemy(foe,max*.8,foe.x,foe.y,true,true);
  assert.ok(max-foe.hp<=max*cfg.duoHpBudget+1e-6,
    mode+' a late paw cannot bypass the cap');
}
State.setDifficulty(savedDifficulty);


// Eight REAL ultimate identities — two fire and two light spells have to draw
// differently despite sharing an element. None may paint over the whole arena.
const ultIDs=['sunflare','tsunamiPaw','sunbloom','thunderYowl',
  'voidMaw','moonlitHalo','moonfang','purrNova'];
assert.deepEqual(Array.from(sandbox.window.CatBondUltVFX.ids),ultIDs,
  'all eight skill-id renderers are registered');
assert.ok(!sandbox.window.CatBondUltHero,'no full-screen ultimate art module');
const ultBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],GameData.speciesById('doudou'));
const localCtx=new Proxy(canvasCtx,{get(target,key){
  if(key==='fillRect')return ()=>{throw Error('VFX cannot cover full screen');};
  return target[key];
}});
for(const id of ultIDs){
  const skill=Skills.skillById(id);
  assert.ok(skill&&skill.ultCost>0,'valid ULT skill '+id);
  for(const phase of [.15,.45,.75]){
    const spell={kind:'ultimate',skillId:id,element:skill.element,
      x:ultBattle.me().x,y:ultBattle.me().y,angle:.12,
      targets:[{x:ultBattle.me().x+140,y:ultBattle.me().y-15}],
      life:1.5*(1-phase),max:1.5};
    assert.doesNotThrow(()=>{
      assert.equal(sandbox.window.CatBondUltVFX.draw(localCtx,spell,1000,700,1,'back'),true);
      assert.equal(sandbox.window.CatBondUltVFX.draw(localCtx,spell,1000,700,1,'front'),true);
    },id+' must draw a local spell, not a full-screen sprite');
    ultBattle.skillStrokes=[spell];
    assert.doesNotThrow(()=>ultBattle.drawSkillStrokes(canvasCtx),
      id+' must draw through the real combat integration');
  }
}
const bloom=Skills.skillById('sunbloom');
assert.ok(bloom&&bloom.element==='grass'&&bloom.ultCost>0,
  'grass must have an actual equipable ultimate, not an unused branch');
assert.equal(Skills.SIGNATURE_SKILL.senlin,'sunbloom',
  'forest cat signature points at the real grass ultimate');

// 虚吞/VOID MAW is NOT the generic destruction beam: it must pull a nearby
// enemy pack into a vortex and run resolveHit (which includes its rewind tag).
const voidBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],GameData.speciesById('doudou'));
const vf=voidBattle.me();
vf.ultSkill={id:'voidMaw',name:'虚吞',element:'dark',kind:'aoe',power:2.5,
  ultCost:80,appliesTag:['dizzy','rewind']};
voidBattle.enemies.forEach((e,i)=>{
  e.x=vf.x+140+i*20;e.y=vf.y+20;e.hp=e.maxhp;e.inv=0;e.flash=0;
});
const voidHpBefore=voidBattle.enemies.reduce((n,e)=>n+e.hp,0);
voidBattle.ult=100;voidBattle.ultCd=0;
assert.equal(voidBattle.ultimate(),true,'void maw ultimate casts');
assert.ok(!voidBattle.deathRay,'void maw must not be silently replaced by a death ray');
assert.ok(!voidBattle.ultHero,'void maw must not spawn a full-screen hero cut-in');
assert.ok(voidBattle.skillStrokes.some(x=>x.kind==='ultimate'&&x.skillId==='voidMaw'),
  'void maw must spawn a dark vortex silhouette');
assert.ok(voidBattle.enemies.some(e=>Math.abs(e.kbx||0)+Math.abs(e.kby||0)>0),
  'void maw must physically pull at least one enemy');
assert.ok(voidBattle.enemies.reduce((n,e)=>n+e.hp,0)<voidHpBefore,
  'void maw must actually damage the enemies');

// Destruction Death-Ray remains available as a SEPARATE VFX archetype for a
// future dedicated skill; it is no longer automatically mapped to all dark ults.
const laserBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],GameData.speciesById('doudou'));
const lf=laserBattle.me();
laserBattle.enemies.forEach((e,i)=>{
  e.x=lf.x+180+i*20;e.y=lf.y;e.hp=e.maxhp;e.inv=0;e.flash=0;
});
const ray={id:'deathRay',name:'破坏死光',element:'dark',kind:'beam',
  power:2.5,ultCost:80,appliesTag:'dizzy'};
assert.equal(laserBattle.castDeathRay(lf,ray),true,
  'dedicated death ray can still cast independently');
assert.ok(laserBattle.deathRay,'dedicated death ray creates state');
assert.ok(Math.abs((laserBattle.deathRay.end-laserBattle.deathRay.start)-Math.PI/3)<1e-6,
  'dedicated death ray has a 120 degree sweep');
const rayHpBefore=laserBattle.enemies.reduce((n,e)=>n+e.hp,0);
let rayFired=false;
assert.doesNotThrow(()=>{
  for(let i=0;i<150;i++){
    laserBattle.tickDeathRay(.016);
    laserBattle.drawDeathRay(canvasCtx);
    if(laserBattle.deathRay&&laserBattle._deathRayFrame()?.firing)rayFired=true;
  }
},'dedicated ray ticks and draws cleanly');
assert.ok(rayFired,'dedicated ray reaches its sweep phase');
assert.ok(laserBattle.enemies.reduce((n,e)=>n+e.hp,0)<rayHpBefore,
  'dedicated ray deals throttled sweep damage');
assert.equal(laserBattle.deathRay,null,'dedicated ray ends and clears');


// CHANNELING + melee/dash + progression regressions.
// These checks use the actual CaptureBattle methods and skill table, not a VFX
// prototype disconnected from combat or an invented player save.
for(const [id,element] of [['waterJet','water'],['thunderStream','elec'],['flameSweep','fire']]){
  const sk=Skills.skillById(id);
  assert.equal(sk?.kind,'beam',id+' must be a real channelled skill');
  assert.ok(sk.channel>.8&&sk.reach>100&&sk.width>0);
  const spellBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],
    GameData.speciesById('doudou'));
  const f=spellBattle.me();
  spellBattle.castBeam(f,0,sk,12,'#ffdfa2');
  assert.equal(spellBattle.beams.length,1,id+' registers a live beam');
  assert.ok(f._beamRoot>0,id+' roots its caster while channeling');
  const target=spellBattle.enemies[0];
  target.x=f.x+Math.min(sk.reach-28,116);target.y=f.y;
  target.hp=target.maxhp;target.inv=0;target.flash=0;
  const hp=target.hp;
  for(let t=0;t<Math.ceil(sk.channel/.08)+2;t++){
    spellBattle.tickBeams(.08);
    assert.doesNotThrow(()=>spellBattle.drawBeams(canvasCtx),id+' draws an active beam');
  }
  assert.equal(spellBattle.beams.length,0,id+' ends its channel');
  assert.ok(!f._beamRoot,id+' releases its caster root when done');
  assert.ok(target.hp<hp,id+' deals periodic line damage in combat');
}
const flame=Skills.skillById('flameSweep');
assert.ok(flame.sweep>=.65&&flame.reach<=160,
  'flamethrower sweeps a short arc, never the giant death-ray reach');
const smallShock=Skills.skillById('lightningOrb');
assert.ok(smallShock?.homing>=3&&smallShock?.element==='elec');
const missileBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],
  GameData.speciesById('doudou'));
const missileF=missileBattle.me();
assert.equal(missileBattle.castDistinctProjectile(
  missileF,smallShock,0,'#ffe5a0',missileF.dmg),true);
assert.ok(missileBattle.projectiles.some(p=>p.kind==='lightningOrb'&&
  p.homing>0&&p.life>=3),
  'ball lightning must fly slowly and home — not resolve as an instant chain');
const dashBattle=new sandbox.window.Battle.CaptureBattle(game,[starter],
  GameData.speciesById('doudou'));
const df=dashBattle.me(),targetDash=dashBattle.enemies[0];
targetDash.x=df.x+88;targetDash.y=df.y;targetDash.hp=targetDash.maxhp;
dashBattle.dashLunge(df,0,Skills.skillById('voltRush'),14,'#ffe5a0');
assert.ok(df.pounce&&df._dashReach<=130,
  'Volt Rush is physical movement and has a short max travel');
assert.equal(targetDash.hp,targetDash.maxhp,
  'Volt Rush must NOT deal ranged damage at cast time');
const newbie=State.makeCat('xianluo',{level:1,affinity:0});
newbie.loadout=[];newbie.autoSkillLoadout=[];newbie.skillEdited=false;
const startSkills=Skills.learnableSkills(newbie);
assert.ok(startSkills.some(sk=>sk.id==='staticPounce'));
assert.ok(!startSkills.some(sk=>sk.id==='boltArc'),
  'a fresh level-1 cat should not already know the full second attack');
assert.equal(Skills.defaultLoadout(newbie)[2],null,
  'the E slot unlocks with growth, not as a free starting ability');
const grown=State.makeCat('xianluo',{affinity:0});
grown.level=5; // makeCat takes species/affinity, not a level constructor option.
assert.ok(Skills.learnableSkills(grown).some(sk=>sk.id==='lightningOrb'),
  'electric cats learn the slow homing orb by Lv.5');
const nonElectric=State.makeCat('jinwu',{affinity:0});
nonElectric.level=5;
assert.ok(!Skills.learnableSkills(nonElectric).some(sk=>sk.id==='lightningOrb'),
  'element-locked orb must not appear on a fire-only cat');
newbie.loadout=[null,'boltArc',null,null];newbie.skillEdited=true;
assert.ok(Skills.learnableSkills(newbie).some(sk=>sk.id==='boltArc'),
  'never delete old saved skills when introducing progressive unlocks');

console.log('Cat Bond: 13 modules loaded, starter + capture win/loss driven, game_start/complete/over/cat_capture analytics, and bilingual ZH->EN layer (incl. live zh<->en toggle) PASS.');
