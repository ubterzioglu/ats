import { useTranslations } from "next-intl";

import type { JobAdRequirements, JobAdRedFlag, SuitabilityCheck, DocumentLanguage } from "@/types/analysis";
import { resolveSalaryBand, getNegotiationTips } from "@/lib/scoring/salary";

import { cx } from "@/lib/ui";

interface AdAnalysisPanelProps {
  readonly jobAd?: JobAdRequirements;
  readonly redFlags: readonly JobAdRedFlag[];
  readonly suitability: readonly SuitabilityCheck[];
  readonly language?: DocumentLanguage;
}

const STATUS_STYLES: Readonly<Record<string, string>> = {
  passed: "border-good text-good",
  failed: "border-mark text-mark",
  unknown: "border-caution text-caution",
};

export function AdAnalysisPanel({ jobAd, redFlags, suitability, language = "en" }: AdAnalysisPanelProps) {
  const t = useTranslations("adAnalysis");

  if (!jobAd && redFlags.length === 0 && suitability.length === 0) return null;

  const benchmarkBand = jobAd?.salary ? null : resolveSalaryBand(jobAd?.seniority?.level ?? null, language);
  const negotiationTips = getNegotiationTips(language);

  return (
    <section className="bench">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-h3 font-normal">{t("heading")}</h2>
      </div>

      {jobAd ? (
        <div className="border-b border-line px-5 py-5 sm:px-6">
          <h3 className="condensed text-micro font-normal text-muted">
            {t("requirementsHeading")}
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            {jobAd.seniority ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("seniority")}:</dt>
                <dd className="font-normal">{jobAd.seniority.level}</dd>
              </div>
            ) : null}
            {jobAd.experience ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("experience")}:</dt>
                <dd className="font-normal">{jobAd.experience.years} years</dd>
              </div>
            ) : null}
            {jobAd.languages.length > 0 ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("languages")}:</dt>
                <dd className="font-normal">{jobAd.languages.map(l => l.language).join(", ")}</dd>
              </div>
            ) : null}
            {jobAd.location ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("location")}:</dt>
                <dd className="font-normal">
                  {jobAd.location.city ? `${jobAd.location.city} (${jobAd.location.mode})` : jobAd.location.mode}
                </dd>
              </div>
            ) : null}
            {jobAd.salary ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("salary")}:</dt>
                <dd className="font-normal">
                  {jobAd.salary.min.toLocaleString()} - {jobAd.salary.max.toLocaleString()} {jobAd.salary.currency}
                </dd>
              </div>
            ) : benchmarkBand ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("benchmarkSalary")}:</dt>
                <dd className="font-normal">
                  {benchmarkBand.range.min.toLocaleString()} - {benchmarkBand.range.max.toLocaleString()} {benchmarkBand.range.currency}
                  <span className="ml-1 text-xs text-muted">
                    ({benchmarkBand.range.period === "yearly" ? t("yearly") : t("monthly")}, {t("benchmarkEstimated")})
                  </span>
                </dd>
              </div>
            ) : null}
            {jobAd.targetAts ? (
              <div className="flex gap-2">
                <dt className="font-normal text-muted">{t("targetAts")}:</dt>
                <dd className="font-normal font-mono text-signal">{jobAd.targetAts.name}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {suitability.length > 0 ? (
        <div className="border-b border-line px-5 py-5 sm:px-6">
          <h3 className="condensed text-micro font-normal text-muted">
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
                <span className="shrink-0 font-normal" aria-label={t(`status.${check.status}`)}>
                  {check.status === "passed" ? "\u2713" : check.status === "failed" ? "\u2717" : "?"}
                </span>
                <div className="min-w-0">
                  <p className="font-normal">{check.title}</p>
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
          <h3 className="condensed text-micro font-normal text-muted">
            {t("redFlagsHeading")}
          </h3>
          <ul className="mt-3 space-y-3">
            {redFlags.map((flag) => (
              <li key={flag.id} className="border-l-2 border-caution px-3 py-2 text-sm">
                <p className="text-caution">{flag.description}</p>
                {flag.evidence ? (
                  <p className="mt-1 font-mono text-xs text-muted">{flag.evidence}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-line px-5 py-4 sm:px-6">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-normal text-ink select-none list-none">
            <span className="font-medium text-ink flex items-center gap-2">
              <span className="text-muted font-mono">§</span> {t("negotiationHeading")}
            </span>
            <span className="text-xs text-muted group-open:rotate-180 transition-transform duration-200">
              ▼
            </span>
          </summary>
          <div className="mt-3 space-y-2.5 pt-2">
            <p className="text-xs text-muted">{t("negotiationLede")}</p>
            <ul className="space-y-2">
              {negotiationTips.map((tip, index) => (
                <li key={index} className="rounded-control border border-line bg-bench/50 p-3 text-xs">
                  <strong className="block font-medium text-ink">{tip.title}</strong>
                  <span className="mt-0.5 block text-muted leading-relaxed">{tip.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </section>
  );
}
