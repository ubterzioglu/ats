"use server";

import { headers } from "next/headers";

import { saveReport } from "@/lib/supabase/reports";
import type { AnalysisResult } from "@/types/analysis";

export type ShareOutcome =
  | { readonly state: "saved"; readonly url: string }
  | { readonly state: "env-missing" }
  | { readonly state: "error" };

const MAX_FINDINGS = 60;
const MAX_TERMS = 80;

/**
 * The payload arrives from the browser, so it is re-checked here before the
 * service-role client touches the database.
 */
function isPlausibleResult(value: unknown): value is AnalysisResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<AnalysisResult>;

  if (typeof result.total !== "number" || result.total < 0 || result.total > 100) return false;
  if (typeof result.band !== "string" || result.band.length > 32) return false;
  if (typeof result.language !== "string" || result.language.length > 8) return false;
  if (!Array.isArray(result.dimensions) || result.dimensions.length > 12) return false;
  if (!Array.isArray(result.findings) || result.findings.length > MAX_FINDINGS) return false;
  if (typeof result.keywords !== "object" || result.keywords === null) return false;
  if (!Array.isArray(result.keywords.matched) || result.keywords.matched.length > MAX_TERMS) return false;
  if (!Array.isArray(result.keywords.missing) || result.keywords.missing.length > MAX_TERMS) return false;

  return true;
}

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function createShareLink(result: unknown): Promise<ShareOutcome> {
  if (!isPlausibleResult(result)) return { state: "error" };

  const outcome = await saveReport(result);
  if (outcome.state !== "saved") return outcome;

  return { state: "saved", url: `${await siteOrigin()}/r/${outcome.token}` };
}
