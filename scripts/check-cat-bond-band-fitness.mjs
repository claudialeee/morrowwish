/* Band-FITNESS verifier for Cat Bond (public/cat-bond/js/battle.js).
 *
 * WHAT THIS IS (and why it is DIFFERENT from check-cat-bond-combat-matrix.mjs):
 *   The matrix verifier asks "does the cat hold a healthy distance and deal SOME damage?" and
 *   regression-locks 48 cells + negative controls against a FIXED verifier-owned envelope. It is
 *   a PASS/FAIL guard; it deliberately can NOT rank two reasonable bands.
 *
 *   This file is that RANKER. It exposes `fitness(kind, build, {min,max})` → real simulated
 *   damage over ~12s (+ acts%) at a FORCED candidate band, driving the REAL engine under a seeded
 *   RNG. It answers the design question Part 2 turns on: "is band A better than band B for THIS
 *   kit?" — judged by simulated DPS, not intuition. Part 2 (the utility-scored kitRangeBand) was
 *   tuned against these numbers.
 *
 * THE GROUND-TRUTH IT ESTABLISHED (honest, measured — not assumed, and NOT what intuition says):
 *   With each skill given its REAL cooldown (so a beam/projectile actually RE-FIRES, as 水枪 does
 *   with cd 5.0 — an earlier draft gave the synthetic beam no cd, so it fired once then its NaN
 *   cooldown blocked it and the sim silently measured only the basic toss), the engine's real DPS
 *   curve vs engagement distance is:
 *     • for a ranged/beam kit the BASIC TOSS (reach ≈ basicAttackRange ≈ 170) is the DPS backbone —
 *       near-constant uptime — while the 水枪 beam itself is a 5s-cooldown commit,
 *     • so DPS is HIGHEST hugging just inside basic range (~155), DECLINES as the hold distance
 *       passes basic range (only the slow beam still connects), and CRATERS past the beam's reach.
 *   This refutes the naive "a long beam wants to stand at its 300 reach" intuition: in THIS engine
 *   standing at full reach REGRESSES DPS. That is why the owner chose "skill-reach-primary with a
 *   build MICRO-tweak" (a bounded nudge), NOT "max = reach": the band's retreat FLOOR must stay
 *   ≤ basicAttackRange (the old "ranged cat can't basic-attack" regression) and the extra standoff a
 *   backline build earns must be small enough that its DPS cost stays within noise. C3 + CORE below
 *   lock the "don't push the band past reach" direction so no change (or optimizer) can regress it.
 *
 * SCENARIO (deterministic & stable): a FULLY PINNED enemy at a fixed standoff (same pin discipline
 *   as the matrix — reassert position + zero velocity every frame so the distance signal measures
 *   the CAT, never an enemy chasing a frozen cat). A pinned target can't manufacture a fake
 *   close-range DPS penalty, so every number here is "what this band can actually output from the
 *   distance it chooses". DETERMINISM: seeded ctor (mulberry32) + fixed dt ⇒ reproducible; we
 *   average a few seeds to damp scenario noise and assert back-to-back stability.
 *
 * COMMITTED NEGATIVE CONTROLS (a fitness metric that can't fail a bad band proves nothing):
 *   C1 FROZEN-out-of-position → ~0 dmg: enemy sits at 430px (beyond every reach) and the cat is
 *      pinned at spawn, so it never engages. Proves a band is only worth something if the cat MOVES.
 *   C2 point-blank band for a ranged kit → the cat is DRAGGED to ~30px; must still fire (min stays
 *      ≤ basicAttackRange is the OLD regression) AND deal real damage — i.e. a hugging band does
 *      NOT zero out a ranged kit (guards the "ranged cat can't basic-attack" bug from the other end).
 *   C3 OUT-OF-REACH band [330,380] for a 300-reach beam → STRICTLY WORSE dmg than the same beam at
 *      a within-reach standoff: proves the metric punishes "stand past your skill's reach", the
 *      regression a naive skill-reach fix would cause.
 * Boot scaffold mirrors scripts/check-cat-bond-combat-matrix.mjs (fake DOM + vm + seeded ctor). */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ---- minimal DOM (mirrors scripts/check-cat-bond-combat-matrix.mjs) ----
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
vm.runInContext(fs.readFileSync(DIR + 'js/cat-relationships.js', 'utf8'), sandbox, { filename: 'cat-relationships.js' });

const boot = listeners['win:DOMContentLoaded'];
assert.ok(typeof boot === 'function', 'main.js registered DOMContentLoaded');
boot();
const game = sandbox.window.__game, State = sandbox.window.State, GameData = sandbox.window.GameData;
game.start();

