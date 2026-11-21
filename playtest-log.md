
## Playtest 2026-11-20 (6 personas x8 battles, 47 critiques)

**Headline:** Cat Bond's combat is a visually lavish firehose with no stakes and no closer — every persona can win at full HP by holding one button, because the enemy AI gets sloppier against dominators, the capture 'finish' is a cosmetic toast, and the entire skill/dodge/shield kit is optional decoration.

- **[P0] Give combat a threat floor that bites passivity instead of rewarding it**
  - problem: The single most-cited defect across button-masher, cautious-kiter, panicky and auto personas (fun 2-5/10): there is no unavoidable pressure anywhere. A stationary masher gets shot LESS accurately because aiJitter scales UP as the profiled skill scalar drops (battle.js:60), and leadAngle (~2015) adds flat ±0.18rad slop with zero velocity term, so standing still is the safest play. A kiter is uncatchable because enemy base speed (92+rIdx*22, line 432) is below cat speed (150+agi*3.5, line 458) and there is no contact/body damage at all. The adaptive layer detects a stomp (p.skill→1.0, line 1047) and responds by making bullets land worse. avgDmgTaken 0 / HP 1.0 is the designed output, not a fluke.
  - change: In js/battle.js: (1) in leadAngle (~2015) replace flat `ang += (rand)*aiJitter` with jitter scaled by the TARGET's normalized speed — `const mv=clamp(hypot(me._vx,me._vy)/(me.speed||150),0,1); ang += (rand)*aiJitter*(0.25+0.75*mv)` so a stationary cat gets shot near dead-on while jukers keep their payoff; (2) add enemy contact 'swipe' damage in the update loop mirroring the player pounce block — e.dmg on a ~0.8s per-enemy cd when a live enemy sits within (e.r+f.r+8)px, routed through resolveHit so dodge i-frames/shields fully negate it; (3) flip the adaptive contract in commitAiProfile (~1036): track a per-battle dmgTaken accumulator and a persisted stompStreak that ramps enemy lethality/pace (lower aiJitter floor, shorten specialCd, raise fireRate, cap ~5) when won && dmgTaken===0, reset on any damage.
- **[P1] Add terminal acceleration: real execute phase + combo-as-closer + honest capture gate**
  - problem: Fights have no closer, so decided fights grind and low-patience personas bounce (impatient flees at exactly 18.0s x3; masher sees a 40s tail; panicky stalls into timeouts). comboMult() is a diminishing sqrt capped ~1.7x (line 1448), hurtEnemy (2217) has no low-HP bonus so the last 15% whittles as slowly as the first, and captureReady (<28% HP, line 1802) is a cosmetic lie — its only effects are a gold bar and a toast (line 2250), with zero math change. The UI screams 'Almost tamed / FINISH IT' and then delivers the same grind — a taunt to a frustrated player.
  - change: In js/battle.js hurtEnemy (~2226, before `e.hp=max(0,...)`): add a low-HP execute multiplier — when e.hp/e.maxhp<0.28 scale damage ~1.5x ramping toward ~2.5x under 0.12 so the bar visibly crashes; steepen comboMult() (1448) coefficient 0.1→~0.14 and widen the comboT decay window (1.3s, line 1451/1658) so a brawler can hold the chain. Promote captureReady into a one-time juice beat (slowmo/flash reusing the dodge/ult pattern + '收服它！' banner) the first frame an enemy crosses the threshold, and suppress/halve the enemy barrier during execute so it can't stonewall the kill.
