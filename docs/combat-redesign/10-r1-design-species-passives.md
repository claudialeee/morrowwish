# R1 Task D — 33 Species Passives (V4 proposal archive + implementation plan)

**Status (2026-11-25):** This doc archives the full owner-authored V4 proposal
for 33 per-species passive traits, plus a thin implementation plan. Design
only — no game code touched. Replaces the earlier "Task D" placeholder.

**Supersedes:** earlier scattered mentions of "signature skills" across audits.
The V4 line is: **every cat has ONE passive, not an exclusive active skill.**
Current code has only 1 真 species-exclusive skill (`moonfang`, locked to 3
light/dark cats); the 8-entry `SIGNATURE_SKILL` table in `skills.js` is just
"which ult the cat prefers to slot" — it aliases to element ult, not species-
unique mechanic. This doc is the bridge from that status to V4's full vision.

---

## 1. Core design tenets (V4, verbatim intent)

1. **One passive per cat** — not an exclusive active skill, not a stat bump.
2. **Changes decision-making**, not raw numbers (no flat +10% atk).
3. **No new buttons / no new resource bars** on the HUD.
4. **Visible VFX feedback** with 3 phases: 准备 (building) → 触发 (firing) → 消散 (ending).
5. **形态觉醒 (form awakening) alters the passive**, not replaces species.
6. **Rare cats do not strictly dominate** commons — mechanical identity > rarity.

Deeper principle: *"玩家捕获新的猫咪，是因为它能够带来一种新的玩法，而不是因为它拥有更高的稀有度和数值。"*

---

## 2. Full 33-cat passive table

Element × role × passive. Owner-call versions.

### 2.1 Tank (4)

| # | 猫 | zh / id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 1 | 汤圆 | `tangyuan` | 火 | **炎怒反击** | Store fraction of incoming damage; next HEAVY melee releases it |
| 2 | 奶酥 | `nietu` | 草 | **扎根** | Standing still → ramp DR + interrupt resist; moving dissipates it |
| 3 | 团团 | `dundun` | 水 | **碎霜反击** | Shield broken by hit → ~90u radius ice burst, 1.2s freeze, 8s ICD |
| 4 | 圆宝 | `jiafei` | 火 | **同甘共苦** | Absorb fraction of nearby ally damage (redirect) |

### 2.2 Fighter (7)

| # | 猫 | id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 5 | 芝士 | `qisi` | 火 | **越战越勇** | Consecutive melee hits ramp dmg; stale if out of combat too long |
| 6 | 焰焰 | `jinwu` | 火 | **燃尽** | Heavy attacks consume target `burn` → instant burst (DoT → nova) |
| 7 | 蓝莓 | `lanbao` | 水 | **冰川破击** | Light hits stack 寒气; heavy hit detonates stacks |
| 8 | 松松 | `senlin` | 草 | **巨兽之躯** | Giant form — heavy attacks hit harder, more poise, slower animation |
| 9 | 枫枫 | `nuowei` | 草 | **领地意识** | Within self-defined territory → persistent buff; leave zone → fades |
| 10 | 绅绅 | `lixiao` | 暗 | **决斗节奏** | Skill chain within timing window → next hit boosted (rhythm) |
| 11 | 花花 | `sanhua` | 光 | **流光连舞** | Alternate DIFFERENT actives → combo bonus; repeat same → nothing |

### 2.3 DPS / Ranged (6)

| # | 猫 | id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 12 | 杏仁 | `abi` | 火 | **疾风燃势** | Walk N units → next ranged shot charged |
| 13 | 小雾 | `xiaohui` | 水 | **水流共鸣** | Hitting `soak`-tagged enemy → secondary water hit spawns |
| 14 | 露露 | `xianluo` | 电 | **声波共振** | Same-target consecutive hits build resonance → boost |
| 15 | 桃桃 | `wumao` | 电 | **静电蓄能** | Stand still → charge; next shot consumes charge for burst |
| 16 | 幽幽 | `youling` | 暗 | **暗影回响** | Attacks leave delayed shadow echo that repeats part of hit |
| 17 | 月月 | `yuelian` | 光 | **月华焦距** | Ranged at OPTIMAL distance band → bonus (not just "further = better") |

