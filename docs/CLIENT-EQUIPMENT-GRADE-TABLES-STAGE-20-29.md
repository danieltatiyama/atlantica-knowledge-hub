# Stage 20.29 — +0 through +10 tables for every reviewed equipment item

## User-approved interpretation

The user specifically confirmed that **evasion, movement speed and
magic defense do not increase with equipment upgrades**.

- The Wiki must NEVER multiply client raw fields `EV`, `MoveSpeed` or
  `MagicDef` when projecting enchantment grades.
- For +0 through +10, fixed fields display the SAME exact raw client
  string at all 11 grades (including an actual recorded zero).
- Missing fields are not silently converted to zero.
- Attack min/max, physical AC and numeric primary attributes use
  the separately established historical +0..+10 multiplier sequence
  from independently examined historical community wiki item tables.

**No enhancement formula was discovered in the game's binary client.
This is a model based on historical observations**, not verified
current Global server mechanics. The 2026 client extracted +0 values
are clearly labeled as `client-raw-baseline`; values for +1..+10 are
`historical-estimate`. Never treat them as direct raw values or
verified tooltip observations.

## Coverage

The reviewed equipment registry contains **551 numeric item IDs**
and **1,031 original source rows** from `Items.csv` at NA Miner
snapshot **1**.

- The +0..+10 model now appears on **all 551 equipment pages**,
  including the seven pages that already have independent historical
  tables. Those independent sources are preserved; they are not
  overwritten by source-based estimates.
- Every page has 11 grades; **6,061 modeled grade rows** across the
  initial catalog.
- Values copied unchanged at all grades are labeled **=** in the
  column header, visually distinct from historically projected
  scalable values labeled **×**.
- The table starts expanded but can be collapsed.
- All underlying source rows and files remain available in their
  original separate review sections.

## What increases under the historical model

The *only* fields allowed to scale are:

| Raw Items.csv field | Treatment |
| --- | --- |
| `MinDamage` and `MaxDamage` | historical multiplication |
| `AC` (physical armor/defense) | historical multiplication |
| `Str`, `Dex`, `Vit` | historical multiplication |
| `Mag` (original client field name) | historical multiplication ONLY when an integer |

Factor by grade:

| Grade | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Factor | 1.0 | 1.2 | 1.4 | 1.6 | 1.8 | 2.1 | 2.4 | 2.8 | 3.2 | 3.6 | 4.0 |

Integer output uses exact `BigInt` arithmetic with truncation toward
zero for nonnegative bases, avoiding binary floating-point errors.

The original fractional source field `Mag = 292.5` for Abyssal Orb
#363 is still shown intact in the raw/client summary, but is NOT
projected beyond +0 because the integer-only historical rule cannot
justify the fractional rounding convention.

Raw fields like `HitRate`, `CriticalPlus`, `MagicSkillPlus`, job
bonus fields and special effects are **NOT multiplied**. This does
not claim those fields are constant; it simply declines to predict
unknown enhancement behavior.

## What explicitly never increases

| Client source field | UI | Grade handling |
| --- | --- | --- |
| `MagicDef` | Magic Defense / Defesa mágica | same value +0..+10 |
| `EV` | Evasion / Evasão | same value +0..+10 |
| `MoveSpeed` | Movement speed / Velocidade de movimento | same value +0..+10 |

Zeros explicitly reported by the game client remain zeros at every
grade; missing source fields do not generate new columns. When
general and specific source files differ, the source records remain
separate and a conflicting field is omitted from automatic grade
projections instead of selecting one arbitrarily.

## Newly recovered MoveSpeed data

The original uploaded private `Miner_ClientAttributes_Private_20_25.json`
contains the raw `Items.csv` column `MoveSpeed`, which was absent
from the previous 19-field public numeric allowlist.

We cross-matched exact original row IDs to the already published
551 equipment/1,031 source row identity registry:

| Original MoveSpeed source evidence | Count |
| --- | ---: |
| Source rows containing a nonblank MoveSpeed | **381** |
| Equipment item IDs with a source MoveSpeed | **329** |
| Equipment item IDs with nonzero MoveSpeed | **34** |
| Source rows with MoveSpeed = 0 | **320** |
| Source rows with MoveSpeed = 4 | **6** |
| Source rows with MoveSpeed = 6 | **6** |
| Source rows with MoveSpeed = 8 | **6** |
| Source rows with MoveSpeed = 10 | **43** |

`src/data/client-movement-speed.mjs` stores only a compact
mapping **(exact Items.csv sourceRowNumber → original numeric string)**,
not the private original full client fields, paths or unreviewed items.
At compile time `client-item-attributes.ts` adds the fields only to
matching original source rows and validates:
- Miner snapshot 1, exactly 551 reviewed item IDs;
- all 381 source row numbers are covered exactly once;
- exactly 329 item IDs have a known raw MoveSpeed;
- 34 reviewed IDs have a positive raw MoveSpeed;
- a future export that already contains MoveSpeed MUST have the same
  source value, or the site build fails closed.

New read-only local exports now include `MoveSpeed` in their original
numeric allowlist and in the public JSON schema. This does not
automatically publish other private client fields.

## Examples

| Item | Raw +0 source | Historical +10 estimate | Fixed across grades |
| --- | --- | --- | --- |
| Spirit Sword #1 | attack 60–90 | 240–360 | MagicDef 0 |
| Twilight Shield #196 | physical AC 15,570 | 62,280 | EV 85, MagicDef 198, MoveSpeed 0 |
| Pegasus Boots #1506 | MoveSpeed 10 | **10 (unchanged)** | Movement speed 10 |
| Abyssal Orb #363 | Mag 292.5 | **not extrapolated** | Original fractional value preserved separately |

L / +11 is NOT appended to arbitrary items. The separate user-approved
47-name historical Legendary candidate list remains reference-only and
does not automatically authorize an L row.

## Test coverage

All 551 items now must:
- emit **exactly 11 rows** +0...+10, no L;
- have every copied raw `MagicDef`, `EV` and `MoveSpeed` value
  identical in every grade row;
- scale only the strictly whitelisted attack/AC/basic integer
  attributes, with source-consistent observations;
- never multiply `HitRate`, critical, skill or special bonuses;
- distinguish fixed raw zero from absent field and different
  general vs specific values.

Full CI runs Node regression, Python read-only source fixtures
and the static Astro build. No game client binary, screenshot,
private original data export or additional user input is required.
