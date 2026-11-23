# Stages 20.30–20.31 — The entire client item inventory

## Original input (not committed)

Using the user's original read-only, privately exported
`Miner_ClientFacts_Private_20_23.json`, NA client snapshot 1.
This single file includes **all 23,586 distinct positive IDs**, not only
551 box-sourced equipment items.

The private report remains offline. The committed public dataset
contains **only** exact ID/name/source facts and strips private
client file data, source localization from other languages, original
raw material expressions and original source file paths.

## Actual public data imported in this PR

| What was read directly from the original source | Count |
| --- | ---: |
| All unique client item IDs | **23,586** |
| IDs with exactly one original official English base-name per ID | **22,702** |
| IDs with conflicting original identities | **290** |
| IDs without a resolved original official English name | **594** |
| IDs quarantined (unnamed) | **884** |
| Original source file definitions / source record IDs | **27,281** |
| Unique reviewed equipment IDs retained | **551** |
| Distinct source category labels in public index | **84** |
| English names reused across multiple distinct client IDs | **293** |
| Public JSON index shards | **6** |
| Public on-demand detail shards | **30** |
| Total public JSON files, including manifest | **37** |

The 22,702 English names are **unique per item ID**, not globally
unique strings. Some names (for example *Immortal Bow*) are shared by
multiple distinct item IDs. Those IDs remain distinct, never
automatically merged or marked interchangeable.

The 884 quarantined IDs are included in the searchable index with
their actual **numeric IDs and identity states only**. No English
names or original source definitions are silently assigned to them.
The private report includes a local list for later review.

Every other named item may have a source detail record with:
- exact original client ID, file basename and source record ID;
- general/specific source role and original source category;
- raw source level, grade, workload and unit (when present);
- material ID × quantity from genuinely parsed source records;
- source-file record groupings, *not proven gameplay variants*.

For all 22,702 named IDs the details are lazy-loaded from a small
bucket by `floor(itemID/1000)`. The initial search loads only
six compact index shards; the browser renders up to 100 rows per
page instead of injecting ~23,000 rows into the DOM.

The entire index and details were **generated and committed in this
PR directly from the exact original user-provided source**. No
rerun or upload is required for these 23,586 IDs.

## Bilingual user interface

- English: `/items/database/`
- PT-BR: `/pt-br/items/database/`
- Shareable detailed link: `/items/database/?id=24120`

Capabilities: English-name/ID search; original source-category and
identity-status filters; sorting by name, ID, and raw level;
100-row pagination; original source file details on demand, with
material IDs linked to other named source entries.
The existing 551 equipment profiles link to the full database;
their prior pages, +0..+10 tables, fixed MagicDef/EV/MoveSpeed,
and original reviewed stats are not replaced.

The UI constructs safe DOM text nodes via `textContent`, not
`innerHTML`. Item data are never interpreted as code or HTML.

## Stage 20.31 — Extending combat data to newly indexed equipment

The original full *catalog* report does not contain
the **combat attributes for the 22,151 newly named IDs**;
it records source general/specific metadata instead.
A full numeric `Items.csv` extraction requires the original
local Miner SQLite. The older 551 equipment already have
exact client-source stats and +0..+10 historical-model projections.

The PR includes **`scripts/export-full-client-stats.py`** to
prepare the next source-approved candidate in read-only mode.

From the repo root after merging this PR:

```powershell
git pull origin main

py scripts/export-full-client-stats.py "D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3"
```

The script:
1. validates the six public item index shards and snapshot 1;
2. opens SQLite with `mode=ro`, `PRAGMA query_only=ON`;
3. streams source `reference_rows` where `dataset='Items.csv'`;
4. matches numeric `Unique` **and exact** `EnglishName`
   against each published source identity;
5. quarantines every source-ID with conflicting English names;
6. exports an allowlist of actual numeric fields (attack min/max,
   physical AC, STR/DEX/VIT/Mag, MagicDef, EV, MoveSpeed, etc.) preserving
   the original source row IDs, exact source strings and missing fields;
7. writes a PRIVATE aggregate report and a separate public CANDIDATE,
   **without copying either automatically to the deployed site**.

Outputs (on the user's machine):
- `Miner_AllStats_Report_20_31.json`: aggregate coverage and
  source-conflict counts; no English names, private paths or values;
- `Miner_AllStats_PublicCandidate_20_31/manifest.json` and ID-bucketed
  `NN.json` files: only reviewed candidate raw numeric values and
  original source row numbers.

The full database UI already supports these optional stats shards
when explicitly published under
`public/data/client-items/stats/` in a later audited PR.

When available, equipment-like source categories may present a
+0..+10 table through the **same historical model**:
attack/physical AC/basic integer attributes project with the
research-derived factors; **MagicDef, EV, MoveSpeed remain exactly
unchanged** at all 11 grades. The original fractional Mag values
appear only at +0. No L row is inferred. Books, event boxes, packs,
other consumables and unknown-category items do NOT get an
automatic enhancement progression simply because a client ID exists.

Do not copy the candidate output into `public/data/client-items/stats/`
before reviewing the aggregate report and identity exclusions.
A name match alone does not certify current acquisition,
craftability, in-game tooltip stats, enhancement eligibility
or Legendary L availability.

## Validation

`tests/full-client-item-database.test.mjs` checks all six shards,
all 23,586 source IDs, 884 quarantined identities, 22,702 named
IDs, 27,281 total original source records, every exact old 551
equipment identity, 30 named source detail files, material record
IDs and non-HTML UI presentation.

`tests/test_export_full_client_stats.py` uses a synthetic
read-only SQLite fixture to verify original numeric values,
name-collision quarantine, malformed numeric exclusion and
private field non-publication.

No original private Miner source file is added to GitHub.
