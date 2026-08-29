# @aitytech/writelikeyou-mcp

Exposes the shared lint engine (`@aitytech/ai-writing-lint-core`) as a single Model Context
Protocol tool, `lint_text`, over two transports that share one `createServer()` factory
(`src/server.ts`) so behavior can never drift between them:

- **stdio** (`src/stdio.ts`) — for Claude Desktop, spawned as a local subprocess.
- **Cloudflare Workers** (`src/worker.ts`) — a stateless HTTP endpoint (`createMcpHandler`,
  no Durable Objects) for anything that needs a public HTTPS MCP URL (ChatGPT, or any other
  MCP-speaking client that can't spawn a local process).

`lint_text` takes `{ text, language: "en" | "vi" | "ja" | "auto" }` and returns findings with
rule id, severity, message, the exact flagged excerpt, and a `truncated` flag once past
`MAX_FINDINGS = 200` (never a silent drop). No text is ever sent to a third-party AI service —
this runs a deterministic rule engine (textlint), not a model call.

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

## Local development

```bash
pnpm install                      # from the monorepo root
pnpm --filter @aitytech/writelikeyou-mcp dev:http   # copies suzume-worker.wasm, then wrangler dev
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

## Claude Desktop (stdio)

```bash
pnpm --filter @aitytech/writelikeyou-mcp build
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "writelikeyou": {
      "command": "node",
      "args": ["/absolute/path/to/ai-writing-lint-suite/packages/mcp-server/dist/stdio.js"]
    }
  }
}
```

## Deploying to Cloudflare Workers

**Status: not yet deployed to production.** Everything above has been verified against
`wrangler dev` (local simulation) only — `wrangler deployments list` confirms no
`writelikeyou-mcp` Worker exists yet on the linked Cloudflare account. Remaining steps to go
live:

1. `pnpm --filter @aitytech/writelikeyou-mcp deploy` (runs the wasm copy step, then
   `wrangler deploy`).
2. Point `mcp.writelikeyou.aitytech.com` at the deployed Worker (Custom Domains in
   `wrangler.jsonc` take a bare hostname only — no wildcard, no path; the `/mcp` route comes
   from `createMcpHandler`'s own default, not from this config).
3. Re-run the curl verification above against the real URL and capture the `cf-cpu-time`
   response header for a real CPU-ms number — everything measured so far is `wrangler dev`
   wall-clock time (see below), not Cloudflare's actual per-request CPU metering.
4. Add this endpoint to a ChatGPT connector / plugin manifest once the domain is live (needed
   for OpenAI's app-directory submission: domain verification, identity verification, 5+3 test
   cases — not started).

## Performance (measured, local `wrangler dev`)

| | Cold (1st request/isolate) | Warm |
|---|---|---|
| JA (WASM tokenizer path) | ~77ms | ~6–10ms |
| EN/VI (regex-based, no WASM) | ~8ms | ~3–4ms |

- **Bundle**: 2.96 MB raw / **676.06 KiB gzip** (`wrangler deploy --dry-run`) — well under the
  free-tier 3MB gzip script-size limit. (Grew from 604.92 KiB after adding
  textlint-rule-preset-japanese's kuromoji-free grammar rules — confirmed Harper's ~8MB gzip
  WASM did NOT leak in: `worker.js` greps for zero "harper" matches after wiring it in.)
- Cold cost is paid once per isolate (Cloudflare reuses isolates across requests), not once
  per request.
- `configureSuzumeWasm()` only *registers* the precompiled module — it doesn't instantiate
  Suzume eagerly, so EN/VI-only requests never pay any WASM cost at all.
- These numbers are local wall-clock time through `wrangler dev`'s workerd simulation,
  including HTTP overhead on localhost — not Cloudflare's real edge CPU-time metering. Get a
  real number after step 3 above.

## Security

`allowedHostnames`/`allowedOriginHostnames` in `worker.ts` are pinned to
`mcp.writelikeyou.aitytech.com` (+ localhost) rather than left open, so a spoofed `Host` header
can't route around Cloudflare and an unrelated site can't silently call this endpoint on a
visitor's behalf to burn through the free-tier request quota.
