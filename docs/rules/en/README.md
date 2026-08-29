# PenCheck: English Rules Reference

This is the full list of what PenCheck checks for in English writing, organized into four groups. **AI-writing-tell rules** look for patterns and phrases that make text read as AI-generated rather than human-written, like "delve into," heavy em-dash use, or robotic list formatting. **Harper** is a real, full-strength grammar and spelling checker that runs inside the Claude Desktop app. **Vale / write-good** is a genuine style-guide checker (weasel words, passive voice, clichés, wordiness) that runs everywhere. And **spelling and grammar lite** are two lightweight substitutes that give the hosted/ChatGPT version of the tool real spelling and basic grammar checking, since the full Harper engine is too large to fit there.

## AI-writing-tell rules

| Rule | Description | Severity |
|---|---|---|
| [no-ai-artifact-leakage](ai-tell/no-ai-artifact-leakage.md) | Catches leftover chatbot artifacts: AI self-identification, knowledge-cutoff disclaimers, unfilled template placeholders | error |
| [no-ai-hype-expressions](ai-tell/no-ai-hype-expressions.md) | Catches overclaiming hype words and stock AI filler phrases ("game-changer," "delve into," and more) | error |
| [no-ai-emphasis-patterns](ai-tell/no-ai-emphasis-patterns.md) | Catches emoji+bold combos, bold info-prefixes ("**Note:**"), and redundant bold text inside headings | error |
| [no-ai-list-formatting](ai-tell/no-ai-list-formatting.md) | Catches mechanically formatted bullet lists: decorative emoji on every line, "**Bold**: ..." on every bullet | error |
| [no-em-dash-overuse](ai-tell/no-em-dash-overuse.md) | Catches paragraphs that lean heavily on the em dash for every aside | info |
| [no-low-lexical-diversity](ai-tell/no-low-lexical-diversity.md) | Catches paragraphs that reuse the same handful of words instead of varying vocabulary | info |
| [no-low-punctuation-entropy](ai-tell/no-low-punctuation-entropy.md) | Catches paragraphs that rely on a narrow punctuation palette (mostly periods and commas) | info |
| [no-mixed-date-notation](ai-tell/no-mixed-date-notation.md) | Catches a document that mixes numeric date conventions (US, international, ISO 8601) | info |
| [no-mixed-quote-style](ai-tell/no-mixed-quote-style.md) | Catches a document that mixes straight and curly quotation marks/apostrophes | info |
| [no-monotonous-function-word-bigrams](ai-tell/no-monotonous-function-word-bigrams.md) | Catches paragraphs that overuse the same connector-word pairs ("of the," "in the") | info |
| [no-repeated-sentence-ending](ai-tell/no-repeated-sentence-ending.md) | Catches several sentences in a row ending on the same closing formula or phrase | info |
| [no-title-case-headings](ai-tell/no-title-case-headings.md) | Catches a document where most headings consistently use Title Case | info |
| [no-uniform-sentence-rhythm](ai-tell/no-uniform-sentence-rhythm.md) | Catches stretches of consecutive sentences that are all nearly the same length | info |
| [tech-writing-guideline](ai-tell/tech-writing-guideline.md) | Broad technical-writing guidance based on the "7 C's" framework, covering ten sub-patterns from redundant phrasing to vague sourcing | info |

## Grammar and style engines

| Engine | Description | Availability |
|---|---|---|
| [Harper](grammar-style/harper.md) | Full grammar and spelling checker, ~823 rules across spelling, agreement, punctuation, style, and more | Claude Desktop only |
| [Vale / write-good](grammar-style/style-guide.md) | Style-guide checker: weasel words, passive voice, clichés, wordiness, and two sentence-opener checks (7 active checks) | Claude Desktop and ChatGPT/hosted |
| [Spelling and grammar lite](grammar-style/spelling-and-grammar-lite.md) | Lightweight spelling (nspell) and basic grammar (a/an agreement, repeated words, missing apostrophes) for the hosted path | ChatGPT/hosted only |

## What runs where

Adapted from the English-relevant rows of the capability table in `packages/mcp-server/README.md`.

| | Claude Desktop | ChatGPT / hosted |
|---|---|---|
| AI-writing-tell rules (all 14 above) | ✅ | ✅ |
| Spelling | ✅ Harper, grammar-aware | ✅ nspell + dictionary-en, dictionary-only |
| Grammar beyond spelling | ✅ Harper (~823 rules) | ✅ retext (a/an agreement, repeated words, contractions — 3 targeted checks) |
| Style guide (weasel words, passive voice, wordiness, clichés) | ✅ Vale, 7 active checks | ✅ write-good directly, the same 7 checks |
| Grammar Harper catches that nothing else does (agreement, tense, most punctuation) | ✅ Harper | ❌ no lightweight equivalent exists |

Both paths run the exact same 14 AI-writing-tell rules and the exact same 7 style-guide checks. The one real, permanent gap is Harper's full depth: subject-verb agreement, tense checking, and the bulk of its ~823-rule surface only run inside the Claude Desktop app, because no comparably capable pure-JavaScript alternative exists yet that fits the hosted version's much smaller size budget.
