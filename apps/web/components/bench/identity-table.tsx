"use client";

import { useTranslations } from "next-intl";

import { readIdentity, type FieldStatus, type IdentityField } from "@/lib/bench/identity";
import { cx } from "@/lib/ui";
import type { Finding } from "@/types/analysis";

interface IdentityTableProps {
  readonly cvText: string;
  readonly findings: readonly Finding[];
  readonly onSelectLine?: (line: string) => void;
}

const DOT: Readonly<Record<FieldStatus, string>> = {
  found: "bg-good",
  suspect: "bg-caution",
  missing: "bg-mark"
};

/**
 * The first question a candidate asks is not what they scored. It is whether
 * the machine read their name, their address and their dates correctly. This
 * answers it in five rows.
 *
 * Status comes from the engine, so the table can never contradict the score
 * sitting next to it.
 */
export function IdentityTable({ cvText, findings, onSelectLine }: IdentityTableProps) {
  const t = useTranslations("identityTable");
  const fields = readIdentity(cvText, findings);

  function row(field: IdentityField) {
    const line = field.line !== undefined ? cvText.split("\n")[field.line] : undefined;

    return (
      <div key={field.id} className="flex items-baseline gap-3 px-5 py-3 sm:px-6">
        <span aria-hidden className={cx("mt-1.5 size-2 shrink-0 rounded-full", DOT[field.status])} />

        <dt className="condensed w-20 shrink-0 text-micro font-medium text-ink">
          {t(`fields.${field.id}`)}
        </dt>

        <dd className="min-w-0 flex-1">
          {field.value !== undefined ? (
            onSelectLine && line !== undefined ? (
              <button
                type="button"
                title={t("showLine")}
                onClick={() => onSelectLine(line)}
                className="block w-full truncate text-left font-mono text-micro text-ink transition-colors hover:text-action"
              >
                {field.value}
              </button>
            ) : (
              <span className="block truncate font-mono text-micro text-ink">{field.value}</span>
            )
          ) : (
            <span className="text-micro text-muted">{t(`status.${field.status}`)}</span>
          )}

          {field.reason ? (
            <p
              className={cx(
                "mt-1 max-w-measure text-micro leading-relaxed",
                field.status === "missing" ? "text-muted" : "text-caution"
              )}
            >
              {field.candidate !== undefined
                ? t("reason.rejected-candidate", { candidate: field.candidate })
                : t(`reason.${field.reason}`)}
            </p>
          ) : null}
        </dd>

        <span
          className={cx(
            "shrink-0 text-micro",
            field.status === "found" ? "text-muted" : "text-caution"
          )}
        >
          {t(`status.${field.status}`)}
        </span>
      </div>
    );
  }

  return (
    <section className="bench overflow-hidden" aria-labelledby="identity-heading">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h2 id="identity-heading" className="text-h3 font-semibold">
          {t("heading")}
        </h2>
        <p className="mt-2 max-w-measure text-sm leading-relaxed text-muted">{t("lede")}</p>
      </div>

      <dl className="divide-y divide-line">{fields.map(row)}</dl>
    </section>
  );
}
