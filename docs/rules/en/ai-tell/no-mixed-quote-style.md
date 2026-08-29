# Mixed Quotation Mark Styles

**Rule ID:** `no-mixed-quote-style` · **Severity:** info · **Language:** English

There are two accepted ways to write quotation marks and apostrophes in English: straight ("like this") and curly, or "smart," ("like this"). Both are legitimate — Microsoft's own house style explicitly uses straight quotes, while the Chicago Manual of Style's preferred published-prose style is curly. This check doesn't take a side on which one is correct. It only flags a document that mixes the two styles, because that's almost never a deliberate choice. It's nearly always a sign that text was pasted together from different sources (a straight-quote text editor and a curly-quote word processor, for instance), which is a real inconsistency worth fixing.

## Example

**❌ Flagged:**
> He said "hello" and then "goodbye" but she replied "never".

**Why:** Most of the quotation marks in this sentence are straight ("hello", "goodbye"), but the last one ("never") is curly (" "). That inconsistency is a strong sign of paste-together editing rather than an intentional style choice.

**✅ Better (illustrative rewrite):**
> He said "hello" and then "goodbye" but she replied "never".
>
> *(All three pairs now use the same straight-quote style, matching the majority already in the document.)*

**❌ Flagged:**
> It's fine, that's fine too, but this isn't.

**Why:** This example mixes styles in the apostrophe channel specifically: "It's" and "that's" use a straight apostrophe ('), but "isn't" uses a curly one ('). The check tracks double quotes and single quotes/apostrophes separately, since a document could be consistent on one and inconsistent on the other.

**✅ Better (illustrative rewrite):**
> It's fine, that's fine too, but this isn't.
>
> *(All three apostrophes now use the same straight style.)*
