/**
 * Parses the trilingual research article (one `## N.` section per post, with a
 * Türkçe / Deutsch / English block each) into per-locale post drafts. Pure: the
 * import script owns the file and database access.
 */

export type ArticleLocale = "tr" | "de" | "en";

export interface LocaleDraft {
  readonly title: string;
  readonly description: string;
  readonly body: string;
}

export interface ArticleSection {
  readonly number: number;
  readonly tr: LocaleDraft;
  readonly de: LocaleDraft;
  readonly en: LocaleDraft;
}

// The source only carries Turkish and English titles; German ones live here.
const DE_TITLES: Readonly<Record<number, string>> = {
  1: "ATS sieht kein Design: Anatomie der tatsächlichen Textausgabe",
  2: "Das Zwei-Spalten-Chaos: Die algorithmische Kollision der Zeilen",
  3: "Icon-Schriften und die Falle des „Telefonsymbols“",
  4: "Kreative Überschriften: Der Triumph der Standardisierung",
  5: "PDF oder DOCX? Die Formatkriege der verlorenen Informationen",
  6: "Schlüsselwörter aus der Stellenanzeige extrahieren: Kontextuelles Matching",
  7: "100 Punkte bedeuten keine Einstellung: Die Schwelle der menschlichen Lesbarkeit",
  8: "In Zahlen sprechen: Wirkung statt Aufgaben",
  9: "Türkische Sonderzeichen und Kodierungsfehler",
  10: "Die 5-Minuten-Checkliste für einen ATS-freundlichen Lebenslauf",
};

const DESCRIPTION_MAX = 200;

function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|:])/g, "$1");
}

function stripBold(text: string): string {
  return unescapeMarkdown(text.replace(/\*\*/g, "")).trim();
}

/**
 * Footnote numbers were exported as plain digits glued to the preceding word
 * ("kanıtlamaktadır1."). Turn them into `[^n]` markers the renderer shows as
 * superscripts. A digit run that follows a hex code point (U+FB01) is data.
 */
export function markCitations(text: string): string {
  return text.replace(
    /(?<=[\p{L})"”*])(\d{1,2})(?=[.,;:!?\s]|$)/gu,
    (match, digits: string, offset: number) => {
      const before = text.slice(Math.max(0, offset - 6), offset);
      if (/U\+[0-9A-F]*$/i.test(before)) return match;
      return `[^${digits}]`;
    },
  );
}

export function makeDescription(body: string): string {
  const plain = body
    .replace(/\[\^\d+\]/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

  if (plain.length <= DESCRIPTION_MAX) return plain;

  const cut = plain.slice(0, DESCRIPTION_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > DESCRIPTION_MAX / 2 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?]+$/, "")}…`;
}

function splitTitles(heading: string): { tr: string; en: string } {
  const cleaned = stripBold(heading.replace(/^##\s+/, "")).replace(/^\d+\.\s*/, "");
  const paren = cleaned.match(/\(([^)]+)\)\s*$/);
  if (!paren) return { tr: cleaned, en: cleaned };
  return {
    tr: cleaned.replace(/\s*\([^)]+\)\s*$/, "").trim(),
    en: (paren[1] ?? cleaned).trim(),
  };
}

function toParagraphs(lines: readonly string[]): string {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("|"))
    .map((l) => markCitations(unescapeMarkdown(l)))
    .join("\n\n");
}

function extractTable(lines: readonly string[]): string {
  return lines
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => unescapeMarkdown(l.trim()))
    .join("\n");
}

function findHeading(lines: readonly string[], pattern: RegExp): number {
  return lines.findIndex((l) => pattern.test(l.trim()));
}

function buildDraft(title: string, body: string): LocaleDraft {
  return { title, body, description: makeDescription(body) };
}

export function parseArticleSource(markdown: string): readonly ArticleSection[] {
  const lines = markdown.split("\n");
  const sectionStarts: number[] = [];
  lines.forEach((line, i) => {
    if (/^##\s+\**\d+\\?\./.test(line)) sectionStarts.push(i);
  });

  const worksCited = lines.findIndex((l) => /^####\s+\*\*Works cited/i.test(l));
  const sections: ArticleSection[] = [];

  sectionStarts.forEach((start, idx) => {
    const next = sectionStarts[idx + 1];
    const end = next ?? (worksCited > -1 ? worksCited : lines.length);
    const heading = lines[start] ?? "";
    const number = Number(heading.match(/^##\s+\**(\d+)/)?.[1]);
    const block = lines.slice(start + 1, end);

    const trAt = findHeading(block, /^###\s+\**Türkçe/i);
    const deAt = findHeading(block, /^###\s+\**Deutsch/i);
    const enAt = findHeading(block, /^###\s+\**English/i);
    if (!Number.isFinite(number) || trAt < 0 || deAt < 0 || enAt < 0) return;

    const titles = splitTitles(heading);
    const trLines = block.slice(trAt + 1, deAt);
    const deLines = block.slice(deAt + 1, enAt);
    const enLines = block.slice(enAt + 1);

    // The comparison table is written in English only; it stays with the
    // English post instead of putting English cells into the other two.
    const table = extractTable(enLines);
    const enText = toParagraphs(enLines);
    const enBody = table ? `${enText}\n\n${table}` : enText;

    sections.push({
      number,
      tr: buildDraft(titles.tr, toParagraphs(trLines)),
      de: buildDraft(DE_TITLES[number] ?? titles.en, toParagraphs(deLines)),
      en: buildDraft(titles.en, enBody),
    });
  });

  return sections;
}
