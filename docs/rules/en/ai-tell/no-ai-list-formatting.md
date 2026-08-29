# Mechanical List Formatting

**Rule ID:** `no-ai-list-formatting` · **Severity:** error · **Language:** English

This check looks at bullet lists for two habits that make them feel machine-generated: starting every single bullet with a decorative emoji (✅, 🚀, 💡, and similar), and opening every bullet with the same "**Bold Word**: explanation" structure. A list where every line follows the identical template starts to feel like it was assembled from a formula rather than written with any variation.

*Note: this rule doesn't have a dedicated test file in the source repository, so the examples below are illustrative — built to match the rule's own patterns exactly, not pulled from a real test case.*

## Example

**❌ Flagged (illustrative):**
> - 🚀 Fast onboarding for new team members
> - 💡 Smart suggestions as you type
> - ✅ Reliable uptime across regions

**Why:** A leading decorative emoji on every list item reads as mechanical, AI-generated formatting. Used sparingly and only where it adds real meaning, emoji are fine — the problem is doing it on every single line.

**✅ Better (illustrative rewrite):**
> - New team members are up and running in under a day.
> - Suggestions appear automatically as you type.
> - Uptime has stayed above 99.9% across every region we operate in.

**❌ Flagged (illustrative):**
> - **Speed**: pages load in under a second.
> - **Reliability**: the service has had zero outages this year.
> - **Support**: our team responds within an hour.

**Why:** A "**Bold Word**: ..." opener on every bullet is a common AI-writing tell. Repeating the same structure across a whole list makes it feel templated instead of naturally written.

**✅ Better (illustrative rewrite):**
> - Pages load in under a second.
> - The service has had zero outages this year.
> - Our support team responds within an hour.
