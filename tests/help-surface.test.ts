import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const WEB = resolve(__dirname, "../apps/web");

const HELP_FILES = [
  "components/help/help-bubble.tsx",
  "components/help/scroll-top-button.tsx",
  "components/help/help-stack.tsx"
];

describe("help surfaces", () => {
  it("contain no outline:none or outline:0", () => {
    for (const file of HELP_FILES) {
      const contents = readFileSync(join(WEB, file), "utf8");
      expect(contents).not.toMatch(/outline\s*:\s*(none|0)\b/i);
    }
  });

  it("contain no fetch, localStorage or console calls", () => {
    for (const file of HELP_FILES) {
      const contents = readFileSync(join(WEB, file), "utf8");
      expect(contents).not.toMatch(/\bfetch\s*\(/);
      expect(contents).not.toMatch(/\blocalStorage\b/);
      expect(contents).not.toMatch(/\bconsole\.\w+\(/);
    }
  });

  // C5: feedback counts and unanswered questions live in sessionStorage only,
  // in the bubble only, and every access sits behind one guarded accessor.
  it("touch sessionStorage only from the bubble, through a try/catch accessor", () => {
    for (const file of HELP_FILES) {
      const contents = readFileSync(join(WEB, file), "utf8");
      const uses = contents.match(/\bsessionStorage\b/g) ?? [];
      if (file !== "components/help/help-bubble.tsx") {
        expect(uses).toEqual([]);
        continue;
      }
      expect(uses).toHaveLength(1);
      expect(contents).toMatch(/try\s*\{\s*return window\.sessionStorage;\s*\}\s*catch/);
    }
  });

  it("contain no new @keyframes", () => {
    const css = readFileSync(join(WEB, "app/globals.css"), "utf8");
    const keyframes = css.match(/@keyframes\s+[\w-]+/g) ?? [];
    const allowed = new Set([
      "@keyframes live-sweep",
      "@keyframes meter-fill",
      "@keyframes sticker-pop",
      "@keyframes marquee",
      "@keyframes float",
      "@keyframes twinkle",
      "@keyframes scroll-spin",
      "@keyframes reveal-up",
      "@keyframes reveal-out",
      "@keyframes reveal-out-side",
      "@keyframes drift",
      "@keyframes reveal-pop",
      "@keyframes break-draw",
      "@keyframes sheen",
      "@keyframes break-travel",
      "@keyframes break-stamp",
      "@keyframes break-spark",
      "@keyframes reveal-side",
      "@keyframes credit-sweep"
    ]);
    for (const kf of keyframes) {
      expect(allowed.has(kf), `unexpected @keyframes: ${kf}`).toBe(true);
    }
  });
});
