"""Synthetic regression tests for Stage 20.11 source overlap vs true variants."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "miner_source_grouping", ROOT / "scripts" / "group-miner-equipment-sources.py"
)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def row(record_id, item_id, *, category="Weapon", filename="ItemTypeWeapon.ndt",
        partition="base", name="Spirit Sword", original_name="ORIGINAL_SECRET",
        grade="NORMAL", level="1", unit=None, work=450,
        material="5100(5)+6080(4)", recipe_state="unsupported", recipe=None):
    return {
        "record_id": record_id, "item_id": item_id,
        "category": category, "source": r"D:\PRIVATE\secret" + "\\" + filename,
        "region": partition, "name": name, "original_name": original_name,
        "grade": grade, "level": level, "unit": unit, "work": work,
        "material": material, "recipe_state": recipe_state, "recipe": recipe,
    }


def fixture(dbpath: Path, registry: Path):
    names = {
        "1": "Spirit Sword",
        "576": "Brody's Enhanced Robe",
        "23208": "Book: Watchful Soul [III]",
        "3890": "Sweet Chocolate Ring (No Trade)",
        "47": "Judgment Sword",
        "999": "No source record",
    }
    registry.write_text(
        "const ITEM_NAMES_TSV = " +
        json.dumps("\n".join(f"{id}|{name}" for id, name in names.items())) + ";\n",
        encoding="utf-8",
    )
    cases = [
        row(112473, 1),
        row(123919, 1, filename="ItemTypeWeapon_ENG.vna", partition="ENG",
            name="KOREAN_SECRET"),
        row(192767, 1, category="Sword", filename="ItemTypeSword.ndt",
            unit=1, recipe_state="valid", recipe="[[5100, 5], [6080, 4]]"),
        row(400, 576, name="Brody's Enhanced Robe", category="Defence",
            filename="ItemTypeDefence.ndt"),
        row(401, 576, name="Brody's Enhanced Robe", category="Armor",
            filename="ItemTypeArmor.ndt", unit=1,
            recipe_state="valid", recipe="[[5100, 5], [6080, 4]]"),
        row(500, 23208, name="Book: Watchful Soul [III]", category="Book",
            filename="ItemTypeBook.ndt", work=30000000, recipe_state="valid",
            recipe="[[3000, 2]]"),
        row(501, 23208, name="Book: Watchful Soul [III]", category="Book",
            filename="ItemTypeBook.ndt", work=5200000, recipe_state="valid",
            recipe="[[3000, 4]]"),
        row(600, 3890, name="Sweet Chocolate Ring (No Trade)",
            category="Accessories", filename="ItemTypeAccessories.ndt"),
        row(601, 3890, name="Different Decor SECRET",
            category="Decoration", filename="ItemTypeDecoration.ndt",
            original_name="DIFFERENT_KOREAN_SECRET"),
        row(700, 47, name="Judgment Sword", category="Sword",
            filename="ItemTypeSword.ndt", unit=1,
            recipe_state="valid", recipe="[[5100, 5], [6080, 4]]"),
        row(701, 47, name="Judgment Sword", category="Sword",
            filename="ItemTypeSword.ndt", unit=1,
            recipe_state="valid", recipe="[[5100, 5], [6080, 4]]"),
    ]
    with sqlite3.connect(dbpath) as db:
        db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
        db.executemany("INSERT INTO snapshots VALUES (?)", [(1,), (2,)])
        db.execute(
            "CREATE TABLE catalog_items(snapshot_id INTEGER, record_id INTEGER PRIMARY KEY, "
            "item_id INTEGER, region TEXT, category TEXT, source TEXT, name TEXT, "
            "original_name TEXT, grade TEXT, level TEXT, unit INTEGER, work INTEGER, "
            "material TEXT, recipe_state TEXT, recipe TEXT)"
        )
        db.executemany(
            "INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                (1, *(record[column] for column in module.BASE_COLUMNS))
                for record in cases
            ]
        )
    return cases


class SourceGroupingTests(unittest.TestCase):
    def test_spirit_sword_is_one_identity_not_two_item_ids_or_variants(self):
        grouped = module.analyze_equipment("1", "Spirit Sword", [
            row(112473, 1),
            row(123919, 1, filename="ItemTypeWeapon_ENG.vna", partition="ENG",
                name="KOREAN_SECRET"),
            row(192767, 1, category="Sword", filename="ItemTypeSword.ndt",
                unit=1, recipe_state="valid", recipe="[[5100, 5], [6080, 4]]"),
        ])
        self.assertEqual(grouped["classification"], "general-and-specific-overlap")
        self.assertEqual(len(grouped["sourceVariantGroups"]), 1)
        self.assertEqual(len(grouped["sourceVariantGroups"][0]["sourceRows"]), 2)
        self.assertEqual(len(grouped["localizationSourceRows"]), 1)
        self.assertEqual({r["role"] for r in grouped["sourceVariantGroups"][0]["sourceRows"]},
                         {"specific", "general"})
        self.assertEqual({r["recordId"] for r in grouped["sourceVariantGroups"][0]["sourceRows"]},
                         {112473, 192767})
        self.assertNotIn("5100(5)", json.dumps(grouped))
        self.assertNotIn("ORIGINAL_SECRET", json.dumps(grouped))

    def test_different_semantic_values_become_reviewable_variants_same_route(self):
        grouped = module.analyze_equipment("23208", "Book: Watchful Soul [III]", [
            row(500, 23208, name="Book: Watchful Soul [III]", category="Book",
                filename="ItemTypeBook.ndt", work=30000000, recipe_state="valid",
                recipe="[[3000, 2]]"),
            row(501, 23208, name="Book: Watchful Soul [III]", category="Book",
                filename="ItemTypeBook.ndt", work=5200000, recipe_state="valid",
                recipe="[[3000, 4]]"),
        ])
        self.assertEqual(grouped["classification"], "divergent-source-variants")
        self.assertEqual(len(grouped["sourceVariantGroups"]), 2)
        self.assertEqual(grouped["itemId"], "23208")

    def test_true_identity_collision_is_not_labeled_as_equipment_variant(self):
        grouped = module.analyze_equipment("3890", "Sweet Chocolate Ring (No Trade)", [
            row(600, 3890, name="Sweet Chocolate Ring (No Trade)",
                category="Accessories", filename="ItemTypeAccessories.ndt"),
            row(601, 3890, name="Another Decoration",
                category="Decoration", filename="ItemTypeDecoration.ndt",
                original_name="DECOR_KOREAN_SECRET"),
        ])
        self.assertEqual(grouped["classification"], "id-collision-different-names")
        self.assertEqual(len(grouped["sourceVariantGroups"]), 0)
        self.assertEqual([r["recordId"] for r in grouped["identityCollisionSourceRows"]], [601])

    def test_sparse_general_row_shared_by_two_variants_is_not_attached_arbitrarily(self):
        original = row(900, 81, name="Contradictory Shield", material=None,
                       work=None, grade=None, level=None, unit=None)
        variants = [
            row(901, 81, category="Shield", filename="ItemTypeShield.ndt",
                name="Contradictory Shield", work=500),
            row(902, 81, category="Shield", filename="ItemTypeShield.ndt",
                name="Contradictory Shield", work=600),
        ]
        grouped = module.analyze_equipment("81", "Contradictory Shield", variants + [original])
        self.assertEqual(grouped["classification"], "divergent-source-variants")
        self.assertEqual(len(grouped["sourceVariantGroups"]), 2)
        self.assertEqual([r["recordId"] for r in grouped["ambiguousSharedSourceRows"]], [900])

    def test_full_sqlite_export_is_read_only_and_aggregate_report_contains_no_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "source.sqlite3"
            registry = Path(tmp) / "names.ts"
            cases = fixture(db, registry)
            private, agg = module.report_source_groups(db, registry, 1)
            self.assertEqual(agg["reviewedItemIds"], 6)
            self.assertEqual(agg["summary"]["totalSourceRows"], len(cases))
            classifications = {e["itemId"]: e["classification"] for e in private["items"]}
            self.assertEqual(classifications, {
                "1": "general-and-specific-overlap",
                "47": "identical-source-definitions",
                "576": "general-and-specific-overlap",
                "3890": "id-collision-different-names",
                "999": "not-in-source",
                "23208": "divergent-source-variants",
            })
            self.assertEqual(sum(agg["classes"].values()), 6)
            content = json.dumps(agg)
            for forbidden in (
                "Spirit Sword", "23208", "3890", "ORIGINAL_SECRET",
                "PRIVATE", "DIFFERENT_KOREAN_SECRET", str(db.resolve())
            ):
                self.assertNotIn(forbidden, content)
            with sqlite3.connect(db) as verify:
                self.assertEqual(
                    verify.execute("SELECT COUNT(*) FROM catalog_items").fetchone()[0],
                    len(cases)
                )

    def test_invalid_schema_and_snapshot_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = Path(tmp) / "broken.sqlite3"
            registry = Path(tmp) / "names.ts"
            with sqlite3.connect(db) as con:
                con.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
                con.execute("INSERT INTO snapshots VALUES (1)")
                con.execute("CREATE TABLE catalog_items(item_id INTEGER)")
            registry.write_text('const ITEM_NAMES_TSV = "1|Spirit Sword";\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                module.report_source_groups(db, registry, 1)


if __name__ == "__main__":
    unittest.main()
