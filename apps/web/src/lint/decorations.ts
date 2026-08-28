import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, hoverTooltip } from "@codemirror/view";
import type { DecorationSet, Tooltip } from "@codemirror/view";
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
                // title is a plain-text accessibility/keyboard fallback; the real hover
                // experience is lintHoverTooltip() below, which reads ruleId/message/severity
                // back off these same attributes so the two can never drift apart.
                attributes: { title: f.message, "data-rule-id": f.ruleId, "data-severity": f.severity }
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

type FindingAtPos = { from: number; to: number; ruleId: string; message: string; severity: LintFinding["severity"] };

/** Reads ruleId/message/severity for whichever mark decoration covers `pos`, if any. */
function findingAt(decorations: DecorationSet, pos: number): FindingAtPos | null {
    let hit: FindingAtPos | null = null;
    decorations.between(pos, pos, (from, to, deco) => {
        const attrs = deco.spec.attributes as Record<string, string> | undefined;
        if (attrs?.["data-rule-id"]) {
            hit = {
                from,
                to,
                ruleId: attrs["data-rule-id"],
                message: attrs.title ?? "",
                severity: (attrs["data-severity"] as LintFinding["severity"]) ?? "info"
            };
            return false;
        }
        return undefined;
    });
    return hit;
}

/**
 * Shows the specific finding under the pointer instead of making the reader cross-reference
 * a possibly-long list in the ledger sidebar -- point at the flagged phrase, read why it was
 * flagged right there. Built on CodeMirror's own hoverTooltip (handles positioning/collision
 * detection) rather than a hand-rolled popover, so it behaves correctly near viewport edges.
 */
export function lintHoverTooltip() {
    return hoverTooltip((view, pos): Tooltip | null => {
        const hit = findingAt(view.state.field(lintFindingsField), pos);
        if (!hit) return null;
        return {
            pos: hit.from,
            end: hit.to,
            above: true,
            create() {
                const dom = document.createElement("div");
                dom.className = `cm-lint-tooltip cm-lint-tooltip--${hit.severity}`;
                const tag = document.createElement("span");
                tag.className = "cm-lint-tooltip-tag";
                tag.textContent = hit.ruleId;
                const msg = document.createElement("p");
                msg.textContent = hit.message;
                dom.append(tag, msg);
                return { dom };
            }
        };
    });
}
