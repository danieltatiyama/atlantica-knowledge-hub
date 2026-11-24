import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {TARGET_LOCALES,parseGuide,sha256} from "./guide-translation-contract.mjs";
const report=JSON.parse(readFileSync(process.argv[2],"utf8"));
if(!Array.isArray(report.generated))throw Error("Invalid generation report");
const paths=new Set();
for(const row of report.generated){
 if(!TARGET_LOCALES.includes(row.lang)||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))throw Error("Invalid generated guide identity");
 const path=row.destination.replaceAll("\\","/");
 const expected=row.state==="missing"?"src/content/guides/"+row.lang+"/"+row.slug+".md":
  "translation-review/"+row.lang+"/"+row.slug+"."+row.destination.split(".").at(-3)+"."+row.targetHash.slice(0,16)+".md";
 const validRevision=/^translation-review\/[a-z-]+\/[a-z0-9-]+\.[a-f0-9]{16}\.[a-f0-9]{16}\.md$/;
 if(path!==expected||(row.state!=="missing"&&!validRevision.test(path)))throw Error("Unexpected generated path");
 const raw=readFileSync(path,"utf8"),m=parseGuide(raw).meta;
 if(m.draft!==true||m.reviewStatus!=="in-review"||m.lang!==row.lang||m.translationKey!==row.slug||
  sha256(raw)!==row.candidateHash)throw Error("Generated draft differs from validated output");
 if(row.state!=="missing"&&m.translationPreviousHash!==row.targetHash)throw Error("Revision is not bound to previous target");
 paths.add(path);
}
if(paths.size)execFileSync("git",["add","--",...paths],{stdio:"inherit"});
const staged=execFileSync("git",["diff","--cached","--name-only","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
if(staged.length!==paths.size||staged.some(path=>!paths.has(path)))throw Error("Unrelated staged change detected");
console.log("[IC] Staged validated drafts:",paths.size);
