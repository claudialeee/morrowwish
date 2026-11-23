/* Cat Bond — verifier-gated numeric OPTIMIZER (RSI self-iteration engine).
 * scripts/rsi/optimize.mjs
 *
 * WHAT THIS IS (and how it RELATES to the evaluator it stands on):
 *   scripts/rsi/evaluator.mjs is the deterministic FITNESS ORACLE. It drives the REAL battle engine
 *   across 3 seeded scenarios (solo-pinned / solo-live / multi) and returns multi-dimensional metrics;
 *   scoreConfig(result, rewardModel) collapses them to a single scalar (higher = better). THIS file is
 *   the self-iterates piece: a derivative-free SEARCH over a small, bounded, named AI-param vector that
 *   maximizes scoreConfig, using evaluate()+scoreConfig() as the only source of truth. This is the
 *   AlphaZero/CMA-ES-style "compound off the verifier" loop — the optimizer proposes params, the
 *   verifier judges them, and the loop keeps the ones the verifier certifies as better.
 *
 * WHAT IT DELIBERATELY DOES NOT DO (keeping the loop honest):
 *   • It does NOT reimplement combat or metrics — it imports the REAL evaluator.
 *   • It does NOT auto-edit battle.js / skills.js / the evaluator. It PROPOSES params and WRITES them to
 *     a JSON a human/integrator reads; applying them to the game is a separate, human-gated step.
 *   • It is NOT wired into `npm run check`. It is a bounded offline research tool under scripts/rsi/.
 *
 * DETERMINISM (non-negotiable): the search is driven by an explicitly-threaded seeded PRNG (mulberry32),
 *   NEVER Math.random (the evaluator sandboxes global Math.random/Date.now around each sim, so relying on
 *   it here would be both non-deterministic AND clobbered). Same --seed ⇒ byte-identical search trajectory
 *   AND identical proposed params. The evaluator is itself deterministic per (config,seed), so the whole
 *   pipeline is a pure function of (seed, bounds, iters, rewardModel).
 *
 * ANTI-OVERFIT / HONESTY (the headline guard): fitness is measured on a TRAINING seed set. The known
 *   hazard (which the band-fitness author already hit) is tuning into a "seed notch" — a param vector that
 *   looks great on the seeds it was optimized against but does not generalize. So every winner is RE-SCORED
 *   on a HELD-OUT seed set it never saw during search, and we report BOTH. If the held-out gain collapses
 *   (or goes negative), we SAY SO: a win that only holds on training seeds is a fake win.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, scoreConfig, DEFAULT_WEIGHTS } from './evaluator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, 'optimized-params.json');

// ============================================================================================
// SEEDED PRNG — mulberry32 + a Box–Muller gaussian drawn from it. Threaded explicitly everywhere;
// the search NEVER calls Math.random. Same seed ⇒ same stream ⇒ same search trajectory.
// ============================================================================================
function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seed) {
  const u = mulberry32(seed);
  return {
    next: u,                                   // uniform [0,1)
    gauss() {                                  // standard normal via Box–Muller (both uniforms seeded)
      let a = 0, b = 0;
      while (a <= 1e-12) a = u();              // avoid log(0)
      b = u();
      return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
    },
  };
}

// ============================================================================================
// PARAM SPACE — small, named, bounded. Each entry = one scalar knob the optimizer varies, with a
// hard [lo,hi] bound. The search runs in a normalized [0,1]^d cube and maps to these bounds on
// decode; cross-constraints (e.g. max ≥ min+15) are enforced by repair() AFTER decode.
//
// EXTENSION SEAM (one-line to add a param): push another {name, lo, hi} here and read it in
// buildConfig() below (e.g. a future kitRangeBand utility weight, aggression, kite bias, ...).
// Nothing else in the optimizer changes — the ES operates on the vector length generically.
// ============================================================================================
const SPACE = [
  { name: 'min',   lo: 20, hi: 260 },          // engagement band inner edge (px)
  { name: 'max',   lo: 35, hi: 360 },          // engagement band outer edge (px); repaired to ≥ min+15
  { name: 'dodge', lo: 0,  hi: 1   },          // autoDodgeChance (0..1)
];
const MIN_BAND_WIDTH = 15;

function decode(norm) {                        // normalized [0,1]^d → named raw params
  const p = {};
  for (let i = 0; i < SPACE.length; i++) {
    const s = SPACE[i];
    p[s.name] = s.lo + clamp01(norm[i]) * (s.hi - s.lo);
  }
  return repair(p);
}
function repair(p) {                            // enforce cross-constraints (keeps proposals legal)
  p.min = clamp(p.min, SPACE[0].lo, SPACE[0].hi);
  p.max = clamp(p.max, p.min + MIN_BAND_WIDTH, SPACE[1].hi);
  p.dodge = clamp01(p.dodge);
  // round to the game's natural integer px / 2-dp dodge so proposed params are clean + reproducible
  p.min = Math.round(p.min);
  p.max = Math.round(p.max);
  p.dodge = Math.round(p.dodge * 100) / 100;
  return p;
}
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function clamp01(v) { return clamp(v, 0, 1); }

// map a raw param object into the evaluator config's ai.* fields (the ONLY thing we vary per candidate)
function buildConfig(baseConfig, p) {
  return {
    ...baseConfig,
    ai: { ...(baseConfig.ai || {}), band: { min: p.min, max: p.max }, dodgeChance: p.dodge },
  };
}

// ============================================================================================
// FITNESS — the verifier gate. averaged scoreConfig over a seed set (train or held-out). This is
// the ONLY place the optimizer learns "better": it never inspects raw metrics, only the scalar the
// reward model certifies. rewardModel is passed straight through to scoreConfig (undefined = baseline).
// ============================================================================================
function fitness(baseConfig, p, seeds, rewardModel, runOpts) {
  const cfg = buildConfig(baseConfig, p);
  const result = evaluate(cfg, { ...runOpts, seeds });
  return { score: scoreConfig(result, rewardModel), result };
}

// convenience: pull the headline raw dims (dmg + survival) averaged across scenarios, for reporting.
function headline(result) {
  const agg = result.aggregate;
  return { dmg: Math.round(agg.dmgDealt), hp: agg.hpFracLeft, win: agg.won, score: null };
}

// ============================================================================================
// (1+1)-ES with Rechenberg's 1/5-success-rule step adaptation. Simple, robust, derivative-free,
// and fully deterministic given the threaded PRNG. One parent, one mutated child per iteration;
// keep the child iff the verifier scores it strictly better; grow the mutation step when we are
// succeeding often (>1/5) and shrink it when we are not. Operates in normalized [0,1]^d space.
// ============================================================================================
function optimizeCell(cell, { iters, seeds, rewardModel, runOpts, rng }) {
  const d = SPACE.length;
  // start at the normalized default-band vector so the search begins from a sane, in-bounds proposal
  let parent = cell.startNorm.slice();
  let parentP = decode(parent);
  let parentFit = fitness(cell.config, parentP, seeds, rewardModel, runOpts).score;
  let evals = 1;

  let sigma = 0.22;                             // mutation step (fraction of the unit cube per dim)
  const SUCCESS_TARGET = 1 / 5, ADAPT_EVERY = 5, GROW = 1.25, SHRINK = 0.82;
  let winHist = [];

  const trajectory = [{ it: 0, sigma, fit: parentFit, p: { ...parentP } }];

  for (let it = 1; it <= iters; it++) {
    const child = new Array(d);
    for (let i = 0; i < d; i++) child[i] = clamp01(parent[i] + sigma * rng.gauss());
    const childP = decode(child);
    const childFit = fitness(cell.config, childP, seeds, rewardModel, runOpts).score;
    evals++;

    const improved = childFit > parentFit + 1e-9;
    if (improved) { parent = child; parentP = childP; parentFit = childFit; }
    winHist.push(improved ? 1 : 0);

    // 1/5 rule: adapt sigma from the recent success rate
    if (it % ADAPT_EVERY === 0) {
      const rate = winHist.reduce((s, x) => s + x, 0) / winHist.length;
      sigma *= rate > SUCCESS_TARGET ? GROW : SHRINK;
      sigma = clamp(sigma, 0.01, 0.6);
      winHist = [];
    }
    trajectory.push({ it, sigma: +sigma.toFixed(4), fit: +parentFit.toFixed(5), p: { ...parentP } });
  }
  return { bestP: parentP, bestFit: parentFit, evals, trajectory };
}

// ============================================================================================
// CELLS — a few representative (build, loadout-kind) combinations. The optimizer tunes the AI band
// + dodge FOR EACH cell independently (different archetypes want different engagement ranges).
// The ENEMY pin is the evaluator's documented operating point so solo-live/multi are discriminating.
// ============================================================================================
const ENEMY = { species: 'doudou', hp: 900, dmg: 60 };
const CELLS = [
  {
    key: 'fighter/melee',
    config: { cat: { build: 'fighter', stats: { pow: 90, agi: 80, vit: 130, cha: 60 },
      loadout: { q: { kind: 'melee', power: 1.4, cd: 1.1 }, e: { kind: 'projectile', power: 1.1, cd: 1.0 } } },
      enemy: ENEMY },
  },
  {
    key: 'assassin/melee',
    config: { cat: { build: 'assassin', stats: { pow: 105, agi: 110, vit: 95, cha: 55 },
      loadout: { q: { kind: 'melee', power: 1.6, cd: 0.9 }, e: { kind: 'dash', power: 0.8, cd: 2.0 } } },
      enemy: ENEMY },
  },
  {
    key: 'dps/projectile',
    config: { cat: { build: 'dps', stats: { pow: 100, agi: 85, vit: 100, cha: 60 },
      loadout: { q: { kind: 'projectile', power: 1.3, cd: 0.8 }, e: { kind: 'projectile', power: 1.2, cd: 1.4 } } },
      enemy: ENEMY },
  },
];
// a neutral, mid default engagement band every cell starts from (also our explicit "current default band"
// reference point). The engine's own kitRangeBand is reported too, as the real shipping default.
const DEFAULT_BAND = { min: 90, max: 220, dodge: 0.25 };
function normOf(p) {                            // raw params → normalized [0,1]^d (inverse of decode, pre-repair)
  return SPACE.map(s => clamp01((p[s.name] - s.lo) / (s.hi - s.lo)));
}

// ============================================================================================
// MAIN
// ============================================================================================
function parseArgs() {
  const a = {};
  for (const arg of process.argv.slice(2)) {
    const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg);
    if (m) a[m[1]] = m[2] ?? true;
  }
  return a;
}

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }
function padL(s, n) { s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; }

function main() {
  const args = parseArgs();
  const SEARCH_SEED = Number(args.seed ?? 20260101);
  const ITERS = Number(args.iters ?? 18);              // (1+1)-ES evals/cell ≈ ITERS+1
  const FRAMES = Number(args.frames ?? 800);
  const TRAIN_SEEDS = (args.train ? String(args.train).split(',').map(Number) : [7, 42, 101]);
  const HELDOUT_SEEDS = (args.held ? String(args.held).split(',').map(Number) : [13, 202, 999]);
  const runOpts = { frames: FRAMES, dt: 0.016 };
  const rewardModel = undefined;                        // baseline weighted-sum (honest default)

  // sanity: train & held-out must be disjoint, or the generalization check is a lie.
  const overlap = TRAIN_SEEDS.filter(s => HELDOUT_SEEDS.includes(s));
  if (overlap.length) { console.error('FATAL: train/held-out seeds overlap:', overlap); process.exit(1); }

  const t0 = Date.now();
  console.log('Cat Bond RSI OPTIMIZER — verifier-gated (1+1)-ES over a bounded AI-param vector');
  console.log(`  param vector : ${SPACE.map(s => `${s.name}∈[${s.lo},${s.hi}]`).join('  ')}   (max repaired to ≥ min+${MIN_BAND_WIDTH})`);
  console.log(`  reward model : baseline weighted-sum  ${JSON.stringify(DEFAULT_WEIGHTS)}`);
  console.log(`  search seed  : ${SEARCH_SEED}   iters/cell : ${ITERS}   frames : ${FRAMES}`);
  console.log(`  TRAIN seeds  : [${TRAIN_SEEDS}]      HELD-OUT seeds : [${HELDOUT_SEEDS}]  (disjoint)`);
  console.log('');

  // one master PRNG; each cell gets a deterministic sub-seed so cells are independent + reproducible.
  const master = mulberry32(SEARCH_SEED >>> 0);
  const out = { generatedAt: new Date(0).toISOString(), note: 'PROPOSED AI params — NOT auto-applied to battle.js. A human/integrator reads this.',
    searchSeed: SEARCH_SEED, iters: ITERS, frames: FRAMES, trainSeeds: TRAIN_SEEDS, heldoutSeeds: HELDOUT_SEEDS,
    rewardModel: 'baseline-weighted-sum', defaultWeights: DEFAULT_WEIGHTS, paramSpace: SPACE, cells: {} };

  const rows = [];
  for (const cell of CELLS) {
    const cellSeed = Math.floor(master() * 0xffffffff) >>> 0;
    const rng = makeRng(cellSeed);
    cell.startNorm = normOf(DEFAULT_BAND);

    // ---- BASELINES (the "before"): engine-native kitRangeBand (no override) AND the nominal default band
    const engineDefault = {
      train: scoreConfig(evaluate({ ...cell.config }, { ...runOpts, seeds: TRAIN_SEEDS }), rewardModel),
      held:  scoreConfig(evaluate({ ...cell.config }, { ...runOpts, seeds: HELDOUT_SEEDS }), rewardModel),
    };
    const defP = repair({ ...DEFAULT_BAND });
    const defTrainR = fitness(cell.config, defP, TRAIN_SEEDS, rewardModel, runOpts);
    const defHeldR = fitness(cell.config, defP, HELDOUT_SEEDS, rewardModel, runOpts);

    // ---- SEARCH (the gate): tune the band+dodge on TRAIN seeds only
    const res = optimizeCell(cell, { iters: ITERS, seeds: TRAIN_SEEDS, rewardModel, runOpts, rng });

    // ---- GENERALIZATION (the honesty check): re-score the winner on HELD-OUT seeds it never saw
    const winTrainR = fitness(cell.config, res.bestP, TRAIN_SEEDS, rewardModel, runOpts);
    const winHeldR = fitness(cell.config, res.bestP, HELDOUT_SEEDS, rewardModel, runOpts);

    const trainGain = winTrainR.score - defTrainR.score;
    const heldGain = winHeldR.score - defHeldR.score;
    // a win is only REAL if it also improves on held-out seeds; keep most of the training gain = healthy.
    const generalizes = heldGain > 1e-3 && heldGain >= 0.4 * Math.max(trainGain, 1e-9);
    const verdict = heldGain <= 1e-3 ? 'OVERFIT (held-out gain ~0 or negative — NOT a real win)'
      : generalizes ? 'GENERALIZES' : 'WEAK (held-out gain << training gain — treat with caution)';

    const dH = headline(defHeldR.result), wH = headline(winHeldR.result);
    rows.push({ cell, defP, bestP: res.bestP, engineDefault,
      defTrain: defTrainR.score, defHeld: defHeldR.score,
      winTrain: winTrainR.score, winHeld: winHeldR.score,
      trainGain, heldGain, verdict, generalizes, dH, wH, evals: res.evals });

    out.cells[cell.key] = {
      config: cell.config,
      proposedParams: res.bestP,                        // { min, max, dodge } — what an integrator applies
      defaultBand: defP,
      scores: {
        engineNativeDefault: engineDefault,
        defaultBand: { train: round(defTrainR.score), held: round(defHeldR.score) },
        optimizedBand: { train: round(winTrainR.score), held: round(winHeldR.score) },
      },
      trainGain: round(trainGain), heldoutGain: round(heldGain), generalizes, verdict,
      searchEvals: res.evals,
    };
  }

  // ---- TABLE ----
  console.log('REPRESENTATIVE CELLS — default band vs optimizer-found band (fitness = baseline score; higher better)');
  console.log('  ' + pad('cell', 16) + pad('band default→found', 30)
    + pad('dodge', 12) + padL('TRAIN def→opt', 18) + padL('HELD def→opt', 18) + '  verdict');
  for (const r of rows) {
    const bandStr = `[${r.defP.min},${r.defP.max}]→[${r.bestP.min},${r.bestP.max}]`;
    const dodgeStr = `${r.defP.dodge}→${r.bestP.dodge}`;
    const trainStr = `${r.defTrain.toFixed(3)}→${r.winTrain.toFixed(3)}`;
    const heldStr = `${r.defHeld.toFixed(3)}→${r.winHeld.toFixed(3)}`;
    console.log('  ' + pad(r.cell.key, 16) + pad(bandStr, 30) + pad(dodgeStr, 12)
      + padL(trainStr, 18) + padL(heldStr, 18) + '  ' + r.verdict);
  }
  console.log('');
  console.log('BEFORE/AFTER headline raw dims on HELD-OUT seeds (dmg dealt, hp kept, win rate):');
  for (const r of rows) {
    console.log('  ' + pad(r.cell.key, 16)
      + `default: dmg ${padL(r.dH.dmg, 6)}  hp ${(r.dH.hp * 100).toFixed(0)}%  win ${r.dH.win.toFixed(2)}`
      + `   →  optimized: dmg ${padL(r.wH.dmg, 6)}  hp ${(r.wH.hp * 100).toFixed(0)}%  win ${r.wH.win.toFixed(2)}`);
  }
  console.log('');
  console.log('ENGINE-NATIVE default (no band override — the true shipping default) for reference:');
  for (const r of rows) {
    console.log('  ' + pad(r.cell.key, 16)
      + `train ${r.engineDefault.train.toFixed(3)}   held ${r.engineDefault.held.toFixed(3)}`
      + `   (optimized held ${r.winHeld.toFixed(3)})`);
  }
  console.log('');

  const anyReal = rows.some(r => r.generalizes);
  const anyOverfit = rows.some(r => !r.generalizes);
  out.summary = {
    cellsImprovedHeldOut: rows.filter(r => r.heldGain > 1e-3).length,
    cellsGeneralized: rows.filter(r => r.generalizes).length,
    cellsTotal: rows.length,
    honest: anyReal
      ? 'At least one cell shows a band that improves on HELD-OUT seeds it never saw → a real, generalizing win.'
      : 'No cell generalized to held-out seeds → the engine-native/default band is hard to beat with a constant band here; reported as such (no fake win).',
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`HONESTY: ${rows.filter(r => r.generalizes).length}/${rows.length} cell(s) GENERALIZED to held-out seeds; ${rows.filter(r => r.heldGain > 1e-3).length}/${rows.length} improved held-out at all.`);
  if (anyOverfit) console.log('  Cells that did NOT generalize are reported as NOT real wins (a training-only gain is a seed notch, not an improvement).');
  console.log(`  Proposed params WRITTEN to ${path.relative(process.cwd(), OUT_PATH)} (NOT applied to battle.js — a human/integrator decides).`);
  console.log(`  Done in ${((Date.now() - t0) / 1000).toFixed(1)}s. node scripts/rsi/optimize.mjs exits 0.`);
}

function round(x) { return Math.round(x * 1e5) / 1e5; }

main();
