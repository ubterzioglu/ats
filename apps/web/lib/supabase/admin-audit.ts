import "server-only";

import { createServiceClient } from "./client";

export interface AuditEntry {
  id: string;
  at: string;
  admin_email: string;
  action: string;
  submission_id: string | null;
  detail: string | null;
}

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin] getAuditLog error", error);
    return [];
  }

  return (data as AuditEntry[]) ?? [];
}
