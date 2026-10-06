import "server-only";

import type { AnalysisResult } from "@/types/analysis";

import { createServiceClient } from "./client";

export interface InsertSubmissionInput {
  readonly id: string;
  readonly storagePath: string;
  readonly userId?: string;
  readonly clientHash?: string;
  readonly fileName?: string;
  readonly fileMime?: string;
  readonly fileSize?: number;
  readonly cvText: string;
  readonly jobDescription?: string;
  readonly language?: string;
  readonly total?: number;
  readonly band?: string;
  readonly result?: AnalysisResult;
  readonly consentVersion: string;
}

export type InsertSubmissionOutcome =
  | { readonly ok: true; readonly id: string; readonly expiresAt: string }
  | { readonly ok: false; readonly reason: "env-missing" | "error" };

export async function insertSubmission(
  input: InsertSubmissionInput
): Promise<InsertSubmissionOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { data, error } = await supabase
      .from("cv_submissions")
      .insert({
        id: input.id,
        storage_path: input.storagePath,
        user_id: input.userId,
        client_hash: input.clientHash,
        file_name: input.fileName,
        file_mime: input.fileMime,
        file_size: input.fileSize,
        cv_text: input.cvText,
        job_description: input.jobDescription,
        language: input.language,
        total: input.total,
        band: input.band,
        result: input.result,
        consent_version: input.consentVersion
      })
      .select("id, expires_at")
      .single();

    if (error) {
      console.error("[submissions] insert failed", error.message);
      return { ok: false, reason: "error" };
    }

    return { ok: true, id: data.id, expiresAt: data.expires_at };
  } catch (cause) {
    console.error("[submissions] insert threw", cause);
    return { ok: false, reason: "error" };
  }
}

export type MarkDriveStatusOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "error" };

export async function markDriveStatus(
  id: string,
  status: "uploaded" | "failed" | "skipped",
  driveFileId?: string
): Promise<MarkDriveStatusOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase
      .from("cv_submissions")
      .update({
        drive_status: status,
        drive_file_id: driveFileId
      })
      .eq("id", id);

    if (error) {
      console.error("[submissions] update failed", error.message);
      return { ok: false, reason: "error" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[submissions] update threw", cause);
    return { ok: false, reason: "error" };
  }
}

export async function countRecentByClient(
  hash: string | null,
  sinceIso: string
): Promise<number> {
  if (!hash) return 0;
  const supabase = createServiceClient();
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("cv_submissions")
      .select("*", { count: "exact", head: true })
      .eq("client_hash", hash)
      .gte("created_at", sinceIso);

    if (error) {
      console.error("[submissions] count failed", error.message);
      return 0;
    }

    return count ?? 0;
  } catch (cause) {
    console.error("[submissions] count threw", cause);
    return 0;
  }
}

export type DeleteSubmissionOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "error" };

export async function deleteSubmissionRow(id: string): Promise<DeleteSubmissionOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase.from("cv_submissions").delete().eq("id", id);

    if (error) {
      console.error("[submissions] delete failed", error.message);
      return { ok: false, reason: "error" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[submissions] delete threw", cause);
    return { ok: false, reason: "error" };
  }
}
