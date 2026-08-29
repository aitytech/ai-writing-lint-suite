// Real English style-guide checking via Vale (vale.sh, MIT), the prose linter Google,
// Microsoft, GitHub and RedHat all publish style guides for. This is a THIRD concern, distinct
// from both of the other two EN layers in this package: index.ts's preset catches "reads like
// AI wrote it", harper.ts catches grammar/spelling mistakes, and Vale catches style-guide and
// terminology violations -- weasel words, wordiness, cliches, passive-voice-adjacent E-Prime
// checks. It is the English counterpart to what textlint-rule-prh does for Japanese notation
// consistency elsewhere in this monorepo, and the three layers are additive by design: a
// sentence can be grammatical, non-AI-sounding, and still be padded with weasel words.
//
// Exposed as its own package export subpath ("@aitytech/ai-writing-lint-core/vale", see this
// package's package.json), deliberately NOT re-exported from the main index.ts entrypoint --
// the same belt-and-suspenders isolation harper.ts documents, for a sharper reason here. This
// module imports node:child_process, node:fs and node:os. index.ts is imported by apps/web's
// Vite/browser build and by mcp-server/src/worker.ts's Cloudflare Workers build, and in NEITHER
// of those is there a working child_process. A re-export from index.ts would put a Node-only
// spawn path into a browser bundler's module graph and break both builds -- so worker.ts and
// apps/web simply have no import path that reaches this file at all, rather than relying on a
// bundler to tree-shake it back out.
//
// CLAUDE DESKTOP ONLY, and unlike Harper this is not a size decision that a smaller build could
// fix. Vale is distributed as a native Go binary and has no WASM build at all (confirmed by
// search: no such target exists upstream). That rules out both non-Node targets outright --
// Cloudflare Workers executes no binaries whatsoever, and the browser has no WASM path to fall
// back to the way Harper does. child_process is the only way to run it, so mcp-server wires it
// into stdio.ts only. See packages/mcp-server/README.md for the full "what runs where" table.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LintFinding, LintSeverity } from "./index.js";

// Every path below is derived from this module's own installed location, never from
// process.cwd(). This runs as an MCP stdio server that Claude Desktop launches as a child
// process from an arbitrary working directory (whatever Desktop happens to have; not the
// package directory), so any cwd-relative resolution would work in development and fail in the
// only environment that actually ships. Same reasoning, and same import.meta.url technique, as
// packages/mcp-server/scripts/copy-suzume-wasm.mjs.
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// @vvago/vale is the official npm distribution: its postinstall downloads the correct
// platform binary from Vale's own GitHub releases into bin/vale (~40MB). Resolved through
// package.json rather than a hardcoded node_modules path so pnpm's isolated store layout,
// symlinks and hoisting decisions are all Node's problem, not ours. The package declares no
// "exports" map, so resolving its package.json is legal and stable.
//
// This is why @vvago/vale is a dependency of THIS package rather than of mcp-server, which is
// what actually ships it: under pnpm's isolated node_modules, a package can only resolve what
// it itself declares (verified by direct repro -- MODULE_NOT_FOUND from lint-core's dist/ when
// only mcp-server declared it). Exactly the arrangement harper.js already has: a heavyweight
// engine dependency of lint-core, reachable only through a subpath export, never named by
// mcp-server's own package.json.
const VALE_BINARY = join(dirname(require.resolve("@vvago/vale/package.json")), "bin", "vale");

// Vale resolves StylesPath relative to the .vale.ini file's own directory, so config and styles
// travel together at this package's root (one directory up from dist/ at runtime, and from
// src/ during development -- both land in the same place). Passed explicitly via --config on
// every invocation, which short-circuits Vale's default behavior of searching upward from the
// current directory for a .vale.ini: that search would otherwise find whatever config happened
// to be above the caller's cwd, or nothing at all.
const VALE_CONFIG = join(here, "..", ".vale.ini");

// Vale's severity scale is suggestion/warning/error; this package's is info/warning/error.
// Vale's "suggestion" and this package's "info" mean the same thing -- an opinion about better
// phrasing rather than a defect -- which is how harper.ts already scores Style/Enhancement
// findings, so the three EN layers stay comparable when merged into one list.
const SEVERITY_BY_VALE_LEVEL: Record<string, LintSeverity> = {
    error: "error",
    warning: "warning",
    suggestion: "info"
};

