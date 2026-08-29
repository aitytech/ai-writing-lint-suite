# Title Case Headings Overused

**Rule ID:** `no-title-case-headings` · **Severity:** info · **Language:** English

This check looks at all the headings in a document as a group. Writing every heading in Title Case ("Every Word In The Heading Capitalized Like This") is a normal, accepted style choice on its own, and a single Title Case heading is completely unremarkable. What's a documented AI-writing tell is doing it *consistently, across the whole document*: human technical writing tends to favor sentence case ("Getting started with X") or a natural mix, while AI output defaults to Title Case on nearly every heading without variation. This is a document-level check — it only fires when most of a document's headings follow the pattern, not when any single heading does.

## Example

**❌ Flagged:**
> \# Getting Started With The API
>
> \#\# How Authentication Works Today
>
> \#\#\# A Quick Note On Rate Limits

**Why:** All three headings capitalize nearly every word. On their own, none of these would be worth a second look, but the document-wide consistency of the pattern is what this check treats as a signal.

**✅ Better:**
> \# Getting started with the API
>
> \#\# How does authentication work
>
> \#\#\# A quick note on rate limits

*(This "better" version is pulled directly from the rule's own valid test case — sentence case throughout, which passes cleanly.)*
