// scripts/check-cat-bond-skill-targets.mjs
// Deterministic regression harness: for every non-ultimate, non-generic skill in
// skills.js SKILLS[], drive the REAL engine to CAST it on a known caster-vs-enemy
// setup and record "where did this skill actually resolve its landing point?"
// Then assert that recorded landing point matches a per-kind EXPECTED-source rule.
//
// WHY THIS EXISTS (Phase 0 refactor foundation):
//   public/cat-bond/js/battle.js has multiple parallel cast dispatchers (lobAoe,
//   castBeam, castUmbralBarrage, castMagneticField, the meteor-telegraph refresh
//   in tickPendingCasts around L3238). EACH re-decides "where should this skill
//   land?" from its own source — mouse snapshot (sk._castMouse), lockedEnemy(),
//   nearestEnemy(), or raw aim ray. When the inputs drift (owner moves cursor
//   during meteor's 1.5s windup, AI tries to fire beyond reach, etc.) the fire
//   gate and the resolve point disagree. The `sk._castMouse` snapshot commits
//   (02acba3c / f67c1583) patched this for the AOE lob + meteor telegraph; this
//   test locks that behavior in and surfaces the other kinds BEFORE a unified
//   target-resolver refactor can land safely.
//
// APPROACH (no engine edit):
//   1. Reuse evaluator.mjs's boot — same fake-DOM + vm sandbox the combat
//      verifiers all share. evaluate() boots once; we hook its Battle instance
//      via the knobOverride seam and drive casts ourselves.
//   2. Monkey-patch the Battle instance (not the class source): spawnProj,
//      lobAoe, castBeam, castUmbralBarrage, castMagneticField, meleeStrike,
//      chainBolt — each records "where it decided to land" into a probe bucket.
//   3. For each skill we parse out of skills.js: inject it as a plain-object
//      skill descriptor (battle.js only reads sk.kind / id / reach / etc.),
//      pin the game mouse + locked enemy to a KNOWN position, invoke
//      b.castOffensiveSkill(f, aim, sk, pow, col), step the sim for ~3s so
//      windups (meteor 1.5s) + pulse queues finish.
//   4. Pull the recorded resolve point(s) and check against the per-kind rule.
//
// HONEST LIMITS (what this test can / can't cover):
//   • Only ultCost==0 skills (no ultimates — those route through separate casts).
//   • Skips heal / buff (no offensive landing point to check).
//   • Skips generic autogen variants (sk.generic===true): the kit factory in
//     skills.js produces element×archetype clones that share the SAME base
//     dispatcher path per archetype — hand-authored representatives cover them.
//   • Skips crescentFan (species-signature, 2.5s charge + 0.45s pulse queue,
//     custom cast-time castAng snapshot path — needs its own dedicated test).
//   • We parse skills.js by regex for the skill fields battle.js consumes at
//     cast time (id, kind, element, reach, lobCount/Gap/Flight, shots, homing,
//     pulseCount/Gap, channel, windup, etc.). We do NOT execute skills.js here;
//     we only need the data battle.js's dispatcher reads from the skill object.
//
// WIRING: this file is NOT yet added to scripts/check-source.mjs. On a clean run
// locally we can add the import line; if it reports violations, leave it
// standalone so CI doesn't go red on a Phase 0 probe.

import fs from 'node:fs';
import { evaluate } from './rsi/evaluator.mjs';

// ---------- Boot + hook a single Battle instance ---------------------------
// We only need ONE battle for the whole run; we reset positions/cooldowns
// before every cast. evaluator.mjs's knobOverride is called BEFORE/DURING the
// step budget, so the simplest path: start a 1-frame run and stash the ref.
function bootBattle() {
  let captured = null;
  evaluate({ ai: { frozen: true } }, {
    seeds: [7], scenarios: ['solo-pinned'], frames: 1,
    knobOverride: (b) => { if (!captured) captured = b; }
  });
  return captured;
}

