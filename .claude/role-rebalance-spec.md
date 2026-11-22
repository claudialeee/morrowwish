# Cat Bond — Role + Stat + Skill-Gate Rebalance (design spec, owner-approved)

Status: IMPLEMENTED (local, uncommitted) 2026-11-22. `npm run check` green. Still owes a two-round
challenger review before commit (game-wide balance change). Landed in skills.js (BREED_ROLES +
roleAllowsSkill/skillCategory/isControlSkill gate in gateMet), data.js (蓝莓 agi7, 杏仁 cha8;
豆豆 reverted to assassin per owner), frostLance 1.6/cd2.2, plus regression tests in
check-cat-bond.mjs (role roster, gate block/allow, every-cat >=4 legal skills audit).
Final roles (LIVE-engine verified, corrects earlier wrong headline): tank4 / fighter6 / dps6 /
assassin5 / control5 / support7 = 33. 豆豆=assassin (owner kept, stats unchanged 7/7/6/4).
Exactly 8 cats changed role, zero collateral.
Gate enforcement note: the role×category gate is applied at AUTO-EQUIP (defaultLoadout /
recommendLoadout via roleFilterForAutoEquip) AND in gateMet; learnableSkills stays UNfiltered so
the player can still manually pick and the starter-attack guarantee holds. The auto-equip filter
self-disables if it would leave a cat with no attack (prevents attackless loadouts). Verified:
all 33 cats auto-equip 0 denied skills and 0 attackless.
frostLance 2.0/2.8 → 1.6/2.2 is NET-NEUTRAL dps (+1.8%) with +27% cast frequency = more frequent
freeze procs — a REFRAME (faster CC), not a pure nerf; i18n says "shorter cooldown". grooming area
heal unlock corrected to role:['tank','support'] (group heal; fighter denied per the gate).

## Problem this fixes (measured from current data)
Role distribution is lopsided and ignores breed identity:
- Dark element = 6/6 breeds ALL assassin (pow/agi双高 → MATRIX always picks assassin).
- Light = all dps/control/support, NO frontline.
- Water = 2 of 5 are tank (蓝莓+团团) → no water output/bruiser.
- Tanks clustered: naive橘猫→tank would put 3 tanks in Fire alone.
`buildTypeForBreed` derives role from the top-2 stats via a MATRIX, with a few authored
overrides in `BREED_ROLES`. Fixing distribution = adjust a few base stats so the natural
derivation lands right, plus a few authored overrides where identity should beat stats.

## PRINCIPLE: stats drive role; override only when identity must win
Prefer nudging `data.js` base stats so `buildTypeForBreed` NATURALLY yields the intended role
(keeps the four-stat display self-consistent with the role the player sees). Use `BREED_ROLES`
only where a breed's fantasy must override its stat spread.

## FINAL ROLE ASSIGNMENTS (owner-approved)

| Cat | Breed | Elem | Old role | NEW role | How |
|---|---|---|---|---|---|
| 汤圆 tangyuan | 橘猫 | fire | fighter* | **tank** | BREED_ROLES tangyuan:'tank' (identity: fat orange = wall) |
| 芝士 qisi | 起司橘 | fire | fighter* | **fighter** | BREED_ROLES qisi:'fighter' (keep; stocky bruiser橘) |
| 杏仁 abi | 阿比 | fire | assassin | **dps** | stat/override → agile ranged output (fire needed a dps) |
| 蓝莓 lanbao | 英短 | water | tank | **fighter** | stat tweak (see below) |
| 松松 senlin | 缅因巨猫 | grass | tank* | **fighter** | BREED_ROLES senlin:'fighter' (pow13 highest → high-atk frontline, not wall) |
| 豆豆 doudou | 狸花 | grass | assassin | **fighter** | stat tweak (hardy田园猫) |
| 幽幽 youling | 紫雾幽灵 | dark | assassin | **dps** | override (dark diversity) |
| 夜夜 mengmai | 孟买 | dark | assassin | **control** | override (dark diversity) |
| 绅绅 lixiao | 燕尾服 | dark | assassin | **fighter** | override (standing gentleman bruiser) |
| 圆宝 jiafei | 加菲 | fire | tank* | tank | unchanged (keep BREED_ROLES jiafei:'tank') |
| 团团 dundun | 银渐层 | water | tank | tank | unchanged (vit8 highest) |
| 奶酥 nietu | 奶油猫 | grass | tank | tank | unchanged (vit7 highest) |
| 墨球/斑斑/星星 | | dark | assassin | assassin | keep (真刺客) |

**Final tank roster = 4**: 圆宝(fire) 汤圆(fire) 团团(water) 奶酥(grass) — Fire 2 / Water 1 / Grass 1.
Enough, not clustered. Fire keeps an output via 杏仁→dps so it isn't all-melee.
Dark becomes: assassin×3 (墨球/斑斑/星星) + dps(幽幽) + control(夜夜) + fighter(绅绅).

