// Stable locale IDs shared by Astro, content validation, routes and translation automation.
export const LOCALE_IDS = ["en","pt-br","fr","de","es","ko","zh-hans","ja"];
export const NEW_GUIDE_LOCALES = LOCALE_IDS.slice(2);
export const LOCALE_NAMES = {
 en:"English","pt-br":"Português (Brasil)",fr:"Français",de:"Deutsch",
 es:"Español",ko:"한국어","zh-hans":"简体中文",ja:"日本語",
};
export const localeTag = lang => ({"pt-br":"pt-BR","zh-hans":"zh-Hans"}[lang] ?? lang);
export const localePrefix = lang => lang==="en"?"":"/"+lang;
export const isLocale = lang => LOCALE_IDS.includes(lang);
export const legacyLocale = lang => lang==="pt-br"?"pt-br":"en";
export const LOCALIZED_CATALOG_PATHS = ["/items/","/events/","/mercenaries/","/mercenaries/database/","/mercenaries/skills/","/items/database/","/monsters/","/monsters/profile/","/items/profile/","/maps/"];
export const LOCALIZED_COMPLEMENTARY_PATHS = ["/items/boxes/","/items/legendary/","/items/legendary/dell-artes-ambition/"];
export const LOCALIZED_TOOL_PATHS = ["/tools/","/tools/nation-dungeons/","/tools/crafting/","/tools/market-prices/","/tools/market-prices/research/","/tools/data-quality/","/tools/awakening/","/tools/talents/"];
export const catalogPath = (lang,path) => localePrefix((LOCALIZED_CATALOG_PATHS.includes(path)||LOCALIZED_COMPLEMENTARY_PATHS.includes(path)||LOCALIZED_TOOL_PATHS.includes(path))?lang:legacyLocale(lang))+path;
// Preserve dedicated reviewed articles; additional source-only IDs use the localized data explorer.
export const equipmentProfilePath=(lang,id,reviewed)=>NEW_GUIDE_LOCALES.includes(lang)&&!reviewed
 ?catalogPath(lang,"/items/profile/")+"?id="+encodeURIComponent(id)
 :localePrefix(lang)+"/items/"+encodeURIComponent(id)+"/";
export const guidePath = (lang,slug="") => localePrefix(lang)+"/guides/"+(slug?slug+"/":"");
export const localizedPaths = path => Object.fromEntries(LOCALE_IDS.map(lang=>[lang,localePrefix(lang)+path]));
export function browserLocale(value){
 const tag=String(value??"").toLowerCase();
 if(tag==="zh-hant"||/^zh-(tw|hk|mo)(-|$)/.test(tag)||tag.startsWith("zh-hant-"))return null;
 const primary=tag.split("-")[0];
 return primary==="pt"?"pt-br":primary==="zh"?"zh-hans":isLocale(primary)?primary:null;
}
export function languageDestination({lang,path,guideAlternates,itemAlternates}){
 if(!isLocale(lang))return null;
 const normalized=path.endsWith("/")?path:path+"/";
 if(guideAlternates)return guideAlternates[lang]??guidePath(lang);
 const plain=normalized.replace(/^\/(?:pt-br|fr|de|es|ko|zh-hans|ja)(?=\/)/,"");
 if(plain==="/")return localePrefix(lang)+"/";
 if(plain==="/guides/")return guidePath(lang);
 const equipment=/^\/items\/([1-9]\d*)\/$/.exec(plain);
 if(equipment)return itemAlternates?.[lang]??equipmentProfilePath(lang,equipment[1],false);
 if(/^\/items\/boxes\/[^/]+\/$/.test(plain))return itemAlternates?.[lang]??catalogPath(lang,"/items/boxes/");
 if(LOCALIZED_TOOL_PATHS.includes(plain))return catalogPath(lang,plain);
 if(LOCALIZED_COMPLEMENTARY_PATHS.includes(plain))return catalogPath(lang,plain);
 if(LOCALIZED_CATALOG_PATHS.includes(plain))return catalogPath(lang,plain);
 if(/^\/(events|mercenaries|items|monsters|tools|explore)(\/|$)/.test(plain)){
  if(NEW_GUIDE_LOCALES.includes(lang))return localePrefix(lang)+"/";
  const listing=/^\/(events|mercenaries|monsters)(\/|$)/.exec(plain);
  return localePrefix(lang)+(listing?"/"+listing[1]+"/":plain);
 }
 return localePrefix(lang)+"/";
}