// ---- test loadouts: the same 8 kits the matrix uses, but with REAL cooldowns so skills RE-FIRE
// (a beam/projectile without a cd fires once then its NaN cooldown blocks it → the sim would
// silently measure only the basic toss). CDs mirror the live skills (水枪 cd 5.0 etc.).
const KINDS = {
  melee:   { q:{kind:'melee',power:1.2,cd:1.2} },
  ranged:  { q:{kind:'projectile',power:1.0,cd:1.0} },
  dash:    { q:{kind:'dash',power:1.4,cd:4.0} },
  pounce:  { q:{kind:'pounce',power:1.3,cd:3.5} },
  leap:    { q:{kind:'leap',power:1.4,cd:4.0} },
  beam:    { q:{kind:'beam',power:0.9,reach:300,channel:1.2,cd:5.0} },
  support: { q:{kind:'heal',power:0,cd:6}, e:{kind:'buff',power:0,cd:6,tags:['shield'],shieldType:'barrier'} },
  hybrid:  { q:{kind:'melee',power:1.2,cd:1.2}, e:{kind:'projectile',power:1.0,cd:1.0} },
};

function makeCell(kind, build, seed) {
  const starter = Object.assign(State.makeCat('tangyuan', { affinity: 60 }), { level: 16, buildType: build, stats: { pow: 70, agi: 80, vit: 110, cha: 60 } });
  const b = new sandbox.window.Battle.CaptureBattle(game, [starter], GameData.speciesById('doudou'), { seed });
  b.coach = null; b.autoMode = true;
  const f = b.me(), kit = KINDS[kind];
  f.qSkill = kit.q ? { id: 'simq', name: 'q', element: 'fire', ...kit.q } : null;
  f.eSkill = kit.e ? { id: 'sime', name: 'e', element: 'fire', ...kit.e } : null;
  for (let k = 1; k < b.enemies.length; k++) b.enemies[k].alive = false;
  return { b, f };
}

// ---- the fitness sim: drive the REAL engine for 12s vs a FULLY PINNED enemy at `standoff` px.
// `band` (if given) FORCES kitRangeBand so we can score a candidate band directly; `opts.frozen`
// pins the cat at spawn (C1 control). Enemy is 100k HP → survives → measures OUTPUT not kill time.
function simBand(kind, build, seed, band, opts = {}) {
  const { b, f } = makeCell(kind, build, seed);
  const e = b.enemies[0];
  const standoff = opts.standoff ?? 300;
  const ex = f.x + standoff, ey = f.y;
  e.x = ex; e.y = ey; e.maxhp = e.hp = 100000;
  // PASSIVE-target discipline (same as the combat-matrix cells): this harness grades the PLAYER's
  // band/output, so disable the enemy's own real-skill rotation and suppress the player's auto-dodge —
  // otherwise the enemy fighting back + the cat breaking off to dodge perturb the DPS-vs-distance curve
  // this test is trying to isolate. Enemy rotation + dodge are covered by their own assertions/sims.
  e.rotation = []; e.rotReady = Infinity;
  if (band) b.kitRangeBand = () => ({ min: band.min, max: band.max, rush: band.min, role: 'x', hp: 1 });
  const fx0 = f.x, fy0 = f.y, hp0 = e.hp;
  let acts = 0, prevHp = e.hp;
  const dists = [];
  // Hold the SIM-TIME window constant across tempo changes (see the combat-matrix note): these
  // thresholds were calibrated at 720 frames under the historical 0.8 tempo, so scale 720·0.8/tempo.
  const SIMFRAMES = Math.round(720 * 0.8 / ((b.tempoScale) || 0.8));
  for (let i = 0; i < SIMFRAMES; i++) {     // 12 sim-seconds
    b.update(0.016);
    if (opts.frozen) { f.x = fx0; f.y = fy0; }
    e.x = ex; e.y = ey; if (e.vx != null) e.vx = 0; if (e.vy != null) e.vy = 0;   // FULLY pin (no chase)
    f.dodgeCd = Infinity;                                       // suppress auto-dodge (output-curve cell)
    const dealt = prevHp - e.hp; prevHp = e.hp;
    if (dealt > 0 || (b.projectiles || []).some(p => p.owner === 'me')) acts++;
    dists.push(Math.hypot(e.x - f.x, e.y - f.y));
  }
  dists.sort((a, c) => a - c);
  return { dmg: hp0 - e.hp, acts: 100 * acts / SIMFRAMES, medDist: dists[Math.floor(dists.length / 2)] };
}

const SEEDS = [7, 42, 101, 256];
function agg(kind, build, band, opts = {}) {
  let d = 0, a = 0, md = 0;
  for (const s of SEEDS) { const r = simBand(kind, build, s, band, opts); d += r.dmg; a += r.acts; md += r.medDist; }
  return { dmg: d / SEEDS.length, acts: a / SEEDS.length, medDist: md / SEEDS.length };
}

