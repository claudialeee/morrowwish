# Ally squad coordination — design spec (owner: "应该是所有的 AI 协同逻辑")

## Problem (from owner's real log)
A 3-cat auto squad fights as 3 INDEPENDENT bots:
- 露露(elec), 蓝莓(water), 幽幽(dark) each picked a DIFFERENT enemy (露露/杏仁/枫枫) — damage sprayed, nothing dies fast.
- The water cat (蓝莓) never soaked the target the elec cat was hitting → the "soak→conductive +20% elec"
  combo (battle.js:5006, a real mechanic) essentially NEVER fires in practice.
- No peel, no focus, no reaction setup. The squad has no idea its members exist.

## Current state (battle.js)
- `commandedTarget(x,y)`: if player set `commandTarget` (manual focus) → that enemy; ELSE each ally
  independently `nearestEnemy()` + `unwardedTarget()` (ward avoidance only).
- `smartAutoAction` / `updateAllyAI`: per-cat BT (dodge→heal→shield→ult→Q→E→basic). No team context.
- Existing team-aware bits: separation (don't stack), ward-switch, duo-combo ult (cat-relationships).

## Design — a lightweight TEAM BLACKBOARD + coordinated target/skill selection
One shared per-frame "team intent" object the squad reads, so cats act as a unit without a heavyweight
planner. MOBA-grounded: focus-fire, enabler-setup, peel, assist. Keep it cheap + deterministic.

### 1. Team blackboard (computed once per frame in update(), before per-cat AI)
```
this._team = {
  focus: <enemy>,         // the squad's shared kill target (see pickTeamFocus)
  wet: Set<enemy.i>,      // enemies currently soaked (for elec setup reads)
  threatenedAlly: <cat>,  // the ally in the most danger (lowest HP under incoming fire) — for peel/heal
};
```
`pickTeamFocus()` — choose ONE enemy the squad collapses, by a small utility score:
  score = (1 - hp/maxhp)*0.4        // finish the wounded (MOBA: secure the kill)
        + isLowestMaxHp*0.2          // squishiest first
        + proximityToSquadCentroid*0.2  // reachable, not the far kiter
        + (!warded)*0.2              // not behind a reflect/barrier (feeding a ward is wasted)
  Manual `commandTarget` ALWAYS overrides (player intent wins). Sticky: keep the current focus unless
  a clearly-better target appears (hysteresis, so focus doesn't ping-pong). Falls back to nearest if
  the scored set is empty (everyone warded).

### 2. Coordinated TARGET selection (replaces per-cat nearest)
In `commandedTarget` / the ally target pick: default to `this._team.focus` instead of each cat's own
nearest. EXCEPTIONS (a cat deviates from focus when its ROLE says so):
  - ENABLER (water with a soak skill up): if the focus is NOT wet AND an elec ally is targeting it,
    the water cat targets the FOCUS to soak it first (sets up the +20% conductive) — the owner's
    exact missing behavior. Once wet, water rejoins normal focus.
  - SUPPORT (heal): if `threatenedAlly` exists and heal is ready, peel to heal/shield it (already
    partly in smartAutoAction's hp<62% gate — extend to heal the WORST ally, not just self).
  - ASSASSIN: may ignore focus to dive a low-HP backliner (pick-off), MOBA assassin fantasy.
  - A cat still won't feed a reflect wall (unwardedTarget stays as the final filter).

### 3. Element-reaction SETUP — S2 is GENERAL (owner: "s2应该是general 反应"), not a soak hack
Drive it entirely off the EXISTING `COMBO` table in skills.js (~30 reactions: soak|elec 导电, oil|fire
爆燃, burn|grass 野火, chill|fire 冰火, shock|water 过载, bleed|dark 嗜血, dizzy|light 制裁, expose|dark
致命弱点, bind|elec 缚身过载, … — 11 setup tags × multiple detonator elements). Expose a helper
`Skills.reactionCatalog()` → { byDetonator: {elec:[{setupTag:'soak',mult:1.5},…], …}, bySetupTag: {…} }
so battle.js can query both directions without hardcoding.

Two SOFT preference nudges in the skill-pick (`smartAutoAction` offensive ordering), both keyed on the
SHARED team focus so coordination + reactions reinforce each other:
  (A) SETTER: if the focus does NOT yet carry a tag, and SOME ally's element on this focus would
      DETONATE a tag THIS cat can apply (its skill/basic `appliesTag` ∈ someone's detonator set),
      prefer the skill that applies that setup tag. (Generalises the owner's water→soak-for-elec: a
      water cat soaks the focus because an elec ally will cash it in — but ALSO oil-cat sets up a fire
      ally, a dark cat exposes for a light ally, etc.)
  (B) DETONATOR: if the focus ALREADY carries a tag that THIS cat's element detonates (COMBO hit),
      prefer the skill that cashes it in NOW (before it's consumed/expires).
Both are PREFERENCE re-orderings of the existing offensive BT, never a hard override — a cat in danger
still dodges/heals first. "setter" only fires when there's a real ally detonator for the tag on the
field (don't soak if nobody can cash it). Table-driven: new COMBO entries auto-participate, zero extra
wiring. Deterministic (reads tags + team elements + this.rng only).

### 4. Role synergy (small, additive)
  - TANK: if `threatenedAlly` is a backliner being dived, the tank bodies-up / peels toward the diver
    (position nudge toward the enemy attacking the squishiest ally).
  - CONTROL: prefer CC on the enemy currently bursting an ally (the focus or the diver), not a random.
  - DPS: just focus + output (already its job) — but now on the SHARED focus.

## Implementation order (each its own reviewable step; combat = 2 challenger rounds before landing)
- **S1 Blackboard + pickTeamFocus + coordinated target** (focus-fire). Biggest single win; test: squad
  concentrates damage (measure # distinct enemies hit in first 5s drops; first kill comes sooner).
- **S2 Reaction setup (water→soak the elec focus)** — fixes the owner's soak complaint; test: focus gets
  soaked before/while elec hits it, conductive +20% actually procs (assert a soaked-focus elec hit).
- **S3 Peel + support-worst-ally + control-on-threat** — role synergy; test: support heals the worst
  ally not itself; tank repositions toward a diver.

## Guardrails
- Deterministic: all reads off existing state + this.rng(); no Date.now/Math.random in the hot path.
- Cheap: blackboard computed ONCE/frame, O(enemies×allies) tiny.
- Must NOT regress solo play (1-cat squad: blackboard focus == its own nearest, zero behavior change).
- Must NOT break the combat-matrix (single-cat pinned-enemy cells unaffected — they have 1 ally).
- Enemy pack coordination (updateEnemyAI) already exists; this is the PLAYER-side mirror.
- npm check + 3 combat scripts green; local commit only, no push.

## Tests to add
- Blackboard focus is stable (no ping-pong) + overridden by manual commandTarget.
- 3-cat squad: distinct-enemies-hit in first 5s is LOWER with coordination than without (focus-fire).
- Water+elec squad: the focus enemy becomes soaked and an elec hit on it shows the +20% conductive
  (diff dmg vs an un-soaked control) — directly locks the owner's reported gap.
- Solo squad unchanged (regression guard).

Status: SPEC. Implement S1 first after the damage-fix challengers clear, to avoid 3 combat changes
colliding in one tree. Each step gets its own two challenger rounds.

---
## Baseline evidence (measured 2026-11-23, before implementation)
Forced 3-cat squad (xianluo elec / lanbao water / youling dark, lv12) vs a forced 3-pack, seed 7,
autoMode, at the CURRENT tree (damage 0.52 + tempo 0.64):
  distinctEnemiesHit(first 6s) = **3/3** (damage fully sprayed across all enemies)
  firstKill = **9.0s**  •  pack NOT cleared in 25s (ALIVE), 1 ally already dead.
This is the no-focus-fire failure the owner reported — the squad fights as 3 independent bots and
collapses nothing. S1 (focus-fire) target: distinctEnemiesHit drops toward 1, firstKill well under 9s,
pack clears. Implement S1 AFTER the damage-fix (0.52) challengers clear, to avoid two combat changes
under review in one tree simultaneously.
