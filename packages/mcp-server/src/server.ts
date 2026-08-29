import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { lintText, detectLanguage, JapaneseUnavailableError } from "@aitytech/ai-writing-lint-core";
import type { LintSeverity } from "@aitytech/ai-writing-lint-core";

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
    column: z.number()
});

const LintOutput = z.object({
    language: z.enum(["en", "vi", "ja"]),
    counts: z.object({ error: z.number(), warning: z.number(), info: z.number() }),
    findings: z.array(FindingSchema),
    truncated: z.boolean(),
    totalFindings: z.number()
});

// Runs identically on both transports (stdio.ts for Claude Desktop, worker.ts for the
// hosted/remote deployment). The JA preset used to need kuromoji, which only worked
// correctly in real Node (see the JA preset's own changelog: it silently under-detected on
// Cloudflare Workers instead of throwing) -- that preset now uses a WASM tokenizer
// (@libraz/suzume) with no filesystem dependency, so EN/VI/JA all behave the same way in
// every environment this server runs in. No environment-conditional behavior needed here.
const TOOL_DESCRIPTION =
    "Detects AI-writing tells (stock phrases, hedging, AI self-disclosure, structural " +
    "cliches) in English, Vietnamese, or Japanese text using a rule-based linter, not " +
    "another LLM's impression. Call this before finalizing any draft the user will " +
    "publish. Each finding names the exact rule violated and the exact text span. When " +
    "fixing a finding, rewrite the flagged span's meaning substantially: light editing " +
    "rarely changes how machine-typed a passage reads. This tool runs a deterministic " +
    "rule engine, not an AI model -- no third-party AI service sees this text, and " +
    "nothing is logged or stored.";

/**
 * Shared factory for both transports -- the tool registration lives in exactly one place so
 * the two entrypoints can never drift into exposing different behavior.
 */
export function createServer(): McpServer {
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

            const totalFindings = result.findings.length;
            const truncated = totalFindings > MAX_FINDINGS;
            const findings = result.findings.slice(0, MAX_FINDINGS).map((f) => ({
                ruleId: f.ruleId,
                message: f.message,
                severity: f.severity as LintSeverity,
                excerpt: text.slice(f.range[0], f.range[1]),
                line: f.line,
                column: f.column
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

    return server;
}
