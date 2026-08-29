// Real English grammar/spelling checking via Harper (github.com/automattic/harper, Apache-2.0),
// a Rust/WASM grammar checker -- a different concern from the EN preset's "reads like AI wrote
// it" rules in index.ts. 823 rules by default (spelling, grammar, agreement, punctuation,
// style, ...), <20ms per real lint call after a ~500-600ms one-time setup (measured).
//
// Exposed as its own package export subpath ("@aitytech/ai-writing-lint-core/harper", see this
// package's package.json), deliberately NOT re-exported from the main index.ts entrypoint --
// imported only by callers that want it (currently: mcp-server's stdio.ts for Claude Desktop,
// and apps/web). Harper's WASM binary is ~15.6MB raw / ~8MB gzip even in its "slim" build --
// about 13x this whole mcp-server's current bundle, and alone well past Cloudflare Workers'
// free-tier 3MB gzip script-size cap. Its loading path (createBinaryModuleFromUrl -> fetch +
// compile at runtime) also hits the same "Wasm code generation disallowed by embedder" wall
// Workers enforces regardless of size, requiring a precompiled-module rework like Suzume's if
// this were ever ported there. Not attempted here by deliberate scope decision -- see
// packages/mcp-server/README.md for the Workers/EN-grammar status. A separate export subpath
// (rather than tree-shaking a re-export out of index.ts) is a deliberate belt-and-suspenders
// choice: mcp-server/src/worker.ts must NEVER pull this module in, and that shouldn't depend on
// a bundler correctly eliminating a 15MB WASM dependency chain -- worker.ts simply has no
// import path that reaches this file at all.
import { LocalLinter, Dialect, type Lint } from "harper.js";
import { slimBinary } from "harper.js/slimBinary";
import type { LintFinding, LintSeverity } from "./index.js";

let linterPromise: Promise<LocalLinter> | undefined;

function getLinter(): Promise<LocalLinter> {
    if (!linterPromise) {
        const linter = new LocalLinter({ binary: slimBinary, dialect: Dialect.American });
        linterPromise = linter.setup().then(() => linter);
    }
    return linterPromise;
}

// Harper's LintKind taxonomy mixes hard errors (Spelling, Typo, Agreement) with softer
// judgment calls (Style, Enhancement, Readability) -- mapped to this package's existing
// error/warning/info scale so callers merging Harper findings with the AI-tell findings don't
// need a second severity system. Spelling/grammar mistakes are objectively wrong (error);
// style/enhancement suggestions are opinions about better phrasing (info), matching how
// tech-writing-guideline (also opinion-level) is scored elsewhere in this package.
const SEVERITY_BY_LINT_KIND: Record<string, LintSeverity> = {
    Spelling: "error",
    Typo: "error",
    Agreement: "error",
    BoundaryError: "error",
    Nonstandard: "error",
    Capitalization: "warning",
    Punctuation: "warning",
    Repetition: "warning",
    WordOrder: "warning",
    Redundancy: "warning",
    Regionalism: "info",
    Eggcorn: "info",
    Enhancement: "info",
    Formatting: "info",
    Grammar: "error",
    Malapropism: "warning",
    Miscellaneous: "info",
    Readability: "info",
    Style: "info",
    Usage: "warning",
    WordChoice: "info"
};

function toFinding(lint: Lint, text: string): LintFinding {
    const span = lint.span();
    const kind = lint.lint_kind();
    // Harper doesn't report line/column -- derive them the same way textlint's own kernel
    // does (1-indexed line, 1-indexed column), so these findings slot into the exact same
    // LintFinding shape (and the same editor/UI code) as every textlint-sourced finding.
    const before = text.slice(0, span.start);
    const line = before.split("\n").length;
    const lastNewline = before.lastIndexOf("\n");
    const column = span.start - (lastNewline === -1 ? -1 : lastNewline);
    // Suggestion.kind() === Remove means "delete this text", which get_replacement_text()
    // represents as "" -- keep that (an empty-string suggestion is a real, meaningful fix,
    // e.g. removing a duplicated word), only drop suggestions with no computed text at all.
    const suggestions = lint
        .suggestions()
        .map((s) => s.get_replacement_text())
        .filter((s) => s !== undefined && s !== null);
    return {
        ruleId: `harper/${kind}`,
        message: lint.message(),
        line,
        column,
        index: span.start,
        range: [span.start, span.end] as const,
        severity: SEVERITY_BY_LINT_KIND[kind] ?? "info",
        ...(suggestions.length > 0 ? { suggestions } : {})
    };
}

/**
 * Real English grammar/spelling checking, on top of (not instead of) the EN preset's
 * AI-writing-tell rules -- call both and merge if a caller wants full coverage. No network
 * call, runs entirely on-device (Harper's own design goal, same as this package's other
 * checks): no text ever leaves the caller's process.
 */
export async function checkEnglishGrammar(text: string): Promise<LintFinding[]> {
    const linter = await getLinter();
    const lints = await linter.lint(text, { language: "markdown", dedup: true });
    return lints.map((lint) => toFinding(lint, text));
}
