// Lightweight English style-guide checking via write-good (github.com/btford/write-good,
// MIT) -- a pure-JS, dependency-light (no native binary, no WASM) prose linter that catches
// weasel words, passive voice, wordiness, cliches, unnecessary "So"/"There is" openers, and
// repeated words. Small enough (~42KB unpacked, its core module has zero runtime dependency
// on its own `commander` CLI dependency -- confirmed by reading write-good.js directly rather
// than assumed from its package.json) to run on Cloudflare Workers, unlike Vale (see vale.ts).
//
// Not a coincidence that this covers similar ground to Vale's own write-good STYLE
// (packages/lint-core/styles/write-good/): that Vale style is itself a documented port of
// THIS exact npm package (see mcp-server/README.md's Vale section) -- so this is the same
// underlying rule set Vale runs on Claude Desktop, just invoked directly as a JS library
// instead of through Vale's Go binary. Not byte-for-byte identical output (Vale's port may
// carry its own small fixes/deviations), but the same checks, same category, same spirit.
//
// SEVERITY MAPPING -- deliberately NOT a flat "info" for everything. Checked the actual
// vendored Vale style files (styles/write-good/*.yml) rather than guessing, and each check
// has its own authored level there: ThereIs and So are `error`, Passive/Cliches/Illusions
// (repeated words)/TooWordy/Weasel are `warning`, E-Prime is `suggestion` (mapped to `info`
// here) and disabled by default on both sides. Mirrored here via write-good's own `reason`
// suffix text (each check's explanation string is a stable, distinct fragment -- e.g. "is a
// weasel word", "is unnecessary verbiage" -- confirmed by reading write-good.js's
// defaultChecks table directly) so the same span gets the same severity regardless of which
// transport reports it.
//
// Also disables the "adverb" check (adverb-where) to match Vale's own port: Vale's vendored
// style set has NO corresponding style file for it at all (checked directly, not assumed) --
// a deliberate curation choice on Vale's side worth honoring here too, so this doesn't
// introduce noise the Desktop experience was already curated away from.
//
// Deliberately injected ONLY into worker.ts, never stdio.ts: Vale already covers this ground
// (and more -- Vale runs 7 active styles beyond just write-good) at Claude Desktop, so adding
// this there too would duplicate Vale's own findings rather than fill a gap. See
// server.ts's createServer() doc comment for the same optional-injection shape this follows.
import writeGood from "write-good";
import type { LintFinding, LintSeverity } from "./index.js";

// Ordered by explanation-string specificity where it matters (none currently overlap as
// prefixes of one another, but keeping this a list rather than relying on object-key
// iteration order documents that the match is deliberately a "does the reason END WITH this"
// check, not a hash lookup).
const SEVERITY_BY_REASON_SUFFIX: ReadonlyArray<{ suffix: string; severity: LintSeverity }> = [
    { suffix: "is unnecessary verbiage", severity: "error" }, // ThereIs
    { suffix: "adds no meaning", severity: "error" }, // So
    { suffix: "may be passive voice", severity: "warning" }, // Passive
    { suffix: "is a cliche", severity: "warning" }, // Cliches
    { suffix: "is repeated", severity: "warning" }, // Illusions (repeated words)
    { suffix: "is wordy or unneeded", severity: "warning" }, // TooWordy
    { suffix: "is a weasel word", severity: "warning" }, // Weasel
    { suffix: "is a form of 'to be'", severity: "info" } // E-Prime (disabled by default below)
];

function severityFor(reason: string): LintSeverity {
    const match = SEVERITY_BY_REASON_SUFFIX.find((entry) => reason.endsWith(entry.suffix));
    // Unknown suffix means write-good added/changed a check this table doesn't know about --
    // fall back to info (the least alarming choice) rather than silently mis-scoring it as
    // something more severe than intended.
    return match?.severity ?? "info";
}

/**
 * Real style-guide checks, on top of (not instead of) the EN preset's AI-writing-tell rules
 * and (when present) checkEnglishSpelling -- call all three and merge for full coverage. No
 * network call, runs entirely on-device: no text ever leaves the caller's process.
 */
export async function checkEnglishStyleLite(text: string): Promise<LintFinding[]> {
    // adverb: not vendored on the Vale side (see this file's header comment) -- matched here.
    // eprime: off by default in write-good itself already, kept off explicitly for clarity
    // rather than relying on that upstream default silently continuing to hold.
    const suggestions = writeGood(text, { adverb: false, eprime: false });
    const findings: LintFinding[] = [];
    for (const suggestion of suggestions) {
        const start = suggestion.index;
        const end = start + suggestion.offset;
        const before = text.slice(0, start);
        const line = before.split("\n").length;
        const lastNewline = before.lastIndexOf("\n");
        const column = start - (lastNewline === -1 ? -1 : lastNewline);

        findings.push({
            ruleId: "write-good/style",
            message: suggestion.reason,
            line,
            column,
            index: start,
            range: [start, end] as const,
            severity: severityFor(suggestion.reason)
        });
    }
    return findings;
}
