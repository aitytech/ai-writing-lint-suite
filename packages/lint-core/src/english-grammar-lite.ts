// Lightweight English grammar checking beyond mere spelling, via the retext ecosystem
// (unifiedjs/retext, MIT) -- pure JS, no native binary, no WASM, small enough to run on
// Cloudflare Workers unlike Harper (see harper.ts). Three plugins, each verified by real
// execution against hand-written test cases before being trusted (not assumed from their
// READMEs):
//
// - retext-indefinite-article: "a"/"an" agreement ("a elephant" -> "an elephant"). A real
//   grammar rule, not a spelling check -- neither word is misspelled on its own.
// - retext-repeated-words: doubled words ("was was", "the the").
// - retext-contractions: missing/misplaced apostrophes in elisions ("dont" -> "don't",
//   "is'nt" -> "isn't"). Deliberately conservative about real dictionary words that happen to
//   look like a missing-apostrophe contraction -- confirmed directly: "wont" (a real word,
//   "habitual practice") is correctly NOT flagged, while "dont"/"isnt"/"youre" are.
//
// This is a genuinely narrower slice of "grammar" than Harper's ~823 rules (no subject-verb
// agreement, no tense checking, no article/preposition choice beyond a/an -- none of those
// have a comparable lightweight pure-JS implementation that was found; see this package's own
// research notes in mcp-server/README.md for what was actually checked and ruled out, not
// just assumed absent). Still a real, meaningfully non-empty answer to "does the Workers path
// get ANY grammar beyond spelling" -- which used to be a flat no.
//
// Deliberately injected ONLY into worker.ts, never stdio.ts: Harper already covers every one
// of these three cases (and far more) at Claude Desktop, so adding this there too would
// duplicate Harper's own findings at lower fidelity rather than fill a gap. See server.ts's
// createServer() doc comment for the same optional-injection shape this follows.
import { retext } from "retext";
import retextEnglish from "retext-english";
import retextIndefiniteArticle from "retext-indefinite-article";
import retextRepeatedWords from "retext-repeated-words";
import retextContractions from "retext-contractions";
import type { LintFinding, LintSeverity } from "./index.js";

let processor: ReturnType<typeof buildProcessor> | undefined;

function buildProcessor() {
    return retext().use(retextEnglish).use(retextIndefiniteArticle).use(retextRepeatedWords).use(retextContractions);
}

function getProcessor() {
    if (!processor) processor = buildProcessor();
    return processor;
}

// All three checks here are unambiguous, mechanical grammar rules (a/an agreement, doubled
// words, missing apostrophes) -- warning, not error, to stay consistent with how this
// package's other heuristic-but-usually-right checks are scored (e.g. Harper's own
// BoundaryError/Repetition categories are `warning`, not `error` -- see harper.ts's
// SEVERITY_BY_LINT_KIND), and because unlike a flat misspelling (en-spelling/misspelled,
// `error`), these can occasionally fire on stylistically-deliberate repetition or an author's
// intentional register choice, however rare in practice.
const SEVERITY: LintSeverity = "warning";

/**
 * Real grammar checks (beyond spelling), on top of (not instead of) the EN preset's
 * AI-writing-tell rules and (when present) checkEnglishSpelling/checkEnglishStyleLite -- call
 * all and merge for full coverage. No network call, runs entirely on-device: no text ever
 * leaves the caller's process.
 */
export async function checkEnglishGrammarLite(text: string): Promise<LintFinding[]> {
    const file = await getProcessor().process(text);
    const findings: LintFinding[] = [];
    for (const message of file.messages) {
        const place = message.place;
        // retext messages are always positioned in practice for these three plugins (each
        // reports a concrete text span), but the type allows undefined -- skip defensively
        // rather than crash on a malformed/positionless message.
        if (!place || !("start" in place) || !("end" in place)) continue;
        const start = place.start.offset;
        const end = place.end.offset;
        if (start === undefined || end === undefined) continue;

        findings.push({
            ruleId: `retext/${message.source ?? "grammar"}`,
            message: message.reason,
            line: place.start.line ?? 1,
            column: place.start.column ?? 1,
            index: start,
            range: [start, end] as const,
            severity: SEVERITY,
            ...(message.expected && message.expected.length > 0 ? { suggestions: message.expected.slice(0, 3) } : {})
        });
    }
    return findings;
}
