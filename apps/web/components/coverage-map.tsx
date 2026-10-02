import { useTranslations } from "next-intl";

import type { CoverageMapReport } from "@/lib/ai/coverage-map";

interface CoverageMapProps {
  readonly report: CoverageMapReport;
}

const MAX_SHOWN = 6;
const SNIPPET_CHARS = 220;

function snippet(chunk: string): string {
  return chunk.length > SNIPPET_CHARS ? `${chunk.slice(0, SNIPPET_CHARS)}…` : chunk;
}

/**
 * The parts of the vacancy the CV never addresses, judged in embedding space
 * rather than by literal words. Advisory: nothing here changes a score.
 */
export function CoverageMap({ report }: CoverageMapProps) {
  const t = useTranslations("coverageMap");

  return (
    <section className="bench overflow-hidden" aria-labelledby="coverage-heading">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="coverage-heading" className="text-base font-semibold">
          {t("heading")}
        </h2>
        <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
          {t("lede", {
            chunks: report.adChunks,
            threshold: Math.round(report.threshold * 100)
          })}
        </p>
      </div>

      {report.weak.length === 0 ? (
        <p className="px-5 py-4 text-sm leading-relaxed text-muted sm:px-6">
          {t("allCovered")}
        </p>
      ) : (
        <ul className="divide-y divide-line/70">
          {report.weak.slice(0, MAX_SHOWN).map((entry) => (
            <li key={entry.chunk.slice(0, 60)} className="px-5 py-4 sm:px-6">
              <p className="font-mono text-xs leading-relaxed text-muted">{snippet(entry.chunk)}</p>
              <p className="mt-2 font-mono text-xs tabular-nums text-caution">
                {t("bestMatch", { percent: Math.round(entry.best * 100) })}
              </p>
            </li>
          ))}
        </ul>
      )}

      {report.weak.length > MAX_SHOWN ? (
        <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
          {t("more", { count: report.weak.length - MAX_SHOWN })}
        </p>
      ) : null}
    </section>
  );
}
