import { describe, expect, it } from "vitest";

import {
  decideAccess,
  isProtectedPath,
  safeNext,
  withLocale
} from "@/lib/auth/routes";

describe("isProtectedPath", () => {
  it("returns true for /analyze", () => {
    expect(isProtectedPath("/analyze")).toBe(true);
  });

  it("returns true for /analyze with trailing path", () => {
    expect(isProtectedPath("/analyze/result")).toBe(true);
  });

  it("returns true for /builder", () => {
    expect(isProtectedPath("/builder")).toBe(true);
  });

  it("returns true for /applications", () => {
    expect(isProtectedPath("/applications")).toBe(true);
  });

  it("returns true for /api/cv", () => {
    expect(isProtectedPath("/api/cv")).toBe(true);
  });

  it("returns true for /api/ghost-check", () => {
    expect(isProtectedPath("/api/ghost-check")).toBe(true);
  });

  it("returns true for /tr/analyze", () => {
    expect(isProtectedPath("/tr/analyze")).toBe(true);
  });

  it("returns true for /de/builder", () => {
    expect(isProtectedPath("/de/builder")).toBe(true);
  });

  it("returns false for /", () => {
    expect(isProtectedPath("/")).toBe(false);
  });

  it("returns false for /about", () => {
    expect(isProtectedPath("/about")).toBe(false);
  });

  it("returns false for /privacy", () => {
    expect(isProtectedPath("/privacy")).toBe(false);
  });

  it("returns false for /kvkk", () => {
    expect(isProtectedPath("/kvkk")).toBe(false);
  });

  it("returns false for /data-request", () => {
    expect(isProtectedPath("/data-request")).toBe(false);
  });

  it("returns false for /login", () => {
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("returns false for /forgot-password", () => {
    expect(isProtectedPath("/forgot-password")).toBe(false);
  });

  it("returns false for /reset-password", () => {
    expect(isProtectedPath("/reset-password")).toBe(false);
  });

  it("returns false for /r/token123", () => {
    expect(isProtectedPath("/r/token123")).toBe(false);
  });

  it("returns false for /admin", () => {
    expect(isProtectedPath("/admin")).toBe(false);
  });

  it("returns false for /tr/admin", () => {
    expect(isProtectedPath("/tr/admin")).toBe(false);
  });
});

describe("safeNext", () => {
  it("returns /analyze for null", () => {
    expect(safeNext(null)).toBe("/analyze");
  });

  it("returns /analyze for undefined", () => {
    expect(safeNext(undefined)).toBe("/analyze");
  });

  it("returns /analyze for empty string", () => {
    expect(safeNext("")).toBe("/analyze");
  });

  it("returns /analyze for //evil.com", () => {
    expect(safeNext("//evil.com")).toBe("/analyze");
  });

  it("returns /analyze for https://x", () => {
    expect(safeNext("https://x")).toBe("/analyze");
  });

  it("returns /analyze for \\x", () => {
    expect(safeNext("\\x")).toBe("/analyze");
  });

  it("returns /analyze for path without leading slash", () => {
    expect(safeNext("analyze")).toBe("/analyze");
  });

  it("returns /analyze for /admin", () => {
    expect(safeNext("/admin")).toBe("/analyze");
  });

  it("returns /analyze for /tr/admin", () => {
    expect(safeNext("/tr/admin")).toBe("/analyze");
  });

  it("keeps a protected path so a signed-in user lands on it, not back on login", () => {
    expect(safeNext("/analyze")).toBe("/analyze");
  });

  it("strips the locale prefix the redirect will add again", () => {
    expect(safeNext("/tr/analyze")).toBe("/analyze");
    expect(safeNext("/de/builder")).toBe("/builder");
  });

  it("returns a non-protected path unchanged", () => {
    expect(safeNext("/about")).toBe("/about");
  });

  it("strips the locale from a non-protected path", () => {
    expect(safeNext("/tr/about")).toBe("/about");
  });
});
