/**
 * ResumePreview.tsx
 *
 * Renders resume sections as a formatted document — not raw text.
 *
 * Each line inside a section is classified as one of:
 *   bullet     → rendered as a list item with a marker
 *   date-range → grey italic metadata line (e.g. "Jan 2021 – Present")
 *   sub-heading→ bold line (job title, company, degree, etc.)
 *   paragraph  → normal body text
 *
 * The `highlightKeywords` prop underlines matching terms in gold so the
 * Comparison view can show which JD keywords appear in the optimised copy.
 */

import type { ResumeSection, OptimizedSection } from '../../types';

// ─── Line classifier ──────────────────────────────────────────────────────────

type LineKind = 'bullet' | 'date' | 'sub-heading' | 'paragraph' | 'empty';

const BULLET_RE    = /^[\s•\-–—*►▪◦✓→]+/;
const DATE_RE      = /(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}|\b\d{4}\b)/i;
const DATE_RANGE_RE= /(\d{4}|present|current|now)\s*([-–—/]|to)\s*(\d{4}|present|current|now)/i;

function classifyLine(line: string, bullets: string[]): LineKind {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';

  // Explicit bullet marker character at the start
  if (BULLET_RE.test(trimmed)) return 'bullet';

  // Content already extracted as a bullet
  const clean = trimmed.replace(BULLET_RE, '').trim();
  if (bullets.some((b) => b.trim() === clean || b.trim() === trimmed)) return 'bullet';

  // Date range on its own line
  if (DATE_RANGE_RE.test(trimmed) && trimmed.length < 50) return 'date';

  // Short line that reads like a sub-heading:
  //   • ≤ 80 chars, doesn't end with a sentence-ending period/comma
  //   • Contains at least one uppercase letter
  //   • Not a plain sentence (no internal verb clues)
  if (
    trimmed.length <= 80 &&
    !/[,;]$/.test(trimmed) &&
    !/\.$/.test(trimmed) &&
    /[A-Z]/.test(trimmed) &&
    !DATE_RE.test(trimmed)
  ) {
    return 'sub-heading';
  }

  return 'paragraph';
}

// ─── Keyword highlighter ──────────────────────────────────────────────────────

function HighlightedLine({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords.length) return <>{text}</>;

  const escaped = keywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  const re     = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts  = text.split(re);

  return (
    <>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function SectionBlock({
  section,
  highlightKeywords = [],
  content,
}: {
  section: ResumeSection | OptimizedSection;
  highlightKeywords?: string[];
  content: string;
}) {
  const lines = content.split('\n');

  // Group consecutive bullets into <ul> blocks
  type Block =
    | { kind: 'ul'; items: string[] }
    | { kind: Exclude<LineKind, 'bullet' | 'empty'>; text: string };

  const blocks: Block[] = [];

  for (const raw of lines) {
    const kind = classifyLine(raw, section.bullets);
    const text = raw.trim().replace(BULLET_RE, '').trim();

    if (kind === 'empty') continue;

    if (kind === 'bullet') {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ul') {
        last.items.push(text);
      } else {
        blocks.push({ kind: 'ul', items: [text] });
      }
    } else {
      blocks.push({ kind, text });
    }
  }

  return (
    <div className="mb-5 last:mb-0">
      {/* Section heading */}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-800 border-b border-gray-800 pb-0.5 mb-2">
        {section.title}
      </h2>

      {blocks.map((block, i) => {
        if (block.kind === 'ul') {
          return (
            <ul key={i} className="mb-1.5 space-y-0.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-[12px] leading-[1.55] text-gray-700">
                  <span className="mt-[4px] shrink-0 w-[5px] h-[5px] rounded-full bg-gray-500 inline-block" />
                  <span>
                    <HighlightedLine text={item} keywords={highlightKeywords} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === 'date') {
          return (
            <p key={i} className="text-[11px] text-gray-400 italic mb-0.5">
              {block.text}
            </p>
          );
        }
        if (block.kind === 'sub-heading') {
          return (
            <p key={i} className="text-[12px] font-semibold text-gray-800 leading-snug mb-0.5">
              <HighlightedLine text={block.text} keywords={highlightKeywords} />
            </p>
          );
        }
        return (
          <p key={i} className="text-[12px] leading-[1.55] text-gray-700 mb-1">
            <HighlightedLine text={block.text} keywords={highlightKeywords} />
          </p>
        );
      })}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ResumePreviewProps {
  /** Sections to render — accepts both ResumeSection and OptimizedSection */
  sections: Array<ResumeSection | OptimizedSection>;
  /** Override content per section id (used in the editor's preview) */
  contentOverrides?: Record<string, string>;
  /** Keywords to highlight in gold */
  highlightKeywords?: string[];
  className?: string;
}

export function ResumePreview({
  sections,
  contentOverrides = {},
  highlightKeywords = [],
  className = '',
}: ResumePreviewProps) {
  return (
    /* A4-ish paper appearance */
    <div
      className={`bg-white rounded-lg shadow-md ring-1 ring-gray-200 px-8 py-7 font-sans overflow-y-auto ${className}`}
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {sections.length === 0 && (
        <p className="text-xs text-gray-300 text-center py-8">No sections detected</p>
      )}
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          content={contentOverrides[section.id] ?? section.content}
          highlightKeywords={highlightKeywords}
        />
      ))}
    </div>
  );
}
