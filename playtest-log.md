
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

## Combat IDENTITY spec — "You don't kill. You CATCH." (2026-11-21 research)
North-star: you're a cat — TOY with prey until it submits, then CATCH it into your bond
(makes 纽带/bond load-bearing; reframes DPS from goal → a resource you spend carefully).
Research lesson: theme-defining combat = the core VERB is the fantasy + the WIN rewards it
(Splatoon turf-not-kills, Katamari roll-to-build, Kirby inhale-not-hit, UGG mischief, StS
readable intent, real cat butt-wiggle/bat-prey/slow-blink). Today the theme is painted on —
the win is still a generic KO (finish(true) on pack HP=0; captureReady is cosmetic).
Ranked build (identity × cheapness):
 ① CATCH-not-KO core (MED, identity-defining): below ~20% HP enemy enters a SUBDUE window
    (floor HP, e.subduing), you throw yarn/小鱼干/纸箱 to PIN it (isCatch resolveHit path).
    Catch GRADE = low-HP + status tags + was-staggered + play/juggle meter + slow-blink calm
    − OVERKILL penalty (KO to 0 = scared off, worse bond). Grade → starting affinity/bond tier.
    Fixes the "basics-only KO" rot: status/restraint/positioning become the skill ceiling.
 ② Knock-it-off-the-ledge (LOW, very high identity): edges/hazards EJECT on knockback (kbx
    already exists but arena just clamps at BATTLE_MARGIN). knockOff/puffHiss become positional
    finishers; shove a subduable enemy off = the catch. Nearly free — vectors exist.
 ③ Butt-wiggle windup = universal tell (LOW): replace charge-ring with crouch+rear-wiggle
    (amp from telegraph/telegraphMax) + ears-back + tail. Draw-layer; makes 10s of footage
    unmistakably cat (StS readable-intent as cat body-language).
 ④ Bat-around juggle (LOW-MED): batAround keeps a staggered enemy bouncing, builds play meter
    (restraint rewarded at catch) instead of racing HP to 0.
 ⑤ 对波 clash = paw-swat/deflect (LOW): reframe clash as batting shots out of the air; timed
    swat deflects one shot at an angle (reuse tickProjectileClash + reflect).
 ⑥ Box-ambush stealth (LOW, mostly built): boxAmbush i-frames + enemy LOSES track (leadAngle
    aims at last-seen) → pounce-from-stillness guaranteed stagger = catch setup.
 ⑦ Laser-pointer BAIT (MED, new AI): you hold the dot; enemies fixate & chase it → herd onto
    fields/ledges. The one genuinely-new system; do last.
 ⑧ Slow-blink/purr de-escalation (LOW): 慢眨眼/呼噜光环 in the subdue window CALM the wild cat
    (raise catch grade, no damage) — the non-violent bond finisher.
Juice (Canvas2D, no art): procedural tail mood-read, ears-back telegraph, loaf guard pose, yarn
thread trails + 纸箱 catch-cam replacing the quiet KO, paw-print landing decals, startle fluff-pop.
Anti-generic fixes: (1) win=catch-not-KO; (2) knockback actually ejects off ledges; (3) butt-
wiggle/ears/tail telegraph replaces the generic charge-ring.
Hooks: battle.js resolveHit/hurtEnemy/applyHitEffects, captureReady/finish, knockback loop,
tickProjectileClash, enemy telegraph draw; skills.js knockOff/batAround/boxAmbush/puffHiss/
dawnHeal/blessFur. Queued as a worktree after the 3 in-flight builders merge (heavy battle.js overlap).

---

## 2026-11-21 18:21 — Hourly adversarial playtest (6 personas × 8 battles, 1 round)
Run wf_68924755-dd1 · 64/68 agents ok (4 synth agents hit StructuredOutput retry cap) · 51 critiques (41 real-problem / 10 opportunity). FINDINGS ONLY — no code changes applied/pushed this cycle (owner review).

**Headline:** Cat Bond already ships the depth every persona asks for, but its escalation triggers are gated on conditions dominant players structurally never meet — so combat collapses to a flat "mash-wins" monotone for 5 of 6 archetypes. Fun scores mostly 3-5/10 (one 7/10).

### Adversary-confirmed pain points (root-caused to file:line)
- **P1 — Rubber-band switches itself off the moment it works.** `_pressure` (battle.js:2915) only climbs while teamHpFrac > 0.88; the must-dodge smash fires only at `_pressure >= 0.35` (battle.js:3323). Sequence: masher at full HP → pressure builds → ONE smash lands (26% max HP) → HP drops to ~74% → pressure decays → smashes stop → masher finishes with basics. The single forcing function fires once then eases off the exact player it was built to challenge. Casual enemyDmg 0.6 + starter caps (battle.js:84-86) + removed 12% basic mash-floor (battle.js:3858) → nothing a masher does/skips can lose.
- **P1 — Anti-stomp ramp has a hole at the dominator's real stat line.** Cross-fight ramp gated on STRICT zero damage: `won && (o.dmgTaken||0) <= 0` (battle.js:1514). A 0.98 HP-frac win took ~9 chip → dmgTaken>0 → stompStreak resets every fight → `_stomp` stays 0 forever → the entire escalation (sharper windups 143-145, smash-via-_stomp 3323) is DEAD for the exact archetype it targets. The 0.98/0.97 metrics are the bug's fingerprint, not "fine."
- **P1 — Smash auto-dodges itself for free.** Smash targets the player's CURRENT position (battle.js:3337) with 1.4s windup + 9-12s per-enemy cooldown behind single-caster `_novaLock`; a masher walking toward the enemy drifts out of the 86px circle without ever registering it as a dodge.
- **P1 — Teaching exists but is toothless.** First-fight coach (battle.js:187-273) clears its "skill" step on ONE incidental tap (`_coachUsedSkill`) and auto-advances the dodge step after 12s idle (line 243); `coachHoldsEnemies` freezes enemies during the skill step so there's no threat to use a skill against. Only the ult has an in-combat re-engagement loop (`tickUltReminder` 2434) — Q/E/dodge/shield have zero reinforcement after battle 1.
- **P1 — Depth is hidden behind the default difficulty.** All anti-mash depth changes combat EFFICIENCY (poise = 2× payoff), but a masher optimizes only for "did I win," so efficiency pressure is invisible; the real challenge lives behind the hardcore toggle (default casual) this player never flips.

### Ranked fixes (adversary-proposed, NOT applied — for owner review)
- **P0 (de-facto):** Decouple `_pressure` from team-HP so the smash forcing-function can't self-disable: gate escalation on an ENGAGEMENT signal (no dodge/shield/skill in last N s) via the existing `_obs` block (battle.js:137), keep pressure climbing regardless of HP for a never-defending player, OR raise the 0.88 band to ~0.70 and cut decay so one smash doesn't drop below threshold. Let smashes STACK on a refuser → recoverable teaching-death, even on casual. (Addresses 3 of the 5 P1s at the root.)
- **P1:** Change the anti-stomp flawless gate (battle.js:1514) from `dmgTaken <= 0` to near-flawless `hpFrac >= 0.9` (hpFrac already computed at 1508) so a 0.98 masher counts as dominating and the ramp actually arms.
- **P1:** Lead the smash target by `me._vx/_vy` (like enemyLobAoe at 3549-3551) so forward-chasing no longer auto-dodges it — keep the 1.4s windup so a reacting player still walks out.
- **P1:** Generalize the ult-reminder re-engagement loop to Q/E/dodge/shield (reuse `_coachHighlight`), and make the first-fight coach require genuine execution (land a skill hit; one scripted telegraphed swipe the player must actually dodge, not a 12s timeout).
- **P2 (15 items):** per-persona polish (cautious/explorer/panicky/lazy/impatient) — pacing, clarity, discoverability nudges; see run transcript for detail.

**Note for owner:** these are structural combat-tuning changes to battle.js; several overlap the in-flight difficulty/skill-tree rework. Recommend folding the P0 pressure-decoupling + the 1-line flawless-gate fix (1514) into the next combat pass. Combat does NOT read healthy this cycle — the mash-monotone is real and reproducible across 5/6 personas.

---

## 2026-11-21 ~18:5x — Hourly adversarial playtest #2 (6 personas × 8 battles, 1 round)
Run wf_ca1f26ac-87f · 59/64 agents ok (5 synth retry-capped) · 46 critiques. FINDINGS ONLY — no code changes applied/pushed this cycle.

**Headline:** Rich danger/escalation engine exists, but every trigger is gated behind back-loaded dominance or pixel-perfect flawlessness no persona's win condition reaches → combat is an identical, stakes-free damage-race all 6 archetypes out-pace before systems arm. (Corroborates cycle #1 — same mash-monotone, more specifics.)

