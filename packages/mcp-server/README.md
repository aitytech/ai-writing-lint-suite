# @aitytech/pencheck-mcp

Exposes the shared lint engine (`@aitytech/ai-writing-lint-core`) as a single Model Context
Protocol tool, `lint_text`, over two transports that share one `createServer()` factory
(`src/server.ts`) so behavior can never drift between them:

- **stdio** (`src/stdio.ts`) — for Claude Desktop, spawned as a local subprocess.
- **Cloudflare Workers** (`src/worker.ts`) — a stateless HTTP endpoint (`createMcpHandler`,
  no Durable Objects) for anything that needs a public HTTPS MCP URL (ChatGPT, or any other
  MCP-speaking client that can't spawn a local process).

`lint_text` takes `{ text, language: "en" | "vi" | "ja" | "auto" }` and returns findings with
rule id, severity, message, the exact flagged excerpt, an optional `suggestions` array (a
concrete replacement, when the source engine computed one), and a `truncated` flag once past
`MAX_FINDINGS = 200` (never a silent drop). Two more tools: `list_rules` (what's active for a
language) and `compare_text` (did an edit actually reduce AI-writing tells). No text is ever
sent to a third-party AI service — every check here is a deterministic rule engine, not a
model call.

### What runs where

|  | Claude Desktop (stdio) | Cloudflare Workers (hosted, incl. ChatGPT) |
|---|---|---|
| AI-writing-tell rules (EN/VI/JA) | ✅ | ✅ |
| JA grammar (particles, register, sentence length, ...) | ✅ 12 rules | ✅ same 12 rules |
| JA proofreading / 校正 (表記統一, 用字用語統一, 誤用) | ✅ 11 rules | ✅ same 11 rules |
| VI spelling (nspell + dictionary-vi) | ✅ | ✅ |
| EN spelling | ✅ Harper, full grammar-aware | ✅ nspell + dictionary-en, dictionary-only (see below) |
| EN grammar beyond spelling (a/an, repeated words, contractions, ...) | ✅ Harper (~823 rules) | ✅ retext (3 targeted plugins — see below) |
| EN style guide (weasel words, passive voice, wordiness, cliches, ...) | ✅ Vale, 7 active styles | ✅ write-good directly, 7 checks (see below) |
| EN grammar Harper catches that nothing else does (agreement, tense, most punctuation, ...) | ✅ Harper | ❌ (no lightweight equivalent exists) |

Desktop and Workers run identical behavior for almost everything, and English -- the one
place they used to genuinely diverge -- is now close on every axis except Harper's full
depth:

- **Spelling**: both transports catch it. A real ChatGPT user hit this gap directly
  ("recieve"/"alot" went unflagged through the Workers path while Harper correctly caught
  both through Claude Desktop) — closed by adding `checkEnglishSpelling` (nspell +
  dictionary-en, pure JS, no WASM, ~180KB gzip added to the Workers bundle) as a
  worker.ts-only injection, deliberately never added to stdio.ts since Harper's spelling
  there is already higher-fidelity (real grammar-aware checking, not just a dictionary
  lookup) and stacking both would just duplicate findings. See
  `lint-core/src/english-spelling.ts` for the full story, including its own honestly-
  documented limitation: nspell only knows "is this a real word" (so "alot" is flagged, but
  its suggestions are single real words like "allot", not Harper's word-pair-aware "a lot").
- **Grammar beyond spelling**: both transports catch *something*, at very different depth.
  Workers gets `checkEnglishGrammarLite` (`lint-core/src/english-grammar-lite.ts`): three
  retext plugins (unifiedjs/retext, MIT) — a/an agreement, repeated words, missing-apostrophe
  contractions — each verified against real hand-written test cases, not assumed from their
  READMEs. Real coverage, genuinely narrower than Harper's ~823 rules (no subject-verb
  agreement, no tense checking, no article/preposition choice beyond a/an — no comparably
  lightweight pure-JS implementation of those was found). Injected worker.ts-only for the same
  duplicate-Harper reason as spelling above.
- **Style guide**: both transports catch it, and via the *same underlying rule set*. Vale's
  own `write-good` style (Claude Desktop) is a documented port of the `write-good` npm package
  — Workers now calls that exact npm package directly (`checkEnglishStyleLite`, see
  `lint-core/src/english-style-lite.ts`), matching Vale's severity-per-check mapping (checked
  against the actual vendored `styles/write-good/*.yml` files, not assumed uniform) and its
  choice to omit the `adverb` check. Not byte-for-byte identical to Vale's port, but the same
  checks, same category, same spirit — and Workers only gets write-good's 7 checks, not Vale's
  other 6 active styles beyond it.
