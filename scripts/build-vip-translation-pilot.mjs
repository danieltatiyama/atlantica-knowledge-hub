import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {dirname} from "node:path";
import {prepareTranslation,finishTranslation,parseGuide,sha256} from "./guide-translation-contract.mjs";

const source=readFileSync("src/content/guides/en/vip-system.md","utf8");
const pilot=JSON.parse(readFileSync("translation-pilot/vip-system.responses.json","utf8"));
const expected=["fr","de","es","ko","zh-hans","ja"];
if(pilot.guide!=="vip-system"||Object.keys(pilot.responses).sort().join(",")!==expected.toSorted().join(","))throw Error("Invalid pilot locale coverage");
for(const lang of expected){
 const plan=prepareTranslation(source,pilot.guide,lang);
 const draft=finishTranslation(plan,pilot.responses[lang],{provider:pilot.provider,model:pilot.model});
 const destination="src/content/guides/"+lang+"/vip-system.md";
 if(process.argv.includes("--check")){
  // Compare semantics rather than incidental YAML quoting conventions.
  const actual=parseGuide(readFileSync(destination,"utf8")),generated=parseGuide(draft);
  if(JSON.stringify(actual.meta)!==JSON.stringify(generated.meta)||actual.body!==generated.body)
   throw Error("Pilot differs from the protected translation output: "+destination);
 }else{
  if(existsSync(destination))throw Error("Refusing to overwrite "+destination);
  mkdirSync(dirname(destination),{recursive:true});
  writeFileSync(destination,draft,{flag:"wx"});
 }
}
console.log("[IC] Verified six VIP pilot drafts against English source:",sha256(source));
