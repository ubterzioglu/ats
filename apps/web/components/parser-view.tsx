import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef } from "react";

import { cx } from "@/lib/ui";

interface ParserViewProps {
  readonly text: string;
  readonly highlights: readonly string[];
  readonly caption: string;
  /**
   * Index of the line to mark, resolved by the caller. An index rather than the
   * line's text: two identical lines in a document are two different places,
   * and matching by text would always send the reader to the first.
   */
  readonly markedIndex?: number | null;
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
      <mark key={`${part}-${key}-${index}`} className="bg-transparent text-saffron underline underline-offset-2">
        {part}
      </mark>
    ) : (
      <Fragment key={`text-${key}-${index}`}>{part}</Fragment>
    )
  );
}

/**
 * The extracted text exactly as the scorer saw it, with the terms that matched
 * the job ad marked. Seeing the raw parse is what turns a score into something
 * a person can act on.
 */
export function ParserView({ text, highlights, caption, markedIndex }: ParserViewProps) {
  const t = useTranslations("parserView");
  const markedRef = useRef<HTMLSpanElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const clipped = text.length > MAX_RENDERED;
  const body = clipped ? text.slice(0, MAX_RENDERED) : text;
  const pattern = buildPattern(highlights);
  const lines = body.split("\n");

  const marked = markedIndex ?? -1;

  useEffect(() => {
    if (marked < 0) return;

    // Two moves, and both are needed. Scrolling the line inside the pre is
    // useless if the pre itself is off-screen, which it is on mobile and
    // usually is on desktop: the tables sit above it in the same column.
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = smooth ? "smooth" : "auto";

    sectionRef.current?.scrollIntoView({ block: "nearest", behavior });
    markedRef.current?.scrollIntoView({ block: "center", behavior });
  }, [marked]);

  return (
    <section
      ref={sectionRef}
      className="bench flex min-h-0 flex-col overflow-hidden"
      aria-labelledby="parser-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 sm:px-6">
        <h2 id="parser-heading" className="text-h3 font-normal">
          {t("heading")}
        </h2>
        <span className="readout">{caption}</span>
      </div>

      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-micro leading-relaxed text-muted sm:px-6">
        {lines.map((line, index) => (
          <span
            key={`line-${index}`}
            ref={index === marked ? markedRef : undefined}
            id={index === marked ? "marked-line" : undefined}
            aria-current={index === marked ? "true" : undefined}
            className={cx(
              "block scroll-my-8",
              index === marked && "-mx-1.5 border-l-2 border-iris px-1.5 text-ink"
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
