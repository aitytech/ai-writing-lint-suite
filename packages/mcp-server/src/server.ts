import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
    lintText,
    detectLanguage,
    listRules,
    checkVietnameseSpelling,
    JapaneseUnavailableError
} from "@aitytech/ai-writing-lint-core";
import type { LintFinding, LintResult, LintSeverity } from "@aitytech/ai-writing-lint-core";

/**
 * Caps how many findings a single tool call returns. A document with thousands of tells
 * would otherwise dump thousands of JSON objects into the calling model's context -- the
 * same scalability problem the web app's ledger hit, solved the same way (cap + a flag
 * saying more exist, never a silent drop).
 */
const MAX_FINDINGS = 200;

const LintInput = z.object({
    text: z
        .string()
        .min(1)
        .max(50_000)
        .describe("The draft text to check for AI-writing tells."),
    language: z
        .enum(["en", "vi", "ja", "auto"])
        .default("auto")
        .describe("Language of the text. \"auto\" detects EN/VI/JA from the text itself.")
});

const FindingSchema = z.object({
    ruleId: z.string(),
    message: z.string(),
    severity: z.enum(["error", "warning", "info"]),
    // The literal flagged substring, not just (line, column) -- much easier for a calling
    // model to locate what to fix than reconstructing an offset from line/column math.
    excerpt: z.string(),
    line: z.number(),
    column: z.number(),
    // Only present for findings with an engine-computed replacement (currently: Harper's
    // grammar/spelling findings on Claude Desktop). Absent for AI-writing-tell findings --
    // those need a real rewrite, not a drop-in swap; see TOOL_DESCRIPTION.
    suggestions: z.array(z.string()).optional()
});

const LintOutput = z.object({
    language: z.enum(["en", "vi", "ja"]),
    counts: z.object({ error: z.number(), warning: z.number(), info: z.number() }),
    findings: z.array(FindingSchema),
    truncated: z.boolean(),
    totalFindings: z.number()
});

// Runs identically on both transports (stdio.ts for Claude Desktop, worker.ts for the
// hosted/remote deployment) for the AI-writing-tell rules, VI spell-checking, and
// Suzume-based JA grammar checks. English is where the two transports genuinely diverge:
// Claude Desktop gets full grammar+spelling (Harper) and style-guide checking (Vale); the
// hosted/Workers path (which is what ChatGPT and any other remote MCP client reach) gets
// spelling only, via a lightweight dictionary lookup (nspell + dictionary-en) -- real
// coverage, just lower-fidelity than Harper's actual grammar rules. See createServer()'s doc
// comment and each of lint-core/src/{harper,vale,english-spelling}.ts for why each is scoped
// the way it is.
const TOOL_DESCRIPTION =
    "Detects AI-writing tells (stock phrases, hedging, AI self-disclosure, structural " +
    "cliches) in English, Vietnamese, or Japanese text using a rule-based linter, not " +
    "another LLM's impression. Also runs real spelling/grammar/style checking on top of the " +
    "AI-tell rules: on English, Claude Desktop gets full grammar+spelling via Harper " +
    "(`harper/...` rule ids) and full style-guide checking via Vale (`vale/...`); every " +
    "other transport, including ChatGPT, gets dictionary-based spelling " +
    "(`en-spelling/misspelled`), a narrower set of grammar checks -- a/an agreement, " +
    "repeated words, missing-apostrophe contractions -- via retext (`retext/...`), and " +
    "style-guide checking via the same write-good rule set Vale's own style is ported from " +
    "(`write-good/style`) -- real coverage on every transport, just shallower than Harper+Vale " +
    "off Desktop. Spelling only on Vietnamese (no mature open-source Vietnamese grammar " +
    "checker exists); grammar checks on Japanese (particle repetition, mixed register, " +
    "sentence length, ...), identical on every transport. Call " +
    "this before finalizing any draft the user will publish. Each finding names the exact " +
    "rule violated and the exact text span. When fixing an AI-writing-tell finding, rewrite " +
    "the flagged span's meaning substantially: light editing rarely changes how " +
    "machine-typed a passage reads -- grammar/spelling findings, in contrast, are usually " +
    "fine to fix with the exact correction (see each finding's `suggestions`, when " +
    "present). This tool runs deterministic rule engines, not an AI model -- no " +
    "third-party AI service sees this text, and nothing is logged or stored.";

