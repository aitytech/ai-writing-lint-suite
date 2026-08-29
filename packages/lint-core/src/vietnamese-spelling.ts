// Real Vietnamese spell-checking via nspell (a pure-JS Hunspell-compatible checker, MIT) +
// dictionary-vi (hunspell-vi's word list, MIT) -- a different concern from lintText()'s VI
// AI-writing-tell rules. Unlike Harper (see harper.ts), this is small enough (~44KB of
// dictionary data, pure JS, no WASM, no native bindings) to run everywhere this package runs,
// including Cloudflare Workers -- no Desktop-only restriction needed here.
//
// No mature open-source Vietnamese GRAMMAR checker exists (researched: VnCoreNLP/underthesea
// are Python-only NLP toolkits, not spell/grammar checkers; no equivalent to Harper or
// LanguageTool for Vietnamese was found). This covers spelling only.
import nspellFactory from "nspell";
import { viDictionaryAff, viDictionaryDic } from "./vi-dictionary-data.js";
import type { LintFinding } from "./index.js";

let spellInstance: ReturnType<typeof nspellFactory> | undefined;
let diacriticIndex: Map<string, string[]> | undefined;

function getSpell() {
    if (!spellInstance) spellInstance = nspellFactory({ aff: viDictionaryAff, dic: viDictionaryDic });
    return spellInstance;
}

// Vietnamese đ/Đ is a base letter with a stroke, not a combining diacritic -- Unicode NFD
// decomposition doesn't touch it, so it needs its own substitution alongside NFD-stripping
// every other Vietnamese diacritic (tone marks + vowel modifiers, all combining marks under
// NFD).
function stripDiacritics(word: string): string {
    return word
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

/**
 * Typing Vietnamese without diacritics entirely (common in informal contexts: "khong" for
 * "không") is nspell's single biggest practical blind spot -- its generic edit-distance
 * suggestion algorithm doesn't know "add the diacritics back" is the relevant transform, and
 * empirically (tested against this exact dictionary) often never surfaces the diacritic-
 * restored word at all even when it's the obviously-intended one (e.g. suggest("duoc") never
 * includes "được" in its top-12 list). Built once, lazily, from dictionary-vi's own word
 * list: every entry indexed by its diacritic-stripped form, so a bare "duoc" can look up
 * "được" directly instead of hoping generic edit-distance finds it.
 */
function getDiacriticIndex(): Map<string, string[]> {
    if (!diacriticIndex) {
        diacriticIndex = new Map();
        // First line of dictionary-vi's .dic is a Hunspell word-count header, not a word.
        const lines = viDictionaryDic.split("\n").slice(1);
        for (const line of lines) {
            const word = line.split("/")[0]?.trim();
            if (!word) continue;
            const stripped = stripDiacritics(word).toLowerCase();
            const existing = diacriticIndex.get(stripped);
            if (existing) existing.push(word);
            else diacriticIndex.set(stripped, [word]);
        }
    }
    return diacriticIndex;
}

const hasDiacritics = (word: string) => word !== stripDiacritics(word);

// Vietnamese word characters: ASCII letters plus every precomposed Vietnamese vowel/tone
// combination and đ/Đ. Matches maximal runs of these (numbers/punctuation act as separators),
// same tokenization granularity nspell itself expects (single words, not whole sentences).
const VI_WORD = /[A-Za-zĐđÀ-ỹ]+/gu;

function suggestionsFor(word: string): string[] {
    if (!hasDiacritics(word)) {
        const restored = getDiacriticIndex().get(word.toLowerCase());
        if (restored && restored.length > 0) return restored.slice(0, 3);
    }
    return getSpell().suggest(word).slice(0, 3);
}

/**
 * Real spelling checks, on top of (not instead of) the VI preset's AI-writing-tell rules --
 * call both and merge if a caller wants full coverage. No network call, runs entirely
 * on-device: no text ever leaves the caller's process.
 */
export async function checkVietnameseSpelling(text: string): Promise<LintFinding[]> {
    const spell = getSpell();
    const findings: LintFinding[] = [];
    let match: RegExpExecArray | null;
    VI_WORD.lastIndex = 0;
    while ((match = VI_WORD.exec(text))) {
        const word = match[0];
        // Very short tokens (single letters, common Latin-script initialisms) produce mostly
        // noise -- textlint's own EN/VI rules apply the same kind of length floor elsewhere
        // in this codebase.
        if (word.length < 2) continue;
        if (spell.correct(word)) continue;

        const start = match.index;
        const end = start + word.length;
        const before = text.slice(0, start);
        const line = before.split("\n").length;
        const lastNewline = before.lastIndexOf("\n");
        const column = start - (lastNewline === -1 ? -1 : lastNewline);
        const suggestions = suggestionsFor(word);

        findings.push({
            ruleId: "vi-spelling/misspelled",
            message:
                suggestions.length > 0
                    ? `"${word}" có thể là lỗi chính tả. Có phải ý bạn là: ${suggestions.join(", ")}?`
                    : `"${word}" có thể là lỗi chính tả.`,
            line,
            column,
            index: start,
            range: [start, end] as const,
            severity: "warning",
            ...(suggestions.length > 0 ? { suggestions } : {})
        });
    }
    return findings;
}
