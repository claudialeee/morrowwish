/* Cat Bond — UNIVERSAL deterministic combat EVALUATOR (RSI foundation).
 * scripts/rsi/evaluator.mjs
 *
 * WHAT THIS IS (and how it RELATES to the two existing verifiers):
 *   • scripts/check-cat-bond-combat-matrix.mjs — PASS/FAIL regression guard (inEnv/acts/dmg vs a
 *     FULLY PINNED enemy). Great for "did a change break positioning/output", but by its own header
 *     it does NOT certify survivability, target-switching, or multi-enemy behavior.
 *   • scripts/check-cat-bond-band-fitness.mjs — a RANKER of candidate kitRangeBands by simulated DPS,
 *     also vs a PINNED enemy. Its header is explicit: pinned enemy ⇒ it can only measure OUTPUT /
 *     positioning, never survival / switching / multi-enemy.
 *
 *   THIS file LIFTS that pinned-enemy limitation. It drives the REAL engine (public/cat-bond/js/
 *   battle.js) under a seeded RNG across THREE scenarios and returns a RICH, multi-dimensional metric
 *   set, plus a PLUGGABLE reward layer so a downstream optimizer can reward more than DPS:
 *     - solo-pinned : pure output/positioning baseline (same pin discipline as the matrix).
 *     - solo-live   : a FIGHTING enemy (real enemy AI drives it) → measures SURVIVAL (player hp kept,
 *                     faints) and whether the AI actually WINS.
 *     - multi       : 2–3 FIGHTING enemies → measures target-switching, getting-surrounded, AOE value.
 *
 * DETERMINISM (non-negotiable): every scenario is seeded (CaptureBattle ctor {seed} → mulberry32) and
 *   stepped on a fixed dt. Same (config,seed) ⇒ BYTE-IDENTICAL metrics. A back-to-back stability assert
 *   in the self-test proves it. The engine routes DECISION randomness through this.rng() (seeded), but
 *   it also makes bare Math.random()/Date.now() calls the engine's own header calls "cosmetic" (VFX
 *   jitter, death-penalty timers) — measured, those DO perturb outcomes frame-to-frame. Since this
 *   headless harness fully OWNS the world, each run PINS Math.random to a per-seed mulberry32 and
 *   Date.now to a constant for its duration, then restores them. Result: a scenario is a pure function
 *   of (seed,config). (We do NOT touch battle.js; we only sandbox global time/RNG around a sim run —
 *   standard deterministic-replay discipline.)
 *
 * HONEST LIMITATIONS (what each scenario can / cannot certify — read before trusting a number):
 *   • solo-pinned: the enemy is reassert-pinned + velocity-zeroed every frame, so it barely attacks.
 *     survival≈1 there is MEANINGLESS; only output/positioning are real. (Same caveat as the matrix.)
 *   • solo-live / multi: the enemy uses the SHIPPING enemy AI at the engine's own default stats. These
 *     DO exercise survival/switching, but "won"/"hpFracLeft" are only as representative as that default
 *     enemy. They are a RELATIVE signal (config A vs config B under identical enemies), NOT an absolute
 *     difficulty rating. Tune enemy.hp/enemy.dmg in `config.enemy` for a different operating point.
 *   • positioning (posPct) here is a COARSE "stayed engaged, not fled to a corner" band [15,320], NOT
 *     the matrix's per-archetype ENVELOPE. For a strict positioning gate, keep using the matrix.
 *   • negatedPct is "share of my resolveHit attempts that were fully negated (i-frames/shield/reflect/
 *     block)" — a cheap efficiency proxy, not a true projectile whiff-rate.
 *   • This file is a METRIC SOURCE for optimizers; it is intentionally NOT wired into `npm run check`.
 *
 * REWARD-PROXY SEAM (owner-requested, the whole point of #4): evaluate() returns RAW metrics and does
 *   NOT bake in "reward = dmg". scoreConfig(result, rewardModel) applies reward separately, where
 *   rewardModel is (a) undefined / a weights object → the built-in weighted-sum baseline, or (b) a
 *   FUNCTION (result, ctx) => number — the clean injection point for an EXTERNAL ground-truth proxy
 *   (an LLM-as-judge, or an imported best-practice game-AI heuristic). See scoreConfig()'s doc + the
 *   README block at the bottom for the exact signature a proxy must honor. No network call lives here.
 *
 * DISCIPLINE: reuses the proven vm/fake-DOM boot from the matrix verifier; READS/DRIVES the engine
 *   only — it never edits battle.js/skills.js/data.js. New file under scripts/rsi/ only. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ============================================================================================
// BOOT — identical fake-DOM + vm scaffold as scripts/check-cat-bond-combat-matrix.mjs (do not
// reinvent). Returns the live engine globals once; all scenarios reuse this single booted world.
// ============================================================================================
function boot() {
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
  const bootFn = listeners['win:DOMContentLoaded'];
  assert.ok(typeof bootFn === 'function', 'main.js registered DOMContentLoaded');
  bootFn();
  const w = sandbox.window;
  w.__game.start();
  return { game: w.__game, State: w.State, GameData: w.GameData, Skills: w.Skills, Battle: w.Battle, window: w };
}

const ENV = boot();

// Deterministic global-time/RNG sandbox for a single run. The engine makes bare Math.random()/
// Date.now() calls its own header deems "cosmetic", but they measurably perturb frame outcomes. We
// pin both to a per-seed reproducible stream for the run's duration, then restore — so a scenario is
// a pure function of (seed,config). (battle.js is untouched; only the globals are sandboxed.)
function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function withDeterministicGlobals(seed, fn) {
  const origRandom = Math.random, origNow = Date.now;
  const rnd = mulberry32((seed >>> 0) ^ 0x9e3779b9);
  const now = 1700000000000;                 // fixed epoch so _deathPenaltyUntil et al. are stable
  Math.random = rnd; Date.now = () => now;
  try { return fn(); } finally { Math.random = origRandom; Date.now = origNow; }
}

// ============================================================================================
// CONFIG — the plain, JSON-able object an optimizer varies. Every field is optional; defaults
// below make `evaluate({})` a sane "fighter vs doudou" run. An optimizer passes EITHER a candidate
// AI-param set (ai.band / ai.dodgeChance) OR a candidate skill/stat build (cat.*) — or both.
//
//   config = {
//     cat: {
//       species : 'tangyuan',                    // GameData species id for the player cat
//       build   : 'fighter',                     // buildType: tank|fighter|assassin|dps|control|support
//       level   : 16,
//       affinity: 60,
//       stats   : { pow:70, agi:80, vit:110, cha:60 },   // overrides the rolled stats (stable)
//       loadout : {                              // synthetic skills injected onto the fighter's slots
//         q    : { kind:'melee', power:1.2, cd:1.2, ... },   // null → innate toy toss
//         e    : { kind:'projectile', power:1.0, cd:1.0 } | null,
//         basic: {...} | undefined,              // optional basicSkill override
//       },
//     },
//     enemy: { species:'doudou', hp:<pin>, dmg:<pin> },     // enemy setup (count comes from scenario)
//     ai: {
//       band       : {min,max} | (f)=>({min,max,rush,role,hp}),   // FORCE kitRangeBand (param candidate)
//       dodgeChance: 0..1,                       // FORCE autoDodgeChance (param candidate)
//       frozen     : false,                      // do-nothing control: AI never moves/acts
//     },
//   }
// ============================================================================================
const DEFAULT_CONFIG = {
  cat: {
    species: 'tangyuan', build: 'fighter', level: 16, affinity: 60,
    stats: { pow: 70, agi: 80, vit: 110, cha: 60 },
    loadout: { q: { kind: 'melee', power: 1.2, cd: 1.2 }, e: { kind: 'projectile', power: 1.0, cd: 1.0 } },
  },
  enemy: { species: 'doudou' },
  ai: {},
};

// scenario → enemy count. solo-pinned/solo-live are 1; multi is 3.
const SCENARIOS = ['solo-pinned', 'solo-live', 'multi'];
const SCN_ENEMIES = { 'solo-pinned': 1, 'solo-live': 1, 'multi': 3 };

// ---- build a battle for (config,seed,scenario). Mirrors the matrix's makeCell boot, then rebuilds
// the enemy pack to the scenario's fixed count so results are comparable + deterministic. ----
function buildBattle(config, seed, scenario) {
  const { State, GameData, Battle, game } = ENV;
  const c = config.cat;
  const starter = Object.assign(State.makeCat(c.species, { affinity: c.affinity ?? 60 }), {
    level: c.level ?? 16, buildType: c.build ?? 'fighter', stats: { ...(c.stats ?? DEFAULT_CONFIG.cat.stats) },
  });
  const leadSp = GameData.speciesById(config.enemy?.species ?? 'doudou');
  const b = new Battle.CaptureBattle(game, [starter], leadSp, { seed });
  b.coach = null; b.autoMode = true;              // deterministic seeded auto-battle, no tutorial hold
  b.reserve = [];                                 // single field cat → clean hp/faint accounting, no subs

  // inject the candidate loadout onto the player fighter
  const f = b.me(), lo = c.loadout ?? {};
  f.qSkill = lo.q ? { id: 'rsiq', name: 'q', element: 'fire', ...lo.q } : null;
  f.eSkill = lo.e ? { id: 'rsie', name: 'e', element: 'fire', ...lo.e } : null;
  if (lo.basic) f.basicSkill = { id: 'rsibasic', name: 'basic', element: 'fire', ...lo.basic };
  if (lo.ult) f.ultSkill = { id: 'rsiult', name: 'ult', element: 'fire', ...lo.ult };

  // rebuild the enemy pack to the scenario's fixed count (deterministic: makeEnemy keeps using the
  // seeded rng in order). Optional pins from config.enemy make the fight winnable/comparable.
  const count = SCN_ENEMIES[scenario];
  const enemies = [];
  for (let i = 0; i < count; i++) enemies.push(b.makeEnemy(leadSp, i, count));
  b.enemies = enemies;
  const epin = config.enemy ?? {};
  for (const e of enemies) {
    if (epin.hp != null) { e.maxhp = e.hp = epin.hp; e.poise = e.poiseMax = Math.round(epin.hp * 0.6); }
    if (epin.dmg != null) e.dmg = epin.dmg;
  }

  // apply AI-param candidates / controls
  const ai = config.ai ?? {};
  if (ai.band) {
    const bandFn = typeof ai.band === 'function' ? ai.band
      : () => ({ min: ai.band.min, max: ai.band.max, rush: ai.band.min, role: 'x', hp: 1 });
    b.kitRangeBand = bandFn;
  }
  if (ai.dodgeChance != null) b.autoDodgeChance = () => ai.dodgeChance;
  if (ai.frozen) { b.autoDrive = () => {}; b.updateAllyAI = () => {}; }  // do-nothing control

  return { b, f };
}

// ============================================================================================
// runScenario — drive the REAL engine for a fixed frame budget and collect raw metrics.
// Returns the per-scenario RAW metrics object (see the shape block in evaluate()).
// ============================================================================================
function runScenario(config, seed, scenario, opts = {}) {
  // Whole run (construction + stepping) under a per-seed pinned Math.random/Date.now so the engine's
  // "cosmetic" bare-random calls can't make the metrics flaky. Pure function of (seed,config).
  return withDeterministicGlobals(seed, () => runScenarioInner(config, seed, scenario, opts));
}
function runScenarioInner(config, seed, scenario, { frames = 900, dt = 0.016 } = {}) {
  const { b, f } = buildBattle(config, seed, scenario);
  const pinned = scenario === 'solo-pinned';

  // cheap "negated offense" tally: wrap resolveHit to count my attempts vs fully-negated ones.
  let atk = 0, atkNeg = 0;
  const realResolve = b.resolveHit.bind(b);
  b.resolveHit = (target, side, skill, dmg, x, y, proj) => {
    const r = realResolve(target, side, skill, dmg, x, y, proj);
    if (side === 'me') { atk++; if (!r || (r.dealt || 0) <= 0) atkNeg++; }
    return r;
  };

  // pin geometry for solo-pinned (same discipline as the matrix: reassert pos + zero velocity).
  const e0 = b.enemies[0];
  let ex = 0, ey = 0;
  if (pinned) { ex = f.x + 300; ey = f.y; e0.x = ex; e0.y = ey; e0.maxhp = e0.hp = 100000; }

  const teamInitHp = b.team.reduce((n, t) => n + (t.hp || 0), 0);
  const enemyInitHp = b.enemies.reduce((n, e) => n + (e.maxhp || 0), 0);

  let acts = 0, posFrames = 0, killTime = null;
  for (let i = 0; i < frames; i++) {
    const beforeEnemyHp = b.enemies.reduce((n, e) => n + Math.max(0, e.alive ? e.hp : 0), 0);
    b.update(dt);
    if (pinned) { e0.x = ex; e0.y = ey; if (e0.vx != null) e0.vx = 0; if (e0.vy != null) e0.vy = 0; }

    const me = b.me();
    const live = b.liveEnemies();
    // acts%: enemy lost HP this frame OR I have a shot in flight
    const afterEnemyHp = b.enemies.reduce((n, e) => n + Math.max(0, e.alive ? e.hp : 0), 0);
    if (afterEnemyHp < beforeEnemyHp || (b.projectiles || []).some(p => p.owner === 'me')) acts++;
    // positioning: nearest live enemy within a coarse "engaged, not fled" band
    if (me && me.alive && live.length) {
      let nd = 1e9; for (const e of live) { const d = Math.hypot(e.x - me.x, e.y - me.y); if (d < nd) nd = d; }
      if (nd >= 15 && nd <= 320) posFrames++;
    }
    if (live.length === 0 && killTime == null) killTime = b.t;
    if (b.done && b.result !== 'win') break;   // fled/defeated: stop early (deterministic)
    if (live.length === 0) break;              // pack cleared: the kill is logged; stop
  }

  const teamEndHp = b.team.reduce((n, t) => n + Math.max(0, t.hp || 0), 0);
  const faints = b.team.filter(t => !t.alive || (t.hp || 0) <= 0).length;
  const enemyEndHp = b.enemies.reduce((n, e) => n + Math.max(0, e.alive ? e.hp : 0), 0);
  const dmgDealt = Math.max(0, (pinned ? 100000 : enemyInitHp) - enemyEndHp);
  const dmgTaken = Math.max(0, teamInitHp - teamEndHp);
  const won = killTime != null ? 1 : 0;        // whole pack downed within the budget
  const timeToKill = killTime != null ? killTime : b.t;

  return {
    scenario,
    dmgDealt: Math.round(dmgDealt),
    dmgTaken: Math.round(dmgTaken),
    hpFracLeft: teamInitHp > 0 ? teamEndHp / teamInitHp : 0,
    faints,
    won,
    timeToKill,
    actsPct: 100 * acts / frames,
    posPct: 100 * posFrames / frames,
    negatedPct: atk > 0 ? 100 * atkNeg / atk : 0,
    _enemyInitHp: pinned ? 100000 : enemyInitHp,
    _frames: frames, _dt: dt,
  };
}

// Normalize raw metrics into a small [0,1] vector a reward function can weight. Scenario-independent:
// output = fraction of the enemy HP pool removed; survival = hp kept; speed = how fast the kill was.
function normalize(m) {
  const duration = m._frames * m._dt;
  const output = m._enemyInitHp > 0 ? Math.min(1, m.dmgDealt / m._enemyInitHp) : 0;
  return {
    survival: Math.max(0, Math.min(1, m.hpFracLeft)),
    win: m.won,
    output,
    positioning: Math.max(0, Math.min(1, m.posPct / 100)),
    efficiency: Math.max(0, Math.min(1, 1 - m.negatedPct / 100)),
    speed: m.won ? Math.max(0, Math.min(1, 1 - m.timeToKill / duration)) : 0,
  };
}

// Average a list of raw metric objects (over seeds), then re-derive norm from the mean.
function meanMetrics(list) {
  const keys = ['dmgDealt','dmgTaken','hpFracLeft','faints','won','timeToKill','actsPct','posPct','negatedPct','_enemyInitHp','_frames','_dt'];
  const out = { scenario: list[0].scenario };
  for (const k of keys) out[k] = list.reduce((s, m) => s + m[k], 0) / list.length;
  out.norm = normalize(out);
  return out;
}

// ============================================================================================
// PUBLIC API #1 — evaluate(config, opts) → metrics
//
//   opts = { scenarios?: string[]   (default ['solo-pinned','solo-live','multi'])
//            seeds?:     number[]   (default [7,42,101]; averaged to damp scenario noise)
//            frames?:    number     (default 900 sim frames)
//            dt?:        number     (default 0.016) }
//
// RETURNS (all raw + a normalized sub-vector; nothing here is a "reward"):
//   {
//     config,                         // echo of the (defaulted) config used
//     perScenario: {
//       'solo-live': {
//         scenario, dmgDealt, dmgTaken, hpFracLeft, faints, won(0|1), timeToKill,
//         actsPct, posPct, negatedPct,
//         norm: { survival, win, output, positioning, efficiency, speed }   // each 0..1
//       }, ...
//     },
//     aggregate: { ...same shape, averaged across scenarios... , norm:{...} },
//   }
// ============================================================================================
export function evaluate(config = {}, opts = {}) {
  const cfg = {
    cat: { ...DEFAULT_CONFIG.cat, ...(config.cat || {}),
           stats: { ...DEFAULT_CONFIG.cat.stats, ...((config.cat || {}).stats || {}) },
           loadout: (config.cat && 'loadout' in config.cat) ? config.cat.loadout : DEFAULT_CONFIG.cat.loadout },
    enemy: { ...DEFAULT_CONFIG.enemy, ...(config.enemy || {}) },
    ai: { ...(config.ai || {}) },
  };
  const scenarios = opts.scenarios ?? SCENARIOS;
  const seeds = opts.seeds ?? [7, 42, 101];
  const runOpts = { frames: opts.frames ?? 900, dt: opts.dt ?? 0.016 };

  const perScenario = {};
  for (const scn of scenarios) {
    const runs = seeds.map(s => runScenario(cfg, s, scn, runOpts));
    perScenario[scn] = meanMetrics(runs);
  }
  // aggregate = mean of the per-scenario means
  const aggregate = meanMetrics(Object.values(perScenario).map(m => ({ ...m, scenario: 'aggregate' })));
  aggregate.scenario = 'aggregate';
  return { config: cfg, perScenario, aggregate };
}

// ============================================================================================
// REWARD LAYER — kept SEPARATE from evaluate() on purpose (owner-requested "ground-truth reward
// proxy" seam). evaluate() never decides what "good" means; scoreConfig() does, and it is pluggable.
// ============================================================================================

// The built-in baseline reward: a weighted sum over the aggregate normalized vector. These default
// weights deliberately reward SURVIVAL + WINNING + positioning (the dimensions the pinned verifiers
// could not see), not just output — so "lifting the pinned limitation" shows up in the score.
export const DEFAULT_WEIGHTS = {
  win: 0.30, survival: 0.25, output: 0.20, positioning: 0.12, speed: 0.08, efficiency: 0.05,
};

function weightedSum(norm, weights = DEFAULT_WEIGHTS) {
  let s = 0, wsum = 0;
  for (const k in weights) { s += (norm[k] ?? 0) * weights[k]; wsum += weights[k]; }
  return wsum > 0 ? s / wsum : 0;
}

// The baseline scorer applied to a full evaluate() result (uses the aggregate norm vector).
function baselineScore(result, weights = DEFAULT_WEIGHTS) {
  return weightedSum(result.aggregate.norm, weights);
}

/**
 * PUBLIC API #2 — scoreConfig(result, rewardModel) → number  (higher = better)
 *
 *   result       : the object returned by evaluate(config, opts).
 *   rewardModel  : ONE of —
 *     • undefined                      → built-in baseline (DEFAULT_WEIGHTS weighted sum).
 *     • { weights: {survival,win,output,positioning,speed,efficiency} }
 *                                      → built-in weighted sum with YOUR weights (missing keys = 0).
 *     • function (result, ctx) => number
 *                                      → EXTERNAL GROUND-TRUTH PROXY injection point (see below).
 *
 * ---- EXTERNAL PROXY CONTRACT (the seam a stronger judge plugs into) ----
 *   Pass a function. It receives:
 *     result : the SAME full evaluate() output (raw + normalized metrics for every scenario).
 *     ctx    : {
 *       baseline(weights?) : number              // the built-in heuristic score, to blend/fallback to
 *       weightedSum(norm, weights) : number      // helper to score any norm vector
 *       DEFAULT_WEIGHTS    : object
 *     }
 *   It MUST return a finite Number (any scale; optimizers only compare relative values).
 *
 *   This is exactly where an LLM-as-judge or an imported best-practice game-AI heuristic goes. We do
 *   NOT implement the LLM call here (no network/credentials assumed). A real integration looks like:
 *
 *       const llmJudge = (result, ctx) => {
 *         // 1. serialize result.perScenario (JSON-able) into a prompt,
 *         // 2. call YOUR Claude/other endpoint SYNCHRONOUSLY or pre-fetch a label,
 *         // 3. parse a 0..1 ground-truth score from the reply,
 *         // 4. optionally blend with the engine's own numbers:
 *         return 0.5 * labelFromJudge + 0.5 * ctx.baseline();
 *       };
 *       const reward = scoreConfig(evaluate(candidate), llmJudge);
 *
 *   Because the proxy receives the full raw metrics and returns a scalar, it can override OR temper
 *   the engine's self-measured reward with an external "ground truth" the engine cannot compute.
 */
