import "server-only";

import { createServiceClient } from "./client";
import { deleteSubmissionWithCleanup } from "@/lib/admin/delete-submission";

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
  readonly deleteSubmissionWithCleanup: typeof deleteSubmissionWithCleanup;
}

export async function cleanupExpiredSubmissions(
  ports: CleanupPorts = {
    getExpiredSubmissions,
    deleteSubmissionWithCleanup
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
      // Use shared delete function with system email
      const result = await ports.deleteSubmissionWithCleanup(sub, "system@cleanup");
      if (result.ok) {
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
