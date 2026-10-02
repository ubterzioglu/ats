import { Font } from "@react-pdf/renderer";

/**
 * The faces the PDF layer writes with. DejaVu, embedded as static files under
 * public/fonts, because one TTF carries every Turkish and German glyph the
 * product promises (ş ğ ı İ ö ü ç ä ß) under a free licence, with no subset or
 * unicode-range machinery between the file and react-pdf. The interface's own
 * faces stay a UI decision; the closed-loop guarantee depends on the writer
 * controlling the text layer completely.
 */

export const PDF_SANS = "Ats Sans";
export const PDF_MONO = "Ats Mono";

export interface PdfFontFace {
  readonly src: string;
  readonly fontWeight: 400 | 700;
}

export interface PdfFontSources {
  readonly sans: readonly PdfFontFace[];
  readonly mono: readonly PdfFontFace[];
}

/** Browser sources: the static files Next serves from public/fonts. */
export const WEB_FONT_SOURCES: PdfFontSources = {
  sans: [
    { src: "/fonts/dejavu-sans.ttf", fontWeight: 400 },
    { src: "/fonts/dejavu-sans-bold.ttf", fontWeight: 700 }
  ],
  mono: [{ src: "/fonts/dejavu-sans-mono.ttf", fontWeight: 400 }]
};

let registeredFor: PdfFontSources | null = null;

/**
 * Registers the families under the product's own names, so no document ever
 * falls back to a base-14 face - those are WinAnsi-encoded and silently drop
 * exactly the glyphs this module exists to protect.
 */
export function registerPdfFonts(sources: PdfFontSources = WEB_FONT_SOURCES): void {
  if (registeredFor === sources) return;
  for (const face of sources.sans) {
    Font.register({ family: PDF_SANS, src: face.src, fontWeight: face.fontWeight });
  }
  for (const face of sources.mono) {
    Font.register({ family: PDF_MONO, src: face.src, fontWeight: face.fontWeight });
  }
  registeredFor = sources;
}
