# Technical Writing Quality Guidance (the 7 C's)

**Rule ID:** `tech-writing-guideline` · **Severity:** info · **Language:** English

This is the broadest check in the set. It's built around the "7 C's" of technical writing (Clear, Concise, Correct, Coherent, Concrete, Complete, Courteous) and scans for ten different categories of issues under that umbrella: redundant filler phrases, passive voice that hides who's doing something, vague unquantified claims, inconsistent terminology, sequential steps buried in prose instead of a list, and a handful of specific AI-writing tics like "not only X but also Y," figurative "everything from X to Y" phrasing, "serves as a/the..." instead of a plain "is," formal sign-offs like "In conclusion," and vague unnamed sourcing like "industry reports suggest." When it finds any of these, it also prints a short document-level summary tallying how many of each kind it found.

## Example

**❌ Flagged:**
> We updated the config file in order to fix the bug.

**Why:** "In order to" is a padded, redundant way of saying "to." Trimming it makes the sentence more concise without losing any meaning.

**✅ Better:**
> We updated the config file to fix the bug.

**❌ Flagged:**
> This change was performed by the deployment script.

**Why:** This is passive voice that hides who (or what) actually did the work. Naming the actor directly is clearer and more direct.

**✅ Better:**
> The deployment script made this change.

**❌ Flagged:**
> Industry reports suggest that adoption is accelerating across the sector this year.

**Why:** "Industry reports suggest" is vague, unnamed sourcing — the kind of hedge AI defaults to when it doesn't have a real source to cite. Naming the actual report (or cutting the claim) is more trustworthy.

**✅ Better (illustrative rewrite):**
> A 2026 Gartner survey found adoption accelerating across the sector this year.

**Other patterns this check watches for**, each pulled from the rule's own real test cases: "The tool not only speeds up writing but also improves consistency" (the "not only...but also" parallelism tic), "The platform handles everything from onboarding to reporting" (vague "everything from X to Y" scope-inflation), "This dashboard serves as a central hub for every team update" ("serves as a/the..." avoiding a plain "is"), and "In conclusion, this approach saves significant time" (a formulaic AI sign-off opener).
