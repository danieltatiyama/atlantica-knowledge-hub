import {LOCALE_IDS} from "../src/i18n/locales.mjs";

// These are source synchronization states, not language-quality assessments.
const labels={
 missing:"Missing",
 "awaiting-review":"Draft / review",
 current:"Current",
 "manual-untracked":"Manual / untracked",
 "stale-draft":"Stale draft",
 "stale-published":"Stale published",
};
const targetLocales=LOCALE_IDS.filter(locale=>locale!=="en");
const safeSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function editorialReport(entries,skipped=[]){
 const groups=new Map();
 const counts=Object.fromEntries(Object.keys(labels).map(state=>[state,0]));
 let published=0, candidates=0;
 for(const entry of entries){
  const {slug,lang,state}=entry;
  if(!safeSlug.test(slug)||!targetLocales.includes(lang)||!Object.hasOwn(labels,state))
   throw Error("Invalid editorial report entry");
  if(!groups.has(slug))groups.set(slug,new Map());
  const group=groups.get(slug);
  if(group.has(lang))throw Error("Duplicate editorial report entry: "+slug+"/"+lang);
  group.set(lang,entry);
  counts[state]++;
  if(entry.published===true)published++;
  if(entry.candidate)candidates++;
 }
 for(const [slug,group] of groups)
  if(group.size!==targetLocales.length)throw Error("Incomplete locale matrix: "+slug);
 const lines=[
  "# Guide translation status",
  "",
  "Read-only snapshot of approved English guides on main. Draft English sources are excluded.",
  "",
  "- Approved English source guides: "+groups.size,
  "- Translation slots: "+entries.length,
  "- Published translations: "+published+" / "+entries.length+" (publication is independent of source synchronization)",
  "- Review candidates: "+candidates,
  "- Request export exceptions: "+skipped.length+" (see status.json)",
  "",
  "| Source guide | "+LOCALE_IDS.map(lang=>lang.toUpperCase()).join(" | ")+" |",
  "|"+Array(LOCALE_IDS.length+1).fill("---").join("|")+"|",
 ];
 for(const [slug,group] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
  lines.push("| "+slug+" | Source | "+targetLocales.map(lang=>{
   const entry=group.get(lang);
   return labels[entry.state]+(entry.published===true?" (public)":"")+(entry.candidate?" + candidate":"");
  }).join(" | ")+" |");
 }
 lines.push("","## Synchronization totals","","| State | Translations |","|---|---:|");
 for(const [state,label] of Object.entries(labels))lines.push("| "+label+" | "+counts[state]+" |");
 lines.push("","## Next actions","",
  "- Missing: export and translate the request, then review the new draft.",
  "- Draft / review: review the existing draft; do not regenerate it.",
  "- Stale: stage or review a separate revision candidate. A published version stays online until the replacement is approved.",
  "- Manual / untracked: verify manually; never overwrite these translations automatically.",
  "- Current: source hash matches; this is not proof of native-speaker review.",
  "",
  "Download the guide-translation-requests artifact for status.json, hashes, candidate paths and available translation requests.",
  "No translation provider, secrets, publishing or repository writes are needed for this report.","");
 return lines.join("\n");
}
