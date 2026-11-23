# Enemy real-skill rotation — design spec (owner bug: "敌人全程还是在发射 projectile，没有使用我们的技能")

## Confirmed bug (from owner's debug log)
焰焰(SSR fire) over a 38s fight only ever fired: `basic`(火球), `toy`, `gen_fire_barrage`.
It NEVER cast a real equipped fire signature skill (咳毛球/烈焰罩/横扫喷焰/etc.).

## Root cause (verified in battle.js)
- `makeEnemy` stores ONE skill: `e.skill = pickWildSkillFor(...) = kit.primary`, plus `e.kit`
  (which DOES carry `kit.attacks` = all legal gated attacks, and `kit.ult`).
- The enemy's **normal fire** path (updateEnemyAI, ~line 4528) is HARDCODED to a `basic ball`
  projectile (`basicSk = {element, isBasic:true}`). It ignores `kit.attacks` entirely.
- The only path that touches a real skill is the **special meter** (nova/barrage/lob/ult), and it
  RESHAPES `e.skill` into a generic fan/nova — it never delivers the skill by its own `kind`
  (a beam as a beam, an aoe as a lobbed aoe, a melee as a claw). So between slow specialMeter
  fills, the enemy just machine-guns basic pellets.
- Players, by contrast, cast Q + E on independent cooldowns via `smartAutoAction`/`castOffensiveSkill`,
  which dispatches by `sk.kind` (melee/aoe/dash/leap/pounce/chain/beam/shots→volley).

