"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";

import { acquireModel } from "@/lib/ai/model";
import type { ModelTier } from "@/lib/ai/providers/types";
import {
  applyRewrite,
  rewriteBullets,
  selectWeakBullets,
  type RewritePair,
  type WeakBullet
} from "@/lib/ai/tasks/rewrite";
import { cx } from "@/lib/ui";

interface RewriteDiffProps {
  readonly tier: ModelTier;
  readonly cvText: string;
  readonly knownSkills: readonly string[];
  readonly onApply: (newText: string) => void;
}

interface PreparedRewrite {
  readonly bullet: WeakBullet;
  readonly rewritten: string;
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Side-by-side rewrite review. Nothing is applied silently: the model
 * proposes, the grounding check has already filtered inventions, and the
 * user swaps one bullet at a time - each swap re-runs the analysis so the
 * score rail shows exactly what the sentence was worth.
 */
export function RewriteDiff({ tier, cvText, knownSkills, onApply }: RewriteDiffProps) {
  const t = useTranslations("rewriteDiff");
  const weak = useMemo(() => selectWeakBullets(cvText), [cvText]);
  const [proposals, setProposals] = useState<readonly PreparedRewrite[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const propose = useCallback(async () => {
    setError(null);
    setBusy(true);
    setProgress(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const session = await acquireModel(tier, (event) =>
        setProgress(t("progress", { percent: event.progress, text: event.text }).trim())
      );
      const pairs: RewritePair[] = await rewriteBullets(
        session.model,
        weak,
        knownSkills,
        controller.signal
      );
      if (controller.signal.aborted) return;
      const byOriginal = new Map(pairs.map((pair) => [normalize(pair.original), pair.rewritten]));
      setProposals(
        weak.flatMap((bullet) => {
          const rewritten = byOriginal.get(normalize(bullet.content));
          return rewritten ? [{ bullet, rewritten }] : [];
        })
      );
      if (byOriginal.size === 0) {
        setError(t("nothingUsable"));
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : t("rewriteFailed"));
      }
    } finally {
      setBusy(false);
      setProgress(null);
      abortRef.current = null;
    }
  }, [tier, weak, knownSkills, t]);

  function cancel() {
    abortRef.current?.abort();
    setBusy(false);
    setProgress(null);
  }

  function apply(prepared: PreparedRewrite) {
    const next = applyRewrite(cvText, prepared.bullet, prepared.rewritten);
    if (!next) {
      setError(t("stale"));
      return;
    }
    setProposals((current) =>
      current.filter((entry) => entry.bullet.lineIndex !== prepared.bullet.lineIndex)
    );
    onApply(next);
  }

  if (tier === "none") return null;
  if (weak.length === 0 && proposals.length === 0) return null;

  return (
    <section className="bench overflow-hidden" aria-labelledby="rewrite-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id="rewrite-heading" className="text-base font-semibold">
            {t("heading")}
          </h2>
          <p className="mt-1 max-w-measure text-sm leading-relaxed text-muted">
            {t("lede", { count: weak.length })}
          </p>
        </div>
        {busy ? (
          <button type="button" className="btn-quiet" onClick={cancel}>
            {t("cancel")}
          </button>
        ) : (
          <button type="button" className="btn" onClick={propose} disabled={weak.length === 0}>
            {t("propose")}
          </button>
        )}
      </div>

      {busy ? (
        <p className="px-5 py-4 font-mono text-xs text-muted sm:px-6">
          {progress ?? t("warmingUp")}
        </p>
      ) : null}

      {error ? <p className="px-5 py-3 text-sm text-mark sm:px-6">{error}</p> : null}

      {proposals.length > 0 ? (
        <ul className="divide-y divide-line/70">
          {proposals.map((prepared) => (
            <li key={prepared.bullet.lineIndex} className="px-5 py-4 sm:px-6">
              <div className="grid gap-3 md:grid-cols-2">
                <p className="rounded-chip bg-bench-sunk px-3 py-2 font-mono text-xs leading-relaxed text-muted line-through decoration-mark/40">
                  {prepared.bullet.content}
                </p>
                <p className="rounded-chip border border-line px-3 py-2 font-mono text-xs leading-relaxed text-ink">
                  {prepared.rewritten}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className="btn-quiet" onClick={() => apply(prepared)}>
                  {t("apply")}
                </button>
                <button
                  type="button"
                  className={cx("btn-quiet text-muted")}
                  onClick={() =>
                    setProposals((current) =>
                      current.filter((entry) => entry !== prepared)
                    )
                  }
                >
                  {t("discard")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
