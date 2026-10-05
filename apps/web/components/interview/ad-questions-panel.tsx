"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { acquireModel } from "@/lib/ai/model";
import { generateAdQuestions } from "@/lib/ai/tasks/interview";
import type { ModelTier } from "@/lib/ai/providers/types";
import { mapAdQuestionsToStories } from "@/lib/interview/questions";
import type { AdQuestion, PreparedAdQuestion, StoryBank } from "@/types/interview";
import type { KeywordTerm } from "@/types/analysis";

export interface AdQuestionsPanelProps {
  readonly bank: StoryBank;
  readonly terms: readonly KeywordTerm[];
  readonly modelTier: ModelTier;
}

type Mode =
  | { readonly kind: "idle" }
  | { readonly kind: "generating" }
  | { readonly kind: "generated"; readonly prepared: readonly PreparedAdQuestion[] }
  | { readonly kind: "failed" };

export function AdQuestionsPanel({ bank, terms, modelTier }: AdQuestionsPanelProps) {
  const t = useTranslations("interview");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });

  async function generate() {
    if (modelTier === "none") return;
    setMode({ kind: "generating" });
    try {
      const session = await acquireModel(modelTier);
      const questions: readonly AdQuestion[] = await generateAdQuestions(
        session.model,
        terms
      );
      if (questions.length === 0) {
        setMode({ kind: "generated", prepared: [] });
        return;
      }
      setMode({ kind: "generated", prepared: mapAdQuestionsToStories(bank, questions) });
    } catch {
      setMode({ kind: "failed" });
    }
  }

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("adHeading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("adLede")}</p>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {modelTier === "none" ? (
          <p className="max-w-measure text-micro text-muted">{t("adNeedsModel")}</p>
        ) : null}

        {modelTier !== "none" && mode.kind === "idle" ? (
          <button type="button" className="btn-quiet" onClick={() => void generate()}>
            {t("adGenerate")}
          </button>
        ) : null}

        {mode.kind === "generating" ? (
          <p className="live-edge rounded-control border border-line px-3 py-3 font-mono text-micro text-muted">
            {t("adGenerating")}
          </p>
        ) : null}

        {mode.kind === "failed" ? (
          <div>
            <p className="text-micro text-caution">{t("adFailed")}</p>
            <button type="button" className="btn-quiet mt-3" onClick={() => void generate()}>
              {t("adTryAgain")}
            </button>
          </div>
        ) : null}

        {mode.kind === "generated" ? (
          <div>
            {mode.prepared.length === 0 ? (
              <p className="max-w-measure text-sm text-muted">{t("adEmpty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {mode.prepared.map((entry) => (
                  <li key={entry.question.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-normal">{entry.question.text}</p>
                      <span className="shrink-0 rounded-full border border-edge/50 px-3 py-0.5 text-micro text-muted">
                        {t(`category.${entry.question.category}`)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-live-ink">
                      {t("adCitedTerm", { term: entry.question.citedTerm })}
                    </p>

                    {entry.cards.length === 0 ? (
                      <p className="mt-2 text-xs text-muted italic">{t("noMatchingCard")}</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {entry.cards.map((card) => (
                          <li
                            key={card.id}
                            className="border-l border-line pl-3"
                          >
                            <p className="font-mono text-micro text-muted">
                              {t("sourceLine", { line: card.sourceLine + 1 })}
                            </p>
                            <p className="mt-0.5 text-xs">{card.sourceText}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className="btn-quiet mt-3" onClick={() => void generate()}>
              {t("adRegenerate")}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
