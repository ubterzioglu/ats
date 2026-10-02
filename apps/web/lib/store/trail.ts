import { openStore, type StoreHandle } from "./db";
import { ok, type StoreResult } from "./failure";
import type { TrailPoint } from "./schema";

const SESSION_KEY = "trail.sessionId";

/**
 * Enough to show the shape of a working session. A sitting that passes this is
 * showing a trend, not individual readings, and the oldest points stop telling
 * the user anything.
 */
export const TRAIL_LIMIT = 120;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readSessionId(store: StoreHandle): Promise<string | null> {
  const meta = await store.get("meta", SESSION_KEY);
  if (!meta.ok || meta.value === null) return null;
  return typeof meta.value.value === "string" ? meta.value.value : null;
}

/**
 * The id of the session in progress, created if there is none. Held in `meta`
 * rather than in memory, which is the whole reason the trail survives a reload.
 */
export async function currentSessionId(): Promise<StoreResult<string>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  const existing = await readSessionId(store);
  if (existing !== null) {
    store.close();
    return ok(existing);
  }

  const sessionId = newId();
  const written = await store.put("meta", {
    key: SESSION_KEY,
    value: sessionId,
    updatedAt: Date.now()
  });
  store.close();

  return written.ok ? ok(sessionId) : written;
}

/** Ends the session in progress and drops its points. */
export async function startNewSession(): Promise<StoreResult<string>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  const previous = await readSessionId(store);
  if (previous !== null) {
    const rows = await store.getAll("trail");
    if (rows.ok) {
      for (const point of rows.value.filter((row) => row.sessionId === previous)) {
        await store.remove("trail", point.id);
      }
    }
  }

  const sessionId = newId();
  const written = await store.put("meta", {
    key: SESSION_KEY,
    value: sessionId,
    updatedAt: Date.now()
  });
  store.close();

  return written.ok ? ok(sessionId) : written;
}

export async function appendTrailPoint(
  total: number,
  at: number = Date.now()
): Promise<StoreResult<TrailPoint>> {
  const session = await currentSessionId();
  if (!session.ok) return session;

  const opened = await openStore();
  if (!opened.ok) return opened;
  const store = opened.value;

  const point: TrailPoint = { id: newId(), sessionId: session.value, at, total };
  const written = await store.put("trail", point);
  if (!written.ok) {
    store.close();
    return written;
  }

  const rows = await store.getAll("trail");
  if (rows.ok) {
    // Points from sessions that ended without a reset, plus anything past the
    // limit in this one. The trail is a convenience; it must not grow forever.
    const mine = rows.value
      .filter((row) => row.sessionId === session.value)
      .sort((a, b) => a.at - b.at);
    const stale = [
      ...rows.value.filter((row) => row.sessionId !== session.value),
      ...mine.slice(0, Math.max(0, mine.length - TRAIL_LIMIT))
    ];

    for (const row of stale) await store.remove("trail", row.id);
  }

  store.close();
  return ok(point);
}

/** Oldest first, so the series reads left to right. */
export async function readTrail(): Promise<StoreResult<readonly TrailPoint[]>> {
  const session = await currentSessionId();
  if (!session.ok) return session;

  const opened = await openStore();
  if (!opened.ok) return opened;

  const rows = await opened.value.getAll("trail");
  opened.value.close();
  if (!rows.ok) return rows;

  return ok(
    rows.value.filter((row) => row.sessionId === session.value).sort((a, b) => a.at - b.at)
  );
}