/** One alert as it appears in Vale's `--output=JSON` payload. Only the fields we consume. */
type ValeAlert = {
    /**
     * A 1-indexed, INCLUSIVE [start, end] column pair scoped to `Line`, counted in Unicode
     * code points -- NOT a byte offset and NOT an offset into the whole document. Verified
     * directly against all three plausible readings rather than assumed, because every one of
     * them produces plausible-looking numbers on pure-ASCII single-line input and only diverges
     * later: linting "これは日本語です。café naïve — this is a very good idea." reported
     * Span [33, 36] for "very", which is its 1-indexed code-point column (byte offset would
     * have been 53, and a whole-document offset would have differed again on multi-line input).
     */
    Span: [number, number];
    /** `<StyleName>.<RuleName>`, e.g. "write-good.Weasel". */
    Check: string;
    Message: string;
    /** Vale's own scale: "suggestion" | "warning" | "error". */
    Severity: string;
    /** The flagged substring, used here only to sanity-check the computed span. */
    Match: string;
    /** 1-indexed line number in the ORIGINAL text, even in syntax-aware markdown mode. */
    Line: number;
};

/**
 * Precomputes, for each 1-indexed line, the UTF-16 offset at which that line starts in `text`.
 * Index 0 is unused so `lineStarts[alert.Line]` reads directly.
 */
function computeLineStarts(text: string): number[] {
    const starts = [0, 0];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") starts.push(i + 1);
    }
    return starts;
}

/**
 * Converts a 1-indexed code-point column within a line into a UTF-16 offset into `text`.
 *
 * Go counts runes; JavaScript strings are UTF-16. For anything in the Basic Multilingual Plane
 * -- including all of Japanese and every accented Latin character -- the two agree, so this
 * only diverges on astral characters (emoji, rarer CJK extensions), where one Go rune is two
 * JS units. Left as a real conversion rather than a straight subtraction because a draft with
 * an emoji in it is an entirely ordinary input for this tool, and getting it wrong would
 * silently shift every subsequent highlight on that line by one unit per preceding emoji.
 */
function codePointColumnToUtf16Offset(text: string, lineStart: number, column: number): number {
    let offset = lineStart;
    let remaining = column - 1;
    while (remaining > 0 && offset < text.length && text[offset] !== "\n") {
        // codePointAt returns the full astral code point, so > 0xffff means a surrogate pair.
        offset += (text.codePointAt(offset) ?? 0) > 0xffff ? 2 : 1;
        remaining--;
    }
    return offset;
}

function toFinding(alert: ValeAlert, text: string, lineStarts: number[]): LintFinding {
    const lineStart = lineStarts[alert.Line] ?? 0;
    const [startColumn, endColumn] = alert.Span;
    const start = codePointColumnToUtf16Offset(text, lineStart, startColumn);
    // Span's end column is inclusive, so the exclusive end is one code point past it -- hence
    // endColumn + 1 rather than endColumn, which would drop the span's last character.
    const end = codePointColumnToUtf16Offset(text, lineStart, endColumn + 1);
    return {
        ruleId: `vale/${alert.Check}`,
        message: alert.Message,
        line: alert.Line,
        column: startColumn,
        index: start,
        range: [start, end] as const,
        severity: SEVERITY_BY_VALE_LEVEL[alert.Severity] ?? "info",
        // No `suggestions`: write-good's rules are all `existence`-type checks that flag a
        // phrase without computing a replacement, and "the fix" for a weasel word is a rewrite,
        // not a drop-in swap. Same reasoning index.ts documents for the AI-writing-tell rules.
    };
}

/**
 * Real English style-guide checking, on top of (not instead of) the EN preset's
 * AI-writing-tell rules and Harper's grammar/spelling -- call all three and merge if a caller
 * wants full coverage. No network call: Vale runs entirely as a local subprocess against
 * vendored rule files (see styles/write-good/README.md), so no text ever leaves the machine,
 * matching the on-device guarantee every other check in this package makes.
 *
 * Node-only. Throws if the Vale binary is missing or fails to run, rather than silently
 * returning [] -- a style check that quietly stops checking is worse than one that reports it
 * is broken.
 */
