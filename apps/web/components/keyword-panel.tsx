import type { KeywordReport, KeywordTerm, KeywordTier } from "@/types/analysis";

import type { PartialMatchHint } from "@/lib/ai/semantic-match";
import { cx } from "@/lib/ui";

interface KeywordPanelProps {
  readonly report: KeywordReport;
  /** Advisory near-misses from the local model; never affects scores. */
  readonly hints?: readonly PartialMatchHint[];
}

type Status = "found" | "alias" | "missing";

function statusOf(term: KeywordTerm): Status {
  if (term.hits === 0) return "missing";
  return term.alias ? "alias" : "found";
}

const CHIP_STYLE: Readonly<Record<Status, string>> = {
  found: "border-line bg-signal/30 text-ink",
  alias: "border-caution/40 bg-caution/[0.08] text-ink",
  missing: "border-mark/35 bg-mark/[0.06] text-mark"
};

const STATUS_LABEL: Readonly<Record<Status, string>> = {
  found: "FOUND",
  alias: "ALIAS",
  missing: "MISSING"
};

function TermChip({ term, hint }: { readonly term: KeywordTerm; readonly hint?: PartialMatchHint }) {
  const status = statusOf(term);
  return (
    <li
      className={cx(
        "rounded-chip border px-2 py-1 font-mono text-xs",
        hint ? "border-caution/40 bg-caution/[0.08] text-ink" : CHIP_STYLE[status]
      )}
      title={
        hint
          ? `PARTIAL: the CV says something close - "${hint.passage}" (${Math.round(
              hint.similarity * 100
            )}% similar)`
          : status === "alias"
            ? `matched in the CV as "${term.alias}"`
            : status === "missing"
              ? "never appears in the CV"
              : undefined
      }
    >
      {term.term}
      {status === "found" && term.hits > 1 ? <span className="ml-1 text-muted">×{term.hits}</span> : null}
      <span className="ml-1.5 text-[10px] tracking-wide text-muted">
        {hint ? "PARTIAL" : STATUS_LABEL[status]}
      </span>
    </li>
  );
}

const TIER_GROUPS: ReadonlyArray<{ readonly tier: KeywordTier | undefined; readonly label: string }> = [
  { tier: "required", label: "The ad requires these" },
  { tier: undefined, label: "Also indexed from the ad" },
  { tier: "preferred", label: "Nice to have according to the ad" }
];

export function KeywordPanel({ report, hints }: KeywordPanelProps) {
  const matchedFromAd = report.source === "job-description";
  const coverage = Math.round(report.coverage * 100);
  const all = matchedFromAd ? [...report.matched, ...report.missing] : [];
  const hintByTerm = new Map((hints ?? []).map((hint) => [hint.term, hint]));

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
        {matchedFromAd
          ? TIER_GROUPS.map(({ tier, label }) => {
              const terms = all
                .filter((term) => term.tier === tier)
                .sort((a, b) => b.weight - a.weight);
              if (terms.length === 0) return null;
              return (
                <div key={label}>
                  <h3 className="text-xs font-medium text-muted">{label}</h3>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {terms.map((term) => (
                      <TermChip key={term.term} term={term} hint={hintByTerm.get(term.term)} />
                    ))}
                  </ul>
                </div>
              );
            })
          : null}

        {!matchedFromAd ? (
          <div>
            <h3 className="text-xs font-medium text-muted">Recognised in the CV</h3>
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
            <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">
              Paste a job ad to replace this inventory with a real match score against one vacancy.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
