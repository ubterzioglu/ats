"use client";

import { useTranslations } from "next-intl";

import type { Finding, Strength } from "@/types/analysis";

interface StrengthsPanelProps {
  readonly strengths: readonly Strength[];
  readonly findings: readonly Finding[];
}

/**
 * Shows what the CV does well alongside the top findings to fix.
 * Strengths are localised by id; params carry the evidence numbers.
 */
export function StrengthsPanel({ strengths, findings }: StrengthsPanelProps) {
  const t = useTranslations("strengths");

  if (strengths.length === 0 && findings.length === 0) return null;

  const topFindings = findings.slice(0, 3);

  return (
    <section className="bench space-y-4 p-5 sm:p-6" aria-labelledby="strengths-heading">
      <h2 id="strengths-heading" className="text-h3 font-normal">
        {t("heading")}
      </h2>

      {strengths.length > 0 ? (
        <ul className="space-y-2">
          {strengths.map((strength) => (
            <li key={strength.id} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-good" aria-hidden="true">
                +
              </span>
              <span className="text-muted">
                {t(strength.id as any, strength.params as any)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No standout strengths detected.</p>
      )}

      {topFindings.length > 0 ? (
        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-micro font-normal text-muted">Top fixes</p>
          <ul className="space-y-2">
            {topFindings.map((finding) => (
              <li key={finding.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-mark" aria-hidden="true">
                  -
                </span>
                <div>
                  <p className="text-ink">{finding.title}</p>
                  <p className="text-micro text-muted">
                    {finding.cost} pt{finding.cost !== 1 ? "s" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
