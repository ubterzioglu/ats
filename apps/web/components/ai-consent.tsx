"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("aiConsent");
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
      setError(cause instanceof Error ? cause.message : t("downloadFailed"));
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
      <section className="bench px-5 py-4 sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-normal text-good">{t("ready")}</span> {t("readyDetail")}
        </p>
      </section>
    );
  }

  return (
    <section className="bench space-y-3 px-5 py-4 sm:px-6" aria-labelledby="ai-consent-heading">
      <div>
        <h2 id="ai-consent-heading" className="text-base font-normal">
          {t("heading")}
        </h2>
        <p className="mt-1.5 max-w-measure text-sm leading-relaxed text-muted">
          {t("lede", { model: EMBED_MODEL_LABEL, sizeMb: EMBED_MODEL_SIZE_MB })}
        </p>
      </div>

      {phase === "loading" ? (
        <div className="space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full border border-line bg-bench-sunk">
            <div
              className="h-full bg-saffron transition-[width] duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("progressLabel")}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-muted">{progress}%</span>
            <button type="button" className="btn-quiet" onClick={cancel}>
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={download}>
            {t(phase === "error" ? "tryAgain" : "download")}
          </button>
        </div>
      )}

      {error ? (
        <p className={cx("text-sm text-mark")}>{error}</p>
      ) : null}
    </section>
  );
}
