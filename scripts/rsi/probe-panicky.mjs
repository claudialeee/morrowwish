// One-shot probe: measure baseline cat's solo-live metrics under each persona.
// Proves (or refutes) the claim that panicky's solo-live is inherently ~0.
import { evaluate, scoreConfig } from './evaluator.mjs';

const CAT = {
  build: 'fighter', stats: { pow: 90, agi: 80, vit: 130, cha: 60 },
  loadout: { q: { kind: 'melee', power: 1.4, cd: 1.1 }, e: { kind: 'projectile', power: 1.1, cd: 1.0 } },
};
const ENEMY = { species: 'doudou', hp: 1100, dmg: 130 };
const OPTS = { seeds: [7, 42, 101], frames: 1800, scenarios: ['solo-live'] };
const PERSONAS = [null, 'lazy', 'explorer', 'panicky'];

const rows = [];
for (const persona of PERSONAS) {
  const cfg = { cat: CAT, enemy: ENEMY, ai: {}, persona };
  const r = evaluate(cfg, OPTS);
  const s = r.perScenario['solo-live'] || {};
  rows.push({
    persona: persona || 'auto-drive',
    win:        +(s.won ?? s.win ?? 0).toFixed(3),
    survival:   +(s.hpFracLeft ?? 0).toFixed(3),
    output:     +(s.dmgDealt ?? 0).toFixed(1),
    dmgTaken:   +(s.dmgTaken ?? 0).toFixed(1),
    norm_win:   +(s.norm?.win ?? 0).toFixed(3),
    norm_surv:  +(s.norm?.survival ?? 0).toFixed(3),
    norm_out:   +(s.norm?.output ?? 0).toFixed(3),
    score_default: +scoreConfig(r).toFixed(3),
  });
}
console.table(rows);
