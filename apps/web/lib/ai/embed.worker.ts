/// <reference lib="webworker" />

import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
  type ProgressCallback
} from "@huggingface/transformers";

import type { WorkerInbound, WorkerOutbound } from "./protocol";

/**
 * The embedding worker. Runs Xenova/multilingual-e5-small (q8, ~118 MB) on
 * WebGPU when available and on WASM otherwise. Weights are fetched only after
 * the page sends "load", which only happens after explicit user consent.
 * CV text never leaves this worker's thread, let alone the browser.
 */

export const EMBED_MODEL_ID = "Xenova/multilingual-e5-small";

interface WorkerScope {
  postMessage(message: WorkerOutbound): void;
  onmessage: ((event: MessageEvent<WorkerInbound>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

env.allowLocalModels = false;

let extractor: FeatureExtractionPipeline | null = null;
let loading: Promise<FeatureExtractionPipeline> | null = null;

function post(message: WorkerOutbound): void {
  ctx.postMessage(message);
}

/**
 * transformers.js types `pipeline` as a union across every task; instantiating
 * it inside a worker blows the compiler's union limit (TS2590). Narrowing the
 * factory to the one task used here keeps the types honest and the compiler
 * alive.
 */
type ExtractionFactory = (
  task: "feature-extraction",
  model: string,
  options: Record<string, unknown>
) => Promise<FeatureExtractionPipeline>;

const createExtractionPipeline = pipeline as unknown as ExtractionFactory;

async function createPipeline(): Promise<FeatureExtractionPipeline> {
  const progress_callback: ProgressCallback = (event) => {
    if (event.status !== "progress") return;
    post({
      type: "progress",
      file: event.file,
      progress: event.progress,
      ...(event.loaded !== undefined ? { loaded: event.loaded } : {}),
      ...(event.total !== undefined ? { total: event.total } : {})
    });
  };

  const options = { dtype: "q8" as const, progress_callback };

  try {
    return await createExtractionPipeline("feature-extraction", EMBED_MODEL_ID, {
      ...options,
      device: "webgpu"
    });
  } catch {
    return createExtractionPipeline("feature-extraction", EMBED_MODEL_ID, options);
  }
}

function ensureLoaded(): Promise<FeatureExtractionPipeline> {
  if (extractor) return Promise.resolve(extractor);
  if (!loading) {
    loading = createPipeline().then((created) => {
      extractor = created;
      return created;
    });
  }
  return loading;
}

ctx.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const message = event.data;

  if (message.type === "load") {
    ensureLoaded()
      .then(() => post({ type: "ready" }))
      .catch((cause: unknown) =>
        post({
          type: "error",
          message: cause instanceof Error ? cause.message : "The model could not be loaded."
        })
      );
    return;
  }

  if (message.type === "embed") {
    ensureLoaded()
      .then(async (loaded) => {
        const output = await loaded(message.texts as string[], {
          pooling: "mean",
          normalize: true
        });
        const tensor = Array.isArray(output) ? output[0] : output;
        const vectors = tensor?.tolist() as readonly (readonly number[])[];
        post({ type: "embedded", id: message.id, vectors });
      })
      .catch((cause: unknown) =>
        post({
          type: "error",
          id: message.id,
          message: cause instanceof Error ? cause.message : "Embedding failed."
        })
      );
  }
};
