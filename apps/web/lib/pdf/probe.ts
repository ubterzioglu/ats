import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { PDF_MONO, PDF_SANS, registerPdfFonts, type PdfFontSources } from "./fonts";
import { renderPdfBytes } from "./render";

/**
 * The probe document. It exists so the closed loop has a witness: write these
 * exact glyphs through the embedded font, read the file back through
 * lib/extract, and every character that went in must come out. If a future
 * font swap or writer change drops ş or ß from the text layer, this fails
 * before a candidate's CV does.
 */

export const PROBE_GLYPHS = "ş ğ ı İ ö ü ç ä ß Ş Ğ I İ Ö Ü Ç Ä";

export const PROBE_WORDS: readonly string[] = [
  "İstanbul",
  "İş Deneyimi",
  "geliştirme",
  "Ağustos",
  "ışık",
  "Şubat",
  "Türkçe",
  "März",
  "Qualitätssicherung",
  "Straße",
  "groß",
  "Ärger",
  "prüfen",
  "München",
  "für",
  "Größe"
];

const PROBE_SENTENCE =
  "Bu sonda belgesi gömülü yazı tipinin Türkçe ve Almanca harfleri metin katmanına bozmadan yazdığını kanıtlar. Prüfer lesen Größe, Straße und Qualität der Zeichen.";

const PAGE_STYLE = { padding: 48, fontFamily: PDF_SANS } as const;
const TITLE_STYLE = { fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: PDF_SANS } as const;
const LINE_STYLE = { fontSize: 11, marginBottom: 4, fontFamily: PDF_SANS } as const;
const MONO_STYLE = { fontSize: 11, marginBottom: 4, fontFamily: PDF_MONO } as const;
const BOX_STYLE = { marginTop: 12, borderTopWidth: 1, borderTopColor: "#000000", paddingTop: 8 } as const;

function probeDocument(): ReactElement {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: PAGE_STYLE },
      createElement(Text, { style: TITLE_STYLE }, "Font probe"),
      createElement(Text, { style: LINE_STYLE }, PROBE_GLYPHS),
      createElement(
        View,
        { style: BOX_STYLE },
        PROBE_WORDS.map((word) => createElement(Text, { key: word, style: LINE_STYLE }, word)),
        createElement(Text, { style: MONO_STYLE }, PROBE_GLYPHS),
        createElement(Text, { style: MONO_STYLE }, PROBE_SENTENCE),
        createElement(Text, { style: LINE_STYLE }, PROBE_SENTENCE)
      )
    )
  );
}

/**
 * Renders the probe and returns the PDF bytes. Font sources are injectable:
 * the browser uses the public/fonts URLs, node-side callers (tests, and later
 * the CI regression that guards the templates) pass filesystem paths.
 */
export async function renderProbePdf(fontSources?: PdfFontSources): Promise<Uint8Array> {
  registerPdfFonts(fontSources);
  return renderPdfBytes(probeDocument());
}
