# Stage 20.36 — Item crafting navigation and reverse recipe graph

The existing full client item database is the authoritative list for this
feature: 23,586 original source IDs; 22,702 named/reconciled IDs; 884
unresolved/collision IDs. **Only source-backed decoded ingredient lists**
are used. No Wikidot page is scraped to fill missing game data.

## New capabilities

- The reviewed 551 equipment profiles now link the **exact material ID**
  in each ItemType*.ndt source recipe to a universal client ID detail view.
- The main /items/database/?id=ID and /pt-br/items/database/?id=ID
  routes remain accessible for all 23,586 original IDs.
- Every named item detail can now show **Used in crafting**, the reverse
  list of product items consuming that item's original material ID.
- The original reviewed equipment item pages also show **Used in
  crafting**, using a lazily fetched per-material bucket.
- Links work by original numeric ID, avoiding false unique-name joins
  when multiple item IDs have identical English names.
- Repeated general/specific definition rows are de-duplicated ONLY if
  the material ID and quantity lists are identical, and their original
  source record IDs remain listed in the links.
- If the same item product has conflicting ingredient lists or quantities,
  both source variants remain visible independently. No arbitrary recipe
  is selected as the live-server truth.
- Zero reverse links means "no parsed usage in this snapshot", not
  "the item is never used".

## Build process

The Node script scripts/generate-client-craft-links.mjs reads the 30
published public/data/client-items/details/NN.json shards and six
original all-ID index shards, validates identity/source structure, builds
the reverse mapping and writes small static JSON shards under
public/data/client-items/crafting/used-by-NN.json.

The recipe backlink output is **derived on demand** before Astro dev and
the production build, is ignored by Git, and is not a private miner export.
Its manifest includes measured coverage counts and output filenames;
the exact originals in committed details/ remain unchanged.

Commands: npm run generate:craft-links, npm run dev, npm run build.

Build/dev run the generator automatically (predev, prebuild).

## Evidence and editorial constraints

- Original ingredients/quantities: extracted and parsed ItemType*.ndt.
- Original source definitions supply file name, source row ID,
  material status, work/unit, category, original grade/level.
- Groupings represent source-file groupings, NOT independently
  verified gameplay variants.
- An item material may have no reconciled name. Show the literal
  original ID and quarantine name instead of guessing.
- A recipe reference does not establish current game availability,
  where to obtain the item, item drop rate, or whether a player can
  actually craft it on the live server.

## Next stage: monster origins

The older offline miner's actual direct/group drop tables will be
published **only after** the original tables are available and
revalidated, with CharID, GroupID, ItemID reconciliation and
raw-rate interpretation kept distinct from proven probabilities.
No monster or drop associations are fabricated here.

Tests include tests/client-craft-graph.test.mjs with full 23,586-ID
identity and original-source preservation checks.