## STAT TWEAKS (data.js base) — make the natural derivation land right
(Only where we want stats to drive the role instead of a hard override.)
- 蓝莓 lanbao 7/5/9/7 → **7/7/9/7** (agi 5→7). vit主+pow≥7+agi≥7+vit−pow≤2 → fighter特判 fires → fighter. English shorthair isn't sluggish; +agi is fair.
- 豆豆 doudou: **UNCHANGED, stays assassin** (owner reverted the fighter idea 2026-11-22). 7/7/6/4
  pow=agi → MATRIX assassin. 狸花 keeps its agile-striker identity.
- 杏仁 abi 7/9/6/7 → **7/9/6/8** (cha 6→8, owner: change stats not override). Rank agi>cha>pow>vit
  → MATRIX agi:{cha} = dps. One-stat nudge; Abyssinian is agile+social so +cha fits, keeps its
  agile-attacker feel. (Verified by sim: 7/9/6/8 → dps.)
- 夜夜/幽幽/绅绅: pow/agi双高 can't reach control/dps/fighter via MATRIX cleanly → authored overrides.

- 圈圈 meidu (美短, grass, 7/7/9/8) → **control** via BREED_ROLES (owner 2026-11-22). vit9 highest so
  it can't reach control via MATRIX without an ugly cha-max rewrite; authored override instead. Grass
  已有真实束缚技池给它用: 孢子涨(bind, weak ranged poke 0.95 — legal for control), 荆缠/荆棘鞭(bind melee),
  阳光烈焰(ult bind). Fixes grass having ZERO control (was 1 tank / 4 fighter / 1 support).

Net: BREED_ROLES becomes:
```
tangyuan:'tank', qisi:'fighter', senlin:'fighter', jiafei:'tank',
youling:'dps', mengmai:'control', lixiao:'fighter', meidu:'control'
```
Stat tweaks: 蓝莓→agi7 (7/7/9/7), 豆豆→8/7/7/4, 杏仁→cha8 (7/9/6/8). (松松 via BREED_ROLES, stats unchanged.)

### SKILL POWER TWEAK
- 霜锥 frostLance power **2.0 → 1.6** (skills.js). 2.0 was an outlier — far above the next-highest
  non-ult ranged (横扫喷焰 1.4). As an upgrade-of-waterLash precise freeze nuke it stays the
  strongest normal ranged (≥1.3 = "strong", still gated from control/support) but is no longer
  absurd. Re-check: the 1.3 strong/weak split is unchanged (1.6 is still ≥1.3).
Verify after: re-run the role table; confirm exactly the 11 cats above changed and NOTHING else moved.

## 6-ROLE SKILL GATE (owner: "tank no ranged / can shield+heal; fighter self-heal only")
Learnable-skill filter by role, enforced in `gateMet` (extend the existing `unlock.role` path to a
role×kind policy). Categories by skill `kind`: melee/dash/leap/pounce = CLOSE; projectile/beam/aoe
= RANGED; buff(shield) = SHIELD/BUFF; heal = HEAL (healMode: area/cleanse = GROUP, single = SELF).

Categories: CLOSE = melee/dash/leap/pounce · RANGED = projectile/beam/aoe · SHIELD/BUFF = buff ·
HEAL = heal (healMode single=SELF, area/cleanse=GROUP) · CONTROL = any skill whose appliesTag is a
hard-CC (chill/bind/dizzy) or that is tagged 'control'.

**"strong ranged" = RANGED skill with `power >= 1.3`; "weak/poke ranged" = `power < 1.3`.**
Threshold 1.3 chosen from the ACTUAL pool (13 non-ult ranged skills, simulated power distribution):
at 1.3 → 5 "strong" are gated out (水枪1.3, 雷流1.3, 咳毛球1.35, 横扫喷焰1.4, 霜锥2.0 — the real
nukes) and 8 "poke" stay learnable (hex 0.9, sporeBloom 0.95, leafDart/homingSeed 1.0, lightningOrb
1.05, waterLash/prismBeam 1.2, tidePool 0.6) — enough that control/support have a legal weak-ranged
option in most elements without opening the nuke tier. (1.4 leaks 水枪/雷流; 1.2 over-restricts.)
- Ult skills (`ultCost > 0`) are NOT gated by the role×kind policy — the role gate only filters
  normal learnable Q/E skills; signature/ult stays available.

Each role is defined by THREE axes so they read as distinct playstyles, not just different deny
lists: **engage distance** (where it fights), **durability** (can it take hits), **job** (what it
contributes besides damage). The gate enforces the identity.

