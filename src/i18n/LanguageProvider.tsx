"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translate, type Language } from "./translate";
import { languageStorage } from "@/storage/storage";
type Context = {
  language: Language;
  locale: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
  tn: (value: ReactNode) => ReactNode;
};
// Isolated components/tests default to English; the application starts in Chinese.
const Context = createContext<Context>({
  language: "en-US",
  locale: "en-US",
  setLanguage: () => {},
  t: (s) => s,
  tn: (v) => v,
});
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setValue] = useState<Language>("zh-CN");
  useEffect(() => {
    try {
      const stored = languageStorage.read();
      if (stored === "en-US" || stored === "zh-CN") setValue(stored);
    } catch {
      /* Browsing still works when preference storage is unavailable. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "zh-CN"
        ? "Reality Rank — 现实主排位"
        : "Reality Rank — Your real main game";
  }, [language]);
  const setLanguage = (value: Language) => {
    setValue(value);
    try {
      languageStorage.write(value);
    } catch {
      /* Keep the in-session choice if storage is full. */
    }
  };
  const t = (text: string) => translate(text, language);
  // Translate text children through React, never by mutating the browser DOM.
  const tn = (value: ReactNode): ReactNode =>
    typeof value === "string"
      ? t(value)
      : Array.isArray(value)
        ? value.map(tn)
        : value;
  return (
    <Context.Provider
      value={{ language, locale: language, setLanguage, t, tn }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLanguage() {
  return useContext(Context);
}
