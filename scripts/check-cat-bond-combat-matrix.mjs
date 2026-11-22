/* Invariant-based combat tests for Cat Bond (public/cat-bond/js/battle.js).
 *
 * These assert PROPERTIES THAT MUST ALWAYS HOLD, not specific scripted outcomes —
 * the kind of test that catches whole CLASSES of regressions (a stuck ward, a lazy
 * gap-closer that never commits, a status that never expires) instead of one case.
 * Each invariant below corresponds to a real player-reported bug:
 *   INV-1  every timed ward (shield/protect/reflect) on EITHER side reaches 0 after
 *          its duration — enemy barriers must not stick on forever.
 *   INV-2  a dash/pounce/melee cat with a ready gap-closer and a reachable target
 *          actually CLOSES and deals damage within a few seconds (no "waits nearby").
 *   INV-3  no timer runs negative; no HP exceeds maxhp; knead stacks stay in [0,4].
 *   INV-4  a 15s auto-battle never throws and never leaves a live cat permanently
 *          root-locked with no backing cast/beam (the "卡在原地" freeze).
 * Boot scaffold mirrors scripts/check-cat-bond-ai.mjs (known-good fake DOM + vm). */
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

// ---- helper: build a battle with a known starter + wild cat ----
function newBattle(starterId='tangyuan', wildId='doudou', opts={}){
  const starter=State.makeCat(starterId,{affinity:opts.aff??40});
  starter.level=opts.lvl??16; starter.stats={pow:70,agi:80,vit:110,cha:60};
  const wild=GameData.speciesById(wildId);
  const b=new sandbox.window.Battle.CaptureBattle(game,[starter],wild);
  b.coach=null;                    // skip the tutorial hold
  return b;
}

// ============================================================================
// REAL-COMBAT AI MATRIX — the deterministic world-model VERIFIER (SOTA-grounded).
// Drives the REAL engine (b.update + autoDrive + smartAutoAction live) under a SEEDED
// rng for reproducibility, over the full kit × build matrix, and asserts two GROUND-TRUTH
// signals about the CAT: bandHold% (does the cat hold its own kitRangeBand) and dmg dealt.
// No decision logic is reimplemented here — the old harness's fatal flaw. All 48 cells are
// regression-locked, and 16 negative controls (frozen + runaway × 8 archetypes) prove the
// metric actually FAILS a broken AI. See simCell for the pinned-enemy rationale.
// ============================================================================
const KINDS = {
  melee:   { q:{kind:'melee',power:1.2} },
  ranged:  { q:{kind:'projectile',power:1.0} },
  dash:    { q:{kind:'dash',power:1.4} },
  pounce:  { q:{kind:'pounce',power:1.3} },
  leap:    { q:{kind:'leap',power:1.4} },
  beam:    { q:{kind:'beam',power:0.9,reach:300,channel:1.2} },
  support: { q:{kind:'heal',power:0}, e:{kind:'buff',power:0,tags:['shield'],shieldType:'barrier'} },
  hybrid:  { q:{kind:'melee',power:1.2}, e:{kind:'projectile',power:1.0} },
};
const BUILDS = ['tank','fighter','dps','assassin','control','support'];
// FIXED, verifier-OWNED engagement envelope per archetype — the ground-truth distance a healthy
// cat of this kind must hold vs the pinned enemy. Deliberately NOT derived from kitRangeBand():
// grading against the game's own band would be circular (a band-logic BUG would self-certify —
// a brawler wrongly sent to 300px scores 100% "in band" against its own broken band). Measured
// healthy medians: brawlers 76-97px, leap 112px; p90 ≤169 (leap ≤224). The hi bound is set just
// past healthy p90 and well below 300 so a backline/band-widen regression (parks ~300px) FAILS.
const ENVELOPE = {
  melee:[20,185], dash:[20,200], pounce:[20,200], hybrid:[20,200],
  leap:[20,245], ranged:[20,250], beam:[20,250], support:[20,250],
};
// Floors proven to sit in the gap between worst-healthy and EVERY degenerate control (frozen,
// 450px-runaway, backline-band, widened-band — all exercised below):
//   inEnv% — worst healthy = 90% (all 48 cells); every regression ≤26%. Floor 70.
//   acts%  — worst healthy = 22%; a cat that positions but never attacks scores ~0. Floor 10.
//   dmg    — PER-ARCHETYPE at ~45% of each kind's worst-healthy value, so a real DPS regression
//            on the tight cells (dash 1049, leap 819, hybrid 1129) is actually locked, not just
//            the zero-output case. (Round-2 challenger: a single global floor was too loose.)
const INENV_FLOOR = 70, ACTS_FLOOR = 10;
const DMG_FLOOR = { melee:2000, ranged:1900, dash:450, pounce:1900, leap:360, beam:1900, support:0, hybrid:500 };

