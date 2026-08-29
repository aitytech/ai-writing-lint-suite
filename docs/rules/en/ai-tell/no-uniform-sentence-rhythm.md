# Uniform Sentence Length

**Rule ID:** `no-uniform-sentence-rhythm` · **Severity:** info · **Language:** English

Natural writing tends to mix short punchy sentences with longer, more detailed ones. This check looks for stretches of several consecutive sentences that are all nearly identical in length, which produces a flat, monotonous rhythm that's a common tell of AI-generated text. It's calibrated against real news writing, so ordinary natural variation in sentence length won't trip it.

## Example

**❌ Flagged:**
> AI processes data very fast now. Humans process data rather slowly. Machines run all day and all night. Staff only work eight hours daily.

**Why:** These four consecutive sentences vary in length by only about 9%, well under the 15% variance this check allows. Even though the content differs from sentence to sentence, the near-identical rhythm reads as mechanical rather than naturally paced.

**✅ Better (illustrative rewrite):**
> AI processes data fast. Humans, working manually, take considerably longer to reach the same result. Machines can run continuously, day and night, without needing rest. Staff can't.
