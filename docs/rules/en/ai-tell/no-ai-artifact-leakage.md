# Leftover Chatbot Artifacts

**Rule ID:** `no-ai-artifact-leakage` · **Severity:** error · **Language:** English

This one catches the phrases that slip through when someone copies a chatbot's answer straight into a document without cleaning it up: things like "As an AI language model, I cannot..." or a template placeholder like "[insert email here]" that never got filled in. These aren't matters of style. If text like this survives into something published, it's almost always a simple mistake, which is why this check treats every hit as an error rather than a gentle suggestion.

## Example

**❌ Flagged:**
> As an AI language model, I cannot browse the internet in real time.

**Why:** This is a leftover chat-assistant artifact — the tool identifying itself as an AI instead of speaking in the piece's own voice. It reads as an obvious copy-paste mistake to anyone who sees it.

**✅ Better (illustrative rewrite):**
> This tool can't browse the internet in real time.

**❌ Flagged:**
> As of my last training update, this feature did not exist yet.

**Why:** A knowledge-cutoff disclaimer like this only makes sense inside a chat conversation with an AI. Outside that context, it's meaningless to the reader.

**✅ Better (illustrative rewrite):**
> This feature launched after our last review of the documentation.

**❌ Flagged:**
> Contact us at [insert email here] for more information about pricing.

**Why:** An unfilled template placeholder means content is actually missing, not just awkwardly phrased. It's a sign a draft went out before it was finished.

**✅ Better (illustrative rewrite):**
> Contact us at sales@example.com for more information about pricing.
