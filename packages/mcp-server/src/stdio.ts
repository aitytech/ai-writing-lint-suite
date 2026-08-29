import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { checkEnglishGrammar } from "@aitytech/ai-writing-lint-core/harper";
import { checkEnglishStyle } from "@aitytech/ai-writing-lint-core/vale";
import { createServer } from "./server.js";

// Claude Desktop entrypoint: launches this as a local child process and talks JSON-RPC over
// stdin/stdout. No network, no hosting, no cost -- this is the free/instant distribution path,
// packaged as a .mcpb Desktop Extension (see scripts/build-mcpb.mjs and this package's README,
// "Claude Desktop" section) so users install with one click instead of hand-editing config.
//
// The two real English checkers are injected only here, never in worker.ts, each for its own
// reason -- together they are the entire capability gap between the two transports:
//
//   checkEnglishGrammar (Harper, grammar/spelling): a size limit. Its ~8MB gzip WASM binary is
//   fine for a local subprocess but would blow Cloudflare Workers' free-tier 3MB gzip
//   script-size cap. Portable in principle, if that ever stopped being true.
//
//   checkEnglishStyle (Vale, style guide): not a size limit but an absolute one. Vale is a
//   native Go binary with no WASM build in existence, and Workers executes no binaries at all,
//   so no amount of budget makes this one portable. It needs Node's child_process, which only
//   exists on this transport.
//
// See lint-core/src/harper.ts, lint-core/src/vale.ts, and this package's README for the full
// story. Both are optional in createServer(), so worker.ts simply runs without them.
serveStdio(() => createServer({ checkEnglishGrammar, checkEnglishStyle }));
