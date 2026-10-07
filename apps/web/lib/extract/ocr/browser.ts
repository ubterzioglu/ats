import { relaxedSimd, simd } from "wasm-feature-detect";

import { WORKER_SRC as PDF_WORKER_SRC } from "../pdf";
import { OCR_ASSET_BASE, type OcrLanguage, type WasmFeatures } from "./assets";
import { renderScale } from "./plan";
import type { OcrDeps, OcrEngine, OcrFiles, OcrPageSource } from "./session";

/**
 * The browser side of an OCR run. Importing this module loads nothing:
 * tesseract.js is reached only through the dynamic import in createEngine,
 * which runOcr calls after the user has agreed and every file has arrived.
 * All three files come from this site (public/vendor/tesseract); none of the
 * tesseract.js CDN defaults is ever used.
 */

export function ocrSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof WebAssembly === "object" &&
    typeof ReadableStream !== "undefined"
  );
}

/** Feature probes compile a few bytes of WebAssembly locally; nothing is fetched. */
export async function detectWasmFeatures(): Promise<WasmFeatures> {
  const [hasSimd, hasRelaxedSimd] = await Promise.all([simd(), relaxedSimd()]);
  return { simd: hasSimd, relaxedSimd: hasRelaxedSimd };
}

async function download(
  url: string,
  signal: AbortSignal,
  onBytes: (loaded: number) => void
): Promise<Uint8Array> {
  const response = await fetch(url, { signal, credentials: "same-origin" });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${url} (${response.status}).`);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onBytes(loaded);
  }

  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function absolute(path: string): string {
  return new URL(path, window.location.origin).href;
}

async function createEngine(files: OcrFiles, language: OcrLanguage): Promise<OcrEngine> {
  const tesseract = await import("tesseract.js");

  // The core and the tesseract.js worker run as one script: the core defines
  // TesseractCore first, so the worker never fetches a core of its own.
  const workerUrl = URL.createObjectURL(
    new Blob([files.core as BlobPart, "\n;\n", files.worker as BlobPart], {
      type: "text/javascript"
    })
  );
  let onProgress: ((fraction: number) => void) | null = null;

  try {
    const worker = await tesseract.createWorker(
      [{ code: language, data: files.language }],
      tesseract.OEM.LSTM_ONLY,
      {
        workerPath: workerUrl,
        workerBlobURL: false,
        // Never consulted while the core and language data arrive in memory;
        // set so that no code path can fall back to the CDN defaults.
        corePath: absolute(`${OCR_ASSET_BASE}/`),
        langPath: absolute(OCR_ASSET_BASE),
        // Language data stays in memory; nothing is written to IndexedDB.
        cacheMethod: "none",
        logger: (message) => {
          if (message.status === "recognizing text") onProgress?.(message.progress);
        },
        // Without a handler tesseract.js rethrows on the message thread; the
        // rejected job already carries the error.
        errorHandler: () => undefined
      }
    );

    return {
      async recognise(image, progress) {
        onProgress = progress;
        try {
          const { data } = await worker.recognize(image);
          return data.text;
        } finally {
          onProgress = null;
        }
      },
      async terminate() {
        await worker.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  } catch (cause) {
    URL.revokeObjectURL(workerUrl);
    throw cause;
  }
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The page could not be rasterised."));
    }, "image/png");
  });
}

async function openPages(file: Blob): Promise<OcrPageSource> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;

  return {
    async render(pageNumber) {
      const page = await pdf.getPage(pageNumber);
      try {
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: renderScale(base.width, base.height) });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        // pdfjs paints a white page background before the content by default.
        await page.render({ canvas, viewport }).promise;
        const image = await canvasToPng(canvas);
        canvas.width = 0;
        canvas.height = 0;
        return image;
      } finally {
        page.cleanup();
      }
    },
    close: () => loadingTask.destroy()
  };
}

export const browserOcrDeps: OcrDeps = { download, createEngine, openPages };
