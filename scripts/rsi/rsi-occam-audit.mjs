// rsi-occam-audit.mjs — manual-run Occam's-razor diagnostic bundle.
//
// Not part of the hourly RSI cron (would slow it 3x). Run on-demand:
//   node scripts/rsi/rsi-occam-audit.mjs
//
// Chains the two diagnostic probes and prints one honest headline:
//   • knob-usage-probe:    which battle.js knobs the RSI AI harness can SEE
//   • archive-reachability: how many of the 64 MAP-Elites cells are physically reachable
//
// Non-gating, additive, no game-code changes.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(name) {
  try {
    const out = execFileSync('node', [path.join(__dirname, name)], { encoding: 'utf8', timeout: 240000 });
    return { ok: true, out };
  } catch (e) { return { ok: false, out: (e.stdout || '') + '\n' + (e.stderr || e.message || '') }; }
}

console.log('[occam-audit] 1/2 running knob-usage-probe...');
const k = run('knob-usage-probe.mjs');
console.log('[occam-audit] 2/2 running archive-reachability-probe...');
const a = run('archive-reachability-probe.mjs');

const grab = (txt, re) => { const m = (txt || '').match(re); return m ? m[1] : null; };
const kJson = k.ok ? grab(k.out, /\[knob-probe-json\]\s*(\{.*\})/) : null;
const aJson = a.ok ? grab(a.out, /\[archive-probe-json\]\s*(\{.*\})/) : null;

let kSummary = 'FAILED';
if (kJson) {
  try {
    const j = JSON.parse(kJson);
    kSummary = `invisible-to-AI-harness: ${j.invisible.length}/${j.results.length - 1} knobs`;
  } catch (_) {}
}
let aSummary = 'FAILED';
if (aJson) {
  try {
    const j = JSON.parse(aJson);
    aSummary = `archive reachability: ${j.reached}/${j.max} cells touched by ${j.samples} random bands`;
  } catch (_) {}
}

console.log('\n============ OCCAM AUDIT HEADLINE ============');
console.log('knob visibility:       ' + kSummary);
console.log('archive reachability:  ' + aSummary);
console.log('full detail:           see per-probe stdout above');
console.log('knob map reference:    scripts/rsi/KNOBS.md');
console.log('==============================================');

if (!k.ok) { console.error('[occam-audit] knob-probe failed:\n' + k.out.slice(-800)); process.exit(1); }
if (!a.ok) { console.error('[occam-audit] archive-probe failed:\n' + a.out.slice(-800)); process.exit(1); }
