// ai-fire-gate-probe.mjs — RSI probe for AI fire-gate violations (owner bug 2026-11-26).
//
// WHY THIS PROBE EXISTS
// ---------------------
// Owner observation: ally 星星 (dark control) was seen casting shadowTendrils (kind=beam,
// reach=240) from dist=279 — clearly outside the beam's reach — and casting hex (kind=projectile)
// from dist=168 in weird directions. Those are smartAutoAction decisions, not player input.
// The engine has ONE source of truth for "can this skill connect from here": skillEngageReach(sk,
// basicRange). If castOffensiveSkill actually fires at dist > skillEngageReach, the AI's fire-gate
// disagrees with its own range model and we are leaking wasted casts.
//
// WHAT IT DOES (no engine edit)
// -----------------------------
//   1. Runs the deterministic sim across 3 seeds × 3 scenarios (reuses evaluator.mjs via evaluate()
//      with its knobOverride seam, so boot / vm scaffold / seeded RNG / Math.random pinning are all
//      reused — same discipline as balance-probe.mjs).
//   2. Via knobOverride (the per-frame hook evaluator exposes for exactly this kind of probe),
//      monkey-patches b.castOffensiveSkill ONCE per battle: every cast is logged with sim time,
//      caster id/role/element, skill id/kind/sk.reach, distance to the nearest live enemy at cast
//      time, the engine's own skillEngageReach(sk, basicRange), and the violation flag
//      dist > skillEngageReach. We only wrap, then delegate — battle.js is NOT modified.
//   3. Prints a per-scenario + overall table of violation rate grouped by skill kind.
//   4. Prints the 10 worst-violation casts (biggest dist - engageReach gap) with full context.
//   5. If overall violation rate > 10% of casts, prints an AI-BUG flag so RSI / supervisors notice.
//
// SCOPE: ally casts only (b.team.includes(caster)). Wild/enemy routing through castOffensiveSkill
// is scored on a different gate and would muddy the ally-AI signal.
//
// NO ENGINE EDIT: this file does NOT touch battle.js. It monkey-patches the Battle instance in
// memory via the knobOverride seam that evaluator.mjs already ships for diagnostic probes.

import { evaluate } from './evaluator.mjs';

// ---- probe shared state ----
// evaluate() runs internally; we feed it one (seed, scenario) at a time and swap in a fresh probe
// bucket for each run. The knobOverride installs the castOffensiveSkill wrapper exactly once per
// battle (idempotent via b._fireGateProbeHooked flag) and appends every cast to the active bucket.
let activeProbe = null;

function installProbe(b) {
  if (b._fireGateProbeHooked) return;
  b._fireGateProbeHooked = true;
  const orig = b.castOffensiveSkill.bind(b);
  b.castOffensiveSkill = function (f, aim, sk, pow, col, _nowind) {
    try {
      if (activeProbe && sk) {
        const isAlly = b.team && b.team.includes(f);
        if (isAlly) {
          // nearest live enemy at cast time (matches smartAutoAction's decision context)
          const enemies = (b.liveEnemies && b.liveEnemies()) || [];
          let nd = Infinity, nearest = null;
          for (const e of enemies) {
            const d = Math.hypot(e.x - f.x, e.y - f.y);
            if (d < nd) { nd = d; nearest = e; }
          }
          const basicRange = (typeof b.basicAttackRange === 'function') ? b.basicAttackRange(f) : 160;
          const engageReach = (typeof b.skillEngageReach === 'function') ? b.skillEngageReach(sk, basicRange) : (sk.reach || 0);
          // offensive skills only — heal/buff don't have a fire-gate in the same sense
          const kind = sk.kind || 'projectile';
          if (kind !== 'heal' && kind !== 'buff') {
            activeProbe.casts.push({
              t: +b.t.toFixed(3),
              seed: activeProbe.seed,
              scenario: activeProbe.scenario,
              casterSpecies: f.cat?.species || '?',
              casterName: (typeof window !== 'undefined' && window.State?.catName) ? window.State.catName(f.cat) : (f.cat?.name || f.cat?.species || '?'),
              role: f.cat?.buildType || '?',
              element: f.element || sk.element || '?',
              skillId: sk.id || sk.name || '?',
              kind,
              skReach: sk.reach ?? null,
              basicRange: +basicRange.toFixed(1),
              engageReach: +engageReach.toFixed(1),
              dist: isFinite(nd) ? +nd.toFixed(1) : null,
              gap: isFinite(nd) ? +(nd - engageReach).toFixed(1) : null,
              violation: isFinite(nd) && nd > engageReach,
              targetSpecies: nearest?.sp?.id || nearest?.cat?.species || null,
            });
          }
        }
      }
    } catch (e) { /* probe must never break the sim */ }
    return orig(f, aim, sk, pow, col, _nowind);
  };
}

const SEEDS = [7, 42, 101];
const SCENARIOS = ['solo-pinned', 'solo-live', 'multi'];

// Default evaluator config is a fire-element fighter. To actually exercise the owner's reported
// bug (dark control 星星 casting shadowTendrils/hex), use xingchen as the player cat and keep its
// native kit so we see its real skills, not the synthetic fire loadout evaluator.mjs defaults to.
const PROBE_CONFIG = {
  cat: {
    species: 'xingchen', build: 'control', level: 16, affinity: 60,
    stats: { pow: 70, agi: 80, vit: 110, cha: 60 },
    useNativeKit: true,                           // keep species-native q/e so shadowTendrils/hex etc. appear
  },
  enemy: { species: 'doudou', hp: 900, dmg: 60 },
  ai: {},
};

