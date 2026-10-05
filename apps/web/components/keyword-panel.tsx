import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { KeywordReport, KeywordTerm, KeywordTier, DocumentLanguage } from "@/types/analysis";

import type { CoverageMapReport } from "@/lib/ai/coverage-map";
import type { PartialMatchHint } from "@/lib/ai/semantic-match";
import { matchTerms } from "@/lib/scoring/match";
import { cx } from "@/lib/ui";

interface KeywordPanelProps {
  readonly report: KeywordReport;
  /** Advisory near-misses from the local model; never affects scores. */
  readonly hints?: readonly PartialMatchHint[];
  /** Advisory coverage in embedding space; never affects scores. */
  readonly coverage?: CoverageMapReport | null;
  readonly cvText?: string;
  readonly language?: DocumentLanguage;
  readonly embedderReady?: boolean;
}

type Status = "found" | "alias" | "missing";

function statusOf(term: KeywordTerm): Status {
  if (term.hits === 0) return "missing";
  return term.alias ? "alias" : "found";
}

const CHIP_STYLE: Readonly<Record<Status, string>> = {
  found: "border-line text-ink",
  alias: "border-caution text-ink",
  missing: "border-mark text-mark"
};

const COVERAGE_SHOWN = 6;
const SNIPPET_CHARS = 220;

function snippet(chunk: string): string {
  return chunk.length > SNIPPET_CHARS ? `${chunk.slice(0, SNIPPET_CHARS)}…` : chunk;
}

function TermChip({ term, hint }: { readonly term: KeywordTerm; readonly hint?: PartialMatchHint }) {
  const t = useTranslations("keywordPanel");
  const status = statusOf(term);
  return (
    <li
      className={cx(
        "rounded-full border px-3 py-1 font-mono text-micro",
        hint ? "border-caution text-ink" : CHIP_STYLE[status]
      )}
      title={
        hint
          ? t("titlePartial", {
              passage: hint.passage,
              percent: Math.round(hint.similarity * 100)
            })
          : status === "alias"
            ? t("titleAlias", { alias: term.alias ?? "" })
            : status === "missing"
              ? t("titleMissing")
              : undefined
      }
    >
      {term.term}
      {status === "found" && term.hits > 1 ? (
        <span className="ml-1 text-muted">×{term.hits}</span>
      ) : null}
      <span className="condensed ml-2 text-micro text-muted">
        {hint
          ? t("statusPartial")
          : status === "found"
            ? t("statusFound")
            : status === "alias"
              ? t("statusAlias")
              : t("statusMissing")}
      </span>
    </li>
  );
}

const TIER_GROUPS: ReadonlyArray<{
  readonly tier: KeywordTier | undefined;
  readonly labelKey: "tierRequired" | "tierOther" | "tierPreferred";
}> = [
  { tier: "required", labelKey: "tierRequired" },
  { tier: undefined, labelKey: "tierOther" },
  { tier: "preferred", labelKey: "tierPreferred" }
];

/**
 * One panel, both reports. Literal term matching is measurement and comes from
 * the deterministic engine; the coverage section below it is the local model's
 * reading of the same ad, and is marked as such in `live-ink` - the only thing
 * in this product that colour is allowed to mean.
 *
 * The coverage section is absent until a model has produced one, so the panel
 * is complete without AI.
 */
