import test from "node:test";
import assert from "node:assert/strict";
import legends from "../src/data/legendary-eligibility-reference.json" with {type:"json"};
import {reconcileLegendaryAgainstClient} from "../scripts/reconcile-legendary-client.mjs";

const client={
  reportVersion:"20.23-private",dataset:"all-client-catalog-items",snapshotId:1,
  items:[
    {itemId:"9001",officialEnglishName:"Excalibur",
      identityState:"one-official-English-name",sources:[{recordId:1}]},
    {itemId:"9002",officialEnglishName:"Guardian Sheath",
      identityState:"one-official-English-name",sources:[{recordId:2}]},
    {itemId:"9003",officialEnglishName:"Immortal Bow",
      identityState:"different-base-identities",sources:[{recordId:3}]},
    {itemId:"9004",officialEnglishName:"Immortal Bow",
      identityState:"one-official-English-name",sources:[{recordId:4}]},
    {itemId:"9005",officialEnglishName:"Dell'arte's Ambition",
      identityState:"one-official-English-name",sources:[{recordId:5}]},
  ]
};
const clone=x=>JSON.parse(JSON.stringify(x));

test("full client source inventory can match historical L candidates beyond 551 IDs",()=>{
  const r=reconcileLegendaryAgainstClient(client,legends);
  assert.equal(r.summary.referenceEntries,47);
  assert.equal(r.summary.uniqueClientNameCandidates,3);
  assert.equal(r.summary.ambiguousClientIdentities,1);
  assert.equal(r.summary.missingClientNameMatches,43);
  const exc=r.entries.find(x=>x.nameEn==="Excalibur");
  assert.deepEqual(exc.candidateItemIds,["9001"]);
  assert.equal(exc.clientMatchStatus,"one-exact-source-name");
  const shield=r.entries.find(x=>x.nameEn==="Guardian Sheath");
  assert.deepEqual(shield.candidateItemIds,["9002"]);
  const bow=r.entries.find(x=>x.nameEn==="Immortal Bow");
  assert.equal(bow.clientMatchStatus,"ambiguous-client-identity");
  assert.deepEqual(bow.candidateItemIds,["9003","9004"]);
  const deco=r.entries.find(x=>x.nameEn==="Dell'arte's Ambition");
  assert.equal(deco.clientMatchStatus,"one-exact-source-name");
  assert.equal(r.publication.startsWith("PRIVATE"),true);
});

test("no public Legendary tag is created solely from names, even when exact",()=>{
  const r=reconcileLegendaryAgainstClient(client,legends);
  assert.ok(r.entries.every(x=>!Object.hasOwn(x,"legendaryEligible")));
  assert.ok(r.entries.every(x=>!Object.hasOwn(x,"craftable")));
  assert.ok(r.entries.every(x=>!Object.hasOwn(x,"eventOnly")));
  assert.ok(r.entries.every(x=>!Object.hasOwn(x,"dropRate")));
});

test("reject forged source snapshot, duplicate IDs and malformed private inventory",()=>{
  for(const mutate of [
    x=>{x.snapshotId=0;},
    x=>{x.items.push(clone(x.items[0]));},
    x=>{x.items[0].identityState="Verified";},
    x=>{x.reportVersion="legacy";},
    x=>{x.items[0].itemId="1;DROP TABLE";},
  ]){
    const altered=clone(client);mutate(altered);
    assert.throws(()=>reconcileLegendaryAgainstClient(altered,legends));
  }
});
