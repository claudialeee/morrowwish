// balance-probe.mjs — per-element balance verifier (owner: RSI 没发现系间平衡问题,做).
//
// ======================================================================
// PENDING: P1 species-passives are coming (12 cats, see
// docs/combat-redesign/BALANCE-BRIEF-passive-p1.md). Current probe
// measures kit DPS only; it does NOT include per-cat passive contribution
// because traits.js doesn't exist yet. Once the infra+12-cat PRs ship:
//   - element balance targets shift: each element's P1 cats collectively
//     must stay within 1.3× any other element AFTER passives
//   - add a passive-contribution column to the per-element table once
//     TRAIT_BY_SPECIES[speciesId] is populated
//   - representative species below map fine → each ELEM_REP's P1 cat (if
//     any) carries its passive contribution; non-P1 elements (暗 moqiu
//     is P1, lixiao is NOT) need to switch representative or acknowledge
//     the gap in the brief's "Balance targets" §
// ======================================================================
//
// What RSI's main loop MEASURES: how a FIXED tangyuan/fighter config performs vs doudou
// across solo-pinned / solo-live / multi. That's ONE cell of a 6x6 element matrix — it
// cannot see "water underperforms fire" because it never runs water.
//
// What this probe does: runs the SAME scenarios but across the FULL element matrix
// (6 attacker elements × 2 defender roles: strong-target + resisted-target), with
// stats pinned identical across all attackers so the ONLY variable is element identity
// (power, kindMult, EFFECT table, skill kit).
//
// Emits three things:
//   1. per-element avg score  → "which element lags"
//   2. fairness variance stddev → "how uneven overall"
//   3. per-pairing output (attacker-element → defender-element, mean dmg dealt over 10s)
//
// ADDITIVE: does NOT touch the main judge; it's a separate diagnostic. rsi-loop.mjs
// appends its headline to rsi-history.log so the cron picks it up.

import { evaluate } from './evaluator.mjs';

// Element → representative species. Chose R-tier wherever possible for natural kit
// access; stats are OVERRIDDEN uniformly below so species base doesn't bias the probe.
const ELEM_REP = {
  fire:  'tangyuan',
  water: 'dundun',
  grass: 'zherdd',
  elec:  'niuniu',
  dark:  'lixiao',
  light: 'yunduo',
};

// Static effectiveness table (mirror of skills.js EFFECT — used to pick enemy pairings;
// the actual multipliers at runtime still come from skills.js).
const EFFECT = {
  fire:  { grass: 2,   water: 0.5, fire: 0.5, elec: 1,   dark: 1,   light: 1 },
  water: { fire: 2,    grass: 0.5, water: 0.5, elec: 0.5, dark: 1,   light: 1 },
  grass: { water: 2,   elec: 1.5,  fire: 0.5, grass: 0.5, dark: 1,   light: 1 },
  elec:  { water: 2,   light: 1.5, grass: 0.5, elec: 0.5, dark: 1,   fire: 1 },
  dark:  { light: 2,   grass: 1.5, dark: 0.5, fire: 1,   water: 1,   elec: 1 },
  light: { dark: 2,    fire: 1.5,  light: 0.5, grass: 1,  water: 1,   elec: 1 },
};

// Pair each attacker with: a STRONG-target (max mult it has), a RESISTED-target (min mult).
// If multiple candidates tie, pick the first in a stable element order.
const ORDER = ['fire', 'water', 'grass', 'elec', 'dark', 'light'];
function pickTargets(atk) {
  const row = EFFECT[atk];
  let best = null, bestM = -1, worst = null, worstM = 99;
  for (const def of ORDER) {
    if (def === atk) continue;             // skip self (element-vs-self is a resist, not a story)
    const m = row[def] ?? 1;
    if (m > bestM) { bestM = m; best = def; }
    if (m < worstM) { worstM = m; worst = def; }
  }
  return { strong: best, strongMult: bestM, weak: worst, weakMult: worstM };
}

// Representative enemy species per element (shared with attacker rep — enemy element is
// what drives the EFFECT lookup; the enemy species carries that element).
function enemySpeciesForElement(el) { return ELEM_REP[el]; }