export function KeywordPanel({ report, hints, coverage, cvText, language, embedderReady }: KeywordPanelProps) {
  const t = useTranslations("keywordPanel");
  const c = useTranslations("coverageMap");
  const matchedFromAd = report.source === "job-description";
  const percentage = Math.round(report.coverage * 100);
  const all = useMemo(
    () => (matchedFromAd ? [...report.matched, ...report.missing] : []),
    [matchedFromAd, report.matched, report.missing]
  );
  const hintByTerm = new Map((hints ?? []).map((hint) => [hint.term, hint]));
  const showCoverage = matchedFromAd && coverage !== null && coverage !== undefined && coverage.adChunks > 0;

  const baseTerms = useMemo(
    () => all.map(t => ({ term: t.term, weight: t.weight, tier: t.tier, hits: 0 })),
    [all]
  );

  const strictOutcome = useMemo(() => {
    if (!matchedFromAd || !cvText) return null;
    return matchTerms(baseTerms, cvText, language, "strict");
  }, [baseTerms, cvText, language, matchedFromAd]);

  const semanticOutcome = useMemo(() => {
    if (!matchedFromAd || !cvText || !embedderReady) return null;
    return matchTerms(baseTerms, cvText, language, "semantic", hints ?? []);
  }, [baseTerms, cvText, language, hints, matchedFromAd, embedderReady]);

  const strictCount = strictOutcome?.matched.length ?? 0;
  const normalizedCount = report.matched.length;
  const semanticCount = semanticOutcome?.matched.length ?? 0;

  const strictNames = useMemo(() => new Set(strictOutcome?.matched.map(t => t.term)), [strictOutcome]);
  const normalizedNames = useMemo(() => new Set(report.matched.map(t => t.term)), [report]);
  const semanticNames = useMemo(() => new Set(semanticOutcome?.matched.map(t => t.term)), [semanticOutcome]);

  const aliasDiff = useMemo(() => all.filter(t => !strictNames.has(t.term) && normalizedNames.has(t.term)), [all, strictNames, normalizedNames]);
  const semanticDiff = useMemo(() => all.filter(t => !normalizedNames.has(t.term) && semanticNames.has(t.term)), [all, normalizedNames, semanticNames]);
  const totalDiffCount = aliasDiff.length + semanticDiff.length;

  return (
    <section className="bench overflow-hidden" aria-labelledby="keywords-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="keywords-heading" className="text-h3 font-normal">
          {t(matchedFromAd ? "headingFromAd" : "headingBaseline")}
        </h2>
        {matchedFromAd ? (
          <span className="font-mono text-sm tabular-nums">
            {percentage}
            <span className="text-muted">{t("covered")}</span>
          </span>
        ) : null}
      </div>

      {matchedFromAd ? (
        <div className="h-1 border-b border-line bg-bench-sunk">
          <div className="h-full bg-saffron" style={{ width: `${percentage}%` }} />
        </div>
      ) : null}

      <div className="space-y-6 px-5 py-5 sm:px-6">
        {matchedFromAd && strictOutcome ? (
          <div className="border-l border-line pl-4 text-sm">
            <p className="text-muted">
              {embedderReady ? 
                t("modeSummary", { strict: strictCount, semantic: semanticCount, count: totalDiffCount }) :
                t("modeSummaryNoSemantic", { strict: strictCount, normalized: normalizedCount, count: aliasDiff.length })
              }
            </p>
            {totalDiffCount > 0 && embedderReady ? (
              <ul className="mt-3 space-y-2">
                {aliasDiff.length > 0 && (
                  <li>
                    <span className="condensed mr-2 text-micro uppercase text-muted">{t("modeAliasOnly")}</span>
                    {aliasDiff.map(t => t.term).join(", ")}
                  </li>
                )}
                {semanticDiff.length > 0 && (
                  <li>
                    <span className="condensed mr-2 text-micro uppercase text-muted">{t("modeSemanticOnly")}</span>
                    {semanticDiff.map(t => t.term).join(", ")}
                  </li>
                )}
              </ul>
            ) : aliasDiff.length > 0 && !embedderReady ? (
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="condensed mr-2 text-micro uppercase text-muted">{t("modeAliasOnly")}</span>
                  {aliasDiff.map(t => t.term).join(", ")}
                </li>
              </ul>
            ) : null}
            {!embedderReady && (
              <p className="mt-3 text-micro text-live-ink">
                {t("enableSemantic")}
              </p>
            )}
          </div>
        ) : null}

        {matchedFromAd
          ? TIER_GROUPS.map(({ tier, labelKey }) => {
              const terms = all
                .filter((term) => term.tier === tier)
                .sort((a, b) => b.weight - a.weight);
              if (terms.length === 0) return null;
              return (
                <div key={labelKey}>
                  <h3 className="condensed text-micro font-normal text-muted">{t(labelKey)}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
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
            <h3 className="condensed text-micro font-normal text-muted">{t("recognised")}</h3>
            {report.matched.length === 0 ? (
              <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("noTerms")}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {report.matched.map((term) => (
                  <li
                    key={term.term}
                    className="rounded-full border border-edge/50 px-3 py-1 font-mono text-micro"
                  >
                    {term.term}
                    {term.hits > 1 ? <span className="ml-1 text-muted">×{term.hits}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 max-w-measure text-sm leading-relaxed text-muted">{t("pasteAd")}</p>
          </div>
        ) : null}
      </div>

      {showCoverage ? (
        <div className="border-t border-line px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-sm font-normal">{c("heading")}</h3>
            <span className="condensed text-micro text-live-ink">{c("fromModel")}</span>
          </div>
          <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
            {c("lede", {
              chunks: coverage.adChunks,
              threshold: Math.round(coverage.threshold * 100)
            })}
          </p>

          {coverage.weak.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted">{c("allCovered")}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {coverage.weak.slice(0, COVERAGE_SHOWN).map((entry) => (
                <li
                  key={entry.chunk.slice(0, 60)}
                  className="border-l border-line pl-3"
                >
                  <p className="font-mono text-micro leading-relaxed text-muted">
                    {snippet(entry.chunk)}
                  </p>
                  <p className="mt-2 font-mono text-micro tabular-nums text-caution">
                    {c("bestMatch", { percent: Math.round(entry.best * 100) })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {coverage.weak.length > COVERAGE_SHOWN ? (
            <p className="mt-3 text-micro text-muted">
              {c("more", { count: coverage.weak.length - COVERAGE_SHOWN })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
