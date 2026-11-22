# Stage 20.1 — Conservative item staging export

Based on the metadata-only Miner_Schema_20.json produced against the
local atlantica.sqlite3, the confirmed tables include catalog_items
with snapshot_id, record_id, item_id, category, region and
translation_state, and snapshots with integer id.

This stage reads the database **read-only** and exports a single snapshot
into the existing Wiki JSON v1.0 contract. It is an **unverified staging
data generator**, NOT a public item importer.

## Design and safeguards

- Reads only five source columns: record_id, item_id, category, region
  and translation_state. It does **not** read or export local source paths,
  source files, raw client blobs, names, materials, recipes or loot rates.
- Requires a snapshot ID to prevent combining different source snapshots.
- Any item ID appearing in more than one record within the snapshot is
  **entirely withheld**, even when names look equal. No silent choice of
  the first or last record; no fuzzy merges.
- Nonpositive or missing item IDs are withheld.
- Only conservative category and region strings can appear in
  fields.minerCategory / fields.minerRegion. Their meanings remain
  source metadata, not independently verified gameplay facts.
- names is intentionally empty: translation_state values are not yet
  independently tied to verified localized names.
- Every record has evidence.status = Unverified, which must FAIL the
  existing public validation gate, even if exported items are structurally
  valid. This stage does not write anything to public Astro routes.
- Output carries source table, snapshot ID and record ID as provenance
  tokens, not absolute file paths or contents.
- Produces a separate aggregate report with snapshot counts, withheld
  duplicates and bounded category/state distributions. Inspect this
  report before sharing it.

## Windows PowerShell

After merging the PR and running git pull origin main, use a stopped
or consistent copy of the local Miner SQLite. Replace the example DB
path and version according to your environment:

```powershell
py .\scripts\export-miner-items-staging.py "D:\PATH\TO\atlantica.sqlite3" --snapshot 1 --miner-version "0.7" --output ".\Miner_Staging_20_1.json" --report ".\Miner_Review_20_1.json"

node .\scripts\validate-game-dataset.mjs ".\Miner_Staging_20_1.json"
node .\scripts\validate-game-dataset.mjs ".\Miner_Staging_20_1.json" --public
```

The first validator command should pass if the payload is structurally
well formed. The **second must fail** because all records are Unverified.
Do not change the evidence status merely to make public validation pass.

When sharing results, send **only** Miner_Review_20_1.json after review,
not the original SQLite or full staging file. Category/state labels come
from source records and should be inspected for unexpected sensitive text
before upload. Staging and review outputs are ignored by .gitignore.

## Verification

```powershell
py -m unittest discover -s .\tests -p "test_export_miner_items_staging.py" -v
```

## Next stage (20.2)

Review the report distributions and duplicate rates, then implement an
explicit source-aware identity policy, audited English name joins and
an approved item-field mapping. Only after that can a reviewed subset
advance to the public catalog. Keep drop rate and recipe interpretations
separately gated until their semantics are corroborated.
