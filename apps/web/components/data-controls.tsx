"use client";

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

const LABELS: Readonly<Record<string, string>> = {
  history: "saved scores",
  meta: "settings"
};

function describe(summary: LocalDataSummary): string {
  const parts = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${count} ${LABELS[name] ?? name}`);

  return parts.length > 0 ? parts.join(", ") : "nothing";
}

/**
 * Everything this product keeps about a user sits in their own browser, so the
 * delete control belongs there too. It states the count first: a wipe that does
 * not say what it took is indistinguishable from one that failed.
 */
export function DataControls() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

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
    <section className="sheet px-5 py-4 sm:px-6" aria-labelledby="data-controls-heading">
      <h2 id="data-controls-heading" className="text-sm font-semibold">
        Stored on this device
      </h2>

      {phase.kind === "loading" ? (
        <p className="mt-1 text-xs text-muted">Counting what is stored here…</p>
      ) : null}

      {phase.kind === "unavailable" ? (
        <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">{phase.message}</p>
      ) : null}

      {phase.kind === "ready" ? (
        <>
          <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">
            This browser holds {describe(phase.summary)}. Your CV is not among it: nothing here
            keeps the document or any line from it.
          </p>
          <button
            type="button"
            className="btn-quiet mt-3"
            disabled={totalRecords(phase.summary) === 0}
            onClick={() => setPhase({ kind: "confirming", summary: phase.summary })}
          >
            Delete local data
          </button>
        </>
      ) : null}

      {phase.kind === "confirming" ? (
        <>
          <p className="mt-1 max-w-measure text-xs leading-relaxed text-muted">
            Deleting removes {describe(phase.summary)}. It cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-quiet" onClick={() => void wipe()}>
              Delete {totalRecords(phase.summary)} records
            </button>
            <button type="button" className="btn-quiet" onClick={() => void load()}>
              Keep them
            </button>
          </div>
        </>
      ) : null}

      {phase.kind === "wiping" ? <p className="mt-1 text-xs text-muted">Deleting…</p> : null}

      {phase.kind === "wiped" ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-muted" role="status">
            Deleted {phase.removed} records. This browser now holds nothing from this site.
          </p>
          <button type="button" className="btn-quiet mt-3" onClick={() => void load()}>
            Count again
          </button>
        </>
      ) : null}
    </section>
  );
}
