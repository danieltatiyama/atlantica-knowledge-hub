# Stage 20.35 — Full-client item numeric explorer

The Full Client Item Database now exposes tools built from the original
**23,586-ID** index and the approved client-source **7,560-ID** numeric
statistics shards. Both English and Brazilian Portuguese routes are
supported:

- /items/database/
- /pt-br/items/database/

## 1. Numeric field filters

- Choose one of the exact **15 numeric source fields** from Items.csv.
- Specify optional **inclusive** raw minimum and/or maximum limits.
- Existing source category, identity, item ID/name, equipment-like toggle
  and sorting/pagination work together with the numeric filter.
- Numeric shards do not load on initial search. Only a user who chooses
  a numeric filter triggers a one-time, read-only load of 28 ~1 MB total
  shards. Original index search and page browsing stay lightweight.
- A field that is missing for an item never matches, including when the
  minimum is zero. Literal zero does match zero.
- A field with **conflicting source values** never matches a numeric
  threshold. A unique value found in only some rows may match; it is
  visibly labelled as **partial** in its item detail and CSV.
- A missing/invalid manifest, source ID not reconciled, duplicate source
  ID or incomplete source shard collection blocks the numeric filter.

## 2. Equipment-like source comparison

- Select **2 or 3** items from original equipment-like source categories
  in the 100-row paginated table, independently of any active filter.
- Comparison requests only the selected IDs' raw stat shards.
- Each field shows the original raw numeric values. A missing field shows
  a dash; a conflict shows both values; partial coverage is flagged.
- Raw spread (max minus min) appears **only** if every selected source
  record has the field, its values are consistent across that item,
  and every item can be compared numerically. Spread is not a gameplay
  ranking, nor an upgraded or legendary-stat delta.
- Source categories alone DO NOT prove current equippability, upgrade
  eligibility or existence on the game server.

## 3. Export current results as CSV

- Exports **all currently filtered IDs**, not just the visible page.
- UTF-8 BOM and locale-aware CSV delimiters: semicolon on pt-br route,
  comma on English route.
- Preserves original source ID, English name, category, level, grade,
  source definition count, identity and reviewed-equipment status.
- If a numeric field is selected, exports exact raw value(s) and status
  (consistent/partial/conflict/absent); missing is never silently zero.
- Every cell is correctly quoted; leading characters that Excel
  interprets as executable formulas are prefixed with an apostrophe.
- No server-side upload, account credentials or private file access.

## 4. Detailed item view

- Displays a structured summary for attack, defense, base attributes
  and other numeric client fields.
- **Zero values remain visible**.
- Includes original source coverage count and explicit partial/conflict
  markers rather than arbitrarily selecting a canonical value.
- An expandable audit table preserves individual Items.csv source row
  IDs, raw field keys and exact numeric source strings.
- The old **+0..+10 historical mathematical model** still appears only
  for equipment-like source categories. MoveSpeed, EV and MagicDef are
  never multiplied; none of these projected values is live-server
  verified. Legendary status is never inferred.

## Review and regression

- Original 551 reviewed equipment profiles remain unchanged.
- Stage 20.32–20.34 identity, numeric source and SHA-256 audit gates
  are unchanged and still run in CI.
- tests/full-client-stats-tools.test.mjs checks original 7,560 IDs,
  9,351 numeric records and 71,606 raw field occurrences, plus
  zero/missing/conflict isolation, range inclusivity, safe CSV
  handling, comparison gating and the public UI control structure.
- If CI is green and the new source-only interface is manually
  reviewed, this code-only PR may be merged normally.

## Follow-up opportunities (not included)

- Multi-field AND filters; compound comparisons beyond three IDs;
  locally saved filter presets; optional game-server verification.
