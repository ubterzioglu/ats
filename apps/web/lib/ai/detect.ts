import type { ModelTier, TierStatus } from "./providers/types";

/**
 * Tier detection, cheapest probe first. "none" always works. The Chrome/Edge
 * built-in model is a feature check, WebLLM needs WebGPU, and Ollama is an
 * opt-in local server that gets probed only when the user asks for it - an
 * automatic fetch to localhost on page load would be a port scan of the
 * user's own machine.
 */

export const TIER_ORDER: readonly ModelTier[] = ["builtin", "webllm", "ollama", "byok", "none"];

function hasBuiltinModel(): boolean {
  return typeof window !== "undefined" && "LanguageModel" in window;
}

function hasWebGpu(): boolean {
  if (typeof navigator === "undefined") return false;
  return (navigator as Navigator & { gpu?: unknown }).gpu !== undefined;
}

export function detectTier(): TierStatus[] {
  const builtin = hasBuiltinModel();
  const webgpu = hasWebGpu();

  return [
    {
      tier: "builtin",
      label: "Browser built-in",
      available: builtin,
      detail: builtin
        ? "Chrome/Edge Gemini Nano. English and German only."
        : "Needs a Chromium browser with the built-in model enabled."
    },
    {
      tier: "webllm",
      label: "WebLLM (local download)",
      available: webgpu,
      sizeMb: 1600,
      detail: webgpu
        ? "Qwen runs fully in this browser over WebGPU. One-time download."
        : "Needs WebGPU. Without it the model cannot run at usable speed."
    },
    {
      tier: "ollama",
      label: "Ollama (localhost)",
      available: false,
      detail: "Opt-in: probed only when you select it. Needs Ollama running with OLLAMA_ORIGINS set for this site."
    },
    {
      tier: "byok",
      label: "Bring Your Own Key",
      available: true,
      detail: "Bring your own API key for an external LLM. Keys never leave the browser. Requires manual consent for every request."
    },
    {
      tier: "none",
      label: "No model",
      available: true,
      detail: "Deterministic report only. Everything without a model already works."
    }
  ];
}

/** Probes the local Ollama server once, on explicit user action only. */
export async function probeOllama(timeoutMs = 500): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("http://localhost:11434/api/version", {
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
