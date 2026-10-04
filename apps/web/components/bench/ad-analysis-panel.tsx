import { useTranslations } from "next-intl";

import type { JobAdRedFlag, SuitabilityCheck } from "@/types/analysis";

import { cx } from "@/lib/ui";

interface AdAnalysisPanelProps {
  readonly redFlags: readonly JobAdRedFlag[];
  readonly suitability: readonly SuitabilityCheck[];
}

const STATUS_STYLES: Readonly<Record<string, string>> = {
  passed: "border-good/30 bg-good/[0.06] text-good",
  failed: "border-mark/30 bg-mark/[0.06] text-mark",
  unknown: "border-caution/30 bg-caution/[0.06] text-caution",
};

export function AdAnalysisPanel({ redFlags, suitability }: AdAnalysisPanelProps) {
  const t = useTranslations("adAnalysis");

  if (redFlags.length === 0 && suitability.length === 0) return null;

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-semibold">{t("heading")}</h2>
      </div>

      {suitability.length > 0 ? (
        <div className="border-b border-line px-5 py-5 sm:px-6">
          <h3 className="condensed text-micro font-medium text-muted">
            {t("suitabilityHeading")}
          </h3>
          <ul className="mt-3 space-y-2">
            {suitability.map((check) => (
              <li
                key={check.id}
                className={cx(
                  "flex items-start gap-3 rounded-control border px-3 py-2 text-sm",
                  STATUS_STYLES[check.status]
                )}
              >
                <span className="shrink-0 font-medium" aria-label={t(`status.${check.status}`)}>
                  {check.status === "passed" ? "\u2713" : check.status === "failed" ? "\u2717" : "?"}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{check.title}</p>
                  {check.detail ? (
                    <p className="mt-0.5 text-xs opacity-80">{check.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {redFlags.length > 0 ? (
        <div className="px-5 py-5 sm:px-6">
          <h3 className="condensed text-micro font-medium text-muted">
            {t("redFlagsHeading")}
          </h3>
          <ul className="mt-3 space-y-3">
            {redFlags.map((flag) => (
              <li key={flag.id} className="rounded-control border border-caution/30 bg-caution/[0.04] px-3 py-2 text-sm">
                <p className="text-caution">{flag.description}</p>
                {flag.evidence ? (
                  <p className="mt-1 font-mono text-xs text-muted">{flag.evidence}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
