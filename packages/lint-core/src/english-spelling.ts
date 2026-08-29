// Lightweight English spelling via nspell (a pure-JS Hunspell-compatible checker, MIT) +
// dictionary-en (wooorm/dictionaries' English word list, same family as dictionary-vi already
// used in vietnamese-spelling.ts, MIT). Small enough (~550KB of dictionary data, pure JS, no
// WASM, no native bindings) to run on Cloudflare Workers, unlike Harper (see harper.ts) --
// exists specifically to close the gap that leaves ChatGPT (which can only reach the Workers
// transport, not stdio) with ZERO English spell-checking despite Claude Desktop's stdio
// transport having full Harper grammar/spelling coverage.
//
// A real user hit this directly: "As an AI language model, I recieve alot of requests." linted
// through the ChatGPT connector flagged only the AI-writing-tell (no-ai-artifact-leakage), with
// "recieve" and "alot" silently unflagged -- not a bug, but an undocumented-enough gap that it
// read as one. This is deliberately injected ONLY into worker.ts, never stdio.ts: Harper
// already covers spelling there at higher quality (real grammar rules, not just a dictionary
// lookup), so adding this too would just duplicate or under-quality some of Harper's own
// findings rather than filling a real gap. See server.ts's createServer() doc comment for the
// same optional-injection shape this follows (CheckEnglishGrammar/CheckEnglishStyle).
//
// Deliberately spelling-only, matching Harper's own severity choice for pure misspellings
// (error) but nothing beyond that: no grammar rules, no style opinions -- nspell only knows
// "is this a real word", not "is this the right word in this sentence" (Harper's `alot` catch
// via BoundaryError -- "should be written as two words" -- is a real-word-pair grammar rule
// nspell has no equivalent of; nspell instead flags "alot" as simply an unknown word, which
// still surfaces the same error, just via a different, lower-fidelity mechanism -- documented
// here rather than silently assumed to be equivalent).
import nspellFactory from "nspell";
import { enDictionaryAff, enDictionaryDic } from "./en-dictionary-data.js";
import type { LintFinding } from "./index.js";

let spellInstance: ReturnType<typeof nspellFactory> | undefined;

function getSpell() {
    if (!spellInstance) spellInstance = nspellFactory({ aff: enDictionaryAff, dic: enDictionaryDic });
    return spellInstance;
}

// English word characters only -- numbers/punctuation/other scripts act as separators, same
// tokenization granularity nspell itself expects (single words, not whole sentences). Includes
// apostrophe so contractions ("don't", "it's") aren't split into two false-positive fragments.
const EN_WORD = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

/**
 * Real spelling checks, on top of (not instead of) the EN preset's AI-writing-tell rules --
 * call both and merge if a caller wants full coverage. No network call, runs entirely
 * on-device: no text ever leaves the caller's process.
 */
export async function checkEnglishSpelling(text: string): Promise<LintFinding[]> {
    const spell = getSpell();
    const findings: LintFinding[] = [];
    let match: RegExpExecArray | null;
    EN_WORD.lastIndex = 0;
    while ((match = EN_WORD.exec(text))) {
        const word = match[0];
        // Very short tokens (single letters, common initialisms like "a"/"I") produce mostly
        // noise -- same length floor this package's other spelling/lint rules apply elsewhere.
        if (word.length < 2) continue;
        if (spell.correct(word)) continue;

        const start = match.index;
        const end = start + word.length;
        const before = text.slice(0, start);
        const line = before.split("\n").length;
        const lastNewline = before.lastIndexOf("\n");
        const column = start - (lastNewline === -1 ? -1 : lastNewline);
        const suggestions = spell.suggest(word).slice(0, 3);

        findings.push({
            ruleId: "en-spelling/misspelled",
            message:
                suggestions.length > 0
                    ? `Did you mean to spell "${word}" this way? Possible fixes: ${suggestions.join(", ")}.`
                    : `"${word}" may be misspelled.`,
            line,
            column,
            index: start,
            range: [start, end] as const,
            severity: "error",
            ...(suggestions.length > 0 ? { suggestions } : {})
        });
    }
    return findings;
}
