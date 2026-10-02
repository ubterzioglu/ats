"use client";

import { useTranslations } from "next-intl";

import type { ExplanationView } from "@/components/finding-explain";
import type { Finding } from "@/types/analysis";

import { WorkItem } from "./work-item";

interface WorkListProps {
  readonly findings: readonly Finding[];
  readonly cvText?: string;
  readonly onApply?: (newText: string) => void;
  readonly onSelectEvidence?: (line: string) => void;
  readonly explain?: (finding: Finding) => Promise<ExplanationView>;
  readonly draftFix?: (lineIndex: number, line: string) => Promise<string | null>;
  readonly draftIsLive?: boolean;
}

/**
 * The spine. Findings arrive from the engine already ordered by what each one
 * costs, so the list is a work queue rather than a report: the first item is
 * the one worth doing first.
 *
 * Numbered, because the order is the content. Nothing else in this product is
 * numbered, and that is deliberate - a sequence that is not really a sequence
 * is one of the clearest tells of a generated interface.
 */
export function WorkList({
  findings,
  cvText,
  onApply,
  onSelectEvidence,
  explain,
  draftFix,
  draftIsLive
}: WorkListProps) {
  const t = useTranslations("workList");

  if (findings.length === 0) {
    return (
      <section className="bench p-5 sm:p-6">
        <h2 className="text-h3 font-semibold">{t("emptyHeading")}</h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("emptyBody")}</p>
      </section>
    );
  }

  const recoverable = findings.reduce((sum, finding) => sum + finding.cost, 0);

  return (
    <section className="bench overflow-hidden" aria-labelledby="work-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="work-heading" className="text-h3 font-semibold">
          {t("heading")}
        </h2>
        <span className="font-mono text-micro tabular-nums text-muted">
          {t("summary", { count: findings.length, points: recoverable })}
        </span>
      </div>

      <ol className="divide-y divide-line">
        {findings.map((finding, index) => (
          <WorkItem
            key={finding.id}
            index={index + 1}
            finding={finding}
            cvText={cvText}
            onApply={onApply}
            onSelectEvidence={onSelectEvidence}
            explain={explain}
            draftFix={draftFix}
            draftIsLive={draftIsLive}
          />
        ))}
      </ol>
    </section>
  );
}