### New/sharpened adversary-confirmed findings
- **P1 (confirms #1):** smash gate needs `catchCount>=2 && (_stomp>=0.3 || _pressure>=0.35)`; `_pressure` only ramps after t>5 at dt*0.45 (battle.js:2915); enemy first `special` ~2-4s (615) + early HP damped ~0.5 (593). Masher deletes enemy (~4s TTK) before the fuse burns → the one "leave the red circle or eat 26%" forcing function never fires.
- **P1 (NEW, 2-line fix):** anti-stomp `stompStreak` HARD-RESETS to 0 on any chip damage (battle.js:1514 `won && dmgTaken<=0`). A 0.99-HP win takes 1-3% → resets every fight → `_stomp` never accumulates → fight N+1 == fight N forever. Proposed: increment on DOMINANT win (`won && hpFrac>=0.9 && t<=25`), DECAY by 1 (not reset) on non-dominant. Single highest-leverage change.
- **P2 (NEW, input feel):** basic cd 0.6s throttles ~80 presses/s → 1.67 fires/s; `fireBasic` early-returns `if(cd.basic>0)return` SILENTLY (battle.js:1284) → ~95% of presses give zero feedback → input feels weightless. Proposed: buffer last press to auto-fire when cd hits 0 + a "ready" tick pulse so the thumb locks onto the 0.6s beat.

### Ranked (adversary-proposed, NOT applied)
- **P0:** decouple smash/escalation from back-loaded `_stomp`/`_pressure`/`t>5` → arm off live passivity (`_obs.dodgeN≈0` + low movement); shorten enemy first-special window so a stationary post-tutorial masher meets a dodge test in the opening 2-3s.
- **P1:** the stompStreak graded-dominance fix (battle.js:1514); faster `earlyDamp` decay (593).
- **P2:** basic input buffering + ready-tick; combo-heat crescendo on sustained on-cadence mashing.

**Note for owner:** Same conclusion as cycle #1 — combat does NOT read healthy; mash-monotone reproducible across all 6 personas. These overlap heavily with the in-flight hit-feel + difficulty/skill-tree work. The `1514` stompStreak fix + `_pressure` decoupling remain the two cheapest high-impact levers.

---

## Cycle (2026-11-21, code @ ef379ec→c4895c1) — adversarial playtest, 6 personas × 8 battles

**Headline:** "Combat depth is fully built but structurally defanged — the adaptive-difficulty ramp, the one must-dodge 'stick,' and the skill forcing-function all key off conditions the dominant playstyles never trigger, so every persona coasts in a flat, consequence-free sandbox." 49 critiques; mash-monotone STILL the dominant finding (unchanged from cycles #1-#2 — it is the standing #1 issue, not new).

**Adversary-confirmed pain points (ranked):**

- **P0 — Defense has no STICK (confirmed 3rd cycle running).** Every "difficulty lever" is actually a carrot: unmarked-basic 0.7× tax, poise/stagger, cast-interrupt all REWARD using the kit; none PUNISH ignoring it. A masher eats the 0.7× and wins by attrition — the execute-phase closer (battle.js ~4144, up to ×2.5 under 12% HP) actively *guarantees* the finish that "basics alone can't end."
- **P0 — The one real stick (telegraphed smash) is defanged 3 ways for the exact persona it should catch:** (1) gated behind `catchCount>=2` (~3733) so the first 2 fights have zero forcing function; (2) smash center is FROZEN at cast-start (`e.smashTarget={x:me.x,y:me.y}` ~3748, re-read at release ~3919) + only R=86 / 1.4s windup → incidental strafe-drift escapes it for free (why dmgTaken~14.75 with dodge=0); (3) the mash-stall detector (~3313-3327) SUSPENDS `_pressure` when a masher pins a low-HP enemy → turns OFF the `dominating` gate that spawns the smash at the exact moment the player is most passive. Plus manual players get an unconditional +12% fire cushion (`manualEase=1.12` ~3776).
- **P1 — "Must-dodge" smash deals only flat `e.dmg`, shield-chipped to 0.85** (resolveHit ~4304) → a masher face-tanks the very hit designed to force a dodge. The telegraph shipped; its teeth did not.
- **P1 — Poise forcing-function reads as "mashing works":** the 2× 虚弱 stagger multiplier (~4327) is shared by basics, and the 虚弱! callout pops on the ENEMY decoupled from the Q press → an 8-dmg-no-Q run and a 21-dmg-with-Q run look identical to the player.

**Ranked fix directions (adversary's, for owner review — NOT applied):**
- **P0:** add an input-diversity signal (rolling "basic-only ≥6s" flag from the existing `_obs` fires/dodgeN) and point the smash at IT instead of (or alongside) the HP-based `dominating` gate; drop the `catchCount>=2` freebie to `>=1`; retarget `smashTarget` to the player's LIVE position at release (or R→~110 / windup→~1.0s) so passive drift no longer dodges it for free; collapse `manualEase→1.0` while basic-only.
- **P1:** give the smash a real `SMASH_DMG` as % of MAX HP scaled by difficulty (~35-45% 硬核 / ~18-22% 休闲), non-lethal from full (preserves the no-death coach + casual accessibility), + short vulnerableT/slow tail; keep the 0.85 shield-chip so DODGE (i-frames), not shield, is the answer; scale smash FREQUENCY with `stompStreak` so flawless-mashers see it more until the dodge button earns its place.
- **Guardrail the adversary itself flagged:** do NOT reintroduce a global mash-lock or kill casual — casual mode, the no-death first-fight coach, and "flawless runs still take hits but survive" are deliberate accessibility choices.

**Carrots to LEAVE ALONE:** 0.7× unmarked penalty, poise/stagger, cast-interrupt — the gap is the missing defensive stick, not the existing rewards.

**Note for owner:** This is the 3rd consecutive cycle converging on the same root — "all forcing functions key off team-HP/flawless-streak, never off what the player is DOING." The cheapest high-impact lever remains: compute a basic-only/no-defense input signal and route the already-built smash at it. Findings only — no code changed, no push (cron rule).

---

## Cycle (2026-11-21 late, code @ 9684079) — adversarial playtest, 6 personas × 8 battles

**Headline:** "Combat is a confident victory lap for every persona because its two escalation systems are gated on FLAWLESSNESS (not dominance) and its flagship skill-forcing function (poise) is effectively dead for a masher — so no playstyle can ever be invalidated and the whole kit stays optional." 48 critiques. This cycle produced a SHARPER mechanism-level diagnosis than cycles #1–#3 (which said "no stick"): the sticks EXIST but are **mis-gated** so they can never fire for the dominant casual profile.

**NEW adversary-confirmed root cause — escalation gated on flawlessness, not dominance:**
- **Cross-fight anti-stomp is unreachable:** `stompStreak` only increments on `won && dmgTaken<=0` (battle.js:1712) — a *literally zero-damage* win. A masher takes ~47 dmg/fight, so stompStreak **resets to 0 after every battle** → the foe-sharpening (snappier windups, less aim-slop, extra telegraphs at _stomp lines 145-150) NEVER engages for someone who dominates by 80% but isn't surgically perfect.
- **Within-fight `_pressure` collapses on first scratch:** only accrues while `teamHpFrac>0.88` (battle.js:3379). The moment the enemy lands one chip and HP dips <88%, the rubber-band DECAYS → the must-dodge smash / double-telegraph **switches OFF as soon as the fight gets slightly real**. The masher floats in 0.80–0.88 (below the pressure gate, above any danger) — the exact fixed point this gating converges to.
- **Net:** the game punishes PERFECTION and rewards sloppy DOMINANCE with the easiest experience — tension reaches only the players who least need it.

**Ranked fix directions (adversary's, for owner review — NOT applied):**
- **P0 — re-anchor both gates from flawless → margin-of-dominance:** (1) battle.js:1712 change stompStreak increment from `won && dmgTaken<=0` to a final-HP test e.g. `won && hpFrac>=0.75` (hpFrac already computed line 1706) — an 80%-HP win now counts as a stomp, so enemies progressively sharpen and the smash starts firing across an 8-fight run; (2) battle.js:3379 lower the `_pressure` accrual gate from `>0.88` to ~`>0.60` so the rubber-band keeps climbing while the player is clearly winning instead of collapsing on the first scratch. Keep the smash a readable 1.4s interruptible reaction test. **Validation target:** masher's lowest hpFracLeft should drop below ~0.5 and ≥1 of 8 fights approaches a faint.
- **P1 — give the masher a wall it can't brute-force:** on the same `dominating` gate, a periodic "armored guard" enemy state: ~80% flat reduction vs unmarked basics, decaying only to burst/stagger/ult — so inside the 70s cap a cruising masher MUST press one Q/E/R or land a stagger-break. Converts the toothless `_stalled` nag into a real wall.
- **P2 — surface the already-computed perf score (battle.js:1707) on the result screen (~5163)** as a visible tool-usage grade ("0 技能 · 0 闪避 — C") so even a win teaches that the toolbox was left on the floor. Also noted: poise tuned so "unmarked basics barely dent it" means a masher literally cannot reach the 2× 虚弱 window — reward desert.

**Guardrails the adversary itself flagged:** keep casual's 0.60 enemyDmg flat mult (accessibility); keep smash readable/interruptible (tension, not unfair burst); the gating fix alone should suffice before touching damage mults.

**Note for owner:** This refines the standing mash-monotone finding into a concrete, low-risk 2-line gating change (`dmgTaken<=0` → `hpFrac>=0.75`, and `0.88` → `0.60`). It's a difficulty/feel DESIGN decision, so logged for owner decision — findings only, no code changed, no push (cron rule).

---

## Cycle (2026-11-22, code @ d94db8b) — adversarial playtest, 6 personas × 8 battles

**Headline:** "Combat is mechanically rich but every layer of depth, feedback, and win-condition is INVISIBLE or mis-gated — all six personas lose to or get bored by systems they literally cannot see." 52 critiques. This cycle reframes the standing mash-monotone root as a **legibility/feedback** problem (new angle) on top of the escalation-gating finding from prior cycles.

**NEW adversary-confirmed pain points (ranked):**

- **P1 — danger feedback is pointed where the masher never looks.** The low-HP cue is a tiny box-shadow pulse in the TOP-LEFT team slot (game.js:1438); a masher's eyes are center-arena on their own cat. hurtMe (battle.js:4450-4466) caps hitSquash at 0.28 so a 180-dmg lethal spike feels ~identical to a 20-dmg chip — the one moment that should scream gets the same thump. Fix: a center/edge-anchored `dangerVignette` (pulsing red screen-edge) when active-cat hp<~0.35 or a smash disc is live on the cat; + spike detection in hurtMe (single hit >25% maxhp → bigger flash/shake/hitstop + low-pitch cue). Couple feedback intensity to LETHALITY, anchor it where eyes already are.

- **P2 — invisible pre-fight RNG decides no-dodge fights.** buildPack (battle.js:611-613) rolls pack size as two coin flips → silently solo/duo/trio (~2-3× incoming DPS), × element matchup 0.5–2× — all unseen before the fight when swapping lead cat is still free. A masher eats 100% of whatever spawns → 95% HP vs resisted solo, 10% vs advantaged trio, with no attributable reason. Fix: a ~1.5s pre-fight banner (野猫 ×1/×2/×3 + lead matchup arrow + flag the favorable lead cat so even a masher taps 1/2/3 once); soften pack variance (each extra enemy outgoing dmg ×~0.7).

- **P1 (STANDING, now 5th cycle) — the must-dodge smash is still defanged.** Gated behind `dominating`+`pastTutorial`, snapshots a STATIC smashTarget at telegraph start (battle.js:3926, R=86), only ~26% maxhp → a masher who strolls while mashing drifts out for free; `dodge:0 / everUsedDodge=false` across 8 battles proves it never lands. Fix (depth-tier): fire on a fixed cadence (drop `dominating`, keep `pastTutorial`); RE-CENTER smashTarget on the player at ~60% windup (flash the recenter — fair, not gotcha) so a committed dash i-frame is the clean answer; raise ignore-cost to ~40% maxhp + bleed so two ignored smashes credibly threaten a KO; keep unblockable so dodge>shield.

**Guardrails (adversary-flagged):** keep casual accessibility + no-death first-fight coach; keep the matchup skill-ceiling (compress the floor, don't remove variance); fix the dodge GATE before buffing E/ult or touching passive ult/combo charging.

**Note for owner:** This cycle's framing is useful — the fixes are mostly FEEDBACK/LEGIBILITY (vignette, spike juice, pre-fight banner) which are lower-risk than rebalancing, plus the recurring smash-recenter. The aggro-system spec (.claude/aggro-system-spec.md) already proposes the systemic version of the smash re-gate. Findings only — no code changed, no push (cron rule).

---

## Cycle (2026-11-22, code @ 97981f5) — adversarial playtest, 6 personas × 8 battles

**Headline:** "Real depth + good telegraphs, but escalation, teaching, and feedback are all keyed to the WRONG variables — combat silently demands one playstyle and reads as noise to everyone else." 48 critiques. Converges with prior cycles but adds sharp mechanism-level fixes.

**Adversary-confirmed, ranked (findings only — NOT applied):**
- **P1 — the 20-vs-428 dmg swing is 5 hidden multiplicative systems, not noise, and none are legible.** pack-size RNG (buildPack 1/2/3 = 2-3× incoming), level-gap (enemyDmgMult [0.9,1.9] × enemyHpScaleGap [0.85,1.35] double-compounds), element matchup (0.5-2×), carried-HP attrition (enter at 40% from prior explore), and the smash = `max(e.dmg*1.6, maxhp*0.26)` UNBLOCKABLE (battle.js:4284). Fix dir: a pre-Start 危险度 low/med/high tag from enemyDmgMult+packSize+levelGap; taper the smash floor toward ~0.14 maxhp as the cat bleeds (gate behind difficultyMult so hardcore keeps lethality); confirm _novaLock caps concurrent smashes to 1 in a pack.
- **P1 — the mash-stall teach fires on the wrong variable.** The "use a skill" banner only arms at enemy hp<0.2 (battle.js ~3651), but a pure masher plateaus ABOVE 20% → banner never fires, fight dies at t>70s as a flat LOSS. Fix: arm on "basic-only >3.5s AND fight >20-25s AND enemy lost <15% HP in last 5s"; make the hard-resolve non-punitive (neutral "cat escaped" not a defeat) for onboarding.
- **P1 — the only danger cue is a 46px top-left tile pulse at hp≤0.25**, where a masher never looks, binary not gradient. Fix: a center/edge red vignette ramping CONTINUOUSLY as teamHpFrac<0.40 + heartbeat/slowmo tick at <0.15 (reuse teamHpFrac@3642, the purple flash@4978 site). Offense got all the juice; the "I'm in danger" state got none.

**Note for owner:** these are feedback/legibility + one smash-taper — lower-risk than rebalancing. Consistent with the standing escalation-gating root across cycles. No code changed, no push (cron rule).

---

## Cycle (2026-11-22 ~02:00 PST, code @ 8acbe61) — adversarial playtest, 6 personas × 8 battles (1 round)

**Workflow:** cat-bond-playtest.js, 67 agents, 54 adversary-graded critiques (**45 real-problem**, 9 opportunity; 41 P1 / 13 P2). Code under test = HEAD 8acbe61 (post owner poise-rework merge).

**Per-persona verdict (real sim telemetry):** 探索型 fun 7 engaged · 狂按型 6 engaged · 懒人型 6 bored · 没耐心型 3 **quit** · 手忙脚乱型 3 frustrated **quit** · 谨慎型 3 bored **quit**. Three of six would stop playing — all three for the same reason (patient/low-APM play is a dead end).

**Headline (synthesized):** "Combat has strong juice and real depth, but almost every reward and survival signal is gated behind states casual players can't reach — so aggression doesn't accelerate kills, patience is a silent timeout loss, and defense/skills stay optional decoration."

**Honest note on novelty:** this largely **reconfirms** the standing cross-cycle root (escalation/teaching/feedback keyed to the wrong variables) — NOT new. The one sharper, newly-dominant cluster this cycle is **A** below (kite = silent timeout, the single largest theme: 24 real-problems across 5 personas), surfaced because the cautious/lazy/impatient personas were run together and all hit the same wall.

**Adversary-confirmed, ranked (findings only — NOT applied, no push):**

- **P1 · A — Patience/kite is a silent timeout LOSS; the basic-attack DPS floor can't close a fight (24 real-problems, 5 personas — NEW dominant).** 谨慎型 won 1/8, timed out 7/8 at ~46s with 94% HP left and 80% idle — the clock, not the enemy, is the opponent, and the screen never says "you under-damaged." Root: a pure-basics playstyle meets a self-healing + `_pressure`-escalating target it can't out-DPS. Fix dir: (1) turn stalling into a real losing pressure — gate `_pressure` escalation (battle.js:3647) on a **no-progress** signal (enemy pack HP hasn't dropped in ~5s) rather than "team HP high", so turtling actively degrades; (2) on timeout/hard-cap show a "你造成了所需伤害的 X% / dealt X% of needed DPS" recap so the failure reason is visible; (3) give patient play a poke-payoff (well-timed Q/basic after a dodge → bonus/stagger) so careful ≠ dead-end.

- **P1 · F — The "use a skill" teach fires on the WRONG variable (catch-22, recurring + now mechanism-pinpointed).** The MASH-STALL banner only arms at enemy hp<0.2 (battle.js:3655), but a masher plateaus ABOVE 20% precisely because they only mash → banner never fires; fight dies at the 70s hard cap as a flat LOSS (3663). Fix: arm on **behavior** — `onlyBasics` AND fight >15-18s AND enemy HP dropped <25% over the last few seconds; make the hard-cap resolve a neutral escape/draw for onboarding, not a defeat for a pacing hole the design created.

- **P1 · D — Basics are triple-gated, so mashers can never reach the stagger loop (recurring, confirmed in code).** Basics deal ×0.7 on un-marked targets (4405), apply zero status tags so they never self-escalate (4403), and never drain poise so the 2× 虚弱 stagger window is unreachable without Q/E (4427). The most common casual input style is structurally locked out of the game's reward loop. Fix: let basics apply a small poise drain / light tag so a masher can *stumble into* the stagger lesson, then the teach (theme F) converts it.

- **P1 · C — The only survival cue is off-screen; a masher is deleted with no center-screen warning (recurring).** Low-HP warning lives solely in the top-left DOM rail (game.js refreshBattleHud ~L1458, ~300ms cadence) + a 12px gold chevron; the full-screen purple flash (battle.js:4986) fires on *every* hit so it's ambient noise, not danger. 狂按型 ate 428 dmg → faint with 100% of the warning in the margins. Fix: additive center/edge **red vignette** keyed to the ACTIVE cat's hp frac (<0.33), opacity + heartbeat pulse ramping to 0, hue distinct from the purple hit-flash + a red rim-glow on the active cat body. Pure feedback, zero balance change.

- **P1 · E — The 20-vs-428 dmg swing is a hidden `_pressure` ramp + a binary smash, indistinguishable from RNG (recurring).** `_pressure` silently ramps +0.45/s above 88% HP (3647); once armed, the must-dodge smash deals a FLAT `max(e.dmg*1.6, maxhp*0.26)` with a hard R=86 cutoff (4291-4292), no falloff → eat 0 = ~20 dmg, eat 3-4 = ~428, with no visible trigger. Fix: replace the flat 26%/0% cliff with **radial falloff** (`k = 1 - dist/R; heavy = max(e.dmg*1.2, maxhp*(0.08+0.20*k))`) so damage correlates with where you stand, and surface `_pressure` as a small HUD heat/aggro tell.

- **P2 · B — Dodge never fires in any persona, any battle (recurring; `dodge:0 / everUsedDodge=false` ×48).** Even the explorer "tries-everything" persona never dodged once — either unbound/unresponsive in auto-sim or zero incentive. Fix GATE before buffing: make dodge a real i-frame dash with a visible cooldown pip + perfect-dodge juice; the smash (theme E) should be the thing that *teaches* dodge once it's legible.

- **P2 · G/H/I — long fights devolve to basic-spam (3082 basics in a 36s fight ≈85/s), encounters read samey, no win-screen flourish.** Lower priority; combo-depth + encounter variety + a "flawless/fast-clear" recap would retain the engaged personas (explorer fun 7) past 8 runs.

**Guardrails (adversary-flagged, carried):** keep casual accessibility + no-death first-fight coach; compress the DPS/difficulty FLOOR without removing the matchup skill-ceiling; fix the dodge GATE before buffing E/ult. Most P1 fixes here are **feedback/legibility** (vignette, DPS-recap, pressure tell, behavioral teach-trigger) — lower-risk than rebalancing; the smash-falloff + `_pressure` re-gate are the only mechanics touches.

**Note for owner:** findings only — no code changed, no push (cron rule). Convergent with prior cycles; the systemic version of the escalation/smash re-gate is already drafted in `.claude/aggro-system-spec.md`.

---

## Cycle (2026-11-22 ~02:35 PST, code @ 1fb5348 / battle.js flame-3-scored-hits) — adversarial playtest, 6 personas × 8 battles (1 round)

**Workflow:** cat-bond-playtest.js, 66 agents, **52 adversary-graded critiques (44 real-problem, 8 opportunity; 42 P1 / 10 P2)**. One Voice agent hit the StructuredOutput retry cap (1 errored) but all 6 personas still voiced and synthesis completed. Code under test = post-merge of owner's 13 commits (currency silver→gold, flame-3-scored-hits/upgrades, poise rework).

**Per-persona verdict (real sim telemetry):** 探索型 fun 7 engaged · 狂按型 6 engaged · 懒人型 6 bored · 谨慎型 4 **quit** · 没耐心型 4 frustrated **quit** · 手忙脚乱型 3 frustrated **quit**. Still 3/6 would quit — unchanged from last cycle; the quitters are the low-APM / patient / overwhelmed personas.

**Headline (synthesized):** "Combat is genuinely deep, but every forcing function, payoff, and teaching surface is gated behind exactly the skill or HP-state the struggling personas lack — so depth exists while legibility, reachability, and a satisfying ending do not."

**Honest novelty note:** mostly RECONFIRMS the standing root (escalation/teaching/feedback keyed to the wrong variables). The genuinely NEW, high-signal finding this cycle is **A** — the adversary proved the engine ALREADY computes the exact loss diagnosis (`_obs.dodgedThreats/threats`, element matchup, combo) and then throws it away instead of showing it. That's a near-zero-risk, high-leverage fix that hasn't been logged before.

**Adversary-confirmed, ranked (findings only — NOT applied, no push):**

- **P1 · A — The loss/timeout screen is a DEAD END that withholds a diagnosis the game already has (NEW, 7 real-problems/6 personas).** Win screen is a parade (grade/XP/coins/duo/unlocks); loss screen (ui.js battleRecoveryMarkup ~2745) says only "野生猫猫跑掉了" + HP-recovery rows. Yet `_obs.dodgedThreats/threats/fires/dmgTaken`, `perfectDodges`, `comboBest`, and leader element matchup are all harvested (battle.js:2475) and folded into the hidden enemy-tuning EMA, then discarded. For the "doesn't read tooltips" masher the loss screen is the ONLY teachable surface and it's empty → player concludes the wall is scripted rather than "I never pressed Space." Fix (low-risk, data already exists): in game.js endBattle loss branch attach `b._obs`/matchup to the recovery object; in ui.js add ONE "死因 / Why you lost" line chosen by the dominant signal (dodge-ratio<0.15 → "空格翻滚有无敌帧"; element<1 → suggest a counter-lead; high fires + low combo → "试试 Q/E").

- **P1 · B — No center-gaze survival cue; hit-feel is keyed to blow size, not remaining HP (10 real-problems/5 personas, recurring + now root-caused).** hurtMe (battle.js ~4672) scales white-flash/shake/hitstop by `dmg/maxhp` with ZERO reference to current HP — a 60-dmg tick at 95% and at 15%→dead look identical; the engine literally cannot express "about to die." Only death cue = a 54px top-left slot `.low-hp` glow (css ~287) the masher never looks at; the one full-screen overlay (battle.js 5035) is PURPLE and fires on the player's OWN casts. This is the self-inflicted cost of task #28 (floating HP bars stripped, never replaced). Fix: a red screen-edge vignette keyed to ACTIVE cat hp<0.35, opacity + heartbeat ramping to 0, drawn in the 5035 overlay block + distinct hue; one-time "危险！翻滚或开盾" teach banner; keep the coach damage-floor so the tutorial never trips it.

- **P1 · D — The `_pressure` rubber-band decouples HP-left from input quality (9 real-problems/4 personas, recurring).** `_pressure` (battle.js:3669, 4162) speeds enemy fire whenever teamHpFrac>0.88 → a clean opening is punished, a sloppy one rewarded, so outcome stops correlating with play and reads as a coin-flip. Fix dir: gate escalation on a no-progress signal (enemy pack HP hasn't dropped in ~5s) instead of "team HP high"; surface it as a small HUD heat/aggro tell so the ramp is visible, not spooky.

- **P1 · C — Hidden damage multipliers never surfaced (5 real-problems/3 personas, recurring).** Element matchup is pure spawn RNG (0.5–2×, a 4× spread); `Skills.effectivenessLabel()` is authored but called ZERO times in battle.js; the un-primed basic silently does ×0.7 (applyHitEffects ~4425). Players can't act on the one real decision (1/2/3 elemental cat-swap) because it's invisible. Fix: matchup badge on the target-lock/斗志 gauge (finally call effectivenessLabel); a "弱" state on the reticle when basics are un-primed; one-line end-of-fight attribution.

- **P1 · E — Dodge/Space never fires for any persona (6 real-problems, recurring).** No forcing function reaches struggling players; the must-dodge smash is still gated/defanged. Fix the GATE (fixed cadence, re-center on player at windup, raise ignore-cost) before buffing E/ult — carried from prior cycles.

- **P1 · F — Patience/kite = silent timeout loss; DPS floor can't close (4 real-problems/2 personas, recurring from last cycle).** 谨慎型 bored→quit again. Same fixes as prior cycle (no-progress pressure, DPS-shortfall recap, poke-payoff).

- **P2 · G — long fights → basic-spam, combo depth unrewarded (3, recurring, lower priority).**

**Guardrails (adversary-flagged, carried):** keep casual accessibility + no-death first fight; compress the DPS/difficulty FLOOR, keep the matchup skill-ceiling; fix the dodge GATE before buffing skills. The top two P1s (A loss-diagnosis, B low-HP vignette) are pure feedback/legibility reusing data the engine already computes — lowest-risk, highest-leverage changes available.

**Note for owner:** findings only — no code changed, no push (cron rule). Theme A (loss screen withholds its own diagnosis) is the new, most actionable item this cycle; everything else reconfirms the standing escalation/legibility root already drafted in `.claude/aggro-system-spec.md`.

---

## Cycle (2026-11-22 ~03:10 PST, code @ b035744 post-merge) — adversarial playtest, 6 personas × 8 battles (1 round)

**Workflow:** cat-bond-playtest.js, 64 agents, **49 adversary-graded critiques (41 real-problem, 8 opportunity; 1 P0 / 37 P1 / 11 P2)**. 2 Voice agents hit the StructuredOutput retry cap; all 6 personas still voiced, synthesis completed. Code under test = post-merge of owner's 3 commits (showcase + QA scripts; battle.js unchanged this fetch).

**Per-persona verdict:** 探索型 fun 7 engaged · 狂按型 6 engaged · 懒人型 6 bored · 谨慎型 4 **quit** · 手忙脚乱型 4 frustrated **quit** · 没耐心型 3 bored **quit**. Still 3/6 quit — same low-APM/patient cluster.

**Headline (synthesized):** "Combat is mechanically rich but systemically illegible — a verified silent 70s loss-cap, a dead 28% capture threshold, and an anti-one-shot combo cap mean every persona either loses fights they are winning or mashes into a payoff they never feel. Fix outcome/clock legibility first, then the reward loops."

**MAJOR NEW FINDING this cycle — the adversary went past feedback/legibility into three *mechanical* defects verified in code (not seen in prior cycles):**

- **P0 · A — You LOSE fights you are WINNING: the silent 70s time-cap stamps LOSS (18 real-problems/5 personas).** 没耐心/谨慎型 lose ~87% of battles with **faints 0 and avgHpFracLeft 0.86** — i.e. never in danger; nearly every loss is the hard 70s cap `finish(false)` (battle.js:3685), not a death. The clock is invisible and the wild cat just "runs away" with the player at 86% HP. This is the single worst combat read in the game: the player did everything right and the game says they failed, silently. Fix dir: (1) make the 70s cap HP-aware — if the player is comfortably alive, resolve as a *draw/escape*, not a LOSS; (2) better, decay the wild cat's 斗志 / collapse its range band via the existing `_pressure` after ~40s so even a 0.7×-basics kiter's DPS actually closes the fight; (3) show the clock.

- **P1 · B — The 28% capture threshold is effectively DEAD, so the core reward loop never fires (14 crit, 9 real/5 personas).** `captureReady` arms at wild HP <0.28 (battle.js:3836) but is cosmetic — a kiting/low-DPS player can't drive the enemy that low before the 70s cap, and when they do, nothing converts it to a win. Fix: make capture *mechanical* — when `captureReady`, a dedicated capture key (reuse R/ult slot) throws a bond → `finish(true)`; surface the threshold on the enemy HP bar so the player can see "almost catchable."

- **P1 · C — The combo cap is stuck at 0.15 while the code's own comment promises ~0.7 (anti-one-shot cap misfire; 11 crit, 9 real/6 personas).** `comboMult()` (battle.js:3000) does `Math.min(0.15, …)` so a maintained chain barely matters — every persona mashes into a payoff they never feel; the documented ×1.35/1.55/1.70 curve is unreachable. Fix: honor the curve — `Math.min(0.7, sqrt(min(combo,50))*0.10)` so sustained combos actually swing damage, giving skilled/engaged play a real reward and converting basic-spam into chaining.

**Recurring (reconfirmed, lower novelty this cycle):**
- **P1 · D — death is silent / no center-screen peril cue** (HP signal lives in the 54px top-left panel; arena shows only a 12px chevron — task #28's cost). Add a `_peril` red-edge vignette keyed to teamHpFrac<0.35 + a distinct low-HP heartbeat SFX in hurtMe (~4684).
- **P1 · E — hidden damage multipliers** (enemy→player element 0.5–2×, un-marked basic ×0.7, ±1 level noise feeding enemyDmgMult→1.9) are invisible AND uncounterable for the no-swap masher. Fix: dampen incoming element mult to ~0.75–1.5 (leave player OUTGOING at full so deliberate swaps still reward), cut level-noise amplitude (computeWildLevel L624 ×1.2→×0.6).
- **P1 · F — defense is taught only in the pressure-free first battle** (coachHoldsEnemies freezes the foe); add a reactive "闪避!空格" panic prompt reusing the existing `_coachHighlight` control-pulse when active hp<0.25 AND a threat telegraphs AND everUsedDodge is false.

**Guardrails (carried):** keep casual accessibility + no-death first fight; compress the difficulty FLOOR, keep matchup skill-ceiling; fix the capture/clock legibility (A/B) BEFORE rebalancing — they are the highest-leverage, lowest-risk and explain most quits.

**Note for owner:** findings only — no code changed, no push (cron rule). This cycle is the most actionable yet: **A (silent 70s loss-cap) is a P0** — players at 86% HP are told they lost — and **B (dead capture) + C (combo cap at 0.15 vs documented 0.7)** are concrete, code-pinpointed mechanical bugs, not just feedback polish. Recommend owner look at A/B/C first.

---

## 2026-11-22 (hourly cron cycle) — 6 personas × 8 battles, 1 round

**Run:** wf_16c422bf-da9 · 67 agents (66 ok, 1 StructuredOutput retry-cap fail on parallel[4]) · 53 critiques (39 P1 / 14 P2 / 1 works-as-intended) · 3.55M subagent tokens.

**Headline (adversary synthesis):** combat is mechanically rich but **one-directional** — every escalation, telegraph, and reward fires for the player who is *already winning*. Strugglers (masher / panicky / impatient) get opaque coin-flip deaths; the safe explorer and the auto-watcher get *zero stakes*. The fix is to make **threat, aim-assist, and resolution reach the players who are losing or waiting**, not just the dominating one. (Corroborates the prior cycle's "A silent 70s loss-cap / B dead capture / one-way rubber-band" finding — same root, more personas.)

### Adversary-confirmed pain points (deduped across personas)
- **Rubber-band is one-way.** `_pressure` only ramps when `teamHpFrac>0.88` (punish the cruiser); `_closing` only amplifies the player *landing* hits. Nothing in the engine ever reacts to the player being **low** → a masher feeding identical inputs bleeds out at a byte-identical HP every loss (deterministic `enemyDmgMult` frozen at start). Losses feel scripted, not dynamic.
- **Defensive mechanics are taught to the wrong players.** Dodge/shield lesson lives only in the one-time pressure-free first-fight coach; the in-combat forcing function (unblockable smash) is gated behind `dominating = _stomp>=0.3 || _pressure>=0.35`, which a player eating damage *never* reaches. The player who most needs the lesson provably never gets it.
- **Anti-mash damage economy fires too late.** Pure-basic hits clamped to 0.7× forever with no self-prime path; mash-stall nudge only triggers at enemy HP<0.2 and only ever says "use a skill," never "you're getting hit, dodge."
- **Passivity has no answer (kiter).** Every forcing function punishes the aggressive/dominating player; an 80% idle kiter triggers none of the juice economy (perfect-dodge, poise-break streak, closing ramp) and sits in a 45–47s timeout cluster. `_closing` starts at t=45s and only helps the player — stalling carries no escalating cost to the enemy.
- **Enemy variety is cosmetic, not mechanical.** `makeEnemy` assigns "role" by pack index `i%3` + rarity; no hand-authored archetype behaviors → every fight reads the same, so no fight teaches a new response.
- **No defensive scoreboard.** Offense has a running ledger (combo, 斗志/ult, kill toasts, 完美闪避 bullet-time); defense/kiting earns nothing visible, so cautious play feels like "not playing."
- **Combo is hit-count-gated, not ability-gated.** Basics are cd-capped so abilities can never exceed ~15–17% of actions; combo (capped at +20% dmg now) pays only in offense and only to spammers.

### Ranked fixes for owner review (findings only — nothing applied/pushed)
- **P1 · losing-side valve** — add a `_grit` term symmetric to `_pressure`: ramps 0→1 as active cat HP falls below ~25%, decays on recovery; wire into `hurtMe` as capped incoming-DR (`dmg*=1-0.28*_grit`) BEFORE the hp-subtract. Zero-input comeback window (reaches the masher); breaks the deterministic identical-bleed-out. Gate off during `coach`, cap ≤28–30%, exclude the unblockable smash so dodging still matters.
- **P1 · damage-reactive defense nudge** — next to the mash-stall block in `update()`, independent of the one-time coach: when this-fight `dmgTaken` crosses ~40% maxhp AND `everUsedDodge` false AND dodge ready, one-shot toast + pulse the Dodge button (reuse `_stallBanner` highlight). Same for shield.
- **P1 · bidirectional `_pressure`** — add a low-HP execute/desperation accrual band so escalation isn't only a comfort-punish for the winner.
- **P1 · passivity term (kiter)** — `_passiveT` accrues when neither side deals damage for N s; drives enemy aggression decoupled from enemy HP so stalling costs something.
- **P1 · mechanical enemy archetypes** — replace `i%3` role with 2–3 hand-authored behaviors (e.g. periodic guard/shield state reusing `shieldT`) so fights demand different responses and the anti-mash tell is ungated.
- **P1 · defensive scoreboard** — mirror the combo ledger for defense: count i-frame dodges / barrier blocks in `resolveHit`, surface a visible meter + grade it in `gradeBattle` (a 无伤/clean badge from `_obs.dmgTaken`).
- **P1 · combo ability-gated** — lower the basics-only ceiling to ~+6–8% and gate high tiers behind ability hits, so skill expression (not spam) drives the chain.
- **P2 (13) + 1 WAI** — juice kiting/perfect-dodge (afterimages, widen graze window), lethal once-per-battle guard mirroring `bond.reviveOnce`, kill-blow cause capture for a death readout, route held-attack into ult when ready. Lower priority / polish.

**Owner read:** the single highest-leverage theme is the **one-way rubber-band** — the `_grit` losing-side valve (P1) is the cheapest change that fixes the masher/panicky "scripted death" AND the kiter "no stakes" at once, because it makes the losing side's experience *reactive* instead of deterministic. Recommend it + the reactive dodge nudge first. All findings-only; no code touched, no push (cron rule).

---

## 2026-11-22 (hourly cron cycle #2) — 6 personas × 8 battles, 1 round

**Run:** wf_b2ecd19d-fe2 · 60 agents (56 ok, 4 StructuredOutput retry-cap fails) · 43 critiques (36 P1 / 7 P2 · 35 real-problem / 8 opportunity) · 3.23M subagent tokens. **Sim tested the current WIP tree** (enemy-skill-unification + meleeReach + band-cap + beam-cut all present; git rebase onto origin aborted — origin only advanced CI/promo, no game code — WIP restored intact, `npm run check` green before run).

**Headline (adversary synthesis):** combat is genuinely deep & well-built, but its **teaching, reward, and resolution systems are ALL gated on the player already winning** — so every persona except the ideal 45–85s skilled player experiences that depth as noise, a coin-flip, or an empty non-ending. (Third straight cycle converging on the SAME root: one-directional systems. The evidence is now line-precise.)

### Adversary-confirmed pain points (deduped across 6 personas)
- **Pedagogy only fires when winning.** The one forcing function (smash disc) gates on `dominating = _stomp>=0.3 || _pressure>=0.35`, and `_pressure` only accrues while `teamHpFrac>0.88` — so a player being ground down NEVER sees the "leave the circle / dodge" lesson. The coach is one-shot (never teaches shield/E at all), and the mash-stall "use a skill" pulse only fires when the enemy is pinned <20% HP — another winning-state teach. Dying teaches nothing → retry → same wall.
- **Aggression has no sustain identity.** Every safety lever (perfect-dodge bullet-time, shields, heals, lifesteal) is opt-in active input. The one thing a masher DOES — combo chain — grants juice + ult + ×1.20 dmg but zero HP/shield. So an aggression-only player has no in-system path off low HP except adopting the playstyle they refuse. Every win is an "ICU victory."
- **Resolution is asymmetric drama.** The ENEMY gets a scripted tension curve (final-stand at 52%/24% HP + capture finisher slowmo/flash/banner). The PLAYER's faint is a single silent frame (`onFaint`→`finish(false)`), no brink, no last-stand. `reviveOnce` is affinity-gated/one-time/binary. No comeback hinge on the player's half → "no buffer between win and lose."
- **Time-cap = unconditional flee even at high HP** (手忙脚乱 persona): the 85s backstop flees regardless of HP — a player at 86% is told they lost.
- **Enemy variety still cosmetic**: lead/solo enemy role still from pack-index parity (`i%3`), not identity.
- **Silent input early-returns** (panicky): skillQ/skillE/dodge silently no-op when gated/on-cd → reads as "button didn't register." Needs a short input buffer + affordance cue.
- **Auto-battle doesn't showcase** (lazy): auto rotation is basic-dominated; skills/ult rarely fire, so the watcher sees no depth.
- **Combo pays a dead +20% number** (multiple personas): hit-count-gated, not ability-gated; should feed tempo/crit/sustain, not a flat damage cap.

### Ranked fixes for owner review (findings only — nothing applied/pushed)
- **P1 · losing-side brink window** — once-per-match player "绝地反击" mirroring the enemy capture-finisher: when the active cat would first hit 0 (no bond-revive), set hp=1 + ~0.8s inv + slowmo/flash/banner; landing a hit during the window rallies (~20–25% heal). Flag `_brinkUsed`. (Reaches masher/panicky; fixes the "silent death" asymmetry.)
- **P1 · break the "teach only when winning" gate** — add a `struggling` OR-branch to the smash trigger (everUsedDodge=false AND unmitigated hits / teamHp falling) so the dodge test ALSO fires for a losing player, dodge button pulsed; + a loss-state retry tip when dodge/shield/skill all unused.
- **P1 · aggression sustain channel** — at each combo milestone heal a small HP-weighted slice (~4–6%, scaled down as HP rises) and/or brief shieldT, so mashing itself buys survivability without snowballing skilled players.
- **P1 · HP-aware time-cap** — the 85s backstop should resolve by who's ahead on HP, not an unconditional flee (a high-HP player shouldn't be told they lost).
- **P1 · symmetric escalation / losing-side `_pressure`** — turn on the stubbed-out low-HP accrual so rubber-band reacts to the player falling behind, not only cruising.
- **P1 · input buffer + standing affordance cues** — buffer a gated Q/E/dodge press briefly; mirror the ult-ready affordance onto the other three verbs so a press always reads.
- **P1 · combo feeds tempo/crit, not a dead +20%** — gate crit or cadence on combo so skill expression (not spam) drives the chain.
- **P1 · enemy lead role by identity, not `i%3`** (makeEnemy ~682) — hand-author the lead/solo archetype. (Partially addressed already by the WIP enemy-kit unification — the kit now carries a real breed role; this asks the AI role/archetype to follow it too.)
- **P1 · auto-battle showcase rotation** (lazy) + **solo-ult cut-in** (~0.5–0.7s) so depth is visible to a watcher.
- **P2 (7)** — peripheral smash alarm, de-fang damage-spike adaptive engine, poise→capture contextual prompt, tiered capture ramp on the HP bar, E (疾扑) as a snappy out-DPS answer. Polish tier.

**Owner read:** three cycles now agree — the **single highest-leverage theme is one-directional systems**. The cheapest pair that flips it: **(a) the losing-side brink window** + **(b) breaking the "teach only when winning" gate**. Both reach the exact personas (masher/panicky/impatient) who currently get opaque deaths, and neither touches the skill ceiling. NOTE: part of the "enemy variety cosmetic" finding is already being addressed by the uncommitted enemy-skill-unification WIP (enemies now carry a real gated breed role); recommend folding the AI-archetype-by-role fix into that same bundle's challenger review. All findings-only; no code touched, no push (cron rule).

---

## 2026-11-22 (hourly cron cycle #3) — 6 personas × 8 battles, 1 round

**Run:** wf_a844e559-ab4 · 67 agents (66 ok, 1 StructuredOutput retry-cap fail) · 53 critiques (**1 P0** / 41 P1 / 11 P2 · 44 real-problem / 9 opportunity) · 3.67M subagent tokens. NOTE: this sim ran against the working tree captured at launch — it does NOT yet include today's later edits (kite-reduction, gap-closer displacement, stagger-cancels-windup, F7 barrage budget, switch-refresh). Treat as a pre-those-fixes baseline; the positioning/"突不到" complaints may already be partly addressed.

**Headline (adversary synthesis):** combat is a **bimodal stomp-or-get-stomped coin flip** — the escalation, payoff, and comeback systems are all genuinely BUILT, but each is gated into an HP/time band the complaining persona structurally never reaches. (4th straight cycle on the SAME root: one-directional systems. Now with line-precise gate coordinates.)

### Adversary-confirmed pain points (deduped, with the exact gates)
- **No comeback band (the P0-adjacent core).** `_pressure` (battle.js:3894) ramps ONLY when `teamHpFrac>0.88`; `_closing` (3906) only amplifies the PLAYER's landed hits; nothing eases when the squad is behind. Losses bottom out at HP 0 every time (deterministic 428-dmg identical death for a masher), wins end high — no recoverable middle.
- **P0 · no loss-streak catch-up** (手忙脚乱): there's a `_stomp` flawless-win streak that makes fights HARDER, but no mirror `lossStreak` that eases after repeated losses. Over-levelled stomp ramps up; repeated defeat never ramps down.
- **Anti-mash toolkit gated below 28% HP** — the subdued-poise execute accelerator (4841), the `_closing` execute bonus (3901/3906), and the "use a skill" mash-stall banner (3913) all arm only when a target is <20–28% HP. A player who times out at 42% HP never reaches any of them: 0.7× unmarked basics + near-zero poise + no coaching = unexplained blood sponge.
- **Loss screen is a feedback void** (masher): the game already tracks `_obs.threats/dodgedThreats/dmgTaken` and KNOWS the player dodged ~0 of N — but the defeat screen (ui.js battleRecoveryMarkup) shows only "野生猫猫跑掉了" + an HP table. The one screen the player stops to read names nothing.
- **`_closing` 收网 ramp starts too late** (t=45s) — most fights sit in the 18–45s window where it's inert; multiple personas want it pulled to ~t=18–20.
- **Skills are optional DPS optimizers, not load-bearing** — combo builds on every hit incl. basics and caps at +20%, so nothing a skill-chain unlocks that mashing doesn't; the risky combo-chain system (Skills.chainState/advanceChain) is built but never wired into battle.js.
- **No enemy mechanical variety** (explorer): wants a real guardian/shielder enemy role + escalation that raises LETHALITY, not just telegraph frequency.

### Ranked fixes for owner review (findings only — nothing applied/pushed)
- **P0 · loss-streak catch-up** — persist `lossStreak` in aiProfile (mirror `_stomp`); after repeated losses, ease enemy fire/HP a notch in casual. The single missing symmetry.
- **P1 · casual within-fight mercy band** — in `hurtMe`, casual-only: when a hit would drop the active cat below ~30% maxHP, clamp it + grant ~0.4s mercy-inv (once per threshold) so bursts can't chain-delete; pair with a low-HP downward taper on enemy fire. Leave hardcore + out-level stomp intact.
- **P1 · loss-screen postmortem** — compute a one-line 死因 from `_obs` on defeat (被击中N次几乎没闪避 / 整场没放技能 / 站位) and render it above the HP table. Pure plumbing, signals already tracked.
- **P1 · behaviour-keyed teach** — decouple the mash-stall banner from the 20%-HP pin; fire on behaviour (only-basics >6s AND enemy HP barely moved) at any HP, so the lesson lands at 42%/20s not never.
- **P1 · pull `_closing` start to ~t=18–20** — make the execute ramp live inside the window fights actually occupy.
- **P1 · make a skill press load-bearing** — convert the flat 0.7× unmarked tax into a consume-the-mark mechanic, or wire the built-but-inert risky combo-chain; give combo a spendable payoff instead of a passive +20%.
- **P1 · enemy guardian/shielder role** + escalation that raises lethality (not just cast frequency).
- **P1 · solo-ult pacing + finisher verb** — give the solo ult the duo's pacing contract; turn captureReady into a real pressable finisher.
- **P2 (11)** — dodge-reward retune, smash salience/peripheral cue, HP-bar win-line + staged momentum, ult impact punctuation. Polish tier.
- **Tooling note (懒人):** `scripts/playtest-sim.mjs` derives `skillsUsed` from `game.keys` and under-reports — fix the instrument before trusting auto-run skill metrics.

**Owner read:** four cycles now unanimously point at **one-directional systems**. The cheapest structural fix remains a **losing-side valve** — the P0 loss-streak catch-up + the P1 casual mercy band together convert "被秒/惨胜 coin flip" into a survivable crisis, and neither touches the win-when-ahead path or hardcore. This cycle also newly flags the **loss-screen feedback void** (free, high-leverage: the signals are already computed). All findings-only; no code touched, no push (cron rule). Reminder: today's uncommitted combat fixes (kite/gap-closer/stagger-cancel/F7) are NOT in this run — next cycle will measure them.

---

## 2026-11-23 (hourly cron cycle #4) — 6 personas × 8 battles, 1 round

**Run:** wf_810db59c-ab2 · 64 agents (60 ok, 4 StructuredOutput retry-cap fails) · 47 critiques (**0 P0** / 28 P1 / 19 P2 · 32 real-problem / 13 opportunity / 2 works-as-intended) · personas: masher / cautious / explorer / panicky / lazy / impatient. NOTE: this sim ran against the working tree captured at launch — it does NOT include today's later combat edits (agi-damage formula, rarity-HP halve, enemy special-meter opening-grace, volley-dodge, melee-basic trigger range, kite reduction). Treat as a **pre-those-fixes baseline**; several "no stakes / coin-flip / blood-sponge" findings may already be partly addressed by those edits — next cycle will re-measure.

**Headline (adversary synthesis):** **Every persona wins (winRate ~1.0, fun 4–7/10) but nobody is tested.** The whole kit — marks, poise, combo, ult, dodge, enemy variety — animates without ever gating a kill, and the two anti-stomp/anti-stall systems that DO exist are calibrated for players who don't exist (the zero-damage perfectionist and the 45s+ grinder), so the real cohorts fall through the cracks. (5th straight cycle converging on the SAME root: **one-directional systems** — now framed as "the kit is decorative; nothing is a win condition except the basic.")

### Adversary-confirmed pain points (deduped across 6 personas)
- **The entire mark/poise/combo/ult superstructure is decorative — it never gates a kill.** Everything (marks, poise-break, combo, ult meter via `gainUlt(2)`/basic) FILLS from basics; the only anti-mash stick is the soft `×0.7` unmarked-basic tax (battle.js:4850) a masher simply out-volumes with 1000–2600 pokes. Basics alone reach stagger AND the sub-28% execute with zero Q/E input. The design comment at 4844 claims "Q/E priming carries the fight"; telemetry proves it false. (masher ×3, panicky, impatient — the single most-repeated theme.)
- **Both anti-stomp systems are keyed to perfection, not win margin.** `stompStreak` only advances on a FLAWLESS (`dmgTaken<=0`) win (2030/2049) and resets on any chip, and `_pressure` only accrues while `teamHpFrac>0.88` (3937/3940). The comfortable-margin winner (0.45–0.77 HP left, 1.0 winrate) sits in a dead zone both systems ignore, so difficulty never ramps and nothing ever gives a reason to touch dodge/shield. (masher, explorer, lazy.)
- **Anti-stall `_closing` is a vitamin for the already-healthy.** The ramp starts at t=45s (3949/3952) but kiter fights plateau at ~45s; its only effects (`closeBonus` execute + poise-suppress) are hard-gated sub-28% HP (5013), so a kiter poking an enemy to 35–50% gets zero catch-up, hits the 85s backstop, and the timeout is relabeled a neutral `flee` with HP driven down silently voided. (cautious ×3.)
- **Combo is a capped, decaying, silent non-crescendo.** `comboMult` hard-caps at +20% (sqrt curve, ~+8% at 10 hits), the visual ladder flatlines by ~combo 15, `comboT` drops the chain in 1.3s, and the "pitch rises with the combo" audio comment is a lie (never wired). No sustain/HP payoff. (masher, panicky, impatient.)
- **The ult is on rails and orthogonal to input.** Passive `gainUlt(8*dt)` fills 0→100 in ~12.5s doing nothing; the 9s-idle auto-cast fires it FOR the player (even stealing their first-ever ult); it's bound to R (mashers never press it); and the solo ult is deliberately stripped of the arena-flash/cinematic the duo combo gets. Result: ult=0 across 8 battles for multiple personas, or a muted blip nobody registers. (masher, explorer, panicky, lazy.)
- **The defensive layer is vestigial AND illegible.** 0 dodges / 0 shields across 8 battles for several personas. i-frame absorbs `return {dealt:0}` silently (5175) with no EVADE cue (PROTECT one branch below gets full fanfare); the loud 完美闪避 fires on a press-time 40px proximity snapshot, not actual negation — it both false-positives and false-negatives, mis-teaching timing; there is NO dodge telemetry event anywhere (dashboard dodge count is structurally pinned at 0); plain dodge has no dash trail; and escalation only ever adds spaceable fire, never a range-collapse, so a kiter's shield/i-frames have no use case. (cautious ×2, explorer ×2, panicky ×2.)
- **Enemy variety is cosmetic.** Solo packs are the norm (~73%) and the lead role is `i%3` (battle.js:675/700) → a solo enemy is ALWAYS an ambusher; element only recolors projectiles (never changes behavior); phase-shifts + charged ult gate on `rIdx>=2`, so N/R wild cats never phase. Every encounter is the same distance-keyed script, recolored — the explorer's "same fight every time" is structural. (explorer ×2, impatient.)
- **Loss/timeout screens are feedback voids, and losing is a level-suppression trap.** The defeat screen is a "healing receipt" (`battleRecoveryMarkup`) — no 死因, no "差一点", no near-miss drama, despite `_obs` already tracking threats/dodged/dmg. Loss grants zero XP while under-leveled players hit softer/get hit harder → a negative spiral with no exit. Timeouts ignore the 斗志 driven down. No visible clock in the HUD. (panicky, cautious.)
- **Hidden multipliers are illegible.** Pack size (1–3, biggest swing), level-gap mult (0.90–1.90), element matchup (0.5–2.0), and the stompStreak ramp all stack silently; the big-hit floater renders identical to a chip tick (hardcoded size 15); no pre-fight threat readout. A 5–6× beating reads as the game cheating. (masher ×2, explorer.)
- **Auto-battle starves the one cohort that only watches.** Short auto fights end before the ~12.5s ult fill, so the cinematic never fires; auto-dodge is a flat 45% coin-flip even against telegraphed nova/lob/enemy-ult (only smash gets a guaranteed evade); solo ult has no spectacle; rewards don't compound with win streak (the only streak signal, stompStreak, is a pure difficulty TAX). (lazy ×5.)
- **No momentum/speed reward in the churn window.** Impatient players bail at ~18s, but every pacing lever (`_closing` t=45, execute sub-28%, 85s backstop) targets fights that drag PAST 45s — the 14–45s band is flat. The `swift` grade exists but is tuned for 40s and shown off-screen after the dopamine window; the execute is a silent damage multiplier with no "FINISH!" cue or dedicated finisher button. (impatient ×6.)

**Tooling note (lazy):** `scripts/playtest-sim.mjs:187` counts persona KEY PRESSES, not AI-driven casts, so auto-mode `skillsUsed q/e/ult = 0` is a measurement artifact — the harness is structurally blind to `smartAutoAction` casts. Fix the instrument before trusting auto-run skill metrics (this is the same instrument caveat flagged cycle #3).

### Ranked fixes for owner review (findings only — nothing applied/pushed)
- **P1 · make a Q/E mark the KEY that unlocks the kill (the single highest-leverage change).** Convert the soft `×0.7` unmarked tax (4850) into a hard DPS/poise wall: diminishing-returns decay on consecutive unmarked basics (`dmg *= max(0.15, 0.7 - 0.06*unmarkedStreak)`), reset only by a freshly-landed status tag; gate the basic's poise drain (4902) behind "target has ≥1 active tag." Mashing stays the rhythm, but subduing within the clock now REQUIRES periodically landing a skill — turning the decorative mark/poise/combo/ult kit into load-bearing systems. (Fixes the masher/panicky/impatient "whole kit is particle effects" root at once.)
- **P1 · recalibrate anti-stomp to WIN MARGIN, not flawlessness.** At 2030/2049 advance `stompStreak` on `won && hpFrac >= ~0.45–0.65` (add a `comfortStreak` feeding `_stomp`), and lower the `_pressure` HP gate from `>0.88` to ~`>0.55`. The 1.0-winrate / 0.45–0.77-HP cohort finally ramps enemy threat run-over-run instead of resetting to flat — without punishing genuine beginners (who stay under both gates).
- **P1 · finish the `_closing` ramp's own promise.** Pull onset from t=45 to ~t=18–20 AND scale the execute HP-gate UP with the ramp (`closeGate = 0.28 + 0.22*_closing`, 5013) so an actively-poking kiter converts a 40–50%-HP stall into a kill by ~70s; and make the 85s backstop HP-aware — if the lowest enemy is under capture-ready (<28%), route to `startCaptureSeq()`→`finish(true)` so attrition is honored as a win, not voided as a flee.
- **P1 · teach + surface the defensive layer (and instrument it).** Add action-gated coach steps for E (shield/heal) and R (ult, pre-charged in tutorial) — both omitted today; stop the 12s silent auto-advance from marking dodge "learned." Fire a confirmation cue on the ACTUAL i-frame-negation event (5175 → EVADE flash), demote the lying press-time 40px perfect trigger, add a dodge dash trail, and emit a `bond_dodge` telemetry event (currently none exists) + dashboard row per CLAUDE.md.
- **P1 · give combo a sustain + crescendo (reuse, don't add a meter).** On the `combo % 10` milestone heal a small capped HP sliver (~3–4%, Hades-style, gated on landing hits so turtles get nothing) alongside the existing `gainUlt(6)`; split an uncapped COSMETIC heat level to drive a continuous font/gold ramp while LEAVING the +0.15 balance cap intact; loosen `comboT` 1.3→~1.8–2.0s so reposition-and-re-engage keeps the chain; wire the already-promised combo-pitch audio ladder.
- **P1 · make the ult earned, not timed.** Cut passive `gainUlt(8*dt)` toward ~2*dt and route charge through landed hits/skills/dodges; delete the manual-mode 9s auto-cast (keep auto-mode only) so the player always fires their own ult; let a mash-slam convert the next basic at full meter (bind to the button mashers actually hold); give the solo ult a scaled cinematic/flash on kill. Split telemetry into `ult-player-fired` vs `ult-auto-fired` so `ult=0` stops being ambiguous.
- **P1 · enemy archetype by identity, not `i%3`.** Derive the solo/lead role from the species kit/element (brawler / zoner/sharpshooter / warden-shielder / trickster), give each ONE non-rarity-gated signature telegraph + distinct range band, and ungate a first phase-shift beat for all rarities at ~70% HP so N/R fights have rising action. Breaks the carbon-copy loop with no new art. (Note: partly overlaps the enemy-kit unification already in flight — fold the AI-archetype-by-role into that bundle.)
- **P1 · turn the loss screen into a graded near-miss that advances.** Compute a one-line 死因 from `_obs` (被击中N次几乎没闪避 / 整场没放技能 / 等级压制中) + "野猫斗志仅剩 X%" + best combo, rendered above the healing receipt; grant scaled consolation XP on loss (more the lower you drove the enemy) so repeated attempts chip toward crossing the level-suppression curve instead of flat-lining into a spiral.
- **P1 · pre-fight threat legibility.** Compute an encounter threat score at battle start from values already in hand (enemy COUNT first — the biggest invisible swing — plus level-gap, worst element matchup, and `stompStreak`) and surface it as a short banner + persistent squad-panel pip, so the 5–6× spike reads as earned/anticipatable instead of "the game cheated."
- **P1 · impatient momentum + finisher.** Add a rarity-scaled speed-kill par (`gradeTimeLimit*0.30`) with a live gold draining par bar + "极速收服!" banner and a real loot/XP bonus; decouple the execute from the 45s clock (HP-gated only) and add a "收服时机!/FINISH!" pulse on the 斗志 gauge plus a one-button finisher lunge NOT gated by the 18s ult cooldown (reusing the existing sub-28% execute gate so bosses/elites stay immune).
- **P2 (19) + 2 WAI** — auto-mode spectacle bias (offensive Q/E before shield opener + pacing-aware ult so the cinematic fires in short fights); generalize `incomingSmash`→`incomingHeavy` so auto guarantees evades on nova/lob/enemy-ult, not just smash; positive `stompStreak` loot counterpart + visible "连胜 ×N" so streak stops being a pure tax; local per-breed best-time (`bestSeconds`) to beat grade saturation; magnitude/cause-legible damage floater; desktop basic aim-assist (bend-not-snap, casual-only); `mashHeat` audiovisual payoff that still gates the real bonus on connecting; clutch-save shield readout; conditional "关键救援" line; `bond_time_record`/shield telemetry. Polish/opportunity tier.

**Owner read:** five cycles now unanimously point at **one-directional systems**, but this run sharpens the framing: the problem isn't just "no comeback valve" — it's that **the kit never gates a kill, so depth reads as noise/coin-flip for every cohort except the ideal skilled player.** The single highest-leverage change is therefore **making a Q/E mark a required beat** (P1 #1) — it converts the entire decorative mark/poise/combo/ult superstructure into load-bearing systems in one surgical edit, and it is the common cause under the masher, panicky, and impatient complaints. Pair it with the **win-margin recalibration** (P1 #2) so difficulty finally reacts to the cohort in the data. IMPORTANT: this is a **pre-fixes baseline** — today's later combat edits (agi-damage, rarity-HP halve, opening-grace, volley-dodge, melee trigger range, kite reduction) are NOT in this run, so the "no stakes / blood-sponge / coin-flip" findings may already be partly addressed; next cycle re-measures against the post-fix tree. findings only — no code changed, no push (cron rule).

---

## 2026-11-23 (hourly cron cycle #5 — FIRST post-combat-fix run) — 6 personas × 8 battles, 1 round

**Run:** wf_30f4ff6d-642 · 65 agents (62 ok, 3 StructuredOutput retry-cap fails) · 49 critiques (**1 P0** / 35 P1 / 13 P2 · 36 real-problem / 13 opportunity). First cycle that INCLUDES today's combat fixes (agi-damage max(pow,agi)+0.78, rarity-HP halve, enemy special-meter opening-grace, volley-dodge, melee-basic trigger range, kite reduction, debug button).

**Headline:** deep combat toolkit, but almost every forcing function & reward is gated behind "you're already winning" — so mashers/kiters/auto-watchers all experience a flat one-button game while the depth stays invisible; **one confirmed init bug disables auto-dodge entirely.**

### ★ P0 — CONFIRMED CODE BUG (not tuning): player cats never auto-dodge
`makeFighter` (battle.js ~776) builds player fighters WITHOUT a `dodgeCd` field → it's `undefined`. Both auto-dodge gates (battle.js:1366 and :1524) test `f.dodgeCd<=0`, and `undefined<=0` is **false** → the active auto cat AND every auto ally NEVER dodge a single projectile all fight. Enemy builder (battle.js:714) correctly sets `dodgeCd:0`, which is why enemies dodge and your cats stand there eating darts ("白挨"). **This is the real root of the "桃桃硬生生吃三发" the owner reported** — the band/volley work treated the symptom; the cat literally could not dodge. **Verified in-repo** (player fighter literal has `inv:0,dashT:0` but no dodgeCd; enemy has it). **Fix = 1 token:** add `dodgeCd: 0` to the makeFighter return object. Sim probe (per the adversary): auto-dodge 0→191 casts over 20 battles, avgDmgTaken ~163→147 (~10% less). **Owner: recommend applying immediately** — it's a field-init defect, not a balance change.
  - Secondary (P2): `scripts/playtest-sim.mjs` only counts `skillsUsed` when the PERSONA presses a key, so auto-mode casts read as 0 — a telemetry blind spot that also makes the RSI loop optimize against a phantom "q/e/ult=0". Wrap b.skillQ/skillE/ultimate/dodge to count real AI casts.

### Adversary-confirmed pain points (deduped themes)
- **The kit never gates a kill** (carried from cycle #4, still true): basic-spam reaches the capture threshold alone; combo caps at +20%, perfect-dodge/ult are reward-only. Nothing converts "I ignored dodge/shield/skills" into a felt cost.
- **The one anti-mash forcing function (smash disc) hides from the player it's for**: gated behind `dominating = _stomp>=0.3 || _pressure>=0.35`, and `_pressure` only builds while teamHpFrac>0.88 — a chipped masher never accrues it, so the smash never fires for him. When it does, it's a single non-escalating hit a 3-cat bench absorbs.
- **fireBasic silently discards early presses**: `if(f.cd.basic>0)return` — ~2000 of a masher's ~2200 clicks are no-ops with zero feedback; held auto-fire already hits the same 0.6s cadence, so mashing is strictly pointless vs holding and the game never signals it.
- **Onboarding is one-shot + engagement-gated**: initCoach dodge step auto-advances after 12s; a cautious player never dodges in time, lesson vanishes, no re-teach, no shield/ult step at all.
- **Difficulty only scales the sponge**: challenge/eliteFactor/_stomp all make enemies bigger/faster, never change which button is correct — 8 fights read as one mold to a masher.

### Ranked fixes for owner review (findings only — nothing applied/pushed)
- **P0 · add `dodgeCd:0` to makeFighter** — the auto-dodge init bug above. 1 token, verified, unblocks already-written auto-dodge. Highest value, zero risk.
- **P1 · smash as a guaranteed escalating teach** — decouple from `_stomp/_pressure` past-tutorial; fire on a fixed per-fight cadence at the player's position; replace flat `maxhp*0.26` with an escalating fraction (0.22→0.34→0.46) reset by a clean dodge. Makes spacing/dodge load-bearing.
- **P1 · a Q/E mark must gate the kill** (cycle #4's top, still #1): harden the ×0.7 unmarked-basic tax into a DPS/poise wall that only a freshly-landed status tag resets — converts the decorative mark/poise/combo/ult layer into required beats.
- **P1 · basic-attack rhythm + negative feedback** — reward an on-beat press (节奏爪: escalating dmg/ult/juice) and give muted/greyed feedback when a press is swallowed by cd, teaching timing over mashing.
- **P1 · forced onboarding drill** — make the dodge coach step a real drill (don't auto-advance), add shield + ult steps, re-teachable.
- **P2 (13)** — auto-AI tempo governor, generalize smash→heavy evade, win-margin difficulty recalibration, local best-clear-time to beat grade saturation, cause-legible damage floaters, telemetry fix. Polish tier.

**Owner read:** the big news this cycle is the **P0 auto-dodge init bug** — a confirmed 1-token defect that has been shipping a half-crippled auto mode (and is almost certainly the true cause of the "cats stand there eating fire" the owner kept hitting). Recommend applying `dodgeCd:0` now. The design theme is unchanged across 5 cycles (kit never gates a kill → depth invisible); today's fixes addressed the damage/positioning symptoms but NOT this init bug (it's orthogonal — those fixes assumed dodge worked). findings only — no code changed, no push (cron rule).

## RSI
RSI cycle 2026-11-23T06:02:59Z: no agent proposal beat the MOBA judge (baseline 0.770 held; my 4 niche-filling candidates — aggro-bruiser-hug / mid-tempo-pulse / desperate-dive / elite-mutation-tighter — none archived). Archive coverage **2/64** (unchanged: cells 0,3,3 baseline 0.770 + 1,3,3 stand-at-max 0.755).
⚠️ **FINDING for owner (not auto-fixed):** propose.mjs tripped its OWN control-sanity assertion — the deliberately-bad passive "stand-at-max-range" kiter now scores **0.755 vs baseline 0.742** on the judge (ranked at/above baseline → harness FAIL). This appeared *after* the local combat bundle (chase/dodge, tempo 0.64, enemy real-skill rotation, SSR-HP nerf). Two possible reads: (a) the MOBA judge is being fooled by passivity, or (b) the new enemy-rotation/tempo genuinely makes standing-at-max-range a legitimately strong policy vs the changed wild behavior (the sim notes it clears the 3-pack with fewer free hits). Worth an owner look at whether the judge's survival/speed weighting over-rewards passive kiting now. Findings-only: no band applied, no commit, no push.

## Playtest cron 2026-11-23T07:37:08Z (6 personas × 8 battles, origin/main clean sim)
Headline: *"Combat feel is fundamentally sound, but the resolution clock, feedback legibility, and the ult/dodge/aim forcing-functions are all mis-gated — every persona hits the same illegible walls. Fix shared plumbing before new content."* 52 critiques; 65/66 agents (1 StructuredOutput fail). Findings-only — nothing auto-applied.

Adversary-confirmed pain points, ranked:
- **P0/P1 — Death is illegible.** All masher losses hit the SAME ~428 dmg ceiling (zero mitigation applied). The engine already tracks threats/dodged/dmgTaken + per-hit source (_obs, _dbgLog) but it's debug-only/console. Loss screen says only "野生猫猫跑掉了" + HP table. FIX (UI/plumbing, no balance): on the loss screen name the biggest hit + "dodged X/Y" + the counter ("空格闪避可完全免伤"). Attribution + actionable counter in one sentence.
- **P1 — Held attack = wasted presses.** fireBasic auto-fires while held (flat 0.6s cd); mashing does nothing extra, and every swing is identical (no light-light-heavy, combo cap only +20%). Core-loop verb lacks texture. FIX: cycling auto-swing string w/ a 3rd-swing finisher (keep 3-swing avg DPS = today so band-fitness holds) + raise combo cap ~+40-50% gated on hit-recency.
- **P2 — Time is a one-directional enemy snowball.** specialMeter/ultMeter/_pressure compound unconditionally for enemies; the player's only clock lever (_closing 45→70s) needs poise-breaks or sub-28% execute — exactly what a masher can't reach. FIX: make _closing ramp player-favoring past ~45s (basic dmg + ult-charge scale up) + a "收网" banner, so long fights converge instead of diverging to certain death.
- Recurring across personas: danger/reward/variety signals invisible or instantly saturated; cautious kiter still can't win; aim/dodge forcing-functions gated behind skills the target player won't touch.

Note: this sim ran on CLEAN origin/main (combat bundle is local/uncommitted), so several of these (illegible pacing, dodge value) predate — and are partly addressed by — the local tempo 0.64 / slowmo / coordination / damage work. Re-run after the bundle lands to see which survive. Owner review pending; no code changed by this cron.
