#!/usr/bin/env node
// Builds the Claude Desktop distribution artifact: a single .mcpb file (MCP Bundle format,
// see https://github.com/modelcontextprotocol/mcpb) that a user installs with one click via
// Settings -> Extensions -> Install Extension..., instead of hand-editing
// claude_desktop_config.json (see this package's README, "Claude Desktop" section).
//
// WHY THIS CAN'T BE `pnpm deploy`: tried first, twice, and both failed for real reasons worth
// recording so nobody re-attempts them.
//   1. `pnpm deploy --legacy` (the default without extra config) does NOT materialize
//      workspace-protocol dependencies into real files -- it symlinks
//      node_modules/@aitytech/ai-writing-lint-core straight back to this monorepo's own
//      packages/lint-core directory. A `.mcpb` built that way runs fine on THIS machine (Node
//      just follows the symlink) but is silently non-portable: unzipped on any other machine,
//      that symlink is dangling. Confirmed by testing from a directory outside the monorepo --
//      it failed immediately with the naive approach, worked once this script's staging
//      approach was used instead.
//   2. The fix pnpm itself offers -- `inject-workspace-packages: true` in pnpm-workspace.yaml,
//      which makes pnpm hard-copy workspace deps instead of symlinking -- is a WORKSPACE-WIDE
//      setting, and turning it on to package one extension is the wrong lever to pull for a
//      change that should only affect this one build artifact.
// Fix: since @aitytech/ai-writing-lint-core's own dependencies are all real npm-registry (or
// `github:` git) specifiers, never `workspace:*` (checked directly in its package.json before
// relying on this), it can be staged as a fully standalone package with a plain `npm install`
// in an isolated directory -- no pnpm, no workspace resolution, no symlinks leaving the
// package at all. Verified end-to-end from a directory with zero relation to this monorepo
// (moved the built package there, ran `node dist/stdio.js`, sent it real MCP requests over
// stdin covering all three languages and all engines including Harper/Vale) before this
// approach was trusted.
//
// WHY `agents` AND `@aitytech/suzume` ARE DROPPED FROM THIS BUNDLE'S OWN package.json:
// `agents` is imported only by worker.ts (the Cloudflare Workers entrypoint), never by
// stdio.ts or server.ts -- confirmed by grepping this package's own import graph before
// relying on it. It also drags in ~80MB of exclusively build-tooling transitive weight
// (vite, esbuild, rolldown, lightningcss, babel, core-js -- none of them referenced by any
// package this bundle actually keeps, confirmed by reachability, not by size alone) that has
// no runtime purpose in a JSON-RPC-over-stdio process. `@aitytech/suzume` is used by the JA
// preset internally, as a dependency of @aitytech/ai-writing-lint-core -- it does not need to
// be a direct dependency of this package too; lint-core's own staged copy already carries it.
//
// Usage: node scripts/build-mcpb.mjs   (run after `pnpm --filter ... build` for both packages,
// or this script builds them itself -- see buildWorkspacePackage below).

import { execFileSync } from "node:child_process";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mcpServerDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const monorepoRoot = path.resolve(mcpServerDir, "..", "..");
const lintCoreDir = path.join(monorepoRoot, "packages", "lint-core");
const buildDir = path.join(mcpServerDir, ".mcpb-build");
const lintCoreStageDir = path.join(buildDir, "lint-core-stage");
const pkgStageDir = path.join(buildDir, "pkg");
const outDir = path.join(mcpServerDir, "dist-mcpb");

function log(msg) {
    console.log(`[build-mcpb] ${msg}`);
}

function run(cmd, args, cwd) {
    log(`$ ${cmd} ${args.join(" ")}  (cwd: ${path.relative(monorepoRoot, cwd) || "."})`);
    // CI=true: pnpm's dependency-status check will otherwise prompt to purge node_modules on a
    // TTY-less run, which is destructive and unrelated to this script's own concerns -- hit
    // this for real once, fixed by forcing non-interactive mode rather than assuming --yes-like
    // flags exist for every subcommand.
    execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "true" } });
}

function buildWorkspacePackage(filterName) {
    run("pnpm", ["--filter", filterName, "build"], monorepoRoot);
}

