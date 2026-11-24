# Historical Cat Bond PV investigation — 2026-11-23 PST

**Final historical reconciliation: BLOCKED / NOT VERIFIED.** The owner clarified that 85 PV was already observed on the morning of Nov 22, not on Nov 23. The earlier 85-vs-81 same-time comparison was based on a wrong assumption and is superseded by this note. Do not use it as an explanation of the historical loss.

## Evidence
- Owner-reported historical baseline: 85; exact screenshot, observation time and date filter not independently available.
- The Nov 23 20:57 PST D1 audit found 81 surviving Cat Bond visit rows, with earliest surviving visit 2026-11-22 10:14:13.257 PST and 50 visits on Nov 22. It cannot represent full cumulative history.
- Recovery script `recovery/d1-recovery-merge.mjs` explicitly selects only events at or after 2026-11-22 00:00 PST; its reported 819 checkpoint rows are not a full historical recovery. The checkpoint probe also has a lower date filter. Earlier data was not independently audited.
- Reset endpoint added in cf367d0 on Nov 21 22:27 PST performs physical DELETE on arcade/elsewhere/diagnostic records. This is a data-loss mechanism, not proof of a specific invocation.
- The test fixture in 6fbe51b7 uses 121 for an intercepted mock response, not a verified production reading. Do not use it as recovered data.
- The Nov 22 16:18 PST encrypted live audit (run 45088027037) failed; commit f2dcbd2 records Cloudflare 403. No usable live historical count from that attempt.
- Historical metadata run 45334849676 found 16 available Time Travel checkpoints, including Nov 19–22 and Nov 22 06:00, 08:00, 09:00, 10:00, 10:13/14 and 10:15 PST. A bookmark proves an available historical state identifier, not that the state contains 85 PV.
- D1 metadata search returned one matching database, the production database. R2 backup discovery was denied with HTTP 403. Existing SQL exports in recovery reports were ephemeral; no durable independent raw backup located.
- Additional SELECTs failed with D1 code 7500 (free daily row-read quota). No fresh event values are claimed for this run.

## Safety and next evidence
Do not run any production restore, export, reset, migration, deployment, or merge. Cloudflare's documented Time Travel operation does not provide a read-only historical query or clone/fork; a restore would change production. Seek a durable existing backup or provider-supported isolated historical copy. Preserve and compare pre-morning, pre-afternoon-reset and present raw events by stable signatures with explicit coverage and no invented historical rows. Do not add 85 to the surviving total because overlap is unknown. Do not certify any cumulative PV until the historical records are reconciled.

## Sources
- audit/dashboard/historical-evidence.json
- audit/dashboard/raw-reconciliation.json
- audit/dashboard/pv-discrepancy-report.json (superseded interpretation)
- https://github.com/claudialeee/morrowwish/actions/runs/45334849676
- https://github.com/claudialeee/morrowwish/actions/runs/45088027037
- https://developers.cloudflare.com/d1/reference/time-travel/
