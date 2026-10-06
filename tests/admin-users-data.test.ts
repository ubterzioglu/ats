import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AuthUserLister, getUserDirectory } from "@/lib/supabase/admin-users";

type ListUsers = AuthUserLister["auth"]["admin"]["listUsers"];

function lister(listUsers: ListUsers): AuthUserLister {
  return { auth: { admin: { listUsers } } };
}

const RAW_USER = {
  id: "u1",
  email: "a@example.com",
  phone: "+4900000000",
  created_at: "2026-03-01T00:00:00Z",
  last_sign_in_at: "2026-03-02T00:00:00Z",
  email_confirmed_at: "2026-03-01T00:05:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Should Not Appear" },
  identities: [{ provider: "email", identity_data: { email: "a@example.com" } }]
};

describe("getUserDirectory", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("returns an empty directory when there is no service client", async () => {
    expect(await getUserDirectory(null)).toEqual({ users: [], truncated: false });
  });

  it("returns an empty directory and logs when the Auth admin API errors", async () => {
    const listUsers = vi.fn<ListUsers>().mockResolvedValue({ data: { users: [] }, error: new Error("denied") });
    expect(await getUserDirectory(lister(listUsers))).toEqual({ users: [], truncated: false });
    expect(consoleError).toHaveBeenCalled();
  });

  it("returns an empty directory and logs when the call throws", async () => {
    const listUsers = vi.fn<ListUsers>().mockRejectedValue(new Error("network"));
    expect(await getUserDirectory(lister(listUsers))).toEqual({ users: [], truncated: false });
    expect(consoleError).toHaveBeenCalled();
  });

  it("maps users to the listed fields only, newest first", async () => {
    const older = { ...RAW_USER, id: "u0", created_at: "2025-01-01T00:00:00Z" };
    const listUsers = vi.fn<ListUsers>().mockResolvedValue({ data: { users: [older, RAW_USER] }, error: null });

    const directory = await getUserDirectory(lister(listUsers));

    expect(listUsers).toHaveBeenCalledTimes(1);
    expect(directory.truncated).toBe(false);
    expect(directory.users.map((u) => u.id)).toEqual(["u1", "u0"]);
    expect(directory.users[0]).toEqual({
      id: "u1",
      email: "a@example.com",
      providers: ["email"],
      createdAt: "2026-03-01T00:00:00Z",
      lastSignInAt: "2026-03-02T00:00:00Z",
      emailConfirmed: true
    });
    expect(Object.keys(directory.users[0] ?? {}).sort()).toEqual(
      ["createdAt", "email", "emailConfirmed", "id", "lastSignInAt", "providers"].sort()
    );
  });

  it("reads further pages while a page comes back full", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ ...RAW_USER, id: `p1-${i}` }));
    const listUsers = vi
      .fn<ListUsers>()
      .mockResolvedValueOnce({ data: { users: full }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ ...RAW_USER, id: "p2-0" }] }, error: null });

    const directory = await getUserDirectory(lister(listUsers));

    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
    expect(directory.users).toHaveLength(1001);
    expect(directory.truncated).toBe(false);
  });
});
