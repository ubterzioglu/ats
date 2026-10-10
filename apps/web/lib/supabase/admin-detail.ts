import "server-only";

import { createServiceClient } from "./client";
import type { AnalysisResult } from "@/types/analysis";

export interface SubmissionDetail {
  id: string;
  created_at: string;
  expires_at: string;
  file_name: string | null;
  file_size: number | null;
  language: string | null;
  total: number | null;
  band: string | null;
  storage_path: string | null;
  cv_text: string;
  job_description: string | null;
  result: AnalysisResult | null;
}

export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cv_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[admin] getSubmissionDetail error", error);
    return null;
  }

  return data as SubmissionDetail;
}
