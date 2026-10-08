import { NextRequest, NextResponse } from "next/server";

import { clientHash } from "@/lib/cv-submission/client-hash";
import { feedbackSchema } from "@/lib/feedback-schema";
import { countRecentFeedback, submitFeedback } from "@/lib/supabase/feedback";

export const dynamic = "force-dynamic";

const MAX_REQUEST_SIZE = 16 * 1024;
const FEEDBACK_RATE_LIMIT = 5; // per hour

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "request-too-large" }, { status: 413 });
    }

    const body: unknown = await request.json();

    // A filled honeypot gets a success so a bot learns nothing.
    if (
      typeof body === "object" &&
      body !== null &&
      "website" in body &&
      typeof body.website === "string" &&
      body.website.trim() !== ""
    ) {
      return NextResponse.json({ success: true, id: "honeypot" });
    }

    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    }

    if (!process.env.CLIENT_HASH_SALT && process.env.NODE_ENV === "production") {
      console.error("[api/feedback] CLIENT_HASH_SALT not set in production");
      return NextResponse.json({ error: "storage-unavailable" }, { status: 503 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? null) : request.headers.get("x-real-ip");
    const hash = clientHash(ip);

    if (hash) {
      const recent = await countRecentFeedback(hash);
      if (recent >= FEEDBACK_RATE_LIMIT) {
        return NextResponse.json({ error: "rate-limit-exceeded" }, { status: 429 });
      }
    }

    const result = await submitFeedback(validation.data, hash);
    if (!result.ok) {
      const status = result.error === "storage-unavailable" ? 503 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("[api/feedback] error", error);
    return NextResponse.json({ error: "request-failed" }, { status: 500 });
  }
}
