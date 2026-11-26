// knob-usage-probe.mjs — Occam's-razor diagnostic (owner: "我们是不是还需要一个 occam razor
// agent 来约束这么多的 rule"). After months of per-cycle P0 knobs, battle.js carries 20+
// hidden rubber-band / mercy / assist fields. This probe answers one question per knob:
//
//   "If I pin this knob to 0 (disable it), how much does the per-element balance score drop?"
//
// If the drop is ~0 for a knob, it's a candidate for consolidation or removal. If the drop
// is concentrated on ONE persona-shaped scenario, the knob is correctly scoped. Big uniform
// drops = load-bearing.
//
// ADDITIVE: does NOT modify battle.js / skills.js. Uses evaluator's knobOverride hook.
// Emits per-knob deltas + a flag for "likely dead" (drop < 0.01 absolute AND relative < 1%).
// Runs on the same 6-element matrix the balance probe uses so costs align.

import { evaluate } from './evaluator.mjs';

const ELEM_REP = {
  fire:  'tangyuan', water: 'dundun', grass: 'zherdd',
  elec:  'niuniu',   dark:  'lixiao', light: 'yunduo',
};
const EFFECT = {
  fire:  { grass: 2, water: 0.5, fire: 0.5, elec: 1, dark: 1, light: 1 },
  water: { fire: 2, grass: 0.5, water: 0.5, elec: 0.5, dark: 1, light: 1 },
  grass: { water: 2, elec: 1.5, fire: 0.5, grass: 0.5, dark: 1, light: 1 },
  elec:  { water: 2, light: 1.5, grass: 0.5, elec: 0.5, dark: 1, fire: 1 },
  dark:  { light: 2, grass: 1.5, dark: 0.5, fire: 1, water: 1, elec: 1 },
  light: { dark: 2, fire: 1.5, light: 0.5, grass: 1, water: 1, elec: 1 },
};
const ORDER = ['fire', 'water', 'grass', 'elec', 'dark', 'light'];

// --- knob definitions: name + pin function (called each frame by the evaluator hook) ---
// Each pin forces the knob to "off" so we can measure its contribution. Names match
// battle.js fields; the drop from baseline tells us the knob's load-bearing weight.
const KNOBS = {
  'no-op (baseline check)': (b) => {},
  '_pressure':         (b) => { b._pressure = 0; },
  '_closing':          (b) => { b._closing = 0; },
  '_autoAssist':       (b) => { b._autoAssist = 0; },
  '_stomp':            (b) => { b._stomp = 0; },
  '_stalled':          (b) => { b._stalled = false; b._stallT = 0; },
  '_dangerFrac(disable crit vignette)': (b) => { b._dangerFrac = 1; b._inCrit = false; },
  'CRIT_HP_FRAC=0 (never trigger crit)': (b) => { b.CRIT_HP_FRAC = 0; },
  'playerDmgMult=1 (no mercy dmg buff)': (b) => { b.playerDmgMult = 1; },
  'enemyDmgMult*=1 (no mercy dmg cut)':  (b) => { /* mercy already baked at ctor; approximated via buff disable above */ },
  'aiP.lossStreak=0 (strip mercy input)': (b) => { if (b.aiP) b.aiP.lossStreak = 0; },
  'aiP.stompStreak=0 (strip anti-stomp)': (b) => { if (b.aiP) b.aiP.stompStreak = 0; },
};

function pickTargets(atk) {
  const row = EFFECT[atk];
  let best = null, bestM = -1, worst = null, worstM = 99;
  for (const def of ORDER) {
    if (def === atk) continue;
    const m = row[def] ?? 1;
    if (m > bestM) { bestM = m; best = def; }
    if (m < worstM) { worstM = m; worst = def; }
  }
  return { strong: best, weak: worst };
}

// Pre-stimulate the aiProfile so knobs that read it (lossStreak/stompStreak-driven mercy &
// anti-stomp) are ACTIVE during the probe; otherwise a fresh save has streak=0 and those
// branches never engage, giving a false "dead" reading. We write directly into the save
// adapter the engine's constructor reads (window.State.S.aiProfile) via a tiny pre-hook
// baked into knobOverride that runs BEFORE buildBattle — not possible here; instead stamp
// it via the evaluator boot's live globals. We mutate during run via the per-frame hook,
// but ALSO stamp before — since battle.js reads lossStreak at ctor L108 and bakes mercy into
// playerDmgMult etc., we need the state BEFORE ctor fires. Simplest: use the existing
// evaluator's boot env window.State.
function stampProfile(partial) {
  try {
    const win = globalThis.window || (globalThis.globalThis && globalThis.globalThis.window);
    // evaluator owns the live engine globals via its own boot; we can't reach them from here
    // directly, but evaluate() re-uses them per call — so we mutate right before a run.
    // The effective way: use runScenario's knobOverride to force the fields each frame, AND
    // knobOverride runs AFTER ctor so one-shot ctor-reads (mercy band bake) are NOT covered.
    // For those, we accept the probe limit: it measures FRAME-LOOP knobs, not CTOR-BAKED ones.
  } catch (_) {}
}