let probe = null;
function resetProbe(skillId, casterSnap) {
  probe = {
    skillId,
    casterX: casterSnap.x, casterY: casterSnap.y, casterR: casterSnap.r || 18,
    aim: casterSnap._aim || 0,
    melee: [], projectiles: [], beams: [], lobs: [], umbral: [], magnetic: [], chain: [],
    // generic resolveHit tally: hitscan lines (waterLash/frostLance/prismBeam) call
    // resolveHit directly without spawning a projectile — captured here so they still
    // test as "landed along aim ray from caster". Keyed by skill id of the incoming hit.
    hits: [],
  };
}

function hookBattle(b) {
  if (b._skillTargetHooked) return;
  b._skillTargetHooked = true;

  const origSpawnProj = b.spawnProj.bind(b);
  b.spawnProj = function (x, y, ang, spd, dmg, owner, color, r, kind, skill, life) {
    const p = origSpawnProj(x, y, ang, spd, dmg, owner, color, r, kind, skill, life);
    if (probe && owner === 'me' && skill && !skill.isBasic) {
      probe.projectiles.push({
        x, y, ang, spd, kind,
        skillId: skill.id || skill.name || '?',
      });
    }
    return p;
  };

  const origLobAoe = b.lobAoe.bind(b);
  b.lobAoe = function (f, aim, sk, dmg, col) {
    origLobAoe(f, aim, sk, dmg, col);
    const p = b.projectiles[b.projectiles.length - 1];
    if (probe && p && p.burst) probe.lobs.push({ tx: p.burst.tx, ty: p.burst.ty });
  };

  const origCastBeam = b.castBeam.bind(b);
  b.castBeam = function (f, aim, sk, dmgPerSec, col, owner = 'me') {
    origCastBeam(f, aim, sk, dmgPerSec, col, owner);
    const beam = b.beams[b.beams.length - 1];
    if (probe && beam && owner === 'me') {
      probe.beams.push({ ox: f.x, oy: f.y, aim: beam.aim, reach: beam.len, skillId: sk?.id });
    }
  };

  const origCastUmbral = b.castUmbralBarrage.bind(b);
  b.castUmbralBarrage = function (f, aim, sk, dmg, col, side = 'me', target = null) {
    origCastUmbral(f, aim, sk, dmg, col, side, target);
    if (probe && side === 'me' && b._umbralLobs) {
      for (const u of b._umbralLobs) probe.umbral.push({ tx: u.tx, ty: u.ty });
    }
  };

  const origCastMag = b.castMagneticField.bind(b);
  b.castMagneticField = function (f, aim, sk, dmg, col, side) {
    origCastMag(f, aim, sk, dmg, col, side);
    const fld = b.fields[b.fields.length - 1];
    if (probe && fld && fld.kind === 'magneticField' && side === 'me') {
      probe.magnetic.push({ cx: fld.x, cy: fld.y });
    }
  };

  const origMelee = b.meleeStrike.bind(b);
  b.meleeStrike = function (f, aim, skill, dmg, col) {
    const before = b.liveEnemies().map(e => ({ e, x: e.x, y: e.y, hp: e.hp }));
    origMelee(f, aim, skill, dmg, col);
    if (probe) for (const s of before) if (s.e.hp < s.hp) probe.melee.push({ x: s.x, y: s.y });
  };

  const origChain = b.chainBolt.bind(b);
  b.chainBolt = function (f, aim, sk, dmg, col) {
    const before = b.liveEnemies().map(e => ({ e, x: e.x, y: e.y, hp: e.hp }));
    origChain(f, aim, sk, dmg, col);
    if (probe) for (const s of before) if (s.e.hp < s.hp) probe.chain.push({ x: s.x, y: s.y });
  };

  // Catch-all: hitscan lines (waterLash/frostLance/prismBeam) call resolveHit
  // directly without spawning a projectile. We record the hit point tagged with
  // the incoming skill id so the projectile check has a landing signal.
  const origResolve = b.resolveHit.bind(b);
  b.resolveHit = function (target, side, skill, dmg, x, y, proj) {
    const r = origResolve(target, side, skill, dmg, x, y, proj);
    if (probe && side === 'me' && skill && r && r.dealt > 0 && !proj) {
      probe.hits.push({ x, y, skillId: skill.id || skill.name || '?' });
    }
    return r;
  };
}

