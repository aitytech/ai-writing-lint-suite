# Real Grammar and Spelling Checking (Harper)

**Engine:** Harper · **Availability:** Claude Desktop only · **Language:** English

Everything documented elsewhere in these pages catches writing that *sounds like AI wrote it*. Harper is different: it's a genuine grammar and spelling checker, the same category of tool as a traditional proofreading engine, running about 823 individual rules covering spelling, grammar, subject-verb agreement, punctuation, word choice, and more. It's an open-source engine (github.com/automattic/harper) that runs entirely on your device, with no text ever leaving your machine.

**Why it's Claude Desktop only:** this is honestly a size constraint, not a quality one. Harper's engine is about 15.6MB on its own, which is far too large to ship inside the free, browser-based version of this tool (the "hosted" or ChatGPT-connected version has a strict size budget it can't exceed). Inside the Claude Desktop app, there's no such limit, so Harper runs there at full strength, all 823 rules included. The hosted version uses lighter-weight substitutes instead (see the spelling-and-grammar-lite page in this same folder) that cover a smaller, but still genuinely useful, slice of the same ground.

## Main categories

Harper sorts every finding into a "kind," and this tool maps each kind to a severity (error, warning, or info) based on how confident it is a real problem. Below are the categories, in plain language, each with one realistic example.

*Labeled illustrative: Harper's underlying ~823 rules aren't part of this repository, so these examples are constructed to demonstrate what each category catches, not pulled from a real test file.*

| Category | Severity | What it catches | Illustrative example |
|---|---|---|---|
| Spelling | error | Plain misspelled words | "This is an obvious mistaike." → *mistake* |
| Typo | error | Typo-style errors (transposed letters, stray characters) | "The form was aproved yesterday." → *approved* |
| Agreement | error | Subject-verb or number agreement mismatches | "The team are launching next week." → *is launching* |
| BoundaryError | error | Words wrongly joined or split ("alot" instead of "a lot") | "There's alot of work left to do." → *a lot* |
| Nonstandard | error | Nonstandard usage most style guides flag | "He don't know the answer." → *doesn't* |
| Grammar | error | General grammatical errors outside the categories above | "She go to the office every day." → *goes* |
| Capitalization | warning | Wrong capitalization (proper nouns, sentence starts) | "We use claude for our writing." → *Claude* |
| Punctuation | warning | Missing, extra, or misplaced punctuation | "Its fine we'll fix it later." → *It's* |
| Repetition | warning | Accidentally doubled words | "We need to to confirm the order." → *to confirm* (once) |
| WordOrder | warning | Words in the wrong order | "I know not what happened." → *I don't know what happened* |
| Redundancy | warning | Saying the same thing twice unnecessarily | "It's a free gift with every order." → *free* or *gift*, not both |
| Malapropism | warning | A word that sounds like the intended one but means something else | "The new hire has a lot of temerity for the job." (probably meant *tenacity*) |
| Usage | warning | A real word used in a way that doesn't fit the context | "I could of finished it sooner." → *could have* |
| Regionalism | info | A spelling or phrase specific to one English dialect | "We optimised the color scheme." (mixes British and American spelling) |
| Eggcorn | info | A misheard phrase that sounds plausible but is wrong ("for all intensive purposes") | "For all intensive purposes, the deal is done." → *intents and purposes* |
| Enhancement | info | A suggestion for a stronger word or phrasing choice | "The results were good." → consider a more specific word |
| Formatting | info | Formatting-level suggestions (spacing, list style, etc.) | "Email us at:info@example.com" → add a space after the colon |
| Miscellaneous | info | Findings that don't fit neatly into another category | — |
| Readability | info | Sentences that are hard to follow or overly long | A 60-word sentence with five embedded clauses |
| Style | info | Softer style opinions rather than hard errors | "The team did a really good job." → consider "did well" |
| WordChoice | info | A more precise or natural word exists for the context | "The update was very fast." → consider a stronger, more specific adjective |
