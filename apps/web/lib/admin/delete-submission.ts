import "server-only";

import { deleteFromDrive } from "@/lib/drive/client";
import { removeCvFile } from "@/lib/supabase/storage";
import { deleteSubmissionRow } from "@/lib/supabase/submissions";
import { logAdminAction } from "./audit";

export interface SubmissionToDelete {
  readonly id: string;
  readonly storage_path: string | null;
  readonly drive_file_id: string | null;
}

export type DeleteSubmissionOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "drive-failed" | "storage-failed" | "db-failed" };

export interface DeleteSubmissionPorts {
  readonly deleteFromDrive: typeof deleteFromDrive;
  readonly removeCvFile: typeof removeCvFile;
  readonly deleteSubmissionRow: typeof deleteSubmissionRow;
  readonly logAdminAction: typeof logAdminAction;
}

export async function deleteSubmissionWithCleanup(
  submission: SubmissionToDelete,
  adminEmail: string,
  ports: DeleteSubmissionPorts = {
    deleteFromDrive,
    removeCvFile,
    deleteSubmissionRow,
    logAdminAction
  }
): Promise<DeleteSubmissionOutcome> {
  // Drive -> Storage -> row, aborting without deleting the row if an external delete fails
  if (submission.drive_file_id) {
    const driveResult = await ports.deleteFromDrive(submission.drive_file_id);
    if (!driveResult.ok && driveResult.reason !== "not-found") {
      return { ok: false, reason: "drive-failed" };
    }
  }

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
