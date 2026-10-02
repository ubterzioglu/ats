import { useTranslations } from "next-intl";

import type { AnalysisResult, DimensionId } from "@/types/analysis";
import { barTone } from "@/lib/ui";

/**
 * The least a past score has to carry to be compared against. A full
 * `AnalysisResult` from earlier in the session satisfies it, and so does a
 * stored history record, which holds the scores and nothing else.
 */
export interface ScoreComparison {
  readonly total: number;
  readonly dimensions: readonly { readonly id: DimensionId; readonly score: number }[];
}

interface MeasureRailProps {
  readonly result: AnalysisResult;
  readonly previous?: ScoreComparison | null;
  /** Names what the delta is measured against. Defaults to the previous run. */
  readonly comparedTo?: "previousRun" | "lastVisit";
  /** Off on the shared report, which has no column to stick inside. */
  readonly sticky?: boolean;
}

interface DeltaProps {
  readonly value: number;
  readonly title: string;
}

function Delta({ value, title }: DeltaProps) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span
      className={`ml-2 font-mono text-micro tabular-nums ${positive ? "text-good" : "text-mark"}`}
      title={title}
    >
      {positive ? `+${value}` : `−${Math.abs(value)}`}
    </span>
  );
}

/**
 * The measurement instrument. Not the hero and not a dial: a still, matte
 * readout the work list is checked against, which is why it stays in view
 * while the user works down the spine beside it.
 *
 * Nothing here moves after the first paint. The meters fill once, on mount,
 * and a re-score lands its new width with no motion - a measurement that
 * re-animates every time it changes reads as decoration rather than as a
 * reading taken.
 *
 * Set in condensed width, which is the one place in the product where the
 * width axis carries information: these are dense data labels, not prose.
 */
export function MeasureRail({
  result,
  previous,
  comparedTo = "previousRun",
  sticky = false
}: MeasureRailProps) {
  const t = useTranslations("measureRail");
  const totalDelta = previous ? result.total - previous.total : 0;

  const deltaTitle = (value: number) =>
    t(value > 0 ? "gainedSince" : "lostSince", { label: t(comparedTo) });

  return (
    <section
      className={`bench overflow-hidden ${sticky ? "lg:sticky lg:top-4 lg:self-start" : ""}`}
      aria-labelledby="score-heading"
    >
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 id="score-heading" className="flex items-baseline gap-2">
          <span className="font-mono text-score font-medium tabular-nums">{result.total}</span>
          <span className="font-mono text-sm text-muted">{t("outOf")}</span>
          {previous ? <Delta value={totalDelta} title={deltaTitle(totalDelta)} /> : null}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{result.bandLabel}</p>
      </div>

      <div className="h-1 border-b border-line bg-bench-sunk">
        <div
          className={`meter-fill h-full ${barTone(result.total, 100)}`}
          style={{ width: `${result.total}%` }}
        />
      </div>

      <dl className="divide-y divide-line">
        {result.dimensions.map((dimension) => {
          const percentage = Math.round((dimension.score / dimension.max) * 100);
          const previousDimension = previous?.dimensions.find((entry) => entry.id === dimension.id);
          const delta = previousDimension ? dimension.score - previousDimension.score : 0;
          return (
            <div key={dimension.id} className="px-5 py-4 sm:px-6">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="condensed text-micro font-medium text-ink">{dimension.label}</dt>
                <dd className="shrink-0 font-mono text-micro tabular-nums text-muted">
                  <span className="text-ink">{dimension.score}</span>/{dimension.max}
                  {previousDimension ? (
                    <Delta value={delta} title={deltaTitle(delta)} />
                  ) : null}
                </dd>
              </div>

              <div
                className="mt-2 h-1.5 overflow-hidden rounded-chip bg-bench-sunk"
                role="meter"
                aria-valuenow={dimension.score}
                aria-valuemin={0}
                aria-valuemax={dimension.max}
                aria-label={t("meterLabel", {
                  dimension: dimension.label,
                  score: dimension.score,
                  max: dimension.max
                })}
              >
                <div
                  className={`meter-fill h-full ${barTone(dimension.score, dimension.max)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="mt-2 text-micro leading-relaxed text-muted">{dimension.summary}</p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