function rimraf(p) {
    fs.rmSync(p, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
    fs.cpSync(src, dest, { recursive: true });
}

/**
 * Works around a real bug in harper.js 2.7.0 (latest published version -- confirmed no newer
 * release fixes it), found by reproducing a real user-facing failure, not by reading harper.js
 * source speculatively: installing the packed .mcpb into Claude Desktop (which always installs
 * under `~/Library/Application Support/Claude/Claude Extensions/...` -- "Application Support"
 * always has a literal space in it on macOS) failed with
 * `ENOENT: ... harper_wasm_slim_bg.wasm` even though the file demonstrably existed on disk at
 * that exact path. Root-caused by running the installed dist/stdio.js directly and triggering
 * the Harper code path: harper.js's generated WASM loader
 * (dist/BinaryModule-*.js, function getInitInput) does
 * `fs.readFile(new URL(binary).pathname, callback)` -- URL.pathname does NOT decode percent-
 * escapes, so a space in the install path (encoded as %20 in the file:// URL) leaks into the
 * fs path as a literal "%20" that no file on disk actually has. The fix is one line: pass the
 * URL object itself to fs.readFile (Node's fs functions accept a URL directly and decode it
 * correctly) instead of its .pathname string.
 *
 * This patches harper.js's OWN dist output post-install (not our code) -- a real upstream bug,
 * not something introduced by this build. Patching here (applied fresh every build, like
 * patch-package) was chosen over forking harper.js: harper.js's WASM binary is built from Rust
 * via wasm-bindgen, so a real fork would mean standing up and maintaining a Rust/WASM toolchain
 * for a one-line JS fix -- not worth it unless this patch stops applying cleanly across
 * harper.js version bumps, at which point revisit.
 */
function patchHarperWasmPathBug(lintCoreStageDir) {
    const dir = path.join(lintCoreStageDir, "node_modules", "harper.js", "dist");
    const candidates = fs.readdirSync(dir).filter((f) => f.startsWith("BinaryModule-") && f.endsWith(".js"));
    if (candidates.length === 0) {
        throw new Error(`no BinaryModule-*.js found in ${dir} -- harper.js's internal file layout changed, this patch needs updating.`);
    }
    const BUGGY = "fs.readFile(new URL(binary).pathname, (err, data) => {";
    const FIXED = "fs.readFile(new URL(binary), (err, data) => {";
    let patched = 0;
    for (const file of candidates) {
        const full = path.join(dir, file);
        const content = fs.readFileSync(full, "utf8");
        if (!content.includes(BUGGY)) continue;
        fs.writeFileSync(full, content.replace(BUGGY, FIXED));
        patched++;
    }
    if (patched === 0) {
        throw new Error(
            `expected to find harper.js's known-buggy "new URL(binary).pathname" pattern in ${dir}/BinaryModule-*.js and didn't -- either harper.js fixed this upstream (in which case delete this patch) or changed the code shape (in which case this patch needs updating). Don't skip silently.`
        );
    }
    log(`patched ${patched} file(s) in harper.js/dist (URL.pathname -> URL fs.readFile bug)`);
}

/**
 * Removes commented, human-readable TypeScript source (and test files) from this monorepo's
 * own PRIVATE git-dependency packages (the @aitytech-scoped EN/VI/JA textlint presets) before
 * packing -- a real information-disclosure bug caught by literally unzipping a built .mcpb and
 * reading it, not theorized. `npm install` on a `github:owner/repo#sha` dependency installs the
 * ENTIRE repository checkout into node_modules, not just the package's registry-publish
 * "files" allowlist (that filtering is an `npm publish`-time step that never runs for git
 * dependencies) -- so alongside each preset's compiled `lib/` output, node_modules also ends up
 * containing the full, fully-commented `src/*.ts` this monorepo wrote (sourcing citations,
 * measured false-positive rates, internal design rationale -- everything). Confirmed these
 * three repos are genuinely private (an unauthenticated `curl` to each returns 404, unlike the
 * public main monorepo, which returns 200) before treating this as a real leak rather than
 * redundant exposure of already-public code.
 *
 * Scoped only to `@aitytech/*` packages, not a blanket "strip every src/ in node_modules":
 * every other dependency here is a public npm-registry package (nspell, retext, write-good,
 * harper.js, ...) whose source is not sensitive even if it happened to be present, and a
 * blanket strip risks deleting a `src/` some third-party package's own runtime code actually
 * needs to resolve at import time. `@aitytech/suzume` is intentionally left untouched by this
 * function even though it matches the scope glob -- checked directly, it ships prebuilt `dist/`
 * only (its own README explains why: the WASM binary is committed prebuilt), no `src/` exists
 * there to strip.
 *
 * This bug is specific to the .mcpb packaging path. The Cloudflare Workers deployment
 * (worker.ts, bundled by esbuild via `wrangler deploy`) and the web app (bundled by Vite) are
 * NOT affected -- both bundlers tree-shake from actual import graphs, so an unreferenced
 * `src/*.ts` file sitting in node_modules never gets pulled into either of those builds.
 * Confirmed this function is necessary (not just careful) by unzipping a real built .mcpb
 * before this fix existed and finding 62 full source files with complete doc comments,
 * including the ones you're reading right now.
 */
function stripPrivateSourceFromStagedPackages(lintCoreStageDir) {
    const scopeDir = path.join(lintCoreStageDir, "node_modules", "@aitytech");
    if (!fs.existsSync(scopeDir)) {
        throw new Error(`expected ${scopeDir} to exist (this monorepo's own @aitytech-scoped deps) -- did the dependency layout change?`);
    }
    let removedBytes = 0;
    let removedDirs = 0;
    for (const pkgName of fs.readdirSync(scopeDir)) {
        const pkgDir = path.join(scopeDir, pkgName);
        if (!fs.statSync(pkgDir).isDirectory()) continue;
        for (const sub of ["src", "test", "tests"]) {
            const target = path.join(pkgDir, sub);
            if (!fs.existsSync(target)) continue;
            removedBytes += dirSizeBytes(target);
            fs.rmSync(target, { recursive: true, force: true });
            removedDirs++;
            log(`removed ${pkgName}/${sub} (private source, not needed at runtime -- lib/ is what's actually imported)`);
        }
    }
    if (removedDirs === 0) {
        throw new Error(
            `expected to remove at least one src/ or test/ directory from @aitytech-scoped packages in ${scopeDir} and removed none -- either the presets stopped shipping source in git installs (unlikely, verify before trusting) or the dependency layout changed. Don't skip silently -- this function existing IS the fix for a real, already-shipped information leak.`
        );
    }
    log(`stripped ${removedDirs} private source dir(s), ${(removedBytes / 1024).toFixed(1)}KB`);
}

function dirSizeBytes(dir) {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) total += dirSizeBytes(full);
        else total += fs.statSync(full).size;
    }
    return total;
}

