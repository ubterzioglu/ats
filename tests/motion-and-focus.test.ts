import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * V.10's motion and focus items. Both are rules that live in one stylesheet and
 * are easy to lose to an unrelated edit, so they are asserted rather than
 * remembered.
 */

const CSS = readFileSync(resolve(__dirname, "../apps/web/app/globals.css"), "utf8");

function block(selector: string): string {
  const start = CSS.indexOf(selector);
  expect(start, `globals.css has no ${selector}`).toBeGreaterThanOrEqual(0);
  return CSS.slice(start, CSS.indexOf("\n}", start) + 2);
}

describe("reduced motion", () => {
  const rule = block("@media (prefers-reduced-motion: reduce)");

  it("is declared at all", () => {
    expect(rule.length).toBeGreaterThan(0);
  });

  it("stops every animation and transition, so a new one is covered by default", () => {
    expect(rule).toMatch(/\*,/);
    expect(rule).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(rule).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(rule).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("keeps the live edge visible while stopping it moving", () => {
    // The edge says which part of the screen a model wrote. That is meaning,
    // not decoration, so reduced motion removes the sweep and keeps the edge.
    expect(rule).toMatch(/\.live-edge::after/);
    expect(rule).toMatch(/animation:\s*none/);
    expect(rule).toMatch(/linear-gradient/);
  });
});

describe("the animations that exist", () => {
  it("are the ones the system allows, and no more", () => {
    const names = [...CSS.matchAll(/@keyframes\s+([a-z-]+)/g)].map((match) => match[1]).sort();
    // live-sweep: the AI edge. meter-fill: a score bar, once. sticker-pop: the
    // landing page entrance. marquee: the quiet ticker strip. float, twinkle,
    // scroll-spin, reveal-up, reveal-side: the feature sections' idle and
    // scroll-linked motion, all inside prefers-reduced-motion: no-preference.
    // Section transitions: reveal-out and reveal-out-side hand a block off on
    // exit, drift is the picture's parallax, reveal-pop lands the closing
    // sticker, break-draw, break-travel, break-stamp and break-spark are the
    // scan between sections: beam, star head, landing pop and sparks.
    expect(names).toEqual([
      "break-draw",
      "break-spark",
      "break-stamp",
      "break-travel",
      "drift",
      "float",
      "live-sweep",
      "marquee",
      "meter-fill",
      "reveal-out",
      "reveal-out-side",
      "reveal-pop",
      "reveal-side",
      "reveal-up",
      "scroll-spin",
      "sticker-pop",
      "twinkle"
    ]);
  });

  it("keeps the feature-section motion behind no-preference", () => {
    const start = CSS.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(start).toBeGreaterThanOrEqual(0);
    const rule = CSS.slice(start, CSS.indexOf("\n}\n", start));
    for (const name of [
      "float",
      "twinkle",
      "scroll-spin",
      "reveal-up",
      "reveal-side",
      "drift",
      "reveal-pop",
      "break-draw",
      "break-travel",
      "break-stamp",
      "break-spark"
    ]) {
      expect(rule).toMatch(new RegExp(`animation:[^;]*\\b${name}\\b`));
    }
  });

  it("stops the ticker under reduced motion", () => {
    expect(block("@media (prefers-reduced-motion: reduce)")).toMatch(
      /\.marquee-track\s*\{\s*animation:\s*none/
    );
  });

  it("fills a meter exactly once", () => {
    expect(block(".meter-fill {")).toMatch(/animation:\s*meter-fill[^;]*\s1;/);
  });
});

describe("keyboard focus", () => {
  const rule = block(":focus-visible {");

  it("draws a visible ring rather than removing the outline", () => {
    expect(rule).toMatch(/outline:\s*3px solid/);
    expect(rule).toMatch(/outline-offset/);
  });

  it("is never suppressed anywhere in the stylesheet", () => {
    expect(CSS).not.toMatch(/outline:\s*(none|0)/);
  });
});
