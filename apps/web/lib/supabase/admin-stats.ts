import "server-only";

import { createServiceClient } from "./client";

export interface AdminStats {
  totalSubmissions: number;
  todaySubmissions: number;
  weekSubmissions: number;
  monthSubmissions: number;
  averageScore: number | null;
  driveFailures: number;
  openRequests: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      totalSubmissions: 0,
      todaySubmissions: 0,
      weekSubmissions: 0,
      monthSubmissions: 0,
      averageScore: null,
      driveFailures: 0,
      openRequests: 0
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalResult,
    todayResult,
    weekResult,
    monthResult,
    avgResult,
    driveFailResult,
    openRequestsResult
  ] = await Promise.all([
    supabase.from("cv_submissions").select("*", { count: "exact", head: true }),
    supabase.from("cv_submissions").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("cv_submissions").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("cv_submissions").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
    supabase.from("cv_submissions").select("total").not("total", "is", null),
    supabase.from("cv_submissions").select("*", { count: "exact", head: true }).eq("drive_status", "failed"),
    supabase.from("data_requests").select("*", { count: "exact", head: true }).eq("status", "open")
  ]);

  const avgScores = avgResult.data?.map((r) => r.total as number) ?? [];
  const averageScore = avgScores.length > 0
    ? avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length
    : null;

  return {
    totalSubmissions: totalResult.count ?? 0,
    todaySubmissions: todayResult.count ?? 0,
    weekSubmissions: weekResult.count ?? 0,
    monthSubmissions: monthResult.count ?? 0,
    averageScore,
    driveFailures: driveFailResult.count ?? 0,
    openRequests: openRequestsResult.count ?? 0
  };
}
