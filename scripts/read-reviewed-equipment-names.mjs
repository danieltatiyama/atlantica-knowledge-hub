/** Read the reviewed item-name registry, without evaluating any TypeScript. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_REGISTRY = fileURLToPath(
  new URL("../src/data/equipment-item-names-en.ts", import.meta.url)
);
const LITERAL = /^const ITEM_NAMES_TSV = ("(?:\\.|[^"\\])*");\s*$/gm;

export function loadReviewedEquipmentNames(path = DEFAULT_REGISTRY) {
  const text = readFileSync(resolve(path), "utf8");
  const matches = Array.from(text.matchAll(LITERAL));
  if (matches.length !== 1) throw new Error("Reviewed equipment registry format changed");
  const tsv = JSON.parse(matches[0][1]);
  if (typeof tsv !== "string" || !tsv) throw new Error("Reviewed equipment TSV must not be empty");
  const names = Object.create(null);
  for (const line of tsv.split("\n")) {
    const separator = line.indexOf("|");
    const id = line.slice(0, separator);
    const name = line.slice(separator + 1);
    if (separator < 1 || !/^[1-9][0-9]*$/.test(id) || !name.trim() ||
        Object.prototype.hasOwnProperty.call(names, id)) {
      throw new Error("Invalid or repeated reviewed equipment registry entry");
    }
    names[id] = name;
  }
  return names;
}
