import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSubmissions } from "@/lib/supabase/cleanup";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredSubmissions();
    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      failed: result.failed
    });
  } catch (error) {
    console.error("[cron/cleanup] error", error);
    return NextResponse.json(
      { error: "Cleanup failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
