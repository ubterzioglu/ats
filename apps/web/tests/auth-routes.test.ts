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
    expect(safeNext(null, "en")).toBe("/analyze");
  });

  it("returns /analyze for undefined", () => {
    expect(safeNext(undefined, "en")).toBe("/analyze");
  });

  it("returns /analyze for empty string", () => {
    expect(safeNext("", "en")).toBe("/analyze");
  });

  it("returns /analyze for //evil.com", () => {
    expect(safeNext("//evil.com", "en")).toBe("/analyze");
  });

  it("returns /analyze for https://x", () => {
    expect(safeNext("https://x", "en")).toBe("/analyze");
  });

  it("returns /analyze for \\x", () => {
    expect(safeNext("\\x", "en")).toBe("/analyze");
  });

  it("returns /analyze for path without leading slash", () => {
    expect(safeNext("analyze", "en")).toBe("/analyze");
  });

  it("returns /analyze for /admin", () => {
    expect(safeNext("/admin", "en")).toBe("/analyze");
  });

  it("returns /analyze for /tr/admin", () => {
    expect(safeNext("/tr/admin", "en")).toBe("/analyze");
  });

  it("returns login path with next for /analyze", () => {
    expect(safeNext("/analyze", "en")).toBe("/login?next=%2Fanalyze");
  });

  it("returns login path with next for /tr/analyze", () => {
    expect(safeNext("/tr/analyze", "tr")).toBe("/tr/login?next=%2Ftr%2Fanalyze");
  });

  it("returns login path with next for /de/builder", () => {
    expect(safeNext("/de/builder", "de")).toBe("/de/login?next=%2Fde%2Fbuilder");
  });

  it("returns original path for non-protected path", () => {
    expect(safeNext("/about", "en")).toBe("/about");
  });

  it("returns original path for /tr/about", () => {
    expect(safeNext("/tr/about", "tr")).toBe("/tr/about");
  });
});

describe("withLocale", () => {
  it("returns path without prefix for en (default locale)", () => {
    expect(withLocale("/login", "en")).toBe("/login");
  });

  it("returns path with /tr prefix for tr", () => {
    expect(withLocale("/login", "tr")).toBe("/tr/login");
  });

  it("returns path with /de prefix for de", () => {
    expect(withLocale("/login", "de")).toBe("/de/login");
  });
});

describe("decideAccess", () => {
  it("allows when authConfigured is false", () => {
    const result = decideAccess({
      pathname: "/analyze",
      user: null,
      authConfigured: false
    });
    expect(result.action).toBe("allow");
  });

  it("allows when path is not protected", () => {
    const result = decideAccess({
      pathname: "/",
      user: null,
      authConfigured: true
    });
    expect(result.action).toBe("allow");
  });

  it("redirects to login when user is null", () => {
    const result = decideAccess({
      pathname: "/analyze",
      user: null,
      authConfigured: true
    });
    expect(result.action).toBe("redirect");
    if (result.action === "redirect") {
      expect(result.to).toBe("/login?next=%2Fanalyze");
    }
  });

  it("redirects to login when email is not confirmed", () => {
    const result = decideAccess({
      pathname: "/analyze",
      user: { email_confirmed_at: null },
      authConfigured: true
    });
    expect(result.action).toBe("redirect");
    if (result.action === "redirect") {
      expect(result.to).toBe("/login?next=%2Fanalyze");
    }
  });

  it("redirects to locale-aware login for /tr/analyze", () => {
    const result = decideAccess({
      pathname: "/tr/analyze",
      user: null,
      authConfigured: true
    });
    expect(result.action).toBe("redirect");
    if (result.action === "redirect") {
      expect(result.to).toBe("/tr/login?next=%2Ftr%2Fanalyze");
    }
  });

  it("allows when user is confirmed", () => {
    const result = decideAccess({
      pathname: "/analyze",
      user: { email_confirmed_at: "2024-01-01T00:00:00Z" },
      authConfigured: true
    });
    expect(result.action).toBe("allow");
  });
});
