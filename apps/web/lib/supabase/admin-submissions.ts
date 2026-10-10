import "server-only";

import { createServiceClient } from "./client";

export interface Submission {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string | null;
  file_size: number | null;
  language: string | null;
  total: number | null;
  band: string | null;
  user_id: string | null;
}

export interface SubmissionsFilters {
  q?: string;
  band?: string;
  language?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listSubmissions(filters: SubmissionsFilters): Promise<{
  submissions: Submission[];
  total: number;
}> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { submissions: [], total: 0 };
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("cv_submissions")
    .select("id, created_at, expires_at, file_name, file_size, language, total, band, user_id", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.q) {
    query = query.or(`file_name.ilike.%${filters.q}%,cv_text.ilike.%${filters.q}%`);
  }
  if (filters.band) {
    query = query.eq("band", filters.band);
  }
  if (filters.language) {
    query = query.eq("language", filters.language);
  }
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("[admin] listSubmissions error", error);
    return { submissions: [], total: 0 };
  }

  return {
    submissions: (data as Submission[]) ?? [],
    total: count ?? 0
  };
}