- **What's still Desktop-only**: everything Harper catches that has no lightweight pure-JS
  equivalent — subject-verb agreement, tense, most punctuation rules, and the bulk of Harper's
  ~823-rule surface generally. Researched directly (not assumed absent) before settling here;
  no pure-JS, no-native-binary implementation of general English grammar checking at anywhere
  near Harper's quality was found to exist. This is the one real, permanent gap left.

**A real bug found and fixed while building the retext/write-good integration**: two of
write-good's own sub-dependencies (`weasel-words@0.1.1`, `passive-voice@0.1.0` — small,
unmaintained micro-packages from write-good's dependency tree) reference an undeclared
`match` variable inside a `while (match = re.exec(text))` loop. Node's CommonJS module wrapper
runs in sloppy mode, so this silently creates an implicit global and just works there — but
Wrangler's ESM bundle for Workers runs in strict mode, where the same code throws
`ReferenceError: match is not defined`. Confirmed by bisecting exactly which of the three new
engines caused it (checkEnglishStyleLite), reproduced in a plain Node script with zero
Workers-specific code (ruling out an obfuscation or bundler bug), then traced to these two
files directly. Fixed via `pnpm patch` (`patches/weasel-words@0.1.1.patch`,
`patches/passive-voice@0.1.0.patch`, registered in `pnpm-workspace.yaml`'s
`patchedDependencies`) rather than editing `node_modules` by hand -- survives every future
`pnpm install`, unlike a manual edit would.

## Why Japanese needed its own fix

The JA preset originally used kuromoji, which turned out unusable on Cloudflare Workers for
two independent reasons, both confirmed by direct repro rather than assumed:

1. **CPU budget**: kuromoji's dictionary build measured 220–311ms — 20–30x over the Workers
   free-tier 10ms/request CPU cap.
2. **Silent failure**: when its filesystem-based dictionary load failed on Workers, the rule's
   own `catch` block read that as "permit" and returned 0 findings instead of throwing.

Fix: the JA preset now uses [`@aitytech/suzume`](https://github.com/aitytech/suzume-wasm), a
fork of [`libraz/suzume`](https://github.com/libraz/suzume) — a ~400KB WASM morphological
tokenizer with no filesystem dependency, vs. kuromoji's ~15MB dictionary. Workers also
disallows compiling WebAssembly from raw bytes at request time, so `worker.ts` imports an
already-**precompiled** `.wasm` module (Wrangler's native wasm-module-rule, resolved at deploy
time) and hands it to the JA preset via `configureSuzumeWasm()` before any request needs it.

Suzume ships **two** WASM builds for exactly one reason: `nodejs_compat` (required by the
`agents` package and `@textlint/ast-tester`) makes `process.versions.node` look real, which
fools Emscripten's own `ENVIRONMENT_IS_NODE` autodetection into taking a real-Node-only code
path (`createRequire(import.meta.url)`, invalid in the bundled Workers context) — unconditionally,
before `instantiateWasm` is ever consulted. The `wasm-worker` build compiles that branch out
entirely (`-sENVIRONMENT=['worker']`), so `nodejs_compat` is safe to enable. See
`@aitytech/suzume-wasm`'s own README/commit history for the full story if this ever needs
revisiting.

**Round two, same class of bug, one layer up the stack.** Adding real JA grammar checking
(`textlint-rule-preset-japanese`, 12 rules) hit an almost-identical trap: importing the
aggregator package (even just to read 5 specific keys off `presetJapanese.rules`) still
statically pulls in all 12 of its sub-rule packages — including the 7 that use kuromojin —
because a bundler's import graph includes everything a module imports, not just the object
keys your own code later reads. Confirmed by direct repro: `wrangler dev` returned
`"__require.resolve is not a function"` for every `ja` request, from `kuromojin`'s own
module-scope code computing its dictionary path at load time. Fixed by importing the 5
kuromoji-free leaf packages directly (`textlint-rule-sentence-length`, etc.) instead of the
aggregator — confirmed fixed by re-running the same repro.

The other 7 of `textlint-rule-preset-japanese`'s rules (max-ten, no-doubled-joshi,
no-doubled-conjunctive-particle-ga, no-doubled-conjunction, no-double-negative-ja,
no-dropping-the-ra, no-mix-dearu-desumasu) all tokenize via kuromojin upstream — every one
reimplemented on Suzume, same rule IDs and Japanese messages. None dropped: `no-mix-dearu-desumasu`
looked kuromoji-free from its own package.json but wasn't (`analyze-desumasu-dearu`, its
dependency, calls `kuromojin` at module scope) — ported to Suzume like the rest rather than
shipped broken or left out. Verified against the kuromoji originals via real
`TextlintKernel.lintText()` runs (identical findings and ranges) where a kuromoji original
existed to compare against. Two real fidelity gaps, both documented in the affected rule's own
file:
- `no-doubled-conjunctive-particle-ga`: Suzume's dictionary doesn't distinguish が's two
  grammatical roles (格助詞/subject-marking vs. 接続助詞/contrastive "but") the way kuromoji's
  IPADIC does — falls back to a syntactic heuristic (re-analyzing the clause before each が,
  treating it as contrastive only when the preceding clause ends in a 終止形 predicate),
  confirmed to bias toward misses, never toward false-flagging subject-marking が.
