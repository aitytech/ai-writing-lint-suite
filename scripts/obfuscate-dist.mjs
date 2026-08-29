#!/usr/bin/env node
// Obfuscates every *.js file under a given directory, in place, using javascript-obfuscator
// (MIT, https://github.com/javascript-obfuscator/javascript-obfuscator). Shared across
// packages (lint-core, mcp-server, web) rather than duplicated per package, matching this
// monorepo's build-script conventions elsewhere -- each caller just does
// `node ../../scripts/obfuscate-dist.mjs <dir>` as a post-build step.
//
// Deliberately does NOT enable `selfDefending` or `debugProtection`. Both are notoriously
// fragile outside a browser: selfDefending relies on re-stringifying and re-evaluating the
// bundle's own source via a checksum of Function.prototype.toString() output, which breaks
// under some Node versions and inside bundled/transpiled code paths, and debugProtection
// actively fights a debugger being attached at all -- unacceptable for mcp-server, whose
// entire failure mode when something goes wrong needs to be "readable Node stack trace in a
// user's bug report", not an infinite loop or a silently dead process. This is a real,
// considered trade-off, not an oversight: it means the protection here is "hard to skim", not
// "hard to ever reverse" -- see this repo's build:obfuscate step in each package's README for
// the same caveat stated to users.
//
// Every other transform is on: identifier renaming (hexadecimal), string-array extraction +
// base64 encoding + rotation, control-flow flattening, and light dead-code injection. Applied
// only to compiled/bundled output (dist/), never to source -- `packages/*/src/` and the git
// history remain fully readable, since this is obfuscation for the shipped artifact, not
// secrecy for the project (MIT-licensed, source already public on GitHub).

import JavaScriptObfuscator from "javascript-obfuscator";
import fs from "node:fs";
import path from "node:path";

const targetArg = process.argv[2];
const light = process.argv.includes("--light");
if (!targetArg) {
    console.error("Usage: node obfuscate-dist.mjs <directory> [--light]");
    process.exit(1);
}
const targetDir = path.resolve(targetArg);
if (!fs.existsSync(targetDir)) {
    console.error(`obfuscate-dist: directory does not exist: ${targetDir}`);
    process.exit(1);
}

// --light drops controlFlowFlattening and deadCodeInjection. Real failure, not a guess: with
// both enabled, apps/web's ~1.7MB minified React+CodeMirror bundle built and passed
// `node --check` (valid JS) but hung the browser tab on load -- no console error, no crash,
// just a permanently blank page (confirmed with a real headless-browser screenshot + console +
// network check before this flag existed). mcp-server/lint-core's much smaller, non-bundled
// dist/*.js files run correctly with the strong settings (verified end-to-end: real
// Harper/Vale/JA/VI findings from the obfuscated, packed .mcpb, from a directory outside the
// monorepo). Control-flow flattening rewriting an already-densely-minified multi-hundred-KB
// function into a giant dispatch loop is a documented failure shape for javascript-obfuscator
// on large bundles, not unique to this codebase -- so large/bundled targets use --light
// (identifier renaming + string-array encoding still apply, just not the two transforms that
// broke it), small/unbundled targets keep the full set.
const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: !light,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: !light,
    deadCodeInjectionThreshold: 0.2,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false, // keep exported symbol NAMES stable -- only obfuscates their bodies,
    // not module linkage; renameGlobals: true has broken ESM named-export resolution in
    // testing (an import binds to a name that no longer exists post-obfuscation) and is not
    // worth the marginal extra opacity for how this project's exports work.
    ignoreImports: true, // real bug, caught by testing apps/web (which consumes lint-core's
    // dist directly through Vite, unlike mcp-server's staged/copied .mcpb build): without this,
    // string-array extraction rewrites a dynamic `import("./ja-preset.js")` call's specifier
    // into concatenated `_0x1234(56) + _0x1234(78)` lookups. Node doesn't care (it's still a
    // valid computed expression at runtime), but Vite's static import analyzer can no longer
    // recognize the specifier and warns "cannot be analyzed" -- at worst breaking the
    // dependency pre-bundling this dynamic import relies on for lazy-loading the JA preset in
    // the browser. ignoreImports leaves import()/require() specifier strings untouched while
    // still obfuscating everything else.
    selfDefending: false, // see file header comment
    debugProtection: false, // see file header comment
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    numbersToExpressions: !light,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    // transformObjectKeys rewrites object-literal property keys into computed lookups
    // (`{foo: 1}` -> `{[_0x1234(5)]: 1}`). Fine for mcp-server/lint-core in isolation (verified
    // end-to-end), but a real, bisected failure for apps/web: with it on, the production build
    // passes `node --check`, Vite builds it without error, and the page loads with zero console
    // errors -- and #root stays permanently empty. Root-caused by binary-searching the full
    // option set down to this one flag (toggled every other option off, confirmed the app
    // renders; added this one back alone, confirmed it breaks again) rather than guessed from
    // the symptom. Almost certainly React: JSX-transformed element objects and React's own
    // internals (`$$typeof`, `key`, `ref`, `children`, ...) depend on exact literal property
    // names that other code (React itself, in a separately-obfuscated or non-obfuscated chunk)
    // matches by string -- rewriting the key on one side but not the other silently breaks the
    // match with no thrown error. Disabled for --light; kept on for the strong profile since
    // mcp-server/lint-core (no React, no comparably fragile object-shape dependencies) already
    // measured clean end-to-end with it enabled.
    transformObjectKeys: !light
};

function findJsFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findJsFiles(full));
        } else if (entry.isFile() && full.endsWith(".js") && !full.endsWith(".d.js")) {
            results.push(full);
        }
    }
    return results;
}

const files = findJsFiles(targetDir);
if (files.length === 0) {
    console.log(`[obfuscate-dist] no .js files found under ${path.relative(process.cwd(), targetDir)}`);
    process.exit(0);
}

let totalBefore = 0;
let totalAfter = 0;
for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const before = Buffer.byteLength(source, "utf8");
    let obfuscated;
    try {
        obfuscated = JavaScriptObfuscator.obfuscate(source, OBFUSCATOR_OPTIONS).getObfuscatedCode();
    } catch (err) {
        console.error(`[obfuscate-dist] FAILED on ${path.relative(process.cwd(), file)}: ${err.message}`);
        process.exit(1);
    }
    fs.writeFileSync(file, obfuscated);
    const after = Buffer.byteLength(obfuscated, "utf8");
    totalBefore += before;
    totalAfter += after;
    console.log(`[obfuscate-dist] ${path.relative(process.cwd(), file)}: ${before}B -> ${after}B`);
}
console.log(
    `[obfuscate-dist] ${files.length} file(s), ${(totalBefore / 1024).toFixed(1)}KB -> ${(totalAfter / 1024).toFixed(1)}KB`
);
