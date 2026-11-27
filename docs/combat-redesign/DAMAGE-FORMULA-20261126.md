# Damage formula cleanup — multi-agent research 2026-11-26

Owner directive: "我觉得有一些应该加算 但通用乘区应该被 apply" —
some reactions additive, universal multipliers always apply.

## Round 1: 3 independent agents

### Agent A — combat-designer (reaction formula)
```
raw        = f.dmg × skill.power
identity   = outgoingBuffMult × _dmgOutMult
universal  = elemMult × levelSup × (vulnerableT?1.3:1)
earned     = ΠcritComboMult        // consumes:true combos only
bucket     = clamp(0.25, 1 + Σearned, 2.0)
finisher   = 1 + executeBonus
final      = raw × identity × universal × earned × bucket × finisher
final     ≤ 2.5 × raw × identity × universal   // hard ceiling
```
Split on `consumes`: non-consuming → additive, consuming → multiplicative.
`_dmgOutMult` at identity layer (per-cat trait).

### Agent B — RPG-math (PoE/GW2 bucket model)
```
final = base
      × elemMult                                    // C
      × levelSup                                    // C
      × (1 + Σreaction_adds)         // B cap +0.80
      × ΠconsumingComboMult          // C once-per-tag
      × vulnerableFlat (1.3 stagger) // C
      × duoDamageMult                // C
```
B bucket: vuln + execute + close + comboStreak + `consumes:false` combos.
C layer: elemMult, levelSup, `consumes:true` combos (shatter/explode/chainAll/steam),
stagger flat 1.3, duo.
**Trap**: atomic migration required — moving elem out of applyHitEffects while leaving
combo additive causes spike.

### Agent C — MH/FF style (legibility rating)
Current formula = **4/10 legibility**. Problems:
1. elemMult folded into reaction bucket → 2× matchup reads as "bigger combo"
2. Stagger feeds vulnBonus AND vulnerableFlat (two vuln channels, one visual)
3. execute + close + comboStreak cohabit hurtBucket, no on-screen tell per source

Recommended:
```
final = rawDmg
      × elementMatchup             // 0.5-2.0 always
      × (1 + reactionBucket)       // cap +0.50 (bloom/steam/basic/burn-fire)
      × comboCritMultiplier        // 1.4-1.5 chainAll/explode/shatter
      × shieldMul                  // 0 / 0.55 / 1
      × vulnerableFlat             // 1.3 or 1
      × levelSuppression           // 0.5-1.2
      × (1 + hurtBucket)           // cap +0.80 stagger+rust+execute+close+streak
```
Top-2 TTK-neutral edits: (1) extract elem from applyHitEffects, (2) collapse
vulnerableFlat into hurtBucket as +0.30.

## Consensus (all 3 agree)

- **elemMult MUST be universal multiplicative** (currently folded into additive)
- **COMBO table split by `consumes`**:
  - `consumes:false` (bloom/steam) → additive bucket
  - `consumes:true` (chainAll/explode/shatter) → multiplicative crit
- `_dmgOutMult` + `outgoingBuffMult` at attacker identity layer (×)
- `levelSuppression` + `executeBonus` + `vulnerableT 1.3` all universal ×
- Both buckets must have CAPS — Agent A +1.0, Agent B +0.80, Agent C +0.50/+0.80

## Divergence

| axis | A | B | C |
|---|---|---|---|
| soft-react cap | +1.0 | +0.80 | **+0.50** |
| hurt bucket cap | — merged | +0.80 | **+0.80** |
| vulnerableFlat | separate × | separate × | merged into hurtBucket +0.30 |
| global ceiling | 2.5× | none | none |
| steam home | mult (consumes:true) | mult | additive negative |

## Recommended merged plan (pending owner approval)

```
final = f.dmg × skill.power × outgoingBuffMult × _dmgOutMult     // 攻击端
      × elemMult                                                  // 0.5-2.0 always
      × levelSuppression                                          // always
      × (1 + ΣsoftBucket)       cap +0.50                         // bloom + steam(neg) + burn|fire
      × ΠcritComboMult                                            // 1.4-1.5 consumes:true
      × shieldMul                                                 // 0 / 0.55 / 0.85
      × vulnerableFlat 1.3                                        // kept separate (readability)
      × (1 + ΣhurtBucket)       cap +0.80                         // stagger+rust+execute+close+streak
```

### Open questions for round 2
- Does basic-tag-tension survive? (owner said "完全删" but test regression —
  needs guard: Q/E hit poise test depends on something in that branch)
- Should trait flags that haven't landed (`_dmgOutMult`) wire BEFORE or AFTER this refactor?
- Cap values — pick A +0.50 / B +0.80 / Agent-A merged (+1.0 via `clamp(0.25, 1+Σ, 2.0)`)?

---

## Round 2 — adversarial / TTK / legibility

### Agent D — adversarial break
3 failure modes identified in the merged Round-1 plan:
- **FAIL-1**: 4 independent caps don't talk. Worst stack `identity 1.5 × elem 2 × levelSup 1.2 × soft 1.5 × crit 1.5 × vuln 1.3 × hurt 1.8 = 18.9× raw` — exceeds "no-one-shot" line by ~30%.
- **FAIL-2**: `steam 0.6 × shield 0.55 × resist 0.5 = 0.165×` (-3 on a 20 basic). Three popups, no attribution.
- **REGRESSION**: `consumes:true` steam/douse (`bonusMult<1`) flipped multiplicative → double-penalty vs counter-element (soak+fire on fire-weak grass: old 1.6× → new 1.2× = -25%).

