"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ml";

const LanguageContext = createContext<{ lang: Lang; toggle: () => void }>({
  lang: "en",
  toggle: () => {},
});

export function useLang() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "ml") setLang("ml");
  }, []);

  const toggle = () => {
    setLang((prev) => {
      const next = prev === "en" ? "ml" : "en";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}