// ---------- Per-cast setup ------------------------------------------------
function setupCastContext(b, CASTER, ENEMY) {
  const f = b.me();
  f.x = CASTER.x; f.y = CASTER.y;
  f.hp = f.maxhp; f.alive = true;
  f.cd = { basic: 0, q: 0, e: 0 };
  f.inv = 0; f.flash = 0; f._castRoot = 0; f._beamRoot = 0;
  f._dashAim = null; f._leapT = 0; f.dashT = 0; f.pounce = false;
  f._moonChargeLock = false; f._moonChargeLockUntil = 0;

  const e = b.enemies[0];
  e.x = ENEMY.x; e.y = ENEMY.y;
  e.maxhp = 100000; e.hp = e.maxhp;
  e.alive = true; e.inv = 0; e.flash = 0; e.dashT = 0; e._leapT = 0; e.pounce = false;
  e.r = e.r || 18;

  const aim = Math.atan2(ENEMY.y - CASTER.y, ENEMY.x - CASTER.x);
  f._aim = aim; b.aim = aim;
  if (b.game) {
    b.game.mouse = { x: ENEMY.x, y: ENEMY.y, active: true, idle: 0, down: false };
    b.game.isTouch = false;
  }
  b.autoMode = false;

  b.pendingCasts = [];
  b._pulseQueue = [];
  b._umbralLobs = [];
  b.projectiles = [];
  b.beams = [];
  b.fields = [];

  return { f, e, aim };
}

function castAndStep(b, f, sk, aim, steps = 200, dt = 0.016) {
  b.castOffensiveSkill(f, aim, sk, 1.0, '#fff');
  for (let i = 0; i < steps; i++) b.update(dt);
}

// ---------- Per-kind expected-source rule ---------------------------------
const FUDGE = 20;