6 amendments proposed:
1. Post-identity ceiling `clamp(soft × crit × vuln × hurt) ≤ 3.5`
2. Keep steam/douse (bonusMult<1) in additive softBucket regardless of consumes
3. Merge vulnerableFlat 1.3 into hurtBucket as +0.30 (dedup)
4. Floor total output at 0.25 × identity × elem
5. Fold `basicTagMul` into softBucket (owner said 完全删 — skipped)
6. Cap `critComboMult` at one factor per hit (checkCombo already returns first match)

**Implementation status** (as of commit `2ea89182`):
- #1 implemented (3.5× earned ceiling in hurtEnemy)
- #2 implemented (`comboIsCrit` requires `bonusMult >= 1`)
- #3 implemented (vulnerableT merged into vulnBonus +0.30, bucket cap 0.50 → 0.80)
- #4 implemented (softMul `Math.max(0.25, ...)` floor preserved)
- #5 deferred per owner ("完全删" — no fold, drop)
- #6 preserved (Skills.checkCombo returns first match already)

### Agent E — numerical TTK sim
Hand-math vs current, 3 scenarios, Lv50 fire cat on Lv53 target:

| Case | Current | Proposed | Δ% |
|---|---|---|---|
| A — clean hit 90% HP | 197.91 | 197.91 | **0%** |
| B — burn-primed bloom, 55% HP | 247.4 | 247.4 | **0%** |
| C — oil-primed explode + stagger + close + <28%HP | 513 | 555 | **+8.2%** |

Worst-case Case C (hurtBucket maxed at +0.80): ~+11.4%. All within ±15% tolerance.

### Agent F — legibility audit
Current formula 4/10. Per-multiplier cues:

| multiplier | has cue? | file:line |
|---|---|---|
| `outgoingBuffMult × _dmgOutMult` | **NO** | missing |
| `elemMult` | yes | battle.js:6180-6188 (↑↓ + label) |
| `levelSuppression` | **NO** | silent at battle.js:6347 |
| `softBucket` | partial | ring+✦ (now combo.name, 066b0f82) |
| `critComboMult` | partial | ring+✦ + shatter crit flash |
| `shieldMul` | yes | resolveHit BLOCK handling |
| `vulnerableFlat 1.3` | indirect | stagger VFX, no +30% label |
| `hurtBucket` | **NO** per source | now EXECUTE/CLOSING shipped (066b0f82) |

**Top-2 pre-formula legibility** (both shipped `066b0f82`):
1. Float `combo.name` instead of generic ✦ — 36 authored reaction names were dead text
2. "处决!" + "收网!" one-shot banners for executeBonus + closeBonus

## Status — all 3 formula commits landed

- Commit 1 `066b0f82` (pushed): legibility — combo.name + EXECUTE/CLOSING
- Commit 2 `e1e15c08` (local): elemMult out of additive; consumes split; soft cap +0.50
- Commit 3 `2ea89182` (local): vuln merge; cap 0.80; earned ceiling 3.5×
- Starter Q P1 shipped `7334a8cd`: power 0.8 → 1.35 (was weaker than basic)

Deferred (clean no-op refactor, owner-approved to postpone):
- Identity merge: fold `outgoingBuffMult + _dmgOutMult` to a single call site
- Round 3 legibility: `outgoingBuffMult`, `levelSuppression`, `vulnerableFlat` cues

---

## Correction 2026-11-26 (supervisor-driven)

Supervisor subagent `a0dd905584c1106a4` reviewed the 8 session commits and
caught two LIES in the prior status table:

- **Amendment #1 "Post-identity ceiling 3.5×"**: was marked "implemented" in
  `2ea89182`, but actual code only compared `sumBonus ≤ 3.5` which maxes at 2.80.
  Dead-code. Rewritten in commit `8988d30b` to stash
  `_earnedReactStack = softMul × critComboMult` in applyHitEffects, read it in
  hurtEnemy, cap `earnedReact × sumBonus ≤ 3.5`. Now actually clips.

- **starter Q 0.8→1.35** `7334a8cd` edit touched only the attack object literal;
  `castOffensiveSkill`'s ternary `(sk ? sk.power : 0.8)` fallback at battle.js:2651
  was unchanged. Dead-code. Rewritten in `8988d30b` to change the ternary to 1.35.

## Final shipped commits (correct SHAs)

| step | SHA | status |
|---|---|---|
| 1. Legibility (combo.name + EXECUTE/CLOSING) | `066b0f82` | pushed to origin |
| 2. Formula refactor commit 1 (elemMult out, consumes split) | `e1e15c08` | local |
| 3. Formula refactor commit 2 (vuln-merge, bucket cap 0.80) | `2ea89182` | local |
| 4. basic-tag tension delete | `18847a72` | local |
| 5. starter Q real pow fix (supervisor-corrected) | `8988d30b` | local |
| 6. earned-bucket ceiling real fix (supervisor-corrected) | `8988d30b` | local |
| 7. basic-time-scalar (playtest P0 auto-fix) | `314b449d` | local |
