import { TextlintKernel } from "@textlint/kernel";
import type { TextlintPluginCreator } from "@textlint/kernel";
import * as textPluginModule from "@textlint/textlint-plugin-text";
import * as markdownPluginModule from "@textlint/textlint-plugin-markdown";
import presetEn from "@aitytech/textlint-rule-preset-ai-writing-en";
import presetVi from "@aitytech/textlint-rule-preset-ai-writing-vi";
// The JA preset (our aitytech fork) is loaded lazily via dynamic import in presetFor(), NOT
// statically here like EN/VI. Originally this was load-bearing: the JA preset used to pull in
// kuromoji -> zlibjs, an unmaintained pre-ESM UMD package whose "is my global already
// defined" check broke under bundler rewriting and crashed at MODULE LOAD -- a static import
// here would have taken EN/VI down with it even when nobody asked for Japanese (confirmed by
// direct repro, not assumed). The JA preset has since switched to @aitytech/suzume (a WASM
// tokenizer with no filesystem dependency, see its own changelog), which doesn't have that
// failure mode -- but the lazy import stays, now purely to keep JA's code (and Suzume's
// ~560KB WASM binary) out of the bundle for EN/VI-only consumers.

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
    /**
     * [startIndex, endIndex) into the input text -- straight from textlint's own
     * TextlintMessage.range, not derived. Editors should underline/highlight this span
     * rather than guessing a length from `index` alone (most findings cover more than
     * one character: a whole phrase like "as an AI language model", not a single point).
     */
    range: readonly [number, number];
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

/** Populated on first successful "ja" lint call so repeat calls skip the dynamic import. */
let cachedJaPreset: typeof presetEn | undefined;

async function presetFor(language: Language) {
    if (language === "en") return normalizePreset(presetEn);
    if (language === "vi") return normalizePreset(presetVi);

    if (!cachedJaPreset) {
        let mod: unknown;
        try {
            mod = await import("@aitytech/textlint-rule-preset-ai-writing-ja");
        } catch (cause) {
            throw new JapaneseUnavailableError(cause);
        }
        cachedJaPreset = normalizePreset(mod);
    }
    return cachedJaPreset;
}

function normalizePreset(preset: unknown): typeof presetEn {
    // All three presets export { rules, rulesConfig }, but how many `.default` layers wrap
    // that object varies by import path -- EN/VI's static imports come through single-wrapped,
    // but the JA preset's dynamic import() ends up DOUBLE-wrapped under `.default.default` in
    // plain Node (confirmed by direct inspection, the same double-CJS-interop shape already
    // found for the textlint plugin packages elsewhere in this file). A single `??` unwrap left
    // `preset.rules` undefined, which only breaks inside Object.entries() far from this line --
    // unwrap by depth instead of assuming a fixed number of layers.
    let current = preset as { default?: unknown; rules?: unknown };
    for (let i = 0; i < 4 && current && !current.rules && current.default; i++) {
        current = current.default as typeof current;
    }
    return current as typeof presetEn;
}

/**
 * Thrown when Japanese linting can't run in the current environment (see the note above the
 * dynamic import in presetFor). Callers should catch this specifically and show a "JA isn't
 * available here yet" message rather than letting it surface as a generic crash.
 */
export class JapaneseUnavailableError extends Error {
    constructor(public readonly cause: unknown) {
        super(
            "Japanese linting could not load in this environment (known kuromoji/zlibjs bundling gap)."
        );
        this.name = "JapaneseUnavailableError";
    }
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
    const preset = await presetFor(language);
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
        range: m.range,
        severity: severityFromNumber(m.severity)
    }));

    const counts: Record<LintSeverity, number> = { error: 0, warning: 0, info: 0 };
    for (const f of findings) counts[f.severity]++;

    return { language, findings, counts };
}

/**
 * Only needed on runtimes that disallow compiling WebAssembly from raw bytes at request time
 * (currently: Cloudflare Workers -- see @aitytech/suzume-wasm's README for the full
 * explanation). Call once with a module precompiled at deploy time (e.g. Wrangler's native
 * `import mod from "./file.wasm"`) before the first "ja" lintText() call. Node/browser
 * callers never need this; Suzume's default loading works fine there.
 */
export async function configureSuzumeWasm(wasmModule: WebAssembly.Module): Promise<void> {
    const mod = await import("@aitytech/textlint-rule-preset-ai-writing-ja");
    mod.configureSuzumeWasm(wasmModule);
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
