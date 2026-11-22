# Stage 20.26 — Real client raw item attributes: reviewed 551-ID import

## Source and provenance

The original Atlantica Online Miner SQLite was read **locally, read-only**
(`mode=ro` + `query_only=ON`), snapshot **1**, reference dataset
`Items.csv`. The three locally-generated review artifacts were provided
for this stage:

- `Miner_ClientAttributes_Report_20_25.json` — aggregate values (27,281 rows inspected)
- `Miner_ClientAttributes_Private_20_25.json` — original source fields for reviewed IDs; **PRIVATE, not uploaded to GitHub**
- `Miner_ClientAttributes_PublicCandidate_20_25.json` — numeric allowlisted fields, reviewed item identity, source-row provenance

Only the source-backed public subset was committed into
`src/data/client-item-attributes.json`. The private 9.3 MB source
dataset was never added to the repository.

## Data imported

| Check | Result |
| --- | ---: |
| Reviewed equipment item IDs | 551 of 551 |
| Original client source rows | 1,031 |
| Items with exactly two source rows | 480 |
| Items with exactly one source row | 71 |
| Invalid JSON rows or item identifiers | 0 |
| Unmatched reviewed IDs | 0 |
| IDs with different reviewed English-name sources | 0 |
| Items with conflicting values in overlapping numeric fields | 0 |
| Published original numeric client field names | 19 |
| Published raw numeric values (including zeroes) | 11,793 |

Original stage 20.25 extraction contained 18 populated numeric source
field names and 10,762 raw values. One further **actual file field**,
`Mag`, was present in **all 1,031 private original source rows** but
absent from the initial exporter allowlist; it was rechecked against the
uploaded private records by reviewed ID and exact source row number and
then added to the public field list.

- `Mag` present in 1,031 source rows, nonzero for 169 item IDs.
- `Mag` raw field of **Abyssal Orb (ID 363)** is `292.5`; preserve
  the decimal original string, do not truncate.
- `Mag` is the **client source field name**, not a claim that its
  effect or in-game tooltip units have been experimentally verified.

Selected field coverage by source rows:

| Client field | Source rows |
| --- | ---: |
| `Str`, `Dex`, `Vit`, `Mag`, `MagicDef` | 1,031 each |
| `AC` | 891 |
| `MinDamage`, `MaxDamage`, `HitRate` | 748 each |
| `EV` | 612 |
| `MagicSkillPlus` | 588 |
| `CriticalPlus` | 329 |
| `ADDJobDmg_*` (seven original keys) | 282 each |

**CriticalPlus is zero in all 329 reported source rows.** It does not
establish a real-world critical probability. Similarly raw `AC`,
`MagicDef`, `MinDamage` and `Mag` are file-configured values,
**not** measured battle damage, enchantment scaling or the live server's
defense formulas.

Examples tied to original `Items.csv` row numbers:

- **Spirit Sword, ID 1**: source row 11299 — MinDamage 60,
  MaxDamage 90, Str 5, Vit 5, Mag 0.
- **Twilight Shield, ID 196**: source row 17576 — AC 15570,
  MagicDef 198, EV 85.
- **Abyssal Orb, ID 363**: Mag 292.5, preserved as a decimal string.

Across the 480 paired source definitions, values agree on shared numeric
fields. Some source files contain **additional** numeric keys.
The public schema retains distinct rows and provenance rather than
manufacturing absent zeros or arbitrarily choosing one variant.

## What the Wiki does with these values

The bilingual equipment item detail pages use
`ClientItemAttributesSection.astro`, displaying original raw
field names and values by **source row number**. These are
separate from:

1. historical community-sourced +10/L projections;
2. client recipe/material source definitions;
3. the 47 historical Legendary candidate list.

The attributes table is not copied to the 47 Legendary candidates
that are **not** among the 551 already reviewed equipment IDs.
This remains an exact name/ID-governed subset.

To reproduce the import on the same client snapshot, run the
repo's `Start-ClientEquipmentImport.ps1` script with the source
`atlantica.sqlite3` in dry-run mode, validate its candidate, and
use `-PreparePublic` only after reviewing the diff.

The read-only exporter now includes `Mag` so future local exports
reproduce the 19-field dataset. All raw values are strings; not
derived `+1..+10` or `L` equipment statistics.

## Validation

- Existing client equipment fact and Legendary candidate gates remain unchanged.
- Import file passes strict reviewed-ID/name validation, original row-number
  uniqueness, field allowlist and raw numeric value grammar.
- Regression test verifies 551 IDs, 1,031 rows, 480/71 split, all 19
  field counts, zero shared-value conflicts, Mag decimals and original
  representative item fields.
- Python fixture test verifies `Mag: "292.5"` is emitted literally.
- Astro build and full repo suite are required before merge.

Do not upload `Miner_ClientAttributes_Private_20_25.json` to
the public GitHub repository or convert source rates to odds.
