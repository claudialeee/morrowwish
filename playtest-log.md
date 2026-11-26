
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

## RSI cycle 2026-11-23T16:35:25Z — no agent proposal beat the MOBA judge
Proposed 5 niche-filling candidates (cd-gated-commit / hp-ramp-standoff / aggro-frontline-hug / desperation-allin / stand-at-max-mutation), each targeting an empty engage/tempo/durability cell or mutating the #2 elite. **None beat the engine baseline and none archived a new niche.** Archive coverage **2/64** (cells 1,3,3 baseline 0.740 + 1,2,3 stand-at-max 0.692). Control check PASSED this cycle — the deliberately-bad passive kiter (0.692) now ranks correctly BELOW baseline (0.740), reversing last cycle's control-FAIL (where it had tied/edged baseline). Note both the baseline (0.770→0.740) and the control cell shifted vs the 06:02 cycle, consistent with the local combat bundle (tempo/chase/rotation) having since landed on main — the judge is scoring current code. Findings-only: no band applied to battle.js/skills.js, agent-candidates.json overwritten (not appended), no commit, no push.

## Playtest cron 2026-11-23T16:59Z (6 personas × 8 battles, rebased current code incl. S2+烫伤)
**Headline:** *"Combat is a competent but one-note DPS race: aggressive personas score ~6/10 on charm alone, while the cautious kiter (2/10, no defensive win axis) and the panicky player (0/8 losing streak, no mercy floor) fall through structural holes the adaptive systems were never wired to catch."* 48 critiques (35 P1 / 13 P2), 61/62 agents (1 StructuredOutput fail). Findings-only — nothing auto-applied, no push.

**Cross-persona root cause (named independently by masher, cautious, explorer, panicky, lazy):** the game's adaptivity is **one-directional** — `commitAiProfile` (battle.js:~2212) only ratchets difficulty UP (stompStreak on flawless wins) and never DOWN. There is no `lossStreak`/mercy branch, so a losing player (panicky went 0/8) gets no relief while a dominating player (lazy) gets no extra challenge. Both ends fall out of the fun band.

