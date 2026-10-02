import type { ScoreContext } from "./context";

/**
 * Europass detection.
 *
 * The Europass template is the one layout a European CV parser meets
 * constantly and survives badly: every entry sits in a two-column table with
 * a label cell on the left, so parsers that read across columns weld
 * "Mother tongue(s):" into the answer, and the fixed frame cannot be tightened
 * when it runs long. Detection is by the brand word or by the template's own
 * section labels, which exist in all three supported languages and appear
 * together in almost nothing else.
 */

export interface EuropassReport {
  readonly detected: boolean;
  /** The word "Europass" itself appears in the document. */
  readonly branded: boolean;
  readonly markerCount: number;
  readonly evidence: readonly string[];
}

const BRAND = /\beuropass\b/iu;

/** Section labels the template prints, EN/DE/TR. One hit per pattern. */
const MARKERS: readonly RegExp[] = [
  /mother tongue|muttersprache|ana dil/iu,
  /self[-\s]?assessment|selbsteinsch[äa]tzung|öz\s?değerlendirme|oz\s?degerlendirme/iu,
  /digital skills|digitale kompetenzen|dijital yetkinlik/iu,
  /education and training|ausbildung und weiterbildung|eğitim ve öğrenim|egitim ve ogrenim/iu,
  /personal skills|persönliche fähigkeiten|persoenliche faehigkeiten|kişisel beceriler|kisisel beceriler|mesleki beceriler/iu,
  /driving licence|driving license|führerschein|fuehrerschein|sürücü belgesi|surucu belgesi/iu,
  /personal information|persönliche angaben|kişisel bilgiler|kisisel bilgiler/iu,
  /communication skills|iletişim becerileri|iletisim becerileri/iu,
  /organisational skills|organizational skills|organisatorische fähigkeiten/iu,
  /\bannex(?:es)?\b|\banhänge\b|\bekler\b/iu
];

const MIN_MARKERS = 2;
const MAX_EVIDENCE = 3;

export function detectEuropass(context: ScoreContext): EuropassReport {
  const branded = BRAND.test(context.raw);
  const evidence: string[] = [];
  let markerCount = 0;

  for (const pattern of MARKERS) {
    const line = context.lines.find((candidate) => pattern.test(candidate));
    if (line === undefined) continue;
    markerCount += 1;
    if (evidence.length < MAX_EVIDENCE) evidence.push(line);
  }

  return {
    detected: branded || markerCount >= MIN_MARKERS,
    branded,
    markerCount,
    evidence
  };
}
