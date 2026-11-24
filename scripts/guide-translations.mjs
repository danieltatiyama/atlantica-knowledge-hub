import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,renameSync} from "node:fs";
import {join,dirname} from "node:path";
import {stringify} from "yaml";
import {TARGET_LOCALES,readEnglishGuide,prepareTranslation,translationRequest,finishTranslation,translationState,sha256,parseGuide,approveTranslation} from "./guide-translation-contract.mjs";

const root="src/content/guides";
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const read=path=>readFileSync(path,"utf8");
const optional=path=>existsSync(path)?read(path):null;
const pathFor=(lang,slug)=>join(root,lang,slug+".md");
function checkSlug(slug){if(typeof slug!=="string"||slug.length>80||!slugPattern.test(slug))throw Error("Invalid guide slug");}
function checkLang(lang){if(!TARGET_LOCALES.includes(lang))throw Error("Invalid target locale");}
function source(slug){checkSlug(slug);return read(pathFor("en",slug));}
function output(path,value){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,value,{flag:"wx"});}
function entries(){
 const result=[];
 for(const name of readdirSync(join(root,"en")).filter(n=>n.endsWith(".md")).sort()){
  const slug=name.slice(0,-3),raw=source(slug),meta=parseGuide(raw).meta;
  if(meta.draft!==false||meta.reviewStatus!=="approved")continue;
  const {sourceHash}=readEnglishGuide(raw,slug);
  for(const lang of TARGET_LOCALES){
   const existing=optional(pathFor(lang,slug));
   result.push({slug,lang,sourceHash,state:translationState(existing,sourceHash),targetHash:existing===null?null:sha256(existing)});
  }
 }
 return result;
}
function request(slug,lang){
 checkLang(lang);
 const raw=source(slug),plan=prepareTranslation(raw,slug,lang);
 const target=optional(pathFor(lang,slug));
 return {...translationRequest(plan),slug,sourceHash:plan.source.sourceHash,
  targetHash:target===null?null:sha256(target),state:translationState(target,plan.source.sourceHash)};
}
function apply(file,{replaceManaged=false}={}){
 const response=JSON.parse(read(file));
 const {slug,targetLanguage:lang,sourceHash,targetHash,segments,provider,model}=response;
 checkSlug(slug);checkLang(lang);
 if(response.schemaVersion!==1||typeof provider!=="string"||!provider.trim()||provider.length>100||
  typeof model!=="string"||!model.trim()||model.length>150)throw Error("Invalid translation response envelope");
 const plan=prepareTranslation(source(slug),slug,lang);
 if(plan.source.sourceHash!==sourceHash)throw Error("English source changed; regenerate the request");
 const path=pathFor(lang,slug),current=optional(path);
 if((current===null?null:sha256(current))!==targetHash)throw Error("Target changed since request; regenerate without overwriting edits");
 const state=translationState(current,sourceHash);
 if(current!==null&&(!replaceManaged||!["stale-draft","stale-published"].includes(state)))throw Error("Existing translation protected; only explicitly requested stale managed translations may be replaced");
 let markdown=finishTranslation(plan,segments,{provider,model});
 if(current!==null){const {meta,body}=parseGuide(markdown);markdown="---\n"+stringify({...meta,translationPreviousHash:targetHash},{lineWidth:0})+"---\n"+body;}
 // A stale published translation is never demoted in place. Store an isolated
 // candidate for review; publication is a separate explicit editorial action.
 const destination=current===null?path:join("translation-review",lang,slug+"."+sourceHash.slice(0,16)+"."+targetHash.slice(0,16)+".md");
 output(destination,markdown);
 return {slug,lang,state,destination,candidateHash:sha256(markdown),targetHash};
}
export {entries,request,apply};
const [command,...args]=process.argv.slice(2);
if(command==="status"){
 console.log(JSON.stringify(entries(),null,2));
}else if(command==="export"){
 const [directory="translation-requests"]=args;
 const rows=entries();
 mkdirSync(directory,{recursive:true});
 const skipped=[];
 for(const entry of rows.filter(x=>["missing","stale-draft","stale-published"].includes(x.state))){
  try{output(join(directory,entry.slug+"."+entry.lang+".json"),JSON.stringify(request(entry.slug,entry.lang),null,2)+"\n");}
  catch(error){skipped.push({slug:entry.slug,lang:entry.lang,reason:error.message});}
 }
 output(join(directory,"status.json"),JSON.stringify({entries:rows,skipped},null,2)+"\n");
 console.log("[IC] Requests exported:",directory,"| manual-review exceptions:",skipped.length);
}else if(command==="request"){
 const [slug,lang]=args; console.log(JSON.stringify(request(slug,lang),null,2));
}else if(command==="apply"){
 const [file,flag]=args;
 if(!file||flag&&flag!=="--replace-managed")throw Error("Usage: apply RESPONSE.json [--replace-managed]");
 console.log(JSON.stringify(apply(file,{replaceManaged:flag==="--replace-managed"})));
}else if(command==="approve"){
 const [slug,lang,file,candidateHash,targetHash]=args;
 checkSlug(slug);checkLang(lang);
 if(!file||!candidateHash||targetHash===undefined)throw Error("Usage: approve SLUG LOCALE FILE CANDIDATE_SHA TARGET_SHA_OR_null");
 const destination=pathFor(lang,slug),current=optional(destination);
 const approved=approveTranslation({english:source(slug),slug,lang,candidate:read(file),expectedCandidateHash:candidateHash,currentTarget:current,expectedTargetHash:targetHash==="null"?null:targetHash});
 // Only a separate reviewed PR should deliver these approved changes to main.
 mkdirSync(dirname(destination),{recursive:true});
 const tmp=destination+".translation-tmp";
 writeFileSync(tmp,approved,{flag:"wx"});
 renameSync(tmp,destination);
 console.log("[IC] Approved locally; submit a reviewed PR:",destination);
}else{
 throw Error("Usage: status | export [directory] | request SLUG LOCALE | apply RESPONSE.json [--replace-managed] | approve SLUG LOCALE FILE CANDIDATE_SHA TARGET_SHA_OR_null");
}
