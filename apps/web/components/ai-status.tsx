"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { detectTier, probeOllama } from "@/lib/ai/detect";
import type { ModelTier, TierStatus } from "@/lib/ai/providers/types";
import { cx } from "@/lib/ui";

interface AiStatusProps {
  readonly onTierChange?: (tier: ModelTier) => void;
}

/**
 * The model tier bar: what is available on this machine, what it costs in
 * bytes, and which one is active. Selecting Ollama triggers the only network
 * probe in the product - a version ping to localhost, on a user action.
 */
export function AiStatus({ onTierChange }: AiStatusProps) {
  const t = useTranslations("aiStatus");
  const [statuses, setStatuses] = useState<TierStatus[] | null>(null);
  const [active, setActive] = useState<ModelTier>("none");
  const [probing, setProbing] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setStatuses(detectTier());
  }, []);

  if (!statuses) {
    return (
      <section className="bench px-5 py-4 sm:px-6">
        <p className="text-sm text-muted">{t("detecting")}</p>
      </section>
    );
  }

  async function select(tier: ModelTier) {
    setNote(null);
    if (tier === "ollama") {
      setProbing(true);
      const reachable = await probeOllama();
      setProbing(false);
      setStatuses((current) =>
        (current ?? []).map((status) =>
          status.tier === "ollama" ? { ...status, available: reachable } : status
        )
      );
      if (!reachable) {
        setNote(t("ollamaUnreachable"));
        return;
      }
    }
    setActive(tier);
    onTierChange?.(tier);
  }

  return (
    <section className="bench px-5 py-4 sm:px-6" aria-labelledby="ai-tier-heading">
      <h2 id="ai-tier-heading" className="text-sm font-semibold">
        {t("heading")}
      </h2>
      <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">
        {t("lede")}
      </p>

      <ul className="mt-3 space-y-2">
        {statuses.map((status) => {
          const selectable = status.available || status.tier === "ollama";
          return (
            <li key={status.tier}>
              <button
                type="button"
                disabled={!selectable || probing}
                onClick={() => select(status.tier)}
                aria-pressed={active === status.tier}
                className={cx(
                  "w-full rounded-control border px-3 py-2 text-left transition-colors",
                  active === status.tier
                    ? "border-action bg-action/[0.07]"
                    : "border-line hover:border-muted disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium">{status.label}</span>
                  {status.sizeMb ? (
                    <span className="font-mono text-xs text-muted">
                      {t("size", { sizeMb: status.sizeMb })}
                    </span>
                  ) : null}
                  {active === status.tier ? (
                    <span className="font-mono text-xs text-good">{t("active")}</span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {status.detail}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {probing ? <p className="mt-2 text-xs text-muted">{t("probing")}</p> : null}
      {note ? <p className="mt-2 text-xs text-caution">{note}</p> : null}
    </section>
  );
}
