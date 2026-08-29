import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Wrangler's native `import mod from "./file.wasm"` (its wasm module rule, which
// precompiles the module at deploy time -- see worker.ts's comment for why that matters)
// only applies to .wasm files inside this package's own source tree. It does not reach into
// node_modules through a package export subpath (confirmed by direct repro: "No loader is
// configured for '.wasm' files" pointing at node_modules/@aitytech/suzume/dist/suzume.wasm).
// This copies the installed package's actual .wasm binary into src/ before every
// wrangler dev/deploy, so worker.ts can import it as a local file and it can never silently
// drift from whatever @aitytech/suzume version package.json currently pins.
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// wasm-worker specifically, NOT wasm -- the worker-only build (-sENVIRONMENT=['worker'],
// no Node-detection branch for nodejs_compat to falsely trigger). See
// @aitytech/suzume-wasm's own README/commit history for why two builds exist.
const source = require.resolve("@aitytech/suzume/wasm-worker");
const destDir = join(here, "..", "src", "vendor");
const dest = join(destDir, "suzume-worker.wasm");

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);
console.log(`Copied ${source} -> ${dest}`);
