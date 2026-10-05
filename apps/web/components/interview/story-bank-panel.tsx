"use client";

import { useTranslations } from "next-intl";

import type { StoryBank } from "@/types/interview";

export interface StoryBankPanelProps {
  readonly bank: StoryBank;
}

export function StoryBankPanel({ bank }: StoryBankPanelProps) {
  const t = useTranslations("interview");

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("storyBankHeading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("storyBankLede")}</p>
      </div>

      {bank.cards.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted sm:px-6">{t("storyBankEmpty")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {bank.cards.map((card) => (
            <li key={card.id} className="px-5 py-4 sm:px-6">
              <p className="font-mono text-xs text-muted">
                {t("sourceLine", { line: card.sourceLine + 1 })}
              </p>
              <p className="mt-1 text-sm">{card.sourceText}</p>

              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="condensed text-micro font-normal text-muted">
                    {t("starSituation")}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {card.situation.present ? card.situation.text : (
                      <span className="text-muted italic">{t("starMissing")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="condensed text-micro font-normal text-muted">
                    {t("starTask")}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {card.task.present ? card.task.text : (
                      <span className="text-muted italic">{t("starMissing")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="condensed text-micro font-normal text-muted">
                    {t("starAction")}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {card.action.present ? card.action.text : (
                      <span className="text-muted italic">{t("starMissing")}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="condensed text-micro font-normal text-muted">
                    {t("starResult")}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {card.result.present ? card.result.text : (
                      <span className="text-muted italic">{t("starMissing")}</span>
                    )}
                  </dd>
                </div>
              </dl>

              {card.topics.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {card.topics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-edge/50 px-3 py-0.5 text-micro text-muted"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {bank.skipped.length > 0 ? (
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <p className="condensed text-micro font-normal text-caution">
            {t("skippedHeading", { count: bank.skipped.length })}
          </p>
          <ul className="mt-2 space-y-1">
            {bank.skipped.map((entry) => (
              <li key={`skipped-${entry.lineIndex}`} className="text-xs text-muted">
                <span className="font-mono">{t("sourceLine", { line: entry.lineIndex + 1 })}</span>
                {" — "}
                {entry.text.length > 80 ? `${entry.text.slice(0, 80)}…` : entry.text}
                {" ("}
                {t(entry.reason === "too-short" ? "skippedTooShort" : "skippedNoSignal")}
                {")"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
