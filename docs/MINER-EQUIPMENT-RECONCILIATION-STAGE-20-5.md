# Stage 20.5 — Reconcile reviewed equipment catalog against Miner SQLite

## Input and trust boundaries

The **existing Stage 19** `src/data/equipment-item-names-en.ts`
contains **551 reviewed public item ID/name pairs** from the NA client
and TextMgr item localization. Box reward list evidence is separately
handled by the Equipment Box catalog.

The Stage 20.4 sample showed that an item ID may:
- have a Korean `_ENG.vna` name and English `base` name (ID 192);
- occur in broad and specialist equipment tables (ID 576);
- represent completely different items in different categories (ID 3890);
- have multiple same-category variants sharing one ID (ID 29650);
- have conflicting crafting instructions/work costs (ID 23208).

`region=ENG` therefore **does not authorize** an English name,
and `official` is not sufficient proof of correct localization.
Only the already published reviewed name dictionary is used as a
candidate English-name authority for this stage.

## What the script does

`scripts/reconcile-miner-equipment.py` opens the SQLite **read-only**,
selects one snapshot, loads the actual TS literal reviewed dictionary,
and evaluates every item ID (even missing source rows).

It writes two **local-only** outputs:

- `Miner_Equipment_Private_Review_20_5.json`: private per-ID review
  queue with the already-public English name, candidate numeric
  `recordId`, basename-only client source, category and raw grade/level
  for human evaluation. Does not include original Korean names, private
  source paths, recipes, loot weights, or materials. Do not commit.
- `Miner_Review_20_5.json`: **aggregate only** counts, mutually
  exclusive review states, exact-match/source presence. After inspecting,
  this report can be shared. It never includes names, item IDs, record
  IDs, source file names, recipes or raw field values.

No output is automatically published. Every snapshot remains local.

Review states:

| State | Meaning |
| --- | --- |
| no-source-records | Reviewed equipment ID is absent from the Miner snapshot |
| no-exact-base-name | No candidate in base with the reviewed exact English name |
| base-name-conflict | The same ID has multiple different base names |
| base-original-name-conflict | Same candidate English name but differing original labels |
| base-item-field-conflict | Competing grade, level, recipe, material or work values |
| cross-category-overlap-candidate | Different categories but stable base identity; manual source selection needed |
| localization-overlap-candidate | Base candidate and ENG partition coexist; never prefer ENG name blindly |
| same-source-repeat-candidate | Repeated base rows with agreeing reviewed fields |
| single-base-source | One base source record with exact reviewed name |

Conflicts are never "fixed" by comparing numeric source record IDs or by
choosing last/first row. Cross-category candidates still require reviewer
judgment.

## 1. Generate a review against the actual Miner database

After merging the PR and `git pull origin main`, run from the Wiki
repository root. Stop the miner or use a consistent offline copy.

```powershell
py .\scripts\reconcile-miner-equipment.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --private-review ".\Miner_Equipment_Private_Review_20_5.json" --report ".\Miner_Review_20_5.json"
```

`--registry` defaults to
`src/data/equipment-item-names-en.ts`. If the source code format
changes, the script refuses to parse it until explicitly updated.

## 2. Optional *explicit* approvals

To select verified existing-name sources, a human reviewer may provide a
**local private file** `Miner_Equipment_Approvals_20_5.json`
matching this structure (the IDs below are illustrative placeholders;
replace both numbers with a real candidate from the private queue):

```json
{
  "schemaVersion": "20.5-approvals",
  "snapshotId": 1,
  "approvals": [
    {
      "itemId": "123",
      "recordId": 456,
      "fields": ["clientCategory", "clientLevelRaw", "clientGradeRaw"],
      "reviewNote": "Confirmed that this base record matches the published item."
    }
  ]
}
```

Approved field names are deliberately **client-prefixed** and do not
claim independent in-game confirmation. `clientLevelRaw` is a raw
numeric string, not confirmed minimum equip level; `clientGradeRaw`
is a source category token, not enchantment +grade. No recipes or
drop probabilities are supported.

The strict gate refuses approvals if IDs are absent from the 551-entry
reviewed registry, if the source record is not an exact **base** English
name match from an ItemType NDT file, if that ID has unresolved
same-source name, original-name, recipe or field conflicts, if a note
is missing, or if unknown fields are requested.

```powershell
py .\scripts\reconcile-miner-equipment.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --private-review ".\Miner_Equipment_Private_Review_20_5.json" --report ".\Miner_Review_20_5.json" --approvals ".\Miner_Equipment_Approvals_20_5.json" --approved-output ".\Miner_Equipment_Approved_20_5.json"

node .\scripts\validate-game-dataset.mjs ".\Miner_Equipment_Approved_20_5.json" --public
```

The approved subset uses the existing v1.0 JSON contract and
`evidence.status=Extracted`, with exact reviewed public English names
and source-row provenance tokens. This is eligible for the **contract
validator**, but the script does **not** write into Astro sources or
automatically publish anything. Separately review before importing
the output into the public site.

**Do not upload** the private review or approval files to public GitHub.
The aggregate report is the only shareable output. If no approvals
are supplied, the script creates **zero** approved records/files.

## Verification

```powershell
py -m unittest discover -s .\tests -p "test_reconcile_miner_equipment.py" -v
```

CI includes the entire Python test suite, the v1.0 public gate
acceptance test for explicitly selected data, and the Astro build.

## Next (Stage 20.6)

Build a consumer of **curated-only** extracted item metadata in the
public equipment pages, with clearly labeled source status. Never
read the private review index, original SQLite or client records
at build time and never interpret raw loot `rate` as drop probability.
