"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { recommendStory } from "@/lib/interview/practice";
import type { StoryBank } from "@/types/interview";

export interface PracticePanelProps {
  readonly bank: StoryBank;
}

export function PracticePanel({ bank }: PracticePanelProps) {
  const t = useTranslations("interview");
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const recommendation = useMemo(() => {
    if (!submitted || !answer.trim()) return null;
    return recommendStory(answer, bank);
  }, [submitted, answer, bank]);

  const sharedTokens = useMemo(() => {
    if (!recommendation) return [];
    const answerWords = answer.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const cardText = [
      recommendation.card.situation.text,
      recommendation.card.task.text,
      recommendation.card.action.text,
      recommendation.card.result.text
    ].join(" ").toLowerCase();
    return answerWords.filter((w) => cardText.includes(w));
  }, [recommendation, answer]);

  function handleSubmit() {
    setSubmitted(true);
  }

  function handleReset() {
    setAnswer("");
    setSubmitted(false);
  }

  return (
    <section className="bench p-5 sm:p-6">
      <h2 className="text-h3 font-normal">{t("practiceHeading")}</h2>
      <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("practiceLede")}</p>

      <label className="mt-4 block">
        <span className="condensed text-micro font-normal text-muted">
          {t("practiceAnswerLabel")}
        </span>
        <textarea
          className="field mt-2 min-h-[8rem] text-sm"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setSubmitted(false);
          }}
          placeholder={t("practicePlaceholder")}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-quiet"
          onClick={handleSubmit}
          disabled={!answer.trim() || bank.cards.length === 0}
        >
          {t("practiceSubmit")}
        </button>
        {submitted ? (
          <button type="button" className="btn-quiet" onClick={handleReset}>
            {t("practiceReset")}
          </button>
        ) : null}
      </div>

      {submitted && bank.cards.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("storyBankEmpty")}</p>
      ) : null}

      {submitted && recommendation === null && bank.cards.length > 0 ? (
        <p className="mt-4 text-sm text-muted">{t("practiceNoMatch")}</p>
      ) : null}

      {recommendation !== null ? (
        <div className="mt-4 border-l border-line pl-4">
          <p className="condensed text-micro font-normal text-good">
            {t("practiceMatchFound")}
          </p>
          <p className="mt-1 font-mono text-xs text-muted">
            {t("sourceLine", { line: recommendation.card.sourceLine + 1 })}
            {" — "}
            {t("practiceOverlap", { count: recommendation.overlap })}
          </p>
          <p className="mt-2 text-sm">{recommendation.card.sourceText}</p>

          {sharedTokens.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {sharedTokens.map((token) => (
                <span
                  key={token}
                  className="border-l-2 border-good px-2 py-0.5 text-micro text-good"
                >
                  {token}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="condensed text-micro font-normal text-muted">{t("starSituation")}</dt>
              <dd className="mt-0.5 text-sm">
                {recommendation.card.situation.present ? recommendation.card.situation.text : (
                  <span className="text-muted italic">{t("starMissing")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="condensed text-micro font-normal text-muted">{t("starAction")}</dt>
              <dd className="mt-0.5 text-sm">
                {recommendation.card.action.present ? recommendation.card.action.text : (
                  <span className="text-muted italic">{t("starMissing")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="condensed text-micro font-normal text-muted">{t("starTask")}</dt>
              <dd className="mt-0.5 text-sm">
                {recommendation.card.task.present ? recommendation.card.task.text : (
                  <span className="text-muted italic">{t("starMissing")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="condensed text-micro font-normal text-muted">{t("starResult")}</dt>
              <dd className="mt-0.5 text-sm">
                {recommendation.card.result.present ? recommendation.card.result.text : (
                  <span className="text-muted italic">{t("starMissing")}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
