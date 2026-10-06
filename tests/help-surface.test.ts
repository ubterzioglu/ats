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

  it("contain no fetch, localStorage, sessionStorage or console calls", () => {
    for (const file of HELP_FILES) {
      const contents = readFileSync(join(WEB, file), "utf8");
      expect(contents).not.toMatch(/\bfetch\s*\(/);
      expect(contents).not.toMatch(/\blocalStorage\b/);
      expect(contents).not.toMatch(/\bsessionStorage\b/);
      expect(contents).not.toMatch(/\bconsole\.\w+\(/);
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
