import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { BULLET_GLYPHS, ratio } from "./text";
import { GARBLED_THRESHOLD, MOJIBAKE_THRESHOLD } from "./config";

export const PARSEABILITY_MAX = 25;

const PRIVATE_USE = /[-]/g;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

/** Basic Latin letters, Latin-1 Supplement letters and Latin Extended-A. */
const LATIN_LETTER =
  /[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F]/;
const ANY_LETTER = /\p{L}/u;
const MIN_LETTERS_FOR_GARBLED_CHECK = 50;

/**
 * The character pairs UTF-8 produces when its bytes are decoded as CP1252:
 * ş reads as "ÅŸ", İ as "Ä°", ö as "Ã¶", ß as "ÃŸ". None of these pairs
 * occurs in correctly decoded text, so even a few of them mean the Turkish and
 * German letters were destroyed on the way out of the PDF. Built from code
 * points because the pairs are indistinguishable by eye.
 */
const MOJIBAKE_PAIRS: readonly (readonly [number, number])[] = [
  [0x00c5, 0x0178], // ş
  [0x00c5, 0x017e], // Ş
  [0x00c4, 0x0178], // ğ
  [0x00c4, 0x017e], // Ğ
  [0x00c4, 0x00b1], // ı
  [0x00c4, 0x00b0], // İ
  [0x00c3, 0x00b6], // ö
  [0x00c3, 0x2013], // Ö
  [0x00c3, 0x00bc], // ü
  [0x00c3, 0x0153], // Ü
  [0x00c3, 0x00a4], // ä
  [0x00c3, 0x201e], // Ä
  [0x00c3, 0x0178], // ß
  [0x00c3, 0x00a7], // ç
  [0x00c3, 0x2021], // Ç
  [0x00c3, 0x00a2], // â
  [0x00c3, 0x00ae], // î
  [0x00c3, 0x00bb] // û
];

const MOJIBAKE = new RegExp(
  MOJIBAKE_PAIRS.map(([lead, trail]) => String.fromCharCode(lead, trail)).join("|"),
  "g"
);

