import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";
import { normalizeDocument, tokenize } from "@/lib/scoring/text";
import { matchKeyTurkish } from "@/lib/scoring/turkish";

import { DE_CV, STRONG_CV, TR_CV, TR_JOB_AD } from "./fixtures";

/**
 * J.4 and review focus 1 for the input side: ş ğ ı İ ö ü ç ä ß must survive
 * extraction into scoring and keyword matching, and a document whose Turkish
 * or German letters were destroyed by a wrong code page must be reported
 * instead of silently scoring as a bad CV.
 */

function toMojibake(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return new TextDecoder("windows-1252").decode(bytes);
}

function idsOf(cv: string): string[] {
  return scoreParseability(buildContext(cv)).findings.map((finding) => finding.id);
}

describe("parse.mojibake", () => {
  it("fires on a Turkish CV decoded through the wrong code page", () => {
    const corrupted = toMojibake(TR_CV);
    expect(corrupted).not.toBe(TR_CV);
    const outcome = scoreParseability(buildContext(corrupted));
    const ids = outcome.findings.map((finding) => finding.id);
    expect(ids).toContain("parse.mojibake");
    const finding = outcome.findings.find((entry) => entry.id === "parse.mojibake");
    expect(finding?.evidence?.length ?? 0).toBeGreaterThan(0);
  });

  it("fires on German umlauts and sharp s decoded through the wrong code page", () => {
    const corrupted = toMojibake(
      "Für die Qualitätssicherung in München: Größe, Straße, Ärger, prüfen.\n" +
        "Erfahrung mit Übergabe der Änderungen an das Überprüfungsteam."
    );
    expect(idsOf(corrupted)).toContain("parse.mojibake");
  });

  it("keeps clean Turkish and German documents unflagged", () => {
    for (const cv of [TR_CV, DE_CV, STRONG_CV]) {
      const ids = idsOf(cv);
      expect(ids).not.toContain("parse.mojibake");
      expect(ids).not.toContain("parse.encoding");
      expect(ids).not.toContain("parse.garbled-text");
    }
  });

  it("ignores a single coincidental sequence", () => {
    const text = `${STRONG_CV}\nOne odd pair: Ã¶ stands alone here.\n`;
    expect(idsOf(text)).not.toContain("parse.mojibake");
  });
});

describe("special characters end to end", () => {
  it("normalization keeps every Turkish and German letter", () => {
    const glyphs = "ş ğ ı İ ö ü ç ä ß Ş Ğ I Ö Ü Ç Ä";
    expect(normalizeDocument(glyphs)).toBe(glyphs);
  });

  it("tokenization keeps dotted-capital words whole", () => {
    expect(tokenize("İş Deneyimi")).toEqual(["iş", "deneyimi"]);
    expect(tokenize("İstanbul'da")).toEqual(["istanbul", "da"]);
    const tokens = tokenize(normalizeDocument(TR_CV));
    expect(tokens.some((token) => token.includes("\u0307"))).toBe(false);
  });

  it("carries the glyphs through the whole analysis", () => {
    const context = buildContext(TR_CV);
    expect(context.lower).toContain("iş deneyimi");
    expect(context.tokenSet).toContain("istanbul");

    const result = analyzeCv({ cvText: TR_CV, jobDescription: TR_JOB_AD });
    const ids = result.findings.map((finding) => finding.id);
    expect(ids).not.toContain("parse.mojibake");
    expect(ids).not.toContain("parse.encoding");
    expect(ids).not.toContain("parse.garbled-text");

    const matchedKeys = result.keywords.matched.map((term) => matchKeyTurkish(term.term));
    expect(matchedKeys).toContain(matchKeyTurkish("mühendis"));
    expect(matchedKeys).toContain(matchKeyTurkish("otomasyon"));
  });
});
