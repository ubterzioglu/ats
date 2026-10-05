import { NextRequest, NextResponse } from "next/server";
import { handleSubmission, getClientIp } from "@/lib/cv-submission/handle";
import { MAX_CV_BYTES } from "@/lib/cv-submission/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_SIZE = MAX_CV_BYTES + 1024 * 1024; // 1 MiB overhead for form data

export async function POST(request: NextRequest) {
  try {
    // A3: Check content-length before parsing
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "request-too-large" }, { status: 413 });
    }

    const formData = await request.formData();

    // Extract fields
    const file = formData.get("file");
    const cvText = formData.get("cvText");
    const jobDescription = formData.get("jobDescription");
    const resultJson = formData.get("result");
    const consent = formData.get("consent");
    const consentVersion = formData.get("consentVersion");

    // Validate required fields
    if (typeof cvText !== "string") {
      return NextResponse.json({ error: "cvText-required" }, { status: 400 });
    }
    if (typeof resultJson !== "string") {
      return NextResponse.json({ error: "result-required" }, { status: 400 });
    }
    if (typeof consent !== "string" || typeof consentVersion !== "string") {
      return NextResponse.json({ error: "consent-required" }, { status: 400 });
    }

    // Parse result JSON
    let result: unknown;
    try {
      result = JSON.parse(resultJson);
    } catch {
      return NextResponse.json({ error: "invalid-result-json" }, { status: 400 });
    }

    // Prepare file if present
    let fileData: { name: string; bytes: Uint8Array; mime: string } | undefined;
    if (file instanceof File && file.size > 0) {
      // A3: Check file size before reading
      if (file.size > MAX_CV_BYTES) {
        return NextResponse.json({ error: "file-too-large" }, { status: 413 });
      }
      const arrayBuffer = await file.arrayBuffer();
      fileData = {
        name: file.name,
        bytes: new Uint8Array(arrayBuffer),
        mime: file.type || "application/octet-stream"
      };
    }

    // Call handler
    const outcome = await handleSubmission({
      file: fileData,
      cvText,
      jobDescription: typeof jobDescription === "string" ? jobDescription : undefined,
      result,
      consent,
      consentVersion,
      ip: await getClientIp()
    });

    if (!outcome.ok) {
      const headers: Record<string, string> = {};
      if (outcome.status === 429) {
        headers["Retry-After"] = "3600";
      }
      return NextResponse.json({ error: outcome.error }, { status: outcome.status, headers });
    }

    return NextResponse.json(
      { ok: true, id: outcome.id, expiresAt: outcome.expiresAt },
      { status: 200 }
    );
  } catch (error) {
    console.error("[api/cv] unexpected error", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
