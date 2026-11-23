// rsi-loop.mjs — standing self-improvement orchestrator (owner: "一直 improve band/verifier/AI").
//
// One cron cycle: run the deterministic optimizer (optimize.mjs) + the structural proposer
// (propose.mjs, now judged by the MOBA ground-truth proxy — see .claude/moba-ai-groundtruth-spec.md),
// capture their winners + scores, and APPEND a timestamped line to scripts/rsi/rsi-history.log so
// progress is visible across cycles.
//
// SAFETY (identical model to the hourly playtest cron):
//   • PROPOSES params only — never auto-edits battle.js / skills.js / the evaluator.
//   • Writes only to scripts/rsi/ (optimized-params.json via optimize.mjs + rsi-history.log here).
//   • No push, no deploy. A human reads the history + params and decides what to land.
// Deterministic: optimize.mjs + propose.mjs are seeded, so a cycle with unchanged code reproduces.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY = path.join(__dirname, 'rsi-history.log');
const stamp = process.env.RSI_STAMP || new Date().toISOString();   // cron passes a real time; else now

function run(script) {
  try {
    return { ok: true, out: execFileSync('node', [path.join(__dirname, script)], { encoding: 'utf8', timeout: 180000 }) };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + '\n' + (e.stderr || e.message || '') };
  }
}

// --- optimizer: (1+1)-ES over the band; writes optimized-params.json ---
const opt = run('optimize.mjs');
// --- proposer: structural candidates ranked by the MOBA ground-truth judge ---
const prop = run('propose.mjs');

// Pull the headline numbers out of each script's stdout (they already print them).
const grab = (txt, re) => { const m = (txt || '').match(re); if (!m) return '?'; const g = m[1] ?? m[2] ?? m[0]; return (g || '?').toString().trim(); };
const optLine = opt.ok
  ? `opt: ${grab(opt.out, /best .*?score[^0-9]*([0-9.]+)/i) || '?'} ` +
    `${grab(opt.out, /(held-?out[^\n]*)/i)}`.trim()
  : 'opt: FAILED';
const propWinner = prop.ok ? grab(prop.out, /WINNER:\s*'([^']+)'/) : 'FAILED';
const propScore  = prop.ok ? grab(prop.out, /judge\s*([0-9.]+)\)|\(([0-9.]+)\s*vs baseline/) : '?';
const control    = prop.ok ? (/(ranked LAST as required|ranked LAST)/.test(prop.out) ? 'control-last✓' : 'control-CHECK') : '-';

// Read the optimizer's generalization summary so the history shows real progress over cycles:
// how many band cells improved on HELD-OUT seeds (the honest win condition the optimizer reports).
let band = '?';
try {
  const p = JSON.parse(readFileSync(path.join(__dirname, 'optimized-params.json'), 'utf8'));
  const s = p.summary;
  band = s ? `cells ${s.cellsImprovedHeldOut}/${s.cellsTotal} improved, ${s.cellsGeneralized} generalized` : '?';
} catch (_) {}

// MAP-Elites coverage: how many behavior niches the diverse winning set now spans (plan P1).
let archive = '?';
try {
  const a = JSON.parse(readFileSync(path.join(__dirname, 'rsi-archive.json'), 'utf8'));
  archive = `archive ${a.coverage}/${a.maxCells} niches, best ${a.best ? a.best.score.toFixed(3) : '?'}`;
} catch (_) {}

const line = `${stamp}  judge=moba-groundtruth  ${optLine}  |  propose winner='${propWinner}' ${control}  |  band=${band}  |  ${archive}` +
  (opt.ok && prop.ok ? '' : '  [!! a sub-script failed — see transcript]');

appendFileSync(HISTORY, line + '\n');
console.log('[rsi-loop] ' + line);
if (!opt.ok) console.log('--- optimize.mjs error tail ---\n' + opt.out.slice(-800));
if (!prop.ok) console.log('--- propose.mjs error tail ---\n' + prop.out.slice(-800));
