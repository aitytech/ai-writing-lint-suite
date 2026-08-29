# Mixed Date Formats

**Rule ID:** `no-mixed-date-notation` · **Severity:** info · **Language:** English

There are three legitimate ways to write a numeric date: US-style month-first (4/25/2026), international day-first (25/4/2026), and ISO 8601 (2026-04-25). None of these is "the" correct way to write English dates — American English typically defaults to month-first, most other English-speaking countries default to day-first, and ISO 8601 is the standard in technical contexts specifically because it sidesteps the ambiguity. This check isn't about which one you should use. It only flags a document that mixes more than one convention, because the exact same digit pair can name a genuinely different calendar date depending on which convention the reader assumes.

The Microsoft Writing Style Guide makes this exact point in its own "Numbers in dates" guidance: "The positions of the month and day vary by country. For example, 6/12/2017 might be June 12, 2017 or December 6, 2017." Google's Developer Documentation Style Guide gives a similar warning and recommends the ISO format specifically to avoid it: "04/05/09 means different things in different regions." This check is built on that same idea: mixing conventions in one document is a real, sourced defect, not a style preference.

## Example

**❌ Flagged:**
> Filed on 4/25/2026 and closed on 30/6/2026.

**Why:** "4/25/2026" is unambiguously US-style (day 25 can't be a month), while "30/6/2026" is unambiguously international-style (day 30 can't be a month either). The same document is using two different conventions for the same kind of date, which is exactly the ambiguity Microsoft's and Google's own style guides warn about.

**✅ Better (illustrative rewrite):**
> Filed on 4/25/2026 and closed on 6/30/2026.

*(Or, switching to the unambiguous ISO format: "Filed on 2026-04-25 and closed on 2026-06-30.")*

**❌ Flagged:**
> Kickoff 4/25/2026, sync 4/26/2026, close-out 26/4/2026, archived 2026-04-27.

**Why:** This one mixes all three conventions in a single sentence. Most of the dates here use US-style, so the international-style "26/4/2026" and the ISO-style "2026-04-27" both stand out as the odd ones out.

**✅ Better (illustrative rewrite):**
> Kickoff 4/25/2026, sync 4/26/2026, close-out 4/26/2026, archived 4/27/2026.
