import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { compareVariants } from "@/lib/scoring/compare-variants";
import { cx } from "@/lib/ui";
import type { AnalysisResult } from "@/types/analysis";

interface VariantComparisonProps {
  readonly master: AnalysisResult;
  readonly current: AnalysisResult;
}

export function VariantComparison({ master, current }: VariantComparisonProps) {
  const t = useTranslations("variantComparison");

  const comparison = useMemo(() => {
    if (master.generatedAt === current.generatedAt) return null;
    return compareVariants(master, current);
  }, [master, current]);

  const delta = current.total - master.total;

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="condensed text-micro font-normal text-muted">{t("masterScore")}</p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-ink">{master.total}</p>
          </div>
          <div>
            <p className="condensed text-micro font-normal text-muted">{t("currentScore")}</p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-ink">{current.total}</p>
          </div>
          <div>
            <p className="condensed text-micro font-normal text-muted">{t("delta")}</p>
            <p
              className={cx(
                "mt-1 font-mono text-2xl tabular-nums",
                delta > 0 ? "text-good" : delta < 0 ? "text-mark" : "text-muted"
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </p>
          </div>
        </div>

        {comparison && comparison.scoreDeltas.length > 0 ? (
          <div className="mt-5 space-y-2">
            {comparison.scoreDeltas
              .filter((d) => d.dimension !== "total")
              .map((d) => (
                <div key={d.dimension} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{d.label}</span>
                  <span className="font-mono tabular-nums">
                    {d.baseScore}
                    <span className="text-muted">{" \u2192 "}</span>
                    {d.variantScore}
                    <span
                      className={cx(
                        "ml-2",
                        d.delta > 0 ? "text-good" : d.delta < 0 ? "text-mark" : "text-muted"
                      )}
                    >
                      ({d.delta > 0 ? "+" : ""}
                      {d.delta})
                    </span>
                  </span>
                </div>
              ))}
          </div>
        ) : null}

        {comparison ? (
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted">
            {comparison.findingsResolved.length > 0 ? (
              <span>
                {t("findingsResolved", { count: comparison.findingsResolved.length })}
              </span>
            ) : null}
            {comparison.findingsIntroduced.length > 0 ? (
              <span>
                {t("findingsIntroduced", { count: comparison.findingsIntroduced.length })}
              </span>
            ) : null}
            {comparison.keywordsGained.length > 0 ? (
              <span>
                {t("keywordsGained", { count: comparison.keywordsGained.length })}
              </span>
            ) : null}
            {comparison.keywordsLost.length > 0 ? (
              <span>
                {t("keywordsLost", { count: comparison.keywordsLost.length })}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-muted">{t("noChange")}</p>
        )}
      </div>
    </section>
  );
}
