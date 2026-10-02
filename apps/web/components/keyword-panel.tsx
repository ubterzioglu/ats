import type { KeywordReport } from "@/types/analysis";

interface KeywordPanelProps {
  readonly report: KeywordReport;
}

export function KeywordPanel({ report }: KeywordPanelProps) {
  const matchedFromAd = report.source === "job-description";
  const coverage = Math.round(report.coverage * 100);

  return (
    <section className="sheet overflow-hidden" aria-labelledby="keywords-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="keywords-heading" className="text-base font-semibold">
          {matchedFromAd ? "Terms from the job ad" : "Skill terms found in the CV"}
        </h2>
        {matchedFromAd ? (
          <span className="font-mono text-sm tabular-nums">
            {coverage}
            <span className="text-muted"> % covered</span>
          </span>
        ) : null}
      </div>

      {matchedFromAd ? (
        <div className="ruler h-1.5 border-b border-line bg-bed/60">
          <div className="h-full bg-accent" style={{ width: `${coverage}%` }} />
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5 sm:px-6">
        {matchedFromAd && report.missing.length > 0 ? (
          <div>
            <h3 className="text-xs font-medium text-mark">The ad asks for these; the CV never says them</h3>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {report.missing.map((term) => (
                <li
                  key={term.term}
                  className="rounded-chip border border-mark/35 bg-mark/[0.06] px-2 py-1 font-mono text-xs text-mark"
                >
                  {term.term}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="text-xs font-medium text-muted">
            {matchedFromAd ? "Present in both" : "Recognised in the CV"}
          </h3>
          {report.matched.length === 0 ? (
            <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
              No recognisable skill terms. Name the tools and methods you work with.
            </p>
          ) : (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {report.matched.map((term) => (
                <li
                  key={term.term}
                  className="rounded-chip border border-line bg-signal/30 px-2 py-1 font-mono text-xs"
                >
                  {term.term}
                  {term.hits > 1 ? <span className="ml-1 text-muted">×{term.hits}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!matchedFromAd ? (
          <p className="max-w-measure text-sm leading-relaxed text-muted">
            Paste a job ad to replace this inventory with a real match score against one vacancy.
          </p>
        ) : null}
      </div>
    </section>
  );
}