/** Smoke-test the staged, pre-zip package by actually spawning it and sending a real MCP
 * request over stdin -- the same verification standard the rest of this monorepo holds every
 * rule/engine change to (real execution, never "should work"). */
function smokeTest(dir) {
    return new Promise((resolve, reject) => {
        const child = spawn("node", ["dist/stdio.js"], { cwd: dir, stdio: ["pipe", "pipe", "inherit"] });
        let out = "";
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error("smoke test timed out after 20s"));
        }, 20000);
        child.stdout.on("data", (chunk) => {
            out += chunk.toString();
        });
        child.on("exit", () => {
            clearTimeout(timer);
            const lines = out.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
            const initReply = lines.find((l) => l.id === 1);
            const lintReply = lines.find((l) => l.id === 2);
            if (!initReply?.result?.serverInfo?.name) {
                reject(new Error(`initialize did not return serverInfo -- got: ${JSON.stringify(initReply)}`));
                return;
            }
            const findings = lintReply?.result?.structuredContent?.findings ?? [];
            if (!findings.some((f) => f.ruleId === "harper/Spelling")) {
                reject(
                    new Error(
                        `expected a harper/Spelling finding on "recieve" (proves Harper's WASM loaded from the staged, portable bundle) -- got: ${JSON.stringify(lintReply)}`
                    )
                );
                return;
            }
            log(`smoke test passed: ${findings.length} finding(s), including harper/Spelling`);
            resolve();
        });
        child.on("error", reject);
        const requests = [
            { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "build-mcpb-smoke-test", version: "0" } } },
            { jsonrpc: "2.0", method: "notifications/initialized" },
            { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "lint_text", arguments: { text: "I recieve this every day.", language: "en" } } }
        ];
        for (const req of requests) child.stdin.write(`${JSON.stringify(req)}\n`);
        child.stdin.end();
    });
}

