# Vendored Vale style: `write-good`

These eight `.yml` files are **vendored third-party rule data**, not AITYTECH code. Nothing
here is hand-written or hand-edited — they were fetched verbatim with `curl` from upstream and
must be re-fetched, never patched in place, if they need updating.

| | |
|---|---|
| Upstream | <https://github.com/vale-cli/write-good> |
| Path | `write-good/<RuleName>.yml` on `master` |
| Commit vendored | `c9ceca7f574248a201d5524b001099c5626c7519` (2025-05-23) |
| License | MIT — Copyright (c) 2019 errata.ai |
| Fetched | 2026-08-29 |

Upstream is itself a Vale port of the well-known [`write-good`](https://github.com/btford/write-good)
npm tool's rules. It is a *style-guide* checker: weasel words, wordiness, cliches, passive-voice-adjacent
E-Prime checks. That is a different concern from grammar/spelling (Harper, see `../../src/harper.ts`)
and is the English counterpart to what `textlint-rule-prh` does for Japanese notation consistency.

## Why these files exist at all

Vale ships **no meaningful built-in style**. Pointed at an empty `StylesPath` it emits literally
zero findings (verified directly: `{}` JSON output). The rules in this directory *are* the check —
delete them and `checkEnglishStyle()` silently starts passing everything.

## Files

`Cliches.yml`, `E-Prime.yml`, `Illusions.yml`, `Passive.yml`, `So.yml`, `ThereIs.yml`,
`TooWordy.yml`, `Weasel.yml`

The set is deliberately the whole of upstream's rule directory. Each maps to a `ruleId` of
`vale/write-good.<RuleName>` in this package's `LintFinding` output.

## Re-fetching

```sh
cd packages/lint-core/styles/write-good
for f in Cliches E-Prime Illusions Passive So ThereIs TooWordy Weasel; do
  curl -sfSL -o "$f.yml" "https://raw.githubusercontent.com/vale-cli/write-good/master/write-good/$f.yml"
done
```

Update the commit hash and fetch date in the table above when you do.
