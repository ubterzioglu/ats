import { openStore } from "./db";
import { ok, type StoreResult } from "./failure";
import type { JobRecord } from "./schema";

export async function createJob(record: JobRecord): Promise<StoreResult<JobRecord>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  
  const written = await opened.value.put("jobs", record);
  opened.value.close();
  
  if (!written.ok) return written;
  return ok(record);
}

export async function getJob(id: string): Promise<StoreResult<JobRecord | null>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  
  const read = await opened.value.get("jobs", id);
  opened.value.close();
  
  return read;
}

export async function listJobs(): Promise<StoreResult<readonly JobRecord[]>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  
  const records = await opened.value.getAll("jobs");
  opened.value.close();
  
  if (!records.ok) return records;
  const sorted = [...records.value].sort((a, b) => b.updatedAt - a.updatedAt);
  return ok(sorted);
}

export async function deleteJob(id: string): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;
  
  const deleted = await opened.value.remove("jobs", id);
  opened.value.close();
  
  return deleted;
}
