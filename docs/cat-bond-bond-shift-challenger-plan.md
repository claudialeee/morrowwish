# Cat Bond — Challenger-first prototype plan

Date: 2026-11-23  
Status: IMPLEMENTED EXPERIMENT; NOT APPROVED FOR MAINLINE OR PORTAL RELEASE  
Repo: claudialeee/morrowwish  
Branch: prototype/bond-shift-challenger-v1  
Original base SHA: 88663a32f6db75bd2b2e87e3db55a1b933d8d654

**Non-negotiable:** no push or force-push to main, no automatic merge, no production deployment, no portal submission, and no modification of existing Cat Bond saves. Each future escalation needs explicit approval.

## Product thesis

A short-session, manual-control companion action game where relationships visibly change the player's playable combat role. A partner has its own goals, can leave to pursue them, and may return changed. A separation never deletes the player's unlocked bond form.

This is a hypothesis, not proof of a hit. A collection game with 33 cats and numerous flashy skills is not compelling just because the feature count is high.

Key question: **Is the relationship-driven Bond Shift loop more enjoyable than today's existing duo-combo gameplay?**

## Five adversarial review rounds

These are deliberately separated challenger/critic perspectives, not a claim that autonomous independent agent instances were spawned.

### Round 1 — Acquisition challenger
Proposal: full narrative RPG with a large chapter campaign.
Counterargument: new players cannot care about a stranger's departure before they have played together; intro prose and menus could destroy early conversion.
Ruling: REJECT traditional full RPG for v1. Begin in active gameplay, demonstrate a transformation early, and keep story beats short.
Kill trigger: the first minute is dominated by menus, auto-battle or dialogue.

### Round 2 — Combat-mechanics challenger
Proposal: many beautiful relationship forms.
Counterargument: transformations and companion fusion exist in other games. A palette swap is not a unique combat mechanic.
Ruling: PASS only two demonstrably different verbs.
- Hunter: agile short-range swipes + high-impact pounce.
- Guardian: slower long-range ice attacks + shield/protection.
Kill trigger: uncoached players cannot articulate the difference or would rather stay in one form for every situation.

### Round 3 — Narrative and trust critic
Proposal: every recruited cat leaves, then returns, for maximum emotion.
Counterargument: forced departures can feel like confiscating a player's investment. A 30-second relationship is not yet an emotional bond.
Ruling: REJECT universal departure. Prototype exactly one separation. Companion's abilities remain as a weaker echo; reunion raises performance and changes partner AI.
Kill trigger: players say they feel punished or the departing character seems replaceable.

### Round 4 — Production-budget critic
Proposal: 33 cats with several evolution branches each, 21 element combos, full quest engine, breeding, gacha, new cinematics.
Counterargument: exponential animation and balancing effort, overlapping systems, weak differentiation and regression risk.
Ruling: REJECT feature expansion. Reuse existing hand-painted art and build a tiny self-contained arena first.
Kill trigger: prototype starts adding currency, gacha, unrelated menus or many new creatures.

### Round 5 — Distribution and release critic
Proposal: submit to CrazyGames once automated tests are green.
Counterargument: green tests do not establish art provenance, human fun, real platform load-time performance, D1 retention or successful portal review.
Ruling: REJECT release. Keep existing quality gate HOLD.
Reference: https://docs.crazygames.com/resources/basic-launch-metrics/ and https://docs.crazygames.com/requirements/gameplay/
CrazyGames' illustrative successful-game metrics (10+ minute average play time, 10–15% D1 retention, 80%+ one-minute conversion) are directional benchmark examples, NOT Cat Bond results or release promises.

## Decision table

| Idea | Verdict | Why |
|---|---|---|
| Two actually distinct combat forms | PASS TO PROTOTYPE | Minimal testable gameplay hook |
| Protecting a partner has a behavioral outcome | PASS TO PROTOTYPE | Bond formed through player action |
| One departure, retained echo, upgraded reunion | PASS TO PROTOTYPE | Contained narrative/mechanical test |
| Every cat has many evolutions | REJECT | Exponential art, QA and balance cost |
| Open world / full RPG quest engine | DEFER | No evidence of superior core fun |
| Auto-battle as the first experience | REJECT | Hides skill and agency |
| Gacha/breeding/economy expansion | REJECT | Competes with the product promise |
| Production save changes, public deployments, portal submissions | REJECT | Unnecessary safety risk |

## The playable vertical slice

