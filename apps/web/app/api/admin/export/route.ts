import { unstable_rethrow } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { getSubmissionsForExport, submissionsToCsv } from "@/lib/supabase/admin-export";
import { logAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminEmail = await requireAdmin();

    // Parse filters from query params
    const { searchParams } = new URL(request.url);
    const filters = {
      q: searchParams.get("q") ?? undefined,
      band: searchParams.get("band") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined
    };

    const rows = await getSubmissionsForExport(filters);
    const csv = submissionsToCsv(rows);

    // Log export action
    await logAdminAction(adminEmail, "export");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (error) {
    // requireAdmin signals denial with a redirect or notFound; those must reach Next, not become a 500.
    unstable_rethrow(error);
    console.error("[api/admin/export] error", error);
    return NextResponse.json({ error: "export-failed" }, { status: 500 });
  }
}