function runProbe() {
  const allCasts = [];
  const perScenario = {};

  for (const scn of SCENARIOS) {
    const casts = [];
    for (const seed of SEEDS) {
      activeProbe = { casts: [], seed, scenario: scn };
      evaluate(PROBE_CONFIG, {
        seeds: [seed],
        scenarios: [scn],
        frames: 1800,              // same budget as evaluator's self-test
        knobOverride: installProbe // hook fires every frame, installs once per battle
      });
      casts.push(...activeProbe.casts);
      activeProbe = null;
    }
    perScenario[scn] = casts;
    allCasts.push(...casts);
  }

  return { perScenario, allCasts };
}

// ---- reporting ----
function kindTable(casts, label) {
  const byKind = {};
  for (const c of casts) {
    const k = c.kind || '?';
    if (!byKind[k]) byKind[k] = { total: 0, violated: 0, maxGap: 0 };
    byKind[k].total++;
    if (c.violation) byKind[k].violated++;
    if (c.gap > byKind[k].maxGap) byKind[k].maxGap = c.gap;
  }
  console.log('\n=== ' + label + ' — casts by kind ===');
  console.log('  kind        total   violated   viol%    worstGap');
  const order = Object.keys(byKind).sort();
  let totalAll = 0, violAll = 0;
  for (const k of order) {
    const row = byKind[k];
    totalAll += row.total; violAll += row.violated;
    const pct = row.total > 0 ? (100 * row.violated / row.total) : 0;
    console.log('  ' + k.padEnd(11) + String(row.total).padStart(5)
      + '   ' + String(row.violated).padStart(8)
      + '   ' + pct.toFixed(1).padStart(5) + '%'
      + '   ' + row.maxGap.toFixed(1).padStart(6));
  }
  const pctAll = totalAll > 0 ? (100 * violAll / totalAll) : 0;
  console.log('  ' + 'ALL'.padEnd(11) + String(totalAll).padStart(5)
    + '   ' + String(violAll).padStart(8)
    + '   ' + pctAll.toFixed(1).padStart(5) + '%');
  return { total: totalAll, violated: violAll, pct: pctAll };
}

function worstCastsTable(casts, n = 10) {
  const sorted = casts.filter(c => c.violation).sort((a, b) => b.gap - a.gap).slice(0, n);
  console.log('\n=== Top ' + n + ' worst-violation casts (dist - engageReach) ===');
  if (sorted.length === 0) { console.log('  (none)'); return; }
  console.log('  t      scn           caster          role     elem   skill              kind       dist   reach   gap');
  for (const c of sorted) {
    console.log('  '
      + String(c.t).padStart(6) + ' '
      + c.scenario.padEnd(13) + ' '
      + (c.casterName || c.casterSpecies).padEnd(15) + ' '
      + c.role.padEnd(8) + ' '
      + c.element.padEnd(6) + ' '
      + c.skillId.padEnd(18) + ' '
      + c.kind.padEnd(10) + ' '
      + String(c.dist).padStart(6) + ' '
      + String(c.engageReach).padStart(7) + ' '
      + '+' + String(c.gap).padStart(5));
  }
}

function main() {
  console.log('AI fire-gate probe — detecting casts fired outside skillEngageReach (owner bug 2026-11-26)');
  console.log('config: ' + PROBE_CONFIG.cat.species + ' / ' + PROBE_CONFIG.cat.build
    + ' / native kit  •  seeds=[' + SEEDS.join(',') + ']  •  scenarios=[' + SCENARIOS.join(',') + ']');

  const { perScenario, allCasts } = runProbe();

  for (const scn of SCENARIOS) kindTable(perScenario[scn], scn);
  const overall = kindTable(allCasts, 'OVERALL');
  worstCastsTable(allCasts, 10);

  // Owner threshold: >10% of ally casts violating the fire-gate is an AI bug worth chasing in battle.js.
  console.log('');
  if (overall.pct > 10) {
    console.log('AI-BUG FLAG: ' + overall.violated + '/' + overall.total + ' ally casts (' + overall.pct.toFixed(1)
      + '%) fired outside the engine\'s own skillEngageReach gate. Investigate smartAutoAction / offensive() fire-gates in public/cat-bond/js/battle.js.');
  } else {
    console.log('OK: ally fire-gate violations = ' + overall.pct.toFixed(1) + '% (threshold 10%).');
  }

  // Parseable line for rsi-loop.
  const byKindAll = {};
  for (const c of allCasts) {
    const k = c.kind || '?';
    byKindAll[k] = byKindAll[k] || { total: 0, violated: 0 };
    byKindAll[k].total++; if (c.violation) byKindAll[k].violated++;
  }
  console.log('\n[ai-fire-gate-probe-json] ' + JSON.stringify({
    kind: 'ai-fire-gate-probe',
    totalCasts: overall.total,
    violated: overall.violated,
    violationPct: +overall.pct.toFixed(2),
    flag: overall.pct > 10,
    byKind: Object.fromEntries(Object.entries(byKindAll).map(([k, v]) => [k, { total: v.total, violated: v.violated, pct: +(100 * v.violated / v.total).toFixed(2) }])),
    worst: allCasts.filter(c => c.violation).sort((a, b) => b.gap - a.gap).slice(0, 5).map(c => ({
      scenario: c.scenario, caster: c.casterSpecies, skill: c.skillId, kind: c.kind, dist: c.dist, engageReach: c.engageReach, gap: c.gap,
    })),
  }));
}

try { main(); } catch (e) { console.error('[ai-fire-gate-probe] FAILED:', e.stack || e.message); process.exit(1); }
