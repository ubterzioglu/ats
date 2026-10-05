"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { CoverLetterDraft } from "@/lib/ai/tasks/cover-letter";

export interface CoverLetterPanelProps {
  /** Absent when no model tier is available; the panel then explains itself. */
  readonly draft?: () => Promise<CoverLetterDraft>;
}

type Mode =
  | { readonly kind: "idle" }
  | { readonly kind: "drafting" }
  | { readonly kind: "drafted"; readonly draft: CoverLetterDraft }
  | { readonly kind: "failed" };

/**
 * The letter, drafted on request and never on render - the same consent rule
 * the work item keeps, for the same reason: drafting costs a model download.
 *
 * What the panel will not do is hide the gate. When grounding refuses a
 * paragraph the count is shown, because a letter with a quiet hole in it is
 * worse than one that says where the hole is and why.
 */
export function CoverLetterPanel({ draft }: CoverLetterPanelProps) {
  const t = useTranslations("coverLetter");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!draft) return;
    setMode({ kind: "drafting" });
    try {
      setMode({ kind: "drafted", draft: await draft() });
    } catch {
      setMode({ kind: "failed" });
    }
  }

  async function copy(paragraphs: readonly string[]) {
    try {
      await navigator.clipboard.writeText(paragraphs.join("\n\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="bench p-5 sm:p-6">
      <h2 className="text-h3 font-normal">{t("heading")}</h2>
      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>

      {draft === undefined ? (
        <p className="mt-4 max-w-measure text-micro text-muted">{t("needsModel")}</p>
      ) : null}

      {draft && mode.kind === "idle" ? (
        <button type="button" className="btn-quiet mt-4" onClick={() => void run()}>
          {t("draftIt")}
        </button>
      ) : null}

      {mode.kind === "drafting" ? (
        <p className="live-edge mt-4 rounded-control border border-line px-3 py-3 font-mono text-micro text-muted">
          {t("drafting")}
        </p>
      ) : null}

      {mode.kind === "failed" ? (
        <div className="mt-4">
          <p className="text-micro text-caution">{t("failed")}</p>
          <button type="button" className="btn-quiet mt-3" onClick={() => void run()}>
            {t("tryAgain")}
          </button>
        </div>
      ) : null}

      {mode.kind === "drafted" ? (
        <div className="mt-4">
          {mode.draft.paragraphs.length === 0 ? (
            <p className="max-w-measure text-micro text-caution">{t("nothingSurvived")}</p>
          ) : (
            <div className="live-edge space-y-3 rounded-control border border-line bg-bench px-4 py-4">
              {mode.draft.paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-measure text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {mode.draft.dropped > 0 ? (
            <p className="mt-3 max-w-measure text-micro text-caution">
              {t("dropped", { count: mode.draft.dropped })}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {mode.draft.paragraphs.length > 0 ? (
              <button
                type="button"
                className="btn-quiet"
                onClick={() => void copy(mode.draft.paragraphs)}
              >
                {t(copied ? "copied" : "copy")}
              </button>
            ) : null}
            <button type="button" className="btn-quiet text-muted" onClick={() => void run()}>
              {t("draftAgain")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
