import { detectLanguage } from "@/lib/scoring/language";
import type { ExtractionFacts } from "@/types/analysis";

import type { OcrLanguage } from "./assets";

/**
 * Below this many characters across the whole PDF the text layer is treated
 * as missing, the same line lib/extract/pdf.ts draws for its "hardly any text
 * layer" warning.
 */
export const THIN_DOCUMENT_CHARS = 200;

/** Fewer words than this and stopword detection says more about chance than language. */
const MIN_WORDS_FOR_DETECTION = 30;

/** Tesseract reads best near 300 DPI; PDF user space has 72 units per inch. */
const TARGET_DPI = 300;
const PDF_UNITS_PER_INCH = 72;
/** Keeps a canvas inside every browser's limits; A4 at 300 DPI is 2480 x 3508. */
const MAX_RENDER_SIDE = 4000;

const LOCALE_LANGUAGE: Readonly<Record<string, OcrLanguage>> = {
  en: "eng",
  de: "deu",
  tr: "tur"
};

/**
 * 1-based numbers of the pages OCR should read. A page with no text layer at
 * all always qualifies. When the whole document carries hardly any text, every
 * page does: a scan with a stray line of invisible text is still a scan.
 */
export function pagesNeedingOcr(pageTexts: readonly string[]): number[] {
  const total = pageTexts.join("\n\n").trim().length;
  const thin = total < THIN_DOCUMENT_CHARS;
  return pageTexts.flatMap((text, index) => (thin || text.trim().length === 0 ? [index + 1] : []));
}

/**
 * The document's own language when the readable pages say enough to tell,
 * otherwise the language the site is shown in.
 */
export function defaultOcrLanguage(textLayer: string, siteLocale: string): OcrLanguage {
  const words = textLayer.split(/\s+/u).filter((word) => word.length > 0).length;
  if (words >= MIN_WORDS_FOR_DETECTION) {
    return LOCALE_LANGUAGE[detectLanguage(textLayer)] ?? "eng";
  }
  return LOCALE_LANGUAGE[siteLocale] ?? "eng";
}

/** Tesseract output with trailing spaces and runs of blank lines removed. */
export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/u, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The document text in page order: recognised text where OCR found some, the
 * text layer everywhere else. Joined the way lib/extract/pdf.ts joins pages.
 */
export function assembleText(
  pageTexts: readonly string[],
  recognised: ReadonlyMap<number, string>
): string {
  return pageTexts
    .map((layer, index) => {
      const ocr = cleanOcrText(recognised.get(index + 1) ?? "");
      return ocr.length > 0 ? ocr : layer;
    })
    .join("\n\n")
    .trim();
}

/**
 * What the engine is told about the file. Only pages where OCR found text
 * count: a page that is blank to OCR as well tells the reader nothing new.
 */
export function ocrFacts(
  pageCount: number,
  recognised: ReadonlyMap<number, string>
): ExtractionFacts | null {
  const ocrPages = [...recognised.values()].filter((text) => cleanOcrText(text).length > 0).length;
  if (ocrPages === 0) return null;
  return { pages: Math.max(pageCount, ocrPages), ocrPages };
}

/** Scale for pdfjs so the longer side lands near 300 DPI without an oversized canvas. */
export function renderScale(widthPt: number, heightPt: number): number {
  const scale = TARGET_DPI / PDF_UNITS_PER_INCH;
  const longest = Math.max(widthPt, heightPt);
  if (!Number.isFinite(longest) || longest <= 0) return scale;
  return longest * scale > MAX_RENDER_SIDE ? MAX_RENDER_SIDE / longest : scale;
}
