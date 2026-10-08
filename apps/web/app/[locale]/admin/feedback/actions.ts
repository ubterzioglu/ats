"use server";

import { logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { FEEDBACK_STATUSES, type FeedbackStatus } from "@/lib/feedback-schema";
import { updateFeedbackStatus } from "@/lib/supabase/admin-feedback";

export type UpdateFeedbackOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export async function updateFeedbackStatusAction(
  id: string,
  status: FeedbackStatus
): Promise<UpdateFeedbackOutcome> {
  const adminEmail = await requireAdmin();

  if (!FEEDBACK_STATUSES.includes(status)) {
    return { ok: false, reason: "invalid-status" };
  }

  const success = await updateFeedbackStatus(id, status, adminEmail);
  if (!success) return { ok: false, reason: "update-failed" };

  await logAdminAction(adminEmail, "feedback_update", undefined, `${id}:${status}`);

  return { ok: true };
}
