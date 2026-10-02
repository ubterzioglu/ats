import type { ChatMessage, JsonSchema, TextModel } from "./types";

/**
 * WebLLM provider manager. Picks a Qwen instruct model by device memory,
 * loads it in a Web Worker behind explicit consent, and quietly degrades:
 * a lost GPU device surfaces as a normal generation error and the tier bar
 * falls back to whatever else the machine offers.
 */

export interface ModelChoice {
  readonly id: string;
  readonly label: string;
  readonly sizeMb: number;
}

const SMALL: ModelChoice = {
  id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
  label: "Qwen 1.5B",
  sizeMb: 1000
};
const DEFAULT: ModelChoice = {
  id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
  label: "Qwen 3B",
  sizeMb: 1900
};
const LARGE: ModelChoice = {
  id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
  label: "Qwen 7B",
  sizeMb: 4400
};

/**
 * The registry has no Qwen3.5-2B; the Qwen2.5 instruct line is what WebLLM
 * actually ships at these sizes. Weak devices get the 1.5B, machines with
 * 8 GB or more of exposed memory get the 7B, everyone else the 3B.
 */
export function pickModel(): ModelChoice {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 4) return SMALL;
  if (memory !== undefined && memory >= 8) return LARGE;
  return DEFAULT;
}

export interface WebLlmProgress {
  readonly progress: number;
  readonly text: string;
}

export interface WebLlmModel extends TextModel {
  terminate(): void;
}

interface PendingRequest {
  readonly resolve: (text: string) => void;
  readonly reject: (cause: Error) => void;
}

export function startWebLlm(
  onProgress: (progress: WebLlmProgress) => void
): Promise<WebLlmModel> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("WebLLM runs in the browser only."));
  }

  const choice = pickModel();

  return new Promise<WebLlmModel>((resolve, reject) => {
    const worker = new Worker(new URL("../llm.worker.ts", import.meta.url));
    const pending = new Map<number, PendingRequest>();
    let nextId = 1;
    let settled = false;
    let terminated = false;

    const fail = (message: string): void => {
      const error = new Error(message);
      if (!settled) {
        settled = true;
        worker.terminate();
        terminated = true;
        reject(error);
        return;
      }
      for (const request of pending.values()) request.reject(error);
      pending.clear();
    };

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as
        | { type: "progress"; progress: number; text: string }
        | { type: "ready" }
        | { type: "generated"; id: number; text: string }
        | { type: "error"; message: string; id?: number };

      if (message.type === "progress") {
        onProgress({ progress: message.progress, text: message.text });
        return;
      }
      if (message.type === "ready") {
        if (settled) return;
        settled = true;
        resolve({
          id: "webllm",
          label: `${choice.label} (local, WebGPU)`,
          terminate(): void {
            terminated = true;
            worker.terminate();
            for (const request of pending.values()) {
              request.reject(new Error("The local model was stopped."));
            }
            pending.clear();
          },
          async generateJson<T>(
            schema: JsonSchema,
            messages: readonly ChatMessage[],
            signal?: AbortSignal
          ): Promise<T> {
            if (terminated) throw new Error("The local model was stopped.");
            const id = nextId;
            nextId += 1;
            const text = await new Promise<string>((resolveText, rejectText) => {
              const onAbort = (): void => {
                pending.delete(id);
                rejectText(new Error("Generation was cancelled."));
              };
              pending.set(id, {
                resolve: resolveText,
                reject: rejectText
              });
              signal?.addEventListener("abort", onAbort, { once: true });
              worker.postMessage({ type: "generate", id, messages, schema });
            });
            try {
              return JSON.parse(text) as T;
            } catch {
              throw new Error("The local model returned something that is not JSON.");
            }
          }
        });
        return;
      }
      if (message.type === "generated") {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        request.resolve(message.text);
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

    worker.onerror = () => fail("The model worker stopped unexpectedly.");
    worker.postMessage({ type: "load", modelId: choice.id });
  });
}
