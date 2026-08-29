# Repeated Sentence Endings

**Rule ID:** `no-repeated-sentence-ending` · **Severity:** info · **Language:** English

This check catches two related habits: several sentences in a row ending on the same worn-out closing formula (like "...is crucial," or "...should be considered"), and several sentences in a row ending on the literal same phrase. Either pattern is a common AI-writing tell — it's the sound of a piece running out of ways to close a thought and falling back on the same template again and again.

## Example

**❌ Flagged:**
> Time is crucial. Budget is crucial. Staffing is crucial.

**Why:** Three sentences in a row end with the "is crucial" pattern. Repeating the same closing formula like this is a common AI-writing tell — a real writer would usually vary how each point lands.

**✅ Better (illustrative rewrite):**
> Time matters more than anything else here. Budget is tight, too. And without enough staff, none of it comes together.

**❌ Flagged:**
> The team needs careful preparation. The plan also needs careful preparation. The budget also needs careful preparation.

**Why:** All three sentences end with the exact same phrase, "careful preparation." Repeating the identical closing phrase three times in a row is a stronger version of the same tell — it reads as templated rather than composed.

**✅ Better (illustrative rewrite):**
> The team needs careful preparation, and so does the plan. The budget deserves the same level of attention.
