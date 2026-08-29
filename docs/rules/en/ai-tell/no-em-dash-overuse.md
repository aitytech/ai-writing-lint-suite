# Heavy Em Dash Use

**Rule ID:** `no-em-dash-overuse` · **Severity:** info · **Language:** English

Recent AI models, GPT-4/4o and Claude-era models especially, reach for the em dash constantly as a default way to add an aside or connect two thoughts, far more than typical human writing does. This check counts em dashes in a paragraph and flags it when both the raw count and the rate per 100 words cross a threshold, so a single stylistic dash doesn't get flagged, only a paragraph that leans on them heavily.

The thresholds were calibrated against a real dataset of human-written answers: only 3% of the human documents tested contained any em dash at all, and only 1 out of 300 had three or more in a single answer. Worth knowing honestly: that comparison dataset was collected in 2023 against an older AI model, before the em-dash-heavy style widely reported in more recent models existed, so while the "this rarely happens in human writing" side of this check is solidly measured, no similarly-sized modern dataset was available to measure the AI side against.

## Example

**❌ Flagged:**
> The service restarts automatically — usually within seconds — whenever memory pressure crosses the configured limit, and it logs the event for later review. Operators rarely need to intervene — the whole recovery path is designed to run without anyone watching it happen in real time at all.

**Why:** This paragraph uses three em dashes in under 60 words, well above both the count and rate thresholds. Reaching for the em dash as the default punctuation for every aside is one of the most widely reported stylistic tells of AI writing.

**✅ Better (illustrative rewrite):**
> The service restarts automatically, usually within seconds, whenever memory pressure crosses the configured limit, and it logs the event for later review. Operators rarely need to intervene. The whole recovery path is designed to run without anyone watching it happen in real time.
