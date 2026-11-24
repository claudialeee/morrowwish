# Pre-loss historical report search and confirmed purge

Status: historical report search incomplete; first production purge independently confirmed by original CI execution logs.

## Actual purge, not a hypothesis

- 2026-11-21 21:43:53 PST: commit 4aed8bf440d07203ea571ff962fef57d5db69f75 creates one-time direct D1 purge workflow. Run 44990659483, job 137110780111, fails at the pre-deletion SELECT with Cloudflare authentication error 10000. It therefore provides no pre-purge category counts.
- 21:45:35 PST: commit b077c577ee4c95639feac04364a1dcab5f017dcb replaces the workflow with a temporary Pages Worker route. Run 44990780147 cancelled.
- 21:45:52 PST: commit e3d40814ae16f2453cd22c94e49b590f42ac0caf fixes config parsing and triggers run 44990800146, job 137111269711.
- 21:46:42.638 PST: original execution log says RESET_VERIFIED.
- 21:46:42.640 PST: original execution log says {"success":true,"deleted":5122,"remaining":0}. The temporary Worker executed an unrestricted DELETE FROM events. The number 5122 is events, not pageviews.
- 21:46:50.519 PST: log confirms original Worker restored and temporary route gone.
- 21:47:02 PST: d38c8d272c63d18d9b454003d5516ab3d97fb797 removes the temporary workflow from the repository.
- 22:27:15 PST: cf367d0 adds a permanent destructive reset route, distinct from the already executed purge.

The deleted workflow's commit title contains "(approved)". No corresponding original explicit user authorization was retrieved by the historical conversation search. GitHub account identity alone cannot distinguish person/agent or establish authorization.

This confirmed Nov 21 purge predates the owner's Nov 22 morning observation of 85 Cat Bond PV. It cannot alone explain loss of that post-purge baseline. A later date-limited disappearance is separately documented in DELETION-FORENSICS.md.

## Historical report evidence

- Owner's morning observation: Cat Bond 85 PV on Nov 22, exact time and filter unknown.
- Retrieved prior conversation dated Nov 22 14:42:27 PST: owner supplied dashboard figures 8/26 starts (30.8%), 79/82 finishes (96.3%), 1 replay, 73 captures, 4 rare encounters, 57 rare captures, 46 duo attacks, 6 yard builds, 5 surprises. These are historical displayed values with unverified original scope; not raw data and not necessarily disjoint from other records. The old mixed counter labels are not reliable battle/game definitions.
- Original Nov 20 acquisition audit attempts (runs 44820006546 and 44820245364) both failed. Commit 39b5d0c3fedc90164b083ef5149c3f01e0506d5c records removing the temporary audit after read permission denial. The two surviving read-only audit branches contain workflow source but no committed historical report output.
- Current and historical conversation and file-library searches did not yield a verified pre-loss seven-game dashboard report. No per-game breakdown of the 5122 deleted events was recovered. Do not distribute the 5122 proportionally or invent any game totals.
- A known Cloudflare historical bookmark at Nov 21 12:00 PST predates the confirmed purge, but a bookmark is not a data export and does not establish counts. An ideal recovery target is immediately before 21:46:42 PST on Nov 21, plus another checkpoint before loss of the Nov 22 morning records. Use only a provider-supported isolated historical copy or existing backup, never a production rollback without separate explicit approval.

## References
- https://github.com/claudialeee/morrowwish/actions/runs/44990800146/job/137111269711
- https://github.com/claudialeee/morrowwish/actions/runs/44990659483/job/137110780111
- https://github.com/claudialeee/morrowwish/commit/e3d40814ae16f2453cd22c94e49b590f42ac0caf
- https://github.com/claudialeee/morrowwish/commit/d38c8d272c63d18d9b454003d5516ab3d97fb797
- https://github.com/claudialeee/morrowwish/actions/runs/44820006546
- https://github.com/claudialeee/morrowwish/actions/runs/44820245364

No production write, reset, deployment, restore, or main commit was executed by this investigation. Do not run the old destructive workflow.
