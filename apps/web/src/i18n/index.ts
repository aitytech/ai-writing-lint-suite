import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import vi from "./locales/vi.json";
import ja from "./locales/ja.json";

/**
 * UI-chrome translations for the 3 languages PenCheck lints (EN/VI/JA). Kept separate from
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
    returnNull: false,
    // Without this, i18next defers its own init to the next tick (its default behavior in a
    // browser context, meant for language-detector plugins that need to run first) -- but all
    // resources here are inline, nothing async to wait for, and main.tsx renders <App/>
    // synchronously right after this call with no <Suspense> boundary above it. react-i18next's
    // useTranslation() suspends by default while i18next isn't ready, and an unhandled suspend
    // with no Suspense boundary above it can silently render nothing into #root -- a defensive
    // fix, tried as the first hypothesis for a real blank-page bug this app hit (the actual
    // cause turned out to be unrelated: `prh`'s fromYAML() throwing on a stubbed browser `path`
    // module, fixed via vite.config.ts's path-browserify alias). Kept anyway since it's cheap
    // and removes a real (if not the triggering) failure mode. Named `initAsync` as of i18next
    // 26.x -- older docs/examples call this `initImmediate`, same option, inverted-sense name.
    initAsync: false
});

export default i18next;
