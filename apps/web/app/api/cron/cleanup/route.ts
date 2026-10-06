import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { cleanupExpiredSubmissions } from "@/lib/supabase/cleanup";

export const dynamic = "force-dynamic";

function verifySecret(authHeader: string | null, expectedSecret: string): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const provided = authHeader.slice(7);
  if (provided.length !== expectedSecret.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expectedSecret));
}

async function handleCleanup() {
  // A6: Check CRON_SECRET
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/cleanup] CRON_SECRET not configured");
    return NextResponse.json({ error: "storage-unavailable" }, { status: 503 });
  }

  try {
    const result = await cleanupExpiredSubmissions();
    return NextResponse.json({
      success: true,
      purged: result.deleted,
      failed: result.failed
    });
  } catch (error) {
    // A6: Don't leak error details
    console.error("[cron/cleanup] error", error);
    return NextResponse.json({ error: "cleanup-failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "storage-unavailable" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!verifySecret(authHeader, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleCleanup();
}

// A6: Accept GET as well
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "storage-unavailable" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!verifySecret(authHeader, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handleCleanup();
}
