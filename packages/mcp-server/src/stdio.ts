import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

// Claude Desktop entrypoint: launches this as a local child process and talks JSON-RPC over
// stdin/stdout. No network, no hosting, no cost -- this is the free/instant path from the
// distribution plan (packaged as a .mcpb Desktop Extension so users don't hand-edit config).
serveStdio(createServer);
