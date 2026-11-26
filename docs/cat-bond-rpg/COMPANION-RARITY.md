# RPG companion rarity (N / R / SR / SSR)

The 13 recruitable story actors now share the fixed rarity vocabulary with wild cats, without entering wild, breeding or gacha pools. Rarity never changes with bond. Protagonist status belongs to the opening cat instance, not the Goldie species.

| Tier | Story companions |
|---|---|
| N | 芽禾、小铆、砾川 |
| R | 栖蓝、远帆、翎羽、白栞 |
| SR | 岬灯、榆川、烬婆、墨页、星芽 |
| SSR | 暮铃 |

Named companions have authored default combat roles; existing explicit player build choices remain respected. Story SR/SSR do not receive an immediate ultimate just because of rarity: they use the R-level/affinity gate. Bond mechanics, story recruitment, temporary departure/reunion, and existing duo systems remain intact.

Player stats use normalized breed profiles and 32 base budget multiplied by 1/1.05/1.10/1.15; growth uses the same capped factor. Enemy stats and encounter probabilities are unchanged. Older save stats are migrated once while keeping UID, level, XP, learned moves, bond and inventory. Away companions are migrated as well.

The current baseline contains 33 wild IDs in regional pools, not the previously discussed 16. This patch deliberately does not remove cats, change wild rarity assignments or reauthor encounter tables. These need a separate roster reconciliation. It does not add new unique skill VFX or an awakening story quest; existing skill/bond systems are reused. Actual encounter pacing and UI need browser playtest before release.

Run: `node scripts/test-cat-bond-companion-rarity.mjs` and `node scripts/test-cat-bond-story-party.mjs`.