- **[P1] Put basic attack and skills in tension so depth becomes load-bearing, not optional**
  - problem: Basic is a complete self-sufficient win condition that bypasses the entire designed depth (flagged by masher P1 and explorer P1). fireBasic (874) fires at 0.6s cadence with full f.dmg, full element/STAB/bond via resolveHit, but passes NO appliesTag — so ~80% of damage comes from a button that touches 0% of the combo table (skills.js COMBO soak|elec x3, oil|fire), status tags, chains or bond unlocks. Skills are a museum exhibit; the explorer who 'pokes every button wanting the game to answer back' gets no reactive payoff, and the masher can't even accidentally seed a combo token.
  - change: In js/battle.js fireBasic/applyHitEffects (~874/2140): give basic a damage amplifier scaled by the number of active status tags on the target (+40-60% per tag from skills.js TAG_INFO) while still applying no tags itself, and modestly nerf basic vs UN-marked enemies (base ~0.6-0.7x f.dmg or raise moves[0].cd 0.6→~0.85). In js/skills.js bump priming-tag TTLs (or trim Q/E cd ~1s) so the COMBO table's second skill lands inside the window. Reframes the loop: press Q/E to apply burn/soak/shock → basics roar on the marked target → detonate.
- **[P2] Fix feedback on the beats that matter: kill finisher, ult-ready edge, shield absorb, and the ult audio bug**
  - problem: The juice budget lands on the wrong moments. The kill branch (2250) is the quietest event in the game — alive=false + 12 particles + a toast — while a perfect dodge gets slowmo+flash and the ult gets shake+flash; the payoff curve is inverted. gainUlt (1442) has no <100→100 rising-edge detection, so the instant the ult charges is silent and 0 ults fire across 8 battles. The barrier branch (2304) is a silent dmg*=0.55 with no ring/floater. And battle.js:1371 calls audio.effect('ultimate'), which has no mapping key so it falls through to the quiet 'tap' blip — a confirmed bug that degrades the ult to a UI-click sound.
  - change: In public/studio-audio.js add a dedicated heavy 'ultimate' mapping (one-line confirmed-bug fix). In js/battle.js: add a finisher to the kill branch (2250) — hitstop ~0.15, brief slowmo, gold flash, combo-scaled shakeT, a big scaled ring and an oversized '-N / 收服!' floater, reusing the ult pattern; add rising-edge detection in gainUlt (1442) firing a one-shot center-screen '必杀就绪 / ULTIMATE READY' banner + sting + button pulse (first fill per battle only); and give the barrier branch (2304) parity — a shield-colored ring + '吸收 N' floater, and route the absorbed chunk into gainUlt so shielding becomes a tempo tool.
- **[P2] Surface the escalation toolkit the game already built but refuses to point at dominators**
  - problem: Identical runs with zero replay stakes (explorer, kiter, auto, masher). The adaptive AI only perturbs aim/timing; the one real ramp, `challenge` (makeEnemy ~417), is keyed to catchCount not performance, caps at 1.8 (~+21% dmg) and plateaus once the dex fills, so fight 1 == fight 8. buildPack (393) almost always spawns a solo enemy against a 3-cat team — a permanent 3-on-1. gradeBattle already computes seconds/combo but recordBattleMastery persists only a grade LETTER and returns null once a breed is S-badged, so an 11.6s surgical clear is invisible and the mastery loop goes inert after one run.
  - change: In js/battle.js: rebind `challenge` from catchCount to a monotonic battles-cleared counter (add State.S.battlesWon), raise/remove the 1.8 cap, and scale enemy dmg/fireRate/specialCd per tier so the curve keeps climbing; surface the tier in the hint string (~1821). Scale buildPack size toward team parity (2-3 wild cats vs a 3-cat squad) with focus-fire in updateEnemyAI so single-target sustain gets taxed. In js/game.js recordBattleMastery (~179): persist S.bestTimes[wild.id]=min(existing,seconds) ABOVE the S-badge early-return, and surface 'Best: 24.3s — NEW RECORD' on the win card with an S+ tier (seconds<=timeLimit*0.35) + a same-breed instant rematch button.
