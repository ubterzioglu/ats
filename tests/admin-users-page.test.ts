import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const logAdminAction = vi.fn();
const getUserDirectory = vi.fn();

vi.mock("@/lib/admin/guard", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/admin/audit", () => ({
  logAdminAction: (...args: unknown[]) => logAdminAction(...args)
}));
vi.mock("@/lib/supabase/admin-users", () => ({ getUserDirectory: () => getUserDirectory() }));

import { loadUserDirectoryPage } from "@/lib/admin/user-directory-page";

function directoryUser(id: string, createdAt: string) {
  return { id, email: `${id}@example.com`, providers: ["email"], createdAt, lastSignInAt: null, emailConfirmed: true };
}

describe("admin user directory page", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    logAdminAction.mockReset().mockResolvedValue(undefined);
    getUserDirectory.mockReset().mockResolvedValue({ users: [], truncated: false });
  });

  it("lets the guard's redirect or 404 through without reading or logging", async () => {
    const notFound = Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;404"), {
      digest: "NEXT_HTTP_ERROR_FALLBACK;404"
    });
    requireAdmin.mockRejectedValue(notFound);

    await expect(loadUserDirectoryPage(undefined)).rejects.toBe(notFound);
    expect(getUserDirectory).not.toHaveBeenCalled();
    expect(logAdminAction).not.toHaveBeenCalled();
  });

  it("writes a user_list audit entry for every admin view, with the clamped page", async () => {
    requireAdmin.mockResolvedValue("admin@example.com");

    const view = await loadUserDirectoryPage("7");

    expect(view.page).toBe(1);
    expect(logAdminAction).toHaveBeenCalledWith("admin@example.com", "user_list", undefined, "page=1");
  });

  it("returns counts for every user and rows for the requested page only", async () => {
    requireAdmin.mockResolvedValue("admin@example.com");
    const users = Array.from({ length: 60 }, (_, i) =>
      directoryUser(`u${i}`, new Date(Date.UTC(2026, 0, 60 - i)).toISOString())
    );
    getUserDirectory.mockResolvedValue({ users, truncated: false });

    const view = await loadUserDirectoryPage("2");

    expect(view.counts.total).toBe(60);
    expect(view.pages).toBe(2);
    expect(view.page).toBe(2);
    expect(view.rows.map((row) => row.id)).toEqual(users.slice(50).map((user) => user.id));
  });
});
