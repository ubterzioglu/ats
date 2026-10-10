import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

async function headersFor(source: string): Promise<ReadonlyArray<{ key: string; value: string }>> {
  const rules = (await nextConfig.headers?.()) ?? [];
  return rules.find((rule) => rule.source === source)?.headers ?? [];
}

describe("next.config headers", () => {
  it("marks /_next/static assets noindex", async () => {
    expect(await headersFor("/_next/static/:path*")).toContainEqual({ key: "X-Robots-Tag", value: "noindex" });
  });

  it("does not send noindex on pages", async () => {
    const pageHeaders = await headersFor("/(.*)");
    expect(pageHeaders.map((h) => h.key)).toContain("X-Frame-Options");
    expect(pageHeaders.map((h) => h.key)).not.toContain("X-Robots-Tag");
  });
});
