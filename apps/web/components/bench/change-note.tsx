"use client";

import { useTranslations } from "next-intl";

import type { ScoreChange } from "@/lib/bench/change";
import { cx } from "@/lib/ui";

interface ChangeNoteProps {
  readonly change: ScoreChange;
  readonly onDismiss: () => void;
}

/**
 * What the last applied fix was worth, and which finding it closed. It sits at
 * the head of the spine, where the user just acted, rather than beside the
 * score: the question it answers is "did that work", and that question is asked
 * at the work, not at the instrument.
 *
 * Measurement does not move, so this does not animate in. It is simply there on
 * the next render.
 */
export function ChangeNote({ change, onDismiss }: ChangeNoteProps) {
  const t = useTranslations("changeNote");
  const gained = change.total > 0;

  return (
    <section
      className="bench px-5 py-4 sm:px-6"
      role="status"
      aria-label={t("label")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="flex items-baseline gap-3">
          <span
            className={cx(
              "font-mono text-h3 tabular-nums",
              change.total === 0 ? "text-muted" : gained ? "text-good" : "text-mark"
            )}
          >
            {change.total > 0 ? `+${change.total}` : change.total === 0 ? "0" : change.total}
          </span>
          <span className="text-sm text-muted">
            {change.dimensions.length > 0
              ? change.dimensions
                  .map((entry) => `${entry.label} ${entry.delta > 0 ? `+${entry.delta}` : entry.delta}`)
                  .join(" · ")
              : t("noDimensionMoved")}
          </span>
        </p>

        <button
          type="button"
          className="inline-flex min-h-11 items-center text-micro text-muted transition-colors hover:text-ink"
          onClick={onDismiss}
        >
          {t("dismiss")}
        </button>
      </div>

      {change.closed.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {change.closed.map((finding) => (
            <li key={finding.id} className="text-sm leading-relaxed">
              {t("closed", { title: finding.title, points: finding.cost })}
            </li>
          ))}
        </ul>
      ) : null}

      {change.opened.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {change.opened.map((finding) => (
            <li key={finding.id} className="text-sm leading-relaxed text-caution">
              {t("opened", { title: finding.title, points: finding.cost })}
            </li>
          ))}
        </ul>
      ) : null}

      {!change.attributed ? (
        // The arithmetic did not add up, which means a dimension hit its floor
        // or ceiling. Saying so is better than printing a number that cannot be
        // traced to a finding, in a product whose claim is that every point can.
        <p className="mt-2 max-w-measure text-micro leading-relaxed text-muted">
          {t("partlyAttributed")}
        </p>
      ) : null}
    </section>
  );
}
