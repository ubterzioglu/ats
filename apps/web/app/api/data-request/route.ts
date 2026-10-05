import { NextRequest, NextResponse } from "next/server";
import { submitDataRequest, dataRequestSchema } from "@/lib/supabase/data-request";
import { clientHash } from "@/lib/cv-submission/client-hash";

export const dynamic = "force-dynamic";

const MAX_REQUEST_SIZE = 32 * 1024; // 32 KiB
const DATA_REQUEST_RATE_LIMIT = 5; // per hour

export async function POST(request: NextRequest) {
  try {
    // A3: Check content-length before parsing
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "request-too-large" }, { status: 413 });
    }

    const body = await request.json();
    
    // A7: Check honeypot
    if (body.website && typeof body.website === "string" && body.website.trim() !== "") {
      // Return success to not reveal the honeypot
      return NextResponse.json({ success: true, id: "honeypot" });
    }

    // A7: Validate input with stricter schema
    const validation = dataRequestSchema.safeParse(body);
    if (!validation.success) {
      // A7: Hide validation details
      return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    }

    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? null : request.headers.get("x-real-ip");
    const hash = clientHash(ip);

    // A4: Check salt in production
    if (!process.env.CLIENT_HASH_SALT && process.env.NODE_ENV === "production") {
      console.error("[api/data-request] CLIENT_HASH_SALT not set in production");
      return NextResponse.json({ error: "storage-unavailable" }, { status: 503 });
    }

    // A7: Rate limit check
    if (hash) {
      const { countRecentDataRequests } = await import("@/lib/supabase/data-request");
      const recentCount = await countRecentDataRequests(hash);
      if (recentCount >= DATA_REQUEST_RATE_LIMIT) {
        return NextResponse.json({ error: "rate-limit-exceeded" }, { status: 429 });
      }
    }

    // Submit request
    const result = await submitDataRequest(validation.data, hash);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("[api/data-request] error", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
