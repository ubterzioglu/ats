import "server-only";

import { restoreSharedReport } from "@/lib/report/restore";
import type { AnalysisResult } from "@/types/analysis";

import { createServiceClient } from "./client";

const TABLE = "ats_reports";
const RETENTION_DAYS = 30;

export type SaveReportOutcome =
  | { readonly state: "saved"; readonly token: string }
  | { readonly state: "env-missing" }
  | { readonly state: "error" };

export type LoadReportOutcome =
  | { readonly state: "found"; readonly report: AnalysisResult }
  | { readonly state: "not-found" }
  | { readonly state: "env-missing" }
  | { readonly state: "error" };

function newToken(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/**
 * Drops anything that could carry text lifted from the CV. A shared link holds
 * scores and advice, never the document.
 */
function stripEvidence(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    findings: result.findings.map(({ evidence: _evidence, ...finding }) => finding)
  };
}

export async function saveReport(result: AnalysisResult, userId?: string): Promise<SaveReportOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { state: "env-missing" };

  const token = newToken();
  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 86_400_000).toISOString();

  try {
    const { error } = await supabase.from(TABLE).insert({
      token,
      user_id: userId,
      total: result.total,
      band: result.band,
      language: result.language,
      payload: stripEvidence(result),
      expires_at: expiresAt
    });

    if (error) {
      console.error("[reports] insert failed", error.message);
      return { state: "error" };
    }

    return { state: "saved", token };
  } catch (cause) {
    console.error("[reports] insert threw", cause);
    return { state: "error" };
  }
}

export async function loadReport(token: string): Promise<LoadReportOutcome> {
  if (!/^[a-f0-9]{16}$/.test(token)) return { state: "not-found" };

  const supabase = createServiceClient();
  if (!supabase) return { state: "env-missing" };

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("payload, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("[reports] select failed", error.message);
      return { state: "error" };
    }

    if (!data) return { state: "not-found" };
    if (new Date(String(data.expires_at)).getTime() < Date.now()) return { state: "not-found" };

    // The row was written by whatever version was running that day, so it is
    // rebuilt rather than cast. A row too damaged to rebuild reads as gone.
    const report = restoreSharedReport(data.payload);
    if (!report) return { state: "not-found" };

    return { state: "found", report };
  } catch (cause) {
    console.error("[reports] select threw", cause);
    return { state: "error" };
  }
}
