// archive-reachability-probe.mjs — Occam's-razor diagnostic (owner: "Archive coverage: 2/64
// (unchanged). -> why not 64?").
//
// Fires N random bands through the real evaluator, records each one's (engage, tempo,
// durability) descriptor, and reports which of the 4x4x4=64 cells are physically reachable
// vs never-visited. The MAP-Elites archive can only grow into cells the SIM ACTUALLY LANDS IN
// — unreachable corners mean the 64-cell goal is a lie.
//
// Honest framing: a "cell" the evaluator never visits (regardless of candidate quality) is
// not a tuning target — it's unreachable geometry. This probe tells us the TRUE coverage ceiling.
//
// ADDITIVE: harness-only; no game code change.

import { evaluate, DEFAULT_WEIGHTS } from './evaluator.mjs';

const N_SAMPLES = 120;                        // random bands to try
const GRID = 4;                                // 4x4x4 descriptor bins to match propose.mjs
const SEED = 20261125;                         // deterministic sampling

// Simple LCG for deterministic band sampling
let rngState = SEED;
function rng() { rngState = (rngState * 1664525 + 1013904223) >>> 0; return rngState / 4294967296; }

// Generate a random but-sane positioning band: min in [16, 260], max in [min+30, min+120],
// rush in [min, max], HP branch optional (30% chance of a retreat clause).
function randomBand() {
  const min = Math.round(16 + rng() * 244);
  const max = min + Math.round(30 + rng() * 90);
  const rush = Math.round(min + rng() * Math.min(40, max - min));
  const role = ['assassin','bruiser','ranged','tank'][Math.floor(rng()*4)];
  const hasRetreat = rng() < 0.3;
  const retreatHp = 0.2 + rng() * 0.3;         // 0.2..0.5
  const retreatMin = Math.round(120 + rng() * 80);
  const retreatMax = retreatMin + Math.round(30 + rng() * 60);
  return (f) => {
    const hp = f.hp/(f.maxhp||1);
    if (hasRetreat && hp < retreatHp) return { min: retreatMin, max: retreatMax, rush: retreatMin, role: 'ranged', hp };
    return { min, max, rush, role, hp };
  };
}

// Compute the 3-axis descriptor the archive uses. Mirror of propose.mjs behavior.
function describe(result) {
  const live = result.perScenario['solo-live'] || {};
  const multi = result.perScenario['multi'] || {};
  const engage = 1 - (live.norm?.positioning || 0);        // 0=hug, 1=far (inverse of staying in band)
  const tempo = live.norm?.speed || multi.norm?.speed || 0; // 0=slow, 1=fast
  const durability = Math.max(0, Math.min(1, live.hpFracLeft || 0));  // 0=ends-low, 1=ends-full
  return { engage, tempo, durability };
}
function bin(x) { return Math.min(GRID-1, Math.max(0, Math.floor(x * GRID))); }

function main() {
  const seen = new Set();
  const samples = [];
  console.log('[archive-probe] firing ' + N_SAMPLES + ' random bands...');
  for (let i = 0; i < N_SAMPLES; i++) {
    const band = randomBand();
    const cfg = {
      cat: { species: 'tangyuan', build: 'fighter', level: 16, affinity: 60,
             stats: { pow: 70, agi: 80, vit: 110, cha: 60 },
             loadout: { q: { kind:'melee', power:1.2, cd:1.2 }, e: { kind:'projectile', power:1.0, cd:1.0 } } },
      enemy: { species: 'doudou' },
      ai: { band },
    };
    try {
      const r = evaluate(cfg, { seeds: [13, 202], scenarios: ['solo-live', 'multi'] });
      const d = describe(r);
      const key = `${bin(d.engage)},${bin(d.tempo)},${bin(d.durability)}`;
      seen.add(key);
      samples.push({ i, ...d, key });
    } catch (_) {}
    if ((i+1) % 30 === 0) process.stdout.write('  ' + (i+1) + '/' + N_SAMPLES + ' sampled, ' + seen.size + ' unique cells seen\n');
  }
  console.log('\n=== ARCHIVE REACHABILITY ===');
  console.log('Cells touched: ' + seen.size + ' / ' + (GRID*GRID*GRID));
  console.log('Theoretical max from random sampling: ' + seen.size + ' (upper bound on what proposers can ever claim)');
  // Per-axis histograms
  const engBins = Array(GRID).fill(0), tmpBins = Array(GRID).fill(0), durBins = Array(GRID).fill(0);
  for (const s of samples) {
    engBins[bin(s.engage)]++; tmpBins[bin(s.tempo)]++; durBins[bin(s.durability)]++;
  }
  const show = (name, bins) => console.log(`  ${name.padEnd(12)}: ` + bins.map((n,i)=>`bin${i}=${n}`).join(' '));
  console.log('\nPer-axis distribution (how many samples landed in each bin):');
  show('engage', engBins); show('tempo', tmpBins); show('durability', durBins);
  // Identify empty axes
  for (const [name, bins] of [['engage',engBins],['tempo',tmpBins],['durability',durBins]]) {
    const empties = bins.map((n,i)=>n===0?i:-1).filter(i=>i>=0);
    if (empties.length) console.log(`  → ${name} unreachable bins: ${empties.join(',')}`);
  }
  // Full cell list (compact)
  console.log('\nReachable cells (' + seen.size + '): ' + Array.from(seen).sort().join(' '));
  console.log('\n[archive-probe-json] ' + JSON.stringify({ samples: N_SAMPLES, reached: seen.size, max: GRID*GRID*GRID, engBins, tmpBins, durBins, cells: Array.from(seen).sort() }));
}

try { main(); } catch (e) { console.error('[archive-probe] FAILED:', e.message); process.exit(1); }
