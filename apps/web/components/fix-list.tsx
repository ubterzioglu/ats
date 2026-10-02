import { useTranslations } from "next-intl";

import type { Finding } from "@/types/analysis";
import { SEVERITY_EDGE, SEVERITY_TEXT } from "@/lib/ui";

import { FindingExplainButton, type ExplanationView } from "./finding-explain";

interface FixListProps {
  readonly findings: readonly Finding[];
  readonly onSelectEvidence?: (line: string) => void;
  readonly explain?: (finding: Finding) => Promise<ExplanationView>;
}

export function FixList({ findings, onSelectEvidence, explain }: FixListProps) {
  const t = useTranslations("fixList");
  const severity = useTranslations("severity");

  if (findings.length === 0) {
    return (
      <section className="sheet p-5 sm:p-6">
        <h2 className="text-base font-semibold">{t("emptyHeading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">
          {t("emptyBody")}
        </p>
      </section>
    );
  }

  const recoverable = findings.reduce((sum, finding) => sum + finding.cost, 0);

  return (
    <section className="sheet overflow-hidden" aria-labelledby="fixes-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="fixes-heading" className="text-base font-semibold">
          {t("heading")}
        </h2>
        <span className="readout">
          {t("summary", { count: findings.length, points: recoverable })}
        </span>
      </div>

      <ol className="divide-y divide-line/70">
        {findings.map((finding) => (
          <li key={finding.id} className="flex gap-4 px-5 py-5 sm:px-6">
            <span
              aria-hidden
              className={`my-1 w-[3px] shrink-0 self-stretch rounded-full ${SEVERITY_EDGE[finding.severity]}`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {onSelectEvidence && finding.evidence && finding.evidence.length > 0 ? (
                  <button
                    type="button"
                    className="text-left font-sans text-sm font-semibold underline decoration-line underline-offset-4 transition-colors hover:decoration-accent"
                    title={t("showLine")}
                    onClick={() => onSelectEvidence(finding.evidence?.[0] ?? "")}
                  >
                    {finding.title}
                  </button>
                ) : (
                  <h3 className="font-sans text-sm font-semibold">{finding.title}</h3>
                )}
                <span className={`font-mono text-xs tabular-nums ${SEVERITY_TEXT[finding.severity]}`}>
                  {t("cost", { cost: finding.cost })}
                </span>
                <span className="text-xs text-muted">{severity(finding.severity)}</span>
              </div>

              <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{finding.detail}</p>

              <p className="mt-3 max-w-measure border-l-2 border-accent/30 pl-3 text-sm leading-relaxed">
                {finding.fix}
              </p>

              {explain ? <FindingExplainButton finding={finding} explain={explain} /> : null}

              {finding.evidence && finding.evidence.length > 0 ? (
                <details className="group mt-3">
                  <summary className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-ink">
                    <span className="group-open:hidden">{t("showEvidence")}</span>
                    <span className="hidden group-open:inline">{t("hideEvidence")}</span>
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {finding.evidence.map((line) => (
                      <li key={line}>
                        {onSelectEvidence ? (
                          <button
                            type="button"
                            title={t("showLine")}
                            onClick={() => onSelectEvidence(line)}
                            className="block w-full overflow-x-auto whitespace-pre rounded-chip bg-bed px-3 py-2 text-left font-mono text-xs text-muted transition-colors hover:bg-accent/15 hover:text-ink"
                          >
                            {line}
                          </button>
                        ) : (
                          <span className="block overflow-x-auto whitespace-pre rounded-chip bg-bed px-3 py-2 font-mono text-xs text-muted">
                            {line}
                          </span>
                        )}
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
