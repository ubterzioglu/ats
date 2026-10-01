/**
 * Employment periods, read the way a tenure filter reads them.
 *
 * Systems that filter on "minimum N years" build this number from the parsed
 * date ranges, so the candidate's own arithmetic is irrelevant: what counts is
 * what the ranges add up to after overlapping roles are merged. A CV that lists
 * a job and a concurrent freelance engagement has one span of time, not two.
 */

export interface Period {
  /** Months since year 0, so comparisons and differences are plain integers. */
  readonly start: number;
  readonly end: number;
  readonly open: boolean;
  readonly source: string;
}

export interface ExperienceReport {
  readonly months: number;
  readonly periods: readonly Period[];
  /** Ranges whose end precedes their start: a parser cannot use these at all. */
  readonly reversed: readonly string[];
  readonly overlapping: boolean;
}

const PRESENT =
  /^(present|current|now|today|ongoing|heute|aktuell|laufend|jetzt|halen|devam|bugun|bugün)$/i;

const MONTH_NAMES: Readonly<Record<string, number>> = {
  jan: 1, january: 1, januar: 1, ocak: 1,
  feb: 2, february: 2, februar: 2, subat: 2, şubat: 2,
  mar: 3, march: 3, marz: 3, märz: 3, mart: 3,
  apr: 4, april: 4, nisan: 4,
  may: 5, mai: 5, mayis: 5, mayıs: 5,
  jun: 6, june: 6, juni: 6, haziran: 6,
  jul: 7, july: 7, juli: 7, temmuz: 7,
  aug: 8, august: 8, agustos: 8, ağustos: 8,
  sep: 9, sept: 9, september: 9, eylul: 9, eylül: 9,
  oct: 10, october: 10, okt: 10, oktober: 10, ekim: 10,
  nov: 11, november: 11, kasim: 11, kasım: 11,
  dec: 12, december: 12, dez: 12, dezember: 12, aralik: 12, aralık: 12
};

const SEPARATOR = /\s*(?:-|–|—|to|bis|until|als|ile)\s*/i;
const YEAR = /^(19|20)\d{2}$/;

function monthsSinceZero(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/**
 * Reads one end of a range. Returns null rather than guessing: a token this
 * function cannot read is a token the parser could not read either.
 */
function parseEndpoint(raw: string, now: Date): { readonly value: number; readonly open: boolean } | null {
  const token = raw.trim().replace(/[.,;)]+$/, "");
  if (token.length === 0) return null;

  if (PRESENT.test(token)) {
    return { value: monthsSinceZero(now.getFullYear(), now.getMonth() + 1), open: true };
  }

  const numeric = token.match(/^(0?[1-9]|1[0-2])\s*[./-]\s*((?:19|20)\d{2})$/);
  if (numeric) {
    const month = Number(numeric[1]);
    const year = Number(numeric[2]);
    return { value: monthsSinceZero(year, month), open: false };
  }

  const named = token.match(/^([\p{L}]+)\.?\s+((?:19|20)\d{2})$/u);
  if (named) {
    const month = MONTH_NAMES[(named[1] ?? "").toLowerCase()];
    const year = Number(named[2]);
    if (month !== undefined) return { value: monthsSinceZero(year, month), open: false };
  }

  if (YEAR.test(token)) {
    // A bare year is read as January; that is what a parser assuming the
    // earliest possible date does, and it keeps the total conservative.
    return { value: monthsSinceZero(Number(token), 1), open: false };
  }

  return null;
}

/** Pulls every date range out of the document, one line at a time. */
export function extractPeriods(lines: readonly string[], now = new Date()): {
  readonly periods: readonly Period[];
  readonly reversed: readonly string[];
} {
  const periods: Period[] = [];
  const reversed: string[] = [];

  for (const line of lines) {
    const match = line.match(
      /((?:0?[1-9]|1[0-2])\s*[./-]\s*(?:19|20)\d{2}|[\p{L}]+\.?\s+(?:19|20)\d{2}|(?:19|20)\d{2})\s*(?:-|–|—|to|bis|until|als|ile)\s*([\p{L}]+\.?\s+(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])\s*[./-]\s*(?:19|20)\d{2}|(?:19|20)\d{2}|[\p{L}]+)/iu
    );
    if (!match) continue;

    const left = parseEndpoint(match[1] ?? "", now);
    const right = parseEndpoint(match[2] ?? "", now);
    if (!left || !right) continue;

    if (right.value < left.value) {
      reversed.push(line.trim());
      continue;
    }

    periods.push({ start: left.value, end: right.value, open: right.open, source: line.trim() });
  }

  return { periods, reversed };
}

/**
 * Merges periods that overlap or touch, so concurrent roles are counted once.
 * Returns total months across the merged spans.
 */
export function mergePeriods(periods: readonly Period[]): { readonly months: number; readonly overlapping: boolean } {
  if (periods.length === 0) return { months: 0, overlapping: false };

  const sorted = [...periods].sort((a, b) => a.start - b.start);
  let overlapping = false;
  let months = 0;

  const first = sorted[0];
  if (!first) return { months: 0, overlapping: false };

  let spanStart = first.start;
  let spanEnd = first.end;

  for (let index = 1; index < sorted.length; index += 1) {
    const period = sorted[index];
    if (!period) continue;

    if (period.start <= spanEnd) {
      if (period.start < spanEnd) overlapping = true;
      spanEnd = Math.max(spanEnd, period.end);
      continue;
    }

    months += spanEnd - spanStart;
    spanStart = period.start;
    spanEnd = period.end;
  }

  months += spanEnd - spanStart;
  return { months, overlapping };
}

export function buildExperience(lines: readonly string[], now = new Date()): ExperienceReport {
  const { periods, reversed } = extractPeriods(lines, now);
  const { months, overlapping } = mergePeriods(periods);
  return { months, periods, reversed, overlapping };
}

/** "4 years 3 months", in the document's own language. */
export function formatDuration(months: number, language: "en" | "de" | "tr"): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;

  const words = {
    en: { year: years === 1 ? "year" : "years", month: rest === 1 ? "month" : "months" },
    de: { year: years === 1 ? "Jahr" : "Jahre", month: rest === 1 ? "Monat" : "Monate" },
    tr: { year: "yıl", month: "ay" }
  }[language];

  if (years === 0) return `${rest} ${words.month}`;
  if (rest === 0) return `${years} ${words.year}`;
  return `${years} ${words.year} ${rest} ${words.month}`;
}
