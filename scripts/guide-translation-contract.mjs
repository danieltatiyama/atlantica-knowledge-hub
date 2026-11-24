import {createHash} from "node:crypto";
import {parse,stringify} from "yaml";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";

export const TARGET_LOCALES=LOCALE_IDS.filter(lang=>lang!=="en");
export const GLOSSARY_VERSION="1";
export const GAME_TERMS=[
 "Atlantica VIP Material Bag","Buff Item Auto-Consume Slots","Aca VIP Shop",
 "Atlantica Online","Olympus Tower","Tower of Olympus","Aca VIP","Yggdrasil",
 "Alcatraz","Avalon","Babel","Sylvia","ALVL","F2P","GC","HOT","ItemID","CharID","VIP",
];
const allowedCategories=["nation-dungeons","mercenaries","game-systems"];
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const sha256=value=>createHash("sha256").update(value,"utf8").digest("hex");

export function parseGuide(raw){
 if(typeof raw!=="string"||raw.length>100000)throw Error("Guide exceeds supported size");
 const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 if(!match)throw Error("Missing YAML frontmatter");
 const meta=parse(match[1],{uniqueKeys:true,maxAliasCount:0});
 if(!meta||typeof meta!=="object"||Array.isArray(meta))throw Error("Invalid metadata");
 return {meta,body:raw.slice(match[0].length).replace(/\r\n/g,"\n")};
}
export function readEnglishGuide(raw,slug){
 const parsed=parseGuide(raw),m=parsed.meta;
 if(m.lang!=="en"||m.translationKey!==slug||!slugPattern.test(slug)||slug.length>80||
  typeof m.title!=="string"||!m.title.trim()||typeof m.description!=="string"||!m.description.trim()||
  !allowedCategories.includes(m.category)||m.draft!==false||m.reviewStatus!=="approved"||
  !/^\d{4}-\d{2}-\d{2}$/.test(String(m.updatedAt)))throw Error("Source must be an approved published English guide with matching identity");
 return {...parsed,sourceHash:sha256(raw)};
}

