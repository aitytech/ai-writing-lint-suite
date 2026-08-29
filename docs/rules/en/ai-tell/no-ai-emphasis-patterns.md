# Overused Bold and Emoji Emphasis

**Rule ID:** `no-ai-emphasis-patterns` · **Severity:** error · **Language:** English

This check looks for three habits AI writing tools fall into when they try to add emphasis: pairing an emoji with **bold text** (like "✅ **Fast setup**"), starting a line with a bold label like "**Note:**" or "**Important:**," and bolding text inside a heading, which is redundant since a heading is already visually distinct. None of these are wrong occasionally, but a document that leans on them constantly starts to look mechanically generated rather than written by a person.

*Note: this rule doesn't have a dedicated test file in the source repository, so the examples below are illustrative — built to match the rule's own patterns exactly, not pulled from a real test case.*

## Example

**❌ Flagged (illustrative):**
> ✅ **Fast setup** — you'll be running in under five minutes.

**Why:** Combining a decorative emoji with bold text is a pattern that reads as mechanical, checklist-style formatting rather than natural prose.

**✅ Better (illustrative rewrite):**
> Setup is fast. You'll be running in under five minutes.

**❌ Flagged (illustrative):**
> **Note:** this setting only applies to new accounts.

**Why:** Bold "info-prefixes" like "**Note:**" or "**Important:**" are a common AI-writing habit. Used on every other line, they start to look templated rather than genuinely emphasized.

**✅ Better (illustrative rewrite):**
> This setting only applies to new accounts.

**❌ Flagged (illustrative):**
> ## **Getting Started**

**Why:** Bold text inside a heading is redundant — the heading is already emphasis on its own. The rule can even fix this one automatically by stripping the extra bold markers.

**✅ Better (illustrative rewrite):**
> ## Getting Started
