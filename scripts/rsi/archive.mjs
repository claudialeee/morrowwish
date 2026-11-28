// archive.mjs — MAP-Elites / quality-diversity archive for the RSI loop.
//
// WHY (owner: "keep a diverse set of winning rules, not one point"; RSI-SOTA plan P1): a plain
// optimizer collapses to ONE best param vector. Quality-diversity (MAP-Elites, Mouret & Clune 2015)
// instead keeps the best candidate found in each cell of a low-D BEHAVIOR space, so we retain a map
// of *qualitatively different* good rules (e.g. "hugs + wins fast" vs "kites + survives"). That map
// is also the few-shot seed for a future LLM proposer (plan P2) and a hedge against the judge's blind
// spots. Zero extra simulation cost: descriptors are read from metrics evaluate() ALREADY emits.
//
// Behavior descriptors (each binned to a small grid from existing per-scenario `.raw`/`.norm`):
//   • engage     — how close it fights      (posPct: higher = stays engaged/close)
//   • tempo      — how fast it acts/kills   (actsPct or 1/timeToKill proxy)
//   • durability — how much HP it keeps     (hpFracLeft)
//   • efficiency — how much it WHIFFS       (1 - negatedPct/100; low whiff = right side)
// Elite per cell = highest judge score. Pure data; no deps; JSON-serializable.
//
// UPGRADE (owner: "都升级"): added 4th descriptor `efficiency` so niches separate
// "high-output-but-whiffy" from "tight-and-clean" — prior 3D grid had 2/64 filled
// for 15+ cycles because rules kept colliding in the same engage×tempo×durability
// cell. 4D × 4 bins = 256 cells; more room for diverse elites.

const BINS = 4;                                   // 4⁴ = 256 cells — still legible, much more room

// SCOPE CAVEAT (owner 2026-11-28 — re-emitted every archive write so rsi-loop.mjs cannot silently
// strip it by overwriting the file). Independent reviewer + pit-digger subagents both found the
// manually-inserted top-level key was wiped by propose.mjs writeFileSync on the next cycle; the
// fix is to make summary() emit it authoritatively.
const SCOPE_CAVEAT = (
  'ALL ELITES BELOW ARE SCOPED TO: build=fighter, species=tangyuan(role-overridden), stats={pow:90,agi:80,vit:130,cha:60}, ' +
  'loadout={q:melee×1.4, e:projectile×1.1}, element=fire-only, level=16, affinity=60, enemies=doudou-1100/130 & doudou-2400/280, ' +
  '1v1/1vN only (NO teammates ever — evaluator.mjs:220 builds single-cat team), target picked by engine default, ' +
  'persona-scoring subset={null,lazy,explorer,panicky} (masher/cautious/impatient/balanced NOT scored). ' +
  'Winners DO NOT generalize to tank/dps/assassin/control/support build, to non-melee-plus-projectile kits, to team fights, ' +
  'to target-selection decisions, to peel/focus-fire/heal-aim quality, or to other enemy types. ' +
  'DO NOT apply any elite to battle.js without a build-gate + a kit-kind gate + re-verification once the evaluator extension ' +
  'roadmap (playtest-log.md ## RSI roadmap) lands.'
);
const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
const bin = x => Math.min(BINS - 1, Math.max(0, Math.floor(clamp01(x) * BINS)));

// Pull a 0..1 behavior vector from an evaluate() result. Reads the FIGHTING scenarios (solo-live /
// multi) so descriptors reflect real combat, falling back gracefully to whatever ran.
function descriptor(result) {
  const s = result?.perScenario || {};
  const live = s['solo-live'] || s['multi'] || s['solo-pinned'] || {};
  const raw = live.raw || {}, norm = live.norm || {};
  const engage = Number.isFinite(norm.positioning) ? norm.positioning
    : Number.isFinite(raw.posPct) ? raw.posPct / 100 : 0.5;
  const tempo = Number.isFinite(norm.speed) ? norm.speed
    : Number.isFinite(raw.timeToKill) ? clamp01(1 - raw.timeToKill / 20) : 0.5;
  const durability = Number.isFinite(norm.survival) ? norm.survival
    : Number.isFinite(raw.hpFracLeft) ? raw.hpFracLeft : 0.5;
  const efficiency = Number.isFinite(norm.efficiency) ? norm.efficiency
    : Number.isFinite(raw.negatedPct) ? clamp01(1 - raw.negatedPct / 100) : 0.5;
  return { engage, tempo, durability, efficiency };
}

export function makeArchive() {
  const cells = new Map();   // key "e,t,d" -> { key, descriptor, score, candidate, label }
  return {
    // Insert a candidate; keeps it only if it's the best (by score) in its behavior cell.
    add(result, score, candidate, label) {
      if (!Number.isFinite(score)) return false;
      const d = descriptor(result);
      const key = `${bin(d.engage)},${bin(d.tempo)},${bin(d.durability)},${bin(d.efficiency)}`;
      const cur = cells.get(key);
      if (!cur || score > cur.score) {
        cells.set(key, { key, descriptor: d, score, candidate, label: label || (candidate && candidate.id) || '?' });
        return true;                              // new elite in this behavior niche
      }
      return false;
    },
    // Coverage (# filled niches) + the elites, best-first — the diverse winning set.
    summary() {
      const elites = [...cells.values()].sort((a, b) => b.score - a.score);
      return {
        _scope_caveat: SCOPE_CAVEAT,
        coverage: cells.size, grid: `${BINS}x${BINS}x${BINS}x${BINS}`, maxCells: BINS ** 4,
        best: elites[0] || null,
        elites: elites.map(e => ({ cell: e.key, score: +e.score.toFixed(4), label: e.label, descriptor: {
          engage: +e.descriptor.engage.toFixed(2), tempo: +e.descriptor.tempo.toFixed(2), durability: +e.descriptor.durability.toFixed(2),
          efficiency: +(e.descriptor.efficiency ?? 0).toFixed(2),
        }, candidate: e.candidate })),
      };
    },
  };
}