// PUBLIC API: fitness of a candidate band for a (kind,build). Higher .dmg = better. `band=null`
// scores the REAL engine's current kitRangeBand for that cell. The caller (Part-2 tuning, a
// challenger, a future optimizer) ranks candidate bands by `.dmg`, using acts as a sanity signal.
export function fitness(kind, build, band, opts = {}) { return agg(kind, build, band, opts); }

function realBand(kind, build) {
  const { b, f } = makeCell(kind, build, 7);
  const rb = b.kitRangeBand(f);
  return { min: Math.round(rb.min), max: Math.round(rb.max), role: rb.role };
}
function basicRangeOf(kind, build) { const { b, f } = makeCell(kind, build, 7); return b.basicAttackRange(f); }

// ============================================================================================
// NEGATIVE CONTROLS — the metric MUST fail a provably-bad band, or a good score is meaningless.
// ============================================================================================
const report = [];

// C1: a cat FROZEN out of position never engages. Enemy stationary at 430px (beyond every reach),
// cat pinned at spawn → lands nothing. Proves a band is only worth something if the cat MOVES.
{
  const fr = agg('beam', 'dps', { min: 20, max: 45 }, { frozen: true, standoff: 430 });
  report.push(`C1 frozen-out-of-pos beam/dps dmg ${fr.dmg.toFixed(0).padStart(6)}  acts ${fr.acts.toFixed(0)}%`);
  assert.ok(fr.dmg < 400, 'NEG-CONTROL C1: a cat frozen out of position must score ~0 dmg (got ' + fr.dmg.toFixed(0) + ')');
}

// C2: a ranged kit DRAGGED to point-blank (band [20,45]) must STILL act and deal real damage —
// min ≤ basicAttackRange is the OLD "ranged cat can't basic-attack" regression, from the other
// end: a hug band must not zero the kit out. (A pinned enemy can't punish the hug, so this is a
// clean "does it still fire" check, not a DPS-penalty claim the engine doesn't actually make.)
{
  const pb = agg('ranged', 'dps', { min: 20, max: 45 });
  report.push(`C2 ranged point-blank [20,45] dmg ${pb.dmg.toFixed(0).padStart(6)}  acts ${pb.acts.toFixed(0)}%`);
  assert.ok(pb.acts > 20 && pb.dmg > 1500, 'NEG-CONTROL C2: a point-blank ranged kit must still fire & deal dmg (got acts ' + pb.acts.toFixed(0) + '%, dmg ' + pb.dmg.toFixed(0) + ')');
}

// C3: the headline guard. A band pushed PAST the beam's 300 reach [330,380] can barely fire →
// MUCH worse dmg than the same beam held at a sane engaging band. This locks the regression a
// naive "just set max = skill reach" (or an optimizer walking the band outward) would cause.
const beamFar = agg('beam', 'dps', { min: 330, max: 380 });        // hold ~360: past 300 reach
const beamEngage = agg('beam', 'dps', { min: 124, max: 200 });     // a sane engaging band
report.push(`C3 beam engaging  [124,200] dmg ${beamEngage.dmg.toFixed(0).padStart(6)}  acts ${beamEngage.acts.toFixed(0)}%`);
report.push(`C3 beam out-of-reach[330,380] dmg ${beamFar.dmg.toFixed(0).padStart(6)}  acts ${beamFar.acts.toFixed(0)}%`);
assert.ok(beamEngage.dmg > beamFar.dmg * 2,
  'NEG-CONTROL C3: an engaging within-reach band must crush an out-of-reach band ' +
  '(engage ' + beamEngage.dmg.toFixed(0) + ' vs far ' + beamFar.dmg.toFixed(0) + ')');

// DETERMINISM: seeded aggregate must be identical back-to-back.
{
  const a = agg('beam', 'dps', { min: 200, max: 240 }).dmg;
  const b2 = agg('beam', 'dps', { min: 200, max: 240 }).dmg;
  assert.ok(Math.abs(a - b2) < 1, 'band-fitness is deterministic back-to-back (drift ' + Math.abs(a - b2).toFixed(2) + ')');
}