function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function angleDiff(a, b) {
  let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function checkKind(kind, sk, probe, ctx) {
  const { CASTER, ENEMY, aim } = ctx;

  if (kind === 'melee') {
    // Rule: contact within RANGE 64 + r*0.65 of caster, inside ARC cone of aim (0.74 rad).
    if (probe.melee.length === 0) {
      const d = dist(CASTER.x, CASTER.y, ENEMY.x, ENEMY.y);
      if (d > 64 + 18 * 0.65 + FUDGE) {
        return { ok: true, skipped: true, reason: 'enemy outside melee reach by test design — no contact expected' };
      }
      return { ok: false, reason: 'melee skill produced no contact despite enemy in reach' };
    }
    const hit = probe.melee[0];
    const d = dist(CASTER.x, CASTER.y, hit.x, hit.y);
    if (d > 64 + 18 * 0.65 + FUDGE) {
      return { ok: false, reason: `melee contact ${d.toFixed(0)}px > RANGE+r*.65+fudge`, landing: hit };
    }
    const hitAng = Math.atan2(hit.y - CASTER.y, hit.x - CASTER.x);
    if (Math.abs(angleDiff(hitAng, aim)) > 0.74 + 0.1) {
      return { ok: false, reason: `melee outside ARC cone (${angleDiff(hitAng, aim).toFixed(2)} rad)`, landing: hit };
    }
    return { ok: true, reason: 'melee contact inside arc + reach', landing: hit };
  }

  if (kind === 'projectile') {
    if (probe.projectiles.length === 0) {
      // Hitscan lines (waterLash/frostLance/prismBeam) don't spawn a projectile —
      // they call resolveHit directly. Accept a direct hit near the enemy along
      // the caster's aim ray as equivalent to "fired along aim".
      const line = probe.hits.find(h => h.skillId === probe.skillId);
      if (line) {
        const dEnemy = dist(ENEMY.x, ENEMY.y, line.x, line.y);
        if (dEnemy > FUDGE + 24) {
          return { ok: false, reason: `hitscan landing ${dEnemy.toFixed(0)}px from enemy on aim ray`, landing: line };
        }
        const hitAng = Math.atan2(line.y - CASTER.y, line.x - CASTER.x);
        const dAng = Math.abs(angleDiff(hitAng, aim));
        if (dAng > 0.5) {
          return { ok: false, reason: `hitscan hit ${dAng.toFixed(2)} rad off aim`, landing: line };
        }
        return { ok: true, reason: 'hitscan line landed on enemy along aim ray', landing: line };
      }
      return { ok: false, reason: 'no projectile spawned and no resolveHit landing' };
    }
    const p = probe.projectiles[0];
    const dSpawn = dist(CASTER.x, CASTER.y, p.x, p.y);
    if (dSpawn > FUDGE + 40) {
      return { ok: false, reason: `projectile spawn ${dSpawn.toFixed(0)}px off caster`, landing: { x: p.x, y: p.y } };
    }
    const dAng = Math.abs(angleDiff(p.ang, aim));
    if (dAng > Math.PI * 0.6) {
      return { ok: false, reason: `projectile direction ${dAng.toFixed(2)} rad off aim`, landing: { x: p.x, y: p.y } };
    }
    return { ok: true, reason: 'projectile spawned along aim ray', landing: { x: p.x, y: p.y } };
  }

  if (kind === 'beam') {
    if (probe.beams.length === 0) return { ok: false, reason: 'no beam spawned' };
    const beam = probe.beams[0];
    const dOrig = dist(CASTER.x, CASTER.y, beam.ox, beam.oy);
    if (dOrig > FUDGE) {
      return { ok: false, reason: `beam origin ${dOrig.toFixed(0)}px from caster`, landing: { x: beam.ox, y: beam.oy } };
    }
    const dAng = Math.abs(angleDiff(beam.aim, aim));
    if (dAng > 0.5) {
      return { ok: false, reason: `beam aim ${dAng.toFixed(2)} rad off commanded aim` };
    }
    const expectedReach = sk.reach || 300;
    if (Math.abs(beam.reach - expectedReach) > 2) {
      return { ok: false, reason: `beam reach ${beam.reach} ≠ sk.reach ${expectedReach}` };
    }
    return { ok: true, reason: `beam origin+reach+aim coherent (reach=${beam.reach})` };
  }

  if (kind === 'aoe') {
    // Three sub-paths: arcanePulse (umbral), magneticField (capsule), standard lobAoe.
    if (probe.umbral.length > 0) {
      const impact = probe.umbral[0];
      const d = dist(ENEMY.x, ENEMY.y, impact.tx, impact.ty);
      if (d > FUDGE + 24) {
        return { ok: false, reason: `arcanePulse impact ${d.toFixed(0)}px from target`, landing: { x: impact.tx, y: impact.ty } };
      }
      return { ok: true, reason: 'arcanePulse impact at commanded target', landing: { x: impact.tx, y: impact.ty } };
    }
    if (probe.magnetic.length > 0) {
      const fld = probe.magnetic[0];
      const expectedReach = sk.reach || 220;
      const expCx = CASTER.x + Math.cos(aim) * expectedReach;
      const expCy = CASTER.y + Math.sin(aim) * expectedReach;
      const d = dist(expCx, expCy, fld.cx, fld.cy);
      if (d > FUDGE) {
        return { ok: false, reason: `magneticField center ${d.toFixed(0)}px off aim-ray pt`, landing: { x: fld.cx, y: fld.cy } };
      }
      return { ok: true, reason: 'magneticField center on aim ray at sk.reach', landing: { x: fld.cx, y: fld.cy } };
    }
    if (probe.lobs.length > 0) {
      const impact = probe.lobs[0];
      // Rule: lobAoe (desktop, me) honors sk._castMouse — we pinned game.mouse=ENEMY.
      const d = dist(ENEMY.x, ENEMY.y, impact.tx, impact.ty);
      if (d > FUDGE) {
        return { ok: false, reason: `AOE lob landed ${d.toFixed(0)}px from mouse snapshot`, landing: { x: impact.tx, y: impact.ty } };
      }
      return { ok: true, reason: 'AOE lob honored sk._castMouse (mouse snapshot)', landing: { x: impact.tx, y: impact.ty } };
    }
    return { ok: false, reason: 'aoe skill produced no observable landing' };
  }

  if (kind === 'dash' || kind === 'leap' || kind === 'pounce') {
    const traveled = dist(CASTER.x, CASTER.y, ctx.casterEnd.x, ctx.casterEnd.y);
    if (traveled < 20) {
      return { ok: false, reason: `caster did not travel (moved ${traveled.toFixed(0)}px)` };
    }
    const travelAng = Math.atan2(ctx.casterEnd.y - CASTER.y, ctx.casterEnd.x - CASTER.x);
    const dAng = Math.abs(angleDiff(travelAng, aim));
    if (dAng > 0.6) {
      return { ok: false, reason: `caster traveled ${dAng.toFixed(2)} rad off aim` };
    }
    return { ok: true, reason: `${kind}: caster traveled ${traveled.toFixed(0)}px toward aim`, landing: ctx.casterEnd };
  }

  if (kind === 'chain') {
    if (probe.chain.length === 0) return { ok: false, reason: 'chain skill produced no contact' };
    const hit = probe.chain[0];
    const d = dist(ENEMY.x, ENEMY.y, hit.x, hit.y);
    if (d > FUDGE + 24) {
      return { ok: false, reason: `chain first-hit ${d.toFixed(0)}px from nearest enemy`, landing: hit };
    }
    return { ok: true, reason: 'chain first-hit on nearest live enemy', landing: hit };
  }

  return { ok: true, skipped: true, reason: `kind=${kind}: no expected-source rule — skipped` };
}

// ---------- Parse SKILLS[] out of skills.js --------------------------------
// We don't execute skills.js here. battle.js's dispatcher only reads a handful
// of fields off the skill object (id, kind, element, reach, lob*, pulseCount,
// shots, homing, windup, channel, chargeT, chargeLock, field, ultCost). Pull
// those via regex per entry. Entries we can't parse (missing id/kind) are dropped.
function parseSkills(src) {
  const start = src.indexOf('const SKILLS = [');
  if (start < 0) throw new Error('skills.js: cannot find SKILLS = [');
  let i = src.indexOf('[', start), depth = 0;
  const arrStart = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
    else if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; }
    else if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i++; }
    else if (c === "'" || c === '"') { const q = c; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; } }
  }
  const arrEnd = i;
  const arrSrc = src.slice(arrStart + 1, arrEnd);
  const entries = [];
  let bd = 0, entryStart = -1;
  for (let j = 0; j < arrSrc.length; j++) {
    const c = arrSrc[j];
    if (c === '/' && arrSrc[j + 1] === '/') { while (j < arrSrc.length && arrSrc[j] !== '\n') j++; continue; }
    if (c === '/' && arrSrc[j + 1] === '*') { j += 2; while (j < arrSrc.length && !(arrSrc[j] === '*' && arrSrc[j + 1] === '/')) j++; j++; continue; }
    if (c === "'" || c === '"') { const q = c; j++; while (j < arrSrc.length && arrSrc[j] !== q) { if (arrSrc[j] === '\\') j++; j++; } continue; }
    if (c === '{') { if (bd === 0) entryStart = j; bd++; }
    else if (c === '}') { bd--; if (bd === 0 && entryStart >= 0) { entries.push(arrSrc.slice(entryStart, j + 1)); entryStart = -1; } }
  }
  const out = [];
  for (const entry of entries) {
    const idM = /\bid\s*:\s*['"]([^'"]+)['"]/.exec(entry);
    const kindM = /\bkind\s*:\s*['"]([^'"]+)['"]/.exec(entry);
    const elM = /\belement\s*:\s*['"]([^'"]+)['"]/.exec(entry);
    if (!idM || !kindM) continue;
    const sk = { id: idM[1], kind: kindM[1], element: elM ? elM[1] : 'neutral' };
    const nums = ['power', 'cd', 'ultCost', 'reach', 'windup', 'channel', 'shots', 'homing',
      'damageChannel', 'lobCount', 'lobGap', 'lobFlight', 'lobSpread', 'lobRadius',
      'pulseCount', 'pulseGap', 'pulseHoming', 'chargeT', 'spread', 'maxProjLife',
      'width', 'sweep', 'sweepPasses', 'grow', 'castSlow', 'wardDuration', 'healPct'];
    for (const key of nums) {
      const m = new RegExp('\\b' + key + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)').exec(entry);
      if (m) sk[key] = parseFloat(m[1]);
    }
    const bools = ['generic', 'heavy', 'precise', 'chargeLock', 'isBasic', 'healUlt'];
    for (const key of bools) {
      const m = new RegExp('\\b' + key + '\\s*:\\s*(true|false)').exec(entry);
      if (m) sk[key] = (m[1] === 'true');
    }
    const strs = ['name', 'vfx', 'appliesTag', 'healMode', 'shieldType'];
    for (const key of strs) {
      const m = new RegExp('\\b' + key + '\\s*:\\s*[\'"]([^\'"]+)[\'"]').exec(entry);
      if (m) sk[key] = m[1];
    }
    const tagsM = /\btags\s*:\s*\[([^\]]*)\]/.exec(entry);
    if (tagsM) sk.tags = [...tagsM[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
    if (/\bfield\s*:\s*\{/.test(entry)) sk.field = { element: sk.element, tag: null, life: 5 };
    out.push(sk);
  }
  return out;
}

// ---------- Main ----------------------------------------------------------
function main() {
  console.log('Cat Bond skill-cast target regression — Phase 0 refactor foundation');
  console.log('(reusing rsi/evaluator.mjs vm boot; no edits to public/cat-bond/js/*)');
  console.log('');

  const SKILLS_LIST = parseSkills(fs.readFileSync('public/cat-bond/js/skills.js', 'utf8'));
  const b = bootBattle();
  if (!b) { console.error('FATAL: could not capture Battle instance'); process.exit(1); }
  hookBattle(b);
  // freeze the AI so our scripted casts aren't trampled by its re-aim.
  b.updateAllyAI = () => {};
  b.autoDrive = () => {};

  const results = [];
  let tested = 0, violations = 0, skipped = 0;

  for (const sk of SKILLS_LIST) {
    if ((sk.ultCost || 0) > 0) { skipped++; continue; }
    if (sk.generic) { skipped++; continue; }
    if (sk.kind === 'heal' || sk.kind === 'buff') { skipped++; continue; }
    if (sk.id === 'crescentFan') {
      results.push({ skillId: sk.id, kind: sk.kind, skipped: true, reason: 'species-signature with charge+pulse queue — dedicated test needed' });
      skipped++; continue;
    }

    const CASTER = { x: 400, y: 360 };
    let targetDist = 100;
    switch (sk.kind) {
      case 'melee': targetDist = 50; break;
      case 'dash': case 'pounce': case 'leap': targetDist = 150; break;
      case 'projectile': targetDist = Math.min(180, sk.reach || 150); break;
      case 'beam': targetDist = Math.round((sk.reach || 300) * 0.5); break;
      case 'aoe': targetDist = Math.min(200, sk.reach || 150); break;
      case 'chain': targetDist = 150; break;
    }
    const ENEMY = { x: CASTER.x + targetDist, y: CASTER.y };

    resetProbe(sk.id, { x: CASTER.x, y: CASTER.y, r: 18, _aim: 0 });
    const { f, aim } = setupCastContext(b, CASTER, ENEMY);
    castAndStep(b, f, sk, aim, 200, 0.016);
    const casterEnd = { x: f.x, y: f.y };

    const ctx = { CASTER, ENEMY, aim, casterEnd };
    const check = checkKind(sk.kind, sk, probe, ctx);

    tested++;
    if (check.skipped) skipped++;
    else if (!check.ok) violations++;

    results.push({
      skillId: sk.id, kind: sk.kind, element: sk.element,
      ok: check.ok, skipped: !!check.skipped,
      reason: check.reason,
      landing: check.landing,
      expected: { x: ENEMY.x, y: ENEMY.y },
    });
  }

  // ---- Phase 2.4 regression: chain first-node freeze ----
  // Chain skill (boltArc) cast at enemy at X. Then enemy teleports BEFORE chainBolt fires
  // (simulated via spawn-a-second-enemy at a far position; first enemy stays close). Assert:
  // post Phase 2.4, chain's first bolt hits the enemy nearest to the SNAPSHOT point (the one
  // at cast-time), NOT the one that's now closest to caster after a hypothetical move.
  const chainSk = SKILLS_LIST.find(s => s.id === 'boltArc') || SKILLS_LIST.find(s => s.kind === 'chain');
  if (chainSk) {
    const CASTER = { x: 400, y: 360 };
    const SEED_TARGET = { x: 550, y: 360 }; // 150px right — snapshot points here
    resetProbe(chainSk.id, { x: CASTER.x, y: CASTER.y, r: 18, _aim: 0 });
    const { f, aim, e } = setupCastContext(b, CASTER, SEED_TARGET);
    // Spawn a decoy closer to the caster NOW (after snapshot): if the fix is missing,
    // chainBolt will pick this decoy instead of the frozen SEED_TARGET enemy.
    const decoy = b.enemies.find(x => x !== e && x.alive) || null;
    if (decoy) {
      decoy.x = CASTER.x + 30;
      decoy.y = CASTER.y;
      decoy.hp = decoy.maxhp = 100000;
      decoy.alive = true; decoy.inv = 0; decoy.flash = 0;
    }
    castAndStep(b, f, chainSk, aim, 200, 0.016);
    const firstHit = probe.chain[0];
    const snapshotWins = firstHit && Math.hypot(firstHit.x - SEED_TARGET.x, firstHit.y - SEED_TARGET.y) < 20;
    tested++;
    if (snapshotWins) {
      results.push({ skillId: chainSk.id + '[phase2.4]', kind: 'chain-freeze', ok: true, reason: 'chain first-node honored sk._cast.target snapshot (ignored closer decoy)' });
    } else {
      violations++;
      results.push({ skillId: chainSk.id + '[phase2.4]', kind: 'chain-freeze', ok: false, reason: `chain first-node did NOT freeze — hit at ${firstHit ? `(${firstHit.x.toFixed(0)},${firstHit.y.toFixed(0)})` : 'none'}, expected near seed (550,360)`, landing: firstHit });
    }
  }

  console.log('  SKILL-LIST size: ' + SKILLS_LIST.length + '  tested: ' + tested + '  skipped: ' + skipped + '  violations: ' + violations);
  console.log('');

  const viol = results.filter(r => !r.ok && !r.skipped);
  const pass = results.filter(r => r.ok && !r.skipped);
  const skip = results.filter(r => r.skipped);

  if (viol.length) {
    console.log('=== VIOLATIONS (' + viol.length + ') ===');
    for (const r of viol) {
      const ls = r.landing ? `(${(r.landing.x ?? 0).toFixed(0)},${(r.landing.y ?? 0).toFixed(0)})` : '(no landing)';
      console.log('  [' + r.kind.padEnd(10) + '] ' + r.skillId.padEnd(20) + ' el=' + (r.element || '?').padEnd(5) +
        ' landed ' + ls + ' expected (' + r.expected.x + ',' + r.expected.y + ')');
      console.log('    -> ' + r.reason);
    }
    console.log('');
  }
  if (pass.length) {
    console.log('=== PASS (' + pass.length + ') ===');
    for (const r of pass) {
      console.log('  [' + r.kind.padEnd(10) + '] ' + r.skillId.padEnd(20) + ' ' + r.reason);
    }
    console.log('');
  }
  if (skip.length) {
    console.log('=== SKIPPED (' + skip.length + ') ===');
    for (const r of skip) {
      console.log('  [' + (r.kind || '?').padEnd(10) + '] ' + r.skillId.padEnd(20) + ' ' + r.reason);
    }
    console.log('');
  }

  const pct = tested > 0 ? (100 * (tested - violations) / tested) : 0;
  console.log('----');
  console.log(JSON.stringify({ totalSkillsTested: tested, violations, pct: +pct.toFixed(2) }));

  if (violations > 0) process.exit(1);
}

try { main(); } catch (e) {
  console.error('[check-cat-bond-skill-targets] FAILED:', e.stack || e.message);
  process.exit(1);
}
