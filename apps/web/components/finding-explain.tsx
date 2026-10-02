"use client";

import { useState } from "react";

import type { Finding } from "@/types/analysis";

export interface ExplanationView {
  readonly why: string;
  readonly nextStep: string;
}

interface FindingExplainButtonProps {
  readonly finding: Finding;
  readonly explain: (finding: Finding) => Promise<ExplanationView>;
}

/**
 * Per-finding "why does this matter" from the local model. Rendered only
 * when a text-model tier is active; the shared report page never passes an
 * explain callback, so this never appears there.
 */
export function FindingExplainButton({ finding, explain }: FindingExplainButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [explanation, setExplanation] = useState<ExplanationView | null>(null);

  async function run() {
    setState("loading");
    try {
      setExplanation(await explain(finding));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-3">
      {explanation ? (
        <div className="rounded-control border border-line bg-bed/40 px-3 py-2.5">
          <p className="text-sm leading-relaxed">{explanation.why}</p>
          <p className="mt-1.5 border-l-2 border-accent/30 pl-3 text-sm leading-relaxed text-muted">
            {explanation.nextStep}
          </p>
        </div>
      ) : (
        <button
          type="button"
          className="btn-quiet"
          onClick={run}
          disabled={state === "loading"}
        >
          {state === "loading"
            ? "Asking the local model…"
            : state === "error"
              ? "The model could not answer - try again"
              : "Explain with the local model"}
        </button>
      )}
    </div>
  );
}
