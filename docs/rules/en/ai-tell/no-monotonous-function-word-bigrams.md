# Repetitive Sentence Connectors

**Rule ID:** `no-monotonous-function-word-bigrams` · **Severity:** info · **Language:** English

This check looks at the small "glue" words that hold sentences together, pairs like "of the," "in the," and "and the," and measures how varied those connections are across a paragraph. This kind of pattern (called function-word bigram frequency) is a well-established feature in authorship analysis, and recent research into detecting AI-generated text has found it to be one of the strongest signals when combined with other features. A paragraph that keeps reusing the exact same connector phrases, even while covering different ideas, tends to read as flatter and more repetitive than natural writing.

## Example

**❌ Flagged:**
> The result of the test showed part of the process was slow. Most of the delay was in the middle of the system, not in the start of the flow or the end of the chain.

**Why:** This short paragraph reuses "of the" and "in the" so heavily that the variety of connector phrases drops well below the threshold this check uses. It's grammatically correct throughout, but the repeated scaffolding is a signal linked to AI-generated text.

**✅ Better (illustrative rewrite):**
> The test results showed a slow step midway through the process, not at the start or the end. That delay sat squarely in the system's middle stage.
