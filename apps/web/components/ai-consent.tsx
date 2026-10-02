"use client";

import { useCallback, useRef, useState } from "react";

import {
  EMBED_MODEL_LABEL,
  EMBED_MODEL_SIZE_MB,
  startEmbedder,
  type Embedder
} from "@/lib/ai/embeddings";
import { cx } from "@/lib/ui";

interface AiConsentProps {
  readonly onReady: (embedder: Embedder) => void;
}

type Phase = "idle" | "loading" | "ready" | "error";

/**
 * The consent gate for every local-model feature. Nothing downloads until
 * this card is answered; the card names the model, its size and what it is
 * for, and a cancel terminates the worker mid-download.
 */
export function AiConsent({ onReady }: AiConsentProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const embedderRef = useRef<Embedder | null>(null);
  const fileProgress = useRef(new Map<string, number>());

  const handleProgress = useCallback((event: { file: string; progress: number }) => {
    fileProgress.current.set(event.file, event.progress);
    const values = [...fileProgress.current.values()];
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    setProgress(Math.round(mean));
  }, []);

  async function download() {
    setError(null);
    setPhase("loading");
    setProgress(0);
    fileProgress.current.clear();
    try {
      const embedder = await startEmbedder(handleProgress);
      embedderRef.current = embedder;
      setPhase("ready");
      onReady(embedder);
    } catch (cause) {
      setPhase("error");
      setError(cause instanceof Error ? cause.message : "The model could not be downloaded.");
    }
  }

  function cancel() {
    embedderRef.current?.terminate();
    embedderRef.current = null;
    setPhase("idle");
    setProgress(0);
  }

  if (phase === "ready") {
    return (
      <section className="sheet px-5 py-4 sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-medium text-good">Semantic model ready.</span> Hints below run
          locally against the parsed text; scores are unaffected.
        </p>
      </section>
    );
  }

  return (
    <section className="sheet space-y-3 px-5 py-4 sm:px-6" aria-labelledby="ai-consent-heading">
      <div>
        <h2 id="ai-consent-heading" className="text-base font-semibold">
          Semantic hints (optional)
        </h2>
        <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
          A small language model can point out near-misses the literal matcher cannot see - like a
          CV saying &ldquo;Postgres&rdquo; where the ad says &ldquo;PostgreSQL&rdquo;. It runs
          entirely in your browser ({EMBED_MODEL_LABEL}, about {EMBED_MODEL_SIZE_MB} MB, downloaded
          once and cached). Your CV text is never sent anywhere, and scores never change - hints
          are advice, not measurement.
        </p>
      </div>

      {phase === "loading" ? (
        <div className="space-y-2">
          <div className="ruler h-1.5 overflow-hidden rounded-full border border-line bg-bed/60">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Model download progress"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted">{progress}%</span>
            <button type="button" className="btn-quiet" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={download}>
            {phase === "error" ? "Try again" : "Download model"}
          </button>
        </div>
      )}

      {error ? (
        <p className={cx("text-sm text-mark")}>{error}</p>
      ) : null}
    </section>
  );
}