// Deliberately conservative v1. Markdown that cannot be protected reliably is sent
// to manual review instead of being silently converted or partially translated.
function escapeRegex(value){return value.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&");}
const termPattern=GAME_TERMS.map(escapeRegex).join("|");
const protectedPattern=new RegExp("("+[
 "\\x60[^\\x60\\n]+\\x60",
 "!\\[[^\\]\\n]*\\]\\([^\\n()]+\\)",
 "\\[[^\\]\\n]*\\]\\([^\\n()]+\\)",
 "https?:\\/\\/[^\\s<>]+",
 "(?<![A-Za-z0-9_])(?:"+termPattern+")(?![A-Za-z0-9_])",
 "(?<![A-Za-z0-9_])[+-]?\\d+(?:[.,:]\\d+)*(?:%|h|s|m)?(?![A-Za-z0-9_])",
 "\\*\\*|__|\\*|~{2}|\\|"
].join("|")+")","g");
const tokenPattern=/⟦AO\d{5}⟧/g;
const forbidden=/(?:^|\n)[ \t]*(?:\x60{3}|~{3}|<|!\[.*\]\[|\[[^\]]+\]:)|<[^>\n]+>|\\[^\n]|⟦AO|\x60{2}/;
function protect(value){
 if(forbidden.test(value))throw Error("Unsupported Markdown or reserved token; manual translation required");
 const tokens=[];
 const masked=value.replace(protectedPattern,match=>{
  const token="⟦AO"+String(tokens.length).padStart(5,"0")+"⟧";
  tokens.push({token,value:match});
  return token;
 });
 if(/[\[\]\x60<>]/.test(masked))throw Error("Unsupported inline Markdown; manual translation required");
 return {masked,tokens};
}
function restore(translated,part){
 if(typeof translated!=="string"||!translated.trim()||translated.length>Math.max(500,part.masked.length*8+100))throw Error("Invalid translated segment");
 if(/[\r\n<>]|[\[\]\x60\\]/.test(translated))throw Error("New Markdown syntax in translated segment");
 const actual=translated.match(tokenPattern)??[];
 const expected=part.tokens.map(x=>x.token);
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error("Protected token sequence changed");
 const remainder=translated.replace(tokenPattern,"");
 if(/[0-9*|~]|⟦|⟧/.test(remainder)||/https?:\/\//i.test(remainder))throw Error("New number, markup or link introduced");
 let result=translated;
 for(const item of part.tokens)result=result.replace(item.token,()=>item.value);
 return result;
}

export function prepareTranslation(raw,slug,lang){
 if(!TARGET_LOCALES.includes(lang))throw Error("Unsupported target language");
 const source=readEnglishGuide(raw,slug);
 const parts=[];
 const add=value=>{
  const part=protect(value);
  const id="s"+parts.length;
  parts.push({id,...part});
  return id;
 };
 const title=add(source.meta.title),description=add(source.meta.description);
 const lines=source.body.split("\n").map(line=>{
  if(!line.trim()||/^\s*(?:[-*_]\s*){3,}$/.test(line)||
    /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line))return {literal:line};
  if(/^\s{4}|\t/.test(line))throw Error("Indented code or tab indentation requires manual translation");
  if(/^\s*(?:\x60{3}|~{3}|<)/.test(line))throw Error("Unsupported block syntax");
  // Retain headings, quotes, list markers and indentation outside translation.
  const match=line.match(/^(\s*(?:(?:#{1,6} |>\s*|[-+*] |\d+[.)] ))*)(.*)$/);
  const prefix=match[1],value=match[2].trimEnd();
  if(!value)return {literal:line};
  if(/^\|/.test(value)){
   // Preserve column count and separators, translate each cell independently.
   if(!value.endsWith("|"))throw Error("Tables must have leading and trailing pipes");
   const cells=value.slice(1,-1).split("|");
   return {prefix,cells:cells.map(cell=>cell.trim()?{id:add(cell.trim())}:{literal:""})};
  }
  // A standalone protected link/image is kept unchanged, including its CMS options.
  const part=protect(value);
  if(part.masked.replace(tokenPattern,"").trim()==="")return {literal:line};
  return {prefix,id:add(value),suffix:line.slice(prefix.length+value.length)};
 });
 if(parts.length>500)throw Error("Too many segments; manual review required");
 return {source,slug,lang,title,description,lines,parts};
}

export function translationRequest(plan){
 return {schemaVersion:1,targetLanguage:plan.lang,glossaryVersion:GLOSSARY_VERSION,
  instructions:"Translate each segment from English. Return a JSON object with exactly the segment IDs as keys and translated single-line strings as values. Preserve every ⟦AO00000⟧ token exactly, in the same order. Do not add facts, numbers, links, formatting, or commentary. Translate all ordinary prose; preserve uncertainty and caveats.",
  segments:Object.fromEntries(plan.parts.map(p=>[p.id,p.masked]))};
}
export function finishTranslation(plan,response,{provider="manual",model="unspecified"}={}){
 if(!response||typeof response!=="object"||Array.isArray(response)||
   JSON.stringify(Object.keys(response).sort())!==JSON.stringify(plan.parts.map(p=>p.id).sort()))throw Error("Unexpected translated segment IDs");
 const values=Object.fromEntries(plan.parts.map(p=>[p.id,restore(response[p.id],p)]));
 const m=plan.source.meta;
 const metadata={title:values[plan.title],description:values[plan.description],translationKey:plan.slug,
  lang:plan.lang,category:m.category,...(m.subcategory?{subcategory:m.subcategory}:{}),
  updatedAt:String(m.updatedAt),draft:true,reviewStatus:"in-review",
  translationSourceHash:plan.source.sourceHash,translationMethod:"machine-assisted",
  translationProvider:provider,translationModel:model,translationGlossaryVersion:GLOSSARY_VERSION};
 const body=plan.lines.map(line=>"literal" in line?line.literal:
  "cells" in line?line.prefix+"| "+line.cells.map(c=>"id" in c?values[c.id]:c.literal).join(" | ")+" |":
  line.prefix+values[line.id]+line.suffix).join("\n");
 return "---\n"+stringify(metadata,{lineWidth:0})+"---\n"+body;
}
export function translationState(raw,sourceHash){
 if(raw==null)return "missing";
 const {meta}=parseGuide(raw);
 if(!meta.translationSourceHash)return "manual-untracked";
 if(meta.translationSourceHash===sourceHash)return meta.draft?"awaiting-review":"current";
 return meta.draft?"stale-draft":"stale-published";
}
