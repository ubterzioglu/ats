import { describe, expect, it } from "vitest";

import {
  formatMegabytes,
  OCR_LANGUAGE_DATA,
  OCR_WORKER,
  OCR_CORES,
  planDownload,
  selectCoreVariant,
  assetUrl
} from "@/lib/extract/ocr/assets";

describe("ocr assets", () => {
  it("selects the relaxed-simd core when the browser supports it", () => {
    expect(selectCoreVariant({ simd: true, relaxedSimd: true })).toBe("relaxedsimd-lstm");
  });

  it("falls back to the simd core when relaxed-simd is unavailable", () => {
    expect(selectCoreVariant({ simd: true, relaxedSimd: false })).toBe("simd-lstm");
  });

  it("falls back to the plain lstm core when neither simd variant is available", () => {
    expect(selectCoreVariant({ simd: false, relaxedSimd: false })).toBe("lstm");
  });

  it("plans a download with the worker, core and language data bytes summed", () => {
    const plan = planDownload("eng", "simd-lstm");
    expect(plan.worker).toBe(OCR_WORKER);
    expect(plan.core).toBe(OCR_CORES["simd-lstm"]);
    expect(plan.language).toBe(OCR_LANGUAGE_DATA.eng);
    expect(plan.totalBytes).toBe(
      OCR_WORKER.bytes + OCR_CORES["simd-lstm"].bytes + OCR_LANGUAGE_DATA.eng.bytes
    );
  });

  it("builds the asset url from the base and the file name", () => {
    expect(assetUrl(OCR_WORKER)).toBe(`/vendor/tesseract/${OCR_WORKER.file}`);
  });

  it("formats bytes as decimal megabytes with one decimal", () => {
    expect(formatMegabytes(1_500_000)).toBe("1.5");
    expect(formatMegabytes(0)).toBe("0.0");
    expect(formatMegabytes(-100)).toBe("0.0");
  });
});
