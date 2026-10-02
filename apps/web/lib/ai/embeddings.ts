import type { WorkerInbound, WorkerOutbound } from "./protocol";

/**
 * Browser-side handle on the embedding worker. Importing this module does
 * nothing; a worker is created only when startEmbedder is called, which the
 * consent UI does after an explicit user decision. Terminating mid-download
 * is the cancel path.
 */

export interface EmbedProgress {
  readonly file: string;
  readonly progress: number;
  readonly loaded?: number;
  readonly total?: number;
}

export interface Embedder {
  embed(texts: readonly string[]): Promise<number[][]>;
  terminate(): void;
}

/** Quantized multilingual-e5-small; shown to the user before any download. */
export const EMBED_MODEL_SIZE_MB = 118;
export const EMBED_MODEL_LABEL = "multilingual-e5-small (q8)";

interface PendingRequest {
  readonly resolve: (vectors: number[][]) => void;
  readonly reject: (cause: Error) => void;
}

export function startEmbedder(onProgress: (progress: EmbedProgress) => void): Promise<Embedder> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Embeddings run in the browser only."));
  }

  return new Promise<Embedder>((resolve, reject) => {
    const worker = new Worker(new URL("./embed.worker.ts", import.meta.url));
    const pending = new Map<number, PendingRequest>();
    let nextId = 1;
    let settled = false;
    let terminated = false;

    const fail = (message: string): void => {
      worker.terminate();
      terminated = true;
      if (!settled) {
        settled = true;
        reject(new Error(message));
        return;
      }
      for (const request of pending.values()) request.reject(new Error(message));
      pending.clear();
    };

    worker.onmessage = (event: MessageEvent<WorkerOutbound>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress({
          file: message.file,
          progress: message.progress,
          ...(message.loaded !== undefined ? { loaded: message.loaded } : {}),
          ...(message.total !== undefined ? { total: message.total } : {})
        });
        return;
      }
      if (message.type === "ready") {
        if (settled) return;
        settled = true;
        resolve({
          embed(texts: readonly string[]): Promise<number[][]> {
            if (terminated) return Promise.reject(new Error("The embedder was cancelled."));
            const id = nextId;
            nextId += 1;
            return new Promise<number[][]>((resolveEmbed, rejectEmbed) => {
              pending.set(id, {
                resolve: resolveEmbed,
                reject: rejectEmbed
              });
              const inbound: WorkerInbound = { type: "embed", id, texts };
              worker.postMessage(inbound);
            });
          },
          terminate(): void {
            terminated = true;
            worker.terminate();
            for (const request of pending.values()) {
              request.reject(new Error("The embedder was cancelled."));
            }
            pending.clear();
          }
        });
        return;
      }
      if (message.type === "embedded") {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        request.resolve(message.vectors.map((vector) => [...vector]));
        return;
      }
      if (message.type === "error") {
        if (message.id !== undefined) {
          const request = pending.get(message.id);
          if (request) {
            pending.delete(message.id);
            request.reject(new Error(message.message));
            return;
          }
        }
        fail(message.message);
      }
    };

    worker.onerror = () => fail("The embedding worker stopped unexpectedly.");

    const inbound: WorkerInbound = { type: "load" };
    worker.postMessage(inbound);
  });
}
