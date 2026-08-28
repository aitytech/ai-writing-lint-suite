import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { LintFinding } from "@aitytech/ai-writing-lint-core";

/**
 * Turns lint-core's LintFinding[] (character offsets from the textlint kernel) into
 * CodeMirror mark decorations, so a finding drawn in the ledger sidebar and the dotted
 * underline in the manuscript are always the same span -- no separate offset math kept
 * in two places to drift apart.
 */
export const setFindings = StateEffect.define<LintFinding[]>();

function severityClass(severity: LintFinding["severity"]): string {
    return `cm-lint-mark cm-lint-mark--${severity}`;
}

function buildDecorations(findings: LintFinding[], docLength: number): DecorationSet {
    const marks = findings
        // A finding's range can point past the current doc if the text changed after the
        // last lint pass finished (lintText is async) -- clip/drop rather than let
        // CodeMirror throw on an invalid range.
        .map((f) => {
            const from = Math.max(0, Math.min(f.range[0], docLength));
            const to = Math.max(from, Math.min(f.range[1], docLength));
            return { f, from, to };
        })
        .filter(({ from, to }) => to > from)
        .sort((a, b) => a.from - b.from || a.to - b.to)
        .map(({ f, from, to }) =>
            Decoration.mark({
                class: severityClass(f.severity),
                attributes: { title: f.message, "data-rule-id": f.ruleId }
            }).range(from, to)
        );
    return Decoration.set(marks, true);
}

export const lintFindingsField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(decorations, tr) {
        let next = decorations.map(tr.changes);
        for (const effect of tr.effects) {
            if (effect.is(setFindings)) {
                next = buildDecorations(effect.value, tr.state.doc.length);
            }
        }
        return next;
    },
    provide: (field) => EditorView.decorations.from(field)
});
