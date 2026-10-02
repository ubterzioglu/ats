import type { AnalysisResult } from "@/types/analysis";

import { openStore } from "./db";
import { ok, type StoreResult } from "./failure";
import type { HistoryRecord } from "./schema";

/** Enough to show a trend without turning the browser into an archive. */
export const HISTORY_LIMIT = 20;

/**
 * Keeps the scores, drops everything else. `findings` carry evidence lifted
 * from the document and `stats` describe it closely enough to be worth not
 * keeping either.
 */
export function toHistoryRecord(result: AnalysisResult, recordedAt: number): HistoryRecord {
  return {
    id: `${recordedAt}-${Math.random().toString(36).slice(2, 10)}`,
    recordedAt,
    total: result.total,
    band: result.band,
    language: result.language,
    dimensions: result.dimensions.map((dimension) => ({
      id: dimension.id,
      score: dimension.score,
      max: dimension.max
    }))
  };
}

/** Newest first. */
export async function readHistory(): Promise<StoreResult<readonly HistoryRecord[]>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const rows = await opened.value.getAll("history");
  opened.value.close();
  if (!rows.ok) return rows;

  return ok([...rows.value].sort((a, b) => b.recordedAt - a.recordedAt));
}

/** The analysis that preceded the one just produced, or null on a first visit. */
export async function readPreviousRecord(): Promise<StoreResult<HistoryRecord | null>> {
  const history = await readHistory();
  if (!history.ok) return history;
  return ok(history.value[0] ?? null);
}

export async function recordAnalysis(
  result: AnalysisResult,
  recordedAt: number = Date.now()
): Promise<StoreResult<HistoryRecord>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  const record = toHistoryRecord(result, recordedAt);
  const written = await store.put("history", record);
  if (!written.ok) {
    store.close();
    return written;
  }

  const rows = await store.getAll("history");
  if (!rows.ok) {
    store.close();
    return rows;
  }

  const stale = [...rows.value]
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(HISTORY_LIMIT);

  for (const row of stale) {
    const removed = await store.remove("history", row.id);
    if (!removed.ok) {
      store.close();
      return removed;
    }
  }

  store.close();
  return ok(record);
}

export async function clearHistory(): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const cleared = await opened.value.clear("history");
  opened.value.close();
  return cleared;
}
