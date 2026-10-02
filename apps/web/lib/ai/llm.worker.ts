/// <reference lib="webworker" />

import { CreateMLCEngine, type MLCEngineInterface } from "@mlc-ai/web-llm";

import type { ChatMessage } from "./providers/types";

/**
 * The WebLLM worker. Loads a Qwen instruct model onto the GPU (q4f16) and
 * answers constrained-JSON chat requests. Everything stays on the device;
 * the only network traffic is the one-time weight download the consent UI
 * already announced.
 */

interface WorkerScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

type Inbound =
  | { type: "load"; modelId: string }
  | {
      type: "generate";
      id: number;
      messages: readonly ChatMessage[];
      schema: unknown;
    };

const ctx = self as unknown as WorkerScope;

let engine: MLCEngineInterface | null = null;
let loading: Promise<MLCEngineInterface> | null = null;
let loadedModelId: string | null = null;

function post(message: unknown): void {
  ctx.postMessage(message);
}

function ensureLoaded(modelId: string): Promise<MLCEngineInterface> {
  if (engine && loadedModelId === modelId) return Promise.resolve(engine);
  if (!loading || loadedModelId !== modelId) {
    loading = CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        post({
          type: "progress",
          progress: Math.round((progress.progress ?? 0) * 100),
          text: progress.text ?? ""
        });
      }
    }).then((created) => {
      engine = created;
      loadedModelId = modelId;
      return created;
    });
  }
  return loading;
}

ctx.onmessage = (event: MessageEvent<Inbound>) => {
  const message = event.data;

  if (message.type === "load") {
    ensureLoaded(message.modelId)
      .then(() => post({ type: "ready" }))
      .catch((cause: unknown) =>
        post({
          type: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "The local model could not be loaded. If the GPU was lost, another tier can take over."
        })
      );
    return;
  }

  if (message.type === "generate") {
    ensureLoaded(currentModel())
      .then(async (loaded) => {
        const completion = await loaded.chat.completions.create({
          messages: message.messages.map((entry) => ({
            role: entry.role,
            content: entry.content
          })),
          temperature: 0,
          // web-llm constrains decoding from a stringified schema carried
          // alongside json_object; there is no json_schema response type here.
          response_format: {
            type: "json_object",
            schema: JSON.stringify(message.schema)
          }
        });
        post({
          type: "generated",
          id: message.id,
          text: completion.choices[0]?.message?.content ?? ""
        });
      })
      .catch((cause: unknown) =>
        post({
          type: "error",
          id: message.id,
          message: cause instanceof Error ? cause.message : "Generation failed."
        })
      );
  }
};

function currentModel(): string {
  return loadedModelId ?? "Qwen2.5-3B-Instruct-q4f16_1-MLC";
}
