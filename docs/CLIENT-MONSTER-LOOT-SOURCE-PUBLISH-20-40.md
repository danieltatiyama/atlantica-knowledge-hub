# Stage 20.40 — Approved original monster + item drop source publication

The complete user-uploaded original Miner candidate was independently
examined and cross-checked before this change.

## Source audit: 23 November 2026

Original source upload:
`Miner_MonsterLoot_PublicCandidate_20_38.zip`

- Source ZIP SHA-256:
  `dd02a5d0c75653bf815a5a2549247e2549d0fb5f67142e16baa5601dcbfe846d`
- 53 original JSON files, 14.78 MB uncompressed.
- All ZIP members have relative paths, JSON contents, one terminal CRLF,
  no internal newlines, duplicate names, symlinks or encrypted data.
- No email addresses, local Windows absolute paths, HTML tags or
  credentials were detected in the inspected payload.
- 4,351 original character IDs, with 4,350 unambiguous English names.
  The original Miner auxiliary monster table was empty for this export.
- 9,959 original direct item-drop rows.
- 5,784 original character-to-group references.
- 3,076 original grouped item rows.
- 572 original group-band rows.
- 149 unique GroupIDs (26 groups not referenced by any character).
- 893 original ItemIDs with a direct or grouped source reference, all
  recognized as named in the original item index by the exporter.
- 172,120 **derived** item-to-monster group joins. These are NOT
  independent empirical drops or verified percentage measurements.
- Independently reconstructed all direct/item and group/item reverse
  joins with exact original row IDs and all original source counts.

A verified portable ZIP with forward slash paths and exactly the
original JSON bytes was produced from this upload:

`Miner_MonsterLoot_Verified_20_40.zip`

**Not a new source snapshot.** ZIP file container SHA-256 changes with
path normalization; JSON member bytes remain unchanged. All source
JSONs are pinned by one cryptographic aggregate hash, calculated in
lexical relative filename order as:

    sha256(concat(utf8(relative_posix_filename) + NUL + original_bytes))

Aggregate original JSON SHA-256:
`d202d71798e45053217fbeaf71a72a4c7af3a1a01343b2bb58fe55f6717bc72b`

The verifier reconstructs ONLY the single terminal CRLF if Git
converted it to LF. Other modifications fail approval. The pin is
under `docs/MonsterLoot_ApprovedSHA256_20_40.json`.

## Publishing original JSON files

The reviewed original JSON payload is NOT in this staging code commit.
It must be added on the same branch before merging this PR.

### From PowerShell in the local Wiki checkout

Use the reviewed ZIP at any convenient path (absolute path recommended).

```powershell
git fetch origin
git switch --track origin/data/monster-loot-original-20-40

# Change this only to the location where you saved the verified ZIP.
$zip = "D:\Downloads\Miner_MonsterLoot_Verified_20_40.zip"

# Start from an empty dedicated directory, never overwrite unrelated data.
$target = ".\public\data\client-monsters"
if (Test-Path $target) {
    throw "Target already exists. Inspect before importing any source data."
}
New-Item -ItemType Directory -Path $target | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $target

py scripts/validate-client-monster-loot.py --candidate $target
py scripts/verify-client-monster-source-hashes.py --candidate $target

git status --short
git add public/data/client-monsters
git commit -m "data(monsters): publish 4351 audited client character IDs and original loot refs"
git push origin data/monster-loot-original-20-40
```

Only merge the PR after GitHub Actions passes **on the data commit**,
including structural, reverse-link, sample identity and SHA-256 gates.

## Source behavior preserved in the Wiki

Both directions are available once the reviewed files are deployed:

- `/monsters/?id=<CharID>`: original creature, direct item drops,
  grouped item drops; no rate percentages inferred.
- `/pt-br/monsters/`: same client source information in Portuguese.
- `/items/database/?id=<ItemID>`: direct and grouped source monsters
  where original source references exist.
- Every equipment-like item detail page uses the same item source ID.
- Each item page paginates large reverse group references at 100 rows
  per click to avoid rendering thousands of DOM nodes on initial load.

## Editorial safeguards

A character row is not necessarily an active fightable monster.
A source drop row is not evidence of currently enabled live-server loot.
The original RawRate values have not been shown to represent odds.
The model for GroupID group references and item group rows is preserved
at both stages; they are never multiplied into estimated percentages.

If an item has no source link, this means it was not recorded in
this client snapshot, not that it cannot drop in-game.