### 2.4 Assassin (5)

| # | 猫 | id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 18 | 豆豆 | `doudou` | 草 | **林间伏击** | Attacks from behind target → bonus damage |
| 19 | 墨球 | `moqiu` | 暗 | **暗夜潜伏** | Break line-of-sight → ambush-primed state → next hit charged |
| 20 | 奥利奥 | `niuniu` | 电 | **雷影追击** | After dash → leave electric echo that repeats the next attack |
| 21 | 斑斑 | `baomao` | 暗 | **狩猎本能** | Mark prey, kill marked → movement bonus (chain between targets) |
| 22 | 星星 | `xingchen` | 暗 | **星界裂隙** | Walking leaves starfield rift; attacking through rift → extra window |

### 2.5 Controller (5)

| # | 猫 | id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 23 | 奶糖 | `fanmao` | 水 | **潮汐牵引** | Water fields apply secondary pull on enemies inside |
| 24 | 圈圈 | `meidu` | 草 | **藤蔓漩涡** | Grass fields pull enemies toward preset control point |
| 25 | 跳跳 | `duanduan` | 电 | **电荷轨迹** | Walking leaves short electric trail; enemies crossing → chip + jolt |
| 26 | 夜夜 | `mengmai` | 暗 | **寂静压制** | Target firing consecutive attacks → inflict suppression (atk-speed down) |
| 27 | 樱桃 | `yinghua` | 光 | **落樱余韵** | Self-field expiring → trigger extra ping (sets up next cycle) |

### 2.6 Support (6)

| # | 猫 | id | Element | Passive | Mechanic |
|---|---|---|---|---|---|
| 28 | 雪袜 | `xuewa` | 水 | **踏浪之路** | Movement leaves short support trail; allies crossing → light aid |
| 29 | 布丁 | `zherdd` | 草 | **安宁之庭** | Standing still → ramp regen aura for nearby allies |
| 30 | **金豆** | `jinjc` | **电** ⚠️ | **电力共享** | Accumulate charge → share with ally (boost their next action). HARD ICD. |
| 31 | 雪团 | `nainai` | 光 | **净化庇护** | After cleansing an ally → that ally gets brief extra protection |
| 32 | 云朵 | `yunduo` | 光 | **羁绊丝线** | Bind-link ally; portion of heal flows through link |
| 33 | 绒绒 | `bosi` | 光 | **柔光护甲** | Overheal → convert to temporary armor |

### Element × role reconciled count (V4-adjusted)

| Element | Count | Tank | Fighter | DPS | Assassin | Control | Support |
|---|---|---|---|---|---|---|---|
| 火 fire | 5 | 2 (汤圆 圆宝) | 2 (芝士 焰焰) | 1 (杏仁) | 0 | 0 | 0 |
| 水 water | 5 | 1 (团团) | 1 (蓝莓) | 1 (小雾) | 0 | 1 (奶糖) | 1 (雪袜) |
| 草 grass | 6 | 1 (奶酥) | 2 (松松 枫枫) | 0 | 1 (豆豆) | 1 (圈圈) | 1 (布丁) |
| 电 elec | 5 | 0 | 0 | 2 (露露 桃桃) | 1 (奥利奥) | 1 (跳跳) | 1 (金豆⚠️) |
| 暗 dark | 6 | 0 | 1 (绅绅) | 1 (幽幽) | 3 (墨球 斑斑 星星) | 1 (夜夜) | 0 |
| 光 light | 6 | 0 | 1 (花花) | 1 (月月) | 0 | 1 (樱桃) | 3 (雪团 云朵 绒绒) |

