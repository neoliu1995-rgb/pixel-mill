import en from "./en";

export type Language = "en" | "zh" | "ja" | "ko" | "es" | "fr" | "de" | "pt" | "ru" | "ar" | "hi";

export type TranslationKeys = typeof en;

export const languages: Language[] = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar", "hi"];

export const translations: Record<string, TranslationKeys> = { en };

const languageModules = {
  zh: () => import("./zh"),
  ja: () => import("./ja"),
  ko: () => import("./ko"),
  es: () => import("./es"),
  fr: () => import("./fr"),
  de: () => import("./de"),
  pt: () => import("./pt"),
  ru: () => import("./ru"),
  ar: () => import("./ar"),
  hi: () => import("./hi"),
};

export async function loadLanguage(lang: Language): Promise<TranslationKeys> {
  if (translations[lang]) {
    return translations[lang];
  }
  if (lang === "en") {
    return translations.en;
  }
  const loader = languageModules[lang];
  if (!loader) {
    return translations.en;
  }
  const mod = await loader();
  translations[lang] = mod.default as TranslationKeys;
  return mod.default as TranslationKeys;
}
