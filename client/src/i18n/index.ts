import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files directly
import enCommon from "./locales/en/common.json";
import zhCommon from "./locales/zh/common.json";
import zhTwCommon from "./locales/zh-tw/common.json";
import frCommon from "./locales/fr/common.json";
import esCommon from "./locales/es/common.json";

// Resources object
const resources = {
  en: {
    common: enCommon,
  },
  zh: {
    common: zhCommon,
  },
  "zh-tw": {
    common: zhTwCommon,
  },
  fr: {
    common: frCommon,
  },
  es: {
    common: esCommon,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"]
    },

    interpolation: {
      escapeValue: false
    },

    defaultNS: "common",
    ns: ["common"],

    react: {
      useSuspense: false
    }
  });

export default i18n;