Repository path: public/cat-bond/prototypes/bond-shift/  
Local URL served from the public root: /cat-bond/prototypes/bond-shift/

Files:
- index.html — independent responsive arena, HUD, keyboard and touch controls.
- game.js — own canvas battle simulation, manual controls, 4 chapters, partner AI and reunion.
- logic.mjs — deterministic contract for modes, stage progression, bonds and save-free status.

Core loop:
1. Encounter: one shy partner is attacked. E near the partner while an enemy attack resolves raises trust.
2. Together: winning a real fight unlocks Guardian. Player can switch Hunter and Guardian using keys 1/2 and apply different actual attacks.
3. Apart: partner pursues their goal; Guardian remains available as a weaker echo, not taken away.
4. Reunion: partner returns with stronger attacks and a more powerful protective form.
5. Completed: show combat observations. Never label local actions as user research or retention.

Controls: WASD/arrow move, mouse/J attack, Q active skill, E protect, space dodge, 1/2 shift, P pause. A separate touch joystick and button controls are present. Portrait polish still requires QA.

The experiment imports no production modules, uses no localStorage or sessionStorage, writes no formal save, sends no analytics, and makes no network API calls. Its one background asset is the existing same-repository hand-painted battle garden. Production Cat Bond does not load this prototype.

## Technical test gates

**A — deterministic model / safety:** node --test scripts/check-bond-shift-prototype.mjs
Tests transitions, distinct attacks, bond protection proximity, ability retention during separation and increased reunion strength, no production save manipulation.

**B — real browser:** node scripts/bond-shift-browser-smoke.mjs
Runs against a localhost HTTP server with Playwright. Uses actual native keyboard movement/held attack to win the first encounter, then switches forms; also exercises mobile touch controls. Does not artificially set enemy HP or force a battle result.

**C — branch CI:** .github/workflows/bond-shift-prototype.yml
Only triggers on prototype branch; no deploy step. Syntax, model, browser and screenshot artifact stages must all pass. Record the actual run/commit when reviewing.

**D — manual QA, before human study:**
- 907×510 and 1216×684 desktop; mobile portrait 390×844 and touch landscape.
- Whole encounter → unlock → departure → echo → reunion sequence.
- Attack cooldown, dash invulnerability, rescue timing, focus/visibility pause, loss and restart.
- Combat visual readability, touch occlusion, safe areas, no softlocks.
- Confirm production save key catbond_save_v1 is untouched.

## Real human study / decision gates

Recruit 12–20 first-time players *after* technical gates are green. This is a qualitative screening, not proof of mass-market retention.

Uncoached tasks: start playing, fight, protect partner, try two forms, experience goodbye and reunion, describe differences and memory. Observe actual confusion and actions, not only survey agreement.

Internal GO targets (preliminary, deliberately falsifiable):
- ≥80% win first enemy unaided.
- ≥70% independently explain a meaningful form tradeoff.
- ≥60% recall one specific companion action/event.
- In randomized baseline-vs-prototype comparison, more players prefer the Bond Shift combat, with no severe input or visual issues.

The percentages are our project hypotheses, not statistically validated market benchmarks. A sample this small is not sufficient to estimate D1 retention, conversion or market size.

If users prefer the current combo loop, *reject Bond Shift instead of adding more forms*. If they enjoy action but not companion stories, simplify narrative. If they enjoy story but find battle weak, fix moment-to-moment combat before any extra chapters.

## Work sequence

P0 — Current isolated prototype: core Hunter/Guardian playable loop, partner reaction, departure, reunion, deterministic tests, browser QA.
P1 — Fix failing automated/manual QA, hit-feel, legibility, mobile control issues; no feature creep.
P2 — Collect 12–20 uncoached recordings and randomized baseline comparison, document negative evidence.
P3 — If the new combat loop wins, implement a compatibility-safe integration adapter for existing battle.js, cat-relationships.js and state.js on another reviewed branch.
P4 — If the integration is fun and robust, create one genuine authored companion story. Add more only when the cost of each one and replay value are measurable.

Stop / reconsider after two failed gate attempts without a clear root-cause fix, significant player dislike, or regressions in existing data integrity. Do not convert prototype success into permission to modify main or submit to platforms.

## What this is NOT

Not a new shipping RPG. Not 33 completed story companions. Not an independently staffed team of challenger agents. Not human-validated retention. Not cleared for platform launch. No formal user save migration. Not a reason to erase, rescale or silently replace any live Cat Bond analytics.
