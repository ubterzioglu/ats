"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { requireUser } from "@/lib/auth/require-user";
import { createServiceClient } from "@/lib/supabase/client";
import { removeCvFile } from "@/lib/supabase/storage";
import { deleteSubmissionRow } from "@/lib/supabase/submissions";
import { deleteProfile } from "@/lib/supabase/profile";

export async function deleteAccount() {
  const user = await requireUser();
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("storage-unavailable");
  }

  // Get all submissions for this user
  const { data: submissions, error } = await supabase
    .from("cv_submissions")
    .select("id, storage_path")
    .eq("user_id", user.id);

  if (error) {
    console.error("[account] failed to fetch submissions", error);
    throw new Error("delete-failed");
  }

  // Delete each submission's files
  for (const submission of submissions ?? []) {
    if (submission.storage_path) {
      const storageResult = await removeCvFile(submission.storage_path);
      if (!storageResult.ok && storageResult.reason !== "not-found") {
        console.error("[account] storage delete failed for", submission.id);
      }
    }
    await deleteSubmissionRow(submission.id);
  }

  // Delete reports
  const { error: reportsError } = await supabase
    .from("ats_reports")
    .delete()
    .eq("user_id", user.id);

  if (reportsError) {
    console.error("[account] failed to delete reports", reportsError);
  }

  // Delete profile
  const profileResult = await deleteProfile(user.id);
  if (!profileResult.ok && profileResult.reason !== "env-missing") {
    console.error("[account] failed to delete profile", profileResult.reason);
  }

  // Delete the auth user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("[account] failed to delete auth user", deleteError);
    throw new Error("delete-failed");
  }

  const locale = await getLocale();
  redirect({ href: "/", locale } as never);
}
