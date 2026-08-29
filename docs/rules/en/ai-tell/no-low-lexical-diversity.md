# Repetitive Word Choice

**Rule ID:** `no-low-lexical-diversity` · **Severity:** info · **Language:** English

This check measures how many different words a paragraph actually uses, once you set aside common connector words like "the," "and," and "of." Research into detecting AI-generated text has found that low word variety (a low "type-token ratio," in the technical term) is one of the more reliable signals across different kinds of writing. A paragraph that keeps circling back to the same handful of words, even while making different points, reads as noticeably repetitive to a human reader too.

## Example

**❌ Flagged:**
> This tool saves time. This tool saves money. This tool saves effort. This tool saves energy. This tool saves resources. This tool saves headaches. This tool saves days. This tool saves weeks. This tool saves budget. This tool saves staff. This tool saves risk. This tool saves stress. This tool saves space. This tool saves trouble. This tool saves fuel. This tool saves paper. This tool saves memory. This tool saves power. This tool saves water. This tool saves calls.

**Why:** This paragraph reuses "this tool saves" twenty times in a row, which pushes its word variety down to about 37%, well under the 45% threshold this check uses. Even though every sentence is grammatically fine, the repetition is a validated marker of AI-generated text.

**✅ Better (illustrative rewrite):**
> This tool saves time, money, and effort. It cuts down on wasted energy and resources, reduces the paperwork headaches teams deal with every week, and frees up staff to focus on higher-value work. Over a year, that adds up to meaningful savings across budget, fuel, and storage costs alike.
