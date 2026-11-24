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
export const LOCALIZED_CATALOG_PATHS = ["/items/","/events/","/mercenaries/","/items/database/"];
export const catalogPath = (lang,path) => localePrefix(LOCALIZED_CATALOG_PATHS.includes(path)?lang:legacyLocale(lang))+path;
export const guidePath = (lang,slug="") => localePrefix(lang)+"/guides/"+(slug?slug+"/":"");
export const localizedPaths = path => Object.fromEntries(LOCALE_IDS.map(lang=>[lang,localePrefix(lang)+path]));
export function browserLocale(value){
 const tag=String(value??"").toLowerCase();
 if(tag==="zh-hant"||/^zh-(tw|hk|mo)(-|$)/.test(tag)||tag.startsWith("zh-hant-"))return null;
 const primary=tag.split("-")[0];
 return primary==="pt"?"pt-br":primary==="zh"?"zh-hans":isLocale(primary)?primary:null;
}
export function languageDestination({lang,path,guideAlternates}){
 if(!isLocale(lang))return null;
 const normalized=path.endsWith("/")?path:path+"/";
 if(guideAlternates)return guideAlternates[lang]??guidePath(lang);
 const plain=normalized.replace(/^\/(?:pt-br|fr|de|es|ko|zh-hans|ja)(?=\/)/,"");
 if(plain==="/")return localePrefix(lang)+"/";
 if(plain==="/guides/")return guidePath(lang);
 if(LOCALIZED_CATALOG_PATHS.includes(plain))return catalogPath(lang,plain);
 if(/^\/(events|mercenaries|items|monsters|tools|explore)(\/|$)/.test(plain)){
  if(NEW_GUIDE_LOCALES.includes(lang))return localePrefix(lang)+"/";
  const listing=/^\/(events|mercenaries|monsters)(\/|$)/.exec(plain);
  return localePrefix(lang)+(listing?"/"+listing[1]+"/":plain);
 }
 return localePrefix(lang)+"/";
}
