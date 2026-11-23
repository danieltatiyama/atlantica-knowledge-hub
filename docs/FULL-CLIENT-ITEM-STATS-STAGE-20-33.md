# Stage 20.33 — publish the audited all-ID raw numeric candidate

## User-supplied evidence

The provided Windows ZIP contains the ORIGINAL exported Stage 20.31
public-candidate shards and manifest, all from Miner snapshot 1.

- Source rows inspected: **27,281**; invalid JSON: 0; invalid item IDs: 0.
- Candidate: **7,560 named IDs** and **9,351 original source rows**.
- Numeric field occurrences: **71,606**, in 15 source fields.
- The ZIP contains **28 numeric source shards plus one manifest**.
- The original **551 reviewed equipment IDs** are all present.
- All **1,031** previously reviewed equipment source rows, across 9,819
  comparable numeric field occurrences, are exact matches in the ZIP,
  excluding separately reviewed MoveSpeed values.
- Additional IDs with raw source attributes: **7,009**.
- Quarantined English identities and nonnumeric source records remain
  excluded; item IDs never merge just because English names match.

This evidence is from the original game CLIENT, not measurements taken
from the live server. Source categories do NOT confer enhancement,
crafting, trading, acquisition, or equippability guarantees.

## Ready-for-publication boundary

The existing full database index contains **23,586 IDs**, of which
**22,702** have reconciled original English names. This stage adds
read-only, optional, stat shards only for approved IDs with explicit
allowlisted numeric source fields.

The full database browser now shows the exact raw numeric values for
ANY named item with a published stats record (including non-equipment
items). Original zero is distinguishable from absent fields.

The +0..+10 table is rendered ONLY on source categories resembling
equipment, and is explicitly labeled as a historical mathematical
projection, NOT game-server-verified values. Attack, AC and integer
base attributes are projected; MagicDef/EV/MoveSpeed stay exactly
unchanged; fractional or unsupported fields are not scaled. No
Legendary L row or current enhanceability is inferred.

The existing 551 reviewed equipment pages and source facts remain
unchanged.

## One-time Windows import and PR update

This code-review PR intentionally does **not** contain the uploaded
candidate data yet. The ZIP exists only in the user's ChatGPT/local
machine, not on the GitHub connector. Publishing is deliberately
separate from validating source code.

1. Download the ZIP from the current conversation onto Windows.
2. In the repository checkout, get the existing publication PR branch:

       git fetch origin
       git switch --track origin/feat/full-client-stats-publication-20-33

   If the branch already exists locally, use:

       git switch feat/full-client-stats-publication-20-33

3. Run the importer, pointing it to the ZIP downloaded on Windows:

       py scripts/import-full-client-stats.py "C:\path\Miner_AllStats_PublicCandidate_20_31.zip" --dry-run

   If clean, run without --dry-run:

       py scripts/import-full-client-stats.py "C:\path\Miner_AllStats_PublicCandidate_20_31.zip"

4. Confirm the new staging directory contains ONLY the 28 named
   bucket files and manifest, and run both independent guards:

       py scripts/validate-full-client-stats.py --candidate public/data/client-items/stats
       py scripts/verify-full-client-reviewed-stats.py --candidate public/data/client-items/stats

5. Commit ONLY the audited public data to the existing PR branch:

       git add public/data/client-items/stats
       git commit -m "data(items): publish audited 7560-ID raw client source stats"
       git push origin feat/full-client-stats-publication-20-33

The existing draft pull request updates automatically. Check GitHub
Actions before marking it ready and merging.

## Security and compatibility

- The source ZIP is treated as untrusted. It is confined to the known
  folder/file names, rejects traversal, encrypted files, symlinks,
  duplicate entries and excessive ZIP sizes.
- The importer only writes files to public/data/client-items/stats
  AFTER the full-index ID/status and aggregate validation succeeds
  and ALL reviewed source rows match exactly.
- The importer refuses to overwrite existing public stats files.
  An explicit dry run never changes the deployed folder.
- The importer never executes ZIP contents, modifies the original
  SQLite Miner source, makes commits, opens PRs or pushes branches.
- The CI suite fails closed if published shard identities, numeric
  strings, source row numbers, field occurrence counts, aggregate
  counts or preserved reviewed equipment fields change.
- The local ZIP/folder and unrestricted Miner raw sources are ignored
  at the repository root and must not be added to Git.

## Scope of this code-only PR

Code, tests, original-source comparison and safe local ZIP ingestion
are ready. The additional public shards are NOT yet committed.
The only remaining publication action is importing the already
provided ZIP into the PR branch and pushing the audited 29 JSON
files, without uploading any private SQLite database.
