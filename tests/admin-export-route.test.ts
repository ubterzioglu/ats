import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();

vi.mock("@/lib/admin/guard", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/supabase/admin-export", () => ({
  getSubmissionsForExport: vi.fn().mockResolvedValue([]),
  submissionsToCsv: vi.fn().mockReturnValue("id\n")
}));
vi.mock("@/lib/admin/audit", () => ({ logAdminAction: vi.fn().mockResolvedValue(undefined) }));

import { GET } from "@/app/api/admin/export/route";

function request(): Parameters<typeof GET>[0] {
  return new Request("http://localhost/api/admin/export") as unknown as Parameters<typeof GET>[0];
}

describe("admin export route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the CSV for an admin", async () => {
    requireAdmin.mockResolvedValue("admin@example.com");
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
  });

  it("lets a redirect from the guard through instead of answering 500", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login?next=/admin;307;"
    });
    requireAdmin.mockRejectedValue(redirect);
    await expect(GET(request())).rejects.toBe(redirect);
  });

  it("answers 500 for an unexpected failure", async () => {
    requireAdmin.mockRejectedValue(new Error("boom"));
    const response = await GET(request());
    expect(response.status).toBe(500);
  });
});
