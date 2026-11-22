# Atlantica Knowledge Hub — Game Data Integration (Stage 9.1)

## Separation of responsibilities

The **Atlantica Data Miner** reads/decrypts/parses the local game client and maintains its own SQLite database and exports. The **Knowledge Hub** only consumes a reviewed, normalized data contract. Do not commit raw game files, decrypted client files, full databases, private source paths, or unreviewed exports to the public Wiki repository.

Pipeline:

`Game Client → Data Miner → SQLite → staging JSON → validation → curated public JSON → Astro`.

Stage 9.1 implements **only the validator and the proposed contract**. It does not read the Miner's SQLite database, convert its v0.7 outputs, or publish a dataset. We must inspect a real v0.7 sample before writing an adapter.

## Contract v1.0

Each file contains one dataset and one source snapshot:

```json
{
  "schemaVersion": "1.0",
  "dataset": "items",
  "snapshot": {
    "id": "a-distinct-snapshot-name",
    "game": "Atlantica Online Global",
    "minerVersion": "0.7",
    "exportedAt": "2026-11-21T00:00:00Z"
  },
  "records": [
    {
      "id": "item-id-as-text",
      "names": { "en": "Name only if directly verified" },
      "fields": {},
      "evidence": {
        "status": "Extracted",
        "sources": ["Item/Data/RelativeFile.ndt"]
      }
    }
  ]
}
```

Fields under `fields` are intentionally not specified yet: their real names and types must come from an inspected Miner export. Missing name translations use `{}` rather than guessed names. Preserve IDs as strings to avoid precision or formatting loss. `snapshot.minerVersion` is a producer version and is distinct from `schemaVersion`.

## Evidence levels

- `Verified`: independently confirmed information.
- `Extracted`: observed in client files; not necessarily independently confirmed in gameplay.
- `Experimental`: inference, formulas, or a model that still requires testing.
- `Unverified`: unresolved or incomplete findings.
- `Private`: data that must never enter the public export.

The normal validation accepts all five labels for staging review. The `--public` gate **currently accepts only Verified and Extracted**. Other statuses are blocked, not silently discarded. We may later permit clearly labeled experimental data when the UI can distinguish it.

## Local commands

From the repository root after copying this kit:

```powershell
node --test .\tests\validate-game-dataset.test.mjs
node .\scripts\validate-game-dataset.mjs .\tests\fixtures\game-data-synthetic.json
node .\scripts\validate-game-dataset.mjs .\tests\fixtures\game-data-synthetic.json --public
```

The fixture is synthetic and is **not** Atlantica game data. No script writes, publishes, or modifies the repository.

## Planned next stages

- **9.2:** inspect a genuine v0.7 export and write a deterministic adapter for the first dataset (`items` is the proposed pilot).
- **9.3:** validate source identifiers, translations, relationships, provenance and data completeness.
- **9.4:** publish curated subsets with Astro's static build / content loader; no raw SQLite or client files on Cloudflare.
- **9.5:** item browsing and search UI with evidence labels and source version.
- **9.6:** expand to skills, crafting recipes, events; keep inferred combat formulas isolated from verified game data.

Before merging 9.1 into `main`, run the tests and Astro build. Commit only `scripts/validate-game-dataset.mjs`, `tests/validate-game-dataset.test.mjs`, `tests/fixtures/game-data-synthetic.json`, and `docs/GAME-DATA-INTEGRATION.md`.
