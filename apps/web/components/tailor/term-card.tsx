"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { addTermToCvText } from "@/lib/tailor/apply-term";
import type { DetectedSection } from "@/types/analysis";
import type { MissingTermCard } from "@/types/tailor";

export interface TermCardProps {
  readonly card: MissingTermCard;
  readonly cvText: string;
  readonly sections: readonly DetectedSection[];
  readonly onApply: (newText: string) => void;
}

type Outcome = "none" | "already-there" | "no-section";

/**
 * One term the ad asks for and the CV does not carry, with the line of the ad
 * that asks for it. The confirmation gate is the whole point of the card: the
 * add button does nothing until the candidate states they have the skill, and
 * the claim is theirs, not a suggestion the tool talked them into.
 *
 * Only a term heading for the skills list can be added in one gesture. A term
 * that belongs in experience or the summary is a sentence about work the
 * candidate did, and the tool has no honest way to write that for them - so
 * the card says where it goes and stops there.
 */
export function TermCard({ card, cvText, sections, onApply }: TermCardProps) {
  const t = useTranslations("tailor");
  const [confirmed, setConfirmed] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("none");
  const checkboxId = useId();

  const addable = card.suggestedSection === "skills";

  function add() {
    if (!confirmed) return;
    const next = addTermToCvText(cvText, sections, card.term.term, true);
    if (next === null) {
      setOutcome("no-section");
      return;
    }
    if (next === cvText) {
      setOutcome("already-there");
      return;
    }
    onApply(next);
  }

  return (
    <li className="px-5 py-5 sm:px-6">
      <div className="flex items-baseline gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-normal">{card.term.term}</h3>
        <span className="shrink-0 font-mono text-micro text-muted">
          {t(`section.${card.suggestedSection}`)}
        </span>
      </div>

      <p className="mt-3 max-w-measure border-l-2 border-action/30 pl-3 text-sm leading-relaxed text-muted">
        {card.evidence}
      </p>

      {addable ? (
        <>
          <label
            className="mt-4 flex min-h-11 max-w-measure items-center gap-3"
            htmlFor={checkboxId}
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={confirmed}
              onChange={(event) => {
                setConfirmed(event.target.checked);
                setOutcome("none");
              }}
            />
            <span className="text-sm">{t("confirmLabel", { term: card.term.term })}</span>
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-quiet" onClick={add} disabled={!confirmed}>
              {t("addToSkills")}
            </button>
            {!confirmed ? <span className="text-micro text-muted">{t("confirmHint")}</span> : null}
          </div>
        </>
      ) : (
        <p className="mt-3 max-w-measure text-micro text-muted">{t("writeItYourself")}</p>
      )}

      {outcome === "already-there" ? (
        <p className="mt-3 text-micro text-muted">{t("alreadyThere")}</p>
      ) : null}
      {outcome === "no-section" ? (
        <p className="mt-3 max-w-measure text-micro text-caution">{t("noSkillsSection")}</p>
      ) : null}
    </li>
  );
}
