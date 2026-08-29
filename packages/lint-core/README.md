# @aitytech/ai-writing-lint-core

Thin, shared wrapper around the three AITYTECH textlint presets
(`textlint-rule-preset-ai-writing-{en,vi,ja}`) and `@textlint/kernel`, so every app in this
monorepo (web, mobile, macOS, the MCP server) calls linting the exact same way. **Does not
implement or fork any detection rule itself** — rule fixes/additions always happen in the
preset repos under `../../forks/`, never here.

## API

```ts
import { lintText, detectLanguage, configureSuzumeWasm } from "@aitytech/ai-writing-lint-core";

const result = await lintText(text, { language: "en" | "vi" | "ja", ext: ".md" | ".txt" });
// => { language, findings: LintFinding[], counts: { error, warning, info } }

detectLanguage(text); // "en" | "vi" | "ja", script/diacritic heuristic, no dependency

// Only needed on runtimes that can't compile WASM from raw bytes at request time
// (Cloudflare Workers). See packages/mcp-server/README.md for the full explanation.
await configureSuzumeWasm(precompiledModule);
```

Runs entirely client-side — no network call, no text ever leaves the caller's process.

## Why EN/VI are static imports but JA is dynamic

`presetFor()` statically imports EN/VI but lazy-loads JA via `import()`. This used to be
load-bearing (the old kuromoji-based JA preset pulled in an unmaintained UMD package that
crashed at module load under bundler rewriting — a static import would have broken EN/VI too,
even for callers who never touch Japanese). JA now uses a WASM tokenizer with no filesystem
dependency and doesn't have that failure mode, but the lazy import stays: it keeps JA's code
and Suzume's ~560KB WASM binary out of the bundle for EN/VI-only consumers (e.g. `apps/web`
when the user has JA switched off).

## Build

```bash
pnpm --filter @aitytech/ai-writing-lint-core build   # tsc -p .
```
