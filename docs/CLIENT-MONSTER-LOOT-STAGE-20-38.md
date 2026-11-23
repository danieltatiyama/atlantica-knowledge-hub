# Stage 20.38 — Original monster/character and loot-source bridge

## Original extracted data

The November 2026 offline Miner investigation has five known source
datasets in reference_rows (SQLite snapshot ID 1):

- Characters.csv — 4,351 original rows;
- DirectDrops.csv — 9,959 original rows;
- CharacterGroupRefs.csv — 5,784 original rows;
- GroupDrops.csv — 3,076 original rows;
- GroupBands.csv — 572 original rows.

The optional monsters table holds original monster catalog evidence,
and can contain more IDs than the Characters.csv reference list.

These are **client source records**, not current live-server encounters
or empirically measured drop rates. In particular RawRate values must
NOT be converted to percentages or multiplied across the two group
levels without separately validated server roll mechanics.

## Browser UI (code-only)

This stage creates bilingual /monsters/ and /pt-br/monsters/ client
character catalogs, linked from header/home, with:

- Name or numeric CharID search, raw level and kind filters, paging;
- Original character fields and optional Miner monster metadata;
- Direct item-source drops with ItemID, client name, original record,
  original RawRate and candidate quantities;
- Group references with original GroupID, source row and raw rate,
  separately followed by the group's original item rows;
- Click-through to all-client item details using exact numeric IDs;
- Links from both original 551 and new 1,911 equipment-like item
  pages, plus every item in the 23,586-ID client database, to the
  source creatures where they were referenced.

Until the source candidate is imported, the interface is explicit that
data is pending rather than fabricating monster/drop associations.

## Exporter / validator

The exporter reads the original Miner SQLite in mode=ro and sets
PRAGMA query_only=ON. It does not write or mutate the database.

Commands from the root of the local cloned repository (Windows):

    py scripts/export-client-monster-loot.py "D:\path\to\miner.sqlite3" --dry-run
    py scripts/export-client-monster-loot.py "D:\path\to\miner.sqlite3"
    py scripts/validate-client-monster-loot.py --candidate .\Miner_MonsterLoot_PublicCandidate_20_38

The export writes an **unpublished candidate**, outside public/:

    Miner_MonsterLoot_PublicCandidate_20_38/
        manifest.json
        index-00.json ...
        characters/NN.json ...
        loot/NN.json ...
        groups/NN.json ...
        item-sources/NN.json ...

The safety gates check the original five dataset counts and source
snapshot, ItemID identities against the published 23,586-ID index,
literal CharID/GroupID joins, original source row IDs, orphan groups
and accurate item reverse links. RawRate is preserved as raw text.

The original database and source file paths must never be committed;
only reviewed, allowlisted JSON output can be considered for a
separate data PR after auditing source identity, privacy, provenance,
naming conflicts and file hashes.

The source candidate can be zipped for review with PowerShell:

    Compress-Archive -Path .\Miner_MonsterLoot_PublicCandidate_20_38\* -DestinationPath .\Miner_MonsterLoot_PublicCandidate_20_38.zip -Force

If the existing Miner database schema or snapshot changed,
do NOT weaken the validator to force an import. First provide the
script's redacted error and a schema-only profile for further
analysis.

## CI

- Python unit tests run synthetic original direct/group joins,
  unknown ItemID, strict raw rate, and changed reverse-link rejection;
- Node UI tests verify multilingual routes and source-safe schema
  gating, no untrusted innerHTML, and no imagined current drop odds;
- Optional published data will be validated in CI as soon as
  public/data/client-monsters/manifest.json exists;
- Astro build runs on a clean checkout.

## Next step requires original data

The previous investigation's aggregate report lists rows and joins
but **does not contain individual original drop records**. To publish
a complete useful creature/drop database, the locally retained
Miner SQLite (or the old five source CSV exports) must be provided
or re-exported using the commands above.

Until then, no invented item drop associations or live-server rates
are added to the site.
