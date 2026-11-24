/**
 * Prepare a reviewed Pages CMS guide for a narrowly scoped publication PR.
 *
 * Pure module: it never writes files, opens PRs, or changes editorial status.
 * The action refuses drafts/unapproved content; approval must happen in CMS.
 */
const allowedLanguages=new Set(["en","pt-br"]);
const safeSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedCategories=new Set(["game-systems","nation-dungeons","mercenaries"]);
const imageBase="/images/guides/";
const sourceImage=/^\/images\/guides\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:png|jpg|jpeg|webp|gif)$/i;

function metadataValue(frontmatter,key){
 const re=new RegExp("^"+key+":[ \\t]*(.*?)\\s*$","m");
 const match=frontmatter.match(re);
 if(!match)return null;
 const value=match[1].trim();
 if(value.startsWith('"')&&value.endsWith('"')){
  try{return JSON.parse(value);}catch{throw Error("Invalid frontmatter: "+key);}
 }
 if(value.startsWith("'")&&value.endsWith("'"))return value.slice(1,-1);
 return value;
}

export function prepareGuidePublication(markdown,{language,translationKey}){
 if(!allowedLanguages.has(language)||typeof translationKey!=="string"||
   !safeSlug.test(translationKey)||translationKey.length>80)throw Error("Invalid language or translation key");
 if(typeof markdown!=="string"||markdown.length>250000)
   throw Error("Invalid guide file size");
 const frontmatter=markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 if(!frontmatter)throw Error("Guide must begin with YAML frontmatter");
 const get=key=>metadataValue(frontmatter[1],key);
 if(get("lang")!==language||get("translationKey")!==translationKey)
   throw Error("Guide filename, translation key, and language must match");
 if(!allowedCategories.has(get("category")))
   throw Error("Guide has an invalid category");
 if(get("draft")!=="false"||get("reviewStatus")!=="approved")
   throw Error("Set Draft = false and Editorial Status = Approved in Pages CMS before submitting for publication");
 const images=new Map();
 let output=markdown;
 for(const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)){
  const url=match[1];
  if(!url.startsWith(imageBase))continue;
  if(!sourceImage.test(url)||url.split("/").includes("..")||url.split("/").includes("."))
   throw Error("Unsupported or unsafe guide image URL");
  const filename=url.slice(url.lastIndexOf("/")+1);
  const destination=imageBase+translationKey+"/"+filename;
  const old=images.get(destination);
  if(old&&old!==url)throw Error("Two source images use the same target filename");
  images.set(destination,url);
  output=output.replaceAll(url,destination);
 }
 if(images.size>40)throw Error("Too many images in a single guide");
 const imageCopies=[...images.entries()].map(([targetUrl,sourceUrl])=>({
  from:"public"+sourceUrl,
  to:"public"+targetUrl,
 }));
 return {
  path:"src/content/guides/"+language+"/"+translationKey+".md",
  markdown:output,
  imageCopies,
 };
}
