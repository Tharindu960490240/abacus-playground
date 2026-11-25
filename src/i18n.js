"use client";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English only for now. To add a language, add another resources entry and a
// language switch that calls i18n.changeLanguage("xx").
const en = {
  translation: {
    loading: "Loading",
    password: {
      strong: "Strong password",
      needs: "Your password needs",
      done: "done",
      rule: {
        length: "At least 8 characters",
        upper: "An upper-case letter (A–Z)",
        lower: "A lower-case letter (a–z)",
        number: "A number (0–9)",
        symbol: "A symbol, e.g. ! @ # $ %",
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
