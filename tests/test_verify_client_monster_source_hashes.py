"""Unit tests for exact original 53-file client loot source pin."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/"scripts"/"verify-client-monster-source-hashes.py"
spec=importlib.util.spec_from_file_location("verify_monster_sha",FILE)
checker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class MonsterSourceHashTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base=Path(self.tmp.name)
        self.src=self.base/"original"
        self.src.mkdir()
        self.pin=self.base/"pin.json"
        self.names={
            "index":["index-00.json","index-01.json","index-02.json"],
            "characters":[f"characters/{i:02}.json" for i in range(9)],
            "loot":[f"loot/{i:02}.json" for i in range(9)],
            "groups":["groups/00.json"],
            "itemSources":[f"item-sources/{i:02}.json" for i in range(30)],
        }
        self.metadata={
            "schemaVersion":"1.0","snapshotId":1,
            "dataset":"all-client-monster-loot-original",
            "catalogMonsterIds":4351,"directSourceRows":9959,
            "groupReferenceRows":5784,"groupDropRows":3076,
            "groupBandRows":572,"reverseItemIds":893,
            "groupSourceJoins":172120,"files":self.names
        }
        for name in ["manifest.json"]+[name for names in self.names.values() for name in names]:
            path=self.src/name
            path.parent.mkdir(exist_ok=True,parents=True)
            data=self.metadata if name=="manifest.json" else {"name":name}
            path.write_bytes(json.dumps(data,separators=(",",":")).encode()+b"\r\n")
        self.expected=sorted(["manifest.json"]+[name for files in self.names.values() for name in files])
        self.approve_current()

    def approve_current(self):
        h=hashlib.sha256()
        for name in self.expected:
            h.update(name.encode()+b"\0"+(self.src/name).read_bytes())
        approved={
            "schemaVersion":"20.40-sha256",
            "dataset":"all-client-monster-loot-original",
            "snapshotId":1,"approvedFiles":53,
            "originalFileStreamSha256":h.hexdigest(),
        }
        approved.update({key:self.metadata[key] for key in (
            "catalogMonsterIds","directSourceRows",
            "groupReferenceRows","groupDropRows",
            "groupBandRows","reverseItemIds","groupSourceJoins"
        )})
        self.pin.write_text(json.dumps(approved),encoding="utf-8")

    def test_original_and_git_lf_only_pass(self):
        raw=checker.check(self.src,self.pin)
        self.assertEqual(raw["sourceFiles"],53)
        self.assertEqual(raw["gitTerminalLFAdjusted"],0)
        for name in self.expected:
            p=self.src/name
            b=p.read_bytes()
            self.assertEqual(b.count(b"\r\n"),1)
            p.write_bytes(b[:-2]+b"\n")
        checkout=checker.check(self.src,self.pin)
        self.assertEqual(checkout["gitTerminalLFAdjusted"],53)
        self.assertEqual(checkout["digest"],raw["digest"])

    def test_changed_field_even_same_length_fails(self):
        p=self.src/"characters/02.json"
        p.write_bytes(p.read_bytes().replace(b"02.json",b"09.json"))
        with self.assertRaisesRegex(ValueError,"SHA-256 aggregate mismatch"):
            checker.check(self.src,self.pin)

    def test_unaudited_extra_source_file_fails(self):
        (self.src/"characters/99.json").write_bytes(b"{}\r\n")
        with self.assertRaisesRegex(ValueError,"Missing or additional"):
            checker.check(self.src,self.pin)

    def test_newlines_inside_original_json_cannot_be_smuggled(self):
        p=self.src/"index-00.json"
        p.write_bytes(b'{"item":\n123}\n')
        with self.assertRaisesRegex(ValueError,"newline layout"):
            checker.check(self.src,self.pin)

    def test_missing_single_original_shard_fails(self):
        (self.src/"loot/07.json").unlink()
        with self.assertRaisesRegex(ValueError,"Missing or additional"):
            checker.check(self.src,self.pin)


if __name__=="__main__":
    unittest.main()
