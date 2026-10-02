import { createBuiltinModel } from "./providers/builtin";
import { createOllamaModel } from "./providers/ollama";
import { startWebLlm, type WebLlmModel, type WebLlmProgress } from "./providers/webllm";
import type { ModelTier, TextModel } from "./providers/types";

/**
 * One place that turns a tier choice into a TextModel. The WebLLM session is
 * a module-level singleton: weights load once per page, and every task after
 * the first reuses the engine.
 */

export interface ModelSession {
  readonly model: TextModel;
  dispose(): void;
}

let webllmSession: WebLlmModel | null = null;
let webllmLoading: Promise<WebLlmModel> | null = null;

export async function acquireModel(
  tier: ModelTier,
  onProgress?: (progress: WebLlmProgress) => void
): Promise<ModelSession> {
  switch (tier) {
    case "builtin":
      return { model: createBuiltinModel(), dispose: () => {} };
    case "ollama":
      return { model: createOllamaModel(), dispose: () => {} };
    case "webllm": {
      if (!webllmSession) {
        webllmLoading ??= startWebLlm(onProgress ?? (() => {})).then(
          (session) => {
            webllmSession = session;
            return session;
          },
          (cause: unknown) => {
            webllmLoading = null;
            throw cause;
          }
        );
        webllmSession = await webllmLoading;
      }
      return {
        model: webllmSession,
        // Disposing a task must not kill the shared engine; the consent UI
        // owns its lifetime.
        dispose: () => {}
      };
    }
    case "none":
      throw new Error("No text model selected.");
  }
}