- `no-mix-dearu-desumasu`: Suzume tags the attributive form な (連体修飾, e.g. "不明な点")
  identically to sentence-final だ on every structured field it exposes — worked around with a
  syntactic heuristic (な immediately followed by a noun is attributive, excluded). Also
  diverges from upstream by design: the real upstream package, installed and tested directly,
  turns out to never count standalone sentence-final だ at all (only the である compound) —
  judged that as an upstream limitation rather than something to preserve, so this port counts
  standalone だ too.

**Round three, same class of bug, different aggregator.** Adding the 11 JA proofreading rules
(校正 / 表記統一 — the concern professional editors and translation agencies have, distinct from
both AI-tell detection and grammar correctness) meant reaching into
`textlint-rule-preset-ja-technical-writing`, which has the same shape of problem:
`npm view textlint-rule-preset-ja-technical-writing dependencies` reaches `kuromojin` through
5 of its 24 sub-rules, so the aggregator is never imported — only individual leaf packages are,
and each one was re-checked with `npm view <pkg> dependencies` first. Six ship as-is
(`ja-no-mixed-period`, `ja-unnatural-alphabet`, `max-comma`, `max-kanji-continuous-len`,
`no-exclamation-question-mark`, `no-hankaku-kana`); four tokenize and are reimplemented on
Suzume (`ja-no-abusage`, `ja-no-redundant-expression`, `ja-no-successive-word`,
`ja-no-weak-phrase`). The eleventh is `prh`, a regex terminology-unification engine, driven by
a vendored MIT WEB+DB PRESS dictionary.

One Workers-specific wrinkle worth recording, because it is the same "works on Node, dies on
Workers" shape as the kuromoji story: `textlint-rule-prh`'s usual `rulePaths` option ends in an
`fs.readFileSync()` of a `.yml` that Wrangler does not bundle and a Worker has no filesystem to
read. Its `ruleContents` option takes the YAML as a string and only ever reaches js-yaml, so
the JA preset compiles its dictionaries into a TS module and passes them that way. Confirmed
working on a real local Workers instance, not assumed.

Per-rule Suzume fidelity gaps for these four are documented in each rule's own file in the JA
preset; the two structural ones are that Suzume has no 名詞-サ変接続 subtag (so
`ja-no-redundant-expression`'s "[サ変名詞]を行う" patterns use an all-kanji-noun heuristic that
misses rather than over-reports) and that Suzume's unknown-word merging both splits some
reduplicated adverbs and merges some genuine repetitions (so `ja-no-successive-word` re-analyzes
candidates to avoid false positives, and knowingly misses kana-only repetitions rather than
guess).

## VI: real spelling (nspell + dictionary-vi)

