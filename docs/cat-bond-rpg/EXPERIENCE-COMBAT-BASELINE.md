# Combat experience baseline — measured CI results
Source: run 45781052155, opening job 139776322081, commit 7eb411c. Seven scripted policies, two seeds each, six encounters per seed. Legacy fake-DOM single-cat capture setup (level 10 Tangyuan, fixed stats, R-rarity Lanbao encounter), not an actual RPG party or browser boss test.

| Policy | Wins / 12 | Mean seconds (game clock) | Key outcome |
|---|---:|---:|---|
| Button masher | 0 | 13.06 | All defeats |
| Cautious kiter | 0 | 38.13 | 12 timeouts; 97% idle |
| Explorer | 2 | 15.43 | 2 wins, low remaining health |
| Panicky | 0 | 15.33 | All defeats |
| Auto | 1 | 15.05 | 1 win |
| Impatient | 0 | 18.00 | 12 policy-scripted retreats |
| Balanced | 0 | 18.19 | All defeats |

Total: 3 wins / 84 (3.6%); 12 timeouts, 12 scripted retreats. No policy triggered a shield in this fixture. Win rates are reconstructed from the reported per-seed six-battle results. The cautious policy is not a realistic skilled baseline (mostly idle), and the impatient policy forces retreat after a fixed duration. Do not infer user churn, enjoyment, or actual regional difficulty from these proxies.

## Review priorities
1. P0 investigate why the balanced and auto policies cannot reliably defeat the fixture; confirm with the currently recruited RPG party and actual browser battle before changing numbers.
2. Compare manual/auto under the same legal roster, difficulty and encounter; retain real defeat/retreat outcomes and do not grant victories through injected flags.
3. Distinguish incoming damage, attack uptime, cooldown utilization, dodge effectiveness and available healing. Zero shields may be a loadout limitation, not broken shields.
4. Prioritize first required RPG rescue battle, Forge guardian, Library echo and finale, recording team, battle length, win/retreat/defeat and recovery cost. No need to rebalance collectible fights before confirming these gates.
5. If real tests show failure for a reasonable novice party, first tune tutorial, encounter telegraph, recovery and difficulty scaling; avoid blanket damage nerfs based on this obsolete fixture.

## Scope
This is a measured baseline, not a balance acceptance. Raw JSON in the opening artifact; CI log: https://github.com/claudialeee/morrowwish/actions/runs/45781052155/job/139776322081.
