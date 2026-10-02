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
    <section className="sheet overflow-hidden" aria-labelledby="score-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line px-5 py-6 sm:px-7 sm:py-7">
        <h2 id="score-heading" className="flex items-baseline gap-2.5">
          <span className="font-mono text-6xl font-medium tabular-nums leading-none tracking-tight sm:text-7xl">
            {result.total}
          </span>
          <span className="font-mono text-base text-muted">/100</span>
        </h2>
        <p className="max-w-measure text-sm leading-relaxed text-muted sm:text-right">{result.bandLabel}</p>
      </div>

      <div className="ruler h-1.5 border-b border-line bg-bed/60">
        <div className={`h-full ${barTone(result.total, 100)}`} style={{ width: `${result.total}%` }} />
      </div>

      <dl className="divide-y divide-line/70">
        {result.dimensions.map((dimension) => {
          const percentage = Math.round((dimension.score / dimension.max) * 100);
          return (
            <div
              key={dimension.id}
              className="grid gap-x-5 gap-y-2 px-5 py-5 sm:grid-cols-[9rem_1fr_4rem] sm:px-7"
            >
              <dt className="rail-label">{dimension.label}</dt>

              <div className="order-3 sm:order-none sm:self-start sm:pt-1">
                <div
                  className="ruler h-2 overflow-hidden rounded-full border border-line bg-sheet"
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
                <p className="mt-2 max-w-measure text-xs leading-relaxed text-muted">{dimension.summary}</p>
              </div>

              <dd className="readout sm:pt-0.5 sm:text-right">
                <span className="text-ink">{dimension.score}</span>/{dimension.max}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
