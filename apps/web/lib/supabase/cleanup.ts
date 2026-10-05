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

export async function cleanupExpiredSubmissions(): Promise<{
  deleted: number;
  failed: number;
}> {
  const expired = await getExpiredSubmissions();
  let deleted = 0;
  let failed = 0;

  for (const sub of expired) {
    try {
      // Delete from Google Drive
      if (sub.drive_file_id) {
        await deleteFromDrive(sub.drive_file_id);
      }

      // Delete from storage
      if (sub.storage_path) {
        await removeCvFile(sub.storage_path);
      }

      // Delete from database
      const success = await deleteSubmission(sub.id);
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
