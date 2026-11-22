# Cat Bond AI mis-positioning — full diagnosis (data, not eyeballing)

Method: NEW real-combat simulator (`/tmp/combat-sim.mjs`) drives the REAL engine —
`b.update(0.016)` with `autoDrive`/`smartAutoAction` running live — for a full 15s fight,
sampling emergent behavior every frame. No decision logic reimplemented (the old harness's
fatal flaw was testing `kitRangeBand` return VALUES, not what the cat actually DID). Ran the
full kit × build matrix (8 kits × 6 builds = 48 cells).

Metrics per cell:
- **inWindow%** — frames the cat was at a distance where its Q could actually fire
- **loiter%** — frames HELD in place, NOT in any fire window, NOT deliberately faded out (dead zone)
- **fade%** — frames deliberately retreated past safe standoff (intended, not loiter)
- dmg/killT — weak signal (enemy damage saturates); IGNORE for behavior, use inWindow/loiter.

## Results — healthy vs broken

HEALTHY (inWindow 77-100%, loiter 0-6%): ranged, beam, support, dash, pounce, leap — ALL builds.
  → the owner's `basicRange`-capped bands fixed the ranged/support "can't reach basic" bug
    (ranged = inWindow 100% / loiter 0 across every build — confirmed fixed).

BROKEN class — **hybrid (melee Q + ranged E)**, EVERY build:
  hybrid/tank      inWin 39%  loiter 19%
  hybrid/fighter   inWin 27%  loiter 30%
  hybrid/dps       inWin 16%  loiter 47%
  hybrid/assassin  inWin 28%  loiter 35%
  hybrid/control   inWin 22%  loiter 42%
  hybrid/support   inWin  2%  loiter 49%

BROKEN — **melee kit on a backline build**:
  melee/control    inWin 31%  loiter 27%
  melee/support    inWin 26%  loiter 39%

## Root cause (exact numbers)
The movement BAND and the per-skill FIRE WINDOW are two independent distance systems whose
constants are hand-aligned and DON'T, for these kits:

  hybrid/support & /dps: band = 55–130 (role 'bruiser'), but the melee Q fires only ≤74.
    → the upper half of the band (74–130) is a MELEE DEAD ZONE: the cat positions there
      (for the ranged E/basic, which reach fine) but keeps trying to melee and can't → loiter.
  hybrid/fighter: band 60–110, melee ≤74 → 74–110 dead zone.
  melee/support & /control: a melee kit on a backline build → band pulled outward past the
    76px melee reach → can't connect from its own preferred distance.

The engine has THREE distance vocabularies that must agree but are written separately:
  1. kitRangeBand()        → movement {min,max}      (battle.js ~893-952)
  2. offensive() per-kind  → fire gate per skill      (~1204-1209: melee≤70, dash 55–160, …)
  3. basicAttackRange()    → basic toss reach         (~855-863)
Single-kit cats mostly work because one skill's band≈its fire gate. HYBRIDS break because the
band is a COMPROMISE between two skills' gates and ends up matching neither — it sits in the
melee skill's dead zone while the ranged skill would be fine closer or the same.

## Fix direction (for the engageRange unification — NOT yet applied)
Make the band for a multi-skill kit the UNION-aware choice: hold at the distance where the
MOST-USEFUL ready skill can fire, and when a melee Q is ready + target reachable, close to
melee range (don't park at the ranged-friendly outer band). i.e. the band must be derived
from the SAME per-skill fire windows offensive() gates on (one `engageRange(skill)` source),
and for hybrids pick the band of whichever skill the AI will actually use next — not a static
mid-point. INV to lock it: for every (kit,build), inWindow% ≥ ~70 and loiter% ≤ ~12 in the
real-combat sim.

## Honest caveats
- dmg/killT columns are near-constant (enemy saturates) — behavioral metrics are the signal.
- single stationary-ish enemy; multi-enemy field waves not yet simulated.
- the sim is auto-mode; manual play differs but the band/fire mismatch is mode-independent.
