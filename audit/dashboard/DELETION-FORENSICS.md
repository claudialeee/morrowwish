# Deletion incident forensics — historical analytics
Status: confirmed destructive capability and observed disappearance; trigger and operator not attributed.

## Evidence
1. Commit cf367d0c4ce32c2225188aeed030b2366152ef52 (2026-11-21 22:27:15 PST) adds a dashboard reset button, a confirmation dialog, an authenticated POST /api/reset-metrics handler and unbounded DELETE FROM events WHERE category IN ('arcade','elsewhere','diagnostic'). No durable deletion ledger, pre-delete snapshot requirement, or separate destructive role. The accompanying test expects an empty reporting database. GitHub author/committer login claudialeee is a repository identity, not evidence identifying the human or agent behind the commit. Deployment run 44993788419 succeeded.
2. AGENTS.md at the very same commit prohibits resetting, wiping or migrating production D1 without separate explicit authorization. CLAUDE.md prohibits deleting/overwriting D1. Ordinary main push approval does not authorize destruction.
3. Repository search for RESET_METRICS identifies production route, dashboard click handler and mock DB test. Diagnostic cleanup uses a separate WHERE category='diagnostic' AND view_id condition. The original commit is deliberately implementing a global deletion, not a reporting-only reset. The code explains intended behavior, not why the change was requested.
4. Previously stored probe records (all times PST):
   - 2026-11-22 12:00: 414 qualifying rows, 15 Cat Bond visits (edc2ec06923e5aec4dbbe1ab6a82cbe714d67899).
   - 16:00: 803 qualifying rows (f640d28e78a9867847e65d4694e34b23552e9c44).
   - 16:15: 817 (ac98987c94b22bc5e45ba0d62b906d1b3a1964ca).
   - 16:30: 819, including 29 Cat Bond visits (40f544a268cd74afa21f43734f7f5648176ca1af).
   - 16:36:56.250: 819 in merge report (recovery/d1-merge-report.json).
   - 16:59: 0 qualifying rows (03094a7dba2edb86a143d2b563e66dceb9350cbe).
   The probes are date-limited and not evidence that there were only 819 total historical rows. The owner reports 85 Cat Bond PV already on the morning of Nov 22; the surviving first visit is 10:14:13.257 PST. Earlier deletion or omission remains a separate hypothesis, not a proven timestamp.
5. Three deployment job logs around the afternoon disappearance (137413261325, 137414093779, 137416115818) show routine deployment and diagnostic cleanup, no logged reset-metrics request or direct table-wide deletion. Last job deployed at 16:38:07 PST. Temporal proximity is not attribution.
6. Forensics run 45336290672 attempted retained account audit logs (v2 and legacy) and Worker request-path/message telemetry; all four requests returned 403. See deletion-log-evidence.json. No assertion that there were zero matching requests. The current credential cannot inspect them. Earlier historical evidence run found older checkpoints but current D1 reads hit free-tier quota; no production restore performed.

## Root cause classification
- Confirmed design failure: production analytics reset was implemented as a physical deletion of all reporting categories, without a separate privilege, durable audit trail, or backup gate; successful deployment confirmed.
- Confirmed incident symptom: date-limited records disappear between 16:36:56 and 16:59 on Nov 22 according to stored historical reports.
- Not proved: exact invocation, operator, original intent/authorization for implementing feature, number and time of earlier deletion(s), whether the reset route or direct D1 API/other mechanism caused the disappearance.
- Do not infer a human or AI identity from GitHub account metadata.
- Do not treat the old mock fixture 121 as real evidence.

## Next evidence needed
Cloudflare Workers/Pages retained invocation logs for POST /api/reset-metrics (including timestamp, status and request/Ray ID) and account audit log for D1 mutations, with read-only authorized access. Compare with actual tool action history and separate authorization if available. Preserve logs immediately; no secrets in chat, no production mutation, no restore, no main commits. An absent or sampled log is not proof of no deletion. All audit changes stay on the isolated branch.
