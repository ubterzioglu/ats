"use client";

import { useTranslations } from "next-intl";

import { readExperienceEntries } from "@/lib/bench/entries";
import { cx } from "@/lib/ui";
import type { DetectedSection } from "@/types/analysis";

interface EntriesTableProps {
  readonly cvText: string;
  readonly sections: readonly DetectedSection[];
  readonly onSelectLine?: (line: string) => void;
}

/** The sections a CV is expected to carry, in the order a reader looks for them. */
const EXPECTED: readonly string[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications"
];

/**
 * Entries as the parser separated them, and which sections it found at all.
 * Shown together because they answer one question: did the machine take this
 * document apart the way a person would.
 */
export function EntriesTable({ cvText, sections, onSelectLine }: EntriesTableProps) {
  const t = useTranslations("entriesTable");
  const entries = readExperienceEntries(cvText);
  const found = new Set(sections.map((section) => section.id));

  return (
    <section className="bench overflow-hidden" aria-labelledby="entries-heading">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="entries-heading" className="text-h3 font-semibold">
          {t("heading")}
        </h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-4 text-sm leading-relaxed text-muted sm:px-6">{t("noEntries")}</p>
      ) : (
        <ol className="divide-y divide-line">
          {entries.map((entry) => (
            <li key={`${entry.line}-${entry.source}`} className="px-5 py-3 sm:px-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="min-w-0 flex-1 truncate text-sm">
                  {entry.title ?? <span className="text-muted">{t("noTitle")}</span>}
                  {entry.organisation ? (
                    <span className="text-muted"> · {entry.organisation}</span>
                  ) : null}
                </p>
                <span
                  className={cx(
                    "shrink-0 font-mono text-micro tabular-nums",
                    entry.status === "unusable" ? "text-mark" : "text-muted"
                  )}
                >
                  {entry.range ?? t("noRange")}
                </span>
              </div>

              {entry.status === "unusable" ? (
                <p className="mt-1 text-micro leading-relaxed text-mark">{t("unusable")}</p>
              ) : null}

              {onSelectLine ? (
                <button
                  type="button"
                  className="mt-1 inline-flex min-h-11 items-center text-micro text-muted transition-colors hover:text-action"
                  onClick={() => onSelectLine(entry.source)}
                >
                  {t("showLine")}
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <div className="border-t border-line px-5 py-4 sm:px-6">
        <h3 className="condensed text-micro font-medium text-muted">{t("sectionsHeading")}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {EXPECTED.map((id) => (
            <li
              key={id}
              className={cx(
                "rounded-chip border px-2 py-1 text-micro",
                found.has(id)
                  ? "border-line bg-action/[0.10] text-ink"
                  : "border-line text-muted"
              )}
            >
              {t(`sections.${id}`)}
              <span className="ml-2 text-muted">
                {t(found.has(id) ? "sectionFound" : "sectionMissing")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
