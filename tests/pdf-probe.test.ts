import { describe, expect, it } from "vitest";

import { extractPdf } from "@/lib/extract/pdf";
import { PROBE_GLYPHS, PROBE_WORDS, renderProbePdf } from "@/lib/pdf/probe";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";

// Side-effect import: installs the globals pdfjs wants before its first
// dynamic load inside extractPdf.
import "./helpers/pdfjs-node";
import { nodeFontSources } from "./helpers/pdf-fonts";

/**
 * E.1 acceptance: the probe document goes out through @react-pdf/renderer and
 * comes back through lib/extract with every promised glyph intact, and the
 * clean output raises no encoding finding. A font embedded with the wrong
 * encoding would fail here instead of silently on a candidate's CV.
 */

const PROMISED_GLYPHS = ["ş", "ğ", "ı", "İ", "ö", "ü", "ç", "ä", "ß", "Ş", "Ğ", "Ö", "Ü", "Ç", "Ä"];

const bytes = await renderProbePdf(nodeFontSources());
const extracted = await extractPdf(new File([bytes], "probe.pdf", { type: "application/pdf" }));

describe("probe PDF", () => {
  it("renders a real PDF", () => {
    expect(bytes.length).toBeGreaterThan(2000);
    const magic = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
    expect(magic).toBe("%PDF");
  });

  it("round-trips every promised glyph through lib/extract", () => {
    for (const glyph of PROMISED_GLYPHS) {
      expect(extracted.text, `glyph ${glyph} missing`).toContain(glyph);
    }
  });

  it("round-trips the Turkish and German probe words", () => {
    for (const word of PROBE_WORDS) {
      expect(extracted.text, `word ${word} missing`).toContain(word);
    }
  });

  it("leaves no replacement characters or split combining marks", () => {
    expect(extracted.text).not.toContain("\uFFFD");
    expect(extracted.text).not.toContain("\u0307");
    expect(extracted.text).toContain(PROBE_GLYPHS);
  });

  it("produces no encoding finding in the Parseability dimension", () => {
    const ids = scoreParseability(buildContext(extracted.text)).findings.map(
      (finding) => finding.id
    );
    expect(ids).not.toContain("parse.mojibake");
    expect(ids).not.toContain("parse.encoding");
    expect(ids).not.toContain("parse.garbled-text");
  });
});