⚠️ **金豆 is RE-ELEMENTED**: V4 proposes **光 → 电** so the electric lineup has
a support. Current `skills.js:184` has `jinjc: 'light'`. Implementation gate.

---

## 3. Delta vs current code

### 3.1 Gap table

| Component | Current state | V4 target |
|---|---|---|
| Species-exclusive passive | **0** | 33 |
| `SIGNATURE_SKILL` table (ult alias) | 8 entries, aliases to element ults | Kept; doesn't replace passive |
| True unlock.species skills | 1 (`moonfang`) | kept, doesn't scale |
| `cat.trait` field | does not exist | per-cat passive ID |
| `TRAIT_BY_SPECIES` table | does not exist | 33 entries |
| Event bus | combat events exist but are per-call | formal registry + ICDs + recursion guards |
| Form awakening | evolution replaces species | **NEVER replace species; swap `formId` instead** |
| 金豆 (jinjc) element | `light` | **`elec`** |

### 3.2 Element distribution if 金豆 migrates light → elec

| Before → After | Impact |
|---|---|
| light: 7 → 6 | Still fine; light keeps 2 ults |
| elec: 4 → 5 | Normalizes elec |
| Save migration | `jinjc` saves retain `species: 'jinjc'` but `elementOf('jinjc')` returns `'elec'`. If any save has `jinjc` with a light-only skill in loadout, `ensureLoadout` must repair |

---

## 4. Horizontal de-duplication map (V4's own list of risky collisions)

Passive pairs that look similar on paper and MUST feel different in-sim:

| Pair | Difference V4 locks in |
|---|---|
| 汤圆 vs 团团 | Store-then-release (OFFENSIVE reaction) vs shield-break burst (DEFENSIVE) |
| 奶酥 vs 布丁 | Standing → self DR vs standing → ally regen |
| 奶酥 vs 枫枫 | Still → DR anywhere vs in-territory → combat buff |
| 杏仁 vs 桃桃 | Move → charge vs stand → charge |
| 芝士 vs 露露 | Consecutive melee hits vs consecutive same-target hits |
| 绅绅 vs 花花 | Timing window chain vs different-skill alternation |
| 焰焰 vs 蓝莓 | Consume burn → nova vs stack 寒气 → heavy detonate |
| 豆豆 vs 墨球 | Backstab angle vs break-LoS reset |
| 奥利奥 vs 幽幽 | Dash leaves echo vs attack leaves echo |
| 跳跳 vs 星星 | Trail CC vs trail attack-window |
| 奶糖 vs 圈圈 | Water field pull-steady vs grass field pull-to-point |
| 雪袜 vs 跳跳 | Trail HELPS allies vs trail HURTS enemies |
| 圆宝 vs 云朵 | Transfer DAMAGE vs transfer HEALING |
| 雪团 vs 绒绒 | Cleanse → protect vs overheal → armor |

**Implementation test (must assert before shipping):** if a de-dup pair reads
the same in `check-cat-bond-combat-matrix` or combat sim, redo one of them.
Specifically risky trios per V4: 奶糖 vs 圈圈, 跳跳 vs 星星, 芝士 vs 露露.

---

## 5. Implementation architecture (V4 recommended)

### 5.1 Data shape

```js
// cat instance — never replaces speciesId on evolution
{
  speciesId: 'tangyuan',      // permanent identity
  name: '汤圆',                // owner-renameable
  formId: 'base',              // 'base' | 'yanjia' | 'rongyan' etc
  level, experience, affinity,
  learnedSkillIds: [...],
  unlockedFormIds: ['base'],
  loadouts: { base: [...], yanjia: [...] },  // per-form separate loadouts
}
```

### 5.2 Trait registry

Separate file: **new** `public/cat-bond/js/traits.js` (loaded after `skills.js`,
before `battle.js`).