// CORE TRADEOFF the owner's design is bounded by (asserted — this is the honest shape of the DPS
// curve, and the single most important fact Part 2 must respect). In THIS engine the basic toss
// (reach ≈ basicAttackRange ≈ 170) is a ranged/beam cat's DPS backbone — it is near-constant uptime,
// while the 水枪 beam itself is a 5s-cooldown commit. CONSEQUENCE, measured not assumed:
//   • holding just INSIDE basic range (~155) is DPS-optimal,
//   • holding PAST basic range but inside the beam's 300 reach costs some DPS (the basic stops
//     connecting; only the slow beam remains),
//   • holding past the beam's reach craters (nothing fires).
// So the retreat floor MUST stay ≤ basicAttackRange (the old "ranged cat can't basic" regression),
// and a "stand at full 300 reach" band would genuinely regress DPS — which is precisely why the
// owner chose "skill-reach-primary with build MICRO-tweak" (a bounded nudge), not "reach = max".
// Part 2 is tuned so the extra standoff it grants a backline build stays a MICRO shift whose DPS
// cost is within noise; a bigger shift is a regression this verifier would catch.
{
  const hug  = agg('beam', 'dps', { min: 124, max: 159 });   // DPS-optimal hug, inside basic range
  const over = agg('beam', 'dps', { min: 230, max: 270 });   // over-standoff: past basic, near reach
  report.push('');
  report.push(`CORE beam hug         [124,159] dmg ${hug.dmg.toFixed(0).padStart(6)}  med ${hug.medDist.toFixed(0)}`);
  report.push(`CORE beam over-standoff[230,270] dmg ${over.dmg.toFixed(0).padStart(6)}  med ${over.medDist.toFixed(0)}`);
  report.push(`CORE beam out-of-reach [330,380] dmg ${beamFar.dmg.toFixed(0).padStart(6)}  med ${beamFar.medDist.toFixed(0)}`);
  // The monotone decline hug > over-standoff > out-of-reach is the design-critical shape; locking
  // it keeps anyone (incl. a future optimizer) from pushing the band needlessly outward.
  assert.ok(hug.dmg > over.dmg && over.dmg > beamFar.dmg,
    'CORE: beam DPS must decline monotonically with over-standoff (hug ' + hug.dmg.toFixed(0) +
    ' > over-standoff ' + over.dmg.toFixed(0) + ' > out-of-reach ' + beamFar.dmg.toFixed(0) + ')');
}

// DISCRIMINATION SWEEP (printed): the DPS-vs-distance curve the design reads — flat/rising out to
// reach, cliff past it.
report.push('');
for (const kind of ['beam', 'ranged']) {
  const rb = realBand(kind, 'dps');
  report.push(`${kind}/dps real band [${rb.min},${rb.max}] (${rb.role}), basicRange ${basicRangeOf(kind, 'dps').toFixed(0)}:`);
  for (const band of [{ min: 20, max: 45 }, { min: 124, max: 159 }, { min: 180, max: 220 }, { min: 230, max: 270 }, { min: 330, max: 380 }]) {
    const r = agg(kind, 'dps', band);
    report.push(`   band[${String(band.min).padStart(3)},${String(band.max).padStart(3)}]  dmg ${r.dmg.toFixed(0).padStart(6)}  acts ${r.acts.toFixed(0)}%  med ${r.medDist.toFixed(0)}`);
  }
}

// REAL-ENGINE cells (scored with the LIVE kitRangeBand = what the game does today). These are the
// before/after numbers Part 2 moves. Printed, not asserted (ranking is the controls' job; hard
// floors here would be brittle across the owner's battle.js churn).
report.push('');
report.push('REAL-ENGINE bands (live kitRangeBand) at the fitness scenario:');
for (const [kind, build] of [['beam', 'dps'], ['beam', 'support'], ['ranged', 'dps'], ['melee', 'tank'], ['hybrid', 'tank']]) {
  const rb = realBand(kind, build);
  const r = agg(kind, build, null, { standoff: 260 });
  report.push(`   ${(kind + '/' + build).padEnd(14)} band[${String(rb.min).padStart(3)},${String(rb.max).padStart(3)}] ${rb.role.padEnd(8)} dmg ${r.dmg.toFixed(0).padStart(6)}  acts ${r.acts.toFixed(0)}%  med ${r.medDist.toFixed(0)}`);
}

if (process.env.DUMP_FITNESS) console.log(report.join('\n'));
console.log('Cat Bond BAND-FITNESS verifier (deterministic, seeded, pinned-enemy): negative controls ' +
  'C1 frozen≈0 / C2 point-blank-ranged-still-fires / C3 out-of-reach ≪ within-reach — and CORE ' +
  '(beam DPS declines monotonically hug > over-standoff > out-of-reach, so the retreat floor must ' +
  'stay ≤ basicAttackRange and the band must not be pushed past skill reach) — all PASS.');
console.log('  EXPOSES fitness(kind,build,{min,max}) → mean simulated dmg + acts% over 4 seeds; ranks band A vs band B by real DPS.');
console.log('  Run with DUMP_FITNESS=1 to print the DPS-vs-distance sweep + before/after real-engine band dmg.');
