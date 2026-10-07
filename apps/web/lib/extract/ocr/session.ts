import { assetUrl, type OcrDownloadPlan, type OcrLanguage } from "./assets";
import { cleanOcrText } from "./plan";
import type { OcrEvent } from "./state";

/**
 * One OCR run: download the files, start the engine, read the pages in order.
 * Everything that touches the browser comes in through OcrDeps, so the order
 * of operations and the cancel semantics are tested without one: the engine
 * loader is called only after every file has arrived, and an abort at any
 * point stops the run, terminates the engine and returns nothing.
 */

export interface OcrFiles {
  readonly worker: Uint8Array;
  readonly core: Uint8Array;
  readonly language: Uint8Array;
}

export interface OcrEngine {
  recognise(image: Blob, onProgress: (fraction: number) => void): Promise<string>;
  terminate(): Promise<void>;
}

export interface OcrPageSource {
  render(pageNumber: number): Promise<Blob>;
  close(): Promise<void>;
}

export interface OcrDeps {
  download(url: string, signal: AbortSignal, onBytes: (loaded: number) => void): Promise<Uint8Array>;
  createEngine(files: OcrFiles, language: OcrLanguage): Promise<OcrEngine>;
  openPages(file: Blob): Promise<OcrPageSource>;
}

export interface OcrRequest {
  readonly file: Blob;
  readonly pages: readonly number[];
  readonly language: OcrLanguage;
  readonly plan: OcrDownloadPlan;
}

class OcrAborted extends Error {
  constructor() {
    super("OCR was cancelled.");
    this.name = "AbortError";
  }
}

function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(new OcrAborted());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new OcrAborted());
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (cause: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(cause);
      }
    );
  });
}

async function downloadAll(
  deps: OcrDeps,
  plan: OcrDownloadPlan,
  signal: AbortSignal,
  emit: (event: OcrEvent) => void
): Promise<OcrFiles> {
  const assets = [plan.worker, plan.core, plan.language] as const;
  const loaded = assets.map(() => 0);
  const report = (index: number) => (bytes: number) => {
    loaded[index] = bytes;
    emit({ type: "downloaded", loaded: loaded.reduce((sum, value) => sum + value, 0) });
  };
  const [worker, core, language] = await abortable(
    Promise.all(assets.map((asset, index) => deps.download(assetUrl(asset), signal, report(index)))),
    signal
  );
  if (!worker || !core || !language) throw new Error("An OCR file is missing.");
  return { worker, core, language };
}

/**
 * Returns the recognised text per 1-based page number, or null when the run
 * was cancelled or failed; a failure has already been emitted by then.
 */
export async function runOcr(
  deps: OcrDeps,
  request: OcrRequest,
  signal: AbortSignal,
  onEvent: (event: OcrEvent) => void
): Promise<ReadonlyMap<number, string> | null> {
  const emit = (event: OcrEvent): void => {
    if (!signal.aborted) onEvent(event);
  };
  let stage: "download" | "recognition" = "download";
  let engine: OcrEngine | null = null;
  let source: OcrPageSource | null = null;

  emit({ type: "start", total: request.plan.totalBytes });

  try {
    const files = await downloadAll(deps, request.plan, signal, emit);
    stage = "recognition";

    const pendingEngine = deps.createEngine(files, request.language);
    try {
      engine = await abortable(pendingEngine, signal);
    } catch (cause) {
      // An engine that finishes starting after the abort still owns a worker.
      void pendingEngine.then((late) => late.terminate()).catch(() => undefined);
      throw cause;
    }

    source = await abortable(deps.openPages(request.file), signal);

    const recognised = new Map<number, string>();
    const pages = request.pages.length;
    for (const [index, pageNumber] of request.pages.entries()) {
      const page = index + 1;
      emit({ type: "recognising", page, pages, progress: 0 });
      const image = await abortable(source.render(pageNumber), signal);
      const text = await abortable(
        engine.recognise(image, (progress) => emit({ type: "recognising", page, pages, progress })),
        signal
      );
      recognised.set(pageNumber, text);
    }

    const found = [...recognised.values()].filter((text) => cleanOcrText(text).length > 0).length;
    emit({ type: "finished", pages, found });
    return signal.aborted ? null : recognised;
  } catch {
    if (!signal.aborted) emit({ type: "fail", reason: stage });
    return null;
  } finally {
    await Promise.allSettled([engine?.terminate(), source?.close()]);
  }
}
