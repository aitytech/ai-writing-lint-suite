import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

/**
 * "Live markdown" styling: bold/italic/headings render styled as you type, matching the
 * Obsidian/Bear/iA Writer convention (source stays plain markdown text; only the display
 * is styled). This styles the markers in place rather than hiding them -- true marker
 * hiding (Obsidian's "Live Preview") needs a ViewPlugin that reads cursor position per
 * line and is a reasonable follow-up, not implemented here.
 */
const markdownHighlightStyle = HighlightStyle.define([
    { tag: tags.heading1, fontSize: "1.6em", fontWeight: "700", fontFamily: "var(--font-display)" },
    { tag: tags.heading2, fontSize: "1.35em", fontWeight: "700", fontFamily: "var(--font-display)" },
    { tag: tags.heading3, fontSize: "1.15em", fontWeight: "700", fontFamily: "var(--font-display)" },
    { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: "700" },
    { tag: tags.strong, fontWeight: "700" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "var(--accent)", textDecoration: "underline" },
    { tag: tags.url, color: "var(--text-muted)" },
    { tag: tags.monospace, fontFamily: "var(--font-mono)", color: "var(--mark-teal)" },
    { tag: tags.quote, color: "var(--text-muted)", fontStyle: "italic" },
    { tag: tags.list, color: "var(--accent)" },
    { tag: tags.processingInstruction, color: "var(--text-muted)" }
]);

export const markdownLiveStyle = [
    syntaxHighlighting(markdownHighlightStyle),
    EditorView.theme({
        "&": {
            fontFamily: "var(--font-mono)",
            fontSize: "15px",
            lineHeight: "1.9",
            color: "var(--text)",
            backgroundColor: "transparent"
        },
        ".cm-content": { padding: "0" },
        ".cm-gutters": { display: "none" },
        "&.cm-focused": { outline: "none" },
        ".cm-lint-mark": {
            backgroundImage: "linear-gradient(currentColor, currentColor)",
            backgroundRepeat: "repeat-x",
            backgroundSize: "6px 2px",
            backgroundPosition: "0 1.35em",
            paddingBottom: "2px",
            cursor: "help"
        },
        ".cm-lint-mark--error": { color: "var(--mark-red)" },
        ".cm-lint-mark--warning": { color: "var(--mark-amber)" },
        ".cm-lint-mark--info": { color: "var(--mark-teal)" }
    })
];
