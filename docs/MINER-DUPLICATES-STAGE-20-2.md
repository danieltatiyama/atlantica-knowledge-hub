# Stage 20.2 — Audit item-ID collisions before deduplicating

## Input findings — Miner_Review_20_1.json

Snapshot 1 contains:
- 30,421 item rows
- 23,586 distinct IDs (18,728 singletons + 4,858 duplicated IDs)
- 11,693 rows withheld because they share 4,858 duplicate IDs
- 0 invalid item IDs and 0 invalid record IDs
- 27,281 rows labelled base and 3,140 labelled ENG
- translation_state labels: official (26,663) and original (3,758)

The base/ENG distribution is **not proof** that duplicated item IDs are
translations, and translation_state=official is **not** independent
evidence that an item label is correct.

## Conservative classification

Run the local-only aggregate audit to learn **why** IDs repeat.

- different-categories: same item_id appears under multiple category labels.
- different-item-fields: category agrees but one of grade, level, unit,
  work, material, recipe_state or recipe is not exactly equal.
- same-fields-base-and-ENG: selected non-localized fields agree,
  and both region labels occur, suggesting a localization overlap to review.
- same-fields-other: selected non-localized fields agree in other
  combinations of regions/sources.

Name, original_name, source and translation_state differences are counted
separately, never exported. Classification does NOT mean records can be merged
safely. None of these findings proves in-game identity or version precedence.

The tool never exports item IDs, names, paths, recipes, record payloads or
hashes. Its JSON contains aggregate counts only. It is **diagnostic,
not a source for production publication**.

## PowerShell on your machine

After PR merge and git pull origin main, run against a consistent offline
copy of the Data Miner SQLite (or stop the miner while reading):

```powershell
py .\scripts\audit-miner-item-duplicates.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --output ".\Miner_Review_20_2.json"
```

Local tests:

```powershell
py -m unittest discover -s .\tests -p "test_audit_miner_item_duplicates.py" -v
```

Review and send only Miner_Review_20_2.json. The name matches the
existing .gitignore rule Miner_Review_*.json.

## Next decision

Use the distribution of the four classes to determine an explicit,
source-aware identity policy. Only then introduce approved field-level
provenance and independently verified localization. Stage 20.1 continues
to withhold all duplicated IDs until that policy is established.
The public validation gate remains blocked for Unverified records.
