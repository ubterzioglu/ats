import { openStore } from "@/lib/store/db";
import { ok, type StoreResult } from "@/lib/store/failure";
import type { ApplicationRecord } from "@/lib/store/schema";

export type ApplicationInput = Omit<ApplicationRecord, "updatedAt" | "createdAt">;

export async function createApplication(input: ApplicationInput): Promise<StoreResult<ApplicationRecord>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const now = Date.now();
  const record: ApplicationRecord = {
    ...input,
    updatedAt: now,
    createdAt: now
  };

  const written = await opened.value.put("applications", record);
  opened.value.close();

  if (!written.ok) return written;
  return ok(record);
}

export async function updateApplication(
  id: string,
  updates: Partial<Omit<ApplicationInput, "id">>
): Promise<StoreResult<ApplicationRecord | null>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const existing = await opened.value.get("applications", id);
  if (!existing.ok) {
    opened.value.close();
    return existing;
  }

  if (existing.value === null) {
    opened.value.close();
    return ok(null);
  }

  const record: ApplicationRecord = {
    ...existing.value,
    ...updates,
    updatedAt: Date.now()
  };

  const written = await opened.value.put("applications", record);
  opened.value.close();

  if (!written.ok) return written;
  return ok(record);
}

export async function getApplication(id: string): Promise<StoreResult<ApplicationRecord | null>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const record = await opened.value.get("applications", id);
  opened.value.close();

  return record;
}

export async function listApplications(): Promise<StoreResult<readonly ApplicationRecord[]>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const records = await opened.value.getAll("applications");
  opened.value.close();

  if (!records.ok) return records;

  // Most recently updated first
  const sorted = [...records.value].sort((a, b) => b.updatedAt - a.updatedAt);
  return ok(sorted);
}

export async function deleteApplication(id: string): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const cleared = await opened.value.remove("applications", id);
  opened.value.close();

  return cleared;
}