```js
window.CatTraits = {
  TRAIT_BY_SPECIES: {
    tangyuan: 'yanNuFanJi',
    dundun:   'suiShuangFanJi',
    // ... 33 entries
  },
  TRAITS: {
    yanNuFanJi: {
      id: 'yanNuFanJi',
      speciesId: 'tangyuan',
      subscribedEvents: ['onDamageTaken', 'onHeavyMeleeHit'],
      internalCooldown: 0,      // no ICD; consumption-based
      maxStacks: 5,
      triggerCondition: (ctx) => ...,
      effect: (ctx) => ...,
      allowedForms: ['base', 'yanjia'],  // disabled on 熔岩战将 form if desired
      vfxId: 'tangyuan-ember-charge',
    },
    // ... 33 entries
  },
};
```

### 5.3 Event bus to subscribe

| Event | Which trait uses |
|---|---|
| `onMove` | 杏仁 `abi`, 跳跳 `duanduan`, 雪袜 `xuewa`, 星星 `xingchen` |
| `onStationary` | 奶酥 `nietu`, 桃桃 `wumao`, 布丁 `zherdd` |
| `onSkillCast` | 绅绅 `lixiao`, 花花 `sanhua` |
| `onHitResolved` | 芝士 `qisi`, 露露 `xianluo`, 小雾 `xiaohui`, 月月 `yuelian` |
| `onDamageTaken` | 汤圆 `tangyuan` |
| `onBeforeDamage` | 圆宝 `jiafei` (preempt; redirect to self) |
| `onShieldBreak` | 团团 `dundun` |
| `onStatusApplied` | 蓝莓 `lanbao`, 焰焰 `jinwu` |
| `onTargetKilled` | 斑斑 `baomao` |
| `onDetectionLost` | 墨球 `moqiu` |
| `onDashCompleted` | 奥利奥 `niuniu` |
| `onFieldTick` | 奶糖 `fanmao`, 圈圈 `meidu`, 枫枫 `nuowei` |
| `onFieldExpired` | 樱桃 `yinghua` |
| `onCleanse` | 雪团 `nainai` |
| `onHealResolved` | 云朵 `yunduo`, 绒绒 `bosi` |
| `onResourceGained` | 金豆 `jinjc` |

### 5.4 MANDATORY recursion / exploit guards (V4's own list)

| Guard | Prevents |
|---|---|
| 幽幽 echo doesn't trigger another echo | infinite re-ping |
| 奥利奥 dash-echo doesn't spawn dash-echo | infinite re-ping |
| 云朵 transferred heal doesn't re-trigger heal | infinite heal loop |
| 圆宝 doesn't redirect to another 圆宝 | circular damage sharing |
| 绒绒 overheal→armor doesn't count the armor as "heal" | infinite armor |
| 金豆 can't share charge with another 金豆 | charge cycle |
| Multi-hit skill fires passive ONCE per cast | not per-tick |
| 团团 can't farm freeze by spamming self-generated mini-shields | cheese |

Enforce via: `_traitFiredThisCast`, `_traitICDs`, `_isDerived` flag on damage,
distinct `onHeal` vs `onHealDerived` dispatch.

### 5.5 VFX phases

