/**
 * Stage 20.18 — convert *explicitly approved* private historical Wikidot
 * source audits into local publication candidates.
 *
 * This does NOT fetch websites, approve pages, overwrite existing item
 * records or commit a public JSON. Every batch requires human consent and
 * must pass the same editorial gate as the current Astro item profiles.
 */
import { validateReviewedProfiles } from "../src/data/reviewed-equipment-profiles-gate.mjs";

const SECTION_VALUES = ["overview", "stats", "crafting", "materials"];
const isObj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const exact = (obj, fields) => isObj(obj) &&
  Object.keys(obj).length === fields.length &&
  Object.keys(obj).every(key => fields.includes(key));
const validGrade = x => x === "L" || (Number.isInteger(x) && x >= 0 && x <= 10);

export function makeHistoricalDraft(existing, audit, approvals, names) {
  if (!exact(audit, ["reviewVersion","generatedAtUtc","sourceSite",
    "sourceLicenseNotice","mode","allRowsAreHistoricalUnverified","entries","summary"]) ||
      audit.reviewVersion !== "20.17-private" ||
      audit.sourceSite !== "https://atlantica-online.wikidot.com" ||
      audit.allRowsAreHistoricalUnverified !== true ||
      !Array.isArray(audit.entries) || !Array.isArray(approvals?.items) ||
      approvals.manifestVersion !== "20.18-approvals" ||
      approvals.items.length < 1 || approvals.items.length > 20) {
    throw new Error("Unsupported, empty or unsafe historical approval inputs");
  }
  if (!validateReviewedProfiles(existing,names).ok) {
    throw new Error("Existing reviewed equipment profile dataset is invalid");
  }
  const sources = new Map(), seen = new Set();
  for(const row of audit.entries){
    if (!isObj(row) || typeof row.itemId !== "string" ||
        sources.has(row.itemId)) throw new Error("Repeated or invalid source audit item");
    sources.set(row.itemId,row);
  }
  const already = new Set(existing.records.map(x => x.id));
  const additions = [];
  for(const approval of approvals.items){
    if(!exact(approval,["itemId","sourceUrl","sourceSha256","reviewerNote",
      "approvedSections","approvedStatLevels","legendaryEligibleApproved",
      "reviewerCheckedSource","acknowledgeHistoricalNotCurrent"]) ||
      typeof approval.itemId !== "string" || !/^[1-9]\d*$/.test(approval.itemId) ||
      seen.has(approval.itemId) || already.has(approval.itemId) ||
      !Object.hasOwn(names,approval.itemId) ||
      approval.reviewerCheckedSource !== true ||
      approval.acknowledgeHistoricalNotCurrent !== true ||
      typeof approval.reviewerNote !== "string" ||
      approval.reviewerNote.trim().length < 20 ||
      !Array.isArray(approval.approvedSections) ||
      approval.approvedSections.length < 1 ||
      new Set(approval.approvedSections).size !== approval.approvedSections.length ||
      !approval.approvedSections.every(x => SECTION_VALUES.includes(x)) ||
      !Array.isArray(approval.approvedStatLevels) ||
      new Set(approval.approvedStatLevels.map(String)).size !== approval.approvedStatLevels.length ||
      !approval.approvedStatLevels.every(validGrade) ||
      typeof approval.legendaryEligibleApproved !== "boolean") {
      throw new Error("An item was not expressly reviewed or would replace an existing page");
    }
    seen.add(approval.itemId);
    const source = sources.get(approval.itemId);
    if (!source || source.status !== "historical-draft" ||
        source.titleMatches !== true ||
        (source.sourceScope !== undefined &&
          (source.sourceScope !== "category-index" ||
           source.itemNameMatchedInIndex !== true)) ||
        source.reviewedNameEn !== names[approval.itemId] ||
        source.sourceUrl !== approval.sourceUrl ||
        source.sourceKind !== "historical-community" ||
        source.sourceSha256 !== approval.sourceSha256 ||
        !/^[0-9a-f]{64}$/.test(source.sourceSha256) ||
        source.editoriallyApproved !== false) {
      throw new Error("Source identity, hash or historical evidence was changed");
    }
    const picked = new Set(approval.approvedSections);
    if (approval.approvedStatLevels.length && !picked.has("stats")) {
      throw new Error("Stat grades cannot be approved without the stats section");
    }
    if (picked.has("stats") && !approval.approvedStatLevels.length) {
      throw new Error("Stat section needs explicitly selected enchantment levels");
    }
    if (picked.has("materials") && !picked.has("crafting")) {
      throw new Error("Materials require a separately approved crafting section");
    }
    if (approval.legendaryEligibleApproved &&
        (!picked.has("stats") || !approval.approvedStatLevels.includes("L"))) {
      throw new Error("Legendary requires a source-reviewed L stat grade");
    }
    const available = new Map((source.stats??[]).map(row=>[String(row.enchantLevel),row]));
    const selectedStats = [];
    for(const grade of approval.approvedStatLevels) {
      const row = available.get(String(grade));
      if (!row || !isObj(row) || !Object.hasOwn(row,"enchantLevel"))
        throw new Error("Approved stat level is absent from the source");
      if (grade === "L" && !approval.legendaryEligibleApproved)
        throw new Error("L stat row has no explicit Legendary eligibility review");
      selectedStats.push({...row});
    }
    if (picked.has("overview") &&
        (!isObj(source.overview) || typeof source.overview.typeEn !== "string" ||
         !Number.isInteger(source.overview.minimumLevel) ||
         !Array.isArray(source.overview.eligibleClasses))) {
      throw new Error("Overview source is incomplete");
    }
    if (picked.has("crafting") &&
        (!isObj(source.crafting) || !Number.isInteger(source.crafting.productionPerBatch) ||
         !Number.isInteger(source.crafting.requiredWorkload) ||
         !isObj(source.crafting.requiredSkill))) {
      throw new Error("Crafting source is incomplete");
    }
    if (picked.has("materials") && (!Array.isArray(source.materials) ||
        !source.materials.length)) {
      throw new Error("Approved materials are missing from the historical source");
    }
    const evidence = {
      overview: picked.has("overview")?"community-reference":"not-provided",
      stats: picked.has("stats")?"community-reference":"not-provided",
      crafting: picked.has("crafting")?"community-reference":"not-provided",
      materials: picked.has("materials")?"community-reference":"not-provided",
      projections: "not-provided",
      legendary: approval.legendaryEligibleApproved?"community-reference":"not-provided",
      references: [{
        kind:"community-reference",
        label: names[approval.itemId]+" — Atlantica Online Wikidot (historical, manually reviewed)",
        url: source.sourceUrl,
      }],
    };
    additions.push({
      id:approval.itemId,
      nameEn:names[approval.itemId],
      overview:picked.has("overview") ? structuredClone(source.overview) : null,
      stats:selectedStats.sort((a,b)=>(a.enchantLevel==="L"?11:a.enchantLevel)-
                                    (b.enchantLevel==="L"?11:b.enchantLevel)),
      crafting:picked.has("crafting") ? {
        ...structuredClone(source.crafting),
        materials:picked.has("materials")?structuredClone(source.materials):[],
      } : null,
      enchantmentProjectionModel:null,
      legendaryEligible:approval.legendaryEligibleApproved,
      legendaryProjectionModel:null,
      evidence,
    });
  }
  // Promotion is only a DRAFT. Validate the WHOLE proposed dataset using
  // the actual existing public schema, before any manual Git PR.
  const dataset = {
    schemaVersion:"1.0",dataset:"reviewed-equipment-profiles",
    records:[...existing.records,...additions].sort((a,b)=>Number(a.id)-Number(b.id)),
  };
  const check=validateReviewedProfiles(dataset,names);
  if(!check.ok)throw new Error("Public profile schema rejected a historical candidate");
  return {dataset, added:additions.length, existing:existing.records.length};
}
