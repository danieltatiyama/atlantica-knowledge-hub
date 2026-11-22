# Stage 20.25 — Client source values, Legendary identity candidates, Items.csv raw stats

This stage incorporates the actual user-provided reports:

- `Miner_Legendary_Client_20_24.json`
- `Miner_ClientFacts_Private_20_23.json` (private `35 MB)
- `Miner_ReferenceFields_20_24.json`

The user authorized **using values extracted from game files**, not only
old wikis. Source-extracted values are still not observed server behavior.

## Actual source inventory findings (snapshot 1)

| Source result | Observed |
| --- | ---: |
| Valid distinct positive item IDs | 23,586 |
| Base `catalog_items` rows | 27,281 |
| ENG localization rows | 3,140 |
| Rows in all `reference_rows` datasets | 87,422 |
| Unique official English base-name IDs | 22,702 |
| Base-name collision IDs | 290 |
| No official English name | 594 |
| Existing 551 box equipment IDs with exact official source-name matches | 551 |
| Total source definitions attached to those 551 | 1,031 |

**An ID with two client source definitions is not necessarily two
different playable items.** Specialized and general ItemType tables
often overlap.

## Historical Legendary reference → full Miner item IDs

Of the 47 Fandom names:
- **44 have one exact English-name ID candidate**
- **2 have two name candidates**:
  - Immortal Bow: `429`, `437`
  - Lucifer's Rifle: `528`, `536`
- **1 has no exact name**: Spartacus' Great Sword

Examples:
- Excalibur: `151` (source row `113416`, client raw level `150`)
- Guardian Sheath **shield item**: `152` (row `114566`, raw level `150`)
- Dell'arte's Ambition: `23810` (row `113527`, raw level `150`)
- Jupiter's Sword: `1371` (row `113340`, raw level `140`)

`src/data/legendary-client-name-candidates.json` holds all 47 names,
candidate IDs, original record IDs, raw level and raw grade. The
Legendary research page displays this separately from historic level
and scaling. The 44 matches are *exact-name candidates*, not
confirmed L enablement, acquisition, crafting, drop rates or live
level requirements.

**Important differing levels:** Community Fandom can list
Jupiter's Sword as level 150 while the client `levelRaw` is 140;
Dell'arte's Ambition is listed at 180 while its client `levelRaw`
is 150. These are different sources and not necessarily the
same gameplay field. Never silently prefer one or call the raw
client field the required character level.

The `legendary-client-name-candidates-gate.mjs` schema enforces
each source file record ID, raw grade/level format, exact Fandom
English name and the 44/2/1 classification. The "unmatched"
status does not prove the item is absent from the client.

## Additional raw combat-like data actually discovered

The report found `Items.csv` with **27,281 rows, 282 keys**,
including the original field names:

`MinDamage`, `MaxDamage`, `Attack`, `AC`, `Defence`, `MagicDef`,
`Str`, `Dex`, `Critical`, `CriticalPlus`, `Critical_Damage`,
`HitRate`, `Dodge`, `Magic`, `Magic_Damage`, `ActivePower`,
`BuffUpPercentage`, `MagicSkillPlus`, and more.

`CraftRecipes.csv` has 4,537 rows with `MakeSkill`,
`MakeSkillLevel`, `ProductUnit`, `Tool`, `Unique`, `Work` etc.
`CraftMaterials.csv` has 26,476 ingredient references.
`DirectDrops.csv` has 9,959 source records, and `GroupDrops.csv`
has 3,076, with raw rates/quantities. Raw rate values are NOT
verified probabilities.

Because this *column profile* contains key names and counts, not
the field **values**, it is impossible to fill actual combat numbers
on this branch solely from the uploaded profile.

### New stage 20.25 extractor

`scripts/export-client-item-attributes.py` opens the original local
SQLite with `mode=ro` and `query_only=ON`, looks inside
`reference_rows` for `dataset = 'Items.csv'`, parses the JSON and
matches exact `Unique` + `EnglishName` to the reviewed 551 equipment
IDs. It **rejects** all rows for an ID with a conflicting English
name. It preserves the original source row number and numeric
strings for an explicit allowlist of combat-like field names.

Outputs:
- `Miner_ClientAttributes_Private_20_25.json` — entire original
  source rows for the 551 target IDs (private, ignored by Git)
- `Miner_ClientAttributes_Report_20_25.json` — aggregate counts
  of source matches, ID collisions, and numeric field coverage
- `Miner_ClientAttributes_PublicCandidate_20_25.json` — a
  strictly validated numeric field-only candidate, no game file
  paths, original non-English names or arbitrary data

`src/data/client-item-attributes.json` is intentionally EMPTY
until local source export. Do not invent numeric combat values.

`ClientItemAttributesSection.astro` exposes the raw keys in a separate
expandable section on the bilingual numeric item pages after
a validated local import. It does **not** project +10/L attributes
or claim stats apply equally across equipment variants.

## Local Windows commands

After PR merge, run from the repository root:

```powershell
git pull origin main

# Read-only Miner analysis; creates all source reports and candidates.
.\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3"

# Inspect aggregate reports; if valid, prepare the two public JSON
# datasets in your CURRENT LOCAL working tree (NO commit/push/deploy).
.\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3" -PreparePublic

npm run validate:client-facts
npm run validate:client-attributes
npm run build
git diff -- src/data/client-equipment-facts.json src/data/client-item-attributes.json
```

The site initially retains the four sample-backed equipment
definitions from Stage 20.23. The user's uploaded **private**
full-inventory JSON is also sufficient to regenerate a complete
551-ID *source-facts* JSON offline, but that 35 MB private input
is never committed or included in public static assets.

To collaborate on the next stage without sharing raw 87,422-row
data, send back:
- `Miner_ClientAttributes_Report_20_25.json` only to assess
  coverage of parsed numerical attributes
- the validated *public* candidate after reviewing its values,
  if direct application is wanted.

This PR does not change the live game, the Miner SQLite, external
accounts, or the 551 item IDs. It introduces source-only candidates
and a guarded next extraction step. All source facts are
recorded as `game-client-extracted`, with provenance, and remain
distinct from historical community projections.
