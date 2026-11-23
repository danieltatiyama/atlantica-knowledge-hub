# Stage 20.32 — all-client numeric-source audit before publication

This stage reviews the actual Miner_AllStats_Report_20_31.json from
NA Miner snapshot 1. The Stage 20.31 exporter has already run locally.

## Validated private aggregate

| Measure | Reported count |
| --- | ---: |
| Original Items.csv records inspected | 27,281 |
| Invalid JSON source rows / invalid numeric item IDs | 0 / 0 |
| Source rows whose IDs do not have an approved English identity | 2,217 |
| Named client item IDs with source rows | 22,702 |
| Named IDs held out for exact-name conflicts | 103 |
| Named IDs without numeric fields | 15,039 |
| Public-candidate item IDs with original numeric fields | **7,560** |
| Public-candidate original Items.csv rows | **9,351** |

Count reconciliation: **7,560 + 103 + 15,039 = 22,702**.
The original 27,281 source rows minus 2,217 unresolved rows give
25,064 rows associated with named IDs before strict-name exclusions.

The report contains 15 original numeric field types (71,606 total
source-row/field occurrences), including:

| Field | Source-row occurrences |
| --- | ---: |
| Str, Dex, Vit, Mag (each) | 7,254 |
| MinDamage / MaxDamage | 6,999 / 6,942 |
| AC | 6,889 |
| CriticalPlus | 5,000 |
| MagicDef | 4,117 |
| MagicSkillPlus | 3,052 |
| HitRate | 2,932 |
| EV | 2,202 |
| ActivePower | 2,095 |
| MoveSpeed | 2,004 |
| BuffUpPercentage | 358 |

These are field occurrences in source records, not unique equipped
items or verified combat outcomes. Counts are not summed to infer
the number of upgradeable items.

## What this stage can and cannot establish

The aggregate proves coverage and exact count reconciliation, but does
not include individual stats or the public candidate files. The
actual source-derived values remain only in the private local output
folder Miner_AllStats_PublicCandidate_20_31.

The new read-only audit gate checks those candidate files against
the complete source-only public item registry and this aggregate:

- exact snapshot/source/version and fixed exporter manifest semantics;
- candidate IDs exist in the approved named-ID registry, never in
  quarantined or unresolved identities;
- ID-bucket alignment, individual source row numbers, nonempty stats,
  global row uniqueness, and no duplicate JSON keys;
- strict numeric field allowlist and original numeric strings,
  including explicit zero and allowed fractions;
- no unexpected file, path, field, client material or raw text payload;
- candidate totals and per-field occurrences reconcile to the aggregate.

The script deliberately does not copy or publish candidate data. It
does not have the original database and cannot independently prove
whether a candidate value exists in the live Global server.

## Run the candidate audit on Windows

From the repository root, after this change is merged:

    git pull origin main
    py scripts/validate-full-client-stats.py --candidate Miner_AllStats_PublicCandidate_20_31

Expected result for the original candidate: an audit pass for
7,560 distinct candidate IDs and 9,351 source rows. Any mismatch
blocks publication.

GitHub CI also executes Python regression tests, and verifies optional
public/data/client-items/stats automatically when it exists. Until
that later data-review PR, a missing optional directory is allowed;
the existing 23,586-ID browser and 551 reviewed equipment pages stay
unchanged.

## Next import milestone

After the audit passes, share the public candidate directory as a ZIP,
preserving manifest.json and all listed two-digit NN.json files.
Do not upload or commit the raw SQLite database, unrestricted Items.csv,
extracted private records or local filesystem paths.

Only a subsequent separately reviewed PR should publish the
source-derived numeric shards under public/data/client-items/stats.

The existing full item browser can then show original combat fields
for newly indexed equipment-like categories and, where appropriate,
the explicitly labeled historical +0..+10 model. Keep MagicDef, EV
and MoveSpeed unchanged at every grade; do not extrapolate unsupported
fields, fractional Mag, unsupported item types, L availability,
equippability or server-side stats.

This audit stage itself does not invent gameplay eligibility or
change existing reviewed equipment records.
