import "server-only";

import { headers } from "next/headers";
import type { AnalysisResult } from "@/types/analysis";
import { LEGAL_VERSION } from "@/lib/legal-entity";
import { isPlausibleResult } from "@/lib/analysis-guard";
import { validateFile, cvTextSchema } from "@/lib/cv-submission/validate";
import { MAX_CV_BYTES, RATE_LIMIT_PER_HOUR } from "@/lib/cv-submission/limits";
import { clientHash } from "@/lib/cv-submission/client-hash";
import { insertSubmission, markDriveStatus, countRecentByClient } from "@/lib/supabase/submissions";
import { uploadCvFile } from "@/lib/supabase/storage";
import { uploadToDrive } from "@/lib/drive/client";
import { getSupabaseEnv } from "@/lib/supabase/client";

interface SubmissionPorts {
  readonly insertSubmission: typeof insertSubmission;
  readonly uploadCvFile: typeof uploadCvFile;
  readonly uploadToDrive: typeof uploadToDrive;
  readonly markDriveStatus: typeof markDriveStatus;
  readonly countRecentByClient: typeof countRecentByClient;
}

export type HandleSubmissionInput = {
  readonly file?: { readonly name: string; readonly bytes: Uint8Array; readonly mime: string };
  readonly cvText: string;
  readonly jobDescription?: string;
  readonly result: unknown;
  readonly consent: string;
  readonly consentVersion: string;
  readonly ip: string | null;
};

export type HandleSubmissionOutcome =
  | { readonly ok: true; readonly id: string; readonly expiresAt: string }
  | { readonly ok: false; readonly status: 400 | 413 | 415 | 429 | 502 | 503; readonly error: string };

async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headersList.get("x-real-ip");
}

export async function handleSubmission(
  input: HandleSubmissionInput,
  ports: SubmissionPorts = {
    insertSubmission,
    uploadCvFile,
    uploadToDrive,
    markDriveStatus,
    countRecentByClient
  }
): Promise<HandleSubmissionOutcome> {
  // 1. Validate consent
  if (input.consent !== "true" || input.consentVersion !== LEGAL_VERSION) {
    return { ok: false, status: 400, error: "consent-mismatch" };
  }

  // 2. Validate result
  if (!isPlausibleResult(input.result)) {
    return { ok: false, status: 400, error: "invalid-result" };
  }
  const result = input.result as AnalysisResult;

  // 3. Validate text fields
  const textValidation = cvTextSchema.safeParse({
    cvText: input.cvText,
    jobDescription: input.jobDescription
  });
  if (!textValidation.success) {
    return { ok: false, status: 400, error: "invalid-text" };
  }

  // 4. Validate file if present
  let fileBytes: Uint8Array;
  let fileName: string | undefined;
  let fileMime: string | undefined;
  let fileSize: number | undefined;

  if (input.file) {
    const validation = validateFile(input.file.name, input.file.bytes);
    if (!validation.ok) {
      if (validation.reason === "oversize") {
        return { ok: false, status: 413, error: "file-too-large" };
      }
      if (validation.reason === "magic" || validation.reason === "encoding") {
        return { ok: false, status: 415, error: "invalid-file-type" };
      }
      return { ok: false, status: 400, error: validation.reason };
    }
    fileBytes = input.file.bytes;
    fileName = input.file.name;
    fileMime = input.file.mime;
    fileSize = input.file.bytes.length;
  } else {
    // Text-only submission
    const encoder = new TextEncoder();
    fileBytes = encoder.encode(input.cvText);
    if (fileBytes.length > MAX_CV_BYTES) {
      return { ok: false, status: 413, error: "text-too-large" };
    }
  }

  // 5. Rate limit
  const hash = clientHash(input.ip);
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const recentCount = await ports.countRecentByClient(hash, oneHourAgo);
  if (recentCount >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, status: 429, error: "rate-limit-exceeded" };
  }

  // 6. Check Supabase is configured
  if (!getSupabaseEnv()) {
    return { ok: false, status: 503, error: "storage-unavailable" };
  }

  // 7. Insert row to get ID
  const insertResult = await ports.insertSubmission({
    clientHash: hash ?? undefined,
    fileName,
    fileMime,
    fileSize,
    cvText: input.cvText,
    jobDescription: input.jobDescription,
    language: result.language,
    total: result.total,
    band: result.band,
    result,
    consentVersion: input.consentVersion
  });

  if (!insertResult.ok) {
    return { ok: false, status: 502, error: "insert-failed" };
  }

  const submissionId = insertResult.id;
  const expiresAt = insertResult.expiresAt;

  // 8. Upload file to storage
  const ext = fileName?.split(".").pop() ?? "txt";
  const storagePath = `${new Date().toISOString().slice(0, 7).replace("-", "/")}/${submissionId}.${ext}`;
  
  const uploadResult = await ports.uploadCvFile(storagePath, fileBytes, fileMime ?? "text/plain");
  if (!uploadResult.ok) {
    // Rollback: delete the row (we don't have a delete function yet, so just return error)
    return { ok: false, status: 502, error: "storage-upload-failed" };
  }

  // 9. Upload to Drive (fire-and-forget, don't fail the request)
  const driveResult = await ports.uploadToDrive({
    name: `${submissionId}.${ext}`,
    mime: fileMime ?? "text/plain",
    bytes: fileBytes
  });

  if (driveResult.ok) {
    await ports.markDriveStatus(submissionId, "uploaded", driveResult.fileId);
  } else if (driveResult.reason === "env-missing") {
    await ports.markDriveStatus(submissionId, "skipped");
  } else {
    await ports.markDriveStatus(submissionId, "failed");
  }

  return { ok: true, id: submissionId, expiresAt };
}

export { getClientIp };
