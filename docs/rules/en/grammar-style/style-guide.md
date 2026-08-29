# Style Guide Checks (Vale / write-good)

**Engines:** Vale (Claude Desktop) and write-good (everywhere) · **Availability:** both Claude Desktop and ChatGPT/hosted · **Language:** English

This layer is a genuine style-guide checker, the same category of tool that Google, Microsoft, GitHub, and Red Hat all publish their own writing style guides through. It's a different concern from both the AI-writing-tell rules and Harper's grammar/spelling checking: this one looks for weasel words, passive voice, clichés, wordiness, and a couple of specific sentence-opener habits.

Unlike Harper, this runs everywhere. On Claude Desktop it runs through Vale (vale.sh), a dedicated style-linting program, using a rule set called `write-good`. On the hosted/ChatGPT version, it runs the same underlying `write-good` checks directly as a lightweight JavaScript library, since Vale itself is a full program that can't fit into that environment's smaller footprint. The checks and their explanations are the same rule set either way, just run through two different engines, so there's no meaningful gap in coverage here the way there is with Harper.

## The 7 active checks

*Labeled illustrative: no test fixtures for these specific checks exist in this repository, so the examples below are constructed to demonstrate each rule, not pulled from a real test file.*

**Weasel** (warning) — flags vague, hand-wavy qualifiers like "clearly," "obviously," "significantly," "various," and "very" that sound persuasive but don't actually say anything concrete.
> *Illustrative:* "This is obviously a significant improvement." → "This cuts load time from 4 seconds to 1."

**Passive** (warning) — flags passive-voice constructions where the sentence doesn't say who's doing the action.
> *Illustrative:* "The report was written by the team." → "The team wrote the report."

**Cliches** (warning) — flags a long list of stock idioms and clichés (things like "at the end of the day," "think outside the box," "low-hanging fruit").
> *Illustrative:* "Let's think outside the box on this one." → "Let's try an approach nobody's used here before."

**Illusions** (warning) — catches accidentally repeated words, like typing "the the" or "was was."
> *Illustrative:* "We need to to confirm the order." → "We need to confirm the order."

**ThereIs** (error) — flags sentences that open with "There is" or "There are," which write-good calls "unnecessary verbiage" since the sentence almost always reads more directly without it.
> *Illustrative:* "There are several reasons this matters." → "This matters for several reasons."

**So** (error) — flags sentences that open with "So," calling it a word that "adds no meaning" at the start of a sentence.
> *Illustrative:* "So, the update fixes the login bug." → "The update fixes the login bug."

**TooWordy** (warning) — flags a large list of inflated, bureaucratic phrases ("due to the fact that," "in the event that," "at this time") that have a shorter, plainer equivalent.
> *Illustrative:* "We're reviewing this at the present time." → "We're reviewing this now."

## Why E-Prime is disabled

Vale actually ships an eighth check in this rule set, called **E-Prime**, but this tool turns it off. E-Prime isn't really a style-guide rule at all — it's a writing exercise where you compose prose without using any form of the verb "to be" ("is," "are," "was," and so on). No style guide this tool is modeled on actually asks for that. In testing, it fired on 17 out of 25 findings (68%) in one ordinary 146-word draft, almost all of them just flagging the word "is." Left on, it would have buried the genuinely useful findings under a wall of noise, so it's vendored but switched off on both the Claude Desktop and hosted versions.
