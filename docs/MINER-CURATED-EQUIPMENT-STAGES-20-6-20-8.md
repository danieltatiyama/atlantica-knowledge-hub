# Stages 20.6–20.8: Curated client metadata, safety gates and offline review UI

## What changed

The existing public Equipment Item Catalog contains 551 previously
reviewed EN names from the NA client. It continues to be the **only
authority for item English names** for these item pages.
The new `src/data/approved-equipment-metadata.json` begins with
**zero records**. This is intentional: no new Miner data was
independently reviewed for public display.

- `src/data/curated-equipment-gate.mjs` — fail-closed shared
  allowlist for approved metadata. Requires exactly the public
  previously-reviewed name and an exact `catalog_items` snapshot/row
  reference from a matching approved snapshot; allows only
  `clientCategory`, `clientLevelRaw`, `clientGradeRaw`; only
  `Extracted` evidence is accepted. Rejects unexpected keys,
  extra languages, recipes, loot rates, paths and unreviewed data.
- `src/data/curated-equipment-metadata.ts` — Astro-only static lookup
  that validates the payload again when imported. No dynamic SQLite,
  client files, or private Miner data are read at build or runtime.
- `ItemDetailPage.astro` — only when an approved record exists,
  shows a bilingual **Reviewed client-extracted metadata** section.
  All raw fields have explicit client/raw labels; snapshot and
  `Extracted` evidence remain visible. **Raw level is NOT a
  confirmed minimum character/equip level**, and raw grade is
  NOT enchantment +grade.
- `ItemCatalogPage.astro` — an extra review/metadata column appears
  only if the approved manifest contains records. The existing empty
  dataset leaves all 551 pages visually unchanged.
- `scripts/check-curated-equipment.mjs` — validates the tracked
  curated dataset using both the v1.0 public gate and the stricter
  equipment-specific gate.
- `scripts/merge-curated-equipment.mjs` — append-only snapshot-aware
  merge; refuses changes to an existing ID, silent overwrites,
  unrelated snapshots or empty incoming data.
- `scripts/promote-approved-equipment.mjs` — dry-run by default;
  `--write` only updates the local JSON after all gates pass. It
  never commits, pushes or deploys.
- `tools/equipment-review-workbench.html` — local-only browser UI:
  manually select a base source row and subset of approved fields,
  provide a real reviewer justification, export Stage 20.5 approval
  manifest. No network requests, no local storage, no automatic
  approvals and no publication.
- `tests/curated-equipment-gate.test.mjs` — synthetic rejection
  tests for accidental client-data leakage, incompatible snapshots,
  duplicate IDs, invented names, field tampering, and public
  contract compatibility. GitHub CI runs them before the Astro build.

## Complete operator workflow (all private files remain local)

From the Wiki repository root after merging:

```powershell
git pull origin main

# 1: Create private review queue and aggregate-only report.
py .\scripts\reconcile-miner-equipment.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --private-review ".\Miner_Equipment_Private_Review_20_5.json" --report ".\Miner_Review_20_5.json"

# 2: Open the review UI locally. Use the file picker to load the review JSON.
Start-Process ".\tools\equipment-review-workbench.html"
```

Review candidate source rows carefully. Only a human can select a
source and fields. The UI cannot resolve blocked identity/attribute
conflicts. **Do not upload the private queue to the public repo**.
On export, move the browser-produced local
`Miner_Equipment_Approvals_20_5.json` to a convenient path under the
Wiki root. The file's `reviewNote` is private and is not copied to
the public output.

```powershell
# 3: Re-open SQLite read-only and validate each manual approval against
#    the same snapshot + existing reviewed name registry.
py .\scripts\reconcile-miner-equipment.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --private-review ".\Miner_Equipment_Private_Review_20_5.json" --report ".\Miner_Review_20_5.json" --approvals ".\Miner_Equipment_Approvals_20_5.json" --approved-output ".\Miner_Equipment_Approved_20_5.json"

# 4: Validate the approved candidate dataset in public contract mode.
node .\scripts\validate-game-dataset.mjs ".\Miner_Equipment_Approved_20_5.json" --public
node .\scripts\check-curated-equipment.mjs ".\Miner_Equipment_Approved_20_5.json"

# 5: Preview what an append-only import would change (writes nothing).
node .\scripts\promote-approved-equipment.mjs ".\Miner_Equipment_Approved_20_5.json"

# 6: Only after reviewing the candidate file and the dry run:
node .\scripts\promote-approved-equipment.mjs ".\Miner_Equipment_Approved_20_5.json" --write

# 7: Verify and review the exact public changes before opening a PR.
node .\scripts\check-curated-equipment.mjs
node --test .\tests\curated-equipment-gate.test.mjs
npm run build
git diff -- src/data/approved-equipment-metadata.json
```

Commit **only the reviewed, approved JSON** to the public Wiki.
Never `git add .` from a working directory containing private
source data; the repository ignores most `Miner_*.json` files as
defense in depth, but do not rely on ignore rules alone.

**Important:** a valid schema and a matching numeric reference prove
only that the reviewed selection is *structurally consistent*.
Neither the UI nor the CLI independently verifies client data truth,
in-game currentness, or gameplay mechanics. Editorial approval and
the standard GitHub PR review remain essential. Any change to an
already-published item must be reviewed in a dedicated PR; the
promotion CLI refuses silent replacements.

## QA / publication boundary

- No approved Miner entries are added by this PR.
- No private index, source sample, SQLite, raw NDT/VNA files,
  materials, recipes, or drop probabilities are committed.
- The current 551 item names and box preview relationships are unchanged.
- GitHub Actions checks the empty pilot; later PRs will validate
  the real **curated-only** approved JSON before Astro deploy.
- Stage 20.9 (real data) requires actual human source/field approvals
  via the offline UI. Without that input we must not invent metadata.

## Future expansion safely

For recipes, loot and mercenaries, use separate source-aware datasets,
review gates, editorial evidence and UI provenance. Never reuse
`rateRaw` as a percentage or assume that `ENG` always means English.
