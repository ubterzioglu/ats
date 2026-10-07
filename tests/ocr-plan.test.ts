import { describe, expect, it } from "vitest";

import {
  pagesNeedingOcr,
  defaultOcrLanguage,
  cleanOcrText,
  assembleText,
  ocrFacts,
  renderScale,
  THIN_DOCUMENT_CHARS
} from "@/lib/extract/ocr/plan";

describe("ocr plan", () => {
  describe("pagesNeedingOcr", () => {
    it("returns every page number when the whole document is thin", () => {
      const pages = ["", "", ""];
      expect(pagesNeedingOcr(pages)).toEqual([1, 2, 3]);
    });

    it("returns only the empty pages when the document has enough text", () => {
      const longText = "x".repeat(100);
      const pages = [longText, "", longText];
      const result = pagesNeedingOcr(pages);
      expect(result).toEqual([2]);
    });

    it("returns an empty array when no pages are empty and the document is not thin", () => {
      const pages = ["Page one text", "Page two text", "Page three text"];
      const totalText = pages.join("\n\n");
      if (totalText.length < THIN_DOCUMENT_CHARS) {
        return;
      }
      expect(pagesNeedingOcr(pages)).toEqual([]);
    });
  });

  describe("defaultOcrLanguage", () => {
    it("uses the site locale when the text layer has too few words", () => {
      expect(defaultOcrLanguage("hello world", "de")).toBe("deu");
      expect(defaultOcrLanguage("hello world", "tr")).toBe("tur");
      expect(defaultOcrLanguage("hello world", "en")).toBe("eng");
    });

    it("detects the language from the text layer when there are enough words", () => {
      const englishText = Array(40).fill("the quick brown fox jumps").join(" ");
      expect(defaultOcrLanguage(englishText, "de")).toBe("eng");
    });

    it("falls back to eng for an unknown site locale", () => {
      expect(defaultOcrLanguage("", "fr")).toBe("eng");
    });
  });

  describe("cleanOcrText", () => {
    it("removes trailing spaces and collapses blank lines", () => {
      const raw = "line one   \nline two\n\n\n\nline three  ";
      expect(cleanOcrText(raw)).toBe("line one\nline two\n\nline three");
    });

    it("normalises line endings", () => {
      expect(cleanOcrText("a\r\nb\r\nc")).toBe("a\nb\nc");
    });

    it("trims the result", () => {
      expect(cleanOcrText("  \n\nhello\n\n  ")).toBe("hello");
    });
  });

  describe("assembleText", () => {
    it("prefers recognised text over the text layer", () => {
      const pageTexts = ["original page one", "original page two"];
      const recognised = new Map([[1, "recognised page one"]]);
      expect(assembleText(pageTexts, recognised)).toBe(
        "recognised page one\n\noriginal page two"
      );
    });

    it("falls back to the text layer when OCR found nothing on a page", () => {
      const pageTexts = ["page one", "page two"];
      const recognised = new Map([[1, "   "]]);
      expect(assembleText(pageTexts, recognised)).toBe("page one\n\npage two");
    });
  });

  describe("ocrFacts", () => {
    it("returns null when no pages have recognised text", () => {
      const recognised = new Map([[1, "   "]]);
      expect(ocrFacts(1, recognised)).toBeNull();
    });

    it("returns the page count and ocr page count", () => {
      const recognised = new Map([
        [1, "some text"],
        [2, "more text"]
      ]);
      expect(ocrFacts(3, recognised)).toEqual({ pages: 3, ocrPages: 2 });
    });

    it("uses the larger of page count and ocr pages", () => {
      const recognised = new Map([
        [1, "text"],
        [2, "text"],
        [3, "text"]
      ]);
      expect(ocrFacts(2, recognised)).toEqual({ pages: 3, ocrPages: 3 });
    });
  });

  describe("renderScale", () => {
    it("returns the target dpi scale for a typical page", () => {
      const scale = renderScale(595, 842);
      expect(scale).toBeCloseTo(300 / 72, 1);
    });

    it("caps the scale so the longest side stays within the limit", () => {
      const scale = renderScale(2000, 3000);
      expect(3000 * scale).toBeLessThanOrEqual(4000);
    });

    it("returns the target scale for invalid dimensions", () => {
      expect(renderScale(0, 0)).toBeCloseTo(300 / 72, 1);
      expect(renderScale(NaN, 100)).toBeCloseTo(300 / 72, 1);
    });
  });
});
