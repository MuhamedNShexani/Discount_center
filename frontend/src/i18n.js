import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { resources } from "./i18nResources";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ku",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Prefer saved choice; otherwise Kurdish (do not auto-pick browser English).
      order: ["localStorage"],
      caches: ["localStorage"],
    },
  });

const RTL_LANGUAGE_CODES = new Set(["ar", "ku"]);
const originalDir = i18n.dir.bind(i18n);
/** i18next does not mark ku/ar as RTL by default; align with App layout `dir`. */
i18n.dir = (lng) => {
  const code = String(lng || i18n.resolvedLanguage || i18n.language || "en")
    .split("-")[0]
    .toLowerCase();
  if (RTL_LANGUAGE_CODES.has(code)) return "rtl";
  return originalDir(lng) === "rtl" ? "rtl" : "ltr";
};

export default i18n;