export function scoreConfig(result, rewardModel) {
  const ctx = {
    baseline: (w) => baselineScore(result, w),
    weightedSum,
    DEFAULT_WEIGHTS,
  };
  if (typeof rewardModel === 'function') {
    const v = rewardModel(result, ctx);
    if (!Number.isFinite(v)) throw new Error('scoreConfig: external reward proxy must return a finite number');
    return v;
  }
  if (rewardModel && rewardModel.weights) return baselineScore(result, rewardModel.weights);
  return baselineScore(result);
}

// ============================================================================================
// SELF-TEST + COMMITTED NEGATIVE CONTROLS (must pass). `node scripts/rsi/evaluator.mjs` exits 0.
// The point: prove the evaluator DISCRIMINATES on SURVIVAL + MULTI-ENEMY (not just DPS) — the whole
// reason for lifting the pinned limitation — and is deterministic.
// ============================================================================================
function fmt(m) {
  return `dealt ${String(m.dmgDealt).padStart(6)}  taken ${String(m.dmgTaken).padStart(5)}  ` +
    `hp% ${(m.hpFracLeft * 100).toFixed(0).padStart(3)}  faint ${m.faints.toFixed(1)}  won ${m.won.toFixed(2)}  ` +
    `ttk ${m.timeToKill.toFixed(1).padStart(4)}  acts ${m.actsPct.toFixed(0).padStart(3)}%  pos ${m.posPct.toFixed(0).padStart(3)}%`;
}

