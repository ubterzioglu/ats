import { Fragment } from "react";

interface ParserViewProps {
  readonly text: string;
  readonly highlights: readonly string[];
  readonly caption: string;
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

/**
 * The extracted text exactly as the scorer saw it, with the terms that matched
 * the job ad marked. Seeing the raw parse is what turns a score into something
 * a person can act on.
 */
export function ParserView({ text, highlights, caption }: ParserViewProps) {
  const clipped = text.length > MAX_RENDERED;
  const body = clipped ? text.slice(0, MAX_RENDERED) : text;
  const pattern = buildPattern(highlights);
  const parts = pattern ? body.split(pattern) : [body];

  return (
    <section className="sheet flex min-h-0 flex-col" aria-labelledby="parser-heading">
      <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id="parser-heading" className="text-sm font-semibold">
          What the parser read
        </h2>
        <span className="text-xs text-muted">{caption}</span>
      </div>

      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-xs leading-relaxed text-muted">
        {parts.map((part, index) =>
          index % 2 === 1 ? (
            <mark key={`${part}-${index}`} className="rounded-[2px] bg-signal/45 px-0.5 text-ink">
              {part}
            </mark>
          ) : (
            <Fragment key={`text-${index}`}>{part}</Fragment>
          )
        )}
        {clipped ? "\n\n[…truncated for display]" : null}
      </pre>
    </section>
  );
}
