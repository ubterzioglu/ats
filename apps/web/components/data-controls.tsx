"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  summariseLocalData,
  totalRecords,
  wipeLocalData,
  type LocalDataSummary
} from "@/lib/store/wipe";

type Phase =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly summary: LocalDataSummary }
  | { readonly kind: "confirming"; readonly summary: LocalDataSummary }
  | { readonly kind: "wiping" }
  | { readonly kind: "wiped"; readonly removed: number }
  | { readonly kind: "unavailable"; readonly message: string };

/**
 * Everything this product keeps about a user sits in their own browser, so the
 * delete control belongs there too. It states the count first: a wipe that does
 * not say what it took is indistinguishable from one that failed.
 */
export function DataControls() {
  const t = useTranslations("dataControls");
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  function describe(summary: LocalDataSummary): string {
    const parts = Object.entries(summary)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => `${count} ${t(name)}`);

    return parts.length > 0 ? parts.join(", ") : t("nothing");
  }

  const load = useCallback(async () => {
    const summary = await summariseLocalData();
    setPhase(
      summary.ok
        ? { kind: "ready", summary: summary.value }
        : { kind: "unavailable", message: summary.failure.message }
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function wipe() {
    setPhase({ kind: "wiping" });
    const outcome = await wipeLocalData();
    setPhase(
      outcome.ok
        ? { kind: "wiped", removed: totalRecords(outcome.value) }
        : { kind: "unavailable", message: outcome.failure.message }
    );
  }

  return (
    <section className="bench px-5 py-4 sm:px-6" aria-labelledby="data-controls-heading">
      <h2 id="data-controls-heading" className="text-sm font-normal">
        {t("heading")}
      </h2>

      {phase.kind === "loading" ? (
        <p className="mt-1 text-xs text-muted">{t("counting")}</p>
      ) : null}

      {phase.kind === "unavailable" ? (
        <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">{phase.message}</p>
      ) : null}

      {phase.kind === "ready" ? (
        <>
          <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">
            {t("holds", { what: describe(phase.summary) })}
          </p>
          <button
            type="button"
            className="btn-quiet mt-3"
            disabled={totalRecords(phase.summary) === 0}
            onClick={() => setPhase({ kind: "confirming", summary: phase.summary })}
          >
            {t("delete")}
          </button>
        </>
      ) : null}

      {phase.kind === "confirming" ? (
        <>
          <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">
            {t("confirm", { what: describe(phase.summary) })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-quiet" onClick={() => void wipe()}>
              {t("confirmDelete", { count: totalRecords(phase.summary) })}
            </button>
            <button type="button" className="btn-quiet" onClick={() => void load()}>
              {t("keep")}
            </button>
          </div>
        </>
      ) : null}

      {phase.kind === "wiping" ? <p className="mt-1 text-xs text-muted">{t("deleting")}</p> : null}

      {phase.kind === "wiped" ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-muted" role="status">
            {t("deleted", { count: phase.removed })}
          </p>
          <button type="button" className="btn-quiet mt-3" onClick={() => void load()}>
            {t("countAgain")}
          </button>
        </>
      ) : null}
    </section>
  );
}