Every trait MUST have 3 identifiable stages:
- 准备 — building (e.g. lava patterns growing on 汤圆's fur)
- 触发 — firing (e.g. ice burst from 团团's broken shield)
- 消散 — ending (e.g. overheal armor dissolving on 绒绒)

**Visual priority ceiling (V4):**
```
Duo-arts > single-cat ult > heavy skill > normal skill > TRAIT > basic/status
```
Traits must NOT drown out heavies or ults.

---

## 6. Phased rollout (V4 priorities)

### P0 — Trait infrastructure (0 cats, foundation)
- `traits.js` new file: empty registry + event bus + ICD + recursion guards
- `battle.js` emit the 17 event types at known sites
- Debug logger: `[trait] <cat>.<trait> fired (cast=N, since prev=Xs)`
- Save: `cat.formId = 'base'` default; `loadouts` becomes object keyed by form
- **Zero gameplay change yet**

### P1 — First 12 reference cats (one per archetype)
Owner list verbatim:
1. 汤圆 承伤反击
2. 团团 碎盾冰冻
3. 蓝莓 寒气引爆
4. 松松 巨型战斗形态
5. 杏仁 移动蓄能
6. 桃桃 静止蓄能
7. 墨球 脱离感知伏击
8. 奥利奥 突进残影
9. 圈圈 位置控制
10. 跳跳 移动电荷路径
11. 云朵 治疗传递
12. 绒绒 溢出治疗护甲

These cover all 17 event types + the recursion/exploit patterns.

### P2 — Remaining 21 cats
Fill the matrix. Each one is a small PR.

### P3 — Form awakening for first 7 species
V4 list: 汤圆 / 蓝莓 / 松松 / 圈圈 / 露露 / 墨球 / 云朵 (2 forms each).
**Critical architecture:** `cat.formId` swaps, `cat.speciesId` stays.

### P4 — Full acceptance
- Each cat's unique mechanic verified by a sim
- No infinite loops
- Save-compat (old cat.learned[] preserved)
- Auto-AI uses trait correctly
- Mobile perf OK with 3 cats all firing passives

---

## 7. Divergences from V4 I'd push back on

| # | V4 says | My concern | Recommended |
|---|---|---|---|
| 1 | 金豆 light → elec migration | Breaks save: an existing `jinjc` cat has light-element skills in `learned[]` | ADD elec as `secondary`, keep primary as light, OR mark as a one-time save migration with `_elementMigratedAt` stamp |
| 2 | 33 passives as P1 batch | Owner's own P1 list is only 12 — but V4 §15 says "33 passives" as the end-state. P1 of 12 is right; the 33 target is P2. | Keep V4's own phasing |
| 3 | `formId` + per-form loadouts | Current saves have ONE loadout; migration must preserve current loadout as `loadouts.base` | Add `_loadoutsMigratedAt` stamp; migration runs ONCE on load |
| 4 | Visual priority: "TRAIT > basic" | Every trait firing adds VFX; 3 cats × N passives/battle = noise | Per-trait VFX budget cap (e.g. max 2 trait VFX overlapping) |
| 5 | 17 event types | Some are redundant (`onHealResolved` vs `onHealDerived` suggested) | Audit for single source of truth per event |

---

## 8. Owner-review gate questions

1. ~~**金豆 element change (light → elec)**~~ — **DECIDED: migrate now (owner call 2026-11-25).** `skills.js:184` SPECIES_ELEMENT[jinjc] changes `'light'` → `'elec'`. `ensureLoadout(cat)` runs ONCE per save on load to repair any loadout entry that was a light-only skill for a jinjc cat: strip it, re-fill from the new elec default pool. Old `cat.learned[]` entries stay (cosmetic inventory bloat only — not equippable post-migration). Stamp `State.S._jinjcMigratedAt = Date.now()` so the repair runs at most once. Element-light trainer-locked skills (`moonlitHalo`, `moonfang` under `unlock.species` lists that include yuelian/xingchen/yinghua) are unaffected: jinjc wasn't in those species lists.
2. **P1 batch of 12 cats** — is V4's list final, or swap any?
3. **Form awakening architecture** — `speciesId` permanent is a rule I treat as non-negotiable; confirm?
4. **`traits.js` as a new file** — OK or should it live inside `skills.js`?
5. **Per-form loadouts** — does the base form keep the ability to switch between forms mid-run, or is form a permanent choice per save?

---

## 9. What this doc is NOT

- NOT an implementation. Zero game code touched.
- NOT final — Round 2 adversarial review will attack it; Round 3 revises.
- NOT the trigger-condition numbers. All thresholds (ICD, radius, dmg %)
  need in-sim tuning before shipping. V4 §12 explicitly says: "具体数值、
  触发条件及部分机制细节仍需要在开发和实机测试中收敛。"

**Next in the design doc chain:** `11-r1-design-evolution.md` (formId
architecture per V4 §9.1 — "speciesId never replaced").
