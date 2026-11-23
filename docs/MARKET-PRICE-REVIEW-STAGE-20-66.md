# Stage 20.66 — Market fixed-price candidate verification workbench

## What changed

This stage takes the **128 general NPCTradeItem ItemIDs that do not occur in the 293 exact historical ItemID comparisons** from Stage 20.65 and gives players an evidence collection workbench without representing them as verified live Market inventory.

The publicly available source-only file `public/data/client-npc-trade-prices/review-queue.json` contains **128** rows of `[ItemID, original English client name, client category, NPC unit price in gold, source CSV row]`. This is a strict subset of the already published 421 general client NPC prices; the 231 housing records and 227 housing collisions remain outside this review queue.

To regenerate, run:

```bash
node scripts/build-market-price-review-queue.mjs
node scripts/build-market-price-review-queue.mjs --check
node --test tests/market-price-review-stage-20-66.test.mjs
npm run build
```

The generator uses only archived immutable input files in `research/market-fixed-prices/`: `client-npc-trade-2026-11-23.csv` and `jana4u-2025-11-14-crosswalk.csv`. It enforces the 652/421/293/128 counts and exact price matches for the 293 mapped historical ItemIDs. No game files or original research CSVs are modified.

## Player-facing review workflow

- EN: `/tools/market-prices/`
- PT-BR: `/pt-br/tools/market-prices/`
- Both routes are linked from the Tools hub and support all six existing themes.
- Search by name, category or ItemID, filter pending/reviewed, and inspect the exact **client NPC reference**, clearly labeled as **not a verified fixed Market price**.
- A player can record one of four observations: **fixed listing seen at same price**, **fixed listing seen at a different price**, **fixed listing not found**, or **inconclusive**.
- The date and descriptive evidence notes (10–1,000 characters) are mandatory. Observed prices are positive integer strings, only allowed for listings seen, and must agree with the selected same/different-price state.
- Local records use `atlantica.marketPriceReview.v1` in the current browser. Users can remove records and export/import a versioned, strictly validated JSON bundle. Import explicitly prompts before replacing existing local observations.
- Exported records are player reports, not globally verified facts. They are not uploaded or incorporated into public item prices automatically. Data from the client and the existing Crafting Calculator are untouched. Browser storage can be unavailable; users should export important evidence.

## What the additional research established — and did not establish

1. A historical technical forum discussion about a private Atlantica server lists `server/LANG/ENG/NPCTRADEITEM/npctradeitem_eng.ndt` as a configuration location for fixed-price Market items. This is consistent with the client-side file already investigated, **not independent access to the current Atlantica Global server file**.
2. An official historical Atlantica/VALOFE announcement described some game-supplied fixed-price Market items as having a fixed gold amount and unlimited availability. It does **not** validate any particular 2026 ItemID, price, or current availability.
3. No second independent **current Global server-side price table** has been identified or obtained in this investigation. The 421 client NPC general entries must not be treated as exhaustive Market coverage; 128 entries are simply *unmatched to the historical crosswalk*.
4. In-game verification of individual fixed-price entries requires the player to open the current Global Market and record a dated observation, ideally with an independently reviewable screenshot. A single failure to find a listing should not be interpreted as proof of permanent unavailability.

Public historical context:
- Technical discussion: https://www.elitepvpers.com/forum/atlantica-online/4007401-release-atlantica-online-server-v3-02-11-a-27.html
- Official historical Market explanation: https://store.steampowered.com/news/posts/?appids=1232420&enddate=1586953498
- Original client evidence: `research/market-fixed-prices/CLIENT-PRICE-STAGE-20-65.md`

## Validation and next step

CI checks the reproducible queue, static EN/PT-BR routes, strict import/export parser and negative cases (forged verification claims, unknown ItemIDs, duplicate entries, bad prices/dates and missing evidence). A browser visual pass after deployment remains advisable.

**Update (Stage 20.67, 2026-11-23):** the player stated that **all 128 pending prices match the in-game Market**. This is recorded as a single aggregate player report, not per-item screenshots or independent verification. See `docs/MARKET-PRICE-PLAYER-REPORT-STAGE-20-67.md`. No need to request the same bulk confirmation again. Continue investigating possible Market prices outside the known 421 client entries without assigning guessed prices or ItemIDs.
