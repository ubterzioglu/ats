import { openStore } from "./db";
import { ok, type StoreResult } from "./failure";
import { STORE_NAMES, type StoreName } from "./schema";

export type LocalDataSummary = Readonly<Record<StoreName, number>>;

/** What a wipe would remove, so the user is told before they agree to it. */
export async function summariseLocalData(): Promise<StoreResult<LocalDataSummary>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  const counts: Partial<Record<StoreName, number>> = {};
  for (const name of STORE_NAMES) {
    const counted = await store.count(name);
    if (!counted.ok) {
      store.close();
      return counted;
    }
    counts[name] = counted.value;
  }

  store.close();
  return ok(counts as LocalDataSummary);
}

/**
 * Clears every store and reports what went. Clearing rather than deleting the
 * database keeps the schema at its current version, so a later write does not
 * have to re-run every migration.
 */
export async function wipeLocalData(): Promise<StoreResult<LocalDataSummary>> {
  const summary = await summariseLocalData();
  if (!summary.ok) return summary;

  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  for (const name of STORE_NAMES) {
    const cleared = await store.clear(name);
    if (!cleared.ok) {
      store.close();
      return cleared;
    }
  }

  store.close();
  return ok(summary.value);
}

export function totalRecords(summary: LocalDataSummary): number {
  return STORE_NAMES.reduce((sum, name) => sum + summary[name], 0);
}
