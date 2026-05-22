"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Language, translations, loadLanguage, languages } from "@/lib/i18n";

type TranslationType = any;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [t, setT] = useState<TranslationType>(translations.en);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    if (translations[lang]) {
      setT(translations[lang]);
      return;
    }
    setIsLoading(true);
    try {
      const loaded = await loadLanguage(lang);
      setT(loaded);
    } catch {
      setT(translations.en);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && languages.includes(saved)) {
      if (saved === "en") return;
      handleLanguageChange(saved);
      return;
    }
    const browserLang = navigator.language.toLowerCase();
    const langMap: Record<string, Language> = {
      zh: "zh", ja: "ja", ko: "ko", es: "es",
      fr: "fr", de: "de", pt: "pt", ru: "ru",
      ar: "ar", hi: "hi",
    };
    for (const [prefix, lang] of Object.entries(langMap)) {
      if (browserLang.startsWith(prefix)) {
        handleLanguageChange(lang);
        return;
      }
    }
  }, [handleLanguageChange]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
