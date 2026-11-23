# Stage 20.39 — Atlantica-inspired item information + crafting batch

## Scope

The user's original in-game screenshot is a visual reference for the
item header. Both the original 551 reviewed profiles and all 1,911 new
equipment-like client-source profiles render a dark charcoal,
aged-metal and gold-trimmed information panel above their detailed
wiki documentation. This is CSS only: NO extracted icon assets,
screenshots, visual claims, or fake rarity/tier markings.

The panel is clearly labelled CLIENT SOURCE and shows exact
source-backed name, ItemID, category, level/grade, source record
count, all available 15 allowlisted numeric stats, and explicit
partial/conflict source values. The previous long-form stats, craft,
original file provenance, acquisition and backlinks remain in place.

## Original Unit versus gameplay output limit

The previous reverse crafting graph and named source detail files
already contain raw ItemType Unit values (s[N][7]), when provided.
Stage 20.39 turns this recorded field into a normalized data API:
src/data/client-craft-batch.mjs

The original field is **not guaranteed craftability** on today's
server. If several source files disagree, a canonical batch is NOT
invented. If only some source records provide Unit, status is
'partial'. Missing Unit does NOT silently default to one.

User-reported gameplay rules are modelled separately:

- One craft produces a multiple of the item-specific **batchSize**.
- The smallest legal output is one batch.
- Amounts increase in multiples of batchSize.
- One craft operation is capped at **10,000** output units.
- The real maximum aligned output per operation is
  floor(10000/batchSize) * batchSize, so batch=300 allows 9900.
- The future calculator can split a larger request into operations
  and rounds desired output UP to the next whole batch.
- No client-source recipe is automatically considered confirmed
  available on the current game server.

## Audited Abyssal Oriharukon example

- Client item ID: **4819**; name: Abyssal Oriharukon; category Stone.
- Exact ItemTypeStone.ndt original source row **#118506**.
- unitRaw / candidate batchSize = **500**.
- Original source recipe: item **8494 × 1** and
  Oriharukon **20339 × 1,000**.
- Minimum 500, step 500, maximum 10,000 in 20 batches per operation.
- 501 requested output units therefore requires 1,000 production
  units. 10,501 requested requires 11,000 output across two
  legal operations (10,000 + 1,000).
- This **does not** prove the recipe is enabled on the current server.
  The 10,000 cap is explicitly user-reported, not present in unitRaw.

## Integration

- Equipment-style tooltip panel on all 2,462 equipment-like pages.
- Batch information displayed in both reviewed and source-only
  recipe sections.
- Batch information also displayed in the full 23,586-ID source
  database item detail view; therefore ordinary materials such as
  Abyssal Oriharukon are NOT restricted to equipment categories.
- English and pt-br text included.

## Tests

tests/client-craft-batch.test.mjs validates the exact original
Abyssal Oriharukon Unit 500 source, all raw recipe fields,
10000 cap, multi-operation rounding, missing/partial/conflict
handling, invalid values and integration in all item views.
Original 551 reviewed profile material tables remain unchanged.
