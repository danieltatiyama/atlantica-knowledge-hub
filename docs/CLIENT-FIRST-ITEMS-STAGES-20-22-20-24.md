# Stages 20.22–20.24 — Client-first full item catalog and Legendary reference

## User-approved direction

The game-client files already collected for the private Atlantica Miner
are the **primary source for client-defined item fields**. Do not
require a historical Wikidot row or a new tooltip screenshot for every
already decoded client field. Display the source and distinguish:

- **game-client-extracted**: actual decoded NDT/VNA/Miner field values;
  these are not independently verified gameplay facts
- **ingame-screenshot**: stats observed under a particular equipment,
  enhancement and socket configuration
- **community-reference**: historical Wikidot/Fandom rows, which may
  differ from the current Global client
- **computed/estimated**: historical +0..+10/L numeric projection,
  not a literal client value

This approval does NOT establish probabilities, playable variants from
duplicate file definitions, event-only acquisition, craftability,
legendary eligibility for all weapons, or official combat formulas.

## Fandom list: 47 historical L candidates

User-selected community source:
https://atlantica.fandom.com/wiki/Legendary_Weapons

The source article lists **47 names in 12 nonempty categories**:
Axe 7, Bow 3, Cannon 3, Gun 3, Instrument 4, Orb 1, Power Saw 2,
Shield 1, Spear 7, Staff 5, Sword 9, Whip 2. Some equipment may
have been obtainable only at special events, but the list does not
identify every such circumstance. Acquisition, craftability and
event status are therefore recorded as UNKNOWN by default.

The historical list is in
`src/data/legendary-eligibility-reference.json` and enforced by
`legendary-eligibility-reference-gate.mjs`. No invented item IDs,
event flags or drop locations. Its own page explains:
- Legendary L corresponds to +11 and is reached by enhancement,
  not enchanting
- a historical source list does not guarantee current availability
- category Shield contains the Guardian Sheath equipment, not the
  similarly named mercenary passive skill
- unlisted gear remains UNKNOWN unless an independent client/source
  shows otherwise; this is an initial list, not an exhaustive denylist

The source list's 47 names have **zero exact name matches** to the
preexisting 551 box-derived equipment IDs. This is expected because
that is a deliberately limited box catalog, not a whole-item catalog.

The Legendary research page now displays all 47 names grouped by
source category. A match to any existing name would show only
"NAME MATCH — REVIEW ID", never silently enable Legendary on an item.

## 20.23 — all valid source IDs from the full Miner SQLite

`scripts/export-client-equipment-facts.py` opens the user's existing
`atlantica.sqlite3` with SQLite `mode=ro` and `PRAGMA query_only=ON`.
It reads **every valid positive item_id** under one explicit Miner
snapshot, rather than limiting the investigation to 551 box items.

For each distinct ID the PRIVATE export preserves:
- official English client name when uniquely established;
- source records with original row/record ID, file basename, general
  vs specific role, source category, raw client level, grade, unit and
  workload;
- **structured material references** (item ID × quantity) decoded
  from supported original JSON recipe pairs or
  `5100(5)+6080(4)`-style source material expressions;
- separate source-value sets when two client definitions differ;
- localization count; explicit identity-conflict status;
- every distinct positive item ID, including IDs outside the 551
  currently published equipment names.

Outputs:
- `Miner_ClientFacts_Private_20_23.json` — all source IDs, private
  source records, source-set disagreements and identity warnings.
- `Miner_ClientFacts_Report_20_23.json` — aggregate-only statistics;
  no item names, IDs, paths, recipes, drop rates or raw source data.
- `Miner_ClientFacts_PublicCandidate_20_23.json` — optional, strictly
  bounded subset for already reviewed 551 IDs with one exact matching
  **official English** client identity. Items with conflicting base
  identities are blocked; source sets within an item remain separate.
  This is an extracted-facts candidate, not a gameplay confirmation.

Unlike the full private inventory, the candidate is schema validated
by `src/data/client-equipment-facts-gate.mjs`. The tracked `src/data/client-equipment-facts.json` is **already seeded with four source-attested items** from the user's prior `Miner_Sample_20_4.json` (snapshot 1): Spirit Sword #1, Twilight Instrument #192, Red Soul Robe #650, and Conqueror's Greaves #1211. Each sample explicitly reports its source rows are not truncated. All facts are labeled client-extracted, not verified gameplay. The full 551-ID overlay still requires the local read-only export.

## Already available from previous uploaded client source sample

