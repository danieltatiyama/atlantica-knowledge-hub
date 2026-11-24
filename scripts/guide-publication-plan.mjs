/**
 * Build a tightly scoped, reproducible publication payload from a reviewed guide.
 * Importing this module never modifies files or calls GitHub.
 */
const imageRef=/!\[[^\]]*\]\((\/images\/guides\/[^)\s]+)\)/g;
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const supportedImage=/^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpg|jpeg|webp|gif)$/i;

function frontmatterField(document,key){
 const frontmatter=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(document)?.[1];
 if(!frontmatter)throw Error("Guide must have YAML frontmatter");
 const match=frontmatter.match(new RegExp("^"+key+":\\s*(.*?)\\s*$","m"));
 if(!match)throw Error("Missing guide frontmatter: "+key);
 return match[1].trim().replace(/^(["'])(.*)\1$/,"$2");
}

export function planGuidePublication({markdown,lang,slug,readSourceImage}){
 if(typeof markdown!=="string"||markdown.length<20||markdown.length>250000||
  !["en","pt-br"].includes(lang)||!slugPattern.test(slug)||
  typeof readSourceImage!=="function")
  throw Error("Invalid guide publication request");
 if(frontmatterField(markdown,"lang")!==lang||
  frontmatterField(markdown,"translationKey")!==slug)
  throw Error("Guide identity does not match selected language and key");
 if(frontmatterField(markdown,"draft")!=="false"||
  frontmatterField(markdown,"reviewStatus")!=="approved")
  throw Error("Guide must be approved and Draft must be off");
 const articlePath="src/content/guides/"+lang+"/"+slug+".md";
 let content=markdown;
 const unique=new Map();
 for(const match of markdown.matchAll(imageRef)){
  const original=match[1];
  if(unique.has(original))continue;
  const relative=original.slice("/images/guides/".length);
  // CMS uploads may use generic filenames; published assets get an article namespace.
  const parts=relative.split("/");
  if(parts.length>2||
   (parts.length===2&&parts[0]!==slug)||
   !supportedImage.test(parts.at(-1)??""))
   throw Error("Unsupported or unsafe guide image path: "+original);
  const destination="public/images/guides/"+slug+"/"+parts.at(-1);
  const bytes=readSourceImage("public"+original);
  if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>8000000)
   throw Error("Guide image is missing, invalid, or exceeds 8 MB: "+original);
  unique.set(original,{path:destination,content:bytes});
 }
 if(unique.size>60)throw Error("More than 60 guide images require separate review");
 const destNames=new Set();
 for(const [old,img] of unique){
  if(destNames.has(img.path))throw Error("Conflicting guide image destination");
  destNames.add(img.path);
  content=content.replaceAll(old,"/"+img.path.replace(/^public\//,""));
 }
 return {articlePath,content,images:[...unique.values()],imageCount:unique.size};
}
