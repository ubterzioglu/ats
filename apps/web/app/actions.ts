"use server";

import { headers } from "next/headers";

import { isPlausibleResult } from "@/lib/analysis-guard";
import { saveReport } from "@/lib/supabase/reports";
import { createClient } from "@/lib/supabase/server";
import type { AnalysisResult } from "@/types/analysis";

export type ShareOutcome =
  | { readonly state: "saved"; readonly url: string }
  | { readonly state: "auth-required" }
  | { readonly state: "env-missing" }
  | { readonly state: "error" };

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Analysis is open to everyone; writing a report to the server is not. The
 * middleware no longer gates `/analyze`, so the sign-in requirement for sharing
 * is enforced here, at the boundary that actually touches the database.
 */
async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user !== null;
  } catch {
    return false;
  }
}

export async function createShareLink(result: unknown): Promise<ShareOutcome> {
  if (!isPlausibleResult(result)) return { state: "error" };
  if (!(await isSignedIn())) return { state: "auth-required" };

  const outcome = await saveReport(result);
  if (outcome.state !== "saved") return outcome;

  return { state: "saved", url: `${await siteOrigin()}/r/${outcome.token}` };
}
