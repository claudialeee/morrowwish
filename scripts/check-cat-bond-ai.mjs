/* Headless combat-AI smoke test for Cat Bond (public/cat-bond/js/battle.js).
 *
 * Boots every game module in page order inside a minimal fake DOM (same style as
 * scripts/check-cat-bond.mjs), then drives the real combat AI to assert the four
 * properties the combat-AI rewrite guarantees:
 *   1. a RANGED-kit cat KITES  — holds distance from a close target instead of hugging it
 *   2. a MELEE-kit  cat CLOSES — rushes a far target into claw range
 *   3. INTERCEPT aim LEADS a moving target (the aim point is ahead of the target)
 *   4. a full 10s battle sim (player auto + enemy AI, moving targets) throws nothing
 * No network, no browser engine. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ---- minimal DOM (mirrors scripts/check-cat-bond.mjs) ----
const listeners = {};
const nodes = new Map();
const nop = () => {};
function classList() { const set = new Set(); return { add: c => set.add(c), remove: c => set.delete(c), toggle: (c, on) => { on ? set.add(c) : set.delete(c); }, contains: c => set.has(c) }; }
const canvasCtx = new Proxy({ createLinearGradient: () => ({ addColorStop: nop }), createRadialGradient: () => ({ addColorStop: nop }), getImageData: () => ({ data: [] }), measureText: () => ({ width: 10 }) }, { get(o, k) { return k in o ? o[k] : nop; }, set() { return true; } });
function makeEl(id) {
  const el = {
    id, tagName: 'DIV', nodeName: 'DIV', nodeType: 1, style: { setProperty: nop }, dataset: {},
    classList: classList(), children: [], childNodes: [], attributes: {}, parentNode: null, _text: '', _html: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); if (c && typeof c === 'object') c.parentNode = this; return c; },
    removeChild: nop, remove: nop, insertBefore: (c) => c, prepend: nop,
    replaceChildren() { this.children = []; this.childNodes = []; },
    setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; },
    hasAttribute(k) { return k in this.attributes; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(t, cb) { listeners[id + ':' + t] = cb; }, removeEventListener: nop,
    getContext: () => canvasCtx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
    querySelector: (sel) => (/canvas/i.test(sel) ? makeEl('qs-canvas') : makeEl('qs-' + sel)),
    querySelectorAll: () => [], closest: () => null, focus: nop,
    onclick: null, click() { if (typeof this.onclick === 'function') this.onclick({ target: this, preventDefault: nop, stopPropagation: nop }); },
    width: 1000, height: 700,
  };
  return el;
}
const document = {
  readyState: 'complete', documentElement: makeEl('html'), body: makeEl('body'), title: 'Cat Bond',
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, makeEl(id)); return nodes.get(id); },
  querySelector(sel) { const m = /#([\w-]+)\s*$/.exec(sel || ''); return m ? this.getElementById(m[1]) : null; },
  querySelectorAll() { return []; },
  createElement(tag) { const e = makeEl('new-' + tag); e.tagName = String(tag).toUpperCase(); return e; },
  createTextNode(t) { return { nodeType: 3, nodeValue: String(t), parentNode: null }; },
  addEventListener(t, cb) { listeners['doc:' + t] = cb; }, removeEventListener: nop,
  createTreeWalker(root) { const out = []; (function visit(n) { for (const c of (n.childNodes || [])) { out.push(c); visit(c); } })(root); let i = -1; return { nextNode() { i++; return i < out.length ? out[i] : null; } }; },
};
const events = [];
const rafQueue = [];
const windowObj = {
  document,
  addEventListener(t, cb) { listeners['win:' + t] = cb; }, removeEventListener: nop,
  dispatchEvent: () => true, arcadeMetric(name, payload) { events.push({ name, payload }); },
  devicePixelRatio: 1, location: { pathname: '/cat-bond/', search: '', href: 'https://x/cat-bond/' },
  navigator: { language: 'en', userAgent: 'node' },
  requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; }, cancelAnimationFrame: nop,
  setTimeout: (fn) => { try { fn(); } catch (e) {} return 1; }, clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  CanvasRenderingContext2D: function () {},
  Image: function () { return { width: 0, height: 0, set src(v) {}, get src() { return ''; }, onload: null, onerror: null }; },
  MutationObserver: function () { return { observe: nop, disconnect: nop }; },
  NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 }, MorrowwishI18n: { get: () => 'en' },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  performance: { now: () => 1000 }, console,
};
windowObj.CanvasRenderingContext2D.prototype = {};
const sandbox = {
  document, console, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, WeakMap, Symbol, isNaN, isFinite, parseInt, parseFloat,
  requestAnimationFrame: windowObj.requestAnimationFrame, cancelAnimationFrame: nop,
  setTimeout: windowObj.setTimeout, clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  localStorage: windowObj.localStorage, navigator: windowObj.navigator, location: windowObj.location,
  performance: windowObj.performance, CanvasRenderingContext2D: windowObj.CanvasRenderingContext2D,
  MutationObserver: windowObj.MutationObserver, NodeFilter: windowObj.NodeFilter, Image: windowObj.Image,
};
vm.createContext(sandbox);
windowObj.window = windowObj;
const winProxy = new Proxy(windowObj, {
  set(target, key, value) { target[key] = value; try { sandbox[key] = value; } catch (e) {} return true; },
  get(target, key) { return key in target ? target[key] : sandbox[key]; },
  has(target, key) { return (key in target) || (key in sandbox); },
});
sandbox.window = winProxy; windowObj.window = winProxy;

for (const name of ORDER) {
  const src = fs.readFileSync(DIR + 'js/' + name + '.js', 'utf8');
  new vm.Script(src, { filename: name + '.js' });
  vm.runInContext(src, sandbox, { filename: name + '.js' });
}
const duoSrc = fs.readFileSync(DIR + 'js/cat-relationships.js', 'utf8');
vm.runInContext(duoSrc, sandbox, { filename: 'cat-relationships.js' });

const boot = listeners['win:DOMContentLoaded'];
assert.ok(typeof boot === 'function', 'main.js registered DOMContentLoaded');
boot();
const game = sandbox.window.__game, State = sandbox.window.State, GameData = sandbox.window.GameData, Skills = sandbox.window.Skills;
game.start();

// Build a battle with a known starter and wild cat so we can inspect the AI directly.
const starter = State.makeCat('tangyuan', { affinity: 40 });
starter.level = 20; starter.stats = { pow: 80, agi: 90, vit: 120, cha: 60 };
const wild = GameData.speciesById('doudou');
const b = new sandbox.window.Battle.CaptureBattle(game, [starter], wild);
const f = b.me();

// ---- helper: a synthetic fighter at (x,y) carrying a forced skill kit ----
function fighterWithSkills(kinds) {
  const skills = kinds.map((kind, i) => ({ id: 'test' + i, name: 'test' + i, kind, element: 'fire' }));
  return Object.assign({}, f, {
    qSkill: skills[0] || null, eSkill: skills[1] || null,
    hp: 100, maxhp: 100, projSpeed: 300, speed: 150,
  });
}

// 1) RANGED kit → KITES: band inner edge should sit well off the target (not ~0),
//    and bandSteer on a target that is TOO CLOSE should push the cat AWAY.
{
  const ranged = fighterWithSkills(['projectile', 'projectile']);
  const band = b.kitRangeBand(ranged);
  assert.equal(band.role, 'ranged', 'two projectile skills → ranged role');
  assert.ok(band.min > 120, 'ranged cat keeps a real standoff distance (min=' + band.min.toFixed(0) + ')');
  // target 40px away (inside the band) → steer should have an outward (flee) component
  const nx = 1, ny = 0, close = 40;
  const steer = b.bandSteer(ranged, nx, ny, close, band, 0.016);
  assert.ok(steer.x < 0, 'ranged cat kites: too-close target drives it backward (steer.x=' + steer.x.toFixed(2) + ')');
}

// 2) MELEE kit → CLOSES: band should be small, and a FAR target should drive it in.
{
  const melee = fighterWithSkills(['melee', 'melee']);
  // Hit-and-run: skill READY → commit to a reach band WITH a real standoff (min>0, not
  // the old glued-at-0 that left brawlers hugging + tanking); skill ON COOLDOWN → kite
  // out and wait instead of standing in melee doing nothing.
  const readyMelee = Object.assign({}, melee, { cd: { basic: 0, q: 0, e: 0 }, dodgeCd: 0 });
  const bandReady = b.kitRangeBand(readyMelee);
  assert.equal(bandReady.role, 'melee', 'two melee skills → melee role');
  assert.ok(bandReady.min > 0 && bandReady.min <= 80 && bandReady.max <= 260,
    'melee (skill ready) commits to a reach band with a standoff (min=' + bandReady.min.toFixed(0) + ', max=' + bandReady.max.toFixed(0) + ')');
  const cdMelee = Object.assign({}, melee, { cd: { basic: 0, q: 3, e: 3 }, dodgeCd: 0 });
  const bandCd = b.kitRangeBand(cdMelee);
  assert.ok(bandCd.min > bandReady.min, 'melee (skill on cooldown) kites OUT instead of hugging (min=' + bandCd.min.toFixed(0) + ' > ' + bandReady.min.toFixed(0) + ')');
  const nx = 1, ny = 0, far = 400;
  const steer = b.bandSteer(readyMelee, nx, ny, far, bandReady, 0.016);
  assert.ok(steer.x > 0, 'melee cat closes: far target drives it forward (steer.x=' + steer.x.toFixed(2) + ')');
}

// 2b) SUPPORT kit → HANGS BACK: largest band of all.
{
  const support = fighterWithSkills(['heal', 'buff']);
  const band = b.kitRangeBand(support);
  assert.equal(band.role, 'support', 'heal+buff → support role');
  assert.ok(band.min >= 200, 'support cat hangs well back (min=' + band.min.toFixed(0) + ')');
}

// 3) INTERCEPT aim LEADS a moving target: a target crossing perpendicular to the
//    shot should yield an aim point AHEAD of its current position along its velocity.
{
  const shooter = { x: 0, y: 0, _vx: 0, _vy: 0 };
  const target = { x: 300, y: 0, _vx: 0, _vy: 200 };   // moving straight "down"
  const ip = b.interceptPoint(shooter, target, 300);
  assert.ok(ip.t > 0, 'intercept has a positive time-to-hit');
  assert.ok(ip.y > 20, 'aim point leads a crossing target along its velocity (ip.y=' + ip.y.toFixed(1) + ')');
  // a stationary target → aim at it (no spurious lead)
  const still = b.interceptPoint(shooter, { x: 300, y: 0, _vx: 0, _vy: 0 }, 300);
  assert.ok(Math.abs(still.y) < 1e-6, 'stationary target is aimed at directly');
  // an un-catchable target (faster than the shot, running away) → fall back to current pos
  const flee = b.interceptPoint(shooter, { x: 300, y: 0, _vx: 900, _vy: 0 }, 300);
  assert.ok(Math.abs(flee.x - 300) < 1e-6 && Math.abs(flee.y) < 1e-6, 'no-solution falls back to the current position');
}

// 4) 10-SECOND SIM: player auto-battle + enemy AI, nothing thrown. Keep the cats
//    alive and the enemies moving so the steering/intercept code runs every frame.
{
  b.autoMode = true;
  b.coach = null;                 // skip the first-fight tutorial hold
  let threw = null;
  // Level-20 starter had been one-shotting the unscaled low-level wild cat,
  // which gave enemy AI zero opportunity to move. Keep a *durable* target for
  // this movement test. The separate damage/balance suites test actual HP.
  for(const enemy of b.enemies){
    enemy.maxhp=100000;enemy.hp=100000;enemy.inv=0;enemy.speed=Math.max(enemy.speed||0,85);
    enemy.x=b.W*.78;enemy.y=b.H*.33;
  }
  const start=b.enemies.map(e=>({x:e.x,y:e.y}));
  let maxTravel=0,updateFrames=0;
  try {
    for (let i = 0; i < 625; i++) {    // 625 * 0.016 = 10s
      for (const fr of b.team) if (fr.hp < fr.maxhp * 0.5) fr.hp = fr.maxhp * 0.6;
      b.update(0.016);updateFrames++;
      for(let k=0;k<b.enemies.length;k++){
        const enemy=b.enemies[k],p=start[k];
        maxTravel=Math.max(maxTravel,Math.hypot(enemy.x-p.x,enemy.y-p.y));
      }
      if (b.done) break;
    }
  } catch (e) { threw = e; }
  assert.equal(threw, null, '10s auto-battle sim threw nothing' + (threw ? ': ' + threw.stack : ''));
  assert.ok(updateFrames>40,'AI sim must run enough real frames for movement');
  assert.ok(maxTravel>2,
    'enemy AI should move in either axis during actual combat, maximum travel='+maxTravel.toFixed(2));
}

console.log('Cat Bond combat AI: kit range bands (ranged kites / melee closes / support hangs back), true intercept lead, and a 10s auto-battle sim all PASS.');
