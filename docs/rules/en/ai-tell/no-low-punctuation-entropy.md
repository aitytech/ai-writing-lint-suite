# Narrow Punctuation Variety

**Rule ID:** `no-low-punctuation-entropy` · **Severity:** info · **Language:** English

Human writing tends to mix punctuation naturally: a semicolon here, a dash there, the occasional exclamation point or ellipsis. AI-generated text, by contrast, tends to lean almost entirely on periods and commas and rarely reaches for anything else. This check measures how varied a paragraph's punctuation is (using a statistical measure called Shannon entropy, borrowed from information theory) and flags paragraphs that stick to a narrow punctuation palette despite having plenty of punctuation to work with.

## Example

**❌ Flagged:**
> This works well. It processes data. It stores results. It handles errors. It logs events. It saves time. It reduces cost. It improves speed. It increases accuracy. It simplifies work. It helps teams. It scales easily. It runs daily. It updates often. It stays reliable. It performs consistently.

**Why:** Every one of these 16 sentences ends with a period, and there's no other punctuation anywhere in the paragraph. That narrow, repetitive rhythm is a documented signal that shows up more often in AI-generated text than in natural human writing.

**✅ Better (illustrative rewrite):**
> This works well: it processes data, stores results, and handles errors as they come up. It logs events, saves time, and reduces cost, all while staying fast and accurate. Teams that use it report an easier workload, and it just keeps running reliably, day after day.
