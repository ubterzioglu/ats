"use server";

import { requireAdmin } from "@/lib/admin/guard";
import { updateDataRequestStatus } from "@/lib/supabase/admin-requests";
import { logAdminAction } from "@/lib/admin/audit";

export type UpdateOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export async function updateRequestStatusAction(
  id: string,
  status: "done" | "rejected"
): Promise<UpdateOutcome> {
  const adminEmail = await requireAdmin();

  const success = await updateDataRequestStatus(id, status, adminEmail);
  if (!success) {
    return { ok: false, reason: "update-failed" };
  }

  // Log action
  await logAdminAction(adminEmail, "request_update", id, status);

  return { ok: true };
}
