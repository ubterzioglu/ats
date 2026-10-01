import type { AnalysisResult } from "@/types/analysis";
import { barTone } from "@/lib/ui";

interface ScoreRailProps {
  readonly result: AnalysisResult;
}

/**
 * The hero. A score is a measurement, so it is drawn against a ruler rather
 * than as a dial, and every dimension carries the sentence that explains it.
 */
export function ScoreRail({ result }: ScoreRailProps) {
  return (
    <section className="sheet p-5 sm:p-7" aria-labelledby="score-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h2 id="score-heading" className="flex items-baseline gap-2">
          <span className="font-mono text-6xl font-medium tabular-nums leading-none tracking-tight sm:text-7xl">
            {result.total}
          </span>
          <span className="font-mono text-base text-muted">/100</span>
        </h2>
        <p className="max-w-measure text-sm leading-relaxed text-muted sm:text-right">
          {result.bandLabel}
        </p>
      </div>

      <dl className="mt-7 space-y-5">
        {result.dimensions.map((dimension) => {
          const percentage = Math.round((dimension.score / dimension.max) * 100);
          return (
            <div key={dimension.id} className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[8.5rem_1fr_4rem]">
              <dt className="rail-label">{dimension.label}</dt>

              <div className="order-3 sm:order-none sm:self-center">
                <div
                  className="ruler h-2.5 overflow-hidden rounded-sheet border border-line"
                  role="meter"
                  aria-valuenow={dimension.score}
                  aria-valuemin={0}
                  aria-valuemax={dimension.max}
                  aria-label={`${dimension.label}: ${dimension.score} of ${dimension.max}`}
                >
                  <div
                    className={`h-full ${barTone(dimension.score, dimension.max)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1.5 max-w-measure text-xs leading-relaxed text-muted">
                  {dimension.summary}
                </p>
              </div>

              <dd className="font-mono text-sm tabular-nums text-muted sm:text-right">
                <span className="text-ink">{dimension.score}</span>/{dimension.max}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
