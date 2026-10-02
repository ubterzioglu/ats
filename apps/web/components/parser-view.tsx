import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef } from "react";

import { cx } from "@/lib/ui";

interface ParserViewProps {
  readonly text: string;
  readonly highlights: readonly string[];
  readonly caption: string;
  /** Evidence line from a selected finding; the view scrolls to it and marks it. */
  readonly markedLine?: string | null;
}

const MAX_RENDERED = 24000;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(terms: readonly string[]): RegExp | null {
  if (terms.length === 0) return null;
  const alternatives = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}])(${alternatives})(?![\\p{L}\\p{N}])`, "giu");
}

function renderLine(line: string, pattern: RegExp | null, key: number) {
  const parts = pattern ? line.split(pattern) : [line];
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${key}-${index}`} className="rounded-chip bg-action/20 px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      <Fragment key={`text-${key}-${index}`}>{part}</Fragment>
    )
  );
}

/** Trailing ellipses are display truncation in evidence, not document text. */
function evidenceNeedle(markedLine: string): string {
  return markedLine.replace(/(\.\.\.|…)\s*$/u, "").trim();
}

/**
 * The extracted text exactly as the scorer saw it, with the terms that matched
 * the job ad marked. Seeing the raw parse is what turns a score into something
 * a person can act on.
 */
export function ParserView({ text, highlights, caption, markedLine }: ParserViewProps) {
  const t = useTranslations("parserView");
  const markedRef = useRef<HTMLSpanElement | null>(null);
  const clipped = text.length > MAX_RENDERED;
  const body = clipped ? text.slice(0, MAX_RENDERED) : text;
  const pattern = buildPattern(highlights);
  const lines = body.split("\n");

  const needle = markedLine ? evidenceNeedle(markedLine) : "";
  const markedIndex =
    needle.length > 0 ? lines.findIndex((line) => line.includes(needle)) : -1;

  useEffect(() => {
    if (markedIndex >= 0) {
      markedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [markedIndex, needle]);

  return (
    <section className="bench flex min-h-0 flex-col overflow-hidden" aria-labelledby="parser-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="parser-heading" className="text-base font-semibold">
          {t("heading")}
        </h2>
        <span className="readout">{caption}</span>
      </div>

      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words bg-bench-sunk px-5 py-4 font-mono text-xs leading-relaxed text-muted sm:px-6">
        {lines.map((line, index) => (
          <span
            key={`line-${index}`}
            ref={index === markedIndex ? markedRef : undefined}
            id={index === markedIndex ? "marked-line" : undefined}
            className={cx(
              "block",
              index === markedIndex && "-mx-1.5 rounded-chip bg-action/20 px-1.5 text-ink"
            )}
          >
            {renderLine(line, pattern, index)}
            {line.length === 0 ? " " : null}
          </span>
        ))}
        {clipped ? `\n\n${t("truncated")}` : null}
      </pre>
    </section>
  );
}