## Fix design — give the enemy a 2-skill rotation delivered through the SAME dispatch
Mirror the player's Q/E. Keep it gate-clean (no ults in rotation; role×category already enforced
by enemyKitFor). Keep the special-meter heavy + charged ult AS-IS (they're the "big moves").

### skills.js — `enemyKitFor` already returns `attacks` + `primary`. Add a `rotation`:
```
// Up to 2 DISTINCT real skills the wild cat casts on cooldown, like a player's Q/E. Prefer the
// primary + one more with a DIFFERENT kind (so it isn't two identical pokes). Ults excluded.
const rotation = [];
if (primary) rotation.push(primary);
const second = attacks.find(sk => sk.id !== primary?.id && sk.kind !== primary?.kind)
            || attacks.find(sk => sk.id !== primary?.id);
if (second) rotation.push(second);
return { ..., rotation };
```

### battle.js makeEnemy — store per-skill cooldowns:
```
rotation: (this.__lastKit && this.__lastKit.rotation) || [],
skillCd: [0, 0],        // independent cd per rotation slot (like player cd.q / cd.e)
// stagger the FIRST availability so the opener isn't an instant skill dump:
_rotReady: 1.2 + this.rng() * 1.0,
```

### battle.js updateEnemyAI — BEFORE the hardcoded normal-fire block, try a rotation cast:
```
// REAL SKILL ROTATION (敌我同一套): before falling back to the basic pellet, if a rotation skill
// is off-cooldown AND reaches from here, CAST IT by its real kind through the shared enemy delivery
// — so a wild cat actually uses 咳毛球/烈焰罩/横扫 like the player, not just basic + the special.
if (e._rotReady <= 0) {
  for (let s = 0; s < e.rotation.length; s++) {
    if ((e.skillCd[s] || 0) > 0) continue;
    const sk = e.rotation[s];
    const reach = this.skillEngageReach(sk, 169);     // same reach gate the player uses
    if (dist > reach) continue;
    // deliver by kind — REUSE existing enemy delivery helpers where they exist:
    //   beam  → a short enemy beam (mirror castBeam, owner 'wild')
    //   aoe   → enemyLobAoe
    //   melee/dash/leap/pounce → a lunge that resolveHit's (mirror the pounce block)
    //   projectile/chain/shots → castVolley(e, aim, sk, e.dmg*(sk.power||1), col, 'wild')
    this.castEnemySkill(e, me, sk);                   // NEW dispatch (see below)
    e.skillCd[s] = Math.max(2.2, (sk.cd || 3)) ;      // honor the skill's own cd (floored)
    e._castSlow = sk.castSlow || 0.6;                 // 后遗症 so it's readable/punishable
    return;                                            // one action this frame
  }
}
e._rotReady -= dt;  // (decrement near the other timers)
// ... then the existing basic-pellet block as the FALLBACK when no skill is ready/in range
```
Also decrement `e.skillCd[s] -= dt` each frame near the other enemy timers.

### NEW `castEnemySkill(e, me, sk)` — a thin dispatcher mirroring castOffensiveSkill but owner='wild':
```
castEnemySkill(e, me, sk){
  const aim = Math.atan2(me.y - e.y, me.x - e.x);
  const col = this.elemColor(sk.element || e.element);
  const dmg = e.dmg * (sk.power || 1);
  const k = sk.kind;
  if (k === 'aoe')               return this.enemyLobAoe(e, me, col);           // existing
  if (k === 'beam')              return this.castEnemyBeam ? this.castEnemyBeam(e, aim, sk, dmg, col)
                                        : this.castVolley(e, aim, {...sk, shots:3, spread:0.08}, dmg, col, 'wild');
  if (k === 'melee' || k === 'dash' || k === 'leap' || k === 'pounce') {
    // short lunge + resolveHit on contact (mirror unleashEnemySpecial pounce block, reduced)
    const leap = Math.min(90, dist * 0.42);
    e.x = clamp(e.x + Math.cos(aim)*leap, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    e.y = clamp(e.y + Math.sin(aim)*leap, this.topMargin, this.H - this.bottomMargin);
    for (const f of this.team.filter(f=>f.alive))
      if (Math.hypot(f.x-e.x, f.y-e.y) < 95) this.resolveHit(f, 'wild', sk, dmg*1.1, e.x, e.y);
    return;
  }
  // projectile / chain / multi-shot — the shared volley path (budget-safe)
  return this.castVolley(e, aim, (sk.shots>1?sk:{...sk,shots:3,spread:0.1}), dmg, col, 'wild');
}
```

## Balance guards (MUST keep)
- Rotation damage uses the SAME `e.dmg * sk.power`; it does NOT bypass the player's level-suppression /
  water-resist pipeline (castVolley/resolveHit already run elemMult + enemyLevelMult). A rotation skill
  should NOT be a bigger nuke than the special — it's the "normal Q/E", power ≈ 1.0–1.4.
- Floor each `skillCd` ≥ 2.2s so the enemy can't machine-gun real skills; the `_rotReady` opener
  delay (1.2–2.2s) keeps the opening quiet (consistent with specialMeter-from-0).
- `_castSlow` after each cast = a readable/punishable recovery window (后遗症), like the player.
- Wards (enemyMaybeWard) + special meter + charged ult paths are UNCHANGED.

## Tests to add (check-cat-bond.mjs / combat-matrix)
1. `enemyKitFor('jiafei',8).rotation` has ≥1 entry; for a dual-kind breed, 2 entries of different kind.
2. A seeded enemy fight: assert the enemy casts at least one NON-basic, NON-barrage skill id within 12s
   (i.e. a real rotation kind) — directly refutes "敌人全程只发 projectile".
3. Rotation never contains an ult (ultCost>0) and never a role-illegal skill (reuse roleAllowsSkill).
4. i18n: no new untranslated zh string literals (dispatcher is logic-only; toasts optional + bilingual).

## Verification
- Deterministic sim (realCat lvl-8, autoMode): log enemy skill ids over 12s → must include a real kind.
- Two challenger rounds (regression + balance) BEFORE landing.
- `npm run check` green. Local commit only, no push (per CLAUDE.md).

Status: SPEC ONLY — implement AFTER the chase/dodge fix passes its two challengers and commits,
to avoid tangling two combat changes in one working tree.