Unlike EN/JA, no mature open-source Vietnamese *grammar* checker exists (researched:
underthesea/VnCoreNLP are Python-only NLP toolkits, not spell/grammar checkers). Spelling only,
via [nspell](https://github.com/wooorm/nspell) (pure JS, MIT) + `dictionary-vi`'s hunspell-vi
word list — small enough (~44KB, inlined as a plain TS string constant at build time, no
bundler-specific asset config needed anywhere) to run on **every transport**, no Desktop-only
restriction. A custom diacritic-restoration index (built from the same word list) covers
nspell's single biggest blind spot: typing Vietnamese without diacritics at all (e.g. "duoc"
for "được") — nspell's generic edit-distance suggestions often never surface the correct
diacritic-restored word on their own.

## Local development

```bash
pnpm install                      # from the monorepo root
pnpm --filter @aitytech/pencheck-mcp dev:http   # copies suzume-worker.wasm, then wrangler dev
```

`dev:http` and `deploy` both run `scripts/copy-suzume-wasm.mjs` first — Wrangler's wasm
module rule only reaches `.wasm` files inside this package's own source tree, not
`node_modules`, so the script copies the resolved `@aitytech/suzume/wasm-worker` binary into
`src/vendor/` (gitignored, regenerated every run) before every dev/deploy.

Verify end-to-end against the local server:

```bash
RESP=$(curl -s -i -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}')

curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data-binary '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lint_text","arguments":{"text":"次の手順で実行します:\n\n- ステップ1\n- ステップ2","language":"ja"}}}'
```

Expect `totalFindings: 1` with `no-ai-colon-continuation`.

## Real grammar/spelling checking (Harper, EN, Claude Desktop only)

