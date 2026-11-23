# Stage 20.65 — Real client NPC trade prices (2026-11-23)

## Outcome

The player ran our Stage 20.64 **read-only** extractor against their installed Atlantica Global client, generating real reports from `LANG/ENG/NPCTRADEITEM/NPCTradeItem_ENG.ndt`. Both generated files are now archived in this repository under `research/market-fixed-prices/`.

| Measure | Exact result |
|---|---:|
| Parsed and retained client-source rows | **652** |
| General NPC catalog records | **421** |
| Housing catalog records | **231** |
| Named current client ItemIDs | **425** |
| Ambiguous/collision identities | **227** |
| General catalog entries with confirmed English client names | **421** |
| Named housing catalog entries | **4** |
| Invalid source rows | **0** |
| Duplicate or conflicting item/catalog pairs | **0** |
| Gold Thread, Colorful Thread, Rice, Mana Potion [II] independent examples | **4/4 match** |
| Historical fixed-price reference ItemIDs (Stage 20.63) matching general client prices | **293/293 match** |
| General client prices outside that mapped historical comparison | **128** |

The full real client CSV and audit are:

- [client-npc-trade-2026-11-23.csv](client-npc-trade-2026-11-23.csv)
- [client-npc-trade-2026-11-23-audit.json](client-npc-trade-2026-11-23-audit.json)

The source scan occurred on **2026-11-23 at 20:41:35 UTC**. The original client game build/version was **not established** by this source, so it must not be assigned the Jana4U 2025 version. The file metadata contains no account identifiers or user-specific game paths.

### Concrete examples

| Client ItemID | Name | General NPC catalog unit price |
|---|---|---:|
| 7070 | Gold Thread | 3,000 gold |
| 7081 | Colorful Thread | 10,000 gold |
| 3000 | Rice | 100 gold |
| 2080 | Mana Potion [II] | 8,000 gold |
| 7044 | Colorful Fabric | 50,000 gold |

**Important distinction:** exact client table prices, including agreement with all 293 mapped 2025 `fixed_price` references, are compelling evidence of a **shared price source**, but they are **not proof** of live permanent fixed Market offers or live NPC shop availability. The original file is an NPC trade table, and its two catalogs have different meanings. The source may contain historical/discontinued items.

The 227 ambiguous/collision identities are concentrated in the **housing** catalog. These are preserved with source ItemIDs in the research CSV, not silently assigned English names or promoted to general market listings. Of 231 housing entries, only four map to a named current client ItemID.

## Public, clearly labeled client-source reference

The following source-only assets contain **only the 421 named general NPC trade prices**:

- `public/data/client-npc-trade-prices/manifest.json` — source provenance, validation counts, `marketFixedPriceVerified:false`
- `public/data/client-npc-trade-prices/general.json` — compact `[itemId,unitGoldPrice,sourceRowNumber]` records, with ItemIDs stored as strings.

The housing table remains research-only (the full CSV) and is not suggested as current general Market prices.

## Crafting Calculator: user-controlled reference only

In the Crafting Calculator's Shopping List:

1. **Show client references / Ver referências do cliente** loads the 421-entry dataset from our own Wiki. It displays per-material `NPC reference: X gold` hints but **does not change any prices or cost estimates**.
2. **Use / Usar** next to an empty price field explicitly copies that NPC reference into the current input.
3. **Fill only empty prices / Preencher somente preços vazios** is a separate explicit action; it only fills the current recipe's blank material prices. **Existing user prices are never overwritten**, including zero.
4. Source attribution (`client-npc-catalog` vs manual entry) is saved locally along with the numeric prices and included in the exported Excel Shopping List. Any subsequent manual edit removes the NPC attribution.
5. Without clicking these controls, the Calculator's existing behavior is unchanged. No historical prices are silently applied.

**Neither the UI nor the XLSX calls NPC references verified fixed Market prices.**

## QA

- `tests/client-npc-trade-prices-stage-20-65.test.mjs` independently parses both research CSVs, validates the exact 652/421/231 distribution, proves all 293 historical comparisons by ItemID, checks the four in-game examples, rejects malformed source catalogs, and enforces opt-in/no-overwrite semantics.
- Prior Stage 20.63 and Stage 20.64 tests stay active.
- CI validates the entire Astro build and previous crafting suites.

Run from Wiki root:

```bash
node --test tests/client-npc-trade-prices-stage-20-65.test.mjs
npm run build
```

## Remaining investigation

1. Verify specific permanent fixed-price Market listings in game for a sample of the **128 newly available** general client prices, especially prices not represented in Jana4U 2025.
2. Find whether a **second server-side table** provides additional fixed Market listings not covered by the NPCTradeItem general catalog.
3. Do not infer that the game's Market has only 421 permanent-price items: this file describes 421 *general NPC trade records*, not exhaustive live fixed Market inventory.
4. Treat user-supplied overrides or live screenshots as a distinct, stronger source where verified. Preserve any mismatches with the client file and do not overwrite either original.
