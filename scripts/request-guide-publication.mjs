/**
 * GitHub Actions entry point for Pages CMS "Request publication" action.
 * Copies only a selected approved guide and its referenced image bytes.
 * Never merges a PR or publishes directly to main.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {dirname} from "node:path";
import {execFileSync} from "node:child_process";
import {planGuidePublication} from "./guide-publication-plan.mjs";

const git=(args,opts={})=>execFileSync("git",args,{encoding:"utf8",...opts});
const must=(condition,message)=>{if(!condition)throw Error(message);};

function main(){
 const payload=JSON.parse(process.env.CMS_PAYLOAD??"null");
 const input=payload?.inputs;
 must(payload?.source==="pages-cms"&&
  payload?.action?.name==="request-guide-publication"&&
  input&&typeof input==="object","Invalid Pages CMS publication request");
 must(process.env.GITHUB_ACTIONS==="true"&&
  process.env.GITHUB_REF==="refs/heads/dev/i18n"&&
  git(["branch","--show-current"]).trim()==="dev/i18n",
  "Publication requests must run on the dev/i18n branch");
 must(!git(["status","--porcelain"]).trim(),"Working tree is not clean");
 const lang=input.language,slug=input.translationKey;
 must(typeof lang==="string"&&typeof slug==="string",
  "Language and guide identifier are required");
 must(["en","pt-br"].includes(lang)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
  "Invalid language or guide identifier");
 const relative="src/content/guides/"+lang+"/"+slug+".md";
 const source=readFileSync(relative,"utf8");
 const plan=planGuidePublication({
  markdown:source,lang,slug,
  readSourceImage:(path)=>readFileSync(path),
 });
 git(["fetch","origin","main","dev/i18n"]);
 const branchName="publish/guide-"+lang+"-"+slug+"-"+String(process.env.GITHUB_RUN_ID??"manual");
 must(/^[A-Za-z0-9/._-]+$/.test(branchName),"Unsafe publication branch");
 git(["checkout","-b",branchName,"origin/main"]);
 must(!existsSync(plan.articlePath),"Guide already exists on main: "+plan.articlePath);
 mkdirSync(dirname(plan.articlePath),{recursive:true});
 writeFileSync(plan.articlePath,plan.content,{flag:"wx"});
 const paths=[plan.articlePath];
 for(const file of plan.images){
  must(!existsSync(file.path),"Image already exists on main: "+file.path);
  mkdirSync(dirname(file.path),{recursive:true});
  writeFileSync(file.path,file.content,{flag:"wx"});
  paths.push(file.path);
 }
 git(["add","--",...paths]);
 const actual=git(["diff","--cached","--name-only"]).trim().split("\n").sort();
 must(actual.length===paths.length&&actual.every((path,i)=>path===paths.toSorted()[i]),
  "Unexpected staged files: "+actual.join(", "));
 git(["config","user.name","github-actions[bot]"]);
 git(["config","user.email","41898282+github-actions[bot]@users.noreply.github.com"]);
 git(["commit","-m","docs(guides): prepare "+slug+" publication PR"]);
 git(["push","--set-upstream","origin",branchName]);
 const body=[
  "## Reviewed guide publication request",
  "",
  "Source: Pages CMS on dev/i18n.",
  "Guide: "+relative,
  "Destination: main.",
  "Referenced screenshots copied: "+plan.imageCount,
  "",
  "Original Markdown retained except article-scoped image paths.",
  "Source must have draft: false and reviewStatus: approved.",
  "This PR is NOT automatically merged. Confirm CI and editorial review before merging.",
 ].join("\n");
 try{
  const url=execFileSync("gh",[
   "pr","create","--base","main","--head",branchName,
   "--title","Publish "+slug+" guide ("+lang+")",
   "--body",body,
  ],{encoding:"utf8",env:process.env}).trim();
  console.log("[IC] Publication PR created:",url);
 }catch(error){
  console.error("[IC] Branch pushed:",branchName);
  console.error("[IC] Failed to open PR; repository may need to enable GitHub Actions PR creation.");
  throw error;
 }
}
main();
