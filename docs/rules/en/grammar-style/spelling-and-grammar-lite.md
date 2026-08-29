# What ChatGPT Gets Instead of Harper (Spelling and Grammar Lite)

**Engines:** English spelling check + English grammar lite · **Availability:** ChatGPT / hosted version only · **Language:** English

Harper, the full grammar and spelling engine described elsewhere in these pages, is too large to run in the hosted, browser-based version of this tool (the version ChatGPT and similar clients connect to). Rather than leave that version with no spelling or grammar checking at all, it runs two smaller, purpose-built substitutes instead. They cover meaningfully less ground than Harper, but real ground.

This gap was found directly, not assumed: a user's draft included the sentence "As an AI language model, I recieve alot of requests." When linted through the hosted connector, only the AI-writing-tell finding came back — "recieve" and "alot" went completely unflagged. That gap is what these two engines exist to close.

## Spelling: catches real misspellings

Built on nspell, a spell-checking library, paired with a standard English dictionary. It only knows whether a word exists in the dictionary, not whether it's the *right* word for the sentence, so it's a narrower tool than Harper's grammar-aware spelling. Still, it catches the everyday typo.

*Illustrative example (no test fixture exists for this engine in the repository):*
> "I recieve alot of requests every day."

Flags "recieve" (suggesting "receive") and "alot" (suggesting a single-word alternative like "allot," since nspell only knows real single words, not that "alot" should become the two words "a lot" — Harper's version of this same catch is smarter about word pairs).

## Grammar lite: three targeted checks

This engine runs three specific, narrow grammar checks, each considerably smaller in scope than Harper's ~823 rules, but each verified to work correctly:

**"A" vs. "an" agreement** — catches the wrong indefinite article before a word.
> *Illustrative:* "I saw a elephant at the zoo." → "I saw an elephant at the zoo."

**Repeated words** — catches accidentally doubled words, the same category Vale/write-good's "Illusions" check covers.
> *Illustrative:* "We need to to review this." → "We need to review this."

**Missing apostrophes in contractions** — catches a contraction that's missing its apostrophe, while carefully leaving real dictionary words alone (for example, "wont" is a real word meaning "habitual practice," so it's correctly never flagged, while "dont," "isnt," and "youre" are).
> *Illustrative:* "I dont think that's right." → "I don't think that's right."

## What's still missing on this path

This pair does not attempt to replace subject-verb agreement checking, tense checking, or the wide range of punctuation and usage rules Harper covers. That gap is real and stays real on the hosted/ChatGPT path — no lightweight, pure-JavaScript equivalent of Harper's full depth was found to exist. What these two engines add is a genuine, meaningful floor: spelling and a handful of clear-cut grammar mistakes no longer go completely unflagged.