- **[P2] Make existing assist systems discoverable and auto-battle worth watching**
  - problem: Half the asks are already-shipped features nobody found. Auto mode (#btn-auto) sits inert beside the flee button and never reacts when a panicky player is drowning; it's also a one-way ratchet (toggleAuto persists autoBattle=true, line 48/71) with no reward for graduating off. Desktop basic has zero aim assist while touch/AI auto-lock (804-807), so the Tab-lock reticle is cosmetic on keyboard and the panicky cohort's 1788 clicks land ~0 kills. The auto-AI (smartAutoAction ~639) kites and conserves, so the lazy watcher never sees Q/E/ult fire, and skill casts emit zero telemetry so 'q=0 e=0 ult=0' is partly a measurement artifact.
  - change: In js/battle.js: add a 'drowning' detector that pulses #btn-auto + a bilingual toast when a cat faints or team HP<0.30, and stop toggleAuto persisting auto across battles (per-fight opt-in). Add a desktop fire-time aim-snap in readInput (~808): snap this.aim to lockedEnemy/nearestEnemy when the cursor is within a ~15-20deg cone, and bump basic life from 0.45 so assisted shots reach. Retune smartAutoAction for ability expression (fire ult the instant meter hits 100, proactively cast E on a cadence) and add arcadeMetric('bond_skill_cast',{slot,auto}) in skillQ/skillE and the generic-ult branch (~1409) per the CLAUDE.md allowlist/dashboard rule.
- **[P3] Resurface dodge/shield with an exclusive job so the defensive kit stops being dead weight**
  - problem: The explorer and kiter both optimize dodge/shield out because they have no mandatory moment. Shield (55% reduction, ~4.8s, auto-cast) does dodge's job with zero timing skill, so dodge:0 / shield:2.25. The 'dodge NOW' button pulse (_coachHighlight='mv-dodge', line 124) fires exactly once in a player's lifetime (fight-1 tutorial) and is dead code for all 8 of this player's battles. Nova downgrades to a walkable barrage past range 180, so nothing in the enemy kit is dodge-exclusive, and the coach never teaches the E/shield slot at all.
  - change: In js/battle.js: (1) resurface the pulse for ALL players — set this._threatHighlight='mv-dodge' whenever liveEnemies().some(e=>e.telegraph>0) and render the same control pulse at the danger beat, not just fight 1; (2) give dodge an exclusive niche — in the nova branch (~2045)/shield check (2304) make the telegraphed nova pierce or only lightly reduced by shield (~20% vs 55%) so i-frame dodge is the one reliable counter to the big tell; (3) add the missing E/shield step to initCoach (~124) and don't let autoMode silently skip the whole coach.

## Playtest 2026-11-21 (6 personas x8, 50 critiques, post-stakes-merge)

**Headline:** Cat Bond's combat is a well-built kit strangled by a single truth the telemetry screams from every persona — basic attack alone wins, nothing escalates within a fight, and there's no forcing function — so the depth, the dodge/ult verbs, and even dead role/chain code all go untouched.

- **[P0] Add a time-keyed in-fight ferocity/stalemate clock in updateEnemyAI (decouple pressure from enemy HP)**
  - The single biggest structural hole, confirmed in code: enemy pressure is driven ONLY by e.aggro = 1 - hp/maxhp (battle.js:1975), so every escalation lever (want standoff :2010, fire cadence :2072, special cadence, phase gate :1978) is a function of damage the PLAYER deals. finish() fires only on win (:1937) or team wipe (:2501) — there is NO battle clock, enrage, or flee timer anywhere. Result: the masher gets zero within-fight escalation (8 flawless stomps, the cross-battle _stomp ramp is cosmetic at ~+10% dmg), the cautious kiter parks beyond the dist<340 fire gate and reaches a dead full-HP equilibrium the AI steers toward, the auto-battler has no failure mode, and the impatient player's slog never resolves or threatens. Passivity and facetanking are both strictly-safe dominant strategies.
  - FIX: js/battle.js updateEnemyAI: add a ferocity clock independent of e.aggro. Track battle elapsed + a _lastDmgTradedAt stamp (reset in hurtEnemy/resolveHit on any hit landed/taken). (1) IN-FIGHT ESCALATION: if squad HP fraction stays above ~0.95 after ~6-8s, raise the _novaLock cap (:1777) so 2 enemies can telegraph at once, cut specialCd floor (:2054) and telegraph windup ~30%, and taper manualEase (:2071) from 1.25 toward 1.0 — the wild cat visibly 'grows desperate' this fight. (2) STALEMATE/FLEE: after a generous grace (~12-14s) of zero damage traded, close the orbit (want = clamp(200 - aggro*80 - idle*90, 70, 230)), lift the dist<340 fire gate via a growing huntRange, and fill a visible escape meter near drawPackMorale; at 100% call finish(false) as a distinct 'escaped' result so refusing to engage loses the catch. Poking resets the clock, so active play is never punished.
- **[P0] Convert the ×0.7 unmarked-basic tax into a stacking stale-move falloff + lower the phase gate to rIdx>=1**
  - Basic attack is a complete, self-sufficient win condition and the whole kit is inert decoration — the dominant complaint across masher AND explorer. applyHitEffects (:2236) already admits the prior 'basic was self-sufficient' playtest and responded with a flat ×0.7 unmarked / +45% per-tag payoff nerf. That changed nothing strategically: holding attack still wins 100%, it just made the decided fight slower (thumb-cramp tedium). Meanwhile mid-fight variety is gated out of the fights people actually play: the phase/tactics beat is hard-gated to rIdx>=2 (:1978), so common N/R wilds are phase 0 for their whole life, and with Q/E on 4.5-5.5s cooldowns a sub-10s fight never lets the explorer cycle a kit or set up a prime->finish. The skilled systems exist but are structurally unreachable.
  - FIX: js/battle.js applyHitEffects (:2233-2237): replace the flat ×0.7 with a stacking stale-move falloff — track consecutive unmarked basics on a target (×0.9, ×0.8, ×0.65, floor ~×0.5), resetting to full only when a fresh Q/E tag lands (keep the +45%/tag bonus as the hard reset upward). Holding attack visibly stalls out mid-fight, stumbling the masher into needing Q/E to keep killing — a soft DPS wall, not a death punish (fits the bored, not angry, persona). Pair: lower the phase gate at :1978 to also grant rIdx 0-1 a phase-1 'changes tactics' beat at ~hpFrac<.45 reusing the elite shield/reposition path, and bump the N/R HP floor at :419 so median early fights land ~16-20s — long enough to express the kit.
- **[P1] Promote the dead 'role' field + wire the unused CHAIN state machine so enemies and skills stop being clones**
  - Verified dead code on both sides. makeEnemy (:437) stamps every enemy elite/ambusher/sharpshooter/skirmisher, but grep proves only 'ambusher' is ever read (:2060) — sharpshooter and skirmisher are inert labels, so the game LOOKS like it has archetypes and actually runs one brain (orbit, sidestep, distance-picked telegraph). On the player side, skills.js:318-354 ships a complete RISKY COMBO-CHAIN state machine (chainState/advanceChain/chainMultiplier/backfireDamage/finisherUltRefund) that is exported and documented as the 'signature mechanic' but never imported by battle.js. The explorer who 'hunts for hidden depth' correctly concludes there is none to find: packs read identical fight-to-fight and the deepest designed system is rotting in the data file.
  - FIX: js/battle.js: (1) make role drive distinct behavior in updateEnemyAI — sharpshooter holds long range (want ~300) with slow hard-hitting led shots, skirmisher strafes short (want ~110) with rapid weak fire and dash repositions, ambusher commits its pounce gap-close; gate the special-kind selection (:2049-2060) on e.role, not distance alone. (2) Wire the chain state machine: buffer Q->E(->ult) casts inside the existing comboT window into Skills.chainState()/advanceChain, multiply each link by chainMultiplier in castOffensiveSkill, apply chainVulnerability during windup, trigger backfireDamage on interrupt, and grant finisherUltRefund on a completed finisher. (3) Surface the COMBO recipe table (skills.js:281) as a small discoverable HUD codex near the combo badge so explorers can find soak+elec ×3.
- **[P1] Make dodge the uniquely-correct answer: one fast telegraphed strike only i-frames beat, fix the nova trigger gate, add the missing dodge audio**
  - A whole perfect-dodge subsystem exists (i-frames, bullet-time, +18 ult, +3 combo at :1366) and goes 0/8 for every persona because nothing in the game can ONLY be answered by an i-frame. Enemy shots are slow 200-300px/s projectiles you stroll around with WASD; the one telegraphed heavy (nova) is gated at :2049 behind aggro>0.4 (i.e. enemy below ~60% HP) so against a facetanker it fires after the fight is already won, and even then it's a radial burst you walk out of. manualEase=1.25 (:2071) hands manual pilots 25% MORE space. And dodge() (:1355) fires zero audio — the slow-mo lands silently — unlike paw/beam/ultimate elsewhere. So a core movement verb with a full reward system attached is dead weight.
  - FIX: js/battle.js: (1) add ONE fast telegraphed 'lunge/slam' kind in the special-selection block (~:2049) with a short ~0.5s windup that fires a ~700px/s line hit for ~18-25% of a fresh cat's maxhp — fast enough that strafing can't clear it so the 0.5s dodge i-frame is the only out; keep it readable via _novaLock. (2) Fix the existing nova: accumulate e.campT while a cat sits within ~130px and allow the heavy regardless of aggro/HP once camped ~2.5s, so a healthy enemy punishes a stationary masher. (3) Drop manualEase toward ~1.05 on the special path and lift special pow so ignoring a wind-up actually stings. (4) Add window.MorrowwishAudio?.effect?.('dodge') on every dodge and a bright cue on the perfect branch (:1366).
- **[P1] Fix the floater size clamp bug and make per-hit/ult feedback outcome-scaled (crunch audio, crescendo, distinct ult/combo floaters)**
  - Mostly cheap, high-value feel wins, including a confirmed bug. battle.js:1556 hard-clamps floater size to Math.min(13, size||12), so the combo-crescendo tiers (number pops sized 18/15/13 'for crescendo feel') all collapse to 13 — the masher at combo 30 sees the identical number as at combo 1; the promised crescendo literally never renders. There is also no per-hit connect audio (only a throttled 'paw' swing sound), and the ult's screen-wide damage emits the same generic white -N floater and a fixed 3s cinematic whether it deleted the pack or chip-tickled one enemy at 96% HP — so the explorer 'can't tell if it did anything' and the panicky/impatient 0-ult problem persists.
  - FIX: js/battle.js: (1) raise the floater clamp at :1556 (e.g. cap ~22) so the existing crescendo tiers and any crit pop can render. (2) In hurtEnemy direct-hit branch, fire a connect sound via MorrowwishAudio.effect() pitched/brightened by this.combo, throttled ~60-80ms. (3) Decouple the JUICE ceiling from the capped comboMult — keep shake heat ramping past combo 20 with milestone punches at 25/40/60; leave comboMult() untouched. (4) In fireUltimatePayload tally total dealt + KO count and emit ONE bold element-colored 'skill.name -TOTAL / 收服 ×N' banner, scale shakeT/flash and cinematic length by consequence (short ~1.2s on overkill, extend to a kill-cam on the deciding blow). (5) Persistent re-arming ult-ready prompt anchored on the active cat + navigator.vibrate on the rising edge + a ~6s auto-cast failsafe so the 0-ults cohort at minimum SEES the payoff.
- **[P2] Re-gate stompStreak to dominance and ship the endless/trial wave mode as the persistent-score vehicle**
  - The anti-stomp difficulty escalator is unreachable by the exact players it targets. commitAiProfile (:1074) increments stompStreak ONLY on a win with dmgTaken<=0 (a flawless zero-damage win) and resets on any chip damage, capped at 5. The auto-battler finishing at ~0.81 HP and the comfortable masher taking trace damage never arm it, so enemy difficulty stays pinned to the static captures baseline — the one escalation engine the code already has sits switched off for ~90% of winning sessions. Separately, mastery has no persistent scoreboard: comboBest/perfectDodges are computed per battle, feed a one-time C/B/A/S grade, then discarded, and S-rank writes a permanent per-breed flag so the ceiling is a finite 25-item punch card with no reason to return for a 9th fight.
  - FIX: js/battle.js commitAiProfile (:1074): replace the binary flawless gate with a graded dominance score using the hpFrac already computed (:1069) — increment when won && hpFrac>=~0.6 && 0 faints, reset only on a close win/loss — and raise/remove the cap of 5 and the /5 normalizer (:63) so repeat dominators keep stiffening enemy dmg/speed/fireRate; surface it as a small '凶猛 Lv.N' HUD chip + battle-start toast so the wall is visible. Then ship the scoped-but-pending endless trial (tasks #31/#32): loop CaptureBattle with a run-local wave counter fed straight into the existing challenge scalar (:434) via + (trialWave*0.15), persist State.S.trialBest = {wave, score:comboBest*(1+perfectDodges)} summed across waves, and surface it on the homepage card + unified dashboard with bond_trial_wave_cleared / bond_trial_run_end telemetry events.
- **[P2] Add bounded desktop basic-attack aim-assist by wiring the already-built target lock**
  - A fairness asymmetry aimed squarely at the panicky persona, the studio's highest-churn segment. Touch players get auto-aim to the locked/nearest enemy (:811-812) and enemies fire with predictive lead (leadAngle ~:2105), but the desktop WASD+mouse player — the one who literally says 瞄不准 — gets a raw cursor vector with zero magnetism in fireBasic (:895). Since the entire offensive economy (combo, execute ramp, ult charge) is gated behind landing hits, a low-accuracy player can neither hit nor out-sustain, produces ~1800 whiffed basics at winRate 0, and the game's only offered 'fix' is auto-mode, which deletes the game. The full soft-lock system (lockedEnemy/cycleTarget/Tab, ~:1889-1916) already exists and already scores by cursor alignment — it's just unplugged for the desktop basic attack.
  - FIX: js/battle.js: in the desktop aim branch and fireBasic (:895), compute bounded aim-magnetism — take lockedEnemy()||targetEnemy() and if it falls within a small cone (~18-22deg) of the raw cursor, bend the fired angle toward a leadAngle(f, enemy, projSpeed) solution (reuse the enemy lead math so the player gets the courtesy the AI already gets). Decay snap strength to zero off-cone and with range so precise players are untouched. Surface strength via a battlePrefs.aimAssist scalar defaulted on for low measured aiProfile.skill, taught through the existing coach/toast path — NOT a buried options checkbox.

## Design research (MOBA/auto-chess/indie) — 2026-11-21
Key insight: Cat Bond is DATA-RICH but UNDER-DISPATCHED — combo effects (explode/chainAll/shatter/bloom/blind), risky combo-chain (skills.js CHAIN helpers), 21 duo arts, awaken branches, joy/hunger are all authored but unused by battle.js. Cheapest high-impact path = wire existing data into live battle.

Top 10 to do next (ranked cheap×impact×on-theme):
1. C1 Dispatch authored combo effects (explode/chainAll/shatter/bloom/blind) — battle.js applyHitEffects. SMALL.
2. K4-1 Status-gated capture (weaken-then-throw yarn) — the missing combat↔collection fusion. MED.
3. J5-2 Persistent status-tag icons on enemies (prereq for combo play). SMALL.
4. C3 Wire the risky combo-chain (pre-built in skills.js, unused). MED.
5. B2-1 Squad traits/synergies from element/rarity/fluffy (auto-battler depth, no art). MED.
6. R3-1 Post-fight boon choices (Hades-style run arc). MED.
7. C2 Enemy poise/stagger bar + window [DONE 2026-11-21]. 
8. J5-4+B2-4 Enemy-element preview + coverage hints. SMALL.
9. K4-4 Bonding (joy/hunger) feeds battle readiness. SMALL.
10. R3-3 Elite/boss nodes with affixes (reuse role:'elite'+phase). MED.

## Novel playstyles invented 2026-11-21 (think-don't-mash)
1. 元素场地 Terraformer [SHIPPED 527033a] — lob skills leave lingering elemental FIELDS that drip tags; detonate with a reacting element (soak+elec=overload) for AOE. Spatial setup→payoff.
2. 赌徒 Gambler (NEXT, CHEAP) — risk combo-chain A→B→C: each link bigger but disables dodge + raises incoming dmg; interrupted → backfire self-damage. **Already fully coded in skills.js (CHAIN/chainMultiplier/chainVulnerability/backfireDamage/advanceChain) — just needs wiring into battle.js state machine.** Highest engagement-per-effort.
3. 驯服师 Tamer — invert win cond: overkill = worse capture. Hold damage, stack status, time the capture at a sweet spot. Rewards restraint/reading, not DPS. (pairs with status-gated capture K4-1.)
4. 炼金 Chemist — same tag, multiple detonation reactions chosen per situation: soak+fire=steam(defensive cleanse), soak+elec=overload(offense), soak+dark=corrode. A choice every combo.
5. 操偶师 Puppeteer — use knockback + lob fields + CC to SHOVE enemies onto your own hazards/fields. Position the enemy, not yourself. (compounds with Terraformer fields + knockback already shipped.)

## Adversarial playtest — 2026-11-21 (cycle, task whiggsr32; 6 personas × 8 battles, 53 critiques)
Headline: "Combat is a consequence-free stomp: defenses fire automatically, the stakes
system only arms once you're already winning flawlessly, and the skill-gate that should
teach depth is invisible — every persona wins without learning the kit; the bored churn."
NOTE: sim ran on current code incl. the new 对波 clash / must-dodge heavy / cast-interrupt
/ level-gap. Findings are owner-review only (no auto-apply per cron policy).

Adversary-confirmed pain points + ranked fixes:
- **[P1] Held BASIC attacks double as a free bullet-cancel wall.** tickProjectileClash
  doesn't exclude isBasic shots, so a masher's auto-aimed claw spam deletes incoming
  enemy fire → avgDmgTaken 0 across 8 fights. The signature 对波 "wave clash" became an
  invisible god-mode. FIX: in tickProjectileClash skip any pair where either shot is
  basic (`a.skill?.isBasic||b.skill?.isBasic`) — clash only skill-shot vs skill-shot.
- **[P1] The stakes gate is a tautology.** `_pressure` escalation only accrues at
  teamHpFrac>0.92, i.e. only once you're already cruising flawlessly, so it can never
  *create* the first risk. FIX: start accruing at a lower threshold (~0.80) or after N
  seconds of the player taking zero hits, so smash / 2nd-telegraph introduce risk BEFORE
  full-HP cruise.
- **[P1] No exit state for a pure masher → infinite non-result.** Basics are floored at
  12% HP (can't finish) AND there's no battle clock, so a never-skill fight is both
  unwinnable and unlosable; harness only ended it at the 42s cap. FIX: add a stall
  resolver — if pack HP barely drops over ~14s while the player fires only basics (not
  coach/auto), ramp lethality + finish(false) with a one-time teaching toast
  ("用 Q/E 打出虚弱才能收服！").
- **[P1] Required engagement floor is "tap one extra button."** The mash-wall lifts the
  instant target.tags.length!==0, and one Q applies a tag — so a single poke clears the
  only hard gate (explains the "9–21 Q, probably accidental"). E/ult/dodge/combos/matchup
  have NO floor-level forcing function; optional depth = invisible depth. FIX: add
  front-loaded same-move fatigue (consecutive identical-move hits ramp DOWN) so rotating
  verbs out-DPSes spamming one, instead of only gating the last 12%.

Net: the clash-excludes-basic fix (P1 #1) is the cheapest highest-impact — it alone should
pull avgDmgTaken off zero and restore stakes. Pairs naturally with the loosened _pressure
gate. Deferred to owner review; not applied this cycle.

## Adversarial playtest — 2026-11-21 (cycle, task w2m7021gq; 6 personas × 8 battles, 51 critiques)
Headline: "Combat has no clock and no unconditional threat: every forcing function is gated
behind the player already winning, so mashers/kiters face a punching bag that never resolves;
panicky players hit an unexplained wall with no mercy valve." (ran on current rebased code.)

Adversary-confirmed P1s (converge across 3 masher critiques):
- **The must-dodge heavy never fires in common fights.** It's gated on `e.rIdx>=1` (SR/SSR
  only) AND `dominating` (_stomp>=0.4 = two flawless wins, OR _pressure>=0.6). So on N/R packs
  — what a masher grinds — the one unavoidable threat never spawns. FIX: drop the rIdx gate
  (gate on catchCount so beginners are still spared); lower _pressure trigger ~0.6→~0.35 and
  raise accrual dt*0.25→~0.45 so a cruising player meets a "leave the circle" test within ~1s.
- **No battle clock → masher soft-lock.** Basics are floored at 12% HP (can't finish) and
  nothing ends the fight, so the enemy sits at ~12% forever; worse, within-fight escalation
  keeps ramping, so mashing LONGER = stronger enemy ("did nothing different, got worse"). FIX:
  stall detector — if only-basics while an enemy is pinned near the floor for ~5-6s, pulse the
  Q/E/R buttons with "用技能破防!/Use a SKILL to break its guard!" and SUSPEND the rubber-band
  while stalled; add a hard time cap (~2x gradeTimeLimit) → defined finish() + tip, not a hang.
- **Four of five verbs are dead.** poise floor is cleared by ONE incidental Q tap; E/ult/dodge
  have no floor-level requirement; poise regens 12%/s so there's no cadence pressure. The verbs
  aren't underpowered, they're unrequired.
Also noted (panicky): the wall arrives with no mercy valve / explanation.

Owner-review log per cron policy. NOTE: acting on the P1 ungate + stall-teach this session
under the standing "keep improving combat" directive (committed locally, not pushed).

## 羁绊/合体技 rework — design spec (2026-11-21, research agent)
Vision: the 合体技 is the earned apex of a fight with real stakes — the ONLY screen-freeze.
Keep TWO distinct axes: 亲密 (cat↔player, ±15% affMult + bondBonuses) vs 羁绊 (cat↔cat,
duoRelations value → gates/powers the duo combo). Don't unify values; unify only the tier
vocabulary + stop the UI conflating them.
Ranked build (all cheap, reuse existing primitives — fields/giantSlam/duoCinematic/reinforcement):
 1. Add a `reaction` column to DUO_ARTS (21 pairs) → castDuo dispatches a DISTINCT verb per
    element pair (reuse single-cat COMBO effect vocab: explode/chainAll/shatter/bloom/blind/
    freeze/steam). Makes fire+water ≠ fire+elec. Shared with the "dispatch authored combo
    effects" item already #1 in prior research.
 2. Duo-charge rework: passive 3.2→~1.8/s; +18-25 when a combo fires with both pair cats alive;
    + on perfect dodge. Playing WELL charges the super — ties duo meter to the skill expression
    the playtests say is ignored. Masher charges slowly = stakes gradient.
 3. Battle-driven CatRelations.grow() hooks (sync hits / combo / reinforcement-save / shared win),
    so 羁绊 is a record of fighting together (Trails Link-Level / FE support model), not only 撸猫.
 4. NAMED_DUOS: ~5 Chrono-Trigger flagship techs for specific breed pairs, gated 羁绊≥90, override
    the generic element art (e.g. 赤焰流星 jinwu+xingchen, 月海潮音 yuelian+lanbao, 雷鸣樱吹雪
    xianluo+yinghua, 森罗万象 senlin+nuowei, 幽光回廊 youling+moqiu). Pure data, zero engine cost.
 5. 羁绊-100 "Triple Tech": summonReinforcement fires INSIDE the cinematic, the reserve cat's
    element escalates the reaction (water+elec + fire bench → chainAll→explode). Outcome-scaled
    cinematic length/shake. MED.
Hooks: cat-relationships.js (NAMED_DUOS + reaction column + active() tier-4 + grow calls),
battle.js (duoCharge fill, castDuo reaction dispatch, reinforcement escalation), skills.js (reuse
COMBO vocab; shared applyReaction dispatcher). Queued as a worktree — auto-starts after the
skill-rework worktree merges (shares battle.js/skills.js).