async function main() {
    log("Building lint-core and mcp-server...");
    buildWorkspacePackage("@aitytech/ai-writing-lint-core");
    buildWorkspacePackage("@aitytech/pencheck-mcp");

    log("Cleaning previous staging dir...");
    rimraf(buildDir);
    fs.mkdirSync(lintCoreStageDir, { recursive: true });
    fs.mkdirSync(pkgStageDir, { recursive: true });

    log("Staging lint-core as a standalone package (no workspace: refs -- verified below)...");
    const lintCorePkg = JSON.parse(fs.readFileSync(path.join(lintCoreDir, "package.json"), "utf8"));
    for (const [name, spec] of Object.entries(lintCorePkg.dependencies ?? {})) {
        if (spec.startsWith("workspace:")) {
            throw new Error(
                `${name} is a workspace: dependency of lint-core (${spec}) -- this script assumes lint-core has none, so a plain \`npm install\` can stage it standalone. That assumption just broke; this script needs updating, not the assumption ignored.`
            );
        }
    }
    copyRecursive(path.join(lintCoreDir, "dist"), path.join(lintCoreStageDir, "dist"));
    fs.copyFileSync(path.join(lintCoreDir, "package.json"), path.join(lintCoreStageDir, "package.json"));
    fs.copyFileSync(path.join(lintCoreDir, ".vale.ini"), path.join(lintCoreStageDir, ".vale.ini"));
    copyRecursive(path.join(lintCoreDir, "styles"), path.join(lintCoreStageDir, "styles"));
    run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], lintCoreStageDir);

    log("Patching a real harper.js path-decoding bug (see this function's own comment)...");
    patchHarperWasmPathBug(lintCoreStageDir);

    log("Stripping private source from staged @aitytech packages (see this function's own comment)...");
    stripPrivateSourceFromStagedPackages(lintCoreStageDir);

    log("Staging mcp-server (dropping agents/@aitytech/suzume -- see this file's header comment)...");
    copyRecursive(path.join(mcpServerDir, "dist"), path.join(pkgStageDir, "dist"));
    const mcpPkg = JSON.parse(fs.readFileSync(path.join(mcpServerDir, "package.json"), "utf8"));
    for (const name of ["agents", "@aitytech/suzume"]) {
        if (!(name in mcpPkg.dependencies)) {
            throw new Error(`expected "${name}" in mcp-server's dependencies to drop -- it's missing, so the package.json shape changed and this script's assumptions need re-checking.`);
        }
        delete mcpPkg.dependencies[name];
    }
    delete mcpPkg.dependencies["@aitytech/ai-writing-lint-core"]; // staged manually below, not via npm
    delete mcpPkg.devDependencies;
    delete mcpPkg.scripts; // irrelevant at runtime; keeps the shipped package.json minimal
    fs.writeFileSync(path.join(pkgStageDir, "package.json"), `${JSON.stringify(mcpPkg, null, 2)}\n`);
    run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], pkgStageDir);

    log("Placing the staged lint-core into node_modules...");
    fs.mkdirSync(path.join(pkgStageDir, "node_modules", "@aitytech"), { recursive: true });
    copyRecursive(lintCoreStageDir, path.join(pkgStageDir, "node_modules", "@aitytech", "ai-writing-lint-core"));
    // Re-add the dependency entry now that the real files are in place, so package.json
    // accurately documents what's bundled (npm won't re-resolve it -- node_modules already
    // has the real files, npm only reads this for `npm ls`-style introspection).
    const finalPkg = JSON.parse(fs.readFileSync(path.join(pkgStageDir, "package.json"), "utf8"));
    finalPkg.dependencies = {
        "@aitytech/ai-writing-lint-core": "file:node_modules/@aitytech/ai-writing-lint-core",
        ...finalPkg.dependencies
    };
    fs.writeFileSync(path.join(pkgStageDir, "package.json"), `${JSON.stringify(finalPkg, null, 2)}\n`);
    fs.rmSync(path.join(pkgStageDir, "package-lock.json"), { force: true });

    fs.copyFileSync(path.join(mcpServerDir, "manifest.json"), path.join(pkgStageDir, "manifest.json"));
    fs.copyFileSync(path.join(mcpServerDir, "icon.png"), path.join(pkgStageDir, "icon.png"));

    log("Smoke-testing the staged (pre-zip) package by actually running it...");
    await smokeTest(pkgStageDir);

    log("Packing with mcpb...");
    fs.mkdirSync(outDir, { recursive: true });
    const version = JSON.parse(fs.readFileSync(path.join(mcpServerDir, "manifest.json"), "utf8")).version;
    const outFile = path.join(outDir, `pencheck-${version}.mcpb`);
    run("npx", ["--yes", "@anthropic-ai/mcpb", "pack", pkgStageDir, outFile], mcpServerDir);

    const stat = fs.statSync(outFile);
    log(`Done: ${path.relative(monorepoRoot, outFile)} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((err) => {
    console.error(`[build-mcpb] FAILED: ${err.message}`);
    process.exit(1);
});
