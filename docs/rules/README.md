# What PenCheck checks

PenCheck reads a draft — English, Vietnamese, or Japanese — and flags three different kinds of things:

1. **AI-writing tells** — stock phrases, mechanical formatting, and structural patterns that read as machine-typed rather than human-written. These come from a rule-based linter, not from asking another AI model "does this sound like AI?" — every finding names an exact, reproducible pattern, not a vibe.
2. **Notation/style consistency** — the same document using two different conventions for the same thing (e.g. "Wi-Fi" here, "wifi" there; straight quotes here, curly quotes there). These rules deliberately don't declare one convention "correct" when real usage disagrees — they only flag when *one document* mixes conventions it should pick one of.
3. **Real spelling, grammar, and style checking** — actual language-correctness engines (Harper, Vale, nspell, retext, write-good, and a custom Japanese morphological pipeline), not just AI-tell detection.

Nothing here is a second AI model judging your writing. Every check is a deterministic rule — same input, same output, every time — and no text is ever sent to a third-party AI service to be linted.

## Pick a language

- **[English](en/README.md)** — 14 AI-tell rules, plus real grammar/spelling (Harper on Claude Desktop, a lighter equivalent everywhere else) and style-guide checking (Vale / write-good).
- **[Tiếng Việt](vi/README.md)** — 11 rule dấu hiệu AI, 3 rule nhất quán cách viết (dựa trên văn bản pháp luật thật), và chính tả thật kèm khôi phục dấu.
- **[日本語](ja/README.md)** — AI-tellルール12個、Suzumeベースの文法チェック7個、校正・表記統一ルール12個、計31ルール。

## One catalog, two ways to reach it

Every rule below runs the same way whether you're using [Claude Desktop](../../packages/mcp-server/README.md) (the `.mcpb` extension) or [ChatGPT](../../packages/mcp-server/README.md) (the hosted `mcp.pencheck.aitytech.com` connector) — with one deliberate exception: English grammar and style checking is deeper on Claude Desktop (Harper's ~823 rules, Vale's full style-guide pass) than on the hosted/ChatGPT path, which uses lighter pure-JavaScript equivalents to fit inside Cloudflare Workers' size budget. That gap is documented honestly in [en/README.md](en/README.md) rather than glossed over — Vietnamese and Japanese have no such gap; every rule for those two languages runs identically everywhere.

## How this documentation was built

Every rule page follows the same shape: what it catches in plain language, why (with the real source cited — a government decision, a style guide, a measured false-positive rate — wherever one exists), and at least one real example pulled verbatim from this project's own test suite. Where a rule has no test coverage to pull a real example from, the page says so explicitly rather than presenting an invented example as verified. Rewritten/"better" versions of flagged text are labeled as illustrative when they're not themselves drawn from a test file, so a reader can always tell a verified example from an authored one.
