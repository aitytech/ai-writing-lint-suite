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
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@aitytech/textlint-rule-preset-ai-writing-ja", "kuromoji", "kuromojin", "zlibjs"]
  },
  server: {
    port: 5173
  }
});
