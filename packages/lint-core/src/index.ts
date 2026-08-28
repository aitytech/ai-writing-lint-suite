import { TextlintKernel } from "@textlint/kernel";
import type { TextlintPluginCreator } from "@textlint/kernel";
import * as textPluginModule from "@textlint/textlint-plugin-text";
import * as markdownPluginModule from "@textlint/textlint-plugin-markdown";
import presetEn from "@aitytech/textlint-rule-preset-ai-writing-en";
import presetVi from "@aitytech/textlint-rule-preset-ai-writing-vi";
// Uses our own aitytech fork (converted from a pure mirror 2026-08-29), not the upstream
// @textlint-ja npm package — this is the one that will carry AITYTECH's own rule additions
// (no-em-dash-overuse, no-ai-artifact-leakage, tech-writing-guideline's new categories) once
// they're ported to Japanese, same as EN/VI.
import presetJa from "@aitytech/textlint-rule-preset-ai-writing-ja";

// Both plugin packages end up DOUBLE-wrapped under `.default.default` when imported as ESM here
// (each layer of CJS<->ESM interop -- the package's own build, then Node's loader -- adds one
// `.default`), confirmed by direct inspection at runtime. Unwrap until we find the real
// Processor-bearing object rather than hardcoding a fixed unwrap depth, so this keeps working if
// either side changes its interop shape.
function unwrapPlugin(mod: unknown): TextlintPluginCreator {
    let current = mod as { default?: unknown; Processor?: unknown };
    for (let i = 0; i < 4 && current && !current.Processor && current.default; i++) {
        current = current.default as typeof current;
    }
    return current as TextlintPluginCreator;
}
const textPlugin = unwrapPlugin(textPluginModule);
const markdownPlugin = unwrapPlugin(markdownPluginModule);

/**
 * Shared lint engine for ai-writing-lint-suite (web, iOS, macOS). This package does NOT
 * reimplement or fork any detection logic — it only wires the already-tested
 * @aitytech/textlint-rule-preset-ai-writing-en/-vi presets into a single, simple API that
 * every app in this monorepo calls the same way, so behavior can never drift between
 * platforms. Any rule fix/addition happens in the EN/VI repos only, never here.
 */

export type Language = "en" | "vi" | "ja";

export type LintSeverity = "error" | "warning" | "info";

export type LintFinding = {
    ruleId: string;
    message: string;
    line: number;
    column: number;
    /** Character offset into the input text, for editor/UI highlighting. */
    index: number;
    severity: LintSeverity;
};

export type LintResult = {
    language: Language;
    findings: LintFinding[];
    /** Convenience counts, since most UIs want to show a summary badge. */
    counts: Record<LintSeverity, number>;
};

const kernel = new TextlintKernel();

function severityFromNumber(n: number): LintSeverity {
    // Matches @textlint/kernel's TextlintRuleSeverityLevelKeys: none=0, warning=1, error=2, info=3.
    if (n === 2) return "error";
    if (n === 1) return "warning";
    return "info";
}

function presetFor(language: Language) {
    const preset = language === "en" ? presetEn : language === "vi" ? presetVi : presetJa;
    // All three presets export { rules, rulesConfig } — normalize the (default-export vs
    // named-export) shape difference that can occur across bundlers/module systems.
    const normalized = (preset as { default?: typeof preset }).default ?? preset;
    return normalized;
}

/**
 * Lint a plain-text or Markdown string for AI-writing tells using the AITYTECH EN/VI presets.
 * Runs entirely client-side — no network call, no text ever leaves the caller's process.
 */
export async function lintText(
    text: string,
    options: { language: Language; ext?: ".txt" | ".md" } = { language: "en" }
): Promise<LintResult> {
    const { language, ext = ".md" } = options;
    const preset = presetFor(language);
    // The EN/VI presets' rulesConfig values are correct at runtime (each is `true` or a literal
    // `{ severity: "error" | "info" }`), but TS widens `severity` to `string` when read through a
    // dynamic key lookup like this. Cast at this single boundary rather than loosening the
    // preset packages' own (correctly strict) types.
    const rules = Object.entries(preset.rules).map(([ruleId, rule]) => {
        const config = preset.rulesConfig[ruleId as keyof typeof preset.rulesConfig];
        return { ruleId, rule, options: config as boolean | { severity: "error" | "warning" | "info" } };
    }) as Parameters<TextlintKernel["lintText"]>[1]["rules"];

    const result = await kernel.lintText(text, {
        plugins: [
            { pluginId: "text", plugin: textPlugin },
            { pluginId: "markdown", plugin: markdownPlugin }
        ],
        rules,
        ext
    });

    const findings: LintFinding[] = result.messages.map((m) => ({
        ruleId: m.ruleId,
        message: m.message,
        line: m.line,
        column: m.column,
        index: m.index,
        severity: severityFromNumber(m.severity)
    }));

    const counts: Record<LintSeverity, number> = { error: 0, warning: 0, info: 0 };
    for (const f of findings) counts[f.severity]++;

    return { language, findings, counts };
}

/**
 * Best-effort language auto-detection so UIs can offer a single "paste your text" box without
 * making the user pick a language first. Deliberately simple (script/diacritic presence) rather
 * than pulling in a full language-detection dependency — good enough to route to the right
 * preset; the user can always override. Checked in order: Japanese script first (Hiragana/
 * Katakana/Kanji are unambiguous, unlike Latin-script languages which need diacritic heuristics).
 */
export function detectLanguage(text: string): Language {
    const jaScript = /[぀-ゟ゠-ヿ一-鿿]/; // Hiragana, Katakana, CJK ideographs
    if (jaScript.test(text)) return "ja";
    const viDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    return viDiacritics.test(text) ? "vi" : "en";
}
