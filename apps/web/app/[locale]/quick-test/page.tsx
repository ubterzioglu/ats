"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";
import { scoreStructure } from "@/lib/scoring/structure";
import type { Finding } from "@/types/analysis";
import { cx } from "@/lib/ui";

const MAX_QUICK_FINDINGS = 3;

export default function QuickTestPage() {
  const t = useTranslations("quickTest");
  const [cvText, setCvText] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [score, setScore] = useState(0);
  const [findings, setFindings] = useState<readonly Finding[]>([]);
  const [stats, setStats] = useState<{ words: number; lines: number } | null>(null);

  const runTest = () => {
    if (cvText.trim().length === 0) return;

    const context = buildContext(cvText);
    const parseability = scoreParseability(context);
    const structure = scoreStructure(context);

    const total = parseability.dimension.score + structure.dimension.score;
    const allFindings = [...parseability.findings, ...structure.findings].sort(
      (a, b) => b.cost - a.cost
    );

    setScore(total);
    setFindings(allFindings.slice(0, MAX_QUICK_FINDINGS));
    setStats({ words: context.stats.words, lines: context.stats.lines });
    setAnalyzed(true);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="text-center">
        <h1 className="text-h2 font-normal">{t("title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-muted">{t("lede")}</p>
      </div>

      <div className="mt-8 rounded-panel border border-line bg-sheet p-5 shadow-card sm:p-6">
        <label htmlFor="quick-cv-input" className="sr-only">
          {t("inputPlaceholder")}
        </label>
        <textarea
          id="quick-cv-input"
          rows={10}
          value={cvText}
          onChange={(e) => {
            setCvText(e.target.value);
            if (analyzed) setAnalyzed(false);
          }}
          placeholder={t("inputPlaceholder")}
          className="w-full resize-y rounded-control border border-line bg-bed p-4 font-mono text-xs leading-relaxed text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={runTest}
            disabled={cvText.trim().length === 0}
            className="rounded-control border border-ink bg-ink px-5 py-2 text-sm font-normal text-bed transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("analyzeButton")}
          </button>

          {stats ? (
            <span className="font-mono text-micro text-muted">
              {stats.words} words • {stats.lines} lines
            </span>
          ) : null}
        </div>
      </div>

      {analyzed ? (
        <section className="mt-8 space-y-6" aria-labelledby="quick-result-heading">
          <div className="rounded-panel border border-line bg-sheet p-5 sm:p-6">
            <h2 id="quick-result-heading" className="text-h3 font-normal">
              {t("scoreHeading")}
            </h2>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono text-4xl font-normal tabular-nums text-ink">
                {score}
              </span>
              <span className="text-sm text-muted">{t("scoreOutOf")}</span>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bed">
              <div
                className={cx(
                  "h-full transition-all duration-500",
                  score >= 38 ? "bg-good" : score >= 28 ? "bg-caution" : "bg-mark"
                )}
                style={{ width: `${Math.round((score / 45) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-panel border border-line bg-sheet p-5 sm:p-6">
            <h3 className="text-h3 font-normal">{t("findingsHeading")}</h3>

            {findings.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {findings.map((finding) => (
                  <li
                    key={finding.id}
                    className="rounded-control border border-line bg-bed p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-normal text-ink">{finding.title}</p>
                      <span className="font-mono text-micro text-mark">-{finding.cost}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{finding.detail}</p>
                    <p className="mt-2 text-xs text-signal">
                      <strong className="font-normal">Fix:</strong> {finding.fix}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-good">{t("noFindings")}</p>
            )}
          </div>

          <div className="rounded-panel border border-line bg-bed p-5 text-center sm:p-6">
            <h3 className="text-h3 font-normal">{t("fullAnalysisCta")}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t("fullAnalysisLede")}</p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-block rounded-control border border-ink bg-ink px-6 py-2.5 text-sm font-normal text-bed transition-colors hover:bg-ink/90"
              >
                {t("fullAnalysisCta")}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
