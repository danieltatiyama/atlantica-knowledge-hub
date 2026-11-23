# Stage 20.64 — Investigation of NPC trade and fixed Market prices

## Evidence

Two independent public references point toward a client/server pricing table:

- [Atlantica Codex — build-shop.mjs](https://github.com/neuronet77/atlantica_online_codex/blob/master/etl/build-shop.mjs) reads the **client** file LANG/ENG/NPCTRADEITEM/NPCTradeItem_ENG.ndt and interprets its columns as **Unique (ItemID), Param, Korean item name, Price**. Param=0 is general-shop catalog; Param=1 is housing catalog. These are **NPC catalog prices**.
- A [2017 technical discussion](https://www.elitepvpers.com/forum/atlantica-online/4007401-release-atlantica-online-server-v3-02-11-a-27.html) describes a **server-side** file with the same name and a fixed-market-price example. This suggests a possible link but does not prove current Global servers use it for the same mechanic.
- The [Jana4U historical snapshot](https://github.com/jana4u/atlantica_online_craft_calculator/blob/master/data/items.yml) from 2025-11-14 has 1,016 fixed prices. Our Stage 20.63 CSV has 292 directly linked ItemIDs plus player-reported Rice #3000.

**Critical distinction:** shop price and permanent fixed Market price must remain separate until independently validated. A match is encouraging but is NOT proof of equivalence.

## Offline, read-only client extraction

New script: **scripts/export-client-trade-prices.py**. No external Python packages, server connections, credential access, modification of game files, or automatic website changes.

Run from the cloned Wiki repository root (after git pull origin main):

> py scripts/export-client-trade-prices.py --game-root "D:\Your\Actual\AtlanticaGameFolder"

The path should point to the game's installed root with a LANG folder. Alternatively:

> py scripts/export-client-trade-prices.py --input "D:\...\LANG\ENG\NPCTRADEITEM\NPCTradeItem_ENG.ndt"

Or, if your data was already decoded:

> py scripts/export-client-trade-prices.py --decoded "D:\...\NPCTradeItem_ENG.txt"

Default output directory: **client-fixed-price-investigation/**. The files are:

- **npc-trade-price-candidate.csv**: ItemID, currently published English client name/category if resolvable, original general/housing catalog, unit gold price, source line, explicit *market_fixed_price_verified=false*.
- **npc-trade-price-audit.json**: extraction counts, malformed and duplicate rows, named coverage, four example price checks, and a crosscheck against the **293** previously mapped historical price entries.

Original Korean names, raw NDT bytes, absolute installation paths and unrelated user/game data are **not exported**. The code accepts NDT v1/v3 encrypted formats and already decoded UTF-8 or UTF-16 (BOM) text. Unknown source formats are rejected rather than guessed. Conflicting duplicate prices for one ItemID+catalog are quarantined. Files already at the destination are protected unless --overwrite is specified.

## Four game examples for validation

| Client ItemID | Name | Player-reported fixed Market price |
|---|---|---:|
| 7070 | Gold Thread | 3,000 |
| 7081 | Colorful Thread | 10,000 |
| 3000 | Rice | 100 |
| 2080 | Mana Potion [II] | 8,000 |

Every comparison uses the **general** catalog rather than housing.

Additional analysis compares all **293** previously linked historical ItemIDs with the local general shop catalog, counting matches, mismatches, and missing. The report explicitly treats the older snapshot as historical.

If the four examples match, the local file is a **credible candidate** for part of the fixed Market price system, subject to in-game confirmation. If not, preserve it as an independently interesting NPC price table; do not overwrite fixed Market research.

Neither a complete four-example match nor an exact historical match proves that *all* items in the source are currently offered at fixed Market prices.

## Expected next input

Share the **two local output files**, not the original game archive or the user's whole client. Those reports will let us check actual 2026 price coverage, name resolution and price mismatches before making any public claim or enabling default prices in the Crafting Calculator.

The client source itself is not available to the assistant's GitHub-only environment. Automated tests verify parsing, decryption, ID matching, failures and safe outputs on synthetic fixtures; **live in-game validation remains pending**.

## Regressions

Run from the repository root:

> py -m unittest discover -s tests -p "test_export_client_trade_prices.py" -v

Tests include synthetic encrypted NDT v1 and v3 fixtures; no copyrighted client assets are committed.
