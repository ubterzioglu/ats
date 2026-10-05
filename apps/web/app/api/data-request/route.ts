import { NextRequest, NextResponse } from "next/server";
import { submitDataRequest, dataRequestSchema } from "@/lib/supabase/data-request";
import { clientHash } from "@/lib/cv-submission/client-hash";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = dataRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0]?.trim() ?? null : request.headers.get("x-real-ip");
    const hash = clientHash(ip);

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