Adversary-confirmed, de-duplicated and ranked:
- **P0-equivalent (most-cited, 5 personas) · No downward difficulty branch / no mercy floor.** FIX (no new art): add a `lossStreak` to state.js aiProfile; in commitAiProfile increment on any non-win, reset on win; soften enemy burst/HP scaling while lossStreak≥2. Pair with a win-streak upward step for the auto-battler. This is the single highest-leverage change — it closes both the panicky-floor and lazy-ceiling holes at once.
- **P1 · Masher death is deterministic AND illegible.** Both masher losses pinned to the EXACT same ~428 dmg: the anti-masher smash (`max(e.dmg*1.6, f.maxhp*0.26)`, battle.js:~4993) + charged enemyUlt are HP-fraction, unblockable, and gate on an INVISIBLE `_pressure` state that only ramps while teamHp>0.88. FIX: first smash/ult a run is capped to a survivable graze (`_smashTaught` flag) + lengthen that first telegraph → teach before execute; surface the `_pressure` cross as a persistent HUD cue, not a transient toast.
- **P1 · Critical-HP has no screen-space scream.** Since the HP moved to the 42px top-left panel (#28), the only near-death cue is a corner box-shadow at a single frac≤0.25 threshold — a masher's eyes are center-screen. FIX: active-cat-only red edge vignette whose pulse frequency quickens toward 0 HP + one-shot 濒死/CRITICAL floater; demote the corner pulse to a 'wounded' tier.
- **P1 · The kit is strictly optional — left-click reaches every win-state** (HP→0, poise shatter at ×1.8 even on basics, the <28% capture line). Depth was added as content, not as a requirement; the 9s ult auto-cast failsafe is the game pressing R for the player. FIX: make the unmarked-basic ×0.7 tax scale toward near-zero as enemy HP drops so the last ~28% is a WALL only a status/stagger/element-advantage hit opens — breaks the hold-attack loop exactly where it matters, keeps early mashing fun.
- **P1 · Cautious kiter has no defensive win axis (2/10, and a zero-damage stalemate run).** A patient, non-dying player simply cannot win — all win vectors are offensive. FIX: give kiting a payoff (e.g. DoT/soak-stack attrition that closes a fight without burst, or a timed "收网" convergence that favors the player past ~45s), so turtling is a viable style not a soft-lock.
- **P1 · Auto-battle inherits the manual-tuned decision loop** (smartAutoAction) so the "lazy" auto-battler watches a careful human, not an optimizer; also tickUltReminder early-returns on autoMode (battle.js:~3540) so a held-full ult never fires in auto. FIX: give auto its own faster cadence (auto-only CD factor) + let the idle ult failsafe run in auto, gated on ultWillConnect so it never dumps a heal-ult at full HP.
- **P2 cluster (feedback legibility):** enemy morale bar has no lagging chip/ghost trail (hits feel weightless on the bar even though per-hit juice is lavish); shield/ward denials and barrier absorbs are silent (PROTECT/REFLECT float text but BARRIER doesn't); #battle-enemy-hp-fill sums ALL enemies instead of binding the focused target; repeated "exactly 4 shields per battle" = a silent double-gate (CD + one-way lock) with no denied-press feedback. All are plumbing/UI, no balance risk.

**Note:** this cycle ran on the rebased tree that NOW includes the local combat bundle (tempo 0.64, chase/dodge, enemy real-skill rotation, SSR-HP nerf, S1/S2 coordination, 烫伤). The one-directional-adaptivity and kit-optional findings are architectural and SURVIVE the bundle — they're the next real target. Several earlier legibility items (illegible pacing, dodge value) are partly addressed by the bundle. Owner review pending; no code changed, no push (cron rule).

## Playtest cron 2026-11-23T17:30Z (6 personas × 8 battles, current code f81ab60d incl. S2+烫伤)
**Headline:** *"Cat Bond ships deep combat systems but they're miscalibrated so each archetype's core verbs land in dead zones — the two lowest-fun personas (cautious kiter 2/10, panicky 3/10) have fully broken winRate-0 loops, while the systems' payoffs (ult, forcing functions) never reach the cohorts built to enjoy them."* 46 critiques (30 P1 / 16 P2), 59/64 agents (5 StructuredOutput fails). Findings-only — nothing auto-applied, no push.

**CONFIRMED #1 (two cycles running, now with code anchors) · One-directional difficulty adaptivity.** The whole adaptive stack (`stompStreak`/`_stomp` battle.js:167-172, 2192, 2212) only ramps difficulty UP on flawless wins; there is no downward branch, so the panicky player stays 0/8 with no relief. FIX: persist a `struggleStreak` in state.js aiProfile — increment on loss, reset on win — and soften enemy burst/HP/pressure while struggleStreak≥2, mirroring the existing stompStreak up-ramp. This is the single highest-leverage fix and it was independently re-derived by the panicky AND lazy personas again.

**CONFIRMED #2 (two cycles) · The kit is strictly optional — move+basic is a complete win condition.** A cautious kiter who relies on skills isn't rewarded; a masher who ignores them still wins 75%. Every ability (Q/E/ult/shield/dodge) is bypassable. FIX candidates (both grounded in already-built systems): (a) repurpose the enemy ward system (tickWards + reflect/protect/barrier, wardCd battle.js:722) into a recurring "abilities are the answer" wall once a pack is at low HP, so basics alone can't close; (b) make the unmarked-basic ×0.7 tax (battle.js:~5204) scale toward near-zero as enemy HP drops so the final ~28% needs a status/stagger/element hit.

New/sharpened this cycle:
- **P1 · Masher smash death is deterministic + has NO mercy curve, unlike the ult.** The only unblockable move (`max(e.dmg*1.6, f.maxhp*0.26)`, battle.js:~4993) is exactly why both losses cap at identical 428 — but the charged *ult* already eases on a low team (`losing` throttle, battle.js:4708) while the smash does not. FIX: once-per-fight non-lethal floor (to 1 HP) + a player-anchored red vignette "LEAVE THE CIRCLE" tell on the first lethal smash (teach, not execute); give the smash the same anti-snowball throttle the ult has; exempt hardcore.
- **P1 · Cautious kiter has no honest win path + the human cat is a 4th wheel.** Player drives 1 of 3 cats; the other two auto-fight at full autonomy, so a patient poke doesn't matter and the 38.2s timeout is the result. FIX: add a 3rd effect to the `_closing` ramp (battle.js:4233) — a patience-rewarding 斗志/poise erosion past ~45s so careful play converges a win; and/or let dodge-chip compound into an attrition kill.
- **P1 · Critical-HP still has no screen-space scream** (re-confirmed from last cycle): no vignette/heartbeat/low-HP warning anywhere — only the peripheral top-left panel + a 0.09s per-hit flash, so "one second swinging, next fainted" is literally accurate.
- **P1 · Starter Q is a *weaker* left-click** (pow 0.8 vs basic 1.0, same art, 4.5s CD) with a deliberately suppressed label — the mid-tier verb gets the least feedback while basics and ults get lavish juice. FIX: floor starter Q to clearly out-damage a basic + give it a distinct cast flash/ring/audio + '+ULT' tick.
- **P2 cluster (legibility, re-confirmed):** `#battle-enemy-hp-fill` sums ALL enemies instead of the focused target (a "lying gauge"); BARRIER absorbs are silent while PROTECT/REFLECT float text; auto-battle discoverability is circular (only taught after a loss that's gated behind already knowing). All UI/plumbing, no balance risk.

**Verdict:** combat does NOT read healthy this cycle — the two structural findings (one-directional adaptivity, optional kit) are reproduced across two consecutive crons and are now the clear next targets. Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-23T17:47:47Z: no agent proposal beat the MOBA judge; archive coverage 2/64.
Proposed 5 deliberately EXTREME/recombinant bands this cycle to try to escape the 2-cell rut (pure-melee-lock 18-40px, extreme-kite 210-330 flee-out, hp-bimodal-flip, recombine-elite-midpoint, cd-aware-lunge). None beat baseline (0.740) and NONE landed in a new behavior bin — the archive stayed at cells 1,3,3 (baseline) + 1,2,3 (stand-at-max 0.692). Signal worth an owner note: even a hard 18-40px melee lock and a 210-330 flee-outward kite did NOT move the emergent engage/durability descriptor out of its current bins, i.e. the sim's own steering (autoDrive + band-follow) regresses any proposed band toward a mid standoff, so pure positioning-band mutation has likely saturated what this harness can explore. Future proposals probably need a different lever (action cadence / target selection) rather than more standoff-distance variants. Findings-only: no band applied, no commit, no push; agent-candidates.json overwritten.

## Playtest cron 2026-11-23T18:30Z (6 personas × 8 battles, current code f036a5e6 incl. S1/S2/S3 + 烫伤)
**Headline:** *"Combat is mechanically rich and well-balanced but structurally SILENT — every system that decides a fight (level gap, the skill-priming economy, capture thresholds, passivity, the ult) is legible to the code and invisible to the player, so each persona bounces off a different unspoken rule rather than a tuning problem."* 47 critiques (31 P1 / 16 P2), 60/65 agents (5 StructuredOutput fails). Findings-only — nothing auto-applied, no push.

**New dominant theme this cycle · "legible to code, invisible to player."** Unlike prior cycles (which blamed tuning/adaptivity), the adversary converged on a LEGIBILITY diagnosis: the mechanics are sound, but the player is never told which one is deciding the fight. Highest-leverage, all pure UI/telemetry (no balance risk):
- **P1 · Level gap is the biggest win/loss determinant and is invisible.** battle.js:73-77 already ramps enemyDmgMult→1.90 / playerDmgMult→0.60 when the wild out-levels you ("越级危险", intended) — this is exactly why masher losses pin to a deterministic 428 wipe. game.js:~975 prints the wild level as a bare "Lv.9" with no reference to the player's squad average and no danger badge; the flee screen gives ZERO cause attribution. FIX (do NOT touch the dmgMult logistics — they're working as intended): a color-coded danger badge on the wild-name header keyed off the already-stored `battle._levelGap` (gap≤-2 → "⚠ 强敌·高你2级", ≤-4 → "💀 越级") BEFORE the player commits, + a one-line causal flee/defeat screen ("野猫高你X级 — 越级很危险，试试闪避或先升一级").
- **P1 · Critical-HP still has no center-screen/diegetic warning** (3rd cycle confirming). The low-HP cue exists (game.js:1550-1559 red bar + .low-hp pulse at frac≤0.25) but is confined to the ~60px top-left corner panel, off-fovea for a player watching the center arena. FIX: arena-space red edge vignette keyed off `this.me().hp/maxhp` at the existing draw hook (battle.js:~6018 where `this.flash` renders), intensifying + heartbeat-pulsing toward 0, plus a red tint/tremble on the player's own cat sprite. Engine already has flash/slowmo/hitstop plumbing unused for this.

**CONFIRMED (3rd consecutive cycle) · The kit is strictly optional — left-click alone wins.** Now with the exact code path: addCombo(1) on every basic (5452) so basics sustain the whole chain; ult charges passively + per basic hit (4163/5561); basics break poise too and get the ×1.8 subdued multiplier (<28% HP, 5336), so raw basic DPS closes every fight incl. the capture line; even the reflect wall is bypassed by melee basics (986). The mash-stall detector (4314) KNOWS the player is only mashing and does nothing but pulse a toothless banner. FIX (concrete this cycle): convert the stall detector into a real GATE — add a `braceT` guard state to enemies (makeEnemy ~722) on a cooldown so even starter wilds raise it once/fight; while braceT>0, resolveHit hard-caps BASIC damage to ~15% so the enemy can ONLY be cracked by a Q/E skill hit or a perfect-dodge punish. First enemy STATE that is immune to basics and vulnerable only to a skill.

Other confirmed P1s:
- **Cautious kiter / panicky: no forcing function + no defensive win axis** (re-confirmed). The game "has no answer for a player who opts out" — all win vectors are offensive, so a patient kiter stalls to the 85s backstop flee.
- **Explorer: casual default difficulty deletes stakes** — 8/8 wins, 0 faints, 8.5–19.1s clears; dodging never matters because nothing threatens. The escalation content exists but is gated behind a difficulty the target player won't switch to.
- **Capture is not a verb** (手忙脚乱): the game is themed/UI'd as a CAPTURE game but capture just happens at a HP threshold — the player never performs a capture action.
- **Auto-battle / pre-battle picker already ship but don't get discovered** (lazy + panicky both): the feature exists (ui.js openBattleModePrompt / openCapturePrep) yet the persona never found it — a discoverability, not a feature, gap.

**Note:** this cycle ran on current code WITH S1/S2/S3 coordination + 烫伤 now in the tree. The coordination work is not implicated in any finding (the squad-AI changes are orthogonal to these legibility/forcing-function gaps). The twice-prior "one-directional adaptivity" finding did NOT resurface as the top theme this cycle — legibility dominated — but the underlying optional-kit/forcing-function gap is now THREE-cycle confirmed and is the clear combat-depth target. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-23T19:30Z (6 personas × 8 battles, current code f036a5e6 incl. S1/S2/S3 + 烫伤)
**Headline:** *"Cat Bond's combat is mechanically rich but its reward economy is INVERTED — aggression, defense, and the ult meter all fail to pay off the inputs players actually make, while one real bug (uncapped radial-burst convergence) delivers unparseable one-shots."* 51 critiques (1 P0 / 35 P1 / 15 P2), 64/66 agents (2 StructuredOutput fails). Findings-only — nothing auto-applied, no push.

**⭐ NEW REAL BUG (root cause of the recurring "428 one-shot") · Uncapped radial-burst convergence.** The lethal enemy nova / enemyUlt burst spawns 12–20 pellets via bare `spawnProj` (battle.js:~5019-5022, ~5068-5071) with NO per-enemy hit cap (unlike `castVolley`, which budgets hits). A stationary/heads-down cat standing at the center eats ALL overlapping pellets in a single frame → the deterministic ~428 = full-team wipe the masher "couldn't parse." This is a genuine defect, not telegraphy: the telegraph layer is already dense (discs, glow, reticle, toasts). FIX: give the nova + enemyUlt pellet loops a shared `_volley` budget like castVolley (perEnemyCap ~3-4 attached to each spawnProj) so convergence can't stack into a one-frame delete. **This is the highest-value single fix this cycle — a real bug with a clear root cause.**

**P0 (adversary-labeled) · Death-spiral + opaque wipe-vs-timeout framing** — this is the 3rd-cycle "one-directional adaptivity" finding, now with the compounding mechanic pinned: `commitAiProfile` ramps enemies HARDER after flawless wins (stompStreak) but has NO mercy ramp, AND `_deathPenaltyUntil` slaps a 3-min ×0.88 damage debuff on every fainted cat that carries into the next fight (battle.js:5786 / consumed :773) → lose → shaken cats → lose again, an unbounded negative loop. Compounded by `finish()` collapsing team-WIPE and the 85s time-backstop into the identical "野猫逃走/got away" screen, so a panicky player literally can't tell they died to damage. FIX: add a `lossStreak` to aiProfile (mirror stompStreak) — bend enemyDmgMult/enemyHpScaleGap toward ≤1.0 when lossStreak≥2, and skip the _deathPenaltyUntil debuff while lossStreak≥1; surface a distinct "你的队伍被击倒了/Your team was knocked out" line on the wipe path. **This is the FOURTH cycle flagging the missing downward difficulty branch — now escalated to P0.**

**CONFIRMED inverted reward economy (the headline, multiple personas):**
- **Masher:** the only lever a never-dodge player drives is the combo chain, but comboMult caps at +20% (~+8% at 10 combo) and is purely offensive — sustained aggression buys zero survivability, so the 75% win rate feels unearned/RNG. FIX: give the combo milestone a defensive/tempo payoff (short shield or ~5% heal every 10 combo, and/or scale autoDodgeChance up with combo) so pressure converts to life.
- **Cautious kiter:** every expression reward in battle.js is wired against patient play — no reward path exists for opting out of aggression.
- **Impatient / panicky:** the ult is strategically dead for pace-sensitive players (charges too slow to matter in a sub-20s fight); sustained aggression's only payoff is a damage number nobody feels.
- **Explorer:** casual default difficulty still deletes stakes (fast clears, 0 faints) so none of the depth is incentivized.

**Still-standing legibility items (from prior cycle, unfixed):** level-gap invisibility (bare "Lv.9", no danger badge, no causal defeat line); critical-HP cue trapped in the 60px corner panel with no center-screen vignette/heartbeat; the smash's only warning channels (ground disc + toast) are exactly the two a heads-down masher ignores + the 'crash' SFX fires on release, too late — add a RISING audio sting at telegraph START.

**Verdict:** combat does NOT read healthy — and this cycle found a concrete **real bug** (uncapped radial-burst convergence) that is the mechanical root of the long-reported "unparseable 428 one-shot," plus the missing downward-difficulty branch is now 4×-confirmed and adversary-escalated to P0. Both are precise, low-risk, high-value fixes. The S1/S2/S3 coordination + 烫伤 work remains un-implicated. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-23T20:30Z (6 personas × 8 battles, current code incl. enemy-basic-anim + yard-level fixes)
**Headline:** *"Combat systems are richer than any single playthrough reveals — fun is capped not by balance but by a FEEDBACK VOID (player peril + clutch wins are computed every frame yet never shown) and by whole archetypes (kiter, explorer) hitting invisible walls the code already flags as unfinished."* 50 critiques (37 P1 / 13 P2), 63/64 agents (1 StructuredOutput fail). Findings-only — nothing auto-applied, no push.

**CONVERGENT with the last 4 cycles — two themes keep winning:**
1. **Feedback void (player-state danger never rendered).** The engine computes `teamHpFrac` every frame (battle.js:4296) and throws it away: a 7%-HP clutch frame looks identical to a 100% frame — no vignette, heartbeat, or red-edge, so the intended "I barely made it!" high lands as numb anxiety ("血条吓死人"). All shipped warnings are ENEMY-action-centric + action-demanding (dodge/interrupt toasts) — exactly the cue type a masher filters out. FIX (pure render, off values hurtMe/teamHpFrac already compute): a player-danger layer — red screen-edge vignette whose alpha scales inverse to HP below ~30% + heartbeat pulse; on a capture kill while teamHpFrac<0.25, extend slowmo + swap the banner to "险胜!/CLUTCH!". Converts the invisible win into a sold, earned moment with zero balance change.
2. **Asymmetric difficulty ratchet (5th-cycle confirm).** commitAiProfile (~L2285) ramps UP on dominance, never DOWN — same missing lossStreak/mercy branch. Explorer independently "found the dead zone in the adaptive-difficulty system."

**New, sharper this cycle — the smash forcing-function is a WALL not a slope for non-dodgers:**
- The must-dodge smash (`max(e.dmg*1.6, f.maxhp*0.26)`, ~L5077) is UNBLOCKABLE, flat across the whole R=86 disc (no radial falloff — clipping the rim costs the same as dead-center), and under _pressure>0.6 TWO enemies can smash in one window (~52% max HP). It arms on a hidden teamHpFrac>0.88 gate, and the escalation never consults the player's OBSERVED dodge rate (`_obs.dodgedThreats/threats`, persisted `aiP.evasive`) — so it runs a dodge-exam against a masher whose dodge rate is ~0. That's a stealth softlock for one archetype. FIX: (a) radial falloff on the smash (full dmg only in inner ~40% of R, ~8-10% max HP at the rim) so the dodge reward is preserved but the all-or-nothing cliff is gone; (b) gate the escalation on observed competence — if dodge rate ≈0, don't stack two smashes and trim the max-HP fraction (0.26→~0.15) + lengthen the telegraph. Still teaches "leave the circle," but a pure attacker hits a slope.
- **Kiter archetype is code-admittedly locked out** (谨慎型, 9 critiques — the most this cycle): "an entire legitimate poke-and-wait archetype" has no honest win path; the 38.2s identical-timeout is structural, and the code "admits it" with an unfinished dead-zone branch.

**Note:** ran on current code incl. today's enemy-basic-anim + yard-level commits; those are un-implicated (no finding references them). The enemy-lunge-animation + 🐛-debug-button restore landed AFTER this sim started, so next cycle will be the first to test them. Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-23T20:53:23Z: no agent proposal beat the MOBA judge; archive coverage 2/64.
Proposed 5 candidates explicitly aimed at the EMPTY descriptor extremes (off-band 345-430 kite → engage-bin0; 4-28px face-hug → low durability bin; CD phase-swing 20↔360; elite-midpoint 170-250; panic-flee bimodal). None beat baseline (0.736) and — again — NONE landed in a new behavior cell; archive stays at 1,3,3 (baseline) + 1,2,3 (stand-at-max 0.702). STRUCTURAL CONCLUSION (now 3 cycles consistent): even a hard 345-430px off-band kite and a 4-28px face-hug get REGRESSED back to engage-bin1 / durability-bin3 — the cat's own bandSteer + the enemy's pursuit drag any extreme proposed band back to a mid-standoff that keeps it inside [15,320]px and barely hurt, so the behavior DESCRIPTOR is near-invariant to the positioning band. Pure positioning-band mutation cannot populate the archive further; the harness needs a new control lever (action cadence / dodge policy / target selection) OR the descriptor must read the proposed band directly rather than the regressed emergent position. Flagged for owner — this is a harness-design limit, not a bad-proposal problem. Findings-only: no band applied, no commit, no push; agent-candidates.json overwritten.

## Playtest cron 2026-11-23T21:30Z (6 personas × 8 battles, FIRST cycle with enemy-lunge-anim + yard-level + enemy-basic-anim fixes)
**Headline:** *"Combat depth is real but GATED TO PLAYERS WHO ALREADY WIN — every teach beat, escalation, and forcing function keys off OUTCOME proxies (enemy <20% HP, flawless streaks, >88% team HP) that strugglers and low-raters can never reach, so the masher walls in silence, the kiter draws out the clock, the explorer out-levels static content."* 47 critiques (29 P1 / 18 P2), 60/64 agents (4 StructuredOutput fails). Findings-only — nothing auto-applied, no push.

**✅ FIX VERIFICATION (this cycle first tested the 4 unpushed commits):** ZERO critiques about enemy teleport / single-frame lunge (the advanceLunge-in-live-loop fix held — enemy突进/飞扑 now animate), and ZERO about trivial yard wild levels (yard-follows-team held). The enemy-basic-anim + debug-button restores drew no regressions either. Today's combat commits are clean — no finding references them.

**THE unifying root cause this cycle (sharpest framing in 6 cycles) — teach/escalation gated on OUTCOME, not BEHAVIOR:**
- **Masher walls at 33% HP in a dead band.** The whole anti-stall stack — mash-stall "use a SKILL" banner (~L4316), subdued-poise ×1.8 (L5360), executeBonus (L5497), closeBonus (L5503) — is ALL gated to enemy HP <0.20-0.28. A basic-only player whose damage plateaus at 33% sits ABOVE every trigger, so the forcing function fires but the TEACHING never does. FIX: rework the mash-stall detector (~L4315) to latch off a BEHAVIORAL DPS-wall signal (fight age >15s AND attacking AND enemy HP dropped <5% over a ~6s window AND no poise break) REGARDLESS of absolute enemy HP → the masher sees "use a skill" at ~18s instead of never; extend closeBonus/subdued-poise (reduced) above 0.28 once the behavioral stall latches so the lesson has a payoff.
- **>88% team-HP escalation gate (`_pressure`)** only ramps against the already-winning player; the struggler never triggers the content. Same OUTCOME-proxy flaw.
- **Flawless-streak-only difficulty ramp** (commitAiProfile) — 6th-cycle confirm of the missing downward branch.

**Recurring, now with concrete fixes:**
- **Masher churn cliff — aggression buys zero survivability.** Every defensive system auto-fires for AI cats (autoDodgeChance→0.8, auto-shield) but the manually-driven cat gets none; attack only grants +20% dmg via comboMult, never life. FIX (bridges offense→sustain WITHOUT touching enemy damage or auto-dodging for the player): combo-scaled lifesteal on the active cat's landed hits (0.5/1.5/2.5% of dealt at combo ≥10/25/45, per-sec capped) + a one-shot "try Dodge/Shield" coach the first sub-15% win.
- **Feedback void / no screen-space near-death cue** (re-confirmed): low-HP legibility lives only in the top-left DOM panel; arena cues scale with per-hit dmg fraction not proximity-to-death, so the last 30% is N identical small flashes then a faint. FIX: red edge vignette keyed off me().hp<~0.30 at the existing this.flash draw hook (~L6043), sin-pulse intensifying toward 0, + a low-HP heartbeat SFX branch in hurtMe; one CRIT_HP_FRAC=0.30 constant.
- **Auto-AI is basic-first by construction** (lazy persona): emits mostly basics (the owner's "太智能/躲得太准" is a separate axis — this persona wants it to USE skills more). Noted but orthogonal.

**Verdict:** combat does NOT read healthy — but the 6-cycle convergence is now a single crisp lever: **re-key the teach/escalation/forcing-functions off behavioral signals (DPS-slope, input-mix, dodge-rate, loss-streak) instead of outcome proxies (enemy-HP%, flawless-streak, team-HP%).** That one reframe addresses the masher wall, the explorer dead-zone, the panicky death-spiral, and the kiter clock at once. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-23T22:30Z (6 personas × 8 battles — RECOVERED from a harness crash; first cycle w/ dodge-nerf + role-gate + 幽幽 key-floor)
**Harness note:** the workflow's own SYNTHESIS step threw (`c.critique.verdict` null — a StructuredOutput failure left a null critique the post-processing didn't guard; 6 agents errored, 59 completed). I recovered the findings directly from the run journal (47 critic objects + 6 persona-player summaries) rather than re-run. No synthesized headline this cycle; ranking is from the raw critiques.

**Player fun ratings (match prior cycles):** cautious kiter **2**, panicky **4**, impatient **5**, masher **6**, auto-battler **6**, explorer **7**. 47 critiques (34 P1 / 13 P2), 36 verdict=real-problem.

**✅ FIX VERIFICATION (first cycle testing 6 unpushed commits):** zero critiques about 躲得太准/robotic-dodging (the auto-dodge nerf held — no persona complained the AI was an untouchable strafer this cycle), zero about 陨石术/role-equip, zero about 幽幽/map-soft-lock, and zero teleport/yard-level regressions. Today's 6 commits drew no negative findings.

**Convergent root causes (6th+ cycle — unchanged, all P1, all with code anchors):**
- **Kiter has no win path (fun 2, lowest every cycle).** "A missing playstyle the code confirms" — poke-and-retreat can't win; the only timeout is the 85s flee-backstop, so a careful kiter draws out an unwinnable clock. Still the #1 archetype hole.
- **One-dimensional pressure + asymmetric ratchet.** `_pressure` (battle.js:4303) + must-dodge smash (4824) ramp only against the healthy/winning player; the anti-stomp escalation has no downward branch. Same missing lossStreak/mercy (now ~7 cycles).
- **Masher: aggression buys no survival; avgHpFracLeft 0.24 is a LYING average** over a bimodal (flawless-win vs sudden-death) distribution — a photo-finish-or-corpse spread, not a smooth 24%.
- **Execute MATH but no execute ACTION — "the UI lies about it".** The <28% capture/execute threshold exists in math but there's no player-facing execute move/affordance; the impatient player "couldn't tell if winning."
- **ult=0 / E≈2 casts across 8 battles** (multiple personas): the ult + E economy still doesn't pay off the presses; the team's own gainUlt/tickUltReminder mitigations haven't closed it.
- **Auto-battle is a metronome** (lazy, fun 6): the auto core-loop "is watching the AI fight and it's a metronome" — no sequencing/variety; discoverability static + sticky, wrong for the impatient cohort.

**Verdict:** combat does NOT read healthy — but today's 6 fixes are clean (no regressions, no new complaints about them). The standing targets are unchanged and now maximally corroborated: (1) a kiter/defensive win axis, (2) the downward difficulty branch, (3) a real execute action + honest ult/E payoff. Owner review pending; no code changed, no commit, no push (cron rule). Recommend a harness guard (`c && c.critique && c.critique.verdict`) in cat-bond-playtest.js synthesis so a single null critique can't crash the whole run again.

## Playtest cron 2026-11-23T23:30Z (6 personas × 8 battles, current code — harness null-guard now holds)
**Harness:** the null-critique guard added this cycle WORKED — the run completed with a full synthesis + ranked fixes despite 3 StructuredOutput agent failures (which crashed the prior cycle). No recovery needed.

**Headline:** *"Combat is mechanically deep but LEGIBILITY-STARVED: nearly every anti-mash, anti-kite, and forcing-function system is gated behind states the struggling player can't reach (near-death HP, player-dominance, close range), so the rich kit reads as decorative for 5 of 6 personas — and the one happy persona (masher, 7/10) is happy only because the game never makes him use it."* 48 critiques (33 P1 / 15 P2), 61/64 agents.

**Synth-ranked fixes (first time the synthesizer produced a clean P0→P2 ladder — this IS the 7-cycle convergence, now actionable):**
- **P0 · Make the basic-attack economy legible AND self-priming.** Unmarked basics silently do ×0.7 (battle.js:5305-5308), "roar" +45% only after Q/E applies a tag — a masher is taxed 30% on every hit with ZERO in-combat signal, and the mash-stall "use a skill" banner is gated behind enemy HP<0.2 so it only fires once he's nearly won. FIX: add an HP-INDEPENDENT teach trigger (basics-only for ~6s on a tag-less target → "用技能破防/Prime with a skill!" banner + Q/E flash at 50-70% HP), and optionally let sustained unmarked basics self-apply a light "scratch" mark so pure mashing ramps instead of flatlining at ×0.7.
- **P0 · Decouple defensive forcing functions from player-DOMINANCE.** The must-dodge smash gates on `dominating = _stomp≥0.3 || _pressure≥0.35`, and `_pressure` only rises when the player cruises UNTOUCHED — so a face-tanking masher never crosses the gate and the one "you must dodge" test is invisible to exactly the player it's for. FIX: key the smash/forcing-functions off TOOL-NEGLECT (past tutorial + healthy + everUsedDodge/Shield false after ~8-10s of pure basics) instead of dominance; also wire `_closing` into enemy reach.
- **P1 · Surface pace/progress** — live clock/trajectory, replace the flat 85s timeout (the kiter/impatient "couldn't tell if winning" + "clock beat me not the boss").
- **P1 · Anti-stomp reachable (graded dominance ladder) + a losing-side MERCY band** — the ~7-cycle missing downward difficulty branch, now paired with "make the UP-ramp reachable too."
- **P1 · Invert the skill cadence/economy so aggression EARNS abilities** (vs the 9s ult auto-cast crutch that presses R for the player and confirms "holding attack is enough").
- **P1 · Orthogonal enemy-archetype axis + the positional-role bug** (every fight reads identical).
- **P2 · Combo crescendo is a dead conditioning loop** that cheers the masher while HP silently bleeds (reward loop vs survival loop point opposite ways); + move the ult-ready cue onto the player's cat; + combo-scaled life-on-hit / once-per-cat Last Stand for aggression-sustain.

**✅ Today's 6 unpushed fixes stay clean** — no critiques about robotic dodging, role-equip, map soft-lock, enemy-lunge, or yard levels this cycle either.

**Verdict:** combat does NOT read healthy, but the diagnosis has fully crystallized into a **2×P0 lever**: (1) make the basic→skill priming economy legible + self-ramping, (2) fire the defensive forcing-functions off tool-NEGLECT not dominance. Everything else (mercy band, pace clock, enemy variety) is downstream. Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-23T23:47:09Z: no agent proposal beat the MOBA judge; archive coverage 2/64. ⚠️ CONTROL-CHECK FAILED.
This cycle I varied a NEW lever — the band's `role`/`rush` tags (not just min/max distance), since the band fn fully replaces kitRangeBand and bandSteer reads role/rush. 5 candidates (role-tag-kiter, role-tag-bruiser, rush-equals-max, cd-role-flip, baseline-role-mutation). None beat baseline and none filled a new cell (archive still 2/64).
⚠️ **HARNESS FINDING for owner (recurring — also seen 06:02):** the deliberately-BAD control `stand-at-max-range` (a passive max-range kiter that should rank LAST) scored **0.756 vs baseline 0.707** on the MOBA ground-truth judge this run — i.e. the judge is being FOOLED by passivity at this operating point, and the harness correctly FAILED the control-sanity assertion. This is NOT a bad-proposal problem; it's the judge/sim over-rewarding a stand-at-range strategy (likely because the pinned/held-out scenario lets a kiter farm output while taking little damage → high survival+output, low penalty). The 2-cell archive stagnation and this control-fail share the same root: the sim's scenario set + judge weighting don't sufficiently punish passive non-engagement, so (a) extreme bands regress to mid-standoff AND (b) a passive control can out-score the tuned default. Recommended owner action: either add a "must-pressure / idle-penalty" term to the judge (penalize low distinct-engagement or long time-to-kill even when survival is high), or add an aggressive-enemy scenario that punishes standing at range. Findings-only: no band applied, no commit, no push; agent-candidates.json overwritten.

## Playtest cron 2026-11-24T00:05Z (6 personas × 8 battles, current code; harness guard held again)
**Headline:** *"Combat is mechanically sound but FEEDBACK-LOPSIDED: every dramatic cue (slowmo, flash, banner, the ult/combo crescendo) is spent on OFFENSE and skilled play, while player DANGER, patience, mashing, and auto-watching are starved of the one thing each persona needs to feel — so most personas sit at 3–6/10 sensing a ceiling they can't name."* 45 critiques (31 P1 / 14 P2), 58/63 agents. Findings-only.

**Synth-ranked fixes — the convergence crystallized to a single P0 this cycle:**
- **P0 · Mirror the capture drama onto the PLAYER.** `teamHpFrac` is computed every frame (battle.js:4308) but only feeds AI rubber-banding — never the screen. All danger legibility is a ~4px corner DOM slot a masher never looks at. FIX (pure render, no balance): red pulsing edge vignette + rising heartbeat below ~25% active-cat HP (mirror the warm capture vignette at ~6540, inverted to threat), AND a "险胜!/Clutch!" win beat when the fight's min-HP dip went below ~15% — so a knife-edge win reads differently from a comfy one. This is now the 8-cycle-convergent #1 and the adversary ranked it the sole P0.
- **P1 · Pull the `_closing` ramp forward to ~14-30s + render it as a visible 收网 telegraph** (vs the invisible 45→70s ramp): gives the kiter/impatient a legible pace clock.
- **P1 · Replace the binary flawless `stompStreak` gate with a MARGIN-based comfort streak + feed skill-use into enemy HP** — the ~8-cycle "asymmetric ratchet / anti-stomp unreachable" finding, now phrased as "make the UP-ramp graded AND add the downward branch."
- **P1 · Flip the ult economy from passive-timer to earned-and-reachable** (vs the 9s auto-cast crutch).
- **P1 · Give patience AND relentless-mashing a real win path at the timeout, not a flat flee** — near-timeout mercy: if the wild is below ~40% when the clock expires, resolve as a partial capture/reward instead of zeroing 35s of effort.
- **P2 · Broaden the mash-stall teach from "<20% pinned" to an early DPS-starvation detector** (fire the "use a skill" banner at ~8-10s when basics-only + enemy HP barely moved) — directly the legibility half of the long-standing optional-kit finding.
- **P2 · Lock-and-key enemy beat** (skills/elements/dodge sometimes REQUIRED). **P3 · Decouple basic JUICE from power** so mashing feels escalating without reopening balance.

**✅ Today's 7 unpushed commits stay clean** — no critiques about robotic dodging (dodge-nerf held), role-equip, map soft-lock, enemy-lunge, or yard levels.

**Verdict:** combat does NOT read healthy, but after 8 cycles the diagnosis is unambiguous and the adversary itself collapsed it to ONE P0: **the fights are already close/earned — the game just never lets the player FEEL danger or a clutch win.** It's a pure render/feedback fix (no balance risk), and it's the highest-leverage single change on the board. Everything else (pace clock, margin-ramp, ult economy, timeout mercy) is P1 downstream. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T01:30Z (6 personas × 8 battles; first cycle w/ camo rework + melee reach-75/gate + danger-feedback live)
**Headline:** *"Combat is mechanically rich but its pacing, depth, and payoff systems are gated behind HP/TIME thresholds tuned for cohorts that barely exist — so every real persona lands in a DEAD ZONE where skills, variety, and climax are structurally unreachable."* 47 critiques (35 P1 / 12 P2), 60/63 agents. Findings-only.

**✅ Recent work verified clean:** no critiques about the 纸箱 camo rework, the melee reach-75 / Q/E fire-gate fix (松松荆缠), the enemy-lunge animation, or map/yard/role-gate. The P0 player-danger vignette + 险胜 beat I shipped is even cited as *present* ("crit-HP state already computed … CRIT_HP_FRAC=0.25, _inCrit") — the adversary now wants it to do MORE (see below), not that it's missing.

**Synth-ranked — two P0s, both "retime the threshold," plus a NEW concrete onboarding bug:**
- **P0 · The 12–45s pacing dead zone.** A mutual-33%-HP basics-only grind hits NOTHING: the mash-stall "use a skill" banner gates on enemy HP<20% (never fired at 33%), `_closing` execute ramp starts at t>45s (fight died at 35s), `closeBonus` only <28% HP, `_pressure` needs teamHp>0.88. FIX: fire the teach banner on a STALL SIGNATURE (fight > ~1.3× expected AND basic-dominant input AND enemy HP flatlined) at ~18-22s regardless of HP; pull `_closing` start from 45s → ~22-25s so the execute assist overlaps the stall.
- **P0 · Identical-fight convergence** (explorer 8/8, byte-identical): enemy archetype + encounter are deterministic. FIX: roll enemy archetype via RNG + add ONE strategy-flipping affix per encounter (vs adding more content).
- **⭐ NEW BUG · first-fight coach auto-graduates button-ignorers.** `tickCoach` (battle.js ~284-322) has action-gated 'skill'/'dodge' steps that *should* require pressing Q + Space once — but line ~300 auto-advances ANY gated step after 12s, so a masher who ignores the prompt waits it out and gets `manualTutorialSeen=true` having pressed zero taught buttons (the e=0/dodge=0 trace). FIX: exempt 'skill'/'dodge' from the 12s auto-advance (keep it only for move/attack) + a guaranteed telegraphed must-dodge smash during the dodge step, so fight 1 is unclearable until Q + Space are each pressed once. **This is a real, bounded onboarding defect — the cheapest "make the kit matter" lever found so far.**

**Recurring P1s (unchanged):** silent skill mis-fire (skillQ/E `return false` on CD with no audio/feedback → 13 presses, 3 casts, 10 vanish); auto-battle ult/dodge payoff still off in auto mode; combo heat not routed to a FEEL crescendo; crit-HP state is "detected but unexploited" — wants a once-per-fight 'second wind' relief valve on top of the vignette.

**Verdict:** combat does NOT read healthy, but today's shipped fixes are clean and the diagnosis keeps tightening. The single **highest-value + lowest-risk** new item is the **coach auto-advance bug** (fight 1 must force one skill + one dodge) — it's a real defect, bounded, and directly converts the "kit is decorative" root cause the adversary has flagged for ~9 cycles. The two P0 retimings (stall-signature teach + earlier `_closing`) are next. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T02:30Z (6 personas × 8 battles; code just before thunderStream gate/charge/jagged landed)
**Headline:** *"Combat is mechanically deep but every system built to TEACH, RESCUE, or REWARD fires only in states the actual players never enter — mashers get silent throttles, kiters get cost-free stalemates, the panicky get a one-way difficulty ratchet, and defense/ult/combo feedback is invisible or flat."* 50 critiques (33 P1 / 17 P2), 63/64 agents. Findings-only.

**Synth-ranked — the P0 is now unambiguous (9-cycle convergence):**
- **P0 · Build the MISSING HALF of the difficulty loop.** Every live-difficulty system is one-directional: `_pressure` (battle.js:4363) only ramps while teamHp>0.88, the must-dodge smash only arms while dominating, `stompStreak` only punishes flawless wins — grep for comeback/mercy/relief/lossStreak finds NOTHING. There's elaborate code to squeeze a DOMINATING player and zero to catch a DROWNING one. FIX: (1) a time-driven enemy-pressure ramp independent of teamHp, AND (2) a symmetric **loss-side comeback band** — when teamHpFrac<0.35 AND not dominating, lengthen enemy fireCd + fire the smash less often (mirror of the existing dominating logic; NO HP/damage buffs, just stop the pile-on). This is the ~9th cycle flagging the missing downward branch — now the sole P0.
- **P1 · Move every teach beat OUT of unreachable states.** The mash-stall "use a skill" teach + rubber-band only arm below 20% enemy HP; the `_closing` resolve ramp starts at 45s — a 33%-HP/35s stall sits ABOVE all of them, so the masher gets full punishment with zero instruction in the 20-45% window. Also: the first-fight coach has **NO shield step** (shield is never taught to anyone → everUsedShield=false is honest, not player failure) and is skipped entirely in auto mode. FIX: fire the teach beat on a stall SIGNATURE (onlyBasics + t>12 + enemy-HP-not-dropping) regardless of absolute HP; add shield + ult coach steps; don't skip the coach in auto.
- **P1 · The player-danger layer I shipped (vignette+heartbeat+险胜) failed the masher** for two structural reasons: (a) the crit sting reuses `combat_hurt` — the SAME sample as every hit, so it's perceptually invisible to a facetanker; (b) `_dangerFrac` tracks only the ACTIVE cat, so a reserve-sub resets the vignette to full instead of escalating toward the team-wipe. FIX: distinct alarm sample + a pre-crit ~45% tier; redefine `_dangerFrac = max(active-cat danger, team-wipe danger)` so the last-stand case escalates. (Good news: the system is cited as *present and correctly built* — just needs these two refinements, not a rebuild.)
- **P1 · Ult = passive metronome, combo loop flat** (re-confirmed): earn-the-ult crescendo + un-flatten combo.

**✅ Lightning work not implicated** — no critiques about thunderStream targeting/visual or lightningOrb split (this sim predates the gate/charge/jagged commit; next cycle is the first to test those).

**Verdict:** combat does NOT read healthy — but the diagnosis is now a single crisp P0 (the comeback band / downward difficulty branch, ~9 cycles) plus the "teach beats fire in unreachable states" P1 cluster. The player-danger feedback I shipped is confirmed present+correct, just needs a distinct alarm + team-wipe escalation. Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-24T02:53:25Z: no agent proposal beat the MOBA judge; archive coverage 2/64. ⚠️ control-check FAILED on HELD-OUT seeds.
Proposed 5 active/aggressive candidates (rusher-aware-pressure-hug, cd-burst-dive, hp-ramp-brawler, recombine-elite-inward, cd-ranged-poke) chosen to exploit the new idle-penalty + solo-rusher judge. None beat baseline; archive still 2/64 (cells 1,3,3 baseline 0.687 + 1,2,3 stand-at-max 0.683).
⚠️ **HARNESS FINDING for owner — the idle-penalty/rusher judge fix is SEED-OVERFIT.** On the TRAINING seeds the passive control now correctly ranks below baseline (0.683 < 0.687, the fix worked there), but this cycle's control-check runs on the DISJOINT HELD-OUT seeds [13,202,999], and on THOSE the bad `stand-at-max-range` control still edges baseline (0.683 vs 0.677) → control-check FAILS. So IDLE_W=0.34 + the rusher scenario reduced but did NOT robustly eliminate the judge's passivity exploit across unseen seeds. Options for the owner: (a) raise IDLE_W / steepen the penalty exponent until the control loses on held-out seeds too; (b) make solo-rusher harsher (more aggro/speed) so a kiter genuinely bleeds there; (c) accept a small residual and relax the control-check to a margin (e.g. control must be within noise, not strictly below) — but that weakens the guard. This is the same root the PLAYTEST crons keep flagging (passive/kiter play under-punished); the two harnesses agree. Findings-only: no band applied, no commit, no push; agent-candidates.json overwritten.

## RSI cycle 2026-11-24T03:07:51Z: ✅ control-check PASSES + an ACTIVE proposal beat baseline (opt-b harsher rusher landed).
Fixed two real bugs in my prior harness work and completed owner opt-b:
1. **DEAD-CODE bug:** propose.mjs's EVAL_OPTS.scenarios was ['solo-pinned','solo-live','multi'] — it NEVER ran 'solo-rusher', so the idle-penalty/rusher judge terms + my Option-2 scenario had been inert the whole time (scores hadn't moved). Added 'solo-rusher' to the proposer's scenario list.
2. **WRONG TARGET:** the passive control's edge was MULTI-ENEMY survival (73% vs 49% team HP in the 3-pack), not single-target kiting — my 1-enemy rusher never touched it. Made solo-rusher a 3-ENEMY pursuing pack (opt-b harsher), with aggro=1, speed×2, fireRate×0.45, dmg×1.35, and a nearest-enemy DISTANCE-PUNISH (up to ~8%/s HP drain the farther the cat sits from the whole pack; a brawler in the thick pays ~0).
**Result:** control-check now PASSES on the HELD-OUT seeds [13,202,999] — the deliberately-bad `stand-at-max-range` dropped to **0.535**, clearly below the new top elite. And for the first time an ACTIVE agent-proposed rule beat the engine baseline and survived the control guard: **`ready-aware-hitrun`** (hug when melee-ready 34–72px, pull to mid 58–104px on CD, disengage <40% HP) is now the best elite at cell 1,3,3 (**judge 0.574 vs the passive control's 0.535**). Archive coverage still 2/64 (descriptors haven't spread), but the judge is now SOUND — it rewards active play and punishes passivity across unseen seeds, matching what the playtest crons keep reporting. Harness-only change (scripts/rsi/), findings-only: no band applied to battle.js/skills.js, no game commit, no push.

## Playtest cron 2026-11-24T03:30Z (6 personas × 8 battles; first cycle w/ pushed lightning pass — thunderStream lock+jagged+charge+reach-gate, 球状闪电 split)
**Headline:** *"Combat is fun for aggressive hands-on players (6-7/10) but structurally BETRAYS THE EXTREMES: the kiter literally cannot win or be threatened (0/8, 2/10), the masher who dies never sees it coming, and ult/kit payoffs are bound to inputs or thresholds the people who need them never reach."* 43 critiques (29 P1 / 14 P2), 56/62 agents (6 StructuredOutput fails). Findings-only.

**✅ Lightning work not implicated** — no critiques about thunderStream (lock/charge/jagged/reach) or 球状闪电 split this cycle. The pushed lightning pass drew zero negative findings.

**Synth-ranked — two P0s (both long-converged, now sharpest-yet):**
- **P0 · Kiting is a 0% win-rate DEAD playstyle** (cautious 0/8, fun 2/10, "literally cannot win or be threatened"). Fix enemy aggression + closing ramp + basic reach TOGETHER so a patient kiter both can't farm safe chip AND has an honest win path. **Note: the RSI harness fix I shipped this session (3-enemy pursuing rusher + distance-punish) is the sim-side mirror of exactly this — the RSI judge now punishes passive kiting; the live game needs the same.**
- **P0 · Danger feedback invisible to the masher it was built for.** My shipped vignette/heartbeat/险胜 is confirmed PRESENT + correctly built, but mis-calibrated for a center-locked facetanker: (1) arms at 25% HP = no lead time vs burst (warning and death arrive together); (2) crit sting reuses `combat_hurt` = sounds like every other hit; (3) edge-vignette center is transparent = invisible where his eyes are; (4) never says WHICH button. FIX (refinement, not rebuild): raise CRIT_HP_FRAC 0.25→~0.40 for lead time; distinct escalating alarm sfx (not combat_hurt); a center-screen one-shot actionable prompt ("⚠ 空格闪避/DANGER—DODGE", touch-aware); keep edge vignette + a faint center tint. This is the **4th cycle refining the same danger cue** — now a precise 4-point calibration list.

**Recurring P1s:** combo earns no growth/defensive dividend (mashing's only lever pays pure offense, caps +20%); ult bound to R which 3 personas never press (route onto an in-reach input / earned auto-fire); TTK a flat ~12s "cutscene" — tempo+closing ramp should respond to actual DPS; kit reads decorative to explorer (damage attribution + shield-absorb numbers).
⚠️ **Harness self-flag (recurring):** the playtest sim "measures keypresses, not engine casts — fabricates phantom P0s on every auto[-battle run]" — i.e. some persona metrics (e=0/ult=0) over-count "never cast" when the engine actually did; worth trusting the code-path findings over the raw press counts.

**Verdict:** combat does NOT read healthy at the extremes, but today's lightning work is clean and the two P0s are both long-converged with concrete fixes: (1) the **kiter/passivity** gap — now validated by BOTH harnesses (RSI judge fix + playtest) — and (2) the **danger-cue calibration** (4 precise knobs on a system already present). Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-24T05:54:11Z: ✅ AGENT proposal WON — beat baseline AND the prior best elite
**Winner:** `agent:tight-hitrun-mutant` — **judge 0.646** vs engine baseline **0.598** (and 0.571 on the engine-baseline reward), overtaking the previous best elite `disciplined-hug` (0.637). It is now the top elite at cell `1,3,3` (eng 0.36 / tempo 0.79 / dur 0.86, score 0.6455).

**Winning bandBody** (island-evolution mutation of `ready-aware-hitrun`):
```js
(f)=>{const hp=f.hp/(f.maxhp||1); if(hp<0.50)return{min:96,max:168,rush:132,role:'ranged',hp}; if(((f.cd&&f.cd.q)||0)<=0)return{min:30,max:60,rush:30,role:'bruiser',hp}; return{min:52,max:92,rush:52,role:'bruiser',hp};}
```
Mutation vs parent: tighter contact band (30–60 vs 34–72), inward recharge band (52–92 vs 58–104), earlier retreat (<50% not <40%). The earlier disengage + tighter commit both helped on the held-out judge.

**Full ranking (9 candidates):** 1. agent:tight-hitrun-mutant 0.646 · 2. disciplined-hug 0.637 · 3. agent:mid-skirmisher-steady 0.606 · 4. agent:commit-brawler-contact 0.602 · 5. baseline 0.598 · 6. ready-aware-hitrun 0.565 · 7. agent:hp-adaptive-smooth-aggro 0.533 · 8. stand-at-max-range (control) 0.510 · 9. agent:glass-cannon-burst 0.499. **3 of 5 agent proposals beat baseline**; control ranked correctly near-last (control-CHECK PASS on held-out seeds [13,202,999]).

**Note (process):** the prior cycles' agent candidates were silently skipped — the loader requires `bandBody` to be a full arrow-function expression `(f)=>{…}`, not a bare statement body. Fixed the format this cycle; that's why agent rules finally entered the leaderboard. Archive coverage still **2/64** (the aggressive/glass-cannon rules clustered into existing descriptor cells rather than opening new niches — a real signal the sim's behavior descriptors are coarse here; next cycle should push harder on extreme tempo/durability to force a bin change). Harness-only (scripts/rsi/), findings-only: no band applied to battle.js/skills.js, no commit, no push.

## Playtest cron 2026-11-24T06:20Z (6 personas × 8 battles; first cycle w/ rebased origin+4 + in-flight SSR/evo/region-pool/leap work)
**Headline:** *"Every persona scored 2-3/10 at 0 wins because Cat Bond's combat is one-directional by construction — difficulty only ratchets UP (stompStreak, _pressure), the closer and ult only pay off past the attention/skill window players actually occupy, and every loss lies ('the cat ran away') — so no archetype ever gets momentum, mercy, or an honest read."* 46 critiques, 59/66 agents (7 StructuredOutput fails). Findings-only, no code changed.

**Two P0s (both long-converged; this cycle gives exact line-level fixes):**
- **P0 · Symmetric lossStreak rubber-band (most-repeated cross-persona finding).** `commitAiProfile` (battle.js:2319) ratchets `stompStreak` UP on flawless wins but on a loss only does `p.stompStreak=0` — there is NO mirror, no mercy valve. Masher 0/8, panicky 0/8 (1 faint/fight), auto-battler all hit the SAME static wall 8× with nothing bending toward them; the skill EMA is firewalled to timing/accuracy and never touches the real survivability knobs (playerDmgMult/enemyDmgMult/enemyHpScaleGap). **Fix:** persist `lossStreak` (0..3) on aiProfile (state.js), increment on `!won` (double-weight fast losses <10s), reset on any win; in the battle.js constructor after the difficulty block (~line 108) apply `m=clamp(lossStreak/3)`: `playerDmgMult*=(1+0.15*m); enemyDmgMult*=(1-0.30*m); enemyHpScaleGap*=(1-0.20*m)`. Casual-only (gate behind difficultyMult); floor enemy mults ~0.4; first win zeroes it. *This is the live-game mirror of the RSI harness passivity-punish already shipped sim-side — now the honest inverse is the gap.*
- **P0 · Front-load the closer + honest capture cue (universal 18s bail).** Impatient bailed at EXACTLY 18.0s all 8 fights; `_closing` is `clamp((t-45)/25)` = literally 0 until 45s (battle.js:4414), executeBonus arms only <28% enemy HP (5628-5634), captureReady banner is cosmetic until HP=0. The 0-45s window every short-fight player lives in is flat dead air — 18s looks identical to 5s, so they leave. **Fix:** pull onset forward `clamp((t-15)/20)`; couple HP gate to the ramp `closeGate=0.28+0.22*_closing`; arm the "就快收服了!" beat + slowmo/flash off closeGate not flat 0.28. Keep no-damage-dealt gate (no hits = no benefit) + exclude bosses so capstones stay hard.

**P1s (ranked):**
- **Nova pellet convergence = un-telegraphed instant-delete (P0 CODE BUG inside a P1).** Nova loop (battle.js:5224) spawns 12-20 pellets with NO per-enemy `_volley` cap (unlike castVolley:2528) — a center-locked cat eats every overlapping pellet in one frame. **Fix:** give the nova loop + enemyUlt burst the same `_volley={hitsByEnemy,maxHitsPerEnemy:3-4}` budget. Paired feel-fix: replace the flat `f.maxhp*0.26` smash (5217, hard R=86 cliff) with radial falloff `k=max(0,1-dist/R); heavy=max(e.dmg*0.9, f.maxhp*(0.06+0.20*k))` so incidental drift buys survival (kills the "必死伤害墙" determinism) while keeping the inner-circle punch + telegraph.
- **Loss taxonomy lies.** `finish(win)` collapses team-wipe / 85s timeout / voluntary flee into one `'flee'` → ui.js narrates all three as "野生猫猫跑掉了". Masher/panicky ALWAYS die by wipe → always see the one narration that's factually wrong. **Fix:** `result = win?'win':(_timeCapLoss?'timeout':'defeat')`; defeat shows "你的队伍被击败了" + lowest-enemy-HP progress ("你把它打到了 12% — 再来一把更容易!") + a dodge-coaching line when dodgesUsed===0; plumb a `reason` onto game_over (watch analytics allowlist).
- **Defense is silent & cosmetic.** i-frame dodge works but SILENTLY (resolveHit dealt:0 @5778) while Protect/Reflect print "格挡!/反弹"; shield branch (~5814) never floats the absorbed amount; ordinary dodge feeds no combo/ult so panic-dodging is pure stall. **Fix:** emit cyan "闪!/MISS" floater+ring+sfx on i-frame negate, float "护盾 -37" on absorb, grant tiny gainUlt(~4)+comboT refresh on a non-perfect dodge that negated a shot — gate to `f===this.me() && !autoMode`.
- **Ult is time-charged, lands too late.** Passive `gainUlt(8*dt)` caps ~12.5s, failsafe auto-cast gated at 9s idle (~18s) — exactly when impatient quits. **Fix:** cut passive drip 8→~2*dt, re-weight Q/E/dodge to pay big, seed meter ~40-55 at construction (early/first battles only) so first ult lands ~6-8s, drop failsafe idle gate 9s→~2.5s.

**P2:** starter prime→finish loop is dead (starterQFan/starterEPounce carry NO appliesTag, so Q/E can't light up the ×0.7 basics; the tax is also invisible) + enemy role is `i%3` parity & encounters near-always solo so battle 8 == battle 1 → add a per-encounter affix roll {rusher,sniper,mender,bruiser} rng-seeded.

**Verdict:** combat does NOT read healthy — same one-directional/no-mercy P0 the crons keep converging on, now with line-level fixes. This cycle's new concrete asks: (1) **lossStreak mercy band** (the long-standing P0, now with exact knob math), (2) **nova per-enemy volley cap** (a genuine instant-delete CODE BUG), (3) **front-load the closer** to fill the 0-45s dead air. My in-flight leap-fix / SSR / region-pool / wild-蓝莓 work drew no negative findings this cycle. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T07:20Z (6 personas × 8 battles; first cycle w/ lossStreak mercy band + leap-fix + wild-蓝莓 Lv12 live)
**Headline (sharpest root-cause yet):** *"Cat Bond's entire designed combat arc — telegraphs, specials, the 收网 closing ramp, the finisher — is wall-clock-gated to 45-85s, but tempoScale 0.64 makes real fights end in 5-18s, so across every persona the fight is over before a single designed beat ever fires (and the kiter, the one playstyle with no win condition, just times out to a flee)."* 51 critiques, 64/67 agents (3 StructuredOutput fails). Findings-only, no code changed.

**This reframes every prior P0 into ONE mechanism:** it's not that difficulty is one-directional *per se* — it's that **all the drama is gated on wall-clock `t`, but fights end in 5-18s**, so the telegraph/special/closing-ramp/finisher/escalation literally never fire in the fights people play. The median fight IS the "quiet opener" safety rail (negative specialMeter + `fillSecs=specialCd+5` + `_closing=(t-45)/25` + t>85 backstop). The single 32s outlier was "the only fight that ever reached the game's actual design."

**P0 — Rebind escalation/resolution from wall-clock to fight-PROGRESS.** The one structural fix that subsumes the lot. In battle.js: (1) `_closing` (line 4437) → `clamp((t-15)/20)` (arms ~15s, full ~35s); (2) replace flat 0.28 execute/closeBonus/capture gates (4633/5651/5657) with shared `closeGate=0.28+0.25*_closing`; (3) **highest-leverage single knob** — in hurtEnemy charge `e.specialMeter += (dmg/e.maxhp)*180` so an enemy being burst down **telegraphs + fires its must-dodge special on the way to death** instead of never; drop the `+5` on fillSecs (4934) + the `rotReady` opener (780) so the first real skill lands ~2-3s not ~8-10s. *Direction: the fight's drama should track how dead the enemy is, not how many seconds elapsed.*

**P1s:**
- **Kiter has no win condition (cautious 0/8 → 85s flee).** Zero DPS by identity → `_closing` (hit-gated) is a guaranteed no-op, every anti-kite knob keys off `e.aggro=1-hp/maxhp` which stays 0 at full HP. Fix: track `_noProgressT` (increment when pack HP hasn't dropped ~5s, reset on any HP loss); drive `_closing`'s deferred enemy-pressure off `max(e.aggro, noProgress)` so a stalemate makes backline enemies abandon standoff + fill specials faster → forces a resolution.
- **Onboarding teaches only move/attack/Q/dodge — no E step, no ult step — and any unsatisfied step auto-advances silently after 12s** with enemies held, then permanently sets manualTutorialSeen. A masher "graduates" having pressed Q zero times, dodged zero times. Fix: add explicit `eskill`+`ult` steps (force-fill meter, gate on real R press), replace the silent 12s skip with a scripted non-lethal telegraphed heavy that can ONLY be dodged ("普攻挡不住这一下—翻滚!"), make it re-enterable.
- **Combo meter is toothless** (+20% cap, sqrt-pinned in 2s; ult charges mostly passively 8*dt). Fix: scale per-hit `gainUlt` with combo (2→6+) so a sustained chain fills ult in ~6-8s (burst closer lands in the impatient window *because* they mashed); add tiered berserk at combo ≥20/≥40 lifting the dmg cap.

**P2/P3:**
- Defense/kill illegible: ordinary dodge returns silently, barrier absorb shows no "-N", onFaint is the least-juiced moment. Add cyan "护盾 -N/闪避!" floaters + guard sfx + a real faint beat (hitstop+slowmo+shake).
- **Deepen + surface the mercy band I just shipped** (explicitly cites my lines 104-108): lossStreak clamp 3 + coefficients (+15%/−30%/−20%) "mathematically cannot flip a deep negative-level-gap fight, and it's invisible." Asks: raise the clamp past 3, steepen coefficients/lower floors, add a **first-capture no-floor override** (catchCount===0 && starterRegion) so attempt #2 at the very first encounter is a guaranteed taste-of-victory, and make mercy visible.
- N/R wilds never get the phase-2 beat (hard-gated rIdx≥2 = SR/SSR only) → give low-rarity a single defensive phase-1 inflection at hp<0.45.

**Verdict:** combat still does NOT read healthy at the extremes — but this cycle crystallized WHY into one lever: **progress-gated vs wall-clock-gated escalation.** My shipped mercy band is confirmed present + correctly built but (per the adversary) too shallow to flip deep level-gap losses and currently invisible — a precise "deepen + surface" follow-up, not a rebuild. Leap-fix / SSR / region-pool / wild-蓝莓 drew no negative findings. Owner review pending; no code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-24T16:33:27Z: ✅ AGENT won + NEW niche opened (coverage 2→3/64)
**Winner:** `agent:true-glass-cannon` — **judge 0.681** vs engine baseline 0.640 (new all-time best, prior 0.646). New top elite at cell `1,3,3`.
**Winning bandBody:** `(f)=>{const hp=f.hp/(f.maxhp||1); return{min:20,max:46,rush:20,role:'assassin',hp};}` — a flat point-blank assassin commit, no self-preservation. Confirms the judge rewards relentless close-range output when survival still clears.
**New niche:** `agent:turtle-poke-slow` (patient 150-240 standoff, inch in only on both-cd-ready) claimed a previously-empty cell at `1,2,3` (eng 0.45 / tempo 0.72 / dur 0.98, score 0.607) → **archive coverage 2/64 → 3/64** (first new niche in many cycles — the "push harder on extreme tempo/durability" plan from last cycle worked). **3 of 5 agent candidates beat baseline** (true-glass-cannon, hp-inverse-berserk, turtle-poke-slow). Control `stand-at-max-range` ranked last (0.439) → control-CHECK PASS on held-out seeds [13,202,999]. Harness-only, findings-only: no band applied to battle.js/skills.js, no commit, no push.

## Playtest cron 2026-11-24T16:40Z (6 personas × 8 battles; first cycle w/ lossStreak mercy band + progress-gated escalation + leap-fix all LIVE in merged tree)
**Headline:** *"Cat Bond's combat has genuine depth but every reward, mercy valve, and teaching beat is invisible or gated on players who are already winning — so the six struggling personas each hit a silent 0% wall and score it 2-3/10."* 50 critiques, 63/68 agents (5 StructuredOutput fails). Findings-only, no code changed.

**Key shift this cycle:** the P0 is no longer "difficulty is one-directional" (my mercy band + progress-gated escalation are now LIVE and the adversary SEES them) — it's that **the mercy band is too shallow + invisible + between-fight, not in-fight.** The adversary read my exact code (lines 101-109) and said: casual-only ✓, but caps at 3 losses, tops at +15%/−30%, is reactive (needs 1-2 full wipes first), applies to the NEXT fight not the current one, and the player never sees or feels it. So a zero-defensive-input masher still hits a silent deterministic 0%.

**P0 — Visible, non-loss-gated IN-FIGHT survival floor.** Add a casual-only within-fight rubber-band in update() NOT gated on prior losses: when elapsed <~8s AND team HP <~0.35, floor enemyDmgMult/enemyLevelMult (×~0.5, never trivializing) so no casual fight resolves in <~10-12s regardless of dodge/shield. This is the in-fight mirror of my between-fight mercy band — buys the no-input player the "getting going" ramp they currently quit before earning. Keep hardcore untouched.

**P1s:**
- **Make defense + progress LEGIBLE.** `comboFlash` is dead (inert corner chip) → render as center-stage pop. In resolveHit float "闪开!/MISS" on an i-frame void and "挡下 −N" on shield absorb (both currently silent). Show the unmarked-basic ×0.7 penalty number. (Recurring "defense is cosmetic" finding — still unaddressed.)
- **Re-key teaching to trigger on STRUGGLE not dominance.** The mash-stall "use a skill" nudge is gated on the enemy being pinned <20% (player winning). Decouple it: when the active cat has EATEN ~35-40% maxhp with a never-used tool off cooldown, fire the coach button-pulse — reach the player who's LOSING, not the one already winning. (Same asymmetry the last 3 cycles flagged.)
- **Front-load pacing + aggression payoff.** Seed `this.ult` to ~35-55 at battle start (higher in starterRegion / low-APM profile) + show "ready in ~Xs"; move per-basic ult gain from cast→connect + raise active charge so mashing actually fills the burst closer in-window.

**P2/P3:**
- Walk-away **auto-battle pilot** should scale dodge by threat lethality (~0.9 when a shot would drop the cat <25%) + add a capture closeout.
- **Cautious kiter** still 0/8→flee: at the 85s backstop, branch on the already-computed `hitProgress` (from my progress-gated work) — if pack HP <~50% (proof of real poking) resolve weakest enemy as CAPTURED, framed "wore it down." Gives the kiter an honest attrition win.
- **Binary must-dodge smash → radial falloff** (`clamp(dist/R)^0.5`) + shrinking "−XX" floater so the masher SEES "I moved, the chunk got smaller" — a gradient teaches, a brick wall doesn't.

**Verdict:** my two shipped P0 systems (mercy band + progress-gated escalation) are confirmed LIVE and correctly built — the adversary now critiques their *calibration/visibility*, not their absence. The combat still walls the 6 struggling personas at 0%, but the remaining asks are refinements: (1) in-fight (not between-fight) mercy floor, (2) make the existing mercy/defense/progress VISIBLE, (3) re-key teaching onto struggle. Leap-fix / SSR / region-pool / wild-蓝莓 / intro-fix drew no negative findings. Owner review pending; no code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T17:10Z (6 personas × 8 battles; mercy band + progress-gated escalation + leap-fix live)
**Headline:** *"Combat is broken across the board this run — every persona went 0/8 at 2-3/10 because the recent enemy-kit pass overshot and flipped the casual on-ramp from 'no stakes' to 'unwinnable,' while the one safety valve the game ships catches nobody and the sim harness is measuring the wrong actor."* 52 critiques, 65/68 agents (3 StructuredOutput fails). Findings-only, no code changed.

**⚠️ Two NEW signals this cycle (beyond the standing P0s):**
1. **Possible REGRESSION flag** — the adversary claims a recent enemy-kit/lightning pass "overshot and flipped the casual on-ramp from no-stakes to unwinnable" (vs an older committed log line that mashers used to win flawlessly at full HP). Worth a real before/after check against a clean origin baseline before trusting it — the sim-harness bug below makes me hold this as PLAUSIBLE not confirmed.
2. **Sim-harness measuring the WRONG actor (corrupts RSI ground truth too).** `scripts/playtest-sim.mjs` counts keypresses, not engine casts — so `skillsUsed`/q/e/ult are fabricated and mercy (lossStreak) may never arm between sim battles. Fix: wrap the real cast methods (mirror the castWard wrap ~line 180) so skillQ/skillE/ultimate/dodge increment counters only on an actual `f===b.me()` cast. **This means some persona "never cast / 0 ult" metrics are artifacts — trust code-path findings over raw press counts (recurring caveat, now with the exact cause).**

**P0 — My mercy band "catches nobody even at MAX."** The adversary *instrumented* it: at lossStreak 3 (playerDmg 1.28 / enemyDmg 0.45 / enemyHp 0.78) the masher STILL goes 0/8. Root cause: the valve bends only damage mults, never the two things actually killing a drowning solo player — (1) `buildPack` still throws 2-3 cat packs at a solo, and (2) the un-marked basic ×0.7 penalty double-taxes the exact player who never primes Q/E. **Fix: thread `m=clamp(lossStreak/3)` into buildPack (cap to solo once m≥0.66) + lerp the ×0.7 basic penalty toward 1.0 as m climbs + steepen enemyHp so it lands in 1-2 losses not 4.** Plus add an IN-FIGHT `_grit` valve in hurtMe (~5778): ramp 0→1 as active HP falls below ~25%, capped incoming DR (×(1−0.28·grit)), exclude the unblockable smash — the proactive floor the between-fight band can't provide (same ask as last cycle, now with instrumented proof the current valve is "theatre").

**P1s:**
- **Proactive early-fight orientation ramp** (casual + catchCount<3): scale enemy damage by `clamp((t−1)/3.5,0.3,1)` so the first ~4s can't delete the team before one telegraph resolves — converts "died before I understood" into "saw the hit I should've dodged." + first-fast-death bilingual toast ("按空格闪避红圈攻击").
- **Desktop basic has zero aim-assist** + whole offense economy gated behind landing hits → add soft aim-magnetism (reuse autoAim intercept on locked/nearest within ~15-18° cone).
- **收网 still starts too late for passive players** — pull `timeRamp` start 45→~12s (4447) so it lives in the real fight window; lead `smashTarget` by ~1s of velocity.
- **Defense invisible + partly inert** — route DoT ticks through defense (skip while inv>0, reduce while shieldT>0); surface "挡下 −N / 闪开!" floaters + a `_obs.dmgPrevented` tally. (Recurring — still unaddressed.)
- **Combo has no sustain dimension** — at combo≥15, basics heal ~2-4% of damage dealt (capped) so aggression is a weak-but-real survival lever that teaches via the HP bar; keep skills strictly better.

**P2:** auto-mode never folds (add last-cat <20% HP auto-flee) + ult never auto-fires for the frantic cohort (re-key auto-pop off a combo milestone with full meter + ultWillConnect).

**Verdict:** this cycle is more alarming than the last — a possible difficulty REGRESSION (unwinnable on-ramp) AND instrumented proof my shipped mercy band is currently too weak to rescue anyone. BUT a confirmed sim-harness bug (measures keypresses not casts) means the raw 0/8 severity is partly suspect — the regression claim needs a clean-baseline before/after before acting. Highest-confidence real fixes: (1) extend mercy to pack-size + basic-penalty (not just dmg mults), (2) add the in-fight `_grit` floor, (3) fix the sim harness so future cycles + RSI measure real casts. No code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-24T17:48:52Z: ✅ agent beat baseline (0.660 vs 0.640); archive 2/64
**Winner:** `agent:glass-cannon-tighter` — judge **0.660** vs engine baseline 0.640. Took top cell `1,3,3`.
**Winning bandBody:** `(f)=>{const hp=f.hp/(f.maxhp||1); return{min:16,max:38,rush:16,role:'assassin',hp};}` — an even tighter mutation of last cycle's `true-glass-cannon` (16-38 vs 20-46). **4 of 5 agent candidates beat baseline** (glass-cannon-tighter 0.660, glass-cannon-cd-pulse 0.603, patient-sniper-farrange 0.602, retreat-heavy-low-dur 0.594). `agent:patient-sniper-farrange` (220-320 standoff poke) claimed cell `2,2,3`. Control `stand-at-max-range` ranked last (0.439) → control-CHECK PASS on held-out seeds [13,202,999].
**Note:** this cycle's tighter 16-38 band scored 0.660, BELOW last cycle's 20-46 (0.681) — i.e. pushing the hug even tighter past ~20px starts losing value (over-committed, eats more chip for no extra output). The ~20-46 glass-cannon remains the stronger operating point. Archive shows 2/64 because optimize re-seeds the elite set each run (per-cycle, not a cumulative hall-of-fame) — coverage N is a per-run diversity read, not monotonic. Harness-only (scripts/rsi/), findings-only: no band applied to battle.js/skills.js, no commit, no push.

## Playtest cron 2026-11-24T18:25Z (6 personas × 8 battles; post portal-nav rebase)
**Headline:** *"Cat Bond's combat is a lavish firehose whose entire difficulty, telegraph, and reward machinery is gated to help players who are ALREADY winning — every struggling persona hits an invisible wall or a silent 0/8, so fun caps at 2-3/10."* 51 critiques, 64/65 agents (1 StructuredOutput fail). Findings-only, no code changed.

**🔑 Sim-harness bug now CONFIRMED from a 2nd independent cycle (de-risks the "regression" scare):** `scripts/playtest-sim.mjs:205` never calls `commitAiProfile(win)` between battles → `lossStreak` stays 0 all 8 fights → **my mercy band provably never fires in the sim**. So the flat 0/8 the sim reports **OVERSTATES the wall vs the shipped game** (where a sub-10s wipe bumps lossStreak +2 and the band engages). Combined with the keypress-not-cast counter bug from last cycle, the harness manufactures both false 0/8 walls AND false "never cast / brain-dead AI" verdicts. **This is now the highest-leverage fix — it's corrupting every playtest AND the RSI ground truth.** Fix: call `b.commitAiProfile(win)` between sim battles + wrap `b.skillQ/skillE/ultimate/dodge` to count real casts (not keypresses).

**P0 (design, once harness is trusted):**
- **Invert the 'dominating' gate.** The telegraphed must-dodge smash fires on `_stomp>=0.3 || _pressure>=0.35`, and `_pressure` only accrues while `teamHpFrac>0.88` — so the forcing function DISABLES itself the moment the player starts losing. Add a `losingBadly` branch (meFrac ≤ CRIT+0.15, or lossStreak≥1, or team HP falling fast) so a struggling player ALSO gets the telegraph + a defensive teach-banner ("⚠️ 按空格闪避/展开护盾"). The whole difficulty model is "defense is something the strong player opts into" — backwards for onboarding.
- **Within-fight mercy FLOOR + legible defense.** casual-only, once/fight: when a hit would drop the active cat from >30% to ≤0, clamp to 1 HP + ~0.5s mercy-inv with a visible "绝境逢生!/Clutch". Plus surface dodge/shield/evade **prevented-damage numbers** (still invisible — recurring every cycle). This is the proactive in-fight floor the between-fight mercy band can't give.

**P1:**
- **Raise opener TTK floor + decouple drama from wall-clock.** 7/8 fights end <6s — entirely inside the opener before any system (special ~4-6s, `_closing` (t−45)/25, combo milestones 25/40/60) switches on. The one 33s outlier "was the only fight that reached the design." Lift `earlyDamp` (~734) .48/.55→~.70 + nudge N/R maxhp slope (~741) so common fights target ~12-20s; re-base escalation off fight-progress not `t`. (This overlaps my shipped progress-gated `_closing` — the ask is to also raise the HP floor so fights last long enough to feel it.)
- **Desktop aim-assist + fight-aware ult** — manual basic has no magnetism (masher's one action often whiffs); add a ~25-35° cone snap to locked/nearest + auto-fire ult off a combo milestone.

**P2/P3:** no-progress enrage to close the kite lane + auto-battle last-cat retreat; convert combo from flat +20% into a bounded overheat EVENT that rewards ability-mixing over hit-frequency.

**Verdict:** combat still reads 0/8 at the extremes, BUT this cycle's biggest takeaway is that **the measurement is partly broken** — the sim never arms the mercy band (confirmed twice now), so the raw severity is inflated. Highest-confidence action is no longer a combat tune — it's **fix `playtest-sim.mjs`** (commitAiProfile between battles + real-cast counters) so every future playtest AND RSI cycle measures the shipped game. Then re-run before trusting the "regression" headline. Design P0s (invert dominating-gate, in-fight mercy floor, legible defense) remain the top gameplay asks. No code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T19:05Z (6 personas × 8 battles; evolution-lineage role-align + mercy band + progress-escalation live)
**Headline:** *"Combat is mechanically rich but structurally hostile to its weakest players: every persona loses, the loss state pays nothing and lies about why, and the one safety valve (mercy band) is too weak and invisible to ever flip a loss into a win."* 52 critiques, 65/70 agents (5 StructuredOutput fails). Findings-only, no code changed.

**🔑 SHARP NEW STRUCTURAL FINDING (not seen before): the active (player-driven) cat is the ONLY unit on the field with 0% evasion.** `autoDodgeChance` (0.32→0.68) is wired into `updateAllyAI` and explicitly withheld from `me()` (battle.js:4365 `f !== me`; manual dodge is Space-only at 1891). So a button-masher drives the single cat stripped of the safety net, while the two BENCHED allies they're ignoring sidestep most fire. "来不及反应" is literally true — nothing guarantees the active cat a reaction window from frame 1. This is the cleanest root-cause yet for why the masher 0/8s.

**P0 — Loss state is a dead-end null event + mercy band can't rescue it** (instrumented AGAIN): steepen mercy at 103-108 (front-load so m≈0.7 by lossStreak **2** not 3; drop enemyDmg floor 0.45→~0.30, enemyHp floor 0.50→~0.45) AND **fold `m` into `makeEnemy`** (pack size + stats), not just damage mults — the recurring "valve bends only dmg mults" critique. Plus give the loss screen a real payoff + honest cause (see P1 below).

**P1s:**
- **Active lead cat passive survival floor** (the new finding above): casual-only decaying incoming-DR on the active cat for the first ~5s (×0.4→×1.0) at the enemy-hit site, and/or a small floor auto-dodge (~0.12-0.18) for `me` in manual casual — so a pure masher isn't a 0%-evasion sitting duck while benched allies evade. Guarantees a reaction window without forcing behavior change. Hardcore untouched.
- **Basic-attack economy is numerically broken + illegible** (shipped DEFECT): the unmarked-basic ×0.7 tax (battle.js:5466/5467) means a no-skill player eats −30% all fight with NO on-screen "未破防/prime with Q" tell; combo caps at a trivial +0.20 that a 0.6s masher self-maxes (rewards exactly what mashing does). Fix: lift unmarked floor 0.7→~0.85, make the +cap reachable only by ALTERNATING move types, surface a persistent "未破防 −30%" chip, add a basic cooldown pip (98% of mash presses hit the cd gate with zero feedback).
- **Loss screen lies + hides comeback hook:** `finish()` flattens faint/timeout/flee all to `'flee'` → "野猫跑掉了" on a team wipe. Set `lossCause='faint'|'timeout'|'flee'`, show lowest-enemy-HP progress ("你把它打到 12% — 再来更容易").

**P2/P3:** kiting provably dominant (add a stalemate clock → ramp enemy hunt-range after ~5-6s of pure poking); skill cd/ult tuned for a fight length that never ships (cut SKILL_CD_MULT ~0.85, Q cd 4.5→~3.0, seed opening ult); progress invisible until last 3s (stage the captureReady ladder — a "野猫动摇" cue at ~0.6 HP inside the first 6-8s).

**⚠️ Over-legibility caveat (honest note from the adversary):** the masher died at 428 **WITH a full red-circle telegraph already on screen** (battle.js:6406 pulsing disc + converging reticle + "⚠️重击来袭—离开红圈" toast + 1.4s windup). The team keeps answering this persona with MORE legibility; the real gap is a player who won't read ANY telegraph needs a passive floor, not a brighter warning. Stop adding telegraphs; add the passive survivability floor.

**Verdict:** combat still 0/8 at the extremes, but this cycle isolated the single cleanest mechanical cause — **the player's own cat has no passive evasion while the AI allies do.** That + the basic ×0.7 illegible tax are concrete shipped defects (not vibes). Highest-confidence actions: (1) passive survival floor on the active cat (casual), (2) fix/surface the basic-prime economy, (3) fold mercy `m` into makeEnemy pack/stats. The sim-harness cast-counter bug (flagged 2 cycles ago) still stands — fix it too so severity stops being inflated. Evolution-lineage role-align + SSR + region-pool work drew no negative findings. No code changed, no commit, no push (cron rule).

## Playtest cron 2026-11-24T19:55Z (6 personas × 8 battles)
**Headline:** *"Cat Bond's combat depth is fully built but structurally bypassed — every persona hit a flat, uncoached damage-race that ends the same way, and the one instrument meant to catch it is blind to AI/auto play, so the balance loop is tuning on partly phantom data."* 49 critiques, 62/66 agents (4 StructuredOutput fails). Findings-only, no code changed.

**P0 (both now escalated to P0):**
- **Fix the lying instrument** (flagged 4 cycles running, now top priority): `scripts/playtest-sim.mjs` counts keypresses not casts + never calls `commitAiProfile` → the mercy band never arms in-sim AND skill/ult usage is fabricated. The balance loop is "tuning on partly phantom data." Fix: wrap `b.skillQ/skillE/ultimate/dodge` (mirror the castWard wrap at line 180) tallying `caster===b.me()`, and call `b.commitAiProfile(win)` between battles. **Until this lands, every 0/8 severity and "never cast" verdict is suspect — including the regression scare two cycles ago.**
- **Record the killing blow → prescriptive defeat screen.** Code never stores cause of death (onFaint/finish discard it); the loss screen says generic "野生猫猫跑掉了" even on a team wipe. Stash `this._biggestHit={kind,dealt,counterZh}` when a smash/ult lands, carry through finish(false), and have ui.js openBattleRecoveryResult show "被重击击倒 (428) — 下次看到红圈就按空格闪避". Moves teaching from the transient in-combat toast (which the masher structurally won't read mid-fight) to the defeat screen (where they ARE reading). "The warning exists; it's just pointed at the wrong moment in the player's attention loop."

**P1s:**
- **Mercy band can't rescue** (recurring): raise lossStreak clamp 3→~6, steepen mults, fold `m` into makeEnemy. Same ask as last 3 cycles.
- **Variety-gate the combo crescendo:** a pure-basic chain self-maxes the +20% cap with zero variation (crescendo is "free, not earned"). Soft-cap pure-basic at ~+6%, require a Q/E/dodge to unlock the next tier + the ult feed; route basic-slot skills (烈焰猫爪) as 'skill' inputs so melee builds aren't punished. Milestone gate %10→%5 so a beat lands within ~3s.
- **Ult economy fires too late:** seed opening ult ~55 so first ult ~6s; drop the dead `_ultReadyT>=9` failsafe to ~3s (currently needs ~18s in a ~10s fight → ult=0 all 8 battles).
- **Enemy archetypes by species not `i%3` pack-slot** + a no-trade ferocity clock so kiting isn't free.

**P2:** force a zero-cost universal shield (bubbleVeil/guardStance) into fresh cats' E + teach it; add a graze mitigation floor (~15-25% off when the cat has real velocity) + soft desktop aim-assist so beginner effort visibly pays off.

**Verdict:** combat still 0/8 at the extremes, but the dominant takeaway is unchanged and now unavoidable: **the measuring instrument is broken** (keypress-not-cast + no commitAiProfile), so the severity is inflated and the mercy band is being judged while disarmed. The single highest-leverage action remains **fix `playtest-sim.mjs`** — it de-risks every future playtest AND the RSI ground truth in one go. After that, the defeat-screen post-mortem is the cheapest real UX win. My evolution-lineage / SSR / region-pool work drew no negative findings. No code changed, no commit, no push (cron rule).

## RSI cycle 2026-11-24T20:49:37Z: no agent proposal beat the MOBA judge; archive coverage 2/64.
Baseline won this run (judge 0.668); best agent was `allin-when-hurt` 0.641 (kite-at-full, dive <50% HP) — beat its own baseline ref (0.591) but not the engine default. Control `stand-at-max-range` ranked last (0.512 vs 0.668) → control-CHECK PASS on held-out seeds [13,202,999]. **Cross-cycle note:** the proven glass-cannon (20-46) scored 0.681 two cycles ago but only 0.596 here — confirming optimize re-seeds the enemy/seed config each run, so absolute scores are NOT comparable across cycles and there is no stable all-time "best" (the archive is per-run). Direction-level findings hold (hug > stand-at-max; ~20px sweet spot). Harness-only, findings-only: no band applied, no commit, no push. (Standing caveat: playtest just re-confirmed the sim-harness counts keypresses not casts + never arms commitAiProfile — the RSI judge shares that evaluator, so these absolute numbers carry that noise until the harness is fixed.)

## Playtest cron 2026-11-24T20:35Z (6 personas × 8 battles; FIRST run under auto-fix-P0 cron; branch cat-bond-autofix-difficulty)
**Headline:** *"Combat has real depth but zero structure and a blind instrument — every manual persona dies the identical deterministic 428 while the playtest harness literally can't see the controls they press, so the whole 2-3/10 dataset was tuned against a counter that reports zeros."* 49 critiques, 62/64 agents (2 StructuredOutput fails).

**P0s (auto-fix candidates this cycle):**
- **P0-1 · Blind instrument, still partly blind.** My prior harness fix wraps `skillQ/skillE/ultimate/dodge` but the adversary found manual Q/E/dodge paths where the fighter arg is implicit/null, so `actor===b.me()` misses them. Fix: `isMe=(actor==null)||(actor===b.me())||(name==='ultimate')`. Harness-only numeric → **AUTO-FIX**.
- **P0-2 · Deterministic 428 death — no intra-fight difficulty envelope.** Enemy damage is a battle-start constant (`enemyLevelMult` applied flat at L5780); NO time term, so a wild hits 100% lethality at second 1 = second 7. No opening/mid/climax arc. Fix: `enemyTempoEnvelope()=0.55+0.45*clamp(t/6)` (hardcore flat 1.0), one multiply at the damage site → casual opening is forgiving and visibly escalates. Local numeric, casual-gated → **AUTO-FIX**.

**P1s (findings-only):**
- Convert aggression/panic into survivability — re-key the masher guard off an incoming-hit-frequency (panic/overwhelm) signal instead of idle-since-skill, raise the low-HP cap.
- Teacher must react to repeated failure: stop stamping a timed-out tutorial step as "learned"; add a recurring skill-reminder keyed to lossStreak≥2 + zero skills fired, naming the unused control.
- Make Q/E the burst payoff (hitstop/shake/skill-pop floater), not an invisible debuff timer.
- Pay the loss path: 87% of runs dead-end on a screen granting nothing — award partial XP scaled by damage dealt + tick battlesWon.

**P2s (findings-only):** auto-mode shouldn't be de-facto hard mode (extend opening grace to auto + lossStreak-scaled autoDodge); close the kiter dead-zone (closing-term enemy move-speed decoupled from aggro); make the lethal moment + dodge legible (damage-event-gated danger cue, near-fatal flash).

**AUTO-FIX OUTCOME (this cycle):**
- ✅ P0-1 (blind instrument) → commit `1cd836ae` — `isMe=(actor==null)||...` counts manual Q/E/dodge. Verified: npm check + 4 combat scripts green.
- ✅ P0-2 (intra-fight tempo envelope) → commit `b6ff2754` — casual enemy dmg ramps 0.55→1.0 over first ~6s, hardcore flat. Verified: npm check + 4 combat scripts green; envelope math confirmed (0.55@t0 → 1.0@t6).
- 0 reverts. P1/P2 left findings-only per cron. Branch cat-bond-autofix-difficulty; NOT pushed.

## Playtest cron 2026-11-24T21:05Z (6 personas × 8 battles; merged latest origin + ×0.7 removal + harness-fixed data)
**Headline:** *"Combat is mechanically rich but every forgiveness and feedback system is scoped to the wrong player — the die-fast majority gets a deterministic instagib with no net and no lesson, the kiter has no win condition, and auto mode is accidentally the hardest config — so no persona clears 4/10."* 48 critiques, 61/65 agents (4 StructuredOutput fails).

**Notable:** with the ×0.7 penalty removed + harness fixed, basic output is now confirmed FINE — "mash battle 1 is a pure-basic WIN (33s, ends 3% HP)." The remaining masher deaths are a **survivability-floor** problem (whole team deleted in 6-10s with zero defensive input), NOT a damage problem. The diagnosis sharpened from "mash can't win" → "mash wins slowly OR gets instagibbed on a bad spawn roll, with no mid-fight net."

**P0s (auto-fix candidates):**
- **P0-1 · within-fight survivability floor + fix inverted masher guard.** My masher guard is idleRamp-dominated (keys off time-since-skill); adversary wants it re-keyed to HP state (ramp as active cat drops <30% HP, not requiring idleness) so a facetanking masher being bursted actually gets the mitigation. Local numeric tweak to my own block → **AUTO-FIX**.
- **P0-2 · losing-auto survivability floor.** autoMode is accidentally the HARDEST config (manual gets opening-grace + masher-guard; auto gets neither). Let those nets fire at ~60% strength when `autoMode && casual && lossStreak>=2`. Local gate tweak → **AUTO-FIX**.

**P1s (findings-only):** first-fight coach must teach E/shield + ult + stop false 'learned' stamp; rate-aware danger trigger + distinct alarm + center DODGE prompt (4th cycle asking); kiter win condition (longer poke reach + passivity hunt + scored timeout); desktop basic aim-magnetism cone.

**P2/P3 (findings-only):** captureReady → actionable finisher; per-encounter modifier seam so fight 1 ≠ fight 8; combo tier ladder with banked empowered hit.

**AUTO-FIX OUTCOME (2026-11-24T21:05Z cycle):**
- ✅ P0-1 (masher guard HP-driven) → commit 1745010d. lowHp now primary driver (ramps <40% HP, cap 45%); peril-time mitigation instead of idle-time. 4 combat scripts green.
- ✅ P0-2 (losing-auto survivability floor) → commit (see git log). _autoAssist: opening-grace + masher-guard fire at 60% when casual auto && lossStreak>=2. 4 combat scripts green.
- 0 reverts. P1/P2 findings-only. Branch cat-bond-autofix-difficulty; NOT pushed.
- NOTE: npm run check has PRE-EXISTING origin reds (收集33种猫 breed-count + 系统菜单 untranslated — confirmed on clean origin/main, Kartepolo's title rework); the 4 combat scripts (the auto-fix gate) are the green signal relied on this cycle.

## RSI cycle 2026-11-24T23:56:34Z: ✅ agent beat baseline (0.677 vs 0.638); archive 2/64
**Winner:** `agent:ready-hitrun-tight` — judge **0.677** vs engine baseline 0.638, new top elite at cell `1,3,3`.
**Winning bandBody:** `(f)=>{const hp=f.hp/(f.maxhp||1); if(hp<0.45)return{min:96,max:150,rush:120,role:'ranged',hp}; if(((f.cd&&f.cd.q)||0)<=0)return{min:30,max:60,rush:30,role:'bruiser',hp}; return{min:60,max:100,rush:60,role:'bruiser',hp};}` — cooldown-branching hit-run (hug on ready-Q, mid on CD, retreat <45% HP). **5 of 6 agent candidates beat baseline** (ready-hitrun-tight 0.677, steady-midline 0.649, glass-cannon-anchor 0.647, allin-when-hurt-v2 0.644, + pulse-brawler just under). Control `stand-at-max-range` ranked last (0.552) → control-CHECK PASS on held-out seeds [13,202,999]. Coverage held 2/64 (winners cluster in durability-bin3; the all-in/kite durability-down pushes didn't open a lower bin — descriptor grid stays coarse). Harness-only; no band applied to battle.js/skills.js; no commit; no push.

## Playtest cron 2026-11-24 (6 personas × 8 battles; HEAD cc6508dd + 2 meteor commits)
**Headline:** *"Cat Bond's combat is a well-built room where every verb exists but none of them land: every persona's problem reduces to the same structural absence of a felt mid-fight beat, an input→outcome signal that isn't offense-gated, and a loss loop that teaches instead of restarts."* 34 critiques (32 real, 2 opportunity), 47/70 agents (23 StructuredOutput failures — partial loss, not catastrophic). Per-persona counts: masher 5, kiter 4, explorer 8, panicky 7, lazy 3, impatient 7.

**P0s (adversary-confirmed):**
- **P0-1 · wire `_pressure` into enemy fire cadence.** Kiter persona 8 neutral timeouts. `_pressure` ramps when player turtles but never raised fire-rate (the code literally comments "deferred, unreviewed"). Local numeric: `fireCd /= (1 + 0.6*_pressure)`. **AUTO-FIX** (banner + relabel findings-only).
- **P0-2 · good-dodge sustain tier.** Explorer persona 13% winrate / avgHpFracLeft 0.01. Skill-expression converts to offense only; dodges at 60-80px burn CD with zero feedback. Add 75px "good" tier: heal 4% maxhp + 6 ult + dodgeCd 0.7 (perfect 40px untouched). **AUTO-FIX**.
- **P0-3 · deeper mercy ramp + ungate `_autoAssist` for manual.** Panicky 0/8, mercy plateaued at lossStreak=3 and the assist net was gated to autoMode only. Clamp 3→6, m scaled over 5 (deeper floors: enemyDmg 0.45→0.30, enemyHp 0.50→0.35, playerDmg +15%→+40%); `_autoAssist` fires for manual casual too at streak≥2, strengthens to 0.8 at ≥4. **AUTO-FIX** (modal offer new-UI → findings-only).
- **P0-4 · HP-phase stagger at 66%/33% + 35% vulnerability window + 破甲 floater.** Impatient persona 18s-to-bail. **findings-only** (new mechanic across makeEnemy/hurtEnemy + VFX + i18n — not clearly low-risk).
- **P0-5 · "test"/"test".** Invalid payload; skipped.

**P1s (findings-only; 29 total — top synthesized fixes from the adversary's ranked list):**
- Loss-screen cause-of-death autopsy ("野猫跑掉了" is still ambiguous across all 6 personas — 3rd straight cycle flagging).
- Give basics an earned crescendo: raise combo cap past ×1.20, add basic-only finisher, lift basic poise coefficient on high streak.
- Micro-telegraph every enemy basic shot + readable heavy-attack HUD channel.
- Enemy archetype rotation (Bruiser / Reflector / Kiter / Summoner) replacing i%3 role stamp.
- Clutch window + reactive-shield coach step (once-per-fight 绝境 + teach shield E).
- Make skills commit-worthy: skill-only interrupts, visible OPENING window, starter-Q ergonomics.
- KITE-STALL teach banner + relabeled "你观望太久" flee screen (paired with P0-1 wiring).
- Universal parry/patienceProgress stream for safe-play personas.
- Polish pass: milestone-paced basic juice, alternate yarn/fish, 3-pip auto-battle curriculum.

**P2s (findings-only; 5):** diverse polish — none destabilizing.

**AUTO-FIX OUTCOME (2026-11-24 cycle):**
- ✅ P0-2 (good-dodge sustain) → commit `dba4dc5b`. 75px tier: +4% maxhp heal, +6 ult, dodgeCd 0.7. 4 combat scripts + `npm run check` green.
- ✅ P0-3 (mercy ramp + manual assist ungate) → commit `8e6af2d0`. Clamp 3→6; m/5 with deeper floors; `_autoAssist` fires for manual casual too, 0.8 at streak≥4. 4 combat scripts + `npm run check` green.
- ✅ P0-1 (`_pressure` → enemy fire cadence) → commit `159c61da`. `/= (1 + 0.6*_pressure)`. 4 combat scripts + `npm run check` green.
- ❌ P0-4 downgraded to findings-only — HP-phase mechanic spans makeEnemy/hurtEnemy/VFX/i18n; not a local numeric tweak.
- ❌ P0-5 invalid (test payload).
- 0 reverts. P1/P2 findings-only. Branch `cat-bond-autofix-difficulty` (3 commits ahead of main); NOT pushed.

## RSI cycle 2026-11-25T03:14:52Z: ✅ new champion — `agent:hitandrun-double-gate` 0.694 (prev 0.677)
**Winner:** a stricter-gated mutation of last cycle's `ready-hitrun-tight`: dive to **26-54** **only when BOTH Q+E are off cooldown** (vs ready-hitrun-tight's Q-only OR-gate), sit mid at 70-110 between, retreat 120-170 under 35% HP. Rare, high-quality dives — both skills land per commit — paid off on the judge's efficiency + output terms more than the elite's "dive whenever Q is up" cadence. Took the **1,3,3** cell from the prior champion.

**Winning bandBody:**
```js
(f)=>{const hp=f.hp/(f.maxhp||1);
      if(hp<0.35)                        return{min:120,max:170,rush:140,role:'ranged',hp};
      const bothReady=((f.cd&&f.cd.q)||0)<=0 && ((f.cd&&f.cd.e)||0)<=0;
      if(bothReady)                      return{min:26,max:54, rush:26, role:'assassin',hp};
      return{min:70,max:110,rush:80,role:'bruiser',hp};}
```

**Scoreboard this run:** winner 0.694, control `stand-at-max-range` 0.349 (control-CHECK PASS on held-out seeds [13,202,999] — passivity ranked last as required). The control dropped from 0.552 last cycle → 0.349 this cycle, so the moba-groundtruth judge is reading passive play more harshly post-sim-harness fix; absolute scores still don't compare across cycles (per-run reseed).

**Archive coverage: 2/64** (unchanged — winner replaced prior elite in same cell 1,3,3; the probe for lower-durability bins via `death-dive-lowhp` + `patient-carry` + `either-ready-collapse` didn't dislodge any niche. All 5 proposed rules evaluated, 1 beat the baseline and the prior elite.)

**Next cycle hypotheses:** tempo bin 1 (fastest clears) and durability bin 0-1 (ends-at-low-HP) still empty — try pure assassin bands with no retreat clause + aggressive HP-triggered all-ins that force sub-50% hpFracLeft wins. Harness-only; no band applied to battle.js/skills.js; no commit; no push.

## Playtest cron 2026-11-25T03:38:23Z (6 personas × 8 battles; HEAD a4dd00c2 — 3 prior P0s + meteor polish + RSI log live)
**Headline:** *"Combat shipped a rich verb kit on top of a fight loop that rewards mashing J, hides its own safety nets, and flattens every outcome into one soft texture — every persona scored 3-4/10 for the same structural reasons."* 40 critiques (36 real, 4 opportunity), 53/73 agents (20 StructuredOutput failures). Per-persona: masher 8, kiter 7, explorer 3, panicky 8, lazy 6, impatient 8.

**P0s (4 total, all adversary-confirmed):**
- **P0-1 · masher dies before pinning anything.** Original mash-stall teach only fired when enemy was pinned <20% HP, so a masher who dies at 30s never saw the "use a skill" banner. Add a DYING-MASHER trigger using existing _dangerFrac/_lastSkillT/_stallBanner state → **AUTO-FIX** (numeric portion only; force-auto handoff + T-hotkey part = findings-only).
- **P0-2 · E slot is invisible by construction (panicky 0/8).** Two coupled changes: (a) remove skills.js `starterE` null-gate so fresh saves ship a shield in E; (b) add a 5th coach step for E with new i18n string + new _coachUsedShield flag. **findings-only** — loadout-gate removal touches starter-save shape and coach adds new architecture + i18n entries, not a local numeric tweak.
- **P0-3 · auto-casual mercy is gated (lazy 1/8 oscillation).** _autoAssist was 0 until lossStreak>=2, and a single lucky win hard-zeroed the streak → mercy oscillated off mid-run. Baseline floor 0.4 + soft win decrement for auto → **AUTO-FIX**. (Auto-only perks — auto-ult/auto-swap — stay findings-only.)
- **P0-4 · auto-mode runs on a human-paced clock (lazy 15.79s avg).** Grace window gated !autoMode AND only 4s long. Three numeric knobs for casual auto: tempoScale ×0.88, grace window t/4 → t/6, fast-loss threshold <10s → <20s → **AUTO-FIX**.

**P1s (findings-only; 35 total — top synthesized fixes from adversary rank list):**
1. Basics out-DPS skills (BASIC_SKILL_DMG_MULT=0.5 reads as finisher only on status-marked) — invert the combo contract.
2. Combo cap too low (×1.20) — promote existing chain into a short "berserk" state at threshold.
3. Ult is a scalar metronome — add overcharge + combo scaling + kill the auto-fire failsafe.
4. Kiter _pressure gate still has inversion edge cases — timeouts should count more as losses.
5. Dodge default direction betrays escape intent when no input — route no-input dodges radially away.
6. Final-blow has no authored frame — split "enemy died" branch so the last hit punches.
7. Casual mode ult arrives after fight ends — bootstrap climax beat for the first 5 battles.
8. Diagnose-the-loss on defeat banner — stop shipping one voice line for 7 flees (5th straight cycle).
9. Fake phase at 50% HP — convert into a real verb change (HP-stagger again; 2nd straight P1).
10. Shield auto-cast's supportSlot tag check is broken — fix before shipping any preset.
11. Incoming hits have no weight language — mirror hurtEnemy's tier ladder in hurtMe.
12. Low-HP vignette is ambient dread — convert to actionable rescue signal.
13. Flee has no second economy — convert retreat into a bounded sendaway expedition.

**P2 (findings-only; 1):** combat loop texture polish.

**AUTO-FIX OUTCOME (2026-11-25T03:38:23Z cycle):**
- ✅ P0-1 (dying-masher teach trigger) → commit `83215c3f`. _stallBanner fires when _dangerFrac<CRIT && no skill 3.5s && t>15. 4 combat scripts + `npm run check` green.
- ❌ P0-2 downgraded to findings-only — removes starterE null-gate AND adds new coach step + new i18n key + new _coachUsedShield flag; touches starter save shape + tutorial architecture.
- ✅ P0-3 (casual-auto baseline + soft win decrement) → commit `0c07dd85`. autoBaseline=0.4 floor; soft -1 decrement on auto win. Combat + full check green. Auto-ult/auto-swap perks stay findings-only.
- ✅ P0-4 (auto grace window + auto tempo + auto fast-loss step) → commit `e0a78915`. tempoScale×0.88; grace t/4→t/6; auto fast-loss <20s. Combat + full check green. Stacks cleanly with P0-3.
- 0 reverts. P1/P2 findings-only. Branch `cat-bond-autofix-difficulty` (9 commits ahead of origin/main — includes meteor polish + prior cycle's 3 P0s + RSI log + this cycle's 3 P0s); NOT pushed.

## Playtest cron 2026-11-25T04:57:21Z (6 personas × 8 battles; HEAD 11a88eb9 + 10 local balance commits)
**Headline:** *"Cat Bond's combat is a legibility crisis dressed as a difficulty curve — the engine already measures everything a player needs to learn, and the UI/tutorial consistently throws it away, so every persona scores 3-5/10 for the same underlying reason: the game refuses to tell them what happened."* 50 critiques (42 real, 8 opportunity), 63/79 agents (16 StructuredOutput failures). Per-persona: masher 8, kiter 8, explorer 8, panicky 10, lazy 7, impatient 9.

**P0s (4 total, all adversary-confirmed):**
- **P0-1 · 'don't know what hit me' — red vignette paints too late.** CRIT_HP_FRAC=0.25 gave a ~2s warning on 13s deaths. **AUTO-FIX** single-knob raise to 0.45 → 4-5s warning window. (Yellow pre-crit band + damage-source floater + enemy muzzle wind-up parts stay findings-only; enemy basics already have muzzle flash + regularSkillAccent at L5278-5279 — adversary misread that path.)
- **P0-2 · mash-stall teach never reaches 8s deaths.** Dying-masher trigger was gated t>15 AND _stallT>5; masher died at 8.7s mean, never saw the pulse. **AUTO-FIX** gates relaxed: t>4 (past coach), 3.5s→2s no-skill window, _stalled flips IMMEDIATE when dying-no-skill (bypass 5s accumulator). ('弹开/Blocked' low-damage floater stays findings-only — new i18n + new vfx path.)
- **P0-3 · catchCount===0 rookie profile (RNG reseed + dmg cap + telegraphed-only kit).** **findings-only** — RNG reseed affects save-replay determinism, forced-kit touches skill-selection architecture, not a local numeric.
- **P0-4 · defensive-first mercy (second-wind revive + auto-dodge at CRIT + persistent 弱化 debuff).** **findings-only** — new mechanic on top of mercy system; debuff persistence touches save format.

**P1s (findings-only; 42 total — top synthesized themes):**
1. Ship a real Defeat Report with attribution + retry button (5th+ cycle flagging the loss screen).
2. Teach E/shield in first-fight coach — stop shipping an invisible slot (recurring 3+ cycles).
3. Enemy roles earn real stat deltas (dasher/poker/juggernaut) + guaranteed pack diversity.
4. Visible 'Pursuit / 收网' meter; split the 85s stalemate on _pressure.
5. Casual tempo rebalance tempoScale 0.64→~0.80; kill the auto *0.88 double-tax.
6. Honest basic economy: make skill-priming visible, pay ult meter via skill casts.
7. Mid-fight 'Surge' beat at t≈8s + enemy phase-shift at HP<55% (3rd cycle — this is the HP-stagger recurring P0 from prior rounds).
8. Three legible dodge states + whiff penalty so panic-rolling isn't optimal.
9. Auto-mode: count flees for mercy, sharpen reaction under _autoAssist, smarter ult gate.
10. Tiered combo milestones gated on player-acts (not every %10).
11. Per-run skill mods (RUN_MODS) so Q/E/basic feel different fight to fight.
12. Peripheral danger-edge vignette off enemy telegraphs + projectile vectors.

**P2 (findings-only; 4):** polish layer — alt yarn/fish skin, 3-pip auto-battle curriculum, etc.

**AUTO-FIX OUTCOME (2026-11-25T04:57:21Z cycle):**
- ✅ P0-1 (CRIT_HP_FRAC 0.25→0.45) → commit `1339cacd`. Single-knob bump; downstream consumers all scale off this field. 4 combat scripts + `npm run check` green.
- ✅ P0-2 (dying-masher stall gate relaxation) → commit `98afb9d3`. t>15→t>4, 3.5s→2s, _stalled flips immediate on dying-no-skill. 4 combat scripts + `npm run check` green.
- ❌ P0-3 downgraded to findings-only — RNG reseed affects determinism, kit forcing touches architecture.
- ❌ P0-4 downgraded to findings-only — defensive floor is a new mechanic; 弱化 persistence touches save format.
- 0 reverts. P1/P2 findings-only. Branch `main` (12 commits ahead of origin/main); NOT pushed.

## RSI cycle 2026-11-25T05:50:49Z: ✅ new champion — `agent:sniper-safe-180` 0.695 (prev 0.694)
**Winner:** a flat 180-260 sniper band with NO HP branch and NO cooldown branch — the simplest proposal I've shipped — narrowly dethroned the double-gated hit-and-run by 0.001. Reclaimed cell 1,3,3.

**Winning bandBody:**
```js
(f)=>{const hp=f.hp/(f.maxhp||1);
      return{min:180,max:260,rush:200,role:'ranged',hp};}
```

**Interpretation:** the judge is survival-weighted more than output; a far-range cat (180-260) takes less damage than a 70-110 bruiser in exchange for slightly lower DPS, and the net wins. This reproduces at engage 0.39 / tempo 0.75 / dur 0.99 — same high-durability cell as every other elite.

**Archive coverage: 2/64 (unchanged).** The three candidates aimed at empty niches (no-retreat-hug, mid-flat-steadfast, e-only-burst) didn't open new cells:
- `no-retreat-hug` 18-36 — probably mapped into bin 3 anyway or didn't beat the control. Low-dur cells still empty.
- `mid-flat-steadfast` 70-110 — no new niche; too similar to existing elite neighborhood.
- `e-only-burst` — cooldown-axis mutation didn't produce a distinct descriptor.

**Standing hypothesis (3rd straight cycle):** the descriptor grid (engage × tempo × durability, 4×4×4) is too coarse to distinguish these variants OR the judge's survival/win weights penalize anything that ends fights below ~90% HP enough to prevent low-dur cells from ever being reachable. Worth investigating whether the durability descriptor is a bad discriminator (if 90-100% HP endings are the only winnable outcomes, bin 3 is a monopoly). Harness-only; no code applied.

**Balance probe (first live run alongside the main loop):** water=0.39 worst, dark=0.50 best, cv=0.100, gap=0.108. Baseline for future-cycle drift comparison.

## Playtest cron 2026-11-25T06:38:01Z (6 personas × 8 battles; HEAD 17de38ab + this cycle)
**Headline:** *"Cat Bond's combat substrate is rich but the feedback contract is broken on both ends — defeats are silent, skills are decoration, and the most-engaged persona is the first to notice there's nothing to grip."* 44 critiques (36 real, 8 opportunity), 57/78 agents (21 StructuredOutput fails). Per-persona: masher 7, kiter 9, explorer 7, panicky 6, lazy 7, impatient 8.

**P0s (5 total):**
- **P0-1 · kiter dead zone (3 numeric knobs).** _pressure HP-gate 0.88→0.70; _closing now drives fireCd (1 + 0.5×closing); enemyRangeBand collapses min/max under closing. → **AUTO-FIX**. Flee-reframe suggestion (new UI/i18n) stays findings-only.
- **P0-2 · enemy committed-telegraph cadence (demand-side).** Every 6-8s force a windup for 40-60% maxhp strike survivable only by dodge/shield. **findings-only** — new enemy ability + skill wiring + progression gate; cross-file architecture.
- **P0-3 · effort-weighted mercy + between-fight heal.** struggleScore EMA from dodge rate / threats, between-fight heal at <50% HP. **findings-only** — new persisted save field; touches aiProfile/save shape.
- **P0-4 · panicky Patience Mode + post-flee recap panel + reactive coach.** Opt-in modal, per-projectile red ring, recap screen. **findings-only** — new UI modal + new i18n + new VFX layer per shot.
- **P0-5 · impatient ult pre-charge (ult=60 at battle start, casual).** **AUTO-FIX attempted → REVERTED.** Combat-matrix test (melee/tank must deal >= 2000 over 12s) regressed to 1957; band-fitness also failed. The pre-charged ult consumed early-battle input during the matrix test window. Downgraded to findings-only — needs a more surgical approach (pre-charge only on fight #1 of a session, or scale the matrix test tolerance separately).

**P1s (findings-only; 37 total — top synthesized themes):**
1. Death postmortem card: surface what killed you (recurring 6th+ cycle — the loss-screen honesty ask).
2. Fix the kiter's structural dead zone — partially addressed by P0-1; banner/flee-reframe still pending.
3. Context-aware ult economy: pre-charge opener + scale drama to stakes + charge on being hit.
4. Promote role to real enemy archetypes with mechanical teeth (recurring).
5. Primer → spender combo economy with visible rage tiers (recurring).
6. Re-teach dodge/shield at the failure moment, not just in the one-shot opener (recurring).
7. Honest effort-weighted mercy, between-fight heal in casual, visible loss diagnosis.
8. First-fight scaffold for cold players; manual-casual grace & mash-feedback hooks.
9. Zen ramp: reward not-getting-hit without a new bar.
10. Threat-coupled coach pulses and tiered basic-attack crit cadence.
11. Diegetic persistence of defeat: 决心/Resolve cosmetic stack + rematch button.

**P2 (findings-only; 2):** polish layer.

**AUTO-FIX OUTCOME (2026-11-25T06:38:01Z cycle):**
- ✅ P0-1 (kiter closing — _pressure gate 0.70 + fireCd closingBoost + range collapse) → commit `b16a8b29`. 4 combat scripts + `npm run check` all green.
- ❌ P0-2 downgraded to findings-only — new enemy ability + progression gate architecture.
- ❌ P0-3 downgraded to findings-only — struggleScore persistence touches save format.
- ❌ P0-4 downgraded to findings-only — new modal + new per-shot VFX + new i18n strings.
- ❌ P0-5 (ult pre-charge 60) → **REVERTED on failed verify.** check-cat-bond-combat-matrix regressed (melee/tank 2000→1957) + band-fitness failed. Pre-charged ult perturbs the matrix test window.
- 1 revert. P1/P2 findings-only. Branch `main` (19 commits ahead of origin/main); NOT pushed.

## Playtest cron 2026-11-25T07:41:16Z (6 personas × 8 battles; post-rollback merge 7375996e + all my balance stack)
**Headline:** *"Cat Bond's combat systems are richer than the UI admits — losses don't teach, wins don't attribute, and every persona except 探索型 is bouncing off invisible rubberbands; the fix is legibility and feedback-edge events, not more mechanics."* 35 critiques (26 real, 9 opportunity), 48/70 agents (22 StructuredOutput fails). Per-persona: masher 5, kiter 6, explorer 8, panicky 4, lazy 5, impatient 7.

**P0s (2 total, both findings-only):**
- **P0-1 · visible escape-meter win condition (kiter).** Replace the silent 85s flee backstop + hidden _closing/_pressure chain with an on-screen "即将逃走" bar under the enemy nameplate: enemy accumulates escape% while out of a damage window, retreats visibly at 100%. Gives the cautious kiter a race to watch and a visible stake. **findings-only** — new on-screen UI bar + new enemy state field (escapeT) + new i18n string + new flee-animation path. Not a local numeric.
- **P0-2 · panicky DDA (timeout-count lifeline).** On consecutive timeouts, scale enemy maxhp 0.72 at 3+, widen basic auto-aim ±22° cone, raise BASIC_SKILL_DMG_MULT 0.5→0.65 under the same gate. **findings-only** — core knob (timeout count) is a new persisted save field; the existing lossStreak tracks wipes+timeouts together but the suggestion specifically wants *timeout-only* for panicky vs kiter distinction. Raising BASIC_SKILL_DMG_MULT globally last cycle broke combat-matrix (P0 #5 ult precharge revert).

**P1s (findings-only; 27 total — top themes):**
1. Post-flee postmortem card: biggest-source skill + coaching line + repeat-offender telegraph widen (recurring 7+ cycles — the loss-honesty ask).
2. Q/E setup→detonator pair with a 'primed basic' window.
3. Diegetic ult-ready beat (world-state, not HUD footnote).
4. Visible auto-AI casts + preset plans (balanced/burst/survive).
5. HP-triggered _closing + visible execute phase.
6. Cooldown-denial feedback + first-cast signature moment.
7. Tier-aware combo milestones with chain release into skills.
8. Pre-fight pack archetype banner (named identity, not more telegraphs).
9. Attributed win recap (MVP sentence, not stats panel).
10. Negative-feedback & range reticle for whiff legibility.
11. Clutch-window 'last stand' + anti-stomp DDA.

**P2 (findings-only; 6):** blitz tier ladder, per-breed PB ghost, visual polish.

**AUTO-FIX OUTCOME (2026-11-25T07:41:16Z cycle):**
- ❌ P0-1 (kiter escape meter) → findings-only — requires new UI bar + new enemy state + i18n.
- ❌ P0-2 (panicky DDA) → findings-only — requires new persisted timeout-count save field. Adjacent attempt (BASIC_SKILL_DMG_MULT raise) would regress combat-matrix as the P0 #5 ult precharge revert from last cycle showed.
- 0 commits, 0 reverts. Combat reads **healthy for auto-fix scope** this cycle — both adversary-confirmed P0s are feedback/UI-shape problems the cron rule correctly keeps out of my hands.
- Branch `main` (22 commits ahead of origin/main — including merge of origin's rollback); NOT pushed.

## Playtest cron 2026-11-25T08:37:22Z (6 personas × 8 battles; HEAD dec054cc + occam audit tools)
**Headline:** *"Combat feels input-good but legibility-starved: inputs land cleanly, but invisible RNG, silent escalation, cosmetic roles, and a dead-zone between tutorial-end and ult-ready quietly hide half the game's depth from every persona."* 32 critiques (29 real, 3 opportunity), 45/72 agents (27 StructuredOutput fails — higher than usual, 2-StructuredOutput-stability cycle to watch).

**P0 (1 total):**
- **P0-1 · impatient 18s tempo-contract leak.** ULT_COOLDOWN=18s + _closing-starts-at-45s = a 45s dead zone where impatient players (all 8 flees at ~18s) never see momentum. Three suggestions: (a) first-ult CD cut 18→10s, (b) _closing ramp pulled forward, (c) damage-dealt ult-CD shaving. Shipped (b) only — conservative compromise `(t-45)/25 → (t-25)/20` (ramp now 25→45s, not adversary's aggressive 15→35s which would hit 95% of fights). **AUTO-FIX**. (a)+(c) findings-only — new state fields, last cycle's ult-pre-charge revert showed combat-matrix risk.

**P1s (findings-only; 28 total — top themes):**
1. Rescue lever earned: damage-taken ult charge + underdog softening (recurring — the "no comeback mechanic" theme).
2. Enemy role load-bearing (archetype-shaped silhouette, not reskinned stats) — recurring 4+ cycles.
3. Q/E/Ult real identity: slot roles, opportunity cues, readable cast.
4. Onboarding leak: gate E and ult in the coach, add JIT reminders (recurring 5+ cycles — E-slot ask).
5. Guarantee loadouts and legibility for auto/casual play.
6. Anti-kite archetype + visible closing + opportunity windows (kiter P0 partial from last cycle; _closing ramp forward is progress but not the whole fix).
7. Turn basics into skill-economy fuel + self-priming ramp (recurring 3+ cycles).
8. Visible dodge streakbreaker + resource pips (replace invisible RNG).
9. Phase beats everywhere: 二阶段 + enrage + opening lull.
10. Reactive AI legibility: floating intent badge + actionable rescue hint.
11. Daily affix + one meaningful loadout pick for auto-battlers.
12. Combo cash-out: visible charge bar + detonation every 20 (not passive +20%).
13. Diagnostic coach + openly named auto-assist.

**P2 (findings-only; 3):** polish layer.

**AUTO-FIX OUTCOME (2026-11-25T08:37:22Z cycle):**
- ✅ P0-1 (`_closing` ramp 45-70s → 25-45s) → commit `ae56e47a`. Single numeric constant swap. 4 combat scripts + `npm run check` all green.
- 0 reverts. P1/P2 findings-only. Branch `main` (24 commits ahead of origin/main); NOT pushed.

**Occam-audit context (from last session):** this cycle's 20 battle.js knobs remain mostly invisible to the RSI AI harness; the real validation is these playtest personas. The `_closing` tweak is a ctor-side logic change (not a ctor-bake) so it DOES register per-frame if the knob-probe is rerun.

## Playtest cron 2026-11-25T09:42:56Z (6 personas × 8 battles; HEAD f15108d0)
**Headline:** *"Combat is mechanically loaded but tonally monotone — the signals that should bend player behavior (danger, close, phase, basic cadence, ult scarcity) are all computed and all muted, so every persona pushes the same flat-line even when the sim is doing variety work under the hood."* 33 critiques (24 real, 9 opportunity), 46/73 agents (27 StructuredOutput fails — sustained ~35% noise ceiling).

**P0s (2 total, both findings-only):**
- **P0-1 · kiter needs visible '野猫急了' phase + scripted commit + backstop 85s→55s.** _closing is DESIGNER-SIDE escalation; kiter persona bails at 38s without seeing it. **findings-only** — core complaint is the visibility half (new toast + audio sting + forced-telegraph override); numeric 85→55 alone would be miscalibrated without the visible-phase half. Full fix requires new behavior + i18n + audio cues.
- **P0-2 · struggle-discovery auto-hint toast.** Panicky player eats 352 dmg/fight; engine already computes _pressure/lossStreak/_stomp but never surfaces the auto-battle option. **findings-only** — needs new save field (battlePrefs.autoHintShown), new on-screen chip UI, new bilingual i18n string.

**P1s (findings-only; 27 total — top synthesized themes):**
1. Danger signal: convert one-shot HUD latch to escalating diegetic pressure ON THE CAT (not screen edge) — recurring 6+ cycles.
2. Combo-20 milestone → felt Overdrive tempo shift (drop basic CD × window) + drive dormant enemy.phase at 60%/30% HP.
3. Stop teaching with tutorials, start teaching with pressure (forced-answer telegraph).
4. Basics need a decision layer: clean-chain primer → cash out through Q/E reactions.
5. Enemy archetype table flipping 4+ knobs (not rarity-coupled roles) — 6+ cycle recurring.
6. Punish wasted dodges with escalating fatigue (CD up, iframes down).
7. Starve ult economy; make result banner relative (% of field, not absolute dmg).
8. Promote every 3rd basic to kick-beat crit + force-crit sub-28% HP enemies.
9. Convert HP-threshold phase punishes into player-owned stagger windows.
10. Replace stat-boost boon triad with rule-mutator run modifiers at fights 2/5/7.
11. Live auto-intent pills above each cat (not just 2.5s teletype).
12. Primer → Detonator skill combo (Q tags, E detonates with CD refund).
13. Auto-mode persona chips (盾墙 / 均衡 / 斩首) replacing smartAutoAction magic numbers.

**P2 (findings-only; 4):** polish layer.

**AUTO-FIX OUTCOME (2026-11-25T09:42:56Z cycle):**
- ❌ P0-1 (kiter visible phase + scripted commit) → findings-only. Full fix requires new audio + forced-telegraph override + i18n — not local numeric.
- ❌ P0-2 (struggle auto-hint) → findings-only. Needs new save field + new UI chip + new i18n.
- 0 commits, 0 reverts. **Combat reads healthy for auto-fix scope this cycle** — both adversary-confirmed P0s are feedback/UI-shape problems the cron rule correctly keeps out of my hands.
- Branch `main` (25 commits ahead of origin/main); NOT pushed.

**Signal strength note:** cycle noise is now sustained at ~35-40% StructuredOutput fails (27/73 this run). Findings that recur across cycles are reliable; one-off claims should be weighted down.

## Playtest cron 2026-11-25T17:34:58Z: CRON FAILED — agent stalled all 6 attempts (API issue, no code change).

## RSI 2026-11-25T17:42:30Z

Proposer → evaluator → archive update (findings-only, no game-code touched).

**Candidates proposed** (targeting empty archive niches):
1. `aggro-bruiser-hug` — HIGH-ENGAGE niche (e≥2), tight hug band gated by CD readiness
2. `mid-tempo-pulse` — MID-TEMPO niche (t=1-2), commit-on-CD then drift-out
3. `desperate-dive` — LOW-DURABILITY niche (d=0-1), hp<0.35 → assassin dive
4. `elite-mutation-tighter` — island mutation of #2 elite (stand-at-max), pulled 25% inward

**Result:** winner='?' (none beat baseline at held-out seeds [13,202,999]); archive 2/64 (unchanged), best 0.7698 baseline; band=cells 0/3 improved, 0 generalized; balance worst=water(0.50) best=fire(0.57) cv=0.054 gap=0.073.

**Honest read:** this matches the `archive-reachability-probe` finding — the sim only physically reaches ~3 of 64 cells with the default fighter config (durability bin 3 captures ~100% of samples). Candidates 1-3 aim at bins the sim cannot land in; candidate 4 lives in a reachable cell but doesn't beat the incumbent at that cell. **Proposing-more-rules will not grow coverage**; what would grow it is harness config diversity (multi-enemy, multi-build, multi-level fighter configs).

No commit, no push. Archive + history log updated by rsi-loop.mjs only.

## Playtest cron 2026-11-25T18:35:31Z: V5-post-merge cycle (38 critiques, 1 P0, 35 P1, 2 P2)

**Headline:** Combat lands close wins but refuses to celebrate them — the kit's verbs (E, R, dodge, shield) stay invisible across personas while basics drown out everything else.

**Infra:** 18/69 StructuredOutput fails (~26%), consistent with noise ceiling. Pre-sim gate PASS (parse + 4 combat scripts green before launch).

**Single adversary-confirmed P0 (findings-only — NOT low-risk):**

**P0-1** [探索型, tries everything] Basic attack is empty filler. 1,000–3,400 basics/fight at `moves[0].cd=0.6s` means ~1 click/1.2s for 20+ min, each a chip non-event (BASIC_SKILL_DMG_MULT=0.5, hit SFX throttled, floater capped). 200:1 basic:Q ratio proves Q isn't a choice but a garnish on a river of noise. The dominant verb has no texture, payoff, or decision.
- **Suggested fix (from adversary, not applied):**
  - (a) `moves[0].cd` 0.6 → 0.9 (numeric — LOW-RISK on its own)
  - (b) Add `e.primeStacks` (cap 3, 3s decay) + per-enemy nameplate pip row (NEW field + NEW draw)
  - (c) 3rd basic auto-'pops' as `hitTier='crit'` with gold floater + new SFX (new impact tier)
  - (d) Q/E consume pips for +20%/pip through a new dmg bucket (crosses battle.js ↔ skills.js)
- **Verdict:** Parts (b)(c)(d) add new fields, new VFX, new SFX, cross-file logic — **architecture work, not local numeric tune**. Cron rule explicitly excludes "architecture/refactor". Doing only (a) in isolation reduces basic cadence but doesn't resolve the P0 (basics still textureless), and could regress `check-cat-bond-band-fitness` DPS-vs-distance monotonicity (slower basics = less engage output).
- **Classification: findings-only.** Owner must decide if the prime-pip system ships (needs scoped design doc + VFX + save considerations for primeStacks persistence).

**Recurring P1 themes (35 critiques, findings-only; not auto-applied):**

Grouped by theme across personas:

1. **Verb invisibility (×12)** — E, R, dodge, shield are mentioned in zero or very few first-coach steps. `initCoach()` (battle.js L298–327) teaches move/attack/Q/dodge only; E and R are introduced only by icons that mashers never look at. Multiple personas suggest splitting coach into Q + E + R + dodge gates with `b._coachUsedSkillE` / `_coachUsedUlt` flags.
2. **Close-win catharsis missing (×5)** — `_minTeamHpDip` is tracked but never celebrated. Code already has a "clutch" comment at L247 but no payoff. Suggested: fire "险胜/Clutch" banner + slowmo + ult-shard refund when `_minTeamHpDip ≤ 0.35` on killing blow. perf scoring at L2214 actively PUNISHES low-HP wins (hpFrac≥0.6 bonus) which inverts the desired mood.
3. **Ult auto-fire teaches "it happens on its own" (×4)** — `tickUltReminder` 9s auto-cast (L3631) solves symptom but encodes disease. Personas suggest converting to a "hold-to-release" prompt (pause enemy fire ~1.5s, flash "按 R 释放!") before auto-firing.
4. **Basic texture (×3)** — Same visual every swing ("const toy = 'yarn'" hard-coded L1852, comment promises rotation that never happens). Crit/light/heavy tier model exists but basics never escalate.
5. **Cautious kiter has no ceiling (×4)** — Fights can run 70+s with `_closing` only reaching ~0.24 at 30s. No shrinking circle, no DPS-up-when-safe, no "there IS nothing for a cautious kiter to DO" alternative to just... waiting.
6. **Impatient / fleeing at 18s (×2)** — Turns out this is `ULT_COOLDOWN_SECONDS=18` mark, i.e., players who don't feel the ult charging exit at the "when do I get one" threshold.
7. **Panic persona's shield verb opaque (×1)** — `shieldFired=4` flat across 8 battles = zero agency on the verb; 3 hidden gates stack (cd + wardDuration + castWard's "only when attacker visible" condition).
8. **Enemy archetype sameness (×2)** — `battle.js:768` role assignment reads the same whatever the species; every enemy is a dps sponge in different clothes.
9. **Auto-battle = spectator loop (×2)** — Auto fires ult only when actively in range with 3 gates, last gate is reactive geometry; auto-player has no "commander" lever.

**P2 (2, findings-only):**
1. `gradeBattle` (game.js:174) produces 3 bits (healthy / swift / clever) but lossily collapses them into one grade — stars under-reward multi-dimensional wins.
2. Impatient persona's "glowing burst at 10–12s" is a wall-clock race-timer and would collapse the loop; design intent correct, implementation suggestion wrong.

**AUTO-FIX OUTCOME:**
- ❌ P0-1 (basic prime-pip system) → findings-only. Fix bundle includes new fields + VFX + SFX + cross-file logic; cron rule excludes architecture work. Doing only the numeric slice (cd 0.6→0.9) in isolation is not in the adversary's suggestion and could regress band-fitness.
- 0 commits, 0 reverts. **No new low-risk P0s this cycle.**

**Branch state:** `main` 29 commits ahead of origin/main after V5 merge (commits `47f23f00` + `f1064a9a`); NOT pushed.

**Signal strength note:** 35 P1 across 6 personas with consistent theme (verb legibility + close-win catharsis) is the single strongest findings signal in the log — owner-review candidates are the coach-split, clutch banner, and ult hold-to-release conversions.

## Playtest cron 2026-11-25T19:33:51Z: 2nd post-V5 cycle (34 critiques, 2 P0, 29 P1, 3 P2)

**Headline:** Cat Bond's combat is a working basic-attack game wearing a 6-element kit as costume — the depth layer is authored but not forcing, feedback is loud but not prioritized, and both the lazy and cautious persona have discovered that NOT playing is the dominant strategy; ship task #52 and a real post-mortem first, then the forcing/feedback fixes beneath them.

**Infra:** 21/68 StructuredOutput fails (~31%). Pre-sim gate PASS.

### Two adversary-confirmed P0s — both findings-only (NOT low-risk)

**P0-1 [panicky, post-mortem feedback vacuum]**
- Critique: avgSeconds=31.35 is NOT the 85s clock-cap — these are team-wipes bucketed as `finish(false) → result='flee'` with no post-mortem. Panicky players can't self-diagnose; a grey "flee" screen reads as "time ran out — your fault." Combat tunes escalation aggressively but has ZERO post-fight reflection surface.
- Proposed fix bundle:
  - Split `finish(win)` into win/wipe/timecap outcomes (logic split)
  - Render 2-3 line **post-mortem UI panel** on loss (new widget, new VFX pipeline)
  - **New i18n strings** for "which cat fell first", "top-damage enemy ability", "X seconds no skill"
  - New telemetry bucket
  - CRIT_HP_FRAC bump 0.25→0.40 for signature-panicky (we already run 0.45)
- **Classification: findings-only.** New UI + i18n + telemetry schema = architecture/i18n-structure work explicitly excluded by cron rule.

**P0-2 [impatient, task #52 still unshipped — basic-dominance economy]**
- Critique: 0/8 battles touched E or Ult while basic fired 1300-1767 times. Basic is a self-sufficient win condition; Q/E are a flavor tax; Ult is a cutscene button players forget exists. Code at L1851 CONFESSES the intent ("FINISHER on status-marked targets and weaker on un-marked ones") but damage resolver doesn't enforce it. Task #52 ("普攻可选技能收紧 + Q/E技能升ULT + 冷却差异化") has been pending through this entire playtest batch.
- Proposed fix bundle:
  - Hit resolver: isBasic+no-mark → ×0.35; isBasic+mark → ×1.3-1.5 consume mark (new dmg bucket + mark consumption cross-cutting)
  - SKILL_CD_MULT 1.3→1.0 on E path only (numeric)
  - gainUlt on E 6→14, basic +2→+1 (numeric)
  - New HUD hint (new i18n)
  - Audit all starter E to guarantee mark-applying tag (skill-table surgery)
- **Classification: findings-only.** Core damage resolver restructure + mark-consumption cross-cutting + i18n change = architecture work, explicitly excluded.

### Recurring P1 themes (29, findings-only)

1. **One encounter archetype in different costumes (×6)** — 13.9/13.9/13.9/14.5s win cluster + 15.9/16.7s flee cluster is not RNG; every variety knob (rarity, packSize, wildLevel, _stomp) pushes the same dial: enemy HP. Open → 2 rotations → ult → clean-up in a 12-17s band. Suggestion: 3 archetypes (swarm 6-9s, duel 22-30s with phase thresholds, ambush 10-14s pre-charged specialMeter).
2. **Feedback present but not prioritized (×4)** — Heartbeat is one-shot ping (line 4370), vignette breathes on timer not hit-events, enemy telegraph draws into same VFX soup as skill FX. Suggestion: looping BPM-scales-with-HP heartbeat; on-hit vignette spikes; desaturate rest + directional edge-arrow when _dangerFrac<CRIT.
3. **Cautious-kiter 99.63% idle = agency bug (×5)** — Manual mode is a strictly-worse version of auto; a cautious kiter perfect-kiting on auto literally has nothing to DO. Pacing valves (_closing, _pressure) are enemy-side one-sided faucets with no player escalation.
4. **Phase system exists but hollow (×2)** — battle.js:4769 HAS phases for SR/SSR but at fixed HP thresholds with no rotation change. Rotation never varies.
5. **Ult economy has no narrative author (×3)** — gainUlt fires from 8+ sites without unified pacing; players can't predict when R will be available and give up on it.
6. **Combo slope not ramp (×2)** — +20% cap at combo 50 on sqrt curve, silent milestones; the berserker gauge exists but is cosmetic for mashers.
7. **One-shot ult cinematic underselling (×1)** — slowmo=0.18 + shake=0.55 is too soft for a 100-energy payoff.
8. **Starter kit homogeneity (×3)** — Every cat's Q+E defaults are variations of "projectile + dash"; no mechanical asymmetry between elements at loadout 1.

### P2 (3, findings-only)
1. Berserker-bar wish is weak version of right instinct — comboMult exists but caps at ×1.20 (invisible) with trickle-to-ult that mashers ignore (the button they refuse to press).
2. 懒人 persona needs run-end meta-layer (none currently exists).
3. stompStreak ramp is uni-directional (tightens AI) with no negative mirror (no dampener if player struggling).

### AUTO-FIX OUTCOME
- ❌ P0-1 (panicky post-mortem) → findings-only. New UI panel + i18n + telemetry schema.
- ❌ P0-2 (task #52 basic economy) → findings-only. Damage resolver restructure + mark consumption + skill-table surgery.
- 0 commits, 0 reverts. **Combat reads healthy for auto-fix scope this cycle** — the 2 P0s are architectural asks the cron correctly keeps out of my hands.

**Branch state:** `main` 30 commits ahead of origin/main; NOT pushed.

**Cross-cycle signal:** Previous cycle's dominant P1 was "verb invisibility"; this cycle's dominant P1 is "same encounter in different costumes" + "basic-dominance". Combined, these two cycles produce the strongest case for shipping **task #52** (the owner's own pending item) as the single highest-leverage design change.

## Playtest cron 2026-11-25T20:35:46Z: 3rd post-V5 cycle (35 critiques, 3 P0, 25 P1, 7 P2)

**Headline:** Combat is mechanically rich but strategically flat — depth exists in the engine (tags, STAB, phases, _closing, _pressure, _inCrit, roles) but is never on the player's critical path; every persona collapses the fight into a single dominant verb (mash basics, kite-heal, or let auto play), and the first 18s have zero visible momentum beats for the impatient to stay for.

**Infra:** 22/70 StructuredOutput fails (~31%). Pre-sim gate PASS.

### Three adversary-confirmed P0s

**P0-1 [cautious kiter, arena shrink + gap-closer]** — findings-only.
- Critique: 8/8 timeouts at 38.2s with 0 wins. battle.js's "anti-turtle" ramps (_pressure, _closing) are CONSEQUENCE modifiers on player hits — a zero-output kiter never sees them. Comment at L4389 ("zero-output turtle gets no free progress") literally defends the failure mode. No POSITIONAL forcing function exists.
- Fix bundle: new `_arenaRadius` field + dusk/weeds encroachment ring render + bilateral neutral DOT + timer-gated enemy pounce.
- **Classification: findings-only.** New field + new render + new AI branch = architecture.

**P0-2 [cautious kiter, dodge sustain farming]** — **AUTO-FIXED (72c7bf1b).**
- Critique: dodge is strictly dominant and self-sustaining. Perfect-dodge pays +18 ult + combo; good-dodge pays 4% maxhp + 6 ult + shortened cd. A patient player discovers dodging IS the gameplay loop — zero survival pressure to attack. 85s timeout resolves as "wild cat flees" (not a scored loss).
- Fix (LOW-RISK local logic gate): hurtEnemy() timestamps `this._lastOffenseT` on every direct (non-DoT, non-duo) hit. Dodge resource rewards (heal + ult + combo) gated on (t - _lastOffenseT < 3). i-frames, bullet-time, dodgeCd shorten, VFX all stay unconditional.
- Gate: all 4 combat scripts PASS. Commit `72c7bf1b`. Not pushed.

**P0-3 [impatient, first 18s design-dead]** — **AUTO-FIXED (5b443ad7).**
- Critique: 18s flee lands EXACTLY on ULT_COOLDOWN_SECONDS=18 (battle.js L14) and BEFORE _closing ramp even starts. tempoScale=0.64 stretches the clock to feel calm, but no visible momentum beats before the patience cliff.
- Fix (two LOW-RISK numeric tunes): (1) `_closing = clamp((t-12)/18, 0, 1)` was (t-25)/20 — execute dmg + poise-refill suppression now bite at ~12s. (2) `captureThr = 0.28 + 0.14 * clamp(1 - t/20, 0, 1)` was const 0.28 — capture-ready ring arms at up to 0.42 HP in first ~20s.
- **PARTIAL REVERT:** adversary also suggested `this.ult = 25` seed at battle start. Tripped `check-cat-bond-band-fitness` NEG-CONTROL C1 — frozen-out-of-position cat auto-cast R from the corner and dealt 5156 AOE damage (should be ~0). That slice reverted; the two safe tunes shipped as commit `5b443ad7`.
- Gate: all 4 combat scripts PASS post-fix. Not pushed.

### Recurring P1 themes (25, findings-only)

1. **Basic dominates (×8)** — Q is 0.3% of inputs; starter Q fan power 0.8 on 4.5s CD = rounding error next to 50+ basics/min. No mark-consume loop, no armor break, no cooldown reset for basic. Adversary suggests Q as SETUP skill (applies tag → next basics ×1.8-2.2 and consume mark) — same ground as cycle N-1/N-2's task #52 signal.
2. **"Skill-momentum" multiplier idea (×2)** — Specific suggestion: Q/E lands → f._skillMomentumUntil = t+1.6 → basic ×1.4 inside window, ×0.7 if pure-basic for 3s. Keeps DPS parity on ideal rotation but makes rotation rhythmic.
3. **Combo flatlines at 20 hits (×3)** — comboMult caps ×1.20 at combo 50; heat caps shake at combo 20; 3,194 hits of identical feedback in a 3,214-hit fight.
4. **Danger feedback wrong noun (×2)** — Vignette telegraphs player STATE; a masher watches the enemy sprite not screen edges. No per-projectile "this one is lethal" tag.
5. **Phase system hollow (×2)** — SR/SSR phase at fixed HP thresholds but rotation never changes.
6. **Ult economy no narrative author (×2)** — gainUlt fires from 8+ sites without unified pacing.
7. **Starter kit homogeneity (×3)** — Every cat's defaults are projectile + dash; no mechanical asymmetry at loadout 1.
8. **Auto mode = spectator loop (×3)** — Smart-auto has no "commander" lever for the player.

### P2 (7, findings-only)
1. Berserker gauge wish: combo exists, caps invisible, grants ult (the button the complainer refuses to press).
2. Run-end meta-layer missing.
3. stompStreak uni-directional (no dampener if struggling).
4-7. Various cosmetic/signaling asks.

### AUTO-FIX OUTCOME
- ❌ P0-1 (arena shrink + gap-closer) → findings-only. Architecture.
- ✅ P0-2 (dodge sustain gate) → **commit `72c7bf1b`** (4-gate verified).
- ✅ P0-3 (front-load _closing + captureThr) → **commit `5b443ad7`** (4-gate verified). Partial: `this.ult=25` slice reverted on band-fitness C1 fail.
- **2 auto-fixes shipped, 1 slice reverted, 1 P0 findings-only.**

**Branch state:** `main` 51 commits ahead of origin/main after these two commits; NOT pushed.

## Playtest cron 2026-11-25T22:54:36Z: 4th post-V5 cycle (39 critiques, 2 P0, 31 P1, 6 P2)

**Headline:** Combat is dense with hidden depth, but every persona's fun score is bleeding at the same wound: the first 18 seconds have no legible payoff, defensive and skill verbs lack identity, and losses/wins/timeouts all collapse into one invisible sawtooth — fix pacing legibility and feedback differentiation before adding content.

**Infra:** 17/69 StructuredOutput fails (~25%). Pre-sim gate PASS.

### Two adversary-confirmed P0s — both findings-only

**P0-1 [panicky, 0 ults across 8 battles]**
- Critique: 0 ults means ult is undiscoverable. initCoach's steps array (L303) has NO ult step — Q/E/dodge taught, R never. Passive gainUlt 8/dt = ~12.5s to first full; early panicky fights end before banner fires. "R" button glyph on HUD is the only affordance.
- Fix bundle: (a) new coach step on first canUltimate() — UI/coach arch. (b) sticky `_ultReadyBanner` + new `ultUses` state — new state field. (c) `gainUlt((ultUses===0 ? 14 : 8) * dt)` — conditional first-fight boost.
- **Classification: findings-only.** New coach step + new state field + save-adjacent `ultUses` counter = architecture work excluded by cron rule.

**P0-2 [impatient, first dopamine beat before 18s]**
- Critique: 18s flees cluster EXACTLY at ULT_COOLDOWN_SECONDS. First 18s is dopamine-empty — no stagger, no ult prompt, no closing vignette. Previous attempt at this (commit `5b443ad7` _closing 25→12) was REVERTED (commit `b6e5080c`) because stand-at-max control beat baseline in MOBA judge.
- Fix bundle:
  - `this.ult = 0 → 35` seed — **ALREADY TRIED, broke band-fitness C1** (frozen cat auto-cast R from corner, 5156 AOE dmg where ~0 expected).
  - `ULT_COOLDOWN_SECONDS 18 → 12` — Actually only controls BETWEEN-ult cooldown (L3185 sets ultCd AFTER ult fires), won't affect first-fight 18s cliff.
  - Early guaranteed stagger at t≈6s + combo≥5 — new conditional + new VFX sequence, architecture.
  - `_closing 25→15` — close to the already-reverted 25→12; the sim judge showed passive standoff benefits more than player.
- **Classification: findings-only.** Every slice either already failed a gate OR is architecture OR misdiagnoses the knob (ULT_COOLDOWN_SECONDS is between-ult only).

### Recurring P1 themes (31, findings-only)

1. **Masher Q unready-feedback (×4)** — `skillQ: if (f.cd.q > 0) return false;` silently eats presses. 75-90% of Q button presses are no-ops with zero feedback. Suggestion: denied-click SFX + red-gray shake + "CD 0.7s" micro-label.
2. **Loss cluster at 15.9-16.7s (×3)** — Losses have no post-mortem, no second act, no `TEAM_CRIT_FRAC` phase gate like enemies have. All losses one shape.
3. **Within-fight mercy band missing (×3)** — `lossStreak` mercy is BETWEEN fights; nothing catches a player WITHIN a tilting fight. Suggestion: `lastStandThreshold = 0.35` incoming-DR when aggregate team HP < 35%.
4. **First 18s design-dead (×4)** — Already covered in P0-2 but recurring across personas; the fourth time this theme recurs suggests it's a high-priority REAL problem that adversary's proposed knobs don't actually fix correctly.
5. **Q/E iconic signature missing (×3)** — regularSkillAccent reuses element palette → Q lands look identical to basic when element matches. Skill hits should have wider arc / brighter flash / hitstop.
6. **Combo flatlines at ~20 (×3)** — comboMult sqrt-capped at ×1.20; 1500-3200 basics is 3194 identical feedback events after first 20.
7. **Ult teach gap (×2)** — Separate from P0-1 wording; multiple personas note R is never introduced in coach.
8. **Cautious kiter still dominant strategy (×2)** — despite P0-2 gate from prior cycle, auto-mode manual mode difference not bridged.
9. **Enemy archetype sameness (×2)** — one HP pool in different colors.

### P2 (6, findings-only)
1. Combo meter cap invisible to high-APM mashers.
2-6. Various cosmetic/polish asks (floater variety, audio differentiation, etc).

### AUTO-FIX OUTCOME
- ❌ P0-1 (panicky ult discoverability) → findings-only. Coach arch + new state field.
- ❌ P0-2 (impatient first-18s dopamine) → findings-only. Previously-failed gates + misdiagnosed knob.
- 0 commits, 0 reverts this cycle. **Combat reads healthy for auto-fix scope** — both P0s are structural asks the cron correctly keeps out of my hands.

**Branch state:** `main` 57 commits ahead of origin/main; NOT pushed.

**Cross-cycle signal (now 4 cycles):** "first 18s design-dead" + "0 ults across N battles" + "Q silently eaten by cd" cluster is the strongest findings signal. Owner-level call needed on coach-split (teach R + split E coach steps) and skill-ready feedback — both are UI/coach architecture out of auto-fix scope.

## Playtest cron 2026-11-25T23:34:21Z: 5th post-V5 cycle (36 critiques, 2 P0, 33 P1, 1 P2)

**Headline:** Cat Bond's combat sim is well-tuned but encounter-shape and input-grammar are a monoculture — basics carry every fight, skills don't sequence each other, and three cohorts (kiter, panicky, impatient) hit identical dead ends the mercy stack hides instead of fixes.

**Infra:** 21/70 StructuredOutput fails (~30%). Pre-sim gate PASS.

**NEW this cycle:** adversary prompt + RSI balance-probe + propose.mjs now reference `docs/combat-redesign/BALANCE-BRIEF-passive-p1.md` so critiques route into the pending passive system rather than inventing new global knobs. See 3 commit chain: `c3c1677f` brief + `6bd3962e` wiring.

### Two P0s — both findings-only (route into P1 passive system)

**P0-1 [cautious kiter, dodge → counter]**
- Critique: perfect/good dodges only reward the DEFENDER (slowmo, i-frames, ult, combo) — nothing touches attacker's HP/poise/vulnerability. _closing is documented as "only amplifies LANDED HITS" so zero-output kiter never sees it. 8/8 timeouts at 38.2s.
- Adversary fix: `attacker.vulnerableT = 1.4` on perfect dodge + poise break — essentially building a NEW dodge-counter mechanic.
- **This duplicates 团团's 碎霜反击 pending passive** (shield-break → freeze + poise削减). The P1 brief's 团团 spec addresses the "defensive → offensive tempo" gap for shield cats. Different cat triggers (kiter uses perfect-dodge, 团团 uses shield-break) but same underlying design shape.
- **Classification: findings-only.** Would collide with 团团 passive. Owner call: either add a SIMILAR passive for a dodge-focused cat (candidate 雪袜 or new) OR let 团团 be the shield-counter example and keep dodge rewards as-is.

**P0-2 [panicky, boss basic-armor]**
- Critique: 0/8 panicky mash death at ~31s. Mercy stack (playerDmg +40%, enemyDmg -45%, _autoAssist 0.8, closing suppress etc) is INVISIBLE to a panic-masher; they can't feel the fight easing because they're dying while mashing basics.
- Adversary fix: new `e.basicResist = 0.55` field on elite/boss, -55% floater VFX, new i18n banner "按 Q/E 技能", split `finish()` telemetry.
- **Architecture**: new enemy field + new UI floater + new i18n + modified dyingNoSkill gate + telemetry schema split.
- **Classification: findings-only.** Several pieces. Also note: this is partially addressed by Task #52 Phase A (basic ×0.70 globally) still in task-52-review stash — once that lands, the "basic dominates" complaint weakens.

### Recurring P1 themes (33, findings-only)

1. **Basic/skill sequencing missing (×8)** — several personas: Q/E doesn't change next basic; no rotational coupling. Adversaries propose `empoweredBasics` from Q cast. **This is Task #52 Phase B territory** (already decided NOT to do).
2. **Frenzy / berserk layer missing (×3)** — press-count-not-hit-count escalation for mashers. New mechanic; not in V4 passives.
3. **_closing only amplifies landed hits (×5)** — same critique as P0-1, voiced across kiter personas.
4. **Impatient 18s cliff (×4)** — again. Previous attempts at fixing this reverted.
5. **Panicky invisible mercy stack (×4)** — same critique as P0-2.
6. **Explorer boredom at 20+ fights (×3)** — adversary suggests encounter-shape variety (archetype templates). Not covered by any pending work.
7. **Lazy auto spectator (×3)** — no commander-lever. Not covered.
8. **Interrupt / counterplay missing (×3)** — no enemy mechanic forces Q/E/dodge specifically.

### P2 (1, findings-only)
1. Combo cap +20% too soft for mashers (same combo-flatline complaint as prior cycles).

### AUTO-FIX OUTCOME
- ❌ P0-1 (dodge-counter) → findings-only. Routes into 团团 passive OR new cat passive.
- ❌ P0-2 (boss basic-armor) → findings-only. Architecture + partially covered by Task #52 Phase A.
- 0 commits, 0 reverts this cycle.

**Branch state:** `main` 60 commits ahead of origin/main after `6bd3962e`; NOT pushed.

**Cross-cycle signal (5 cycles):**
Three themes now reach **cycle-5 recurrence**:
1. Basic dominates / skill grammar missing — direct map to **Task #52 Phase A** (ready in task-52-review stash) + **P1 passives** (sequencing comes via 蓝莓 冰川破击, 奥利奥 残影, 杏仁 move-charge, etc).
2. First 18s dopamine cliff — no clean fix in pending work; needs coach redesign.
3. Kiter dead-end — maps to a dodge-counter passive (NEW CAT candidate; not in V4's 33).

**Next structural recommendation (owner-level):** ship Task #52 Phase A + infra PR + 12-cat P1 PR as a coordinated release. These collectively address ~70% of the recurring P1 cluster.

## RSI 2026-11-25T23:53:25Z — no agent proposal beat baseline; archive 2/64

4 candidates proposed to fill low-tempo / mid-engage / varied-durability niches:
- `low-tempo-anchor` (anchor 70-120)
- `cd-hugger-dropoff` (3-phase on cd+hp)
- `edge-of-skill-range` (outer edge 140-175)
- `hurt-hug-retreat-mix` (hp-gated hug/kite)

Result: winner='?' (none beat baseline 0.752); control check clean (no guard trip); archive 2/64 unchanged. Balance: water(0.50) fire(0.57) cv=0.053 gap=0.073. Signal is still that archive is reachability-capped near ~5 cells — proposing more rules at current harness config won't grow coverage.

Side note: compared to 2026-11-25T20:46:46Z (guard-FAILED), this cycle's clean control-check suggests the task-52-review branch's reverted P0-3 `_closing` ramp + the shipped dodge-sustain-gate (72c7bf1b) rebalanced the sim so passive-standoff no longer beats baseline.

## Playtest cron 2026-11-26T00:32:53Z: 6th post-V5 cycle (45 critiques, 7 P0, 29 P1, 9 P2)

**Headline:** Combat is systemically legible to the designer and systemically invisible to the player — the pacing, escalation, ult, and capture-window mechanics all already exist in battle.js but render as a silent flatline from every persona's seat, so the top fixes are feedback and verdict, not numbers.

**Infra:** 11/69 StructuredOutput fails (~16%, lowest noise all week). Pre-sim gate PASS.

**NEW context this cycle:** first cycle sim'd Task #52 Phase A + 33 passives + yard counter-seed + role-gates + lickWound + 14 prior P0s + V5 VFX.

### Seven P0s — ALL findings-only (architecture / UI / feedback layer)

**P0-1 [masher, under-utilization re-coach]** — new `battleStats.everUsedX` state fields + new "unblockable" telegraph kind + HUD pulse. State schema + new VFX = architecture.

**P0-2 [kiter, closing-lift for P1 passives]** — kiter identity passives (跳跳/蓝莓/奥利奥) should sense `_closing > 0` and lift stack caps. Requires editing every P1 passive + broadening execute window. Passive-system-wide change.

**P0-3 [kiter, encounter-modifier roll]** — new enemy pack tags (elite/ambush/enrage/reinforcement/terrain-hazard). New pack-building system, not covered by P1 passives.

**P0-4 [panicky, silent CD whiff]** — `whiffSkill(f, slot)` helper giving every blocked skill press feedback (HUD pulse + audio + tink). Smallest P0; still needs new helper + 2 new SFX + i18n for "x.xs" floater. Architecture border.

**P0-5 [panicky, ult never fills in short fights]** — `this.ult=60` seed + new `State.battleCount` field + modal blocking cinematic on first-ever-ready. ALREADY FAILED (commit `5b443ad7` → `b6e5080c`) when similar seed broke band-fitness C1. State schema change.

**P0-6 [panicky, verdict-absence on timeout]** — new `result:'defeat'` state + "决胜一击" telegraphed finisher + scored verdict. New state transitions + new i18n + new VFX.

**P0-7 [impatient, 18s cliff + no mid-fight beat]** — new mid-fight telegraphed beat at t≈10s. New enemy AI branch. Previous attempts to fix 18s cliff reverted (commit `b6e5080c`).

### Recurring P1 themes (29, findings-only)

The strongest 5+ cycle signal continues: **basic dominates / feedback invisible / coach not re-asserted**. The passive system IS in the sim now (33 traits) — adversary notes **passives don't fix feedback/HUD gaps**; they're combat-identity flavor on top of a loop the player hasn't entered.

### P2 (9, findings-only)
Mostly polish: VFX intensity, SFX variety, floater color-coding.

### AUTO-FIX OUTCOME
- ❌ 7/7 P0s → findings-only. Every single P0 is UI/state/architecture; cron rule excludes. Also several hit previously-reverted territory.
- 0 commits, 0 reverts.

**Branch state:** `main` 66 ahead of origin/main after yard-counter fix (`4f1210fd`); NOT pushed.

**Observation on the passive system:** First cycle with 33 traits active in sim. Adversary doesn't attribute any P0 to a trait being broken — traits are "invisible" per the "feedback systemically invisible" headline. That's actually expected: traits fire in-code but have ZERO HUD rendering (we skipped the UI-render-for-traits item earlier).

**Owner-level recommendation:** next biggest-leverage ship candidates (all excluded from auto-fix by cron):
1. **UI render for passive traits** (so players see 准备/触发/消散 phases). Fixes the "invisible" problem the P0-2 closing-lift + P1 feedback cluster both circle.
2. **Coach re-coach** (P0-1): once-per-save isn't enough; re-arm per battle on battleStats.everUsedX == false.
3. **Verdict split**: finish(false) → defeat vs flee vs timeout (P0-6).

## Playtest cron 2026-11-26T01:53:36Z: 7th post-V5 cycle (39 critiques, 4 P0, 26 P1, 9 P2)

**Headline:** Cat Bond's combat telemetry hides three systemic gaps — invisible escalation, flat basic-attack rhythm, monochromatic enemy loop — every persona except auto-battler and explorer quits before the design's real beats land.

**Infra:** 17/69 StructuredOutput fails (~25%). Pre-sim gate PASS. First cycle with: damage global bump, 水鞭 width/VFX rewrite, enemy single-shot sprite fix, enemy basic yarn/fish, melee fire-gate 50→76.

### Four P0s — all findings-only

**P0-1 [masher, cooldown starvation + enemy identical cadence]**
- Mercy band only tunes magnitudes, not tempo. Masher's failure = cooldown starvation (4-6s skill gap), not weak hits. Also "dmgTaken=428 every time" — no enemy windup/interval jitter.
- Fix bundle: new mercy-band third axis (cd ×(1-0.35m) at lossStreak≥5) + new enemy AI jitter (±8-12%).
- **Classification: findings-only.** New state tracking + new AI timing override = architecture. Adversary explicitly says "route stand-still fantasy into 汤圆 storage-strike passive instead of a global knob."

**P0-2 [panicky, 58 taps/sec basic with no tempo feedback]**
- 1788 basics in 30.5s, 0 kills. Game silently absorbs every tap. No "basic alone will never finish this" signal.
- Fix bundle: new basic-mash streak counter + "重击就绪" HUD prompt + glow + skill-slot pulse. New field + new VFX + new i18n.
- **Classification: findings-only.** Architecture. Adversary notes: "wire this streak into the P1 trigger plumbing" — i.e. this is Task #52 Phase B territory (already owner-declined).

**P0-3 [impatient, 18s cliff + invisible _closing]**
- 18s = ULT_COOLDOWN_SECONDS. `_closing` ramp works (t25→t45) but is design-INVISIBLE (post-stagger poise + sub-28% execute). Player bails before any of it shows.
- Fix bundle: new vignette darkening at t=12 + enemy red rim + "收网" HUD pip.
- **Classification: findings-only.** New VFX + new HUD element + new i18n. Previous attempts at 18s cliff all reverted.

**P0-4 [impatient, 1600 basics no payoff]**
- Phase A basic nerf backfired: mash count went UP because basics stayed the reliable lever. Need escalation inside basics.
- Fix bundle: new basic-combo meter + free empowered strike every N connects + enemy armor-crack overlay at HP tiers.
- **Classification: findings-only.** Nearly identical to P0-2 (same fix class). Adversary routes to 汤圆 storage-strike passive.

### Recurring P1 themes (26, findings-only)

1. **Defense-mash detector (×3)** — `_stalled` teaches OFFENSE when the panicky/masher death mode is DEFENSE (no dodge, no shield). Reactive re-teach via mash-stall-defense banner.
2. **Mid-HP stall dead zone (×2)** — `_closing` close-bonus gated on sub-28% HP → fights stuck at 41% HP get ZERO help while enemy-side ramps run across full band.
3. **Deterministic enemy pattern (×4)** — no windup/interval jitter → "428 every time". Flat loss texture.
4. **passive UI render missing (×3)** — same as cycle 5-6: 33 traits run invisibly.

### P2 (9, findings-only)
Various polish + "wrong fix would collide with passive brief" critiques.

### AUTO-FIX OUTCOME
- ❌ 4/4 P0s → findings-only. All architecture/UI layer.
- 0 commits.

**Cross-cycle signal** (now 7 cycles):
- **basic dominance**: Phase A shipped, adversary says it **made the count go UP**. Task #52 Phase B (mark-consume) was declined by owner — this remains open.
- **first 18s invisible**: 3× reverted attempts. The 18s cliff is now the #1 persistent complaint.
- **loss determinism**: new signal — enemy AI has no jitter.

**Owner-level ship candidates**:
1. Enemy AI jitter (small, numeric-ish, might actually be low-risk if it's just `fireCd *= 0.92+rng*.16` — closest to cron-eligible)
2. Mercy band 3rd axis (cd reduction at high lossStreak)
3. Visible `_closing` telegraph at t=12
4. (long-standing) Passive UI render

**Branch state:** `main` 73 ahead of origin/main; NOT pushed.

## RSI

RSI cycle 2026-11-26T02:49Z: agent-proposed `burst-window-bimodal` (bimodal CD-reactive: contact 32-60 when BOTH q+e ready, retreat 220-280 otherwise) scored 0.779 vs baseline 0.788 — did NOT beat the engine, but filled a new MAP-Elites cell `1,2,3` (engage 0.42 / tempo 0.74 / durability 1.00) and ranked #2 overall, ahead of hand-authored `ready-aware-hitrun` and `stand-at-max-range` control. Archive coverage still 2/64 (replaced the max-range control elite rather than adding a third niche). Four other agent proposals (berserker-deep-hug, fence-sitter-inversion, crit-hp-sprint, hp-linear-slider) ranked below baseline; none filled new cells. BandBody format bug (statement body vs function expression) in prior cycles silently dropped all agent proposals — fixed this cycle; previous RSI history entries did NOT evaluate agent candidates, only hand-authored rules.

---

## Playtest cron — 2026-11-26T03:36Z  (wn6wmtgzj)

**Headline (adversary synthesis)**: Combat is mechanically healthy but legibility-starved — five of six personas can't read the systems the game has already built. Tutoring teaches 1 of 5 verbs; autoMode silently strips the rest; the kiter is orphaned by Phase A's basic nerf; every passive payoff the P1 brief is about to ship will land invisible unless feedback tiers, charge pips, and attribution surfaces go in first.

**Distribution**: 39 critiques → **1 P0**, 32 P1, 6 P2.  (18 agents hit StructuredOutput retry cap and were lost; 52/70 delivered.)

### P0 (findings-only — NOT auto-fix-eligible)

- **P0-1 `谨慎型 cautious` — kiter orphaned by _closing bias.** `_closing` (battle.js:4607) ramps 25→45s and only (a) suppresses stagger-poise refill and (b) adds +0..0.25 execute dmg on sub-28% HP non-bosses. Both require the player to ALREADY land meaningful hits — a kiter by definition isn't chain-breaking or shoving enemies under 28%, so `_closing` is dead-letter for them and fights slide to the 85s backstop as timeout-flees. Resolution system has no path that converts kiting MOTION into closure.
  - **Adversary's suggested fix**: route into P1 passive brief (tune 杏仁 move-charge to discharge at ~20s kiting; add forced-release clause to 汤圆 storage-strike when t>50s + idle 3s) + extend `_closing` with a motion-distance-keyed secondary effect.
  - **Why findings-only, not auto-fix**: multi-file design change (BALANCE-BRIEF-passive-p1.md edit + battle.js logic extension + couples with unshipped 杏仁/汤圆/跳跳 passives). Not a local numeric tune / balance multiplier / passive floor / additive feedback cue — this is architecture-adjacent routing between unshipped systems. Owner review required.

### P1 (findings-only, ranked by cross-persona recurrence)

Button masher (×4):
- Basic nerf (Task #52 Phase A, 0.70 mult) is explicitly a losing build-order by design, and the game never tells the masher — opening coach teaches 1-of-5 verbs then goes silent. No adaptive nudge after N flees. Fix hooks exist (`this._obs`, coach step renderer) but unused.
- 13.8s avg fight is BELOW P1-brief's own 15s assumption for 杏仁/桃桃/墨青 passives → 4-5 P1 cats will underfire by the brief's own "Dead-Trait" criterion.
- Coach silently self-destructs when `autoMode=true` (battle.js:317, :351) → touch players + anyone who toggled auto once never see the tutorial AGAIN.
- Coach curriculum is missing the ult step entirely; R (loudest button) is not on the teaching path.

Cautious kiter (×6):
- 36 pokes + 1 Q = timeout is the honest readout of kiter orphaning. 99% basic-idle + timeout-every-fight reads sleepy.
- No archetype-reactive levers — the "player is stuck" detectors are blind to the cautious-kiter signature.

Explorer (×6):
- 290:1 basic-to-skill ratio is a red herring — hold-to-fire basic on 0.5s cd naturally dominates.
- Phase system exists in battle.js but is enemy-only (:5006); no player-side phase bump.
- 88% win / 0 faints across 8 battles → baseline encounter is solved, not under-varied; escalation gap.

Panicky (×4):
- Discovery failure dressed as pacing. Current fix stack conceals it — mash-stall teach can't find the panicked player.

Lazy auto-battler (×3):
- Battle ends → player learns nothing, decides nothing. Not a scoring-card gap; a feedback-loop gap.

Impatient (×6):
- 8 battles, 0 shields, 0 dodges, 0 ults is damning — game onboarded one verb and forgot the rest.
- Enemy "Wild morale" bar shows absolute values; player can't gauge progress.

### P2 (findings-only, surface asks rejected)

- Global 怒气槽 / auto-poise ask: collides with 汤圆 storage-strike + 团团 shield-break-freeze passives — route into those, not a new global knob.
- "Longer-range Q, slow/root E, burst-finisher ult" wish: band-aid; real gap is Cat Bond has no readable archetype contract.
- Juice at x50/x100/x500: cosmetic layer over an onboarding problem; adversary rejects.

### Auto-fix outcome

**0 of 1 P0 auto-fixed.** The sole P0 fails the cron's low-risk filter: it requires editing unshipped-passive design brief + multi-system routing between `_closing` and three P1 passives. Logged for owner review.

**Branch state:** `main` 5 ahead of origin/main; NOT pushed.

---

## Playtest cron — 2026-11-26T05:42Z  (w1dgyb0za)

**Headline (adversary synthesis)**: Cat Bond's combat is diagnostically rich but experientially silent — the engine already measures the fight (mercy ramps, closing windows, dodge tiers, auto skill-casts) and then hides all of it, so every persona feels they're fighting a flat HP bar. P0 fix is one legibility pass across those hidden systems + an enemy-side aggression ramp to end the 99% idle equilibrium.

**Distribution**: 43 critiques → **2 P0**, 33 P1, 8 P2. (18 StructuredOutput retry-cap losses; 56/74 agents delivered.)

### P0 outcomes

- **P0-1 `谨慎型` — 99% idle equilibrium**: enemy approach speed ramps 1.0→1.6× over t∈[4,10]s since last player damage; resets on any hit landed. **Auto-fixed, commit `eb20a36a`**. 4 gates + `npm run check` all green.
- **P0-2 `没耐心型` — flat tempoScale 0.64 kills the arc**: adversary proposed time+HP ramp (0.64 → 1.00 by 14s → 1.15 under 30% HP). Applied → **band-fitness NEG-CONTROL C1 failed** (frozen cat dealt 1544 dmg instead of ~0; the tempo climax fired while a "frozen" control still processed scaled dt). **Reverted, downgraded to findings-only.** Design-level: tempo ramp needs to EXCLUDE pinned/frozen controls from the climax branch. Owner review required.

### P1 themes (findings-only, 33 critiques, cross-persona recurrence)

Button masher (×6):
- Identical 428-dmg flee losses imply mercy silent-failure OR scripted-oneshot enemy burst that still exceeds mercy's % cut.
- Loss debrief is a scalar tautology; `_obs` already has texture (threats/dodgedThreats/perfectDodges) but isn't surfaced.
- Combo rewards hit count, not variety — masher gets the same ×1.20 cap as a weaver.
- Basic/Q-E DPS gap too narrow at BASIC_POWER_MULT=0.85 → Q/E feels optional.
- 汤圆 P1 storage-strike is the masher-recovery verb but gated to one cat — mashers without 汤圆 are stranded.
- 2653-2889 inputs/27s = ~90% clicks have no feedback.

Cautious kiter (×7):
- 99% idle equilibrium (now partly addressed by P0-1 ramp).
- Perfect-dodge sustain economy gates on recent offense, kiter never qualifies.

Explorer (×5):
- Baseline pack solved 88% / 0 faints → encounter solved, not under-varied.
- Phase system is enemy-only; player has no mid-fight escalation beat.

Panicky (×5):
- Current mash-stall teach can't find a panicked player.
- Discovery-failure dressed as pacing.

Lazy (×4):
- End-of-battle shows nothing the player can decide on.

Impatient (×6):
- Now partly addressed design-wise by P0-2 (reverted); needs frozen-control exclusion to re-ship.
- 18s wall = one ULT_COOLDOWN_SECONDS tick past climax; ult timing mismatched with arc.

### P2 themes (8 findings-only)

- "Global 怒气槽 / 霸体 / 评价卡" asks keep surfacing — all collide with pending 汤圆/团团/绒绒 P1 passives. Route into traits, not global knobs.
- Juice at x50/100/500 cosmetics vs. onboarding root-cause — adversary rejects every cycle.

### Auto-fix summary

**1 of 2 P0 auto-fixed**: `eb20a36a` P0-1 enemy aggression ramp (green). P0-2 tempo ramp **reverted** on band-fitness NEG-CONTROL C1 failure; downgraded to findings-only for owner-review (needs frozen-control exclusion).

**Branch state:** `main` 18 ahead of origin/main; NOT pushed.

---

## Playtest cron — 2026-11-26T03:30Z (w9bg40pg8, BACKFILLED 2026-11-26)

**Headline (adversary synthesis)**: Diagnostically rich but experientially silent — engine measures mercy ramps / closing windows / dodge tiers / auto skill-casts and hides them all. Every persona feels they're fighting a flat HP bar. Fix requires one legibility pass across hidden systems + enemy-side aggression ramp + per-target enemyUlt cap.

**Distribution**: 43 critiques → **3 P0**, 33 P1, 7 P2. (18 StructuredOutput retry-cap losses; 56/74 agents delivered.)

### P0 outcomes

- **P0-1 \`狂按型\` — enemyUlt one-shot (5/8 identical 428-dmg flees)**: adversary diagnosis — meter fills on wall-clock schedule under tempoScale 0.64 × auto 0.88, fires at ~same second of fight; masher has no counter-verb. Fix: tag each volley pellet with `_ultCastUid` + enforce per-target per-cast cumulative cap ≤35% maxhp in resolveHit. **Auto-fixed, commit `35b9adce`** (shipped later in merge `4074e452`). 4 gates + npm run check all green at commit time.
- **P0-2 \`谨慎型\` — wild-enemy anti-kite verb missing**: proposed 4-knob bundle (enemy speed × _closing, lob/smash/proj cd × _closing, chaseMul force-engage, backstop retune). Multi-site AI architecture. **Findings-only.**
- **P0-3 \`没耐心型\` — new `_struggling` signal + execute-gate rewire**: adds new global rubber-band signal. **Findings-only** (borderline; safer not to layer new rubber-band without owner review).

### P1 themes (33 critiques)

Masher (×7): mercy band silent; loss debrief tautological; combo rewards count not variety; basic/skill DPS gap narrow; 汤圆 storage-strike only verb but gated to one cat.
Cautious kiter (×6): 99% idle equilibrium; perfect-dodge sustain gates on recent offense, kiter never qualifies.
Explorer (×5): 290:1 basic-skill ratio red herring; phase system enemy-only; 88% win baseline encounter solved.
Panicky (×5): discovery-failure dressed as pacing; current mash-stall can't find panicked player.
Lazy (×4): post-battle feedback loop gap.
Impatient (×6): tempoScale flat; 18s wall vs ult timing mismatch.

### P2 themes (7)

Global 怒气槽 / auto-poise collides with 汤圆/团团/绒绒 P1 passives — route into traits. Juice at x50/100 ask rejected as cosmetic over onboarding gap.

### Auto-fix summary

**1 of 3 P0 auto-fixed**: `35b9adce` P0-1 enemy-ult 35% cap. P0-2 kiter frustration-pounce + P0-3 struggling signal both findings-only (exceed cron low-risk bar — new AI subsystems / new global signal).

**Branch state at cycle time:** local main N ahead; `35b9adce` later shipped to prod inside merge `4074e452`.

---

## Playtest cron — 2026-11-26T08:53Z  (wh4ibbx2j, post-defense-HP-bump)

**Headline**: Combat numerically healthy but experientially one-dimensional — mashers flat damage ladder, kiters face enemies that never close, panicky can't land basic, auto-mode hides its payoffs. Fix is readability + enemy variety + input-earned feedback, not stat tuning.

**Distribution**: 37 critiques → **2 P0 (both findings-only)**, 30 P1, 5 P2. (25 StructuredOutput retry-cap losses; 50/75 agents delivered.)

### P0 outcomes (both findings-only — exceed cron low-risk bar)

- **P0-1 `谨慎型` — kiter still faces no closing pressure after defense bump**: proposal requires 4-knob bundle (enemy speed × _closing, lob/smash/proj cd × _closing, chaseMul force-engage override, backstop retune). Multi-site AI architecture change. Logged for owner review.
- **P0-2 `手忙脚乱型` — panicky can't land basic**: proposal is new aim-assist cone system (35° cone, 220u range, 0.35 lerp to nearest enemy within cone). New input-layer mechanic + mouse-aim intercept. Not a local tune. Logged for owner review.

### P1 themes (30 critiques, findings-only)

Masher (×6): smash binary teaches at 302-dmg price; ramp first-smash damage [0.14→0.26] by smashesSurvived counter. Dodge/shield autopiloted → no "PERFECT!" feedback loop → masher never learns defense. Combo is sqrt-capped +20% rhythm-less ladder.

Kiter (×4): defense-HP bump helps survival but doesn't fix kiter idle equilibrium — fight still slides to 85s backstop as timeout-flee.

Explorer (×5): adversary notes the defense formula is now visible; encounter still solved at baseline.

Panicky (×5): basic misses rate too high; aim-assist cone proposed.

Lazy (×4): post-battle debrief still tautological; _obs texture never surfaces.

Impatient (×6): ult-timing vs 18s wall mismatch persists.

### P2 themes (5)

- Combo variety vs count (same as prior cycle).
- Per-cat passive VFX not yet at UI edge.

### Auto-fix outcome

**0 of 2 P0 auto-fixed.** Both exceed cron low-risk bar (multi-site AI bundles / new input mechanic). P1/P2 findings-only per standing rule.

**Branch state**: `main` 0 ahead of origin/main. Last push: `55672463` (defense+HP bump) at prior turn.

## RSI

RSI cycle 2026-11-26T08:55Z: 5 agent proposals (defense-era-bruiser-hug, level-aware-tempo, skill-ready-sprint, ranged-poke-stable, oscillate-in-out). **WINNER: agent:skill-ready-sprint 0.796 > baseline 0.755 — first agent to hold best elite.** Control check PASS (stand-at-max-range 0.728, last). Top-3 all agents: skill-ready-sprint (0.796), level-aware-tempo (0.788), ranged-poke-stable (0.781). Archive 2/64, both elites now agent-authored (1,3,3 skill-ready-sprint, 1,2,3 ranged-poke-stable). Winning bandBody: `(f)=>{const hp=f.hp/(f.maxhp||1);const q=((f.cd&&f.cd.q)||0),e=((f.cd&&f.cd.e)||0);if(q<=0&&e<=0)return{min:20,max:45,rush:22,role:'melee',hp};return{min:90,max:130,rush:100,role:'melee',hp';}` — point-blank 20-45 when BOTH q+e off CD (one-rotation burst window), fall back to 90-130 baseline band otherwise. Hypothesis validated: the new defense+HP bump (flat+pct + 110+vit*10) rewards the "burst in → eat chip" pattern that pre-bump would have punished. Owner review for whether to apply.

---

## Playtest cron — 2026-11-26T09:38Z  (w77e6tuzq, post-RSI-skill-ready-sprint)

**Headline**: Rich engine tools (telegraphs, enemy ults, shields, passives on deck) but near-mute feedback layer — fix attribution, gate the auto-cast ult, give each persona a reason to press their dead half of the kit before shipping P1 traits on top.

**Distribution**: 42 critiques → **1 P0**, 34 P1, 7 P2. (20 StructuredOutput retry-cap losses; 55/75 agents delivered.)

### P0 outcomes

- **P0-1 `没耐心型` — 18s flee cliff is a feedback-loop problem**: adversary — pure-time `_closing` (25-45s) means impatient players hit 18s flee BEFORE execute-bonus / poise-suppress feedback ever fires. Fix: `_closing = max(clamp((t-25)/20, 0, 1), clamp(hpDealt/0.20, 0, 1))` — chipping 20% enemy-pack HP lights ramp regardless of clock. **Auto-fixed, commit `517480e8`**. 4 combat gates + npm run check all green.

### P1 themes (34 critiques, findings-only)

Masher (×6): 2500 wasted clicks/fight (no held-key auto-fire; edge-press only); hurtMe hides attribution (level-gap sigmoid / dmgTakenMult / traitArmor silent); E-slot hardcoded defensive utility so masher's E dead; ult-meter starts 0, 9s idle failsafe never fires in short fights.
Kiter (×5): action-gated closing (above P0) addresses the passive-kiter half; adversary notes 99% idle equilibrium still unreached.
Explorer (×5): still "solved" baseline encounter; enemy phases not player-visible.
Panicky (×5): aim-assist cone proposal (new input layer, findings-only).
Lazy (×6): post-battle debrief tautological; `_obs` texture still buried.
Impatient (×6): mostly addressed by P0 fix; ult-timing vs 18s wall still off.

### P2 themes (7)

- Loadout defaults need role-split (frontline keeps defensive E, backline/dps/control gets offensive E) — findings-only, touches defaultLoadout.
- Basic → held-key auto-fire (ergonomics, not DPS) — findings-only, input-layer change.
- Biggest-hits attribution floater — findings-only, UI addition.
- P2 passive "every 5th basic +60%" for masher cat identity — findings-only.
- Ult seed 15-20 on battle start — findings-only.
- Enemy-HP bar `_closing`-rim VFX (momentum tell) — findings-only.
- Coalesce floaters 0.2s window per (src,skill) — findings-only.

### Auto-fix summary

**1 of 1 P0 auto-fixed**: `517480e8` closing-ramp action gate. P1/P2 findings-only.

**Branch state**: `main` 3 ahead of origin/main.

---

## Playtest cron — 2026-11-26T10:37Z  (w6hmojrj6, post-closing-action-gate)

**Headline**: Combat has one verb (basic) and one enemy script (chase-and-swing) — the 12 pending P1 passives will land on a floor that doesn't ask players to shield/dodge/ult/read phases, so the fix is enemy-side rhythm + player-side heavy input + readable progress, NOT more passives or global dmg knobs.

**Distribution**: 39 critiques → **0 P0**, 33 P1, 6 P2. (22 StructuredOutput retry-cap losses; 52/74 agents delivered.)

### Auto-fix outcome

**Combat reads healthy this cycle — zero P0 produced.** Prior P0 themes (defense formula, enemy-ult cap, closing action-gate) all shipped in previous commits. Adversary focus has shifted entirely to systemic P1 design: enemy AI phase shifts, heavy-input mode, defensive-verb forcing, boss committed-red attacks, ult attribution.

### P1 themes (33, findings-only — require owner-level design calls)

Masher (×6): still single-verb input; no attack says "must shield/dodge NOW"; proposal — enemy boss "committed red" heavy with 1.1-1.4s windup, 35-45% maxhp, shield/dodge/E as solve-set. Related: heavy-input tap-vs-hold on same key to feed P1 passives' "heavy" trigger flag.
Cautious kiter (×5): enemy AI has no HP-threshold phase shift — 100% HP behavior = 15% HP behavior; proposal — makeEnemy phaseStage + HP-threshold tempo+aggression bumps.
Explorer (×5): still "solved encounter" / adversary reaches for combat-depth asks (phase enemies, enrage, boss patterns).
Panicky (×5): manual-mode input bandwidth gap.
Lazy (×6): ult-meter 0 start + no attribution still surfacing.
Impatient (×6): the `517480e8` closing-action-gate commit cut their flee rate but adversary still asks for ult-meter seed + enemy-HP-bar momentum rim.

### P2 themes (6)

- Role-split defaultLoadout (backline/dps gets offensive E instead of defensive shield).
- Ult seed 15-20 on battle start.
- Per-cat boss pattern authoring.
- Attribution layer on hurtMe (biggest-hits debrief).
- Enemy HP bar `_closing`-rim VFX.
- Combo rhythm-gate (on-beat +2 vs off-beat +1).

### Verdict

Combat is **numerically healthy** this cycle (0 P0). Adversary now asking for **design-level architecture** (phase shifts, heavy input, committed boss attacks) — out of scope for low-risk cron auto-fix. All logged for owner review.

**Branch state**: `main` 4 ahead of origin/main.

---

## RSI

RSI cycle 2026-11-26T18:32:35Z — propose script reported FAILED (deliberately-bad control 'stand-at-max-range' 0.777 vs baseline 0.766 — judge being fooled by a passive strategy; gated candidate win-claim). 'agent:all-in-full-hp' scored 0.789 vs baseline 0.766 on the ground-truth judge but was gated by the control-check assertion. No new niche filled; archive coverage 2/64; best still agent:skill-ready-sprint 0.796. Findings-only, no code applied.

---

## Cycle wb4kwxa4y — 2026-11-26T18:34Z (POST-REBASE on origin/main 4f322084)

**Workflow**: `wb4kwxa4y` — 6 personas × 8 battles × 1 round
**Agents**: 70 spawned, 54 delivered, 16 StructuredOutput retry-cap losses
**Distribution**: 41 critiques → **1 P0**, 35 P1, 5 P2
**Headline**: "Combat has the verbs, pacing beats, and difficulty knobs it needs, but a single structural hole — enemies that never force a decision — is making every persona play the same one-button game; the fix is enemy-side legibility and rhythm, not more player-side tuning."

### Auto-fix outcome

**P0-1 没耐心型 (impatient) — lead/pack HP skew** → **REVERTED on failed gate**

- **Finding**: 87.5% flee at exactly 18.0s (= `ULT_COOLDOWN_SECONDS`) because the first visible kill lands ~20s in; lead enemy HP = companion HP = no legible "first kill" beat before the ult-ready cliff.
- **Proposed fix (Part A only, low-risk numeric)**: in `makeEnemy()` scale `i===0` lead by ×0.70 (SR/SSR ×0.85), companions ×1.10. Pack-HP total preserved.
- **Applied**: battle.js:773-778.
- **Gate failure**: `npm run check` → `check-cat-bond.mjs:583` "a Q/E skill hit chips the poise gauge" assertion fails. The test's `poiseEnemy = enemies[0]` is now the trimmed lead; `poiseMax = round(maxhp * 0.6)` scales down with maxhp, and the fixed-amount poise chip from a `power:1.3` skill saturates at the low poiseMax, causing early-stagger side-effects that violate subsequent assertions.
- **Reverted**: `git checkout public/cat-bond/js/battle.js`. **Downgraded to findings-only** per cron rule. Owner-level fix: either (a) rebalance the poise chip formula to use fractional poise%, or (b) skew HP only on packs of size≥2 (no effect on solo-test enemy), or (c) implement Part B instead (per-enemy HP milestone VFX — exceeds low-risk scope).
- Part B (milestone VFX in damage path: red ring + mini-shake on 75/50/25%) exceeds cron scope (rendering layer, not a numeric tune).

### P1 themes (35, findings-only)

- **Masher (×7)**: six verbs on screen, action vocabulary is ONE — no "committed red" telegraphed heavy forces shield/dodge/ult; BASIC_SKILL_DMG_MULT/BASIC_POWER_MULT nerfs miss the structural lever. Proposal: add 1.1-1.3s red-reticle windup heavies every ~10-12s (~45-55% maxhp on contact) — shield absorbs, dodge i-frames, ult cancels.
- **Masher: engage-demand window**: track "player used only basics" counter in battle; at 6-8s force a telegraphed enemy heavy ≥25% maxhp.
- **Masher: per-encounter mutator** — one HUD-labelled trait per fight (Thorns / Overshield / Charger / Pack-Lock) invalidates mashing in one specific way.
- **Cautious kiter (×5)**: no HP-threshold phase shifts — 100% HP = 15% HP same behavior; proposal — `makeEnemy.phaseStage` + HP-threshold tempo+aggression bumps.
- **Explorer (×5)**: "solved encounter" — adversary pushes combat depth (phase enemies, enrage, boss patterns).
- **Panicky (×5)**: manual-mode input bandwidth gap.
- **Lazy (×6)**: ult-meter 0 start + no attribution still surfacing.
- **Impatient (×7)**: closing-action-gate `517480e8` cut flee rate, adversary still wants ult-meter seed + enemy-HP-bar momentum rim.

### P2 themes (5)

- Role-split defaultLoadout (backline/dps gets defensive E instead of offensive).
- Ult seed 15-20 on battle start.
- Attribution layer on hurtMe (biggest-hits debrief).
- Enemy HP bar `_closing`-rim VFX.
- Combo rhythm-gate (on-beat +2 vs off-beat +1).

### Verdict

**One P0 attempted, reverted on gate failure.** Underlying design signal (impatient flee coinciding with ult-ready cliff) is real but the proposed numeric fix was coupled to the poise test harness; needs a non-coupled tune. P1 themes continue to reflect structural asks (enemy phase shifts, encounter mutators, telegraphed decision-points) that exceed cron auto-fix scope.

**Branch state**: `main` 5 ahead of origin/main (post-rebase: `358593e8 … b31d0878`), push-main-lock intact.

---

## Cycle wrtiogrp8 — 2026-11-26T19:xxZ (POST-REBASE on origin/main 9068b9be; AFTER crescent redesign `a7d867bf`)

**Workflow**: `wrtiogrp8` — 6 personas × 8 battles × 1 round
**Agents**: 70 spawned, 45 delivered, 25 StructuredOutput retry-cap losses (high cap exhaustion — critic-prompt verbose this cycle)
**Distribution**: 32 critiques → **1 P0**, 25 P1, 6 P2
**Headline**: "Combat is mechanically solid but feels like a flat progress bar — the first 18s have no authored beat, basics are unreadable, and every defensive/skill button is optional, so every persona except button-mashers bounces between fun 2-5/10."

### Auto-fix outcome

**P0-1 没耐心型 (impatient) — onboarding self-suppression + no skill-forcing combat state** → **FINDINGS-ONLY**

- **Finding**: Two stacked failures:
  (1) `ui.js:2695-2696` defaults `autoBattle=true` on the first catch; `battle.js:317` kills `initCoach()` in auto → Q/Dodge tutorial never renders for a modal new player. `manualTutorialSeen` is a one-shot flag with no re-entry condition.
  (2) None of the 12 P1 passives create a reason to press E / Ult / Dodge — all passively trigger on basic + movement. "Route into passive system" escape is unavailable here.
- **Proposed fix (3 knobs)**:
  (a) Flip first-encounter autoBattle default manual→auto when any of `everUsedSkill/everUsedDodge/everUsedUlt` is false (ui.js:2695-2696).
  (b) Replace `manualTutorialSeen` one-shot with a "depth refresher" that re-arms Q + Dodge steps when last 3 battles' `skillsUsed.e+ult + dodgeCount === 0` (battle.js:313-317).
  (c) **New wild-AI mechanic**: mid-tier+ wild cats get a 1.2-1.8s **skill-break shield** phase — reduces basic to ~15%, takes full damage from Q/E/Ult.
- **Why findings-only**: (a) is defensible single-knob tune BUT it collides with the autoBattle bootstrap path (coach gating is cross-system — tests likely coupled). (b) is a new counter+decision-tree in initCoach, not a numeric tune. (c) is a brand-new combat state across the wild AI dispatcher (telegraph phase + resolveHit dmg filter + new VFX cue) — classic architectural change. Owner review required for all 3.

### P1 themes (25, findings-only)

**Masher (×5)**: still the "1 verb for 25s" complaint — execute-threshold (sub-20% HP ×2.2 basic), engagement-demand window, attribution strip for big hits. All P1 by same argument as last cycle — these are additive-feature or structural, not local tune.
**Cautious kiter (×3)**: 97.5% idle in auto mode — long-basic-range cat has no reason to close; _pressure+_closing already exist but don't bite at kiter equilibrium.
**Explorer (×3)**: stomp ratchet ceiling; E has zero decision-cost; 278x basic:Q ratio — "cooldown-at-ceiling".
**Panicky (×2)**: 6/8 timeouts in 30.5-36.5s band; existing juice (hitstop/shakeT/hitWhite) not surfaced to persona.
**Lazy / auto (×4)**: `smartAutoAction` silently drops skill casts under threshold conditions; auto-dodge isn't surfaced in `skillsUsed.dodge`; auto fight pattern has become homogenous.
**Impatient (×8)**: same "first 18s has no authored beat" root — multiple angles (HP bar momentum rim, Q-burst execute prompt, 8-10s cap on trash — the last would collide with P1 passive triggers).

### P2 themes (6)

- Enemy HP bar `_closing`-rim VFX surfacing
- Role-split defaultLoadout (backline gets defensive E)
- Ult meter seed at battle start (15-20)
- Per-cat boss pattern authoring
- Attribution layer on hurtMe (biggest-hits debrief)
- Combo rhythm-gate (on-beat +2 vs off-beat +1)

### Verdict

**One P0 attempted → findings-only** (3-knob architectural: auto-battle gating + coach re-arm logic + new wild-AI skill-break shield). All 25 P1 are structural/additive-feature asks (execute threshold, engagement demand window, per-cat phase shifts, auto-dodge surfacing). **Combat remains numerically healthy this cycle; findings are design-level signal, not tuning.**

**Branch state**: `main` 7 ahead of origin/main (crescent redesign `a7d867bf` shipped this session; this log entry adds +1). Push-main-lock intact.

---

## Cycle woebtgclk — 2026-11-26 (POST-MERGE origin/main `87c5ff9d`, after enemy-level live-match + cap-lift `3725eb52`)

**Workflow**: `woebtgclk` — 6 personas × 8 battles × 1 round
**Agents**: 74 spawned, 46 delivered, 28 StructuredOutput retry-cap losses
**Distribution**: 32 critiques → **0 P0**, 20 P1, 12 P2
**Headline**: "Combat is well-instrumented internally but visually mute and structurally flat — the engine knows pressure, closing, and spike magnitudes the player never sees, and the one compounding knob (combo) saturates in 5s then runs silent."

### Auto-fix outcome

**Combat reads healthy this cycle — zero P0 produced.** Prior P0 themes (enemyUlt cap, closing-ramp, basic-slot penalty, crescent redesign, enemy-level match) all shipped. All remaining findings are **additive-flag P1/P2** (design-level feedback-layer opportunities).

### P1 themes (20, findings-only, all `riskLevel:additive-flag`)

- **Masher**: threat-EMA edge-glow (continuous amber halo keyed on incoming dmg/s, independent of HP%) — fills the ~55% HP perception cliff between "fine" and red-vignette crit.
- **Masher**: `comboMult()` fever-tier at every 50 hits (currently saturates +20% in ~5s, runs flat 2950 hits) — ×1.8 fever burst 0.8s per 50-combo milestone.
- **Masher**: auto-shield rulebook entry at `selfHpBelow15AndShieldUnused` (shield has no panic trigger; teaches via visible VFX).
- **Masher (×3)**: `_pressure` HP-gate `>0.70 && !_stalled` tuned for kiter; mashers eating 352 dmg/fight drop below 0.70 fast → pressure decays → fire-rate/aim-lock boosts never fire for them.
- **Cautious (×3)**: closing-ramp still bias-free against 97.5%-idle equilibrium; no "closing shows as pressure" cue.
- **Explorer (×3)**: stomp ratchet ceiling + E has zero decision-cost + 278x basic:Q ratio.
- **Panicky (×2)**: timeout band 30.5-36.5s symptomatic of 36.2s probe-cap artifact; real cue is missing.
- **Lazy (×4)**: `smartAutoAction` threshold dropping skill casts; auto-dodge invisible in `skillsUsed.dodge`.
- **Impatient (×4)**: closing fired but "first 18s has no authored beat" still surfaces; design-layer not numeric.

### P2 themes (12)

- Enemy HP bar `_closing`-rim VFX surfacing
- Role-split defaultLoadout (backline gets defensive E)
- Ult meter seed 15-20 at battle start
- Per-cat boss pattern authoring
- Attribution layer on hurtMe (biggest-hits debrief)
- Combo rhythm-gate (on-beat +2 vs off-beat +1)
- Shield SFX / tutorial toast pairing
- Range indicator on charge-up skills
- Fever VFX chip on HUD
- Ambient battle-start seed state hint
- Flash-on-element-reaction tint ladder
- Timeout verdict-absence telegraphed finisher

### Verdict

**Combat numerically healthy — 0 P0 this cycle.** All 20 P1 + 12 P2 are `additive-flag` under the new taxonomy (new fields + consumers, not architectural changes, but still exceed local-numeric cron auto-fix scope until owner lifts the gate). Logged for owner review.

**Branch state**: `main` 21 ahead of origin/main (post-merge of QA promo + enemy-level-match + cap-lift + debug-FAB-race + record-button); push-main-lock intact.