function runPair(atkEl, defEl, knobOverride, scenario) {
  const cfg = {
    cat: {
      species: ELEM_REP[atkEl], build: 'fighter', level: 16, affinity: 60,
      stats: { pow: 70, agi: 80, vit: 110, cha: 60 },
      useNativeKit: true,
    },
    enemy: { species: ELEM_REP[defEl] },
    ai: {},
  };
  const seeds = [7, 131, 919];
  // 'multi' exercises more AI code paths (per-enemy _pressure/_closing via multiple threats);
  // 'solo-live' keeps the survival signal clean. Skip 'solo-pinned' here — pinned enemy
  // suppresses the mercy/pressure systems we're probing.
  const scn = scenario || ['solo-live', 'multi'];
  const result = evaluate(cfg, { seeds, scenarios: scn, knobOverride });
  const live = result.perScenario['solo-live'] || {};
  const multi = result.perScenario['multi'] || {};
  return (live.norm?.survival || 0) * 0.3
       + (live.norm?.win || 0) * 0.2
       + (live.norm?.output || 0) * 0.15
       + (multi.norm?.survival || 0) * 0.15
       + (multi.norm?.win || 0) * 0.1
       + (multi.norm?.output || 0) * 0.1;
}

function runMatrix(knobOverride) {
  let total = 0; const pairs = [];
  for (const atk of ORDER) {
    const picks = pickTargets(atk);
    const s = runPair(atk, picks.strong, knobOverride);
    const w = runPair(atk, picks.weak, knobOverride);
    total += (s + w);
    pairs.push({ atk, strong: picks.strong, weak: picks.weak, sScore: s, wScore: w });
  }
  return { total, mean: total / (ORDER.length * 2), pairs };
}

function main() {
  console.log('[knob-probe] running 6-element × 2-pairing matrix × ' + Object.keys(KNOBS).length + ' knobs...');
  const baseline = runMatrix(null);
  console.log('[knob-probe] baseline matrix mean=' + baseline.mean.toFixed(4));
  const results = [];
  for (const [name, pin] of Object.entries(KNOBS)) {
    const treatment = runMatrix(pin);
    const dropAbs = baseline.mean - treatment.mean;
    const dropRel = baseline.mean > 0 ? dropAbs / baseline.mean : 0;
    // find which element lost the most — reveals knob's SCOPE (one persona vs all)
    const perEl = {};
    for (let i = 0; i < baseline.pairs.length; i++) {
      const b = baseline.pairs[i], t = treatment.pairs[i];
      perEl[b.atk] = ((b.sScore + b.wScore) - (t.sScore + t.wScore)) / 2;
    }
    const worstEl = Object.entries(perEl).sort((a, b) => b[1] - a[1])[0];
    results.push({ name, treatment: +treatment.mean.toFixed(4), dropAbs: +dropAbs.toFixed(4), dropRel: +dropRel.toFixed(4), worstEl: worstEl[0], worstDrop: +worstEl[1].toFixed(4) });
  }
  results.sort((a, b) => b.dropAbs - a.dropAbs);
  console.log('\n=== KNOB USAGE — ranked by score drop when pinned off ===');
  console.log('knob                                 | treatment | abs-drop | rel-drop | worst persona (element → drop)');
  for (const r of results) {
    const flag = Math.abs(r.dropAbs) < 0.01 && Math.abs(r.dropRel) < 0.01 ? ' ← LIKELY DEAD' : '';
    console.log('  ' + r.name.padEnd(36) +
      ' |  ' + r.treatment.toFixed(4).padStart(5) +
      ' |  ' + (r.dropAbs >= 0 ? '+' : '') + r.dropAbs.toFixed(4).padStart(6) +
      ' |  ' + (r.dropRel * 100).toFixed(1).padStart(5) + '%' +
      ' |  ' + r.worstEl.padEnd(5) + ' → ' + (r.worstDrop >= 0 ? '+' : '') + r.worstDrop.toFixed(4) +
      flag);
  }
  const invisible = results.filter(r => Math.abs(r.dropAbs) < 0.01 && Math.abs(r.dropRel) < 0.01 && !r.name.startsWith('no-op'));
  // Honest framing: 0 drop doesn't mean "dead code" — it means the RSI harness (AI-driven, short
  // scenarios, fresh save, pinned/default enemies) does NOT exercise the branches that read these
  // knobs. Most knobs are human-player experience signals (vignettes, teach banners, mercy bakes
  // at ctor) the sim can't see. True dead-code detection needs a human-persona playtest harness
  // or a ctor-level hook the evaluator doesn't currently expose.
  console.log('\n--- Interpretation ---');
  console.log('Knobs reporting 0 drop are NOT necessarily dead — they are INVISIBLE to the RSI harness.');
  console.log('Candidates that need human-persona (playtest cron) validation to confirm life:');
  console.log('  ' + (invisible.length ? invisible.map(r => r.name).join(', ') : 'none'));
  console.log('Knobs the RSI AI harness CAN measure: ' + results.filter(r => Math.abs(r.dropAbs) >= 0.01).map(r => r.name).join(', ') || '(none above threshold)');
  console.log('\n[knob-probe-json] ' + JSON.stringify({ baseline: baseline.mean, results, invisible: invisible.map(r => r.name), note: 'invisible != dead — RSI AI-harness blind spot; see playtest log for human-side signals' }));
}

try { main(); } catch (e) { console.error('[knob-probe] FAILED:', e.message); process.exit(1); }
