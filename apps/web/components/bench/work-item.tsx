"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { FindingExplainButton, type ExplanationView } from "@/components/finding-explain";
import { findEvidenceLine, lineAt, replaceLine } from "@/lib/bench/evidence";
import { SEVERITY_EDGE } from "@/lib/ui";
import type { Finding } from "@/types/analysis";

export interface WorkItemProps {
  readonly index: number;
  readonly finding: Finding;
  /** Absent on the shared report, which is read-only and has no CV text. */
  readonly cvText?: string;
  readonly onApply?: (newText: string) => void;
  readonly onSelectEvidence?: (line: string) => void;
  readonly explain?: (finding: Finding) => Promise<ExplanationView>;
  /** Returns a replacement for one line, or null when it has none to offer. */
  readonly draftFix?: (lineIndex: number, line: string) => Promise<string | null>;
  /** True while the draft is produced by a model rather than by a rule. */
  readonly draftIsLive?: boolean;
}

type Mode =
  | { readonly kind: "idle" }
  | { readonly kind: "editing"; readonly lineIndex: number; readonly text: string }
  | { readonly kind: "drafting" }
  | { readonly kind: "drafted"; readonly lineIndex: number; readonly text: string }
  | { readonly kind: "nothing-to-draft" };

/**
 * One repair, in the place the user is already looking. The item states what is
 * broken, shows the line it found it on, says what the fix is worth, and then
 * lets the line be changed without leaving: the user does not read a report and
 * go elsewhere to act on it.
 *
 * A draft is produced on request, never on render. Generating one for every
 * finding would force a model download, burn battery on items nobody opens, and
 * break the consent contract the AI layer rests on.
 */
export function WorkItem({
  index,
  finding,
  cvText,
  onApply,
  onSelectEvidence,
  explain,
  draftFix,
  draftIsLive = false
}: WorkItemProps) {
  const t = useTranslations("workItem");
  const severity = useTranslations("severity");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });

  const firstEvidence = finding.evidence?.[0];
  const editable =
    cvText !== undefined && onApply !== undefined && firstEvidence !== undefined;
  const lineIndex = editable ? findEvidenceLine(cvText, firstEvidence) : -1;
  const canAct = editable && lineIndex >= 0;

  function startEditing() {
    if (!canAct || cvText === undefined) return;
    setMode({ kind: "editing", lineIndex, text: lineAt(cvText, lineIndex) ?? "" });
  }

  async function startDrafting() {
    if (!canAct || cvText === undefined || !draftFix) return;
    setMode({ kind: "drafting" });
    const current = lineAt(cvText, lineIndex) ?? "";
    const proposed = await draftFix(lineIndex, current);
    setMode(
      proposed === null
        ? { kind: "nothing-to-draft" }
        : { kind: "drafted", lineIndex, text: proposed }
    );
  }

  function commit(text: string, at: number) {
    if (cvText === undefined || !onApply) return;
    const next = replaceLine(cvText, at, text);
    if (next === null) {
      setMode({ kind: "nothing-to-draft" });
      return;
    }
    onApply(next);
    setMode({ kind: "idle" });
  }

  return (
    <li className="flex gap-4 px-5 py-5 sm:px-6">
      <span
        aria-hidden
        className={`mt-1 w-[3px] shrink-0 self-stretch rounded-chip ${SEVERITY_EDGE[finding.severity]}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-micro tabular-nums text-muted">{index}</span>
          <h3 className="min-w-0 flex-1 text-sm font-normal">{finding.title}</h3>
          <span className="shrink-0 font-mono text-micro tabular-nums text-good">
            {t("worth", { points: finding.cost })}
          </span>
        </div>

        <p className="mt-1 pl-7 text-micro text-muted">{severity(finding.severity)}</p>

        <div className="mt-3 pl-7">
          <p className="max-w-measure text-sm leading-relaxed text-muted">{finding.detail}</p>

          {finding.evidence && finding.evidence.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {finding.evidence.map((line) => (
                <li key={line}>
                  {onSelectEvidence ? (
                    <button
                      type="button"
                      title={t("showLine")}
                      onClick={() => onSelectEvidence(line)}
                      className="block min-h-11 w-full overflow-x-auto whitespace-pre border-b border-line px-3 py-3 text-left font-mono text-micro text-muted transition-colors hover:text-saffron hover:text-ink"
                    >
                      {line}
                    </button>
                  ) : (
                    <span className="block overflow-x-auto whitespace-pre border-b border-line px-3 py-2 font-mono text-micro text-muted">
                      {line}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-3 max-w-measure border-l-2 border-action/30 pl-3 text-sm leading-relaxed">
            {finding.fix}
          </p>

          {mode.kind === "editing" ? (
            <div className="mt-3">
              <label className="block">
                <span className="condensed text-micro font-normal text-muted">
                  {t("editLabel")}
                </span>
                <textarea
                  className="field mt-2 min-h-[5rem] font-mono text-micro"
                  value={mode.text}
                  autoFocus
                  spellCheck={false}
                  onChange={(event) =>
                    setMode({ kind: "editing", lineIndex: mode.lineIndex, text: event.target.value })
                  }
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => commit(mode.text, mode.lineIndex)}
                >
                  {t("applyAndRescore")}
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => setMode({ kind: "idle" })}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : null}

          {mode.kind === "drafting" ? (
            <div
              className={`mt-3 rounded-control border border-line px-3 py-3 ${draftIsLive ? "live-edge" : ""}`}
            >
              <p className="font-mono text-micro text-muted">{t("drafting")}</p>
            </div>
          ) : null}

          {mode.kind === "drafted" ? (
            <div className="mt-3">
              <div
                className={`border-l border-line pl-3 ${draftIsLive ? "live-edge" : ""}`}
              >
                <p className="whitespace-pre-wrap font-mono text-micro leading-relaxed text-ink">
                  {mode.text}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => commit(mode.text, mode.lineIndex)}
                >
                  {t("applyAndRescore")}
                </button>
                <button
                  type="button"
                  className="btn-quiet text-muted"
                  onClick={() => setMode({ kind: "idle" })}
                >
                  {t("discard")}
                </button>
              </div>
            </div>
          ) : null}

          {mode.kind === "nothing-to-draft" ? (
            <p className="mt-3 text-micro text-caution">{t("nothingToDraft")}</p>
          ) : null}

          {explain ? <FindingExplainButton finding={finding} explain={explain} /> : null}

          {canAct && mode.kind === "idle" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-quiet" onClick={startEditing}>
                {t("editLine")}
              </button>
              {draftFix ? (
                <button type="button" className="btn-quiet" onClick={() => void startDrafting()}>
                  {t("draftAFix")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
