# Stage 20.11 — General vs specific item sources, variants and collisions

## Source-grounded observation

The actual user-supplied `Miner_Sample_20_4.json` showed that **Spirit
Sword** (numeric item ID `1`) has *three source records*:

| Record ID | Source | Purpose | Fields |
| --- | --- | --- | --- |
| `112473` | `ItemTypeWeapon.ndt` | General weapon definition | Same English name, original name, grade, level, work, raw materials |
| `123919` | `ItemTypeWeapon_ENG.vna` | Separate localization partition | Korean name; same core item ID |
| `192767` | `ItemTypeSword.ndt` | Specific sword definition | Same core values; adds unit=1 and a successfully parsed crafting recipe |

The `recipeState` difference between general and specific in this
case is a **Miner parsing difference**: `unsupported` vs `valid`,
but *raw materials match*. That is not evidence for two in-game item
variants. All three source references belong to one item page, not
three separate items. **Item ID** and **Miner record ID** must be
modeled as different identifiers.

Not every item is proven to have precisely two source records. The
sample also contains examples of items with one source, multiple
localizations, different material sources, and actual ID collisions.

## Identity model

1. **Same identity, identical/general/specific complementary sources**:
   one item route `/items/{itemId}/`, one item entity, all relevant
   source record references retained. A specialized table may supply
   more complete parsed metadata than the generalized table.
2. **Same identity, substantively divergent fields**: one item route
   with distinct **review candidates** per source-defined variant;
   each variant retains its source references. Differences in parsed
   recipe data are meaningful only if *both* rows parsed successfully.
   No gameplay variant is asserted until separately reviewed.
3. **Same numeric ID, different item names/original identity**:
   `id-collision-different-names`, **not** silently treated as
   variants of the same item. Keep separate source identities; flag
   manual resolution. Example: item ID `3890` from the sample,
   where the same ID maps to a ring and a decoration.
4. **Localization rows**: remain separate evidence. A row from
   `_ENG.vna` can have Korean text, so do not trust source partition
   naming as translation authority.

General/specific currently explicitly recognizes:
- `Weapon` from `ItemTypeWeapon.ndt`, paired with a specific weapon
  source (e.g., Sword).
- `Defence` from `ItemTypeDefence.ndt`, paired with a specific
  defensive source (e.g., Armor).

Other source families are treated conservatively as specific/unknown
without inferring a generalized hierarchy.

## New Stage 20.11 tool

`scripts/group-miner-equipment-sources.py` reads the local SQLite
snapshot in read-only mode and groups the **551 already reviewed
equipment IDs** by source identity, not blindly by row/ID equality.

- Compares non-empty grade, level, work, material, unit values.
- Considers parsed recipes conflicting only when **both** parse
  successfully and have genuinely different output.
- Treats general-category vs specific-category names as different
  source roles, not automatic gameplay variants.
- Keeps `ENG` localization separate from `base` item sources.
- When a generic source is compatible with more than one conflicting
  variant, leaves that source as **ambiguous/shared** rather than
  assigning it arbitrarily.
- Rejects base name/original-name conflicts and reports them as
  unresolved identity issues rather than grouping unlike items.
- Produces only *review candidates*; does not write approved
  gameplay fields or new static Wiki pages.

Outputs:
- `Miner_Source_Groups_Private_20_11.json` — **PRIVATE**: reviewed
  existing names, numeric source record IDs and source-file basenames,
  per-ID source groups/variants. No raw recipes, original-language
  names, material expressions or absolute local paths.
- `Miner_Review_20_11.json` — aggregate counts and fixed states only,
  no item IDs, names, source rows, recipes or private paths.

## Windows PowerShell

After merging and `git pull origin main`, from the Wiki repo root
with the Miner stopped (or an offline consistent SQLite copy):

```powershell
py .\scripts\group-miner-equipment-sources.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" --snapshot 1 --private-output ".\Miner_Source_Groups_Private_20_11.json" --report ".\Miner_Review_20_11.json"
```

Synthetic tests for the known Spirit Sword overlap, multiple recipes,
real ID collisions and ambiguous source matches:

```powershell
py -m unittest discover -s .\tests -p "test_group_miner_equipment_sources.py" -v
```

## Publication boundary

The current 551 item pages already have **one page per reviewed item
ID**. This stage does not publish inferred variants and does not remove
the strict Stage 20.5 manual approval requirement. A future curated
`sourceVariants` contract should show multiple approved variants
*inside the same item page*, not duplicate pages, and must retain
individual provenance per field and source.

Until approved, a divergent source group remains a **source-level
review candidate**, not a verified gameplay variant. Actual item ID
collisions must be handled as different identities, with explicit
source scoping before any user-facing item detail is attributed.
