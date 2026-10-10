import { describe, expect, it } from "vitest";

import { canonicalHostRedirect } from "@/lib/canonical-host";

const SITE = "https://atsfreeforall.com";

function redirect(host: string | null, pathname = "/", search = "", siteUrl: string | null = SITE) {
  return canonicalHostRedirect({ host, pathname, search, siteUrl });
}

describe("canonicalHostRedirect", () => {
  it("sends the www host to the apex", () => {
    expect(redirect("www.atsfreeforall.com")).toBe("https://atsfreeforall.com/");
  });

  it("keeps the path and query", () => {
    expect(redirect("www.atsfreeforall.com", "/tr/blog", "?a=1")).toBe("https://atsfreeforall.com/tr/blog?a=1");
  });

  it("ignores case, port and a forwarded list", () => {
    expect(redirect("WWW.atsfreeforall.com:443, proxy.internal")).toBe("https://atsfreeforall.com/");
  });

  it("leaves the apex alone", () => {
    expect(redirect("atsfreeforall.com")).toBeNull();
  });

  it("leaves localhost and other hosts alone", () => {
    expect(redirect("localhost:3000")).toBeNull();
    expect(redirect("www.example.com")).toBeNull();
  });

  it("does nothing when the canonical host is itself www", () => {
    expect(redirect("www.atsfreeforall.com", "/", "", "https://www.atsfreeforall.com")).toBeNull();
  });

  it("does nothing without a usable site URL or host", () => {
    expect(redirect("www.atsfreeforall.com", "/", "", null)).toBeNull();
    expect(redirect("www.atsfreeforall.com", "/", "", "not a url")).toBeNull();
    expect(redirect(null)).toBeNull();
  });
});
