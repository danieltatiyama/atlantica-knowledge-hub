
import {
  defaultLang,
  ui,
  type Lang,
  type TranslationKey,
} from "./ui";

export function getLangFromUrl(url: URL): Lang {
  const [, candidate] = url.pathname.split("/");

  if (candidate && candidate in ui) {
    return candidate as Lang;
  }

  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
