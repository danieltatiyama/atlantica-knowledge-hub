# Stage 20.41 — Atlantica-styled bestiary and item-to-monster discovery

The original **53 SHA-approved client source JSONs** from Stage 20.40
remain unmodified. The additional discovery index is deterministic,
generated from those originals and the 23,586-ID client item registry.

## Features

- A new **bestiary-style** page header with dark steel/blue background,
  aged-bronze trim, restrained gold ornamental details, and the original
  4,351-character / 9,959-direct-rows / 893-drop-item coverage numbers;
- A dedicated **Loot Codex** on `/monsters/` and `/pt-br/monsters/`.
  Search by exact ItemID or original English item name, filter by direct
  or grouped references, then follow the associated creature IDs;
- Share `/monsters/?item=20900` to open the source-drop evidence for
  Spirit Equipment Box. The existing `?id=201` creature deep link is
  still supported for Tainted Unicorn;
- Every source material on reviewed equipment recipes (551 original
  articles) and the other 1,911 source-equipment pages now has an
  additional link to its exact ItemID in the Loot Codex;
- The all-item explorer and the individual equipment source-drop
  sections likewise link back to the same ItemID;
- Original source-link rows remain separate for **direct drops** and
  **derived grouped references**. Large grouped tables show only 50
  additional entries per click;
- The source-only item acquisition copy now acknowledges that the
  November Miner drops were actually published, while still clearly
  disclaiming any current-server availability;
- Existing creature list, CharID search, original file/row traceability,
  and historical craft batch logic remain unchanged.

## Generated lookup

Run `npm run generate:monster-item-lookup` or simply `npm run dev` /
`npm run build`. The predev/prebuild scripts now regenerate

    public/data/client-monster-discovery/item-lookup.json

from the published original drop shards and the original item index.
The new lookup has exactly 893 named ItemIDs, 9,959 direct source
references and 172,120 **derived** group-reference combinations;
the source item name is always joined by numeric ID, never fuzzy
string matching. The lookup is ignored by Git and is not among the
53 SHA-approved original shards. The generator fails closed if
snapshot version, row coverage, source identity, item count, or group
fan-out disagree with audited evidence.

### What is **not** being claimed

- A source character necessarily exists as a fightable monster;
- A source drop exists or is enabled on the current server;
- Original `RawRate` or source group parameters are drop percentages;
- Joining a group reference with group item records implies a distinct
  independent drop for every join;
- A linked item can necessarily be crafted with that recipe today.

The CSS uses no copied logos, background textures, copyrighted assets
or claimed in-game screenshot elements. It is **inspired by** the
metallic/dark Atlantica interface; the actual game identity remains
in the independently verified original source names.

## Quality gates

- The immutable 53 originals still pass SHA-256 and original-source
  relation validation.
- `tests/monster-item-discovery.test.mjs` verifies coverage,
  exact original item identities, client-source disclaimers,
  bilingual navigation, 50-row pagination, and generator wiring.
- Full Astro build must pass in GitHub Actions before merging.
