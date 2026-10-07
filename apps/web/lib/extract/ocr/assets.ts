/**
 * The OCR files this site serves itself. scripts/copy-ocr-assets.mjs copies
 * them out of node_modules into public/vendor/tesseract, so the browser never
 * reaches a CDN. The byte counts are what the consent panel shows before
 * anything downloads; tests/ocr-assets.test.ts holds them to the installed
 * packages, so a dependency bump that changes a file fails there first.
 */

export type OcrLanguage = "eng" | "deu" | "tur";

export const OCR_LANGUAGES: readonly OcrLanguage[] = ["eng", "deu", "tur"];

export const OCR_ASSET_BASE = "/vendor/tesseract";

/**
 * The LSTM-only builds of tesseract.js-core. The worker runs the LSTM engine
 * alone (OEM 1), which is what the 4.0.0_best_int language data is made for.
 */
export type CoreVariant = "relaxedsimd-lstm" | "simd-lstm" | "lstm";

export interface OcrAsset {
  readonly file: string;
  readonly bytes: number;
}

export const OCR_WORKER: OcrAsset = { file: "worker.min.js", bytes: 111_307 };

export const OCR_CORES: Readonly<Record<CoreVariant, OcrAsset>> = {
  "relaxedsimd-lstm": { file: "tesseract-core-relaxedsimd-lstm.wasm.js", bytes: 3_905_767 },
  "simd-lstm": { file: "tesseract-core-simd-lstm.wasm.js", bytes: 3_899_472 },
  lstm: { file: "tesseract-core-lstm.wasm.js", bytes: 3_896_484 }
};

export const OCR_LANGUAGE_DATA: Readonly<Record<OcrLanguage, OcrAsset>> = {
  eng: { file: "eng.traineddata.gz", bytes: 2_952_873 },
  deu: { file: "deu.traineddata.gz", bytes: 1_333_102 },
  tur: { file: "tur.traineddata.gz", bytes: 2_141_291 }
};

export interface WasmFeatures {
  readonly simd: boolean;
  readonly relaxedSimd: boolean;
}

/** The same choice tesseract.js makes inside its worker for an LSTM-only engine. */
export function selectCoreVariant(features: WasmFeatures): CoreVariant {
  if (features.relaxedSimd) return "relaxedsimd-lstm";
  if (features.simd) return "simd-lstm";
  return "lstm";
}

export interface OcrDownloadPlan {
  readonly worker: OcrAsset;
  readonly core: OcrAsset;
  readonly language: OcrAsset;
  readonly totalBytes: number;
}

export function planDownload(language: OcrLanguage, variant: CoreVariant): OcrDownloadPlan {
  const worker = OCR_WORKER;
  const core = OCR_CORES[variant];
  const data = OCR_LANGUAGE_DATA[language];
  return {
    worker,
    core,
    language: data,
    totalBytes: worker.bytes + core.bytes + data.bytes
  };
}

export function assetUrl(asset: OcrAsset): string {
  return `${OCR_ASSET_BASE}/${asset.file}`;
}

/** One decimal, in the decimal megabytes the rest of the interface uses. */
export function formatMegabytes(bytes: number): string {
  return (Math.max(0, bytes) / 1_000_000).toFixed(1);
}