/**
 * Optional dependency, injected rather than imported directly by this file -- see
 * lint-core's src/harper.ts for why. When absent (the Cloudflare Workers path, via
 * worker.ts), English requests simply skip the extra grammar pass and only report the
 * AI-writing-tell findings; this is a deliberate, documented scope gap (see
 * packages/mcp-server/README.md), not a silent failure -- callers on that path never had
 * this checker offered to begin with.
 */
export type CheckEnglishGrammar = (text: string) => Promise<LintFinding[]>;

/**
 * Optional dependency, injected on the same terms and for the same reason as
 * CheckEnglishGrammar above -- but restricted to Claude Desktop by a harder constraint. Harper
 * is merely too big for Workers; Vale is a native Go binary with no WASM build at all, so
 * there is no version of it that could run on Workers or in a browser. See
 * lint-core/src/vale.ts.
 */
export type CheckEnglishStyle = (text: string) => Promise<LintFinding[]>;

/**
 * Optional dependency, but the INVERSE injection pattern from CheckEnglishGrammar/
 * CheckEnglishStyle above: worker.ts injects this, stdio.ts does not. Harper already gives
 * Claude Desktop full grammar+spelling coverage at higher quality than a plain dictionary
 * lookup (real grammar rules, not just "is this a real word") -- injecting this there too
 * would duplicate or under-quality some of Harper's own findings rather than fill a real gap.
 * ChatGPT (which can only reach the Workers transport) had NO English spell-checking at all
 * before this -- a real user hit this directly ("recieve"/"alot" went unflagged through the
 * ChatGPT connector while the same text correctly flagged both through Claude Desktop's
 * Harper pass) -- see lint-core/src/english-spelling.ts for the full story and scope.
 */
export type CheckEnglishSpelling = (text: string) => Promise<LintFinding[]>;

/**
 * Same inverse-injection shape as CheckEnglishSpelling above, worker.ts-only, for the same
 * reason: Harper already covers everything retext-indefinite-article/-repeated-words/
 * -contractions check (a/an agreement, doubled words, missing-apostrophe contractions), at
 * higher fidelity, on Claude Desktop -- see lint-core/src/english-grammar-lite.ts for the
 * full scope (a genuinely narrower slice of "grammar" than Harper's ~823 rules, documented
 * honestly there, not oversold here).
 */
export type CheckEnglishGrammarLite = (text: string) => Promise<LintFinding[]>;

/** Same inverse-injection shape, worker.ts-only, for the same reason as the two above: Vale
 * already covers this (and more) on Claude Desktop. See
 * lint-core/src/english-style-lite.ts. */
export type CheckEnglishStyleLite = (text: string) => Promise<LintFinding[]>;

function mergeFindings(result: LintResult, extra: LintFinding[]): LintResult {
    if (extra.length === 0) return result;
    return {
        ...result,
        findings: [...result.findings, ...extra],
        counts: {
            error: result.counts.error + extra.filter((f) => f.severity === "error").length,
            warning: result.counts.warning + extra.filter((f) => f.severity === "warning").length,
            info: result.counts.info + extra.filter((f) => f.severity === "info").length
        }
    };
}

/**
 * Shared factory for both transports -- the tool registration lives in exactly one place so
 * the two entrypoints can never drift into exposing different behavior. The five
 * `checkEnglish*` options are the intentional exceptions: stdio.ts (Claude Desktop) injects
 * `checkEnglishGrammar` (Harper) and `checkEnglishStyle` (Vale); worker.ts injects
 * `checkEnglishSpelling` (nspell), `checkEnglishGrammarLite` (retext), and
 * `checkEnglishStyleLite` (write-good) -- see each type's own doc comment above for exactly
 * why each transport gets what it gets.
 */
