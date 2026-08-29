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

**Status: live**, on Cloudflare Pages (project name `writelikeyou`, fits alongside
`packages/mcp-server`'s Workers deployment on the same account):

```bash
pnpm --filter @aitytech/ai-writing-lint-web build
npx wrangler pages deploy dist --project-name=writelikeyou   # run from apps/web
```

Live at `https://writelikeyou.pages.dev` and `https://writelikeyou.aitytech.com` (custom
domain, added via the Cloudflare API since this wrangler version's CLI has no `pages domain
add` subcommand — the DNS `CNAME` record for a Pages custom domain isn't auto-created by that
API call and needs `dns_records:write` scope, which this project's stored Cloudflare token
doesn't have; added manually via the dashboard instead). Verified end-to-end with a real
headless-browser check against the live URL (not just `curl` — this app needs JS to execute
before there's anything to check): page renders, live-lint runs on keystroke, zero console
errors, matching the local dev/preview behavior exactly.

No CI workflow yet — redeploy is a manual `wrangler pages deploy` after `pnpm build`.

## Structure

```
src/
├── App.tsx              — theme/language toggles, debounced lint, ledger UI
├── lint/decorations.ts  — CodeMirror decorations + hover tooltip extension
├── lint/markdownTheme.ts — live-markdown syntax highlighting + tooltip styling
├── i18n/                — i18next setup, en/vi/ja locale files
└── index.css             — design tokens (light/dark), workbench layout
```
