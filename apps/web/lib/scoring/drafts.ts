/**
 * Deterministic rewrite drafts. A small set of sentence shapes always mean
 * the same thing on a CV and always have the same better shape. These are
 * mechanical rewrites, never inventions: the tool keeps the candidate's own
 * object ("X") and marks every claim they still have to substantiate with
 * [quantify: ...]. Suggesting skills the CV does not contain is forbidden -
 * a draft may rephrase, never fabricate.
 */

export interface FixDraft {
  /** Index into the raw text's lines, so applying is a line swap. */
  readonly lineIndex: number;
  readonly original: string;
  readonly replacement: string;
  readonly rule: string;
}

interface Rule {
  readonly id: string;
  readonly pattern: RegExp;
  readonly rewrite: (object: string) => string;
}

const LEAD = /^(\s*(?:[-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+|\s*)/;

const RULES: readonly Rule[] = [
  {
    id: "responsible-for",
    pattern: /\b(?:responsible for|verantwortlich für|verantwortlich fur)\s+(.+)$/i,
    rewrite: (object) => `Led ${object}, resulting in [quantify: what improved, by how much]`
  },
  {
    id: "worked-on",
    pattern: /\bworked on\s+(.+)$/i,
    rewrite: (object) => `Delivered ${object} [quantify: scope and outcome]`
  },
  {
    id: "helped-with",
    pattern: /\b(?:helped with|assisted with|helped to|assisted in|unterstützung bei|unterstutzung bei|destek verdim)\s+(.+)$/i,
    rewrite: (object) => `Contributed to ${object} [quantify: your part and the result]`
  },
  {
    id: "duties-included",
    pattern: /\b(?:duties included|tasks included|aufgaben umfassten|görevlerim arasında)\s+(.+)$/i,
    rewrite: (object) => `Owned ${object} [quantify: scale and result]`
  }
];

/** Appends the quantify marker after a trailing period rather than inside it. */
function punctuate(object: string, template: (object: string) => string): string {
  const trailing = object.match(/[.!?]+$/)?.[0] ?? "";
  const core = object.slice(0, object.length - trailing.length);
  const rewritten = template(core.trim());
  return trailing ? `${rewritten.replace(/]$/, `]${trailing}`)}` : rewritten;
}

export function draftFixes(cvText: string): FixDraft[] {
  const drafts: FixDraft[] = [];
  const lines = cvText.split("\n");

  lines.forEach((line, lineIndex) => {
    const lead = line.match(LEAD)?.[0] ?? "";
    const content = line.slice(lead.length).trim();
    if (content.length === 0) return;

    for (const rule of RULES) {
      const match = content.match(rule.pattern);
      if (!match) continue;
      const object = match[1] ?? "";
      if (object.trim().length === 0) continue;
      drafts.push({
        lineIndex,
        original: line,
        replacement: `${lead}${punctuate(object, rule.rewrite)}`,
        rule: rule.id
      });
      break;
    }
  });

  return drafts;
}

/** Swaps exactly one line. Refuses when the text moved since the draft was made. */
export function applyFixDraft(cvText: string, draft: FixDraft): string | null {
  const lines = cvText.split("\n");
  if (lines[draft.lineIndex] !== draft.original) return null;
  lines[draft.lineIndex] = draft.replacement;
  return lines.join("\n");
}
