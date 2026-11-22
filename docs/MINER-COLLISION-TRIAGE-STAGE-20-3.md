# Stage 20.3 — collision triage, zero automatic merges

## Input: Stage 20.2 report, snapshot 1 (2026-11-22)

- 30,421 source rows, 23,586 distinct valid item IDs.
- 18,728 singleton item IDs.
- 4,858 duplicated IDs covering 11,693 source rows.
- 1,415 groups have the same compared non-localized item fields and span
  the `base` / `ENG` Miner partitions.
- 685 groups have the same compared non-localized fields but different
  region/partition patterns.
- 1,197 groups differ in at least one selected item field.
- 1,561 groups contain differing category values.
- 3,124 groups contain both `base` and `ENG` records. **This does
  not imply the two rows can be merged**.

The column called `region` contains the labels `base` and `ENG`,
which should be interpreted as **Miner source partitions** for this
analysis, not independently verified server/region labels.
The `translation_state` label `official` is likewise not independent
proof of correct English localization.

## Scope

The new script reads only the selected source snapshot and creates:
1. `Miner_Review_20_3.json` — safe-to-share **aggregate** cross-tab of
   collision class vs. partition pattern; counts of differences by
   item field; name/source/translation-state difference flags; priority
   totals. It includes **no item IDs, record IDs or raw field values**.
2. `Miner_Quarantine_20_3.csv` (optional) — **LOCAL PRIVATE** triage
   queue of numeric item/record IDs and fixed diagnostic flags.
   It intentionally omits item names, original names, source paths,
   materials, recipes, translations and all other field values.
   Do not upload this queue or commit it to GitHub.

The four diagnostic classes and private priorities are:
- A-localization-review: `same-fields-base-and-ENG`
- B-source-review: `same-fields-other`
- C-attribute-review: `different-item-fields`
- D-identity-conflict: `different-categories`

These are ordering labels for **manual investigation**, not proof of
equivalence or acceptance for publication. In particular, the class
`same-fields-other` may still contain unreconciled source and name
differences. The existing Stage 20.1 exporter continues to withhold
every duplicate ID and marks all staged records Unverified.

## Run on Windows

After reviewing and merging the PR, update your local Wiki clone.
Prefer a consistent offline copy of the Miner DB, or stop the miner.

```powershell
git pull origin main

py .\scripts\triage-miner-item-collisions.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --output ".\Miner_Review_20_3.json" --private-queue ".\Miner_Quarantine_20_3.csv"
```

If no per-ID queue is needed, omit `--private-queue` entirely.

Run synthetic-only regression tests:

```powershell
py -m unittest discover -s .\tests -p "test_triage_miner_item_collisions.py" -v
```

**Share only the reviewed `Miner_Review_20_3.json`.** Keep the private
CSV and SQLite local. The repository ignores these generated outputs.

## Stage 20.4 decision

1. Use the cross-tab to identify how many base/ENG pairs genuinely
   agree on selected fields versus differ in categories or recipe data.
2. Determine, for each source family, whether `item_id` is a
   global unique item key or a source-local key. No automatic merge.
3. Implement a narrowly scoped reviewed localization bridge for
   known item IDs (starting with the existing 551-item dictionary);
   never trust the bare `official` label without corroboration.
4. Before adding item fields or loot to the public UI, retain exact
   provenance and verify field meanings independently.

No client files, raw records, session traces, or unreviewed full
datasets should ever be committed to the public Wiki.
