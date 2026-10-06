import "server-only";

import { createServiceClient } from "@/lib/supabase/client";

export type AdminAction =
  | "list"
  | "view"
  | "download"
  | "delete"
  | "export"
  | "request_update"
  | "blog_create"
  | "blog_update"
  | "blog_publish"
  | "blog_delete"
  | "user_list";

export async function logAdminAction(
  email: string,
  action: AdminAction,
  submissionId?: string,
  detail?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  try {
    await supabase.from("admin_audit_log").insert({
      admin_email: email,
      action,
      submission_id: submissionId,
      detail
    });
  } catch (cause) {
    console.error("[audit] log failed", cause);
  }
}