function selfTest() {
  const report = [];
  const OPTS = { seeds: [7, 42, 101], frames: 1800 };

  // Reasonable enemy pin so solo-live/multi are winnable by a strong AI but genuinely threaten a weak
  // one — this is what makes survival/multi DISCRIMINATION visible (and is the documented operating point).
  // dmg 60 over ~23 sim-seconds: a fighting AI kills + keeps most HP; a do-nothing AI gets worn down.
  const ENEMY = { species: 'doudou', hp: 900, dmg: 60 };

  // STRONG baseline: a real fighter with a melee combo + ranged poke, engine's own kitRangeBand.
  const STRONG = { cat: { build: 'fighter', stats: { pow: 90, agi: 80, vit: 130, cha: 60 },
    loadout: { q: { kind: 'melee', power: 1.4, cd: 1.1 }, e: { kind: 'projectile', power: 1.1, cd: 1.0 } } },
    enemy: ENEMY };
  // FROZEN control: identical cat, but the AI never moves or acts (do-nothing).
  const FROZEN = { ...STRONG, ai: { frozen: true } };

  const strong = evaluate(STRONG, OPTS);
  const frozen = evaluate(FROZEN, OPTS);

  for (const scn of SCENARIOS) {
    report.push(`  ${scn.padEnd(12)} STRONG  ${fmt(strong.perScenario[scn])}`);
    report.push(`  ${scn.padEnd(12)} FROZEN  ${fmt(frozen.perScenario[scn])}`);
  }

  // ---- DETERMINISM: same config+seeds ⇒ identical metrics back-to-back (the matrix's stability assert).
  {
    const a = evaluate(STRONG, OPTS), b = evaluate(STRONG, OPTS);
    for (const scn of SCENARIOS) {
      const x = a.perScenario[scn], y = b.perScenario[scn];
      assert.ok(Math.abs(x.dmgDealt - y.dmgDealt) < 1e-6 && Math.abs(x.dmgTaken - y.dmgTaken) < 1e-6 &&
        Math.abs(x.hpFracLeft - y.hpFracLeft) < 1e-9 && x.won === y.won,
        'DETERMINISM: ' + scn + ' must be identical back-to-back');
    }
  }

  // ---- NEG-CONTROL A (OUTPUT, solo-pinned): frozen deals ~0 vs a strong cat that outputs real dmg.
  assert.ok(frozen.perScenario['solo-pinned'].dmgDealt < 400,
    'NEG-CONTROL frozen solo-pinned must deal ~0 dmg (got ' + frozen.perScenario['solo-pinned'].dmgDealt + ')');
  assert.ok(strong.perScenario['solo-pinned'].dmgDealt > 3000,
    'baseline solo-pinned must deal real dmg (got ' + strong.perScenario['solo-pinned'].dmgDealt + ')');

  // ---- NEG-CONTROL B (SURVIVAL, solo-live): THE headline for lifting the pinned limitation. A frozen
  // cat that never dodges/kills gets chewed up (low hp kept, likely faints, never wins); the strong cat
  // keeps far more HP and wins. A pinned-only verifier CANNOT see this difference — this one does.
  {
    const fs = frozen.perScenario['solo-live'], ss = strong.perScenario['solo-live'];
    assert.ok(ss.hpFracLeft > fs.hpFracLeft + 0.3,
      'NEG-CONTROL solo-live: strong must keep much more HP than frozen (strong ' +
      ss.hpFracLeft.toFixed(2) + ' vs frozen ' + fs.hpFracLeft.toFixed(2) + ')');
    assert.ok(ss.won >= fs.won && ss.won > 0.5,
      'NEG-CONTROL solo-live: strong must win, frozen must not (strong ' + ss.won.toFixed(2) + ' vs frozen ' + fs.won.toFixed(2) + ')');
    assert.ok(fs.won < 0.5, 'NEG-CONTROL solo-live: frozen must NOT win (got ' + fs.won.toFixed(2) + ')');
  }

  // ---- NEG-CONTROL C (MULTI-ENEMY): with 3 enemies the gap must be even starker — a frozen cat gets
  // surrounded and overwhelmed; the strong cat survives/wins. Proves the metric reacts to being outnumbered.
  {
    const fm = frozen.perScenario['multi'], sm = strong.perScenario['multi'];
    assert.ok(sm.hpFracLeft > fm.hpFracLeft + 0.3,
      'NEG-CONTROL multi: strong must survive the 3-pack far better than frozen (strong ' +
      sm.hpFracLeft.toFixed(2) + ' vs frozen ' + fm.hpFracLeft.toFixed(2) + ')');
    assert.ok(sm.dmgDealt > fm.dmgDealt * 3,
      'NEG-CONTROL multi: strong must out-damage frozen in the pack (strong ' + sm.dmgDealt + ' vs frozen ' + fm.dmgDealt + ')');
  }

  // ---- REWARD SEAM: baseline scorer ranks strong ≫ frozen; and an EXTERNAL proxy function is honored.
  const sStrong = scoreConfig(strong);
  const sFrozen = scoreConfig(frozen);
  report.push('');
  report.push(`  baseline reward:   STRONG ${sStrong.toFixed(3)}   FROZEN ${sFrozen.toFixed(3)}`);
  assert.ok(sStrong > sFrozen + 0.15, 'REWARD baseline must score strong clearly above frozen');

  // custom-weights path (survival-only reward) still ranks strong above frozen
  const survOnly = { weights: { survival: 1 } };
  assert.ok(scoreConfig(strong, survOnly) > scoreConfig(frozen, survOnly),
    'REWARD custom survival-only weights must still rank strong > frozen');

  // external ground-truth-proxy injection: a stub judge that returns 0.5*its-own-label + 0.5*baseline.
  // (Here the "label" is just survival to keep the stub deterministic/offline; a real one calls an LLM.)
  let proxySawResult = false, proxyGotCtx = false;
  const stubProxy = (result, ctx) => {
    proxySawResult = !!(result && result.perScenario && result.aggregate);
    proxyGotCtx = typeof ctx.baseline === 'function' && typeof ctx.weightedSum === 'function';
    const label = result.aggregate.norm.survival;        // stand-in for an external ground-truth label
    return 0.5 * label + 0.5 * ctx.baseline();
  };
  const sProxyStrong = scoreConfig(strong, stubProxy);
  const sProxyFrozen = scoreConfig(frozen, stubProxy);
  assert.ok(proxySawResult && proxyGotCtx, 'REWARD proxy seam must pass the full result + a usable ctx');
  assert.ok(Number.isFinite(sProxyStrong) && sProxyStrong > sProxyFrozen,
    'REWARD external proxy must be honored and rank strong > frozen');
  // non-finite return must be rejected (contract enforcement)
  let threw = false; try { scoreConfig(strong, () => NaN); } catch { threw = true; }
  assert.ok(threw, 'REWARD proxy returning non-finite must throw');

  report.push(`  proxy reward:      STRONG ${sProxyStrong.toFixed(3)}   FROZEN ${sProxyFrozen.toFixed(3)}  (external seam honored)`);

  if (process.env.DUMP_EVAL) console.log(report.join('\n'));
  return { report };
}

// run the self-test only when invoked directly (not when imported by an optimizer)
const isMain = (() => { try { return import.meta.url === 'file://' + process.argv[1]; } catch { return false; } })();
if (isMain) {
  selfTest();
  console.log('Cat Bond RSI EVALUATOR (deterministic, seeded, 3 scenarios): solo-pinned / solo-live / multi — self-test PASS.');
  console.log('  CERTIFIES (relative, config-vs-config): survival (hp kept + faints), winning, target engagement across a 3-pack,');
  console.log('  output, positioning, and a cheap negated-offense efficiency proxy — lifting the pinned-enemy limitation.');
  console.log('  Negative controls: FROZEN do-nothing scores ~0 and never wins on live/multi; STRONG baseline wins + survives.');
  console.log('  API: evaluate(config,opts)->{perScenario,aggregate} ; scoreConfig(result,rewardModel)->number ; reward proxy = fn(result,ctx).');
  console.log('  Run with DUMP_EVAL=1 to print the per-scenario metric table + reward scores.');
}
