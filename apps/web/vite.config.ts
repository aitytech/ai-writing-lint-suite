import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Web app for the ai-writing-lint-suite monorepo. Wires @aitytech/ai-writing-lint-core
// (the shared EN/VI/JA detection engine) into a CodeMirror 6 manuscript editor. See
// packages/lint-core for the actual rule logic -- nothing rule-related lives here.
//
// The JA preset is loaded lazily (dynamic import inside lint-core, see its
// JapaneseUnavailableError) because it pulls in kuromoji -> zlibjs, an unmaintained
// pre-ESM UMD package (last published ~2015) whose "is my global already defined" check
// breaks once Vite's dep pre-bundler rewrites it: "Cannot use 'in' operator to search
// for 'Zlib' in undefined" (confirmed by direct in-page repro, not assumed).
// optimizeDeps.exclude keeps Vite's dependency scanner from eagerly crawling into that
// broken package at server startup -- without it, the scanner's static analysis still
// finds the dynamic import() and tries (and fails) to pre-bundle it before any JA lint
// is ever requested, which is what was crashing EN/VI too.
//
// resolve.alias("path" -> path-browserify) fixes a real, previously-undiagnosed bug: the VI
// (and JA) preset's prh.ts rule calls prh's `fromYAML()` at MODULE SCOPE (see that file's own
// comment -- "loaded once at module scope... parsing the YAML on every lint call would be
// wasteful"), and prh's fromRowConfig() unconditionally calls `path.normalize()` internally
// even when passed inline YAML content (no actual file to resolve). Vite's default browser
// build externalizes Node's `path` module to an empty stub rather than a working polyfill, so
// that call throws `TypeError: path.normalize is not a function` -- and because it happens
// during top-level ES module evaluation of a script the whole app imports transitively (not
// inside a promise/event handler), the entire module graph fails to instantiate silently: no
// console error surfaced in Vite's dev overlay, no React error boundary triggered, #root just
// stays permanently empty. Root-caused by bisecting the exact import (isolated down to this
// one `fromYAML()` call, confirmed by triggering it via a dynamic import in isolation, which
// DOES surface the error since promise rejections report differently than top-level module
// instantiation failures) rather than guessed from the symptom. `path-browserify` is a real,
// widely-used pure-JS implementation of Node's path module (not a stub), so `path.normalize`
// and everything else prh's engine touches now behaves correctly in the browser too.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      path: "path-browserify"
    }
  },
  optimizeDeps: {
    exclude: ["@aitytech/textlint-rule-preset-ai-writing-ja", "kuromoji", "kuromojin", "zlibjs"]
  },
  server: {
    port: 5173
  }
});
