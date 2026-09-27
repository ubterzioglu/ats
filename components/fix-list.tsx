import type { Finding } from "@/types/analysis";
import { SEVERITY_EDGE, SEVERITY_LABEL, SEVERITY_TEXT } from "@/lib/ui";

interface FixListProps {
  readonly findings: readonly Finding[];
}

export function FixList({ findings }: FixListProps) {
  if (findings.length === 0) {
    return (
      <section className="sheet p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Nothing to fix</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
          Every check passed. Run the CV against the next job ad to see how the keyword match holds up.
        </p>
      </section>
    );
  }

  return (
    <section className="sheet overflow-hidden" aria-labelledby="fixes-heading">
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="fixes-heading" className="text-sm font-semibold">
          What to fix, most expensive first
        </h2>
        <span className="font-mono text-xs text-muted">{findings.length}</span>
      </div>

      <ol>
        {findings.map((finding) => (
          <li key={finding.id} className="flex gap-4 border-b border-line/60 px-5 py-5 last:border-b-0 sm:px-6">
            <span aria-hidden className={`mt-1 w-1 shrink-0 rounded-full ${SEVERITY_EDGE[finding.severity]}`} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-sm font-medium">{finding.title}</h3>
                <span className={`font-mono text-xs tabular-nums ${SEVERITY_TEXT[finding.severity]}`}>
                  −{finding.cost} pts
                </span>
                <span className="text-xs text-muted">{SEVERITY_LABEL[finding.severity]}</span>
              </div>

              <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{finding.detail}</p>
              <p className="mt-2 max-w-measure text-sm leading-relaxed">
                <span className="font-medium">Fix: </span>
                {finding.fix}
              </p>

              {finding.evidence && finding.evidence.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted hover:text-ink">
                    Show what was found
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {finding.evidence.map((line) => (
                      <li
                        key={line}
                        className="overflow-x-auto whitespace-pre rounded-sheet bg-bed/60 px-3 py-2 font-mono text-xs text-muted"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
