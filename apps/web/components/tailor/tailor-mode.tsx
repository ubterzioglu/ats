"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { buildMissingTermCards } from "@/lib/tailor/missing-terms";
import type { AnalysisResult } from "@/types/analysis";

import { TermCard } from "./term-card";

export interface TailorModeProps {
  readonly result: AnalysisResult;
  readonly jobAd: string;
  readonly cvText: string;
  readonly onApply: (newText: string) => void;
}

/**
 * Module D inside the workbench rather than beside it. Tailoring works on the
 * same CV text the report scored, so every term that goes in is measured by
 * the next run - which is the only way the user can tell whether tailoring
 * helped. A separate surface would have had to rebuild the score rail, the
 * editing mechanics and the apply path to say the same thing twice.
 */
export function TailorMode({ result, jobAd, cvText, onApply }: TailorModeProps) {
  const t = useTranslations("tailor");
  const cards = useMemo(
    () => buildMissingTermCards(jobAd, result.keywords.missing),
    [jobAd, result.keywords.missing]
  );

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-semibold">{t("heading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>
      </div>

      {cards.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted sm:px-6">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {cards.map((card) => (
            <TermCard
              key={card.id}
              card={card}
              cvText={cvText}
              sections={result.sections}
              onApply={onApply}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
