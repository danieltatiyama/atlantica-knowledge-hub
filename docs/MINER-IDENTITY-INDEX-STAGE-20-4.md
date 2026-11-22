# Stage 20.4 — Source-aware full item identity index

## Evidence available for the design

A private, hand-reviewed `Miner_Sample_20_4.json` was inspected
**locally only**. The sample contains 72 duplicate-ID groups (18 per
diagnostic category), 24 singleton item records, 43 related loot rows,
35 character rows and bounded record provenance. **Do not commit that
sample, game-client records, or raw databases to this repository.**

Source observation (not a gameplay claim):
- Item ID **192**: `Weapon` in both `base` and `ENG` Miner
  partitions; gameplay fields agree but names differ.
- Item ID **576**: `Defence` and `Armor` refer to the same named
  item, suggesting a broad/specific table overlap. This is a review
  candidate, not an approved cross-category merge.
- Item ID **3890**: `Accessories` and `Decoration` have different
  names and original names at the same ID. It is **unsafe** to treat
  `item_id` as a unique item entity in every source.
- Item ID **29650**: several different curtain names in one
  `House_Curtain` category share the same ID, with repeated source
  rows; multiple source identities must be retained.
- Item ID **23208**: two book recipes and work values differ under one
  ID. Never pick one recipe merely because its record is newer.
- An `_ENG.vna` name can be in **Korean** while a `base` entry
  has an English name. Partition labels are NOT translation authority.
- The private sample includes `CharItemInfo.dat` direct and group
  references. Its `rateRaw` is **not** a confirmed drop percentage;
  crafting material expressions and recipe state also remain
  unverified until source-level semantics are reviewed.

## New full-index pipeline

`scripts/build-miner-identity-index.py` reads the real
`catalog_items` schema from a selected local SQLite snapshot in
**mode=ro**, one item ID at a time.

Unlike Stage 20.1, which withheld 4,858 duplicate IDs entirely, this
stage creates a **private** v1.0 staging record for **every valid ID**
and retains the complete set of source record references.

The indexed identity is explicitly unresolved when necessary:

| identityReviewState | Meaning |
| --- | --- |
| singleton | One source record for the ID; identity not independently checked |
| localization-overlap-candidate | Base/ENG entries agree on selected item fields |
| exact-repeat-candidate | All selected semantic fields match exactly |
| cross-category-overlap-candidate | Different categories, matching base original names; candidate only |
| cross-category-name-conflict | Categories and base original names disagree |
| same-partition-name-conflict | Different original names inside the same Miner partition |
| attribute-conflict | Item fields (e.g. grade, level, work, material) differ |
| ambiguous-duplicate | No stronger classification applies |

Classifications are mutually exclusive for **triage** only. Cross-cutting
flags retain information about other disagreements. They do not
constitute approval to merge or publish.

Records use `id: "<item_id>"`, `names: {}`, and
`evidence.status: "Unverified"`. Within `fields`, each source
record is referenced by its numeric `recordId` and `partition`;
there is no raw item name, localized text, source path, recipe or loot
table in this dataset. This is deliberately a **review index**, not
a resolved gameplay catalog.

## Windows PowerShell

After PR merge and `git pull origin main`, run on a consistent
offline copy, or with the Miner stopped:

```powershell
py .\scripts\build-miner-identity-index.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --miner-version "0.2" --private-index ".\Miner_Identity_Index_20_4.json" --report ".\Miner_Review_20_4.json"

node .\scripts\validate-game-dataset.mjs ".\Miner_Identity_Index_20_4.json"
node .\scripts\validate-game-dataset.mjs ".\Miner_Identity_Index_20_4.json" --public
```

Use the **actual producer version**, not just the folder name. If
uncertain, omit `--miner-version` (result: `unknown`).
The first validator must pass, and the second **must fail** until
reviewed records are exported through a separate explicit approval flow.

`Miner_Identity_Index_20_4.json` is **private and local**.
`Miner_Review_20_4.json` contains aggregate counts only and may be
used for local diagnostics; neither file is required to continue
exploring this already-supplied 72-group sample.

## Verification

The PR CI runs synthetic SQLite tests and the existing Wiki validator
to verify full source-reference coverage, data non-disclosure and
correct public-gate failure. No original client data is used in tests.

## After Stage 20.4

Implement curated field-level approvals on top of the private identity
index, starting with the existing 551 published item ID/name mappings,
then expand categories and optional recipes when source precedence and
gameplay semantics have been independently reviewed. Do NOT publish the
full index or assume a collision classification resolves identity.
