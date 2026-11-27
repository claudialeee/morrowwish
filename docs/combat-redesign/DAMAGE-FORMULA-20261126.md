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
