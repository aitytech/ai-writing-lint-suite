import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { EditorView, keymap } from "@codemirror/view";
import { EditorSelection, EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { lintText, detectLanguage, checkVietnameseSpelling, JapaneseUnavailableError } from "@aitytech/ai-writing-lint-core";
import type { Language, LintFinding, LintResult, LintSeverity } from "@aitytech/ai-writing-lint-core";
import { lintFindingsField, lintHoverTooltip, setFindings } from "./lint/decorations";
import { markdownLiveStyle } from "./lint/markdownTheme";

const LANGUAGE_MODES: Array<"auto" | Language> = ["auto", "en", "vi", "ja"];
const SEVERITIES: LintSeverity[] = ["error", "warning", "info"];
/** How many findings render before the list is truncated behind a "show more" button --
 * a document with thousands of tells would otherwise dump thousands of DOM nodes into the
 * sidebar at once. */
const FINDINGS_PAGE_SIZE = 30;

type ThemePref = "system" | "light" | "dark";
const THEME_STORAGE_KEY = "tell-tale-theme";
const THEME_CYCLE: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const THEME_ICON: Record<ThemePref, string> = { system: "◐", light: "☀︎", dark: "☾" };

function readStoredTheme(): ThemePref {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
}

/**
 * Heuristic 0-100 "clarity" score for the gauge -- a quick visual read, not a scoring
 * system to optimize against. Errors (hard AI-writing tells) weigh far more than info-level
 * notes (style nudges), so one real tell drops the score noticeably while a pile of minor
 * notes doesn't crater it.
 */
function clarityScore(counts: { error: number; warning: number; info: number }): number {
    const penalty = counts.error * 15 + counts.warning * 8 + counts.info * 3;
    return Math.max(0, Math.min(100, 100 - penalty));
}

const SAMPLE_DRAFT = `# 26 nhan vien AI

As an AI language model, this is a game-changer that will revolutionize how teams work in today's fast-paced digital world.

Our team measured a real drop in support tickets after the rollout last month, and that's the part worth writing about.`;

/** Debounce delay before running a lint pass after the user stops typing. */
const LINT_DEBOUNCE_MS = 400;

export function App() {
    const { t, i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);
    const debounceRef = useRef<number | undefined>(undefined);

    const [languageMode, setLanguageMode] = useState<"auto" | Language>("auto");
    const [result, setResult] = useState<LintResult | null>(null);
    const [isLinting, setIsLinting] = useState(false);
    const [activeFinding, setActiveFinding] = useState<LintFinding | null>(null);
    const [jaUnavailable, setJaUnavailable] = useState(false);
    const [themePref, setThemePref] = useState<ThemePref>(readStoredTheme);
    const [severityFilter, setSeverityFilter] = useState<LintSeverity | null>(null);
    const [visibleCount, setVisibleCount] = useState(FINDINGS_PAGE_SIZE);
    // Harper (EN grammar/spelling) is a ~8MB one-time WASM download -- opt-in, not loaded for
    // every visitor by default, to keep the app's default footprint light (see
    // lint-core/src/harper.ts and this app's grammarToggle i18n strings for the full
    // reasoning). checkEnglishGrammarRef caches the dynamically-imported function across
    // toggles/lint passes within a session so it only downloads once.
    const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(false);
    const [grammarLoading, setGrammarLoading] = useState(false);
    const checkEnglishGrammarRef = useRef<((text: string) => Promise<LintFinding[]>) | null>(null);

    function toggleSeverityFilter(severity: LintSeverity) {
        setSeverityFilter((prev) => (prev === severity ? null : severity));
        setVisibleCount(FINDINGS_PAGE_SIZE);
    }

    function jumpToFinding(f: LintFinding) {
        const view = viewRef.current;
        if (!view) return;
        const pos = Math.max(0, Math.min(f.range[0], view.state.doc.length));
        view.dispatch({ selection: EditorSelection.cursor(pos), scrollIntoView: true });
        view.focus();
    }

    useEffect(() => {
        if (themePref === "system") {
            delete document.documentElement.dataset.theme;
            window.localStorage.removeItem(THEME_STORAGE_KEY);
        } else {
            document.documentElement.dataset.theme = themePref;
            window.localStorage.setItem(THEME_STORAGE_KEY, themePref);
        }
    }, [themePref]);

    const effectiveLanguage = useMemo(() => {
        if (languageMode !== "auto") return languageMode;
        return result?.language ?? "en";
    }, [languageMode, result]);

    // The EN/VI/JA toggle drives BOTH the lint preset AND the interface language -- picking
    // "VI" should mean the whole app reads in Vietnamese, not just the findings. Lint findings
    // themselves need no separate translation step: each preset already writes its messages in
    // its own language (verified against the installed EN/VI/JA packages directly).
    useEffect(() => {
        void i18n.changeLanguage(effectiveLanguage);
    }, [effectiveLanguage, i18n]);

    async function runLint(text: string, langMode: "auto" | Language) {
        const language = langMode === "auto" ? detectLanguage(text) : langMode;
        setIsLinting(true);
        try {
            let next = await lintText(text, { language, ext: ".md" });

            // Real spelling/grammar findings, additive to the AI-writing-tell findings
            // above. VI (nspell) is small enough to always run; EN (Harper) is opt-in (see
            // grammarCheckEnabled's own comment) and lazily imported so its ~8MB WASM never
            // enters the initial bundle for visitors who never enable it.
            let extra: LintFinding[] = [];
            if (language === "vi") {
                extra = await checkVietnameseSpelling(text);
            } else if (language === "en" && grammarCheckEnabled) {
                if (!checkEnglishGrammarRef.current) {
                    setGrammarLoading(true);
                    const mod = await import("@aitytech/ai-writing-lint-core/harper");
                    checkEnglishGrammarRef.current = mod.checkEnglishGrammar;
                    setGrammarLoading(false);
                }
                extra = await checkEnglishGrammarRef.current(text);
            }
            if (extra.length > 0) {
                next = {
                    ...next,
                    findings: [...next.findings, ...extra],
                    counts: {
                        error: next.counts.error + extra.filter((f) => f.severity === "error").length,
                        warning: next.counts.warning + extra.filter((f) => f.severity === "warning").length,
                        info: next.counts.info + extra.filter((f) => f.severity === "info").length
                    }
                };
            }

            setResult(next);
            setJaUnavailable(false);
            viewRef.current?.dispatch({ effects: setFindings.of(next.findings) });
        } catch (error) {
            if (error instanceof JapaneseUnavailableError) {
                // Known gap, not a crash: kuromoji/zlibjs doesn't load in this bundled
                // environment yet. Surface it in the ledger instead of an unhandled rejection.
                setJaUnavailable(true);
                setResult({ language: "ja", findings: [], counts: { error: 0, warning: 0, info: 0 } });
                viewRef.current?.dispatch({ effects: setFindings.of([]) });
            } else {
                throw error;
            }
        } finally {
            setIsLinting(false);
        }
    }

    function scheduleLint(text: string, langMode: "auto" | Language) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            void runLint(text, langMode);
        }, LINT_DEBOUNCE_MS);
    }

    useEffect(() => {
        if (!containerRef.current) return;

        const state = EditorState.create({
            doc: SAMPLE_DRAFT,
            extensions: [
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                markdown(),
                EditorView.lineWrapping,
                lintFindingsField,
                lintHoverTooltip(),
                markdownLiveStyle,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        scheduleLint(update.state.doc.toString(), languageModeRef.current);
                    }
                })
            ]
        });

        const view = new EditorView({ state, parent: containerRef.current });
        viewRef.current = view;
        void runLint(SAMPLE_DRAFT, "auto");

        return () => {
            view.destroy();
            viewRef.current = null;
            window.clearTimeout(debounceRef.current);
        };
        // Editor is mounted once; language-mode changes are read via a ref (below) inside
        // the update listener so we don't tear down/rebuild the view on every toggle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const languageModeRef = useRef(languageMode);
    useEffect(() => {
        languageModeRef.current = languageMode;
        if (viewRef.current) {
            void runLint(viewRef.current.state.doc.toString(), languageMode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [languageMode]);

    // Re-lint immediately when the grammar-check toggle flips, so turning it on/off updates
    // the ledger right away rather than waiting for the next keystroke.
    useEffect(() => {
        if (viewRef.current) {
            void runLint(viewRef.current.state.doc.toString(), languageModeRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grammarCheckEnabled]);

    const counts = result?.counts ?? { error: 0, warning: 0, info: 0 };
    const total = counts.error + counts.warning + counts.info;
    const allFindings = result?.findings ?? [];
    const visibleFindings = severityFilter ? allFindings.filter((f) => f.severity === severityFilter) : allFindings;
    const shownFindings = visibleFindings.slice(0, visibleCount);
    const remaining = visibleFindings.length - shownFindings.length;
    const score = clarityScore(counts);
    const gaugeColor = score >= 85 ? "var(--mark-teal)" : score >= 60 ? "var(--mark-amber)" : "var(--mark-red)";
    const gaugeStatusKey = score >= 85 ? "gauge.cleanStatus" : score >= 60 ? "gauge.minorStatus" : "gauge.needsStatus";
    const gaugeSubKey = score >= 85 ? "gauge.cleanSub" : score >= 60 ? "gauge.minorSub" : "gauge.needsSub";

    return (
        <div className="desk">
            <header className="masthead">
                <div className="masthead-inner">
                    <span className="glyph" aria-hidden="true">
                        🖋️
                    </span>
                    <h1>WriteLikeYou</h1>
                    <button
                        type="button"
                        className="theme-toggle"
                        aria-label={t("aria.themeToggle")}
                        title={themePref}
                        onClick={() => setThemePref((prev) => THEME_CYCLE[prev])}
                    >
                        {THEME_ICON[themePref]}
                    </button>
                    <div className="lang-toggle" role="group" aria-label={t("aria.language")}>
                        {LANGUAGE_MODES.map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                className={mode === languageMode ? "active" : ""}
                                onClick={() => setLanguageMode(mode)}
                            >
                                {t(`lang.${mode}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="stage">
                <main className="workbench">
                    <section className="manuscript" aria-label={t("aria.draft")}>
                        <div className="manuscript-inner">
                            <div ref={containerRef} className="cm-host" />
                        </div>
                    </section>

                    <aside className="ledger" aria-label={t("aria.findings")}>
                        <h2>{t("ledger.heading")}</h2>

                        <div className="gauge-row">
                            <div className="gauge-wrap">
                                <div
                                    className="gauge"
                                    style={{ "--score": score, "--gauge-color": gaugeColor } as CSSProperties}
                                />
                                <div className="gauge-readout">
                                    <span className="n">{score}</span>
                                </div>
                            </div>
                            <div className="gauge-copy">
                                <p className="status">{t(gaugeStatusKey)}</p>
                                <p className="sub">{t(gaugeSubKey)}</p>
                            </div>
                        </div>

                        <div className="ledger-status">
                            {isLinting ? t("ledger.checking") : t("ledger.findingsCount", { count: total })}
                            <span className="ledger-lang">{effectiveLanguage.toUpperCase()}</span>
                        </div>

                        {jaUnavailable && <p className="ja-gap-note">{t("jaGapNote")}</p>}

                        {effectiveLanguage === "en" && (
                            <label className="grammar-toggle" title={t("grammarToggle.hint")}>
                                <input
                                    type="checkbox"
                                    checked={grammarCheckEnabled}
                                    onChange={(e) => setGrammarCheckEnabled(e.target.checked)}
                                />
                                {grammarLoading ? t("grammarToggle.loading") : t("grammarToggle.label")}
                            </label>
                        )}

                        <div className="counts" role="group" aria-label={t("ledger.filterLabel")}>
                            {SEVERITIES.map((sev) => (
                                <button
                                    key={sev}
                                    type="button"
                                    className={`count count--${sev} ${severityFilter === sev ? "count--active" : ""}`}
                                    aria-pressed={severityFilter === sev}
                                    onClick={() => toggleSeverityFilter(sev)}
                                >
                                    <span className="n">{counts[sev]}</span>
                                    <span className="label">{t(`severity.${sev}`)}</span>
                                </button>
                            ))}
                        </div>

                        <ul className="findings-list">
                            {shownFindings.map((f, i) => (
                                <li
                                    key={`${f.ruleId}-${f.range[0]}-${i}`}
                                    className={`finding finding--${f.severity} ${activeFinding === f ? "active" : ""}`}
                                    onMouseEnter={() => setActiveFinding(f)}
                                    onMouseLeave={() => setActiveFinding(null)}
                                >
                                    <button type="button" className="finding-jump" onClick={() => jumpToFinding(f)}>
                                        <span className="rule-tag">{f.ruleId}</span>
                                        <p>{f.message}</p>
                                    </button>
                                </li>
                            ))}
                            {result && visibleFindings.length === 0 && !isLinting && (
                                <li className="finding finding--clean">{t("ledger.clean")}</li>
                            )}
                        </ul>

                        {remaining > 0 && (
                            <button
                                type="button"
                                className="show-more"
                                onClick={() => setVisibleCount((n) => n + FINDINGS_PAGE_SIZE)}
                            >
                                {t("ledger.showMore", { count: remaining })}
                            </button>
                        )}
                    </aside>
                </main>
            </div>

            <footer className="colophon">{t("footer.privacy")}</footer>
        </div>
    );
}
