"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext({
  language: "FR",
  setLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("FR");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("hotel-atlas-language");
    if (savedLanguage === "FR" || savedLanguage === "EN") {
      setLanguageState(savedLanguage);
      document.documentElement.lang = savedLanguage.toLowerCase();
      return;
    }
    document.documentElement.lang = "fr";
  }, []);

  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("hotel-atlas-language", nextLanguage);
    document.documentElement.lang = nextLanguage.toLowerCase();
  }

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
