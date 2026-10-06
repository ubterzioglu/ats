import { describe, expect, it } from "vitest";

import { publicOrigin } from "@/lib/auth/origin";

const SITE = "https://atsfreeforall.com";

describe("publicOrigin", () => {
  it("uses the forwarded host and protocol behind the proxy", () => {
    expect(
      publicOrigin({
        url: "https://0.0.0.0:3000/auth/confirm",
        forwardedHost: "atsfreeforall.com",
        forwardedProto: "https",
        siteUrl: SITE
      })
    ).toBe("https://atsfreeforall.com");
  });

  it("falls back to the site URL when the request host is 0.0.0.0", () => {
    expect(publicOrigin({ url: "https://0.0.0.0:3000/auth/confirm", siteUrl: SITE })).toBe(SITE);
  });

  it("ignores an unroutable forwarded host", () => {
    expect(
      publicOrigin({ url: "https://0.0.0.0:3000/x", forwardedHost: "0.0.0.0:3000", siteUrl: SITE })
    ).toBe(SITE);
  });

  it("keeps localhost during local development", () => {
    expect(publicOrigin({ url: "http://localhost:3000/auth/confirm", siteUrl: SITE })).toBe(
      "http://localhost:3000"
    );
  });

  it("uses the first value of a comma-separated forwarded host", () => {
    expect(
      publicOrigin({
        url: "http://0.0.0.0:3000/x",
        forwardedHost: "atsfreeforall.com, internal",
        forwardedProto: "https, http"
      })
    ).toBe("https://atsfreeforall.com");
  });

  it("returns the request origin when nothing better exists", () => {
    expect(publicOrigin({ url: "https://0.0.0.0:3000/x" })).toBe("https://0.0.0.0:3000");
  });
});
