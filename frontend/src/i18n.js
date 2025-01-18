import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationEN from "./locales/en/translation.json";
import translationDE from "./locales/de/translation.json";
import translationES from "./locales/es/translation.json";

export const availableLanguages = [
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "es", name: "Español" },
  ];

const resources = {
  en: { translation: translationEN },
  de: { translation: translationDE },
  es: { translation: translationES },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Standardsprache
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
