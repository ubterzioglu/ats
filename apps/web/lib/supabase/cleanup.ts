import "server-only";

import { createServiceClient } from "./client";
import { removeCvFile } from "./storage";
import { deleteFromDrive } from "@/lib/drive/client";

export interface ExpiredSubmission {
  id: string;
  storage_path: string | null;
  drive_file_id: string | null;
}

export async function getExpiredSubmissions(limit = 100): Promise<ExpiredSubmission[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cv_submissions")
    .select("id, storage_path, drive_file_id")
    .lt("expires_at", new Date().toISOString())
    .limit(limit);

  if (error) {
    console.error("[cleanup] getExpiredSubmissions error", error);
    return [];
  }

  return (data as ExpiredSubmission[]) ?? [];
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("cv_submissions").delete().eq("id", id);

  if (error) {
    console.error("[cleanup] deleteSubmission error", error);
    return false;
  }

  return true;
}

export interface CleanupPorts {
  readonly getExpiredSubmissions: typeof getExpiredSubmissions;
  readonly deleteFromDrive: typeof deleteFromDrive;
  readonly removeCvFile: typeof removeCvFile;
  readonly deleteSubmission: typeof deleteSubmission;
}

export async function cleanupExpiredSubmissions(
  ports: CleanupPorts = {
    getExpiredSubmissions,
    deleteFromDrive,
    removeCvFile,
    deleteSubmission
  }
): Promise<{
  deleted: number;
  failed: number;
}> {
  const expired = await ports.getExpiredSubmissions();
  let deleted = 0;
  let failed = 0;

  for (const sub of expired) {
    try {
      // A5: Delete from Google Drive first, check result
      if (sub.drive_file_id) {
        const driveResult = await ports.deleteFromDrive(sub.drive_file_id);
        if (!driveResult.ok && driveResult.reason !== "not-found") {
          // Drive delete failed (not 404), keep the row
          console.error("[cleanup] Drive delete failed for", sub.id, driveResult.reason);
          failed++;
          continue;
        }
      }

      // A5: Delete from storage, check result
      if (sub.storage_path) {
        const storageResult = await ports.removeCvFile(sub.storage_path);
        if (!storageResult.ok && storageResult.reason !== "not-found") {
          // Storage delete failed (not 404), keep the row
          console.error("[cleanup] Storage delete failed for", sub.id, storageResult.reason);
          failed++;
          continue;
        }
      }

      // Delete from database
      const success = await ports.deleteSubmission(sub.id);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error("[cleanup] failed to delete submission", sub.id, error);
      failed++;
    }
  }

  return { deleted, failed };
}
