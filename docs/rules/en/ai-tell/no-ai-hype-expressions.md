# Hype and Filler Phrases

**Rule ID:** `no-ai-hype-expressions` · **Severity:** error · **Language:** English

This check flags a long list of words and phrases that AI writing tools reach for constantly: overclaiming words like "revolutionary" and "game-changer," abstract filler like "delve into" and "unlock the potential," and a handful of phrases confirmed by real data to show up almost exclusively in AI-written text. Some of these patterns were tested directly against a dataset of 900 real human answers and 300 real ChatGPT answers to the same questions, and the phrases kept here appeared zero times in the human answers and ten or more times in the AI ones. One candidate phrase, "a variety of," was actually removed after a broader test found it in perfectly ordinary human writing about unrelated topics, which is a good reminder that even data-backed rules get revised when new evidence shows up.

## Example

**❌ Flagged:**
> This product is a true game-changer for the industry.

**Why:** "Game-changer" reads as a stock AI phrase rather than a real description. It doesn't tell the reader what actually changed.

**✅ Better (illustrative rewrite):**
> This product cuts our setup time from two days to twenty minutes.

**❌ Flagged:**
> Let's delve into the details of this quarter's results.

**Why:** "Delve into" is one of the most common AI-writing tells there is. It's a wind-up phrase that delays the actual point.

**✅ Better (illustrative rewrite):**
> Here are the details of this quarter's results.

**❌ Flagged:**
> Please let me know if you have any questions.

**Why:** This is a data-validated tell: testing against the 900 human vs. 300 ChatGPT answer set found this closing line almost exclusively in the AI answers. It's a leftover chat-assistant habit that doesn't belong in article-style writing.

**✅ Better (illustrative rewrite):**
> Reach out to our support team with any questions.
