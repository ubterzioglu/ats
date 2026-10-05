"use client";

import { useTranslations } from "next-intl";

import type { PreparedQuestion } from "@/types/interview";

export interface TemplateQuestionsPanelProps {
  readonly prepared: readonly PreparedQuestion[];
}

export function TemplateQuestionsPanel({ prepared }: TemplateQuestionsPanelProps) {
  const t = useTranslations("interview");

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("templateHeading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("templateLede")}</p>
      </div>

      <ul className="divide-y divide-line">
        {prepared.map((entry) => (
          <li key={entry.question.id} className="px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-normal">{entry.question.text}</p>
              <span className="shrink-0 rounded-full border border-edge/50 px-3 py-0.5 text-micro text-muted">
                {t(`category.${entry.question.category}`)}
              </span>
            </div>

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
    </section>
  );
}