| Existing ID | Item | Recorded source files | Fact coverage |
| --- | --- | --- | --- |
| 1 | Spirit Sword | ItemTypeWeapon.ndt, ItemTypeSword.ndt | Raw Lv.1, work 450, 2 material references |
| 192 | Twilight Instrument | ItemTypeWeapon.ndt | Raw Lv.165, work 550,000,000, 6 material references |
| 650 | Red Soul Robe | ItemTypeDefence.ndt, ItemTypeArmor.ndt | Raw Lv.15, work 2,200, 5 material references |
| 1211 | Conqueror's Greaves | ItemTypeDefence.ndt, ItemTypePants.ndt | Raw Lv.97, work 6,000,000, 10 material references |

These are **four client item pages, seven original source file rows**,
not seven distinct pieces of equipment. Different source-file records
remain separate definitions, not automatically different playable
variants. No screenshot stats, private paths, Korean original names
or raw source expressions were published.

## Wiki item page behavior

`ClientEquipmentFactsSection.astro` is integrated with existing
numeric item pages and displays these four sourced items already and will expand when the
complete local source candidate is staged:
- file, source role and category;
- extracted level, grade, unit and workload (all labeled RAW);
- structured ingredient ID/quantity lists; names only where another
  **already reviewed** ID/name mapping exists;
- one expandable source-definition set per distinct group;
- provenance by Miner snapshot and record ID;
- explicit warnings that differing definitions are not automatically
  different gameplay variants and that a recipe reference does not
  prove craftability.

Existing screenshot/editorial stats, box preview references and
community sources are left unchanged. No older value overrides
a newer source, and no combat-stat rows are inferred from
the basic raw item-level fields.

## 20.24 — cross-match full client inventory and discover more fields

`scripts/reconcile-legendary-client.mjs` matches the Fandom 47 names
against the ENTIRE private `20.23` source inventory. It separates
exact-source-name candidates, ambiguous matching names/IDs and
names not found. It writes private
`Miner_Legendary_Client_20_24.json`.

**This is still not official proof that an item ID is correct or
that the source list is exhaustive**. A gameplay L flag should be
enabled only after source identity has been confirmed.

The Miner has additional reference datasets, including `Items.csv`,
`CraftMaterials.csv`, `CraftRecipes.csv`, `DirectDrops.csv`,
`GroupDrops.csv` and others. The client `catalog_items` table
does **not** contain the full attack/defense/skill tooltip schema.
`scripts/profile-miner-reference-fields.py` discovers the **key names,
types and counts** present in the additional `reference_rows` JSON
payloads without exporting any original values. Its small
`Miner_ReferenceFields_20_24.json` report will guide a subsequent
explicit extraction of attack/defense, crafting, skill and loot fields,
rather than guessing the schema.

**Rates in game files are raw numbers; they are not published as
drop probabilities without their denominator and mechanics.**

## One-command Windows workflow

After reviewing/merging this PR, at your local Wiki repository:

```powershell
git pull origin main

# Pass YOUR original local SQLite file; no upload to ChatGPT is needed.
.\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\path\to\atlantica.sqlite3"

# After inspecting source IDs, legacy variants and the public candidate:
.\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\path\to\atlantica.sqlite3" -PreparePublic

npm run validate:client-facts
npm run test:client-facts
npm run build

git diff -- src/data/client-equipment-facts.json
```

The first invocation is a **dry run**: 5 local outputs, NO tracked
changes. The second prepares the PUBLIC candidate in the local working
tree and builds the site; it does NOT commit, push, merge or deploy.

Do not upload the full Miner private output to a public Git repo.
If sharing findings for next-step source-field mapping, the two small
aggregates `Miner_ClientFacts_Report_20_23.json` and
`Miner_ReferenceFields_20_24.json` are the appropriate starting
point, after a quick privacy review. The 47-name match report includes
candidate IDs and stays private until individually reconciled.

## Future expansion

All source IDs are inventoried now, but only the existing reviewed
551-ID catalog is served as public numeric routes. Once the
full client-only English names are independently cross-reconciled,
we can expand navigation, search and static item pages to additional
IDs without making up names or merging collisions.

## QA

- Python synthetic SQLite tests verify read-only behavior, both
  general/specific file definitions, parsed material IDs, source
  conflicts, private all-ID inventory and public-only precise matches.
- Node tests verify source schema, no raw/private paths, no
  dropped variant source rows, 47 Legendary names, unknown event
  acquisition, and no false matches to 551 IDs.
- Separate synthetic tests discover `reference_rows` field types with
  **no raw client values**.
- Private Legendary/client matcher tests quarantine duplicate names
  across different client IDs and never auto-publish L.
- Existing Astro build, prior historic item articles, Miner identity
  gates and PR checks remain in place.
