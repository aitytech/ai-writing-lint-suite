# WriteLikeYou (web)

Vite + React 19 + CodeMirror 6 editor for `@aitytech/ai-writing-lint-core`. Paste or write text,
get live-flagged AI-writing tells with hover tooltips, severity filtering, and click-to-jump
between the editor and the findings list ("ledger").

## Features

- Light/dark/system theme toggle, persisted to `localStorage`.
- Language toggle (`auto | en | vi | ja`) — drives both linting and UI locale (i18next).
- Debounced live linting (400ms) with a clarity-score gauge.
- Findings ledger: severity filter, pagination (30/page, "show more"), click a finding to jump
  the editor cursor to that span.
- Hover any flagged span in the editor for the rule name + message inline.

## Development

```bash
pnpm --filter @aitytech/ai-writing-lint-web dev       # http://localhost:5173
pnpm --filter @aitytech/ai-writing-lint-web build      # tsc -b && vite build
pnpm --filter @aitytech/ai-writing-lint-web lint       # tsc --noEmit
```

## Deployment

**Not deployed anywhere yet.** No hosting config exists in this directory (no Vercel/Netlify
config, no CI workflow) — `pnpm build` produces a static `dist/` that hasn't been pointed at a
host. Pick a static host (Cloudflare Pages fits naturally alongside `packages/mcp-server`'s
Workers deployment) and wire it up when this is ready to ship.

## Structure

```
src/
├── App.tsx              — theme/language toggles, debounced lint, ledger UI
├── lint/decorations.ts  — CodeMirror decorations + hover tooltip extension
├── lint/markdownTheme.ts — live-markdown syntax highlighting + tooltip styling
├── i18n/                — i18next setup, en/vi/ja locale files
└── index.css             — design tokens (light/dark), workbench layout
```
