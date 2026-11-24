/** Canonical locale registry; only EN/PT-BR currently have full module coverage. */
export const localeIds = /** @type {const} */ (["en","pt-br","fr","de","es","ko","zh-hans","ja"]);
export const localeNames = Object.freeze({
  "en": "English",
  "pt-br": "Português (Brasil)",
  "fr": "Français",
  "de": "Deutsch",
  "es": "Español",
  "ko": "한국어",
  "zh-hans": "简体中文",
  "ja": "日本語"
});
export const localeTags = Object.freeze({
  "en": "en-US",
  "pt-br": "pt-BR",
  "fr": "fr",
  "de": "de",
  "es": "es",
  "ko": "ko",
  "zh-hans": "zh-Hans",
  "ja": "ja"
});
export const additionalLocales = /** @type {const} */ (["fr","de","es","ko","zh-hans","ja"]);
export const isLocale = value => typeof value === "string" && localeIds.includes(value);
export const localePrefix = lang => lang === "en" ? "" : "/"+lang;
export const isFullLocale = lang => lang === "en" || lang === "pt-br";
export const moduleLocale = lang => lang === "pt-br" ? "pt-br" : "en";
export const localePaths = path => Object.fromEntries(localeIds.map(lang => [lang,localePrefix(lang)+path]));
export function browserLocale(languages){
 for(const value of languages??[]){
  const base=String(value).toLowerCase().split("-")[0];
  const candidate=base==="pt"?"pt-br":base==="zh"?"zh-hans":base;
  if(isLocale(candidate))return candidate;
 }
 return "en";
}
