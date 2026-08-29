# WriteLikeYou / ai-writing-lint-suite

A pnpm/turborepo monorepo for **WriteLikeYou**, a rule-based (not model-based) detector for
AI-writing tells — stock phrases, hedging, structural clichés — across English, Vietnamese,
and Japanese.

## Layout

```
apps/
  web/          — WriteLikeYou editor (Vite + React 19 + CodeMirror 6). Not yet deployed. See apps/web/README.md.
  mobile/       — React Native (Ignite/Expo CNG). Scaffolded, not yet wired to lint-core.
packages/
  lint-core/    — shared lint engine wrapping the three presets below. See packages/lint-core/README.md.
  mcp-server/   — Model Context Protocol server (Claude Desktop + Cloudflare Workers). See packages/mcp-server/README.md.
forks/          — standalone GitHub repos consumed as pinned git dependencies (each is its own
                  repo with its own remote; not part of this repo's git history — see .gitignore).
  textlint-rule-preset-ai-writing-en/
  textlint-rule-preset-ai-writing-vi/
  textlint-rule-preset-ai-writing-ja/            — AITYTECH fork of textlint-ja/textlint-rule-preset-ai-writing
  textlint-rule-preset-ai-writing-ja-upstream/   — clean mirror of upstream, for diffing/rebasing the fork
  suzume/                                        — AITYTECH fork of libraz/suzume (WASM JA tokenizer)
  suzume-wasm/                                   — standalone distribution repo for @aitytech/suzume (npm can't
                                                     resolve pnpm's git-subdirectory syntax, hence the split repo)
_archive/       — superseded local work kept instead of deleted.
```

## Getting started

```bash
pnpm install
pnpm build     # turbo run build, respects the packages/* -> apps/* dependency graph
pnpm dev       # turbo run dev (persistent, per-package)
```

Dependency versions are pinned exact (no `^`/`~`) across this workspace by policy — check
`npm view <pkg> version` before bumping, don't drift to a range.

## Why the preset repos are forks, not upstream packages

- **EN/VI**: AITYTECH-authored from the start (`textlint-rule-preset-ai-writing-{en,vi}`).
- **JA**: forked from `textlint-ja/textlint-rule-preset-ai-writing` (upstream, 5 rules) with
  AITYTECH's EN/VI rule additions ported over — currently 5 of EN/VI's ~11-12 rules have been
  ported; the rest are still pending (see the JA preset's own issue tracker / this repo's
  outstanding TODOs).
- **Suzume**: forked from `libraz/suzume` and patched to accept a precompiled WASM module at
  init (`instantiateWasm`), plus a Workers-only build variant — both needed to make Japanese
  linting actually work on Cloudflare Workers. See `packages/mcp-server/README.md` for the
  full story.

## Status

- `apps/web`: functional, local dev only, not deployed.
- `apps/mobile`: scaffolded, not wired to `lint-core` yet.
- `apps/macos`: not started.
- `packages/mcp-server`: functional and verified end-to-end locally (stdio + `wrangler dev`),
  **not yet deployed to production** — see its README for the remaining deploy steps.
