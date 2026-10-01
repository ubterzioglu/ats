import type { KeywordReport } from "@/types/analysis";

interface KeywordPanelProps {
  readonly report: KeywordReport;
}

export function KeywordPanel({ report }: KeywordPanelProps) {
  const matchedFromAd = report.source === "job-description";

  return (
    <section className="sheet p-5 sm:p-6" aria-labelledby="keywords-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="keywords-heading" className="text-sm font-semibold">
          {matchedFromAd ? "Terms from the job ad" : "Skill terms found in the CV"}
        </h2>
        {matchedFromAd ? (
          <span className="font-mono text-sm tabular-nums">
            {Math.round(report.coverage * 100)}
            <span className="text-muted">% covered</span>
          </span>
        ) : null}
      </div>

      {matchedFromAd && report.missing.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-medium text-mark">Missing — the ad asks, the CV never says</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {report.missing.map((term) => (
              <li
                key={term.term}
                className="rounded-sheet border border-mark/45 px-2 py-1 font-mono text-xs text-mark"
              >
                {term.term}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-xs font-medium text-muted">
          {matchedFromAd ? "Present in both" : "Recognised in the CV"}
        </h3>
        {report.matched.length === 0 ? (
          <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
            No recognisable skill terms. Name the tools and methods you work with.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {report.matched.map((term) => (
              <li
                key={term.term}
                className="rounded-sheet border border-line bg-signal/25 px-2 py-1 font-mono text-xs"
              >
                {term.term}
                {term.hits > 1 ? <span className="ml-1 text-muted">×{term.hits}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!matchedFromAd ? (
        <p className="mt-5 max-w-measure text-sm leading-relaxed text-muted">
          Paste a job ad to replace this inventory with a real match score against one vacancy.
        </p>
      ) : null}
    </section>
  );
}
