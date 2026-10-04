import { openStore } from "@/lib/store/db";
import { ok, type StoreResult } from "@/lib/store/failure";
import type { VariantRecord } from "@/lib/store/schema";
import { safeParseResume } from "@/lib/resume/schema";
import type { Resume } from "@/types/resume";

import { diff, patch } from "./diff";

export interface Variant {
  readonly id: string;
  readonly jobId: string;
  readonly updatedAt: number;
  readonly resume: Resume;
}

/**
 * Loads a variant and applies its overrides to the provided base resume.
 */
export async function readVariant(id: string, base: Resume): Promise<StoreResult<Variant | null>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const record = await opened.value.get("variants", id);
  opened.value.close();
  if (!record.ok) return record;

  if (record.value === null) return ok(null);

  const patched = patch(base, record.value.overrides);
  const parsed = safeParseResume(patched);

  return ok({
    id: record.value.id,
    jobId: record.value.jobId,
    updatedAt: record.value.updatedAt,
    resume: parsed.ok ? parsed.resume : {}
  });
}

/**
 * Lists all variants but only returns their metadata, not the fully assembled resumes,
 * because assembling requires the base resume which we might not want to pass down here.
 */
export async function listVariants(): Promise<StoreResult<readonly Omit<VariantRecord, "overrides">[]>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const records = await opened.value.getAll("variants");
  opened.value.close();
  if (!records.ok) return records;

  return ok(
    records.value.map((r) => ({
      id: r.id,
      jobId: r.jobId,
      updatedAt: r.updatedAt
    }))
  );
}

/**
 * Saves a variant by computing its diff against the base resume.
 */
export async function writeVariant(
  id: string,
  jobId: string,
  variant: Resume,
  base: Resume
): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const overrides = diff(base, variant) ?? {};

  const written = await opened.value.put("variants", {
    id,
    jobId,
    updatedAt: Date.now(),
    overrides
  });
  opened.value.close();

  return written;
}

export async function clearVariant(id: string): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const cleared = await opened.value.remove("variants", id);
  opened.value.close();
  return cleared;
}
