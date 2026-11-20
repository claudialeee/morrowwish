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
const ORDER = ['vfx','catart','data','skills','growth','state','raising','world','worldmap','battle','ui','game','main'];

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
assert.ok(sandbox.window.Skills, 'Skills global present');
assert.ok(sandbox.window.Battle, 'Battle global present');
assert.ok(sandbox.window.CatBondI18n, 'Cat Bond i18n layer present');
assert.equal(sandbox.window.GameData.SPECIES.length, 25, '25 cat species');

// ---- boot the game the way main.js does (fire DOMContentLoaded) ----
const boot = listeners['win:DOMContentLoaded'];
assert.ok(typeof boot === 'function', 'main.js registered DOMContentLoaded');
boot();
const game = sandbox.window.__game;
assert.ok(game, 'Game instance created');

// start screen -> start the game (the intro-start click handler)
game.start();
const State = sandbox.window.State, UI = sandbox.window.UI, GameData = sandbox.window.GameData;

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
