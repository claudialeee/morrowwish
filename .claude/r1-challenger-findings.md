# R1 Challenger consolidated findings (2026-11-22) — enemy-unification + skills bundle

Three independent adversarial challengers (correctness / balance / symmetry). Verdict: **no crashes
(P0/P1 runtime clean)**; the real issues are BALANCE + the delivery-layer honesty gap + two feel
regressions. Owner's live complaint (lv10 vs SSR 焰焰 too hard) is CONFIRMED as a real imbalance.

## MUST-FIX this round (owner-facing / fairness)

### F1 — SSR/rare wild HP is absurd vs an out-leveling player (the "太难 / 打不死" root)  ★ owner live report
`makeEnemy` HP = `(140+vit*7) * (1 + rIdx*0.6) * lvScale * eliteFactor * earlyDamp * enemyHpScaleGap`.
For an SSR, `rIdx=3` → `(1+1.8)=2.8 × eliteFactor 1.22 = 3.42×` base. 焰焰 lv3 SSR = **525 HP** vs a
lv10 player cat's ~181. Level suppression (`enemyHpScaleGap`) only reaches 0.85 and does NOT scale
down the rarity multiplier. Player base dmg ~9, ×0.5 fire-resist ×1.23 suppression ≈ 7/hit → **~88
hits to kill**. Measured: 75% winrate but avg 31% team HP left (every win is an ICU victory).
FIX: when the player OUT-levels the wild (gap>0), the rarity HP multiplier must decay with the gap
(a big rIdx is a threat at-level, not when you're 7 levels over it). Scale `(rIdx*0.6)` contribution
by a gap factor, and/or let `enemyHpScaleGap` also cut rare HP harder at large positive gaps.

### F2 — Enemy charged-ult risk is INVERTED (challenger P2-A, ties to the one-directional theme)
`ultMeter += dt*(6.5+hurt*5)` has NO fight-state gate (unlike smash's `dominating` gate). So a
LOSING player (suppressed to playerDmgMult 0.60 vs an over-level SR) still eats the ult. And the
interrupt budget `maxhp*0.28` is trivial for a winner (small enemy HP + 1.25 dmg) but unreachable
for a loser → the ult only ever lands on players who can't handle it. FIX: gate/slow the charge when
the player is being dominated; make the interrupt budget a flat fraction that scales with level gap.

### F3 — enemyUlt telegraph draws a directional CONE for a radial attack (correctness P2-1)
battle.js draw switch has no `enemyUlt` case → falls to the `else` directional-cone warning, but the
release is a 360° radial burst (nova-shaped). Misleads the dodge. FIX: add `enemyUlt` to the
telegraph draw + color switches, reuse the nova radial ring (distinct/larger).

## SHOULD-FIX (trap skills — the new content is near-useless)

### F4 — barrage single-target trap (challenger P2-C)
power 0.42, shots 5, maxHitsPerEnemy 1 → vs one enemy lands ~1 pellet = 0.091 power/s, ~5× worse
than a plain bolt (0.5/s). Only pays vs 3+ spread enemies. FIX: bump per-pellet to ~0.55–0.6, OR
allow 2 budget hits on wide/hugging targets, OR accept as explicit zoning (label it).

### F5 — boltSwarm/prismSwarm self-defeating (challenger P2-B)
4 homing pellets all seek the SAME nearest enemy; 1-hit budget vaporizes the other 3 → 0.12 power/s,
~4× worse than a bolt. A level-8 "reward" worse than the free starter. FIX: let homing swarms hit
per-pellet (rely on low 0.6 power as the lever), OR distribute pellet targeting across enemies.

### F6 — pure-melee frontliner pinned at 50px, no cooldown breathing room (challenger P2-D)
The frontliner `max = min(max, skillReach)` cap overrides the on-cooldown `min+=18;max+=18` hit-and-run
breathing room (for melee-only, skillReach==meleeReach==50). Brawler hugs and eats free hits while its
special recharges. FIX: exempt the cooldown breathing-room bump from the skillReach cap, OR cap
frontliners at the real hit-cone reach (~75px) not the 50px engage reach.

## SYMMETRY / HONESTY GAP (delivery layer — my earlier report was too optimistic)

### F7 — enemy barrage delivery is a real skill for only 7/33 breeds (symmetry #1)
The barrage branch routes to shared castVolley only when `sk.shots>1`. The other 26 breeds (桃桃/露露
primary = boltArc) fall to a hardcoded 5-dart `e.dmg*0.85` fan that (a) ignores skill power and (b)
has NO single-target budget (multi-hits one cat). FIX: give the fallback fan the skill's power +
a `_volley` budget, OR route all ranged primaries through castVolley.

### F8 — spec E2 beam/chain enemy deliveries never built (symmetry #2) — LOWER priority
An enemy whose equipped skill is a beam/chain still fires the generic dart fan (element tint only, not
shape/power). Residual asymmetry. Acceptable to DEFER + log, but the spec claims it.

### F9 — enemy ult delivery is a generic radial, not the player ult's per-element shape (symmetry #3)
Mirrors cadence (charge/telegraph/fire-once/reduced) but not the ult's actual shape. DEFER + log.

### F10 — ward fallback fails OPEN for kit-less enemies (symmetry #4) — latent
`!kit || kit.canReflect` → a null-kit enemy of any role could reflect. Latent (makeEnemy always sets
kit). FIX: fail closed (`kit && kit.canReflect`).

### F11 — new runtime paths have ZERO tests (symmetry #7)
castVolley, enemyUlt charge/fire/interrupt, the E5 gap<=0 clamp, F1 crush — none tested. Add coverage.

## REFUTED (challengers confirmed these are FINE — do not touch)
- gap==0 even-level starter fights are NOT harder (clamp includes gap<=0).
- melee reach 50 does NOT cause whiffs (hit geometry still 75px; only the decision gate is 50).
- allowRoles dps/fighter does NOT break fighter identity (barrage too weak + still contact-pinned).
- multi-enemy barrage does NOT exceed intended DPS (budget holds).
- no player-favor exploit; _volley budget is sound on the castVolley path.

---
## 2026-11-22 — chase/dodge fix: challenger round 2 = SHIP

Isolated FIX vs NOMOVE (movement changes neutralized) over 139 cells: mean TTK −0.81s,
concentrated in frontliners (tank −2.2s, fighter −1.3s, assassin −0.76s), ranged flat.
Player-only (enemy never calls chaseMul / the dodge-roll block), deterministic, pack-safe
(offBand=0, no scatter/chase-stack), npm run check + all combat scripts green.
Verdict: SHIP. (Round 1 pending.)

### OPEN SEPARATE ISSUE (not the movement fix) — hex-on-焰焰 discrepancy
Owner's debug log showed `ALLY:焰焰 → hex (dark)`, but a FRESH jinwu can only learn fire+light
(verified: learnable elements = fire,light; hex NOT learnable; gatedElementEligible=false).
So either (a) the owner's 焰焰 has `hex` GRANDFATHERED from an old save (code allows old
cross-element learned IDs to persist), or (b) the debug attribution is STILL mislabeling a dark
ally's hex as 焰焰 (same class of bug as the 圆宝/elec mislabel we thought we fixed).
ACTION: after movement fix lands, (1) re-audit _dbgFiringCat/_firedBy threading for the hex/dark
case specifically, (2) consider whether grandfathered off-element skills should be shown with a
clear tag so the log isn't confusing. Ask owner which cat they actually drove if still unclear.

---
## 2026-11-22 — chase/dodge fix: challenger round 1 = SHIP-WITH-TWEAKS → all tweaks applied
R1 caught a BLOCKER R2 and I both missed: the dodge-roll guard `f._leapT <= 0` was DEAD CODE
(`undefined <= 0` is false; _leapT is undefined until a cat leaps). My diag8 "41 hits" probe was a
false positive (counted a condition missing the _leapT term). The v=0 freeze I'd dismissed as a
slowmo artifact was the REAL unfixed stall.

Applied all 6 R1 tweaks:
 F1 guard → `!(f._leapT>0)`; + NEW combat-matrix invariant drives a real dodge and asserts
    2<travel<220px (so it can never silently become dead code again).
 F2 manual double-move → `manualActive = f===me() && !autoMode` carve-out (readInput already moves
    the manual active cat; auto active cat still needs the travel like an ally).
 F3 chaseMul "decay" oversold → comment rewritten to state it stays at full bonus while the chase
    continues (intended) and only decays in-band / not-rushing / hurt.
 F4 attribution → re-measured with multi-seed isolation (neutralize movement vs fix):
    tangyuan(tank) vs senlin 6/8@15.7s → 8/8@~12s; jinwu vs senlin 7/8@8.1→8/8@7.0; doudou 8.7→7.3.
    jinwu vs xianluo flat (movement-neutral, honest). lanbao vs senlin 0/8 BOTH ways = PRE-EXISTING
    (water-tank low output vs grass kiter), NOT this fix.
 F5 dodge-into-pack/corner → auto-dodge now rolls PERPENDICULAR (sidestep toward-enemy bias), not
    straight back; scoped to FRONTLINERS only. Pack test: off-arena=0, NaN=0, scatter=111px, 3cat WIN@8s.
 F6 low-HP over-aggression → chaseMul HP gate (no buff below 30% hp).
Backliner dmg-floor regression from the sidestep (pounce/control 1682<1900) → fixed by scoping the
roll-travel to frontliners (backliners keep the in-place i-frame dodge). npm check + all 3 combat
scripts green. VERDICT: both rounds satisfied → LAND.

---
## 2026-11-22 — two more fixes landed to working tree (pending enemy-rotation challengers)

### Enemy real-skill rotation (owner: "敌人全程还是在发射 projectile，没有使用我们的技能")
skills.js enemyKitFor now returns `rotation` (≤2 authored-preferred real skills, ults excluded,
role-legal). battle.js makeEnemy stores rotation + per-slot skillCd + rotReady opener; updateEnemyAI
casts a rotation skill BY KIND (new castEnemySkill: melee=lunge+resolveHit, aoe=lob, beam=dart burst,
projectile=volley owner 'wild') before the basic-fire fallback, gated by skillEngageReach + reflect-
wall safety + 2.4s cd floor + 后遗症. Verified in sim: wild jinwu now casts highGround/emberClaw
(authored), not just barrage. Tests added: enemyKitFor rotation shape + role-legal + authored-lead
(check-cat-bond.mjs); live-fight "enemy casts a real skill within 14s" + regression-locked
(combat-matrix). Matrix + band-fitness pinned-enemy cells updated to neutralize enemy rotation +
suppress player auto-dodge (they grade PLAYER output vs a passive target; an active enemy / dodging
cat perturbed the signal — same pin discipline already used for enemy position). 2 challengers RUNNING.

### SSR HP nerf (owner: "你要把 ssr 的血量压低")
makeEnemy SSR eliteFactor 1.22→1.08 (SR/R/N unchanged). At the owner's play level (wildLevel~20) an
SSR 焰焰 drops ~1072→~949 HP (−11%); still 2× a player cat = a beefy boss, not a 超模 sponge. 3-cat
team vs wl18 SSR (843hp) = ~18s kill (challenging, not trivial). Test updated (eliteFactor 1.08).
npm check green. Orthogonal to rotation; folded into the same review window.

Open: hex-on-焰焰 attribution discrepancy (fresh jinwu is fire/light only — grandfathered save or
lingering debug-label bug) — still to chase after these land.

---
## 2026-11-22 — enemy rotation: challenger A (code) = SHIP-WITH-TWEAKS → tweaks applied; challenger B (balance) = SHIP
R1-A caught a MAJOR R1-B missed (two-round value again): the lunge rotation casts WHIFFED ~98% —
reach gate allowed casting from 175-240px but the lunge only traveled min(90,dist*0.45) and hit
within ~58px, landing ~125px short. 49/66 rotation slots are melee/dash/pounce/leap, so the feature
was mostly cosmetic for those breeds.

Applied tweaks:
 A1 (MAJOR) lunge now CLOSES to contact: travels `dist - (r+r+6)` capped at the skill's own reach
    (+20), so it reaches the target instead of stopping short. Hit-rate 2%→42% (remaining misses =
    target moved / dodged, fair). Deterministic mechanic test added: all 4 lunge kinds must connect
    from their reach gate (with inv/ward reset between kinds).
 A5 (MINOR) enemy melee kind now a FRONTAL arc (~0.74rad, mirrors player meleeStrike) not a 360°
    radius — player/enemy symmetry. dash/leap/pounce landings stay radial (player's do too).
 A3 (polish) combat-matrix rotation invariant strengthened: asserts a cast CONNECTS (deterministic
    mechanic test), not just that castEnemySkill was called — so a future whiff regression is caught.
Balance after lunges land: player 12/12 wins ON & OFF, avgMinHP 90%→87% (+3pp pressure, not a spike).
A2/A4/A6 = NON-ISSUE (no balance spike, no crash/NaN, reflect-safe). A7 (act-while-staggered) =
pre-existing (basic fire does too; hard stuns gate everything). npm check + 3 combat scripts green.
Both rounds now satisfied → enemy rotation ready to LAND.

---
## 2026-11-23 — damage coefficient 0.78→0.52: BOTH challengers = SHIP-WITH-TWEAKS (two rounds cleared)
R1 (numbers): balanced/pow cats restored to 0.89–1.01× origin, agi-dps still functional (~1.1–1.26×,
NOT the "2×" I'd claimed — comment corrected), no over-nerf, no winnable→unwinnable flip, floors honest
(pounce 700 vs real 1042). Caught 2 overstated comment numbers → both corrected + re-verified green.
R2 (feel): 0.52 precisely fixes the complaint — 焰焰 live floaters 133/169 (at 0.78) → 99/119 (at 0.52),
fire×2-vs-grass preserved; skills/basic ratios invariant; progression still rewarding (Lv14→44s,
Lv26→18.6s vs SSR); casual win 8/8; one 7/8 at deep under-level hardcore (intended 等级压制).
npm check + 3 combat scripts green, deterministic. VERDICT: damage fix LANDS.

### OPEN FOLLOW-UP (not yet actioned — owner tradeoff) — SSR BOSS DRAG
R2 flagged: SSR boss TTK is now ~27s casual / ~35s hardcore (3-cat Lv18 team) vs a 15–20s ideal —
an emergent FEEL regression from the STACK of three owner-requested changes compounding:
tempo 0.64 + SSR eliteFactor 1.08 (949 HP) + damage 0.52. 0.52 adds only ~6s; the rest is the stack.
Do NOT revert 0.52 (re-introduces the 130–170 complaint). Candidate levers (each would need its own
challenger pass): (a) trim SSR eliteFactor 1.08→~1.02 — MORE of the "压低 ssr 血量" the owner already
asked for, ~shaves the pure-HP portion; (b) nudge damage 0.52→0.55–0.58 (still under the complaint
band, shaves ~5s); (c) accept 27–35s as the new boss length. RAISE WITH OWNER — it's a tradeoff among
their own three requests, not a clear bug.

### RESOLUTION (owner 2026-11-23): accept ~30s SSR boss fights
Owner chose to ACCEPT the ~30s boss length as the deliberate tradeoff for tempo 0.64's calmer pace.
Data showed trimming SSR HP barely helps (30.2→30.7s) — the drag is the tempo, not the HP pool — so
no HP/damage change is made. Damage 0.52 + tempo 0.64 + SSR eliteFactor 1.08 all stay. Boss-drag is
CLOSED as working-as-intended, not a bug. (If the owner later wants snappier bosses, the only real
lever is a boss-local tempo exception, not HP.) Damage fix LANDS as-is.

### CLARIFIED (owner): SSR boss fights SHOULD be long by design
Owner: "SSR boss 战本来就应该长". The ~30s SSR fight is the INTENDED design, not a tolerated regression
— an SSR is a boss and a long, grindy fight is the point. Boss-drag item is fully CLOSED as
working-as-designed. No lever to pull. (Reframes the R2 "15-20s ideal" assumption as wrong for SSR.)

---
## 2026-11-23 — neutral reflect wall (炸毛墙): challenger = SHIP (1 round, UI/metadata change)
Verified: (a) build gate holds — NO non-tank can learn the wall across 46 breeds × 6 builds, revocation
on build-switch works; (b) wild non-tanks still NEVER reflect (canReflect=role==='tank', element-
independent); (c) reflected projectiles keep their REAL element (reflect paths never read the wall's
element); (d) every tank element gets a sensible wall-or-shield + attack + ult loadout; mirrorWall is
the ONLY neutral skill so the gatedElementEligible/elemAdj neutral branches touch nothing else.
npm check + all combat scripts green, deterministic. MINOR cosmetic: trainer icon ⚡→🐾 → FIXED by
adding mirrorWall:'🪞' to skillIcon.byId. VERDICT: LANDS. (Process note: working tree bundles many
features — handled by the planned squash-into-themed-commits.)
