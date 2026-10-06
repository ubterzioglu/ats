import "server-only";

import { createServiceClient } from "./client";

export interface DataRequest {
  id: string;
  created_at: string;
  email: string;
  type: string;
  description: string;
  status: string;
  handled_at: string | null;
  handled_by: string | null;
}

export async function getDataRequests(status?: string): Promise<DataRequest[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("data_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin] getDataRequests error", error);
    return [];
  }

  return (data as DataRequest[]) ?? [];
}

export async function updateDataRequestStatus(
  id: string,
  status: "done" | "rejected",
  handledBy: string
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("data_requests")
    .update({
      status,
      handled_by: handledBy,
      handled_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("[admin] updateDataRequestStatus error", error);
    return false;
  }

  return true;
}