export async function checkEnglishStyle(text: string): Promise<LintFinding[]> {
    // Piped over stdin rather than written to a temp file: `text` never touches disk, there is
    // no temp file to leak or fail to clean up on a crash, and no filename to collide under
    // concurrent calls. --ext tells Vale what syntax the stdin content is, which is what makes
    // it skip fenced code blocks the way harper.ts's markdown mode does (verified: a weasel
    // word inside a ``` fence is not flagged, and Line still counts the original document's
    // lines). spawn with an argv array, never exec -- there is no shell to inject into, which
    // matters because `text` is arbitrary untrusted user input.
    const stdout = await runVale(text);

    // Vale keys its JSON by input name -- "stdin.md" for piped input -- and emits `{}` (not an
    // empty array, and not an empty per-file list) when nothing is flagged. Flattening every
    // key rather than reading "stdin.md" by name keeps this correct if that placeholder name
    // ever changes, since there is only ever one input.
    const parsed = JSON.parse(stdout || "{}") as Record<string, ValeAlert[]>;
    const lineStarts = computeLineStarts(text);
    return Object.values(parsed)
        .flat()
        .map((alert) => toFinding(alert, text, lineStarts));
}

/**
 * Runs the Vale binary over `text` piped to its stdin and resolves with its raw stdout.
 *
 * spawn rather than execFile because execFile's promisified form has no way to write to the
 * child's stdin (its `input` option belongs to the *Sync* variants only), and piping is what
 * keeps `text` off disk entirely -- no temp file to leak, to fail to clean up after a crash,
 * or to collide with a concurrent call.
 */
function runVale(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            VALE_BINARY,
            [
                `--config=${VALE_CONFIG}`,
                // Ignore any ~/.vale.ini the machine happens to have. Without this a user's
                // personal global config could add or silence rules and make this checker's
                // output differ machine to machine.
                "--no-global",
                // Vale otherwise exits non-zero when it finds an error-level alert, which is
                // indistinguishable from a real failure at the exit-code level. Findings are
                // the expected result here, not a failure.
                "--no-exit",
                "--ext=.md",
                "--output=JSON"
            ],
            { env: scrubbedEnv(), stdio: ["pipe", "pipe", "pipe"] }
        );

        const stdout: Buffer[] = [];
        const stderr: Buffer[] = [];
        child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
        child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

        // A 50k-character draft (the MCP tool's own input cap) lints in well under a second;
        // reaching this bound means the subprocess is wedged and would otherwise hang the
        // calling tool forever, since an MCP server has no other way out of a stuck child.
        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error("Vale timed out after 30s"));
        }, 30_000);
        timer.unref?.();

        child.on("error", (error) => {
            clearTimeout(timer);
            reject(error);
        });

        child.on("close", (code) => {
            clearTimeout(timer);
            const out = Buffer.concat(stdout).toString("utf8");
            // With --no-exit a non-zero code means a genuine failure (binary can't run, config
            // unreadable), not "found problems". Still accept output that parses as JSON, so a
            // future Vale that exits non-zero after producing complete results doesn't silently
            // break this -- but surface stderr otherwise instead of returning an empty finding
            // list, because a style check that quietly stops checking looks exactly like a
            // clean draft.
            if (code !== 0 && !out.trim().startsWith("{")) {
                const detail = Buffer.concat(stderr).toString("utf8").trim();
                reject(new Error(`Vale exited with code ${code}${detail ? `: ${detail}` : ""}`));
                return;
            }
            resolve(out);
        });

        child.stdin.on("error", reject);
        child.stdin.end(text, "utf8");
    });
}

/**
 * Vale reads VALE_CONFIG_PATH and VALE_STYLES_PATH from the environment (see `vale ls-vars`).
 * Claude Desktop passes the user's whole environment through to the servers it launches, so
 * either variable being set for unrelated reasons would silently redirect this checker at
 * someone else's config or style directory. Dropped so --config is the only thing that decides.
 */
function scrubbedEnv(): NodeJS.ProcessEnv {
    const { VALE_CONFIG_PATH, VALE_STYLES_PATH, ...rest } = process.env;
    return rest;
}