// Run one pairing: attacker element vs defender element. Three seeds for stability.
function runPair(atkEl, defEl) {
  const atkSpecies = ELEM_REP[atkEl];
  const defSpecies = enemySpeciesForElement(defEl);
  const cfg = {
    cat: {
      species: atkSpecies,
      build: 'fighter',
      level: 16,
      affinity: 60,
      stats: { pow: 70, agi: 80, vit: 110, cha: 60 },   // IDENTICAL across all elements
      useNativeKit: true,                                 // keep species-native q/e (see evaluator)
    },
    enemy: { species: defSpecies },
    ai: {},
  };
  const seeds = [7, 131, 919];
  // Only use solo-pinned (clean output signal) + solo-live (survival signal under default AI).
  // Skip multi — a 3-enemy scenario adds noise orthogonal to element balance.
  const SCENARIOS = ['solo-pinned', 'solo-live'];
  const result = evaluate(cfg, { seeds, scenarios: SCENARIOS });
  const pinned = result.perScenario['solo-pinned'] || {};
  const live = result.perScenario['solo-live'] || {};
  return {
    dmgPinned: pinned.dmgDealt || 0,
    dmgLive: live.dmgDealt || 0,
    hpKept: live.hpFracLeft || 0,
    won: live.won || 0,
    // Aggregate score: weighted by dmg (output vs pinned) + survival/win (vs live).
    score: (pinned.norm?.output || 0) * 0.5
         + (live.norm?.survival || 0) * 0.3
         + (live.norm?.win || 0) * 0.2,
  };
}

function main() {
  const matrix = {};                // attacker → { strong: {...}, weak: {...} }
  const perElem = {};                // attacker → mean score across both pairings
  for (const atk of ORDER) {
    const picks = pickTargets(atk);
    const vsStrong = runPair(atk, picks.strong);
    const vsWeak   = runPair(atk, picks.weak);
    matrix[atk] = { strong: { def: picks.strong, mult: picks.strongMult, ...vsStrong },
                    weak:   { def: picks.weak,   mult: picks.weakMult,   ...vsWeak } };
    perElem[atk] = (vsStrong.score + vsWeak.score) / 2;
  }

  // Fairness: stddev of per-element scores.
  const vals = ORDER.map(e => perElem[e]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const stddev = Math.sqrt(variance);
  // Normalize stddev relative to mean (coefficient of variation) — makes the number
  // comparable across cycles even if absolute scores drift.
  const cv = mean > 0 ? stddev / mean : 0;

  // Rank elements from worst to best.
  const ranked = ORDER.slice().sort((a, b) => perElem[a] - perElem[b]);
  const worst = ranked[0];
  const best  = ranked[ranked.length - 1];
  const gap = (perElem[best] - perElem[worst]).toFixed(3);

  // JSON-structured output (so rsi-loop.mjs can parse one line); also pretty print.
  const summary = {
    kind: 'balance-probe',
    perElement: Object.fromEntries(ORDER.map(e => [e, +perElem[e].toFixed(3)])),
    mean: +mean.toFixed(3),
    stddev: +stddev.toFixed(3),
    cv: +cv.toFixed(3),
    worst: { element: worst, score: +perElem[worst].toFixed(3) },
    best:  { element: best,  score: +perElem[best].toFixed(3) },
    gap: +gap,
    matrix: Object.fromEntries(ORDER.map(e => [e, {
      strongVs: matrix[e].strong.def,
      strongDmgPinned: Math.round(matrix[e].strong.dmgPinned),
      strongHpKept: +(matrix[e].strong.hpKept).toFixed(2),
      weakVs: matrix[e].weak.def,
      weakDmgPinned: Math.round(matrix[e].weak.dmgPinned),
      weakHpKept: +(matrix[e].weak.hpKept).toFixed(2),
    }])),
  };

  console.log('\n=== BALANCE PROBE — per-element avg score ===');
  for (const e of ranked) {
    const mark = e === worst ? ' ← worst' : e === best ? ' ← best' : '';
    console.log('  ' + e.padEnd(6) + perElem[e].toFixed(3) + mark);
  }
  console.log(`\nmean=${mean.toFixed(3)}  stddev=${stddev.toFixed(3)}  cv=${cv.toFixed(3)}  gap=${gap}`);
  console.log(`worst: ${worst} (${perElem[worst].toFixed(3)})  vs  best: ${best} (${perElem[best].toFixed(3)})`);
  console.log('\n=== matrix (dmgDealt to 100k-HP pinned target over 10s) ===');
  console.log('elem  | strong-target  dmg  hpKept | weak-target    dmg  hpKept');
  for (const e of ORDER) {
    const m = matrix[e];
    console.log('  ' + e.padEnd(5) +
      ' | vs ' + m.strong.def.padEnd(7) + String(Math.round(m.strong.dmgPinned)).padStart(5) + ' ' + m.strong.hpKept.toFixed(2) +
      '   | vs ' + m.weak.def.padEnd(7) + String(Math.round(m.weak.dmgPinned)).padStart(5) + ' ' + m.weak.hpKept.toFixed(2));
  }
  // Emit a parseable line for rsi-loop.
  console.log('\n[balance-probe-json] ' + JSON.stringify(summary));
}

try { main(); } catch (e) { console.error('[balance-probe] FAILED:', e.message); process.exit(1); }
