#!/usr/bin/env node
// Phase 1 drift checker for scripts/skill-registry.mjs.
//
// For every entry in SKILL_RUNTIME that is NOT marked inferred:true, each regex listed in
// its `_sources` MUST still match battle.js. The registry captures per-skill metadata that
// is currently scattered as `if(sk.id==='x')` branches in battle.js; if a branch is moved,
// renamed, or deleted without updating the registry, this checker fails loudly.
//
// Honesty note: this is a REGEX match, not an AST walk. It catches:
//   - deletion of a branch (regex stops matching)
//   - rename of a skill id (regex stops matching)
//   - restructure that changes the surrounding token shape (regex stops matching)
// It DOES NOT catch:
//   - a branch whose body silently changed numbers (e.g. windup 1.5 → 2.0). The registry's
//     numeric fields (windup / reach / radius / etc.) are documented but not source-verified.
//   - an entirely NEW `sk.id==='…'` branch that has no registry entry. See the final
//     reverse-scan (below) for that case.
//
// Exit codes: 0 = no drift, 1 = drift detected.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const battlePath = path.join(repo, 'public/cat-bond/js/battle.js');
const battleSrc = fs.readFileSync(battlePath, 'utf8');

// Smoke-parse battle.js so we fail early on any syntax drift. We don't execute it — the
// file depends on tons of DOM/window globals — but new vm.Script catches parse errors.
try { new vm.Script(battleSrc, { filename: 'battle.js' }); }
catch (e) { console.error('battle.js failed to parse:', e.message); process.exit(1); }

const registryUrl = url.pathToFileURL(path.join(here, 'skill-registry.mjs')).href;
const { SKILL_RUNTIME, SKILL_RUNTIME_VERIFIED_IDS } = await import(registryUrl);

const drift = [];
let checkedRegexes = 0;

for (const id of SKILL_RUNTIME_VERIFIED_IDS) {
  const entry = SKILL_RUNTIME[id];
  const sources = entry._sources || [];
  if (!sources.length) {
    drift.push({ id, kind: 'no-sources', msg: 'verified entry has no _sources — either add regex(es) or set inferred:true' });
    continue;
  }
  for (const src of sources) {
    if (src.file !== 'public/cat-bond/js/battle.js') {
      drift.push({ id, kind: 'bad-file', msg: `_sources entry points at ${src.file}; this checker only reads battle.js` });
      continue;
    }
    let re;
    try { re = new RegExp(src.regex); }
    catch (e) { drift.push({ id, kind: 'bad-regex', msg: `invalid regex ${JSON.stringify(src.regex)}: ${e.message}` }); continue; }
    checkedRegexes++;
    if (!re.test(battleSrc)) {
      drift.push({ id, kind: 'missing-match', msg: `regex no longer matches battle.js: /${src.regex}/` });
    }
  }
}

// Reverse scan: every `sk.id === 'foo'` / `sid === 'foo'` / `b.sk?.id === 'foo'` branch
// occurring in battle.js — if its id is not in the registry, flag it as an un-captured
// branch so the registry stays comprehensive as the codebase evolves.
const BRANCH_RE = /(?:sk|b\.sk|c\.sk|p\.burst\.skill|b\.skill|skill|p\.sk)\??\.id\s*===\s*'([a-zA-Z]+)'|\bsid\s*===\s*'([a-zA-Z]+)'/g;
const seen = new Set();
for (const m of battleSrc.matchAll(BRANCH_RE)) {
  const id = m[1] || m[2];
  if (seen.has(id)) continue;
  seen.add(id);
  if (!Object.prototype.hasOwnProperty.call(SKILL_RUNTIME, id)) {
    drift.push({ id, kind: 'unregistered-branch', msg: `battle.js references sk.id==='${id}' but registry has no entry` });
  }
}

if (drift.length) {
  console.error(`skill-registry drift: ${drift.length} issue(s) across ${checkedRegexes} regex check(s)`);
  for (const d of drift) console.error(`  [${d.kind}] ${d.id}: ${d.msg}`);
  process.exit(1);
}

console.log(`skill-registry drift: 0. Verified ${SKILL_RUNTIME_VERIFIED_IDS.length} skill(s), ${checkedRegexes} regex(es), scanned ${seen.size} id-branch site(s) in battle.js.`);
