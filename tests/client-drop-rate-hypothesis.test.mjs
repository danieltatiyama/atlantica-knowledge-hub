import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  CLIENT_RATE_HYPOTHESIS_DENOMINATOR,
  candidateClientRatePercent,
  formatCandidateClientRate,
} from "../src/data/client-drop-rate-hypothesis.mjs";

const read=path=>readFileSync(path,"utf8");

test("historical 10000-scale fixed-point hypothesis yields accurate localized %",()=>{
  assert.equal(CLIENT_RATE_HYPOTHESIS_DENOMINATOR,10000);
  for(const [raw,expected] of [
    ["0",0],["1",0.01],["50",0.5],["100",1],["1000",10],
    ["2500",25],["7500",75],["9999",99.99],["10000",100],
  ]){
    assert.equal(candidateClientRatePercent(raw),expected);
  }
  assert.equal(formatCandidateClientRate("1","pt-br"),"0,01%");
  assert.equal(formatCandidateClientRate("50","pt-br"),"0,5%");
  assert.equal(formatCandidateClientRate("2500","pt-br"),"25%");
  assert.equal(formatCandidateClientRate("10000","en"),"100%");
  assert.equal(formatCandidateClientRate("9999","en"),"99.99%");
});

test("untrusted/unknown fields are not converted to imaginary percentages",()=>{
  for(const raw of [null,undefined,"","1e4","20%","-1","10001",
    "18900","1.5"," 1000","NaN",Infinity,{},[],true]){
    assert.equal(candidateClientRatePercent(raw),null);
    assert.equal(formatCandidateClientRate(raw),"—");
  }
});

test("all original direct, creature-to-group and group-item RawRate fields fit the scale",()=>{
  const manifest=JSON.parse(read("public/data/client-monsters/manifest.json"));
  let direct=0,references=0,groupItems=0;
  for(const name of manifest.files.loot){
    const shard=JSON.parse(read("public/data/client-monsters/"+name));
    for(const obj of Object.values(shard.items)){
      for(const row of obj.direct){
        assert.notEqual(candidateClientRatePercent(row[3]),null);
        direct++;
      }
      for(const row of obj.groups){
        assert.notEqual(candidateClientRatePercent(row[2]),null);
        references++;
      }
    }
  }
  for(const name of manifest.files.groups){
    const shard=JSON.parse(read("public/data/client-monsters/"+name));
    for(const obj of Object.values(shard.items)){
      for(const row of obj.drops){
        assert.notEqual(candidateClientRatePercent(row[4]),null);
        groupItems++;
      }
    }
  }
  assert.equal(direct,9959);
  assert.equal(references,5784);
  assert.equal(groupItems,3076);
});

test("RawSum in GroupBands is distinct from RawRate and may exceed 10000",()=>{
  const manifest=JSON.parse(read("public/data/client-monsters/manifest.json"));
  let maxRawSum=0,over10000=0,bands=0;
  for(const name of manifest.files.groups){
    const shard=JSON.parse(read("public/data/client-monsters/"+name));
    for(const group of Object.values(shard.items)){
      for(const band of group.bands){
        const rawSum=Number(band[4]);
        assert.ok(Number.isFinite(rawSum));
        maxRawSum=Math.max(maxRawSum,rawSum);
        if(rawSum>10000)over10000++;
        bands++;
      }
    }
  }
  assert.equal(bands,572);
  assert.ok(maxRawSum>10000);
  assert.ok(over10000>0);
  assert.equal(candidateClientRatePercent(String(maxRawSum)),null);
});

test("the wiki labels level-matched two-stage probabilities as estimates, never server facts",()=>{
  const monster=read("src/components/MonsterDatabasePage.astro");
  const codex=read("src/components/MonsterDropItemSearch.astro");
  const profile=read("src/components/MonsterItemSources.astro");
  const full=read("src/components/FullClientItemDatabasePage.astro");
  for(const source of [monster,codex,profile,full]){
    assert.ok(source.includes("formatLevelResolvedPercent"));
    assert.match(source,/(NÃO|NOT).{0,90}(chance|odds|probab|verific|rates)/i);
    assert.ok(!source.includes("finalDropChance"));
    assert.ok(!source.includes("GroupBands.RawSum/100"));
  }
  assert.ok(monster.includes("resolveClientCreatureDrops"));
  for(const source of [codex,profile,full]){
    assert.ok(source.includes("estimatedTwoStagePercent"));
    assert.ok(source.includes("level-resolved-client-monster-loot"));
  }
  assert.ok(monster.includes("RawRate"));
  assert.ok(profile.includes("RawRate"));
});

test("2540x1440 @ 125% widescreen uses a denser, wide bestiary page without global changes",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  const codex=read("src/components/MonsterDropItemSearch.astro");
  const global=read("src/styles/global.css");
  assert.ok(page.includes("width:min(1600px,calc(100% - 36px))"));
  assert.ok(page.includes("@media(max-width:700px)"));
  assert.ok(codex.includes("margin:14px 0"));
  assert.ok(global.includes("--content-width: 1280px"),
    "Only the bestiary page should widen without changing all site content");
});
