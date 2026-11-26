# RPG companion rarity — six-element release candidate

Active roster: 16 wild collectibles + 13 story companions + the separate Goldie protagonist (30 characters). Old breed definitions stay lookup-only for legacy saves and code, never in active wild/draw/breeding pools.

| Tier | Wild | Story |
|---|---|---|
| N | 麦饼、墨点、绒蒲、贝扣 | 芽禾、小铆、砾川 |
| R | 炭栗、芽扣、啪嗒、夜扣、晴纱 | 栖蓝、远帆、翎羽、白栞 |
| SR | 漪舟、苔盏、柚弧、织夜 | 岬灯、烬婆、墨页 |
| SSR | 烬羽(火)、潮刻(水)、曦瓷(光) | 暮铃(暗)、榆川(草)、星芽(雷) |

All 29 rated actors have exactly one defined passive. Existing 16 wild passives retained. Story SSRs have bounded, combat-local event mechanics: dodge echo, nearby ally shield, alternating attack cooldown reduction. Other NPC passives reuse the existing conditional damage, healing, cooldown and incoming damage hooks. No new resources, rarity upgrades, random stat stacking or additional story spoilers. Story rarity is visible only after joining; Goldie is marked by protagonist instance.

Owned attribute and level growth budgets: 1/1.05/1.10/1.15, 32 base points. Existing enemy rarity modifiers and region weights stay as authored; the new tier distribution changes which cats are available within each region. Existing saves migrate once to stat schema 2, including away Muling; level, XP, UID, learned skills and affinity are preserved. Actual combat pacing needs browser playtest.

Checks: node scripts/test-cat-bond-core-art-roster.mjs; node scripts/test-cat-bond-companion-rarity.mjs; node scripts/test-cat-bond-story-party.mjs. Browser QA not implied by source or pure runtime tests. No release/deploy approval.