On top of the AI-writing-tell rules, English text also gets a real grammar/spelling pass via
[Harper](https://github.com/automattic/harper) (Apache-2.0, ~823 rules) -- but **only on the
stdio transport**. Harper's WASM binary is ~15.6MB raw / ~8MB gzip even in its "slim" build --
about 13x this package's entire current bundle, and alone well past Cloudflare Workers'
free-tier 3MB gzip script-size cap. Its loading path also compiles WASM from a fetched URL at
runtime, the same operation Workers disallows regardless of size (see the Suzume section
above). Not worth porting for the size involved, so it's Desktop-only by deliberate scope
decision, injected via dependency injection (`createServer({ checkEnglishGrammar })` in
`stdio.ts`) so `worker.ts` has no import path that could reach it at all -- confirmed by
`wrangler deploy --dry-run` and grepping the built `worker.js` for "harper" (zero matches)
after wiring this in, not just assumed from the code structure.

## Real style-guide checking (Vale, EN, Claude Desktop only)

English text gets a third pass, distinct from both of the other two: [Vale](https://vale.sh)
(MIT) — the prose linter Google, Microsoft, GitHub and RedHat all publish style guides for.
Where the preset catches "this reads like AI wrote it" and Harper catches mistakes, Vale
catches *style-guide and terminology* violations: weasel words, wordiness, cliches, passive
voice. It is the English counterpart to what `textlint-rule-prh` does for Japanese notation
consistency elsewhere in this monorepo. Findings arrive with `vale/<style>.<rule>` rule ids
(e.g. `vale/write-good.Weasel`), matching the existing `harper/<category>` convention.

**Also stdio-only, but for a harder reason than Harper.** Harper is merely *too big* for
Workers — a smaller build would in principle fix it. Vale ships as a **native Go binary and
has no WASM build in existence** (confirmed by search; no such target exists upstream). That
rules out both non-Node targets outright rather than by budget: Cloudflare Workers executes
no binaries at all, and `apps/web`'s browser context has no WASM path to fall back to the way
Harper does. `child_process` is the only way to run it, so it is injected in `stdio.ts` only
(`createServer({ checkEnglishGrammar, checkEnglishStyle })`) and `worker.ts` has no import
path that reaches `lint-core/src/vale.ts` at all.

Verified, not assumed — `wrangler deploy --dry-run` before and after wiring this in:
gzip **671.69 KiB → 671.87 KiB** (+0.18 KiB, entirely the two tool-description strings below).
Grepping the built `worker.js` for `child_process`, `@vvago`, `write-good` and `.vale.ini`
returns zero matches each; the only new `vale` matches are the three doc strings in
`TOOL_DESCRIPTION` and `list_rules`. (A raw count of "vale" is misleading — the bundle already
carried 11 pre-existing matches from `EvalError` and the word "equivalent", at HEAD and after,
which is why this was checked with a context dump rather than `grep -c`.)

### Rules and configuration

The binary comes from [`@vvago/vale`](https://www.npmjs.com/package/@vvago/vale) (pinned
`3.17.1`), whose postinstall downloads the ~40MB platform binary — hence its entry in
`pnpm-workspace.yaml`'s `allowBuilds`. It is a dependency of **`lint-core`**, not of this
package, for the same reason `harper.js` is: the code that spawns it lives there, and under
pnpm's isolated `node_modules` a package can only resolve what it declares (verified by direct
repro — `MODULE_NOT_FOUND` from `lint-core/dist/` when only this package declared it).

Vale has **no meaningful built-in style**: pointed at an empty `StylesPath` it emits literally
zero findings. So the rules are vendored — the [`write-good`](https://github.com/vale-cli/write-good)
Vale style (MIT, errata.ai; itself a port of the well-known `write-good` npm tool) at
`packages/lint-core/styles/write-good/`, fetched verbatim by `curl` at commit `c9ceca7`
(2025-05-23). See that directory's `README.md` for the re-fetch command and attribution.

All eight upstream rule files are vendored; seven are active. `E-Prime` is switched off in
`packages/lint-core/.vale.ini` with the reasoning inline — it is a writing *exercise* (prose
without any form of "to be"), not a style-guide rule, and measured 17 of 25 findings (68%) on
an ordinary 146-word draft, all "Try to avoid using 'is'". Left on it would bury the genuinely
useful findings and eat the `MAX_FINDINGS` cap before Harper's were counted. Deleting that one
line re-enables it.

Severity follows each rule's own authored level, mapped Vale→this project as
`error`→`error`, `warning`→`warning`, `suggestion`→`info`. Note that upstream sets `ThereIs`
to `error`, so a sentence opening with "There is" is reported at the same level as a spelling
mistake — that is upstream's judgment, preserved deliberately rather than silently re-scored.

### Implementation notes

`checkEnglishStyle()` (`lint-core/src/vale.ts`) pipes the draft to Vale's **stdin** rather than
writing a temp file, so the text never touches disk and there is nothing to clean up or collide
under concurrent calls. It uses `spawn` with an argv array — never `exec` — since the text is
arbitrary untrusted input and there is no shell to inject into.

Every path is resolved from `import.meta.url`, never `process.cwd()`, because Claude Desktop
launches this server from an arbitrary working directory. `--config` is passed explicitly (so
Vale never searches upward for someone else's `.vale.ini`), `--no-global` ignores any
`~/.vale.ini`, and `VALE_CONFIG_PATH`/`VALE_STYLES_PATH` are stripped from the child's
environment. Verified by running the built `dist/stdio.js` from `/` — findings identical.

One correctness trap worth knowing: Vale's `Span` is **not** a document offset. It is a
1-indexed, *inclusive* column pair scoped to `Line`, counted in **Unicode code points**. All
three plausible readings produce identical-looking numbers on ASCII single-line input and only
diverge later, so this was pinned down against real multi-byte input rather than assumed
(`"これは日本語です。café naïve — this is a very good idea."` reports `Span [33, 36]` for "very"
— its code-point column; the byte offset would have been 53). Since Go counts runes and JS
strings are UTF-16, `vale.ts` converts explicitly, which matters for astral characters: in
`"🎉🎉 this is a very good idea."` the correct UTF-16 range is `[15, 19]` while the raw column
is 14.

## Claude Desktop (stdio)

**Recommended: one-click install via the `.mcpb` bundle.** [MCP Bundles](https://github.com/modelcontextprotocol/mcpb)
(formerly Desktop Extensions) are a zip archive of a server + its dependencies + a
`manifest.json`, installed via Claude Desktop's Settings -> Extensions -> Install Extension...
-- no manual JSON editing.

```bash
pnpm --filter @aitytech/pencheck-mcp package:mcpb
```

produces `packages/mcp-server/dist-mcpb/pencheck-<version>.mcpb`. The build
(`scripts/build-mcpb.mjs`) stages `@aitytech/ai-writing-lint-core` as a fully standalone
package via a plain `npm install` (not `pnpm deploy`, which turned out to symlink workspace
deps back to this monorepo rather than copy real files -- see the script's own header comment
for the full story of why that was wrong and how it was caught), then smoke-tests the staged,
pre-zip package by actually spawning it and asserting a real `harper/Spelling` finding comes
back, before packing. Verified end-to-end from a directory with zero relation to this
monorepo, covering all three languages and every engine (Harper, Vale, Suzume-based JA,
VI spelling/notation) -- not just the smoke test's one assertion.

Both `agents` and `@aitytech/suzume` are dropped from this bundle's own dependencies (neither
is imported by the stdio path -- `agents` is worker.ts-only and also drags in ~80MB of
build-tooling transitive weight with no runtime purpose here; suzume comes along inside
lint-core's own staged copy already). Bundle size: **~53MB packed / ~133MB unpacked**, mostly
Vale's native binary (~40MB) and Harper's WASM (~15MB) -- both real engines, not bloat.

**Alternative: manual stdio config**, if you'd rather run from a live build (e.g. while
developing a rule) instead of the packaged bundle:

```bash
pnpm --filter @aitytech/pencheck-mcp build
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pencheck": {
      "command": "node",
      "args": ["/absolute/path/to/ai-writing-lint-suite/packages/mcp-server/dist/stdio.js"]
    }
  }
}
```

## Deploying to Cloudflare Workers

**Status: live in production**, deployed via `pnpm --filter @aitytech/pencheck-mcp run
deploy` (note the explicit `run` — `pnpm --filter <pkg> deploy` without it invokes pnpm's own
built-in `deploy` command, not this package's script, and fails with a confusing
`ERR_PNPM_INVALID_DEPLOY_TARGET` instead of running `wrangler deploy`). Live at
`https://mcp.pencheck.aitytech.com/mcp`, verified with a real `initialize` and `tools/call`
round-trip against the production URL (not `wrangler dev`) after the custom domain's edge
certificate finished provisioning (took under two minutes after first deploy).

Remaining, not yet done:

- Add this endpoint to a ChatGPT connector once needed (needs OpenAI's app-directory
  submission for a *public* listing — domain verification, identity verification, 5+3 test
  cases; a *private*/personal connector via ChatGPT's Developer Mode just needs the URL above,
  no OpenAI submission at all).

## Performance

| | Cold (1st request/isolate) | Warm |
|---|---|---|
| JA (WASM tokenizer path) | ~77ms | ~6–10ms |
| EN/VI (no WASM) | ~8ms | ~3–4ms |

- **Bundle**: 2846.74 KiB raw / **661.78 KiB gzip** (`wrangler deploy --dry-run`) — well under
  the free-tier 3MB gzip script-size limit, room to spare. Harper's ~8MB gzip WASM confirmed
  NOT included: `worker.js` greps for zero "harper" matches (its only appearances anywhere in
  the built output are this repo's own doc-comment strings, in the source map).
- Cold cost is paid once per isolate (Cloudflare reuses isolates across requests), not once
  per request.
- `configureSuzumeWasm()` only *registers* the precompiled module — it doesn't instantiate
  Suzume eagerly, so EN-only requests never pay any WASM cost at all. VI's nspell dictionary
  is plain JS data, not WASM, so it has no comparable "instantiate" cost either way.
- These are `wrangler dev`'s local workerd-simulation wall-clock numbers, not Cloudflare's real
  edge CPU-time metering — checked for a `cf-cpu-time` response header against the live
  production URL to get a real number and confirmed Cloudflare doesn't expose one to the
  client at all (per-request CPU time is dashboard/Logpush-only, not an HTTP response header),
  so this table stays as the best available estimate rather than being silently left stale.
  The production `initialize`/`tools/call` round-trips above returned in well under a second
  end-to-end (network + edge + compute), consistent with this table, but that number includes
  network RTT and isn't a clean substitute for real CPU-ms.

## Security

`allowedHostnames`/`allowedOriginHostnames` in `worker.ts` are pinned to
`mcp.pencheck.aitytech.com` (+ localhost) rather than left open, so a spoofed `Host` header
can't route around Cloudflare and an unrelated site can't silently call this endpoint on a
visitor's behalf to burn through the free-tier request quota.