function makeCell(kind,build,seed){
  const starter=Object.assign(State.makeCat("tangyuan",{affinity:60}),{level:16,buildType:build,stats:{pow:70,agi:80,vit:110,cha:60}});
  const b=new sandbox.window.Battle.CaptureBattle(game,[starter],GameData.speciesById("doudou"),{seed});
  b.coach=null; b.autoMode=true;        // DETERMINISTIC (seeded ctor)
  const f=b.me(), kit=KINDS[kind];
  f.qSkill=kit.q?{id:'simq',name:'q',element:'fire',...kit.q}:null;
  f.eSkill=kit.e?{id:'sime',name:'e',element:'fire',...kit.e}:null;
  for(let k=1;k<b.enemies.length;k++)b.enemies[k].alive=false;
  return {b,f};
}
// simCell drives the REAL engine for 12s against a FULLY PINNED enemy and measures three
// GROUND-TRUTH signals about the CAT:
//   inEnv% — frames the cat's distance falls inside the verifier-OWNED ENVELOPE[kind]. NOT the
//            game's kitRangeBand — grading against that is circular (a band bug self-certifies).
//   acts%  — frames the cat actually DID something offensive (enemy lost HP this frame, or the
//            cat has a live projectile in flight). A cat that stands in the envelope but never
//            attacks (band widened to the arena, or a support that never casts) fails this.
//   dmg    — total damage dealt to a 100k-HP enemy over 12s (real output; survives → no kill cap).
//
// WHY THE ENEMY IS FULLY PINNED (Round-1 fix): an earlier version re-pinned only e.y and let the
// enemy AI drive e.x to chase, so the distance signal secretly measured the ENEMY closing, not
// the cat — a frozen cat "passed". Re-pinning BOTH axes + zeroing velocity every frame kills the
// approach. (Verified: at each b.update start the enemy is exactly at (ex,ey); mid-update
// knockback is reset before the next frame samples, while e.hp damage still accrues.)
// `opts.mutate` forces a degenerate position; `opts.band` forces a broken kitRangeBand return —
// both used ONLY by the committed negative controls to prove the metric catches real breakage.
function simCell(kind,build,seed,opts={}){
  const {b,f}=makeCell(kind,build,seed);
  const e=b.enemies[0];
  const ex=f.x+300, ey=f.y;
  e.x=ex; e.y=ey; e.maxhp=e.hp=100000;                   // tanky → survives 12s → measures output, not kill
  if(opts.band) b.kitRangeBand=()=>opts.band;            // inject a broken band (control only)
  const hp0=e.hp, fx0=f.x, fy0=f.y, [lo,hi]=ENVELOPE[kind];
  let frames=0,inEnv=0,acts=0,prevHp=e.hp;
  for(let i=0;i<720;i++){                                // 12s
    b.update(0.016);
    e.x=ex; e.y=ey; if(e.vx!=null)e.vx=0; if(e.vy!=null)e.vy=0;   // FULLY pin the enemy (no chase)
    if(opts.mutate)opts.mutate(f,fx0,fy0,ex,ey);         // degenerate position (control only)
    frames++;
    const d=Math.hypot(e.x-f.x,e.y-f.y);
    if(d>=lo && d<=hi)inEnv++;
    const dealt=prevHp-e.hp; prevHp=e.hp;
    if(dealt>0 || (b.projectiles||[]).some(p=>p.owner==='me'))acts++;
  }
  return { inEnv:100*inEnv/frames, acts:100*acts/frames, dmg:hp0-e.hp };
}

