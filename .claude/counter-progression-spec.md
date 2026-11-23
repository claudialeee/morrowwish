# Counter-progression: matchup warning UI (#1) + counter-cat floor (#2)

## Problem (owner: "玩家可能不能获得对应属性克制的猫咪来打 ssr/sr，比如露露很难打")
- Element matchup table (skills.js EFFECT): grass 克 elec, water 克 fire, fire 克 grass, elec 克 water/light,
  dark 克 light/grass, light 克 dark/fire. ×2 on-counter, ×0.5 resisted.
- Every SR/SSR HAS N/R counter cats (verified): 露露(elec SR) ← grass 豆豆(N)/奶酥(N)/布丁(R); 焰焰(SSR fire)
  ← water/light 小雾(N)/雪团(N)/蓝莓(R); etc. So the ROSTER is fine.
- GAP: encounters are region/level-gated ONLY — nothing ensures the player OWNS a counter before a gated
  SR/SSR, and there is NO signpost of what beats what. A player with no grass cat hits 露露 and walls.

## #1 — MATCHUP WARNING UI (pure UI, no balance change, no challenger needed)
In `UI.openBattleModePrompt` (ui.js:2517), right under the "Wild cat · Lv · rarity" header line, add a
one-line bilingual matchup read:
  - wild element (icon) + "克制关系" line.
  - Scan the player's selected battle team: compute `Skills.effectiveness(teamCatEl, wildEl)` for each.
    * If ANY team cat is ×2 vs the wild → green "✓ 队伍中有克制 (<catname> 克 <element>)".
    * If the wild ×2's one of your cats (you're resisted/weak) → amber "⚠ 对方克制你的 <catname>".
    * If NO team cat counters AND a counter exists in the player's COLLECTION (bench) → blue hint
      "💡 换上 <benchCat>（<element>系）可克制" (actionable — they own it, just not fielded).
    * If NO counter owned at all → neutral "尚无克制猫：<element> 系克它" (tells them what to seek).
  - Reuse `game.elemIcon`, `Skills.effectiveness`, `Skills.elementOf`. Bilingual via en flag.
  - No gameplay effect — purely informational so 逆风 matchups are VISIBLE pre-fight (addresses the
    playtest's "every danger/variety signal is invisible" headline too).

## #2 — COUNTER-CAT ACQUISITION FLOOR (encounter roll, mild — gated to avoid cheese)
Goal: a player is never HARD-walled by an SR/SSR they structurally cannot counter. Do it at the
ENCOUNTER-ROLL layer (worldmap/encounter selection), NOT by weakening the matchup:
  - When about to present an SR/SSR encounter whose element the player has NO counter for (no owned cat
    of a ×2 element) AND catchCount is past the tutorial: with high probability, REROLL this encounter
    to instead surface a capturable N/R cat of a counter element (seed the counter into the pool), OR
    down-rank the encounter to an R of the same element they CAN capture to start a collection.
  - Keep it PROBABILISTIC + capped (don't fully remove SR/SSR encounters — just guarantee the counter
    is reachable within a few encounters). Deterministic via this.rng equivalent / seeded roll.
  - Must NOT trigger in the starter region (already hand-seeded) and must NOT override a mastery/
    rematch challenge (player explicitly chose that fight).
  - This is a PACING change, not a combat-balance change, but it touches encounter selection → give it
    ONE challenger pass (does it over-hand-hold? does it starve SR/SSR variety? deterministic?).

## Build order
- #1 first (UI only, land immediately after npm check green — no challenger).
- #2 second (encounter pacing — needs a challenger pass; find the exact worldmap encounter-roll hook).

## Tests
- #1: openBattleModePrompt with (a) team has counter → green line; (b) resisted → amber; (c) counter on
  bench → blue swap hint; (d) no counter owned → neutral seek line. Assert the right branch per owned set.
- #2: a player owning no counter element, facing a gated SR of that element, within N encounters is
  offered a capturable counter; starter region + mastery unaffected; deterministic same-seed.
- i18n: no untranslated zh literal (bilingual strings both sides).

Status: SPEC. #1 implement now (UI, safe). #2 after #1 lands.