function garbledLetters(raw: string): { readonly outside: number; readonly letters: number } {
  let letters = 0;
  let outside = 0;
  for (const char of raw) {
    if (!ANY_LETTER.test(char)) continue;
    letters += 1;
    if (!LATIN_LETTER.test(char)) outside += 1;
  }
  return { outside, letters };
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function repeatedLines(lines: readonly string[]): string[] {
  const tally = new Map<string, number>();
  for (const line of lines) {
    if (line.length < 8 || line.length > 90) continue;
    tally.set(line, (tally.get(line) ?? 0) + 1);
  }
  return [...tally.entries()]
    .filter(([, count]) => count >= 3)
    .map(([line]) => line);
}

/**
 * Can a parser read this document at all? Everything here is about the
 * mechanics of text extraction, not about what the CV says.
 */
export function scoreParseability(context: ScoreContext): DimensionOutcome {
  const { raw, lines, tokens, stats } = context;
  const drafts: FindingDraft[] = [];

  if (stats.words < 150) {
    drafts.push({
      id: "parse.too-little-text",
      severity: "critical",
      title: "Almost no machine-readable text",
      detail: `Only ${stats.words} words could be read. A scanned or image-based PDF looks empty to a parser.`,
      fix: "Export the CV from the original document as a text PDF, or paste the text manually.",
      cost: 13
    });
  } else if (stats.words < 260) {
    drafts.push({
      id: "parse.thin-text",
      severity: "high",
      title: "Very little text extracted",
      detail: `${stats.words} words is below what a full CV normally yields. Part of the document may sit in images or text boxes.`,
      fix: "Check that every section is real text, not a picture or a graphic element.",
      cost: 6
    });
  }

  const singleChars = tokens.filter((token) => token.length === 1).length;
  if (tokens.length > 100 && ratio(singleChars, tokens.length) > 0.16) {
    drafts.push({
      id: "parse.letter-spacing",
      severity: "high",
      title: "Letters extracted one by one",
      detail:
        "The text layer breaks words into single characters, usually caused by heavy letter-spacing or an outlined font.",
      fix: "Turn off manual letter-spacing and embed a standard font before exporting.",
      cost: 5
    });
  }

  const columnLines = lines.filter((line) => /\S {3,}\S/.test(line)).length;
  if (lines.length > 20 && ratio(columnLines, lines.length) > 0.18) {
    drafts.push({
      id: "parse.columns",
      severity: "high",
      title: "Multi-column or table layout detected",
      detail:
        "Many lines contain wide gaps, the signature of side-by-side columns or a table. Parsers read those left to right and mix the content up.",
      fix: "Rebuild the CV in a single column with no tables for text content.",
      cost: 5,
      evidence: lines.filter((line) => /\S {3,}\S/.test(line)).slice(0, 3)
    });
  }

  if (countMatches(raw, /\t/g) > 12 || countMatches(raw, /\|/g) > 12) {
    drafts.push({
      id: "parse.table-markers",
      severity: "medium",
      title: "Table structure in the text layer",
      detail: "Tab stops or pipe characters suggest the content is laid out in a table grid.",
      fix: "Move skills and dates out of tables; a plain list parses reliably.",
      cost: 3
    });
  }

  const glyphs = countMatches(raw, BULLET_GLYPHS);
  if (glyphs > 30) {
    drafts.push({
      id: "parse.decorative-bullets",
      severity: "low",
      title: "Decorative bullet glyphs",
      detail: `${glyphs} symbol bullets found. Some parsers drop them and glue lines together.`,
      fix: "Use a plain hyphen or the standard bullet from the word processor.",
      cost: 2
    });
  }

  if (/�/.test(raw) || /\(cid:\d+\)/.test(raw)) {
    drafts.push({
      id: "parse.encoding",
      severity: "critical",
      title: "Broken character encoding",
      detail: "The text layer contains replacement or CID placeholders, so characters are lost on extraction.",
      fix: "Embed the fonts when exporting, or export through a different PDF writer.",
      cost: 7
    });
  }

  const mojibake = countMatches(raw, MOJIBAKE);
  if (mojibake >= MOJIBAKE_THRESHOLD) {
    drafts.push({
      id: "parse.mojibake",
      severity: "high",
      title: "Turkish or German letters were decoded with the wrong code page",
      detail: `${mojibake} mojibake sequences appear in the text layer - the two-character artefacts a UTF-8 document leaves when something reads it as CP1252. Every special letter of a Turkish or German CV is destroyed with it, so names, headings and skills stop matching.`,
      fix: "Re-export the PDF with embedded fonts from the source document, or save the text through an editor that detects UTF-8 before uploading.",
      cost: 5,
      evidence: lines.filter((line) => line.match(MOJIBAKE) !== null).slice(0, 3)
    });
  }

  const garbled = garbledLetters(raw);
  if (
    garbled.letters >= MIN_LETTERS_FOR_GARBLED_CHECK &&
    ratio(garbled.outside, garbled.letters) > GARBLED_THRESHOLD
  ) {
    drafts.push({
      id: "parse.garbled-text",
      severity: "high",
      title: "Most of the text sits outside the Latin character blocks",
      detail: `${Math.round(
        ratio(garbled.outside, garbled.letters) * 100
      )}% of the ${garbled.letters} letters read are outside Basic Latin, Latin-1 Supplement and Latin Extended-A. For a CV written in a European language that points at a broken text layer, such as a font subset mapped onto the wrong code points.`,
      fix: "Re-export the CV with embedded fonts, or rebuild the file from the source document.",
      cost: 6
    });
  }

  const furniture = repeatedLines(lines);
  if (furniture.length > 0) {
    drafts.push({
      id: "parse.page-furniture",
      severity: "low",
      title: "Header or footer repeats on every page",
      detail: "Repeated lines get pulled into the middle of the parsed text and break up sentences.",
      fix: "Keep headers and footers minimal, and never put contact details there.",
      cost: 2,
      evidence: furniture.slice(0, 3)
    });
  }

  if (lines.length < 12 && stats.words > 300) {
    drafts.push({
      id: "parse.no-line-structure",
      severity: "medium",
      title: "No line breaks survived extraction",
      detail: "The whole CV came out as a few long runs of text, so headings and bullets cannot be told apart.",
      fix: "Export from the source document instead of printing to PDF through a viewer.",
      cost: 4
    });
  }

  if (/\s@\s|\s@[a-z]|[a-z]@\s/i.test(raw)) {
    drafts.push({
      id: "parse.split-email",
      severity: "medium",
      title: "Email address broken by spacing",
      detail: "The address is split across characters or lines, so it will not be picked up as contact data.",
      fix: "Write the address on one line as plain text, with no link styling.",
      cost: 3
    });
  }

  const icons = countMatches(raw, PRIVATE_USE) + countMatches(raw, EMOJI);
  if (icons > 6) {
    drafts.push({
      id: "parse.icon-font",
      severity: "medium",
      title: "Icon font or emoji used for information",
      detail: `${icons} icon characters found. Phone and mail icons carry no meaning for a parser.`,
      fix: "Label contact details with words instead of icons.",
      cost: 3
    });
  }

  return buildOutcome("parseability", "Parseability", PARSEABILITY_MAX, drafts, (score) =>
    score >= 22
      ? "The text layer is clean and machine-readable."
      : score >= 16
        ? "Readable, but the layout costs the parser information."
        : "A parser will lose or scramble parts of this document."
  );
}