export function createServer(
    options: {
        checkEnglishGrammar?: CheckEnglishGrammar;
        checkEnglishStyle?: CheckEnglishStyle;
        checkEnglishSpelling?: CheckEnglishSpelling;
        checkEnglishGrammarLite?: CheckEnglishGrammarLite;
        checkEnglishStyleLite?: CheckEnglishStyleLite;
    } = {}
): McpServer {
    const { checkEnglishGrammar, checkEnglishStyle, checkEnglishSpelling, checkEnglishGrammarLite, checkEnglishStyleLite } = options;
    const server = new McpServer(
        { name: "writelikeyou", version: "0.1.0" },
        { capabilities: { tools: {} } }
    );

    server.registerTool(
        "lint_text",
        {
            description: TOOL_DESCRIPTION,
            inputSchema: LintInput,
            outputSchema: LintOutput
        },
        async ({ text, language }) => {
            const resolvedLanguage = language === "auto" ? detectLanguage(text) : language;

            let result;
            try {
                result = await lintText(text, { language: resolvedLanguage, ext: ".md" });
            } catch (error) {
                if (error instanceof JapaneseUnavailableError) {
                    // Defensive fallback, not the expected path anymore: lint-core still
                    // wraps JA loading in this error type in case something environment-
                    // specific breaks it again in the future, but the known kuromoji/Workers
                    // gap this originally guarded against no longer exists (see the JA
                    // preset's suzume migration).
                    const empty = {
                        language: "ja" as const,
                        counts: { error: 0, warning: 0, info: 0 },
                        findings: [],
                        truncated: false,
                        totalFindings: 0
                    };
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: "Japanese linting hit an unexpected environment error (not the usual path)."
                            }
                        ],
                        structuredContent: empty
                    };
                }
                throw error;
            }

            // Real grammar/spelling and style-guide findings, additive to the AI-writing-tell
            // findings above and to each other -- Harper and Vale check different things (is
            // this correct English? vs. is this well-written English?) and a span can
            // legitimately draw a finding from both. Exactly one of each pair
            // (checkEnglishGrammar/checkEnglishGrammarLite, checkEnglishStyle/
            // checkEnglishStyleLite) is ever injected by a given transport, never both -- see
            // each *Lite type's own doc comment for why stacking both would just duplicate the
            // Desktop-only engine's own findings at lower fidelity rather than add coverage.
            // checkEnglishSpelling has no Desktop counterpart to pair against (Harper's own
            // spelling coverage already subsumes it there). VI (nspell) runs on every transport
            // unconditionally, it's cheap enough not to need any of this restriction (see
            // lint-core/src/vietnamese-spelling.ts). Merged before truncation/counting so
            // MAX_FINDINGS and the summary line both reflect the combined total, not several
            // separate numbers. Run concurrently: Vale is a subprocess round-trip, Harper is
            // CPU-bound WASM, and the two *Lite engines are pure sync/async JS -- none of them
            // has a reason to wait on any other.
            if (resolvedLanguage === "en") {
                const [grammar, style, spelling, grammarLite, styleLite] = await Promise.all([
                    checkEnglishGrammar ? checkEnglishGrammar(text) : Promise.resolve([]),
                    checkEnglishStyle ? checkEnglishStyle(text) : Promise.resolve([]),
                    checkEnglishSpelling ? checkEnglishSpelling(text) : Promise.resolve([]),
                    checkEnglishGrammarLite ? checkEnglishGrammarLite(text) : Promise.resolve([]),
                    checkEnglishStyleLite ? checkEnglishStyleLite(text) : Promise.resolve([])
                ]);
                result = mergeFindings(result, grammar);
                result = mergeFindings(result, style);
                result = mergeFindings(result, spelling);
                result = mergeFindings(result, grammarLite);
                result = mergeFindings(result, styleLite);
            } else if (resolvedLanguage === "vi") {
                result = mergeFindings(result, await checkVietnameseSpelling(text));
            }

            const totalFindings = result.findings.length;
            const truncated = totalFindings > MAX_FINDINGS;
            const findings = result.findings.slice(0, MAX_FINDINGS).map((f) => ({
                ruleId: f.ruleId,
                message: f.message,
                severity: f.severity as LintSeverity,
                excerpt: text.slice(f.range[0], f.range[1]),
                line: f.line,
                column: f.column,
                ...(f.suggestions && f.suggestions.length > 0 ? { suggestions: f.suggestions } : {})
            }));

            const summary =
                totalFindings === 0
                    ? "No AI-writing tells found. Clean read."
                    : `${totalFindings} finding(s): ${result.counts.error} error, ${result.counts.warning} warning, ${result.counts.info} info.` +
                      (truncated ? ` Showing the first ${MAX_FINDINGS}.` : "");

            return {
                content: [{ type: "text" as const, text: summary }],
                structuredContent: { language: result.language, counts: result.counts, findings, truncated, totalFindings }
            };
        }
    );

    server.registerTool(
        "list_rules",
        {
            description:
                "Lists the rules lint_text can flag for a given language: rule id, severity, " +
                "and configured options. Rule ids are self-descriptive by convention " +
                "(no-em-dash-overuse, no-doubled-joshi, ...) -- call this when you need to " +
                "explain to the user what this tool checks for, or before writing " +
                "instructions that reference a specific rule by name. Doesn't include " +
                "Harper's ~800 English grammar/spelling rules or Vale's English style-guide " +
                "rules individually (both Claude Desktop only, see lint_text) -- those " +
                "surface through lint_text's own findings, with `harper/<category>` and " +
                "`vale/<style>.<rule>` as their ruleIds respectively. On transports without " +
                "Harper/Vale (e.g. ChatGPT, via the hosted endpoint), English findings " +
                "instead use `en-spelling/misspelled` (spelling), `retext/<plugin-name>` " +
                "(grammar: a/an agreement, repeated words, contractions), and " +
                "`write-good/style` (style guide) as their ruleIds.",
            inputSchema: z.object({
                language: z.enum(["en", "vi", "ja"]).describe("Which preset's rules to list.")
            }),
            outputSchema: z.object({
                language: z.enum(["en", "vi", "ja"]),
                rules: z.array(
                    z.object({
                        ruleId: z.string(),
                        severity: z.enum(["error", "warning", "info", "off"]),
                        options: z.unknown()
                    })
                )
            })
        },
        async ({ language }) => {
            const rules = await listRules(language);
            return {
                content: [{ type: "text" as const, text: `${rules.length} rule(s) active for ${language}.` }],
                structuredContent: { language, rules }
            };
        }
    );

    server.registerTool(
        "compare_text",
        {
            description:
                "Lints two versions of the same draft (before/after an edit) and reports " +
                "whether the edit actually reduced AI-writing tells -- not just whether the " +
                "new text also passes lint_text cleanly. Use this after applying fixes from " +
                "an earlier lint_text call, to confirm the rewrite worked rather than just " +
                "moving the problem or introducing a new one.",
            inputSchema: z.object({
                before: z.string().min(1).max(50_000).describe("The earlier draft."),
                after: z.string().min(1).max(50_000).describe("The revised draft."),
                language: z
                    .enum(["en", "vi", "ja", "auto"])
                    .default("auto")
                    .describe("Language of the text. \"auto\" detects from `after`.")
            }),
            outputSchema: z.object({
                language: z.enum(["en", "vi", "ja"]),
                before: z.object({ totalFindings: z.number(), counts: z.object({ error: z.number(), warning: z.number(), info: z.number() }) }),
                after: z.object({ totalFindings: z.number(), counts: z.object({ error: z.number(), warning: z.number(), info: z.number() }) }),
                // Matched by (ruleId, excerpt) -- a real diff of textlint messages across two
                // edited texts isn't well-defined (positions shift, phrasing changes), so this
                // is deliberately a coarse "which exact flagged phrases disappeared / are new"
                // signal, not a precise line-level diff.
                resolved: z.array(z.object({ ruleId: z.string(), excerpt: z.string() })),
                introduced: z.array(z.object({ ruleId: z.string(), excerpt: z.string() }))
            })
        },
        async ({ before, after, language }) => {
            const resolvedLanguage = language === "auto" ? detectLanguage(after) : language;
            const [beforeResult, afterResult] = await Promise.all([
                lintText(before, { language: resolvedLanguage, ext: ".md" }),
                lintText(after, { language: resolvedLanguage, ext: ".md" })
            ]);

            const key = (f: LintFinding, text: string) => `${f.ruleId}::${text.slice(f.range[0], f.range[1])}`;
            const beforeKeys = new Set(beforeResult.findings.map((f) => key(f, before)));
            const afterKeys = new Set(afterResult.findings.map((f) => key(f, after)));

            const resolved = beforeResult.findings
                .filter((f) => !afterKeys.has(key(f, before)))
                .map((f) => ({ ruleId: f.ruleId, excerpt: before.slice(f.range[0], f.range[1]) }));
            const introduced = afterResult.findings
                .filter((f) => !beforeKeys.has(key(f, after)))
                .map((f) => ({ ruleId: f.ruleId, excerpt: after.slice(f.range[0], f.range[1]) }));

            const summarize = (r: LintResult) => ({ totalFindings: r.findings.length, counts: r.counts });
            const delta = beforeResult.findings.length - afterResult.findings.length;
            const summary =
                delta > 0
                    ? `Improved: ${delta} fewer finding(s) (${resolved.length} resolved, ${introduced.length} new).`
                    : delta < 0
                      ? `Regressed: ${-delta} more finding(s) (${resolved.length} resolved, ${introduced.length} new).`
                      : `No change in finding count (${resolved.length} resolved, ${introduced.length} new -- net zero).`;

            return {
                content: [{ type: "text" as const, text: summary }],
                structuredContent: {
                    language: resolvedLanguage,
                    before: summarize(beforeResult),
                    after: summarize(afterResult),
                    resolved,
                    introduced
                }
            };
        }
    );

    return server;
}
