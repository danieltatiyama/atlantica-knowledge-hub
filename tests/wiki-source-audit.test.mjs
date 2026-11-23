import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createLevelResolvedDiscovery} from "../scripts/generate-monster-level-resolved.mjs";
import {buildCraftLinks} from "../scripts/generate-client-craft-links.mjs";
import {inspectSourceQuality} from "../src/data/wiki-source-audit.mjs";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const source=createLevelResolvedDiscovery();
const craft=buildCraftLinks();
const data={
 itemManifest:read("public/data/client-items/manifest.json"),
 monsterManifest:read("public/data/client-monsters/manifest.json"),
 discoveryManifest:source.manifest,itemLookup:source.index,
 creatureCounts:{count:source.creatureCounts.length,rows:source.creatureCounts},
 reverseShards:Array.from({length:30},(_,bucket)=>({
   schemaVersion:"1.0",snapshotId:1,
   dataset:"level-resolved-client-monster-loot",bucket,items:source.items[bucket],
 })),
 craftManifest:craft.manifest,
};
test("audited reverse indexes reconcile with all 4,351 creature counts",()=>{
 const result=inspectSourceQuality(data);
 assert.equal(result.status,"source-consistent");
 assert.equal(result.itemCatalog.ids,23586);
 assert.equal(result.monsters.ids,4351);
 assert.equal(result.monsters.matchedItemIds,822);
 assert.equal(result.monsters.directRows,9959);
 assert.equal(result.monsters.levelMatchedGroupRows,23905);
 assert.equal(result.monsters.unresolvedGroupReferences,197);
 assert.equal(result.checks.forwardReverseMatches,true);
 assert.equal(result.checks.hugeCrocodileReference,true);
});
test("audit rejects tampered creature counts and reverse item source totals",()=>{
 const changed={...data,creatureCounts:{...data.creatureCounts,
  rows:data.creatureCounts.rows.map((row,i)=>i===0?[row[0],row[1]+1,row[2]]:row)}};
 assert.throws(()=>inspectSourceQuality(changed),/mismatch/);
 const bad={...data,itemLookup:{...data.itemLookup,rows:data.itemLookup.rows.slice(1)}};
 assert.throws(()=>inspectSourceQuality(bad),/diverged/);
});
test("audit is build-generated and available as bilingual tool",()=>{
 const script=readFileSync("scripts/audit-wiki-data.mjs","utf8");
 const pkg=readFileSync("package.json","utf8");
 const hub=readFileSync("src/components/ToolsPage.astro","utf8");
 const page=readFileSync("src/components/DataQualityPage.astro","utf8");
 assert.ok(pkg.includes("node scripts/audit-wiki-data.mjs"));
 assert.ok(script.includes("inspectSourceQuality(data)"));
 assert.ok(hub.includes("/tools/data-quality/"));
 assert.ok(page.includes("/data/audits/source-quality.json"));
 assert.ok(page.includes("source-consistent"));
});
