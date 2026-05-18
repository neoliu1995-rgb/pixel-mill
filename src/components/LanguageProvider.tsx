"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations } from "@/lib/i18n";

type TranslationType = any;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const supportedLanguages: Language[] = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar", "hi"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && supportedLanguages.includes(saved)) {
      setLanguage(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("zh")) {
        setLanguage("zh");
      } else if (browserLang.startsWith("ja")) {
        setLanguage("ja");
      } else if (browserLang.startsWith("ko")) {
        setLanguage("ko");
      } else if (browserLang.startsWith("es")) {
        setLanguage("es");
      } else if (browserLang.startsWith("fr")) {
        setLanguage("fr");
      } else if (browserLang.startsWith("de")) {
        setLanguage("de");
      } else if (browserLang.startsWith("pt")) {
        setLanguage("pt");
      } else if (browserLang.startsWith("ru")) {
        setLanguage("ru");
      } else if (browserLang.startsWith("ar")) {
        setLanguage("ar");
      } else if (browserLang.startsWith("hi")) {
        setLanguage("hi");
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
