import "server-only";

import { removeCvFile } from "@/lib/supabase/storage";
import { deleteSubmissionRow } from "@/lib/supabase/submissions";
import { logAdminAction } from "./audit";

export interface SubmissionToDelete {
  readonly id: string;
  readonly storage_path: string | null;
}

export type DeleteSubmissionOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "storage-failed" | "db-failed" };

export interface DeleteSubmissionPorts {
  readonly removeCvFile: typeof removeCvFile;
  readonly deleteSubmissionRow: typeof deleteSubmissionRow;
  readonly logAdminAction: typeof logAdminAction;
}

export async function deleteSubmissionWithCleanup(
  submission: SubmissionToDelete,
  adminEmail: string,
  ports: DeleteSubmissionPorts = {
    removeCvFile,
    deleteSubmissionRow,
    logAdminAction
  }
): Promise<DeleteSubmissionOutcome> {
  // Storage -> row, aborting without deleting the row if the storage delete fails
  if (submission.storage_path) {
    const storageResult = await ports.removeCvFile(submission.storage_path);
    if (!storageResult.ok && storageResult.reason !== "not-found") {
      return { ok: false, reason: "storage-failed" };
    }
  }

  const dbResult = await ports.deleteSubmissionRow(submission.id);
  if (!dbResult.ok) {
    return { ok: false, reason: "db-failed" };
  }

  // Audit entry on success
  await ports.logAdminAction(adminEmail, "delete", submission.id);

  return { ok: true };
}
