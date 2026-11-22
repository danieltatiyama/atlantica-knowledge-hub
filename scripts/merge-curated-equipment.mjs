/**
 * Pure function: safely add approved item metadata to the curated dataset.
 * Does NOT approve client records, choose an ID candidate or verify gameplay.
 */
import { assertCuratedEquipment } from "../src/data/curated-equipment-gate.mjs";

export function mergeCuratedEquipment(existing, incoming, reviewedNames) {
  const oldRows = assertCuratedEquipment(existing, reviewedNames);
  const newRows = assertCuratedEquipment(incoming, reviewedNames);
  if (newRows.length === 0) throw new Error("Cannot promote an empty approved candidate dataset");

  const emptyPilot = oldRows.length === 0 && existing.snapshot.id === "curated-pilot-empty";
  if (!emptyPilot &&
      (existing.snapshot.id !== incoming.snapshot.id ||
       existing.snapshot.game !== incoming.snapshot.game ||
       existing.snapshot.minerVersion !== incoming.snapshot.minerVersion)) {
    throw new Error("Curated snapshot differs; use a separately reviewed migration PR");
  }

  const byId = new Map(oldRows.map((row) => [row.id, row]));
  let added = 0;
  for (const row of newRows) {
    const old = byId.get(row.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(row)) {
        throw new Error("A published equipment record would change; manual PR required");
      }
    } else {
      byId.set(row.id, row);
      added++;
    }
  }
  const result = {
    schemaVersion: "1.0",
    dataset: "items",
    snapshot: emptyPilot ? incoming.snapshot : existing.snapshot,
    records: Array.from(byId.values()).sort((a, b) => Number(a.id) - Number(b.id)),
  };
  assertCuratedEquipment(result, reviewedNames);
  return { dataset: result, added, unchanged: newRows.length - added };
}
