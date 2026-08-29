import { createMcpHandler } from "agents/mcp/server";
import { configureSuzumeWasm } from "@aitytech/ai-writing-lint-core";
import { createServer } from "./server.js";
// Wrangler compiles a .wasm import to an already-COMPILED WebAssembly.Module at deploy time
// (its native wasm module rule), not raw bytes -- required here, not a style choice: Workers
// disallows compiling WebAssembly from raw bytes at request time ("Wasm code generation
// disallowed by embedder", confirmed by direct repro against a real Workers instance). See
// @aitytech/suzume-wasm's README for the full explanation of why a fork was needed to accept
// a precompiled module at all.
//
// Imported from src/vendor/, not directly from node_modules/@aitytech/suzume/dist/ --
// Wrangler's wasm module rule only applies inside this package's own source tree (confirmed
// by direct repro: "No loader is configured for '.wasm' files" when importing the
// node_modules path directly). scripts/copy-suzume-wasm.mjs copies the installed package's
// actual binary here before every dev/deploy, run via the dev:http/deploy npm scripts.
// @ts-expect-error -- no ambient .wasm module type; Wrangler's build step resolves this.
import suzumeWasmModule from "./vendor/suzume-worker.wasm";

// One-time setup per isolate: hands the precompiled module to the JA preset's Suzume loader
// before any request needs it. Must be awaited, not fire-and-forget -- a `void` call here
// raced the first request's own getSuzume() call (module resolves before the dynamic
// import()+setter chain finishes), which silently fell back to the default loader and
// reproduced the exact same "0 findings" bug this whole change exists to fix. Confirmed by
// direct repro: awaiting this line was the difference between 0 and 1 finding on identical
// input. Top-level await is valid ES module syntax and Workers supports it at module scope.
await configureSuzumeWasm(suzumeWasmModule as WebAssembly.Module);

// Hosted entrypoint (Cloudflare Workers) -- the path ChatGPT needs, since it requires a
// public HTTPS /mcp URL and won't talk to a local stdio process. Deliberately stateless
// (no Durable Objects, no per-session McpAgent): this tool has no session state to keep
// between calls, and staying stateless keeps the whole thing on Cloudflare's free Workers
// plan -- the paid plan is only required once Durable Objects enter the picture.
//
// allowedHostnames/allowedOriginHostnames are set explicitly (not left to the "*" default)
// so a request can't spoof a Host header to route around Cloudflare, and a browser page on
// an unrelated site can't quietly call this endpoint on a visitor's behalf and burn through
// the free-tier request quota under our name.
const handler = createMcpHandler(createServer, {
    allowedHostnames: ["mcp.writelikeyou.aitytech.com", "localhost", "127.0.0.1"],
    allowedOriginHostnames: ["mcp.writelikeyou.aitytech.com"]
});

export default {
    fetch: handler
};
