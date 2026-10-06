import { describe, expect, it } from "vitest";

import { shouldShowScrollTop } from "@/lib/scroll-top";

describe("shouldShowScrollTop", () => {
  it("returns false when scrollY is below one viewport height", () => {
    expect(shouldShowScrollTop(0, 800)).toBe(false);
    expect(shouldShowScrollTop(400, 800)).toBe(false);
    expect(shouldShowScrollTop(799, 800)).toBe(false);
  });

  it("returns true when scrollY equals or exceeds one viewport height", () => {
    expect(shouldShowScrollTop(800, 800)).toBe(true);
    expect(shouldShowScrollTop(1200, 800)).toBe(true);
    expect(shouldShowScrollTop(5000, 800)).toBe(true);
  });

  it("uses the viewport height as the threshold", () => {
    expect(shouldShowScrollTop(599, 600)).toBe(false);
    expect(shouldShowScrollTop(600, 600)).toBe(true);
    expect(shouldShowScrollTop(100, 100)).toBe(true);
  });

  it("returns false when viewport height is zero to avoid division by zero", () => {
    expect(shouldShowScrollTop(0, 0)).toBe(false);
    expect(shouldShowScrollTop(1000, 0)).toBe(false);
  });

  it("handles negative scrollY gracefully", () => {
    expect(shouldShowScrollTop(-1, 800)).toBe(false);
  });
});
