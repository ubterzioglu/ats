import "server-only";

import { createServiceClient } from "./client";

export interface SubmissionRow {
  id: string;
  created_at: string;
  expires_at: string;
  language: string | null;
  total: number | null;
  band: string | null;
  file_size: number | null;
}

export async function getSubmissionsForExport(filters?: {
  q?: string;
  band?: string;
  language?: string;
  from?: string;
  to?: string;
}): Promise<SubmissionRow[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("cv_submissions")
    .select("id, created_at, expires_at, language, total, band, file_size")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (filters?.q) {
    query = query.or(`file_name.ilike.%${filters.q}%,cv_text.ilike.%${filters.q}%`);
  }
  if (filters?.band) {
    query = query.eq("band", filters.band);
  }
  if (filters?.language) {
    query = query.eq("language", filters.language);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin] getSubmissionsForExport error", error);
    return [];
  }

  return (data as SubmissionRow[]) ?? [];
}

export function escapeCsvCell(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // CSV injection protection: prefix cells starting with =, +, -, @ with '
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function submissionsToCsv(rows: SubmissionRow[]): string {
  const headers = ["id", "created_at", "expires_at", "language", "total", "band", "file_size"];
  const lines = [headers.join(",")];

  for (const row of rows) {
    const cells = [
      escapeCsvCell(row.id),
      escapeCsvCell(row.created_at),
      escapeCsvCell(row.expires_at),
      escapeCsvCell(row.language),
      escapeCsvCell(row.total),
      escapeCsvCell(row.band),
      escapeCsvCell(row.file_size)
    ];
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

export interface ProfileExportRow {
  user_id: string;
  created_at: string;
  updated_at: string;
  resume: string;
  extras: string;
}

export async function getProfileForExport(userId: string): Promise<ProfileExportRow | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, created_at, updated_at, resume, extras")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    if (error?.code !== "PGRST116") {
      console.error("[admin] getProfileForExport error", error);
    }
    return null;
  }

  return {
    user_id: data.user_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    resume: JSON.stringify(data.resume),
    extras: JSON.stringify(data.extras)
  };
}
