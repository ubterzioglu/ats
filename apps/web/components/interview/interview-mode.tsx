"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { buildStoryBank } from "@/lib/interview/stories";
import { mapQuestionsToStories } from "@/lib/interview/questions";
import type { ModelTier } from "@/lib/ai/providers/types";
import type { KeywordTerm } from "@/types/analysis";

import { AdQuestionsPanel } from "./ad-questions-panel";
import { PracticePanel } from "./practice-panel";
import { StoryBankPanel } from "./story-bank-panel";
import { TemplateQuestionsPanel } from "./template-questions-panel";

export interface InterviewModeProps {
  readonly cvText: string;
  readonly terms: readonly KeywordTerm[];
  readonly modelTier: ModelTier;
}

export function InterviewMode({ cvText, terms, modelTier }: InterviewModeProps) {
  const t = useTranslations("interview");
  const bank = useMemo(() => buildStoryBank(cvText), [cvText]);
  const prepared = useMemo(() => mapQuestionsToStories(bank), [bank]);

  return (
    <div className="space-y-5">
      <section className="bench p-5 sm:p-6">
        <h2 className="text-h3 font-semibold">{t("heading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>
      </section>

      <StoryBankPanel bank={bank} />
      <TemplateQuestionsPanel prepared={prepared} />
      <AdQuestionsPanel bank={bank} terms={terms} modelTier={modelTier} />
      <PracticePanel bank={bank} />
    </div>
  );
}
