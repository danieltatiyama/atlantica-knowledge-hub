# Stage 20.34 — Publish verified source numeric stats

This data-only PR must include exactly the 29 original JSON files
extracted by the read-only Stage 20.31 client Miner exporter.

## Why this PR exists

The Stage 20.33 code PR (#50) was merged before its optional numeric
stats folder was added. Therefore the searchable 23,586-ID database
and the new 551-equipment preservation guards are on main, while the
7,560-ID source numeric stats have not yet been published.

## Required data files

Commit only these original verified files under:
`public/data/client-items/stats/`

- `manifest.json`
- 28 exact two-digit `NN.json` shards named by the manifest

Do not commit the ZIP, private SQLite database, additional extracted
client fields, or local machine paths.

## Local steps

```powershell
git fetch origin
git switch --track origin/data/full-client-stats-20-34

py scripts/import-full-client-stats.py ".\Miner_AllStats_PublicCandidate_20_31.zip" --dry-run
py scripts/import-full-client-stats.py ".\Miner_AllStats_PublicCandidate_20_31.zip"

py scripts/validate-full-client-stats.py --candidate public/data/client-items/stats
py scripts/verify-full-client-reviewed-stats.py --candidate public/data/client-items/stats
py scripts/verify-full-client-source-hashes.py --candidate public/data/client-items/stats

git add public/data/client-items/stats
git commit -m "data(items): publish 7560 audited source stat IDs"
git push origin data/full-client-stats-20-34
```

If the data branch already exists locally, use
`git switch data/full-client-stats-20-34` instead of `--track`.
The ZIP path must point to the local original ZIP; the sample above
assumes it was placed in the repository root.

The importer refuses to replace an existing stats directory. Its
three independent gates verify the aggregate/identity allowlist,
the immutable 551 previously reviewed equipment records, and all
29 original SHA-256 hashes. GitHub Actions runs these validations
again after the data files are pushed. Keep this PR in draft until
CI passes with the actual stat files present.

These are client-source raw numeric fields, not measured 2026 Global
server outcomes or guarantees of upgrade eligibility. A historical
+0..+10 estimate for equipment-like categories is not a verified
enhancement formula.
