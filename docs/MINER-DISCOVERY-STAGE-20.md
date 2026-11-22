# Stage 20.0 — Privacy-safe Data Miner SQLite discovery

Stage 19.0 publishes 551 English-named equipment items. Stage 20
prepares a reliable bridge to the larger local Data Miner without guessing
its SQLite schema, leaking private data, or auto-publishing unreviewed rows.

## Why inspect first?

An offline Miner aggregate (2026-11-22, report 9.2.3) describes
30,421 item rows and 23,586 distinct item IDs, with duplicates.
The report does not contain all SQLite column definitions.
Stage 9.2 integration must preserve source identity and resolve duplicates
explicitly before adapting records to the v1.0 JSON contract.

## On your Windows machine

Work from a consistent copy of the SQLite database, ideally while the miner
is stopped. In PowerShell, at the Wiki repository root:

```powershell
py .\scripts\profile-miner-sqlite.py "D:\PATH\TO\atlantica.sqlite3" --output ".\Miner_Schema_20.json"
```

Replace the database path with your actual local path. The script opens
SQLite in read-only mode and runs schema-only introspection. It does NOT
SELECT or dump table rows, copy source files, export SQL bodies, or expose
absolute local paths in the output. Review the resulting JSON before sharing.

```powershell
py -m unittest discover -s .\tests -p "test_profile_miner_sqlite.py" -v
```

## Expected review output

- Database filename only, no parent directory
- SQLite version
- List of tables and views
- For each object: column name, declared type, NOT NULL, primary key
  ordinal and SQLite hidden/generated flag
- No row contents, raw game-client files, passwords or network capture data

## Stage 20.1 — after schema review

1. Choose the exact item source tables and identifier columns.
2. Document name localization joins (Unique / NameTextNum).
3. Define a deterministic source-aware duplicate-ID policy.
4. Build a local-only adapter exporting the reviewed v1.0 staging JSON.
5. Run the existing `scripts/validate-game-dataset.mjs` validator
   and public review gate before publishing to Astro.

Never commit the actual SQLite, private paths, decrypted files,
session traces or unreviewed full exports. Do not infer item attributes,
drop chances or availability from file presence alone.
