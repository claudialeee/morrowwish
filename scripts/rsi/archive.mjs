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
//   • engage  — how close it fights      (posPct: higher = stays engaged/close)
//   • tempo   — how fast it acts/kills   (actsPct or 1/timeToKill proxy)
//   • durability — how much HP it keeps  (hpFracLeft)
// Elite per cell = highest judge score. Pure data; no deps; JSON-serializable.

const BINS = 4;                                   // 4×4×4 = 64 cells — small, legible, enough spread
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
  return { engage, tempo, durability };
}

export function makeArchive() {
  const cells = new Map();   // key "e,t,d" -> { key, descriptor, score, candidate, label }
  return {
    // Insert a candidate; keeps it only if it's the best (by score) in its behavior cell.
    add(result, score, candidate, label) {
      if (!Number.isFinite(score)) return false;
      const d = descriptor(result);
      const key = `${bin(d.engage)},${bin(d.tempo)},${bin(d.durability)}`;
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
        coverage: cells.size, grid: `${BINS}x${BINS}x${BINS}`, maxCells: BINS ** 3,
        best: elites[0] || null,
        elites: elites.map(e => ({ cell: e.key, score: +e.score.toFixed(4), label: e.label, descriptor: {
          engage: +e.descriptor.engage.toFixed(2), tempo: +e.descriptor.tempo.toFixed(2), durability: +e.descriptor.durability.toFixed(2),
        }, candidate: e.candidate })),
      };
    },
  };
}