| Role | Engage | Durability | Job | CAN learn | CANNOT learn |
|---|---|---|---|---|---|
| **tank** | point-blank | highest | soak hits, peel, body-block | close, shield, heal(any), control | **all ranged** |
| **fighter** | contact→short | high | self-sufficient frontline duelist | close, dash/leap/pounce, SELF-heal(single), small shield | **group-heal, ALL ranged (no poke/nuke)** |
| **dps** | mid→long | lowest | maximize damage, nothing else | RANGED incl. **strong (power≥1.3) nukes**, high-dmg close | group-heal, shield, **control** |
| **assassin** | burst-in melee + short poke | low (glass) | delete one target then reset | dash/pounce/leap, burst melee, stealth, **thrown projectiles (飞刀 short-poke)** | shield, heal(any), **beam + aoe (long-range guns)** |
| **control** | mid (kite) | medium | lock enemies down, zone, debuff | control, aoe field, debuff, **WEAK ranged only (power<1.3)** | group-heal, **strong ranged (power≥1.3)**, heavy burst close |
| **support** | backline | medium | keep the party alive & buffed | GROUP-heal(area/cleanse), shield, buff, cleanse | **strong ranged (power≥1.3)**, heavy close, hard-CC control |

Distinctness guarantees (what makes each pair NOT interchangeable):
- **tank vs fighter**: both melee, but tank gets GROUP sustain + full shield + control (a protector);
  fighter gets only SELF-heal + small shield + mobility (a selfish bruiser). Tank peels for others,
  fighter fends for itself.
- **dps vs control**: both can be ranged, but dps gets the STRONG nukes and NO control; control gets
  only WEAK poke ranged and OWNS hard-CC. One deletes HP, the other denies actions — neither does both.
- **assassin vs fighter**: both melee, but assassin is glass + stealth + no sustain/shield (all-in
  burst); fighter has sustain + durability (stays in). Assassin trades safety for a kill, fighter grinds.
- **control vs support**: both backline-ish utility, but control = offensive lockdown (hard-CC, debuff,
  zones) and support = defensive enabling (group-heal, shield, buff, cleanse). No overlap: support has
  NO hard-CC, control has NO group-heal.
- **dps vs assassin**: both pure damage, but dps is ranged/sustained from safety, assassin is melee/
  burst at high risk. The deny lists are near-mirror (dps: no control/heal/shield; assassin: no ranged/
  heal/shield) so they can't collapse into one "just do damage" blob.

Notes:
- CONTROL skills are also denied to dps (done). Hard-CC is the EXCLUSIVE identity tool of the control
  role (+ tank, which gets control for peel but no ranged to apply it from afar).
- "SELF vs GROUP heal" via `healMode`: single = fighter/tank/support OK; area/cleanse = tank/support
  only (fighter denied — sustain is personal).
- `grooming` (area heal) role → ['tank','support'] (was ['tank','fighter']).
- Enforce as a DENY list in gateMet (role×category, plus the power<1.3 sub-rule for ranged on
  control/support). element/level/quest/cost gates stay; this is ADDITIONAL.
- `recommendLoadout`/`ensureLoadout` must respect it so auto-equip never suggests a denied skill.
  Verify each of the 33 breeds still fills a legal 4-slot loadout in its element — any (element,role)
  with <4 legal skills is a CONTENT gap to FLAG, not ship broken.

## RISKS / must-verify before ship (feed to challenger)
1. Does any role end up UNABLE to fill 4 loadout slots in its element after the deny gate?
   (e.g. a tank whose element has only ranged attack skills → no legal Q). Enumerate per (element,role).
2. Fighter "self-heal only" must not leave fighters with zero heal if their element's only heal is area.
3. Stat tweaks must change EXACTLY the intended cats' roles — diff the full role table before/after.
4. Dark overrides (3 roles from 6 all-assassin breeds) — confirm dark skill pool actually has
   control + ranged + bruiser skills so the new roles can equip on-theme, else it's cosmetic.
5. buildTypeForBreed is also used by skill `unlock.role` gates elsewhere — changing a cat's role
   may lock/unlock OTHER skills for it. Check no cat loses an already-learned/equipped skill
   (ensureLoadout repairs slots without deleting history — confirm).

## Implementation order
1. Wait for band-builder subagent (touches battle.js kitRangeBand/recommend area).
2. data.js stat tweaks (蓝莓 agi7, 豆豆 8/7/7/4) + BREED_ROLES additions.
3. gateMet role×kind deny policy + recommendLoadout/ensureLoadout respect it.
4. Re-run role table (verify exactly 11 changed); per-(element,role) legal-loadout audit.
5. Update any test that pins old roles; `npm run check` green.
6. Two-round challenger review (balance + content-gap). THEN land locally, no push without owner.
