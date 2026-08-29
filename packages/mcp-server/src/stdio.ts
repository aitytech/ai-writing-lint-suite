import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { checkEnglishGrammar } from "@aitytech/ai-writing-lint-core/harper";
import { createServer } from "./server.js";

// Claude Desktop entrypoint: launches this as a local child process and talks JSON-RPC over
// stdin/stdout. No network, no hosting, no cost -- this is the free/instant path from the
// distribution plan (packaged as a .mcpb Desktop Extension so users don't hand-edit config).
//
// checkEnglishGrammar (Harper) is injected only here, not in worker.ts -- its ~8MB gzip WASM
// binary is fine for a local subprocess but would blow Cloudflare Workers' free-tier 3MB
// gzip script-size cap. See lint-core/src/harper.ts and this package's README for the full
// story. This is currently the only capability gap between the two transports.
serveStdio(() => createServer({ checkEnglishGrammar }));
