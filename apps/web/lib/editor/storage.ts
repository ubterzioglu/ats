import { openStore } from "@/lib/store/db";
import { ok, type StoreResult } from "@/lib/store/failure";
import { safeParseResume } from "@/lib/resume/schema";
import type { Resume } from "@/types/resume";

const DRAFT_ID = "draft";

/**
 * The CV being built, on this device only. It is the one document this product
 * promises never to send anywhere, so it goes to IndexedDB and nothing else.
 *
 * What comes back out is validated rather than cast. The record may have been
 * written by an older build of the editor, and a draft that cannot be read is
 * an empty draft rather than a crashed page - the same rule the shared report
 * follows.
 */
export async function readDraft(): Promise<StoreResult<Resume>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const record = await opened.value.get("drafts", DRAFT_ID);
  opened.value.close();
  if (!record.ok) return record;

  if (record.value === null) return ok({});

  const parsed = safeParseResume(record.value.resume);
  return ok(parsed.ok ? parsed.resume : {});
}

export async function writeDraft(resume: Resume): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const written = await opened.value.put("drafts", {
    id: DRAFT_ID,
    updatedAt: Date.now(),
    resume
  });
  opened.value.close();

  return written;
}

export async function clearDraft(): Promise<StoreResult<void>> {
  const opened = await openStore();
  if (!opened.ok) return opened;

  const cleared = await opened.value.remove("drafts", DRAFT_ID);
  opened.value.close();
  return cleared;
}
