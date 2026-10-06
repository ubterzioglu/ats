import { describe, expect, it } from "vitest";

import {
  clampPage,
  countUsers,
  type DirectoryUser,
  detectProviders,
  pageCount,
  pageSlice,
  sortNewestFirst,
  toDirectoryUser
} from "@/lib/admin/user-directory";

function user(overrides: Partial<DirectoryUser> = {}): DirectoryUser {
  return {
    id: "u1",
    email: "a@example.com",
    providers: ["email"],
    createdAt: "2026-01-01T00:00:00Z",
    lastSignInAt: null,
    emailConfirmed: true,
    ...overrides
  };
}

describe("detectProviders", () => {
  it("reads app_metadata.providers and normalises case", () => {
    expect(detectProviders({ providers: ["Google", "email"] }, [])).toEqual(["email", "google"]);
  });

  it("falls back to app_metadata.provider and identities, without duplicates", () => {
    expect(detectProviders({ provider: "email" }, [{ provider: "google" }, { provider: "email" }])).toEqual([
      "email",
      "google"
    ]);
  });

  it("returns an empty list for missing or malformed metadata", () => {
    expect(detectProviders(null, null)).toEqual([]);
    expect(detectProviders({ providers: [1, null] }, [{ nope: true }, "x"])).toEqual([]);
  });
});

describe("toDirectoryUser", () => {
  it("keeps only the listed fields", () => {
    const mapped = toDirectoryUser({
      id: "u9",
      email: "x@example.com",
      created_at: "2026-02-01T00:00:00Z",
      last_sign_in_at: "2026-02-02T00:00:00Z",
      email_confirmed_at: "2026-02-01T01:00:00Z",
      app_metadata: { provider: "google", providers: ["google"] },
      identities: [{ provider: "google", identity_data: { full_name: "Secret Name" } }],
      ...({ phone: "+490000", user_metadata: { cv: "text" } } as object)
    });

    expect(mapped).toEqual({
      id: "u9",
      email: "x@example.com",
      providers: ["google"],
      createdAt: "2026-02-01T00:00:00Z",
      lastSignInAt: "2026-02-02T00:00:00Z",
      emailConfirmed: true
    });
  });

  it("marks a user without email_confirmed_at as unconfirmed and a missing sign-in as null", () => {
    const mapped = toDirectoryUser({ id: "u2", created_at: "2026-01-01T00:00:00Z" });
    expect(mapped.emailConfirmed).toBe(false);
    expect(mapped.lastSignInAt).toBeNull();
    expect(mapped.email).toBeNull();
  });
});

describe("countUsers", () => {
  it("counts total, confirmed, email and google", () => {
    const counts = countUsers([
      user({ id: "1", providers: ["email"], emailConfirmed: true }),
      user({ id: "2", providers: ["google"], emailConfirmed: true }),
      user({ id: "3", providers: ["email", "google"], emailConfirmed: false }),
      user({ id: "4", providers: [], emailConfirmed: false })
    ]);
    expect(counts).toEqual({ total: 4, confirmed: 2, email: 2, google: 2 });
  });

  it("is all zeros for no users", () => {
    expect(countUsers([])).toEqual({ total: 0, confirmed: 0, email: 0, google: 0 });
  });
});

describe("sortNewestFirst", () => {
  it("orders by created date, newest first, without mutating the input", () => {
    const input = [
      user({ id: "old", createdAt: "2025-01-01T00:00:00Z" }),
      user({ id: "new", createdAt: "2026-06-01T00:00:00Z" })
    ];
    expect(sortNewestFirst(input).map((u) => u.id)).toEqual(["new", "old"]);
    expect(input.map((u) => u.id)).toEqual(["old", "new"]);
  });
});

describe("pagination", () => {
  it("has at least one page", () => {
    expect(pageCount(0, 50)).toBe(1);
    expect(pageCount(50, 50)).toBe(1);
    expect(pageCount(51, 50)).toBe(2);
  });

  it("clamps the requested page into range", () => {
    expect(clampPage(undefined, 120, 50)).toBe(1);
    expect(clampPage("2", 120, 50)).toBe(2);
    expect(clampPage("99", 120, 50)).toBe(3);
    expect(clampPage("0", 120, 50)).toBe(1);
    expect(clampPage("-3", 120, 50)).toBe(1);
    expect(clampPage("abc", 120, 50)).toBe(1);
    expect(clampPage("1.5", 120, 50)).toBe(1);
    expect(clampPage(["3", "1"], 120, 50)).toBe(3);
    expect(clampPage("5", 0, 50)).toBe(1);
  });

  it("slices the requested page", () => {
    const users = Array.from({ length: 5 }, (_, i) => user({ id: String(i) }));
    expect(pageSlice(users, 2, 2).map((u) => u.id)).toEqual(["2", "3"]);
    expect(pageSlice(users, 3, 2).map((u) => u.id)).toEqual(["4"]);
  });
});
