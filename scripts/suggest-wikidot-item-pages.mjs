/**
 * Generate candidate URLs for the historic community Wikidot item namespace.
 * Does not fetch any website or claim that the page exists.
 *
 * Confirmed examples:
 * Spirit Bow -> item:spirit-bow
 * Destroyer's Sword -> item:destroyer-s-sword
 * Phoenix's Light Armor -> item:phoenix-s-light-armor
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadReviewedEquipmentNames } from "./read-reviewed-equipment-names.mjs";

export function wikidotItemSlug(name) {
  if (typeof name !== "string" || name.length > 200) {
    throw new TypeError("Item name must be a bounded string");
  }
  return name.normalize("NFKD")
    .replace(/\p{M}/gu,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"");
}

export function wikidotCandidateUrl(name) {
  const slug=wikidotItemSlug(name);
  return slug ? "https://atlantica-online.wikidot.com/item:" + slug : null;
}

export function suggestCatalogPages(names, query = "", limit = 30) {
  const term=String(query).trim().toLocaleLowerCase();
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
    throw new RangeError("Invalid maximum candidate count");
  }
  return Object.entries(names)
    .filter(([,name])=>name.toLocaleLowerCase().includes(term))
    .sort((a,b)=>a[1].localeCompare(b[1],"en"))
    .slice(0,limit)
    .map(([id,name])=>({id,name,url:wikidotCandidateUrl(name),verified:false}));
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  const all=args.includes("--all");
  const search=args.filter(x=>x!=="--all").join(" ");
  const rows=suggestCatalogPages(loadReviewedEquipmentNames(),search,all?1000:30);
  console.log("# CANDIDATES ONLY — verify page existence and stat version before citing");
  console.log("Item ID\tReviewed English name\tCandidate Wikidot URL");
  for(const row of rows) console.log(row.id+"\t"+row.name+"\t"+(row.url??"-"));
  if(!all) console.log("# Showing at most 30 matches; pass --all to list all public names");
}
