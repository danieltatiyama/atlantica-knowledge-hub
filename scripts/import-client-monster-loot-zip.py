#!/usr/bin/env python3
"""Import the previously audited Miner original ZIP (Windows separators allowed).

Run from the Wiki root:
  py scripts/import-client-monster-loot-zip.py \
    ".\Miner_MonsterLoot_PublicCandidate_20_38.zip" \
    ".\public\data\client-monsters"

This importer reads all 53 original JSONs, converts ZIP member separators
to paths, checks the approved aggregate SHA-256 BEFORE extracting, and never
overwrites an existing nonempty directory. The original JSON bytes remain
unchanged. Always run structural and SHA gates separately before committing.
"""
from __future__ import annotations

import hashlib
import re
import sys
import zipfile
from pathlib import Path

EXPECTED_SHA256 = "d202d71798e45053217fbeaf71a72a4c7af3a1a01343b2bb58fe55f6717bc72b"
ALLOWED_PATH = re.compile(
    r"(?:manifest\.json|index-\d{2}\.json|"
    r"(?:characters|loot|groups|item-sources)/\d{2}\.json)\Z"
)


def import_zip(original_zip: Path, target: Path) -> int:
    original_zip = original_zip.resolve()
    target = target.resolve()
    if not original_zip.is_file():
        raise ValueError(f"ZIP não encontrado: {original_zip}")
    if target.exists() and any(target.iterdir()):
        raise ValueError(f"Diretório de destino não está vazio: {target}")

    entries: list[tuple[str, bytes]] = []
    seen: set[str] = set()
    with zipfile.ZipFile(original_zip) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            name = info.filename.replace("\\", "/")
            if not ALLOWED_PATH.fullmatch(name) or name in seen:
                raise ValueError(f"Arquivo ZIP inesperado ou duplicado: {name!r}")
            seen.add(name)
            entries.append((name, archive.read(info)))

    if len(entries) != 53 or "manifest.json" not in seen:
        raise ValueError(
            f"Pacote incompleto: esperados 53 JSONs, encontrados {len(entries)}"
        )

    digest = hashlib.sha256()
    for name, data in sorted(entries):
        digest.update(name.encode("utf-8") + b"\0" + data)
    if digest.hexdigest() != EXPECTED_SHA256:
        raise ValueError("SHA-256 dos JSONs originais não corresponde ao pacote auditado")

    target.mkdir(parents=True, exist_ok=True)
    for name, data in entries:
        output = target.joinpath(*name.split("/"))
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(data)

    print(f"[IC] SHA-256 aprovado: {digest.hexdigest()}")
    print(f"[IC] {len(entries)} JSONs extraídos em {target}")
    return len(entries)


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "[IC] Uso: py scripts/import-client-monster-loot-zip.py ZIP DESTINO",
            file=sys.stderr,
        )
        return 2
    try:
        import_zip(Path(sys.argv[1]), Path(sys.argv[2]))
        return 0
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"[IC] ERRO: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
