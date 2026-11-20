# CrazyGames: quality-first one-game submission gate

We will NOT submit every game just because it deploys. The user reports that the prior submission was rejected for overall quality and review opportunities are limited. This gate defaults to HOLD.

## Platform requirements (official)
- Source: https://docs.crazygames.com/requirements/gameplay/
- Source: https://docs.crazygames.com/requirements/technical/
- Source: https://docs.crazygames.com/requirements/quality/
- Source: https://docs.crazygames.com/faq/
- QA plays the actual game, checking meaningful quality, originality, functionality and fun.
- Basic Launch is not Full Launch; successful initial QA is only the first step.
- In CrazyGames play mode: do not show custom fullscreen buttons, outbound play links, cross-promotions, or a large site-level header. Verify CrazyGames preview, not merely a ?platform=crazygames local test.
- Ensure the gameplay is readable at DPR 1 on the listed 16:9 iframe dimensions, mobile included; verify FPS stability, input, sound, responsive behavior, reload, restart, no dead ends and no runtime errors.
- English locale and rights/licenses for music, images, fonts and code must be documented.
- SDK is optional for Basic Launch, required for Full Launch (check updated official docs before release).

## Internal go/no-go tests (our goals, NOT CrazyGames thresholds)
1. **Fun and distinctiveness**: candidate must have an interesting, differentiated core loop with real decisions or mastery. No repetitive click-only filler. Compare against current CrazyGames competitors, including first 60 seconds and a full 3+ minute play.
2. **Cold playtests**: observe at least 10 players who have never been told the rules. At least 8/10 should understand the objective within 30 sec; at least 7/10 should complete the first useful objective within 2 min; at least 6/10 should voluntarily retry/continue. These are targets, not approval guarantees. Record source observations and note exceptions.
3. **Progression**: playable for multiple complete sessions; at least 3 mechanics/variations revealed progressively, clear cause-and-effect, balanced difficulty, meaningful reward/unlock/score goals, no guaranteed-win strategy or unavoidable-fail trap.
4. **Visual/audio**: comparable clarity and art consistency to accepted games, no tiny text or weak resolution, no misleading cover, audible and consistent feedback, correct asset rights.
5. **Automated and manual QA**: zero major bugs; mobile and desktop real-browser input, key screen sizes, tab restore, restart, language switching, limited bandwidth, performance, and CrazyGames Developer Portal preview (including security/referrer differences).
6. **Submission copy**: accurate category/description/tags/controls and screenshots/video of authentic gameplay; no other-game logo/cross-promotion. Source, preview and evidence links captured for future audits.
7. **Gate**: update `promotion/crazygames-quality-gate.json` with a single `approvedSlug`, `status:"approved"` and meaningful evidence refs ONLY after all checks. Do NOT mark approved solely for passing automated source tests.

A successful code check or a polished trailer is not evidence that gameplay is fun. Refused submissions require substantive improvements before submitting them again. Never claim acceptance or launch merely because a workflow ran.

## Submission safety
- The GitHub workflow is manual only, and accepts exactly one slug. It aborts BEFORE signing into CrazyGames unless the corresponding gate is approved.
- The existing portal script only supports previously verified drafts; a new game (such as Cat Bond) also needs a valid draft and release metadata added safely before submission.
- Keep external review state synchronized with official portal receipts; the existing portal-status file may be stale.
- While one game is under review, keep all other candidate submissions on hold. Do not automatically resubmit a rejected game.
- Evaluate the best *current* candidate by measured quality, not historic priority lists.
