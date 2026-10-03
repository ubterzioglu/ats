"use client";

import { useTranslations } from "next-intl";

import {
  formatStringList,
  parseStringList,
  readValue,
  setField,
  setLiteral,
  type Path
} from "@/lib/editor/draft";
import type { InputKind } from "@/lib/editor/spec";
import type { Resume } from "@/types/resume";

interface FieldInputProps {
  readonly resume: Resume;
  readonly path: Path;
  readonly input: InputKind;
  readonly label: string;
  readonly hint?: string;
  readonly onChange: (next: Resume) => void;
  /** Paths an import flagged as heuristic; rendered as a "check this" badge. */
  readonly reviewPaths?: ReadonlySet<string>;
}

const HTML_TYPE: Readonly<Record<Exclude<InputKind, "textarea" | "boolean">, string>> = {
  text: "text",
  date: "text",
  url: "url",
  email: "email",
  tel: "tel"
};

/**
 * One input, addressed by path. Every field in the model routes through here,
 * so the rules that matter - a cleared field is removed rather than stored as
 * "", a date keeps the empty string JSON Resume uses for an open role - are
 * written once instead of per section.
 *
 * Dates are a text input, not `type="date"`. The model accepts YYYY, YYYY-MM
 * and YYYY-MM-DD, and a native date picker would force a full date onto a
 * candidate who only knows the year.
 */
export function FieldInput({ resume, path, input, label, hint, onChange, reviewPaths }: FieldInputProps) {
  const t = useTranslations("editor");
  const id = path.join(".");
  const current = readValue(resume, path);
  const flagged = reviewPaths?.has(id) ?? false;

  if (input === "boolean") {
    return (
      <label className="flex min-h-11 items-center gap-3">
        <input
          id={id}
          type="checkbox"
          checked={current === true}
          onChange={(event) =>
            onChange(setField(resume, path, event.target.checked ? true : undefined))
          }
        />
        <span className="text-sm">{label}</span>
      </label>
    );
  }

  const value = typeof current === "string" ? current : "";

  return (
    <label className="block" htmlFor={id}>
      <span
        className={
          flagged
            ? "condensed text-micro font-medium text-caution"
            : "condensed text-micro font-medium text-muted"
        }
      >
        {label}
      </span>

      {input === "textarea" ? (
        <textarea
          id={id}
          className="field mt-2 min-h-[6rem] text-sm"
          value={value}
          onChange={(event) => onChange(setField(resume, path, event.target.value))}
        />
      ) : (
        <input
          id={id}
          type={HTML_TYPE[input]}
          inputMode={input === "date" ? "numeric" : undefined}
          placeholder={input === "date" ? t("datePlaceholder") : undefined}
          className="field mt-2 text-sm"
          aria-invalid={flagged || undefined}
          value={value}
          onChange={(event) =>
            // A date keeps "", because JSON Resume writes it for a role that
            // is still open. Every other field drops an empty value.
            onChange(
              input === "date"
                ? setLiteral(resume, path, event.target.value)
                : setField(resume, path, event.target.value)
            )
          }
        />
      )}

      {flagged ? (
        <span className="mt-1 block text-micro text-caution">{t("needsReview")}</span>
      ) : hint ? (
        <span className="mt-1 block text-micro text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

interface StringListInputProps {
  readonly resume: Resume;
  readonly path: Path;
  readonly label: string;
  readonly onChange: (next: Resume) => void;
  readonly reviewPaths?: ReadonlySet<string>;
}

/**
 * One entry per line. A textarea rather than a row of chips with an add
 * button: these are sentences on a CV, people paste them in from the document
 * they already have, and a chip editor turns a paste into ten clicks.
 */
export function StringListInput({ resume, path, label, onChange, reviewPaths }: StringListInputProps) {
  const t = useTranslations("editor");
  const id = path.join(".");
  const flagged = reviewPaths?.has(id) ?? false;

  return (
    <label className="block" htmlFor={id}>
      <span
        className={
          flagged
            ? "condensed text-micro font-medium text-caution"
            : "condensed text-micro font-medium text-muted"
        }
      >
        {label}
      </span>
      <textarea
        id={id}
        className="field mt-2 min-h-[6rem] text-sm"
        aria-invalid={flagged || undefined}
        value={formatStringList(readValue(resume, path))}
        onChange={(event) => onChange(setField(resume, path, parseStringList(event.target.value)))}
      />
      <span className="mt-1 block text-micro text-muted">
        {flagged ? t("needsReview") : t("onePerLine")}
      </span>
    </label>
  );
}
