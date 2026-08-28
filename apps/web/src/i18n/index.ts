import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import vi from "./locales/vi.json";
import ja from "./locales/ja.json";

/**
 * UI-chrome translations for the 3 languages Tell-Tale lints (EN/VI/JA). Kept separate from
 * the lint findings themselves -- those already come pre-localized straight from each
 * language's textlint preset (the EN preset writes English messages, VI writes Vietnamese,
 * JA writes Japanese), so there is nothing to translate there. This file only covers static
 * interface strings: labels, counts, the footer note, etc.
 *
 * The UI locale is driven by the same EN/VI/JA toggle used for lint language (see App.tsx),
 * not a separate picker -- picking "VI" means both the lint preset AND the interface switch
 * to Vietnamese, matching how the toggle reads to someone using the app.
 */
void i18next.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        vi: { translation: vi },
        ja: { translation: ja }
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false
});

export default i18next;
