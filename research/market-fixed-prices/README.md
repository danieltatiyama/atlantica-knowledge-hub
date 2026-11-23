# Atlantica Online — Fixed Market Price Research (Stage 20.63)

This folder is **research data, NOT a live-server market price feed**.

## Dataset

`jana4u-2025-11-14-crosswalk.csv` is a fixed-price snapshot combined with a strictly exact-name crosswalk against the Wiki's independent English item catalog.

| Source / mapping | Entries |
|---|---:|
| Jana4U `data/items.yml` with numeric `fixed_price` | 1,016 |
| Exact unique name matches to the NA client item catalog (of 23,586 IDs) | 292 |
| Jana4U entries not matched to a unique current client name | 724 |
| Player-reported addition not in Jana4U: Rice #3000 = 100 gold | 1 |
| Total CSV records | **1,017** |
| Total records with a known client ItemID | **293** |

**Snapshot provenance:**
- Jana4U: <https://github.com/jana4u/atlantica_online_craft_calculator/blob/master/data/items.yml>
- Metadata: <https://github.com/jana4u/atlantica_online_craft_calculator/blob/master/data/info.yml> — `updated_on: 2025-11-14`, `game_version: 462580`
- Original project: Jana Dvořáková (Jana4U), distributed under the MIT License. Attribution and license remain with the original source.
- Crosswalk: this Wiki's `public/data/client-items/index-*.json` and `public/data/client-items/manifest.json` in November 2026, using the exact original English name (case-insensitive) with a unique known ItemID.
- Rice: player-reported current example (2026-11-23) and independently matched to client ItemID #3000; **not** a claim from Jana4U.
- `fixed_price_gold` means a claimed game-supplied **fixed Market unit price**, not market-traded price, crafting cost, NPC shop price, nor minimum selling price.

## Key examples

| Item | Client ID | Fixed price (gold) | Evidence |
|---|---:|---:|---|
| Gold Thread | 7070 | 3,000 | Jana4U + player example |
| Colorful Thread | 7081 | 10,000 | Jana4U + player example |
| Mana Potion [II] | 2080 | 8,000 | Jana4U + player example |
| Rice | 3000 | 100 | Player example only |
| Colorful Fabric | 7044 | 50,000 | Jana4U (distinct from Colorful Thread) |

**Coverage limitation:** The 724 unmatched items could be missing from this source snapshot, renamed, historical, omitted from extracted client index or formatted differently. They were **not** assigned guessed IDs or removed from the catalog. Exact-name matches are evidence of identity only; they do not prove the 2025 price still applies or that the item is currently on the fixed-price Market.

## CSV column guide

- `item_name` — original item name from source (or player report).
- `client_item_id` — matched client ID, blank if unavailable; never guessed.
- `client_category` — the independent client category if matched.
- `fixed_price_gold` — reported price for **one unit**, not per crafting batch.
- `price_source` — `Jana4U` or `player-reported`.
- `source_snapshot_date`, `source_game_version` — provenance of evidence.
- `client_name_match_status` — `exact-name-match`, `not-matched`, or `user-supplied-exact-name`.
- `source_url` — original public source for Jana4U entries.

## When to integrate into the Crafting Calculator

Do **not** default all existing price fields to these historical values without user confirmation. Safe integration would:
1. Use ItemIDs as keys only for the 293 exact/user matched items, while keeping unmatched names in research.
2. Distinguish `historical/reference fixed price`, `current Market-verified fixed price`, `player override`, and `unknown`.
3. Prefer player-defined current prices over historical references, and keep manual entry available.
4. Never treat absence from this file as proof the item has no fixed Market price.
5. Allow per-item verification from the current 2026 Atlantica Global in-game Market interface or authoritative current client/server data.

The goal is an auditable catalog for further investigation, **not a false claim that we have every fixed-price item currently available in the game**.
