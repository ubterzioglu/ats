"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { getSubmissionDetail } from "@/lib/supabase/admin-detail";
import { deleteSubmissionWithCleanup } from "@/lib/admin/delete-submission";
import { createDownloadUrl } from "@/lib/supabase/storage";
import { logAdminAction } from "@/lib/admin/audit";

export type DeleteOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export async function deleteSubmissionAction(id: string): Promise<DeleteOutcome> {
  const adminEmail = await requireAdmin();

  const submission = await getSubmissionDetail(id);
  if (!submission) {
    return { ok: false, reason: "not-found" };
  }

  const result = await deleteSubmissionWithCleanup(
    { id: submission.id, storage_path: submission.storage_path },
    adminEmail
  );

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  return { ok: true };
}

export type DownloadOutcome =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly reason: string };

export async function downloadSubmissionAction(id: string): Promise<DownloadOutcome> {
  const adminEmail = await requireAdmin();

  const submission = await getSubmissionDetail(id);
  if (!submission || !submission.storage_path) {
    return { ok: false, reason: "not-found" };
  }

  // Log download action
  await logAdminAction(adminEmail, "download", id);

  // Create signed URL (60 seconds)
  const url = await createDownloadUrl(submission.storage_path, 60);
  if (!url) {
    return { ok: false, reason: "url-failed" };
  }

  return { ok: true, url };
}