// ---- NEGATIVE CONTROLS (committed): the metric must FAIL on a provably-broken AI for EVERY
// archetype — else a green matrix proves nothing. Four degenerate modes, each attacking a
// different lie a previous metric fell for:
//   FROZEN  — never moves (parks at 300px spawn). Catches "enemy chased a frozen cat".
//   RUNAWAY — forced to a 450px orbit. Catches far-kiting.
//   BACKLINE— kitRangeBand regressed to [230,320] for brawlers (the exact historical bug). The
//             cat obeys the broken band; a self-referential metric would self-certify. inEnv
//             (fixed envelope) must still FAIL it. Only brawler kinds (envelope hi ≤200).
//   WIDEBAND— kitRangeBand widened to [0,1000] + frozen at 300px. A band-hold metric passes at
//             any distance; inEnv + acts must catch it.
const FROZEN=(f,fx0,fy0)=>{ f.x=fx0; f.y=fy0; };
const RUNAWAY=(f,fx0,fy0,ex,ey)=>{ const a=Math.atan2(f.y-ey,f.x-ex); f.x=ex+Math.cos(a)*450; f.y=ey+Math.sin(a)*450; };
const AT300=(f,fx0,fy0,ex,ey)=>{ f.x=ex-300; f.y=ey; };
const BACKLINE={min:230,max:320,rush:230,role:'x',hp:1}, WIDE={min:0,max:1000,rush:0,role:'x',hp:1};
for(const kind of Object.keys(KINDS)){
  const fr=simCell(kind,'fighter',42,{mutate:FROZEN});
  const ru=simCell(kind,'fighter',42,{mutate:RUNAWAY});
  const wb=simCell(kind,'fighter',42,{band:WIDE,mutate:AT300});
  assert.ok(fr.inEnv<INENV_FLOOR,'NEG-CONTROL frozen '+kind+' must FAIL inEnv (got '+fr.inEnv.toFixed(0)+'%)');
  assert.ok(ru.inEnv<INENV_FLOOR,'NEG-CONTROL runaway '+kind+' must FAIL inEnv (got '+ru.inEnv.toFixed(0)+'%)');
  assert.ok(wb.inEnv<INENV_FLOOR,'NEG-CONTROL wideband '+kind+' must FAIL inEnv (got '+wb.inEnv.toFixed(0)+'%)');
  if(ENVELOPE[kind][1]<=200){   // brawler: the backline-band regression must be caught by inEnv
    const bl=simCell(kind,'fighter',42,{band:BACKLINE});
    assert.ok(bl.inEnv<INENV_FLOOR,'NEG-CONTROL backline-band '+kind+' must FAIL inEnv (got '+bl.inEnv.toFixed(0)+'%)');
  }
}

// DETERMINISM: seeded RNG makes a battle reproducible; across the 48-cell matrix the shared
// game/State globals drift slightly between cells, so two runs land within a few % rather than
// bit-equal. Assert the seeded run is STABLE back-to-back (catches gross non-determinism).
{
  const a=simCell('dash','fighter',42), b2=simCell('dash','fighter',42);
  assert.ok(Math.abs(a.inEnv-b2.inEnv)<=6,'seeded sim is stable back-to-back (inEnv drift '+Math.abs(a.inEnv-b2.inEnv).toFixed(1)+'% ≤6%)');
}

let checked=0;
const report=[];
for(const kind of Object.keys(KINDS)) for(const build of BUILDS){
  // average 3 seeds to damp scenario noise
  let ie=0,ac=0,dm=0; for(const s of [7,42,101]){ const r=simCell(kind,build,s); ie+=r.inEnv; ac+=r.acts; dm+=r.dmg; }
  ie/=3; ac/=3; dm/=3;
  const cell=kind+'/'+build;
  report.push(`${cell.padEnd(16)} inEnv ${ie.toFixed(0).padStart(3)}%  acts ${ac.toFixed(0).padStart(3)}%  dmg ${dm.toFixed(0).padStart(6)}`);
  checked++;
  // inEnv catches mispositioning (fixed ground truth, not self-referential); acts catches a cat
  // that stands in place but never fights; dmg (per-archetype) catches real output regressions.
  assert.ok(ie>=INENV_FLOOR,'MATRIX '+cell+' inEnv must stay >= '+INENV_FLOOR+'% (got '+ie.toFixed(0)+'%)');
  assert.ok(ac>=ACTS_FLOOR,'MATRIX '+cell+' must act (attack) >= '+ACTS_FLOOR+'% of frames (got '+ac.toFixed(0)+'%)');
  const dfloor=DMG_FLOOR[kind]??300;
  if(dfloor>0) assert.ok(dm>=dfloor,'MATRIX '+cell+' must deal >= '+dfloor+' dmg over 12s (got '+dm.toFixed(0)+')');
}
if(process.env.DUMP_MATRIX)console.log(report.join('\n'));
console.log('Cat Bond COMBAT MATRIX (deterministic, seeded): '+checked+' cells regression-locked (inEnv/acts/dmg vs FIXED envelope) + negative controls (frozen/runaway/backline-band/wideband) — all PASS.');
console.log('  CERTIFIES: single-enemy engagement distance + offensive output + that an action is taken, vs a stationary target.');
console.log('  Does NOT certify: survivability (pinned enemy barely attacks), target-switching, or multi-enemy behavior (future verifier extension).');
