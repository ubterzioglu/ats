import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * V.10, the contrast item. The design system states the token values clear
 * 4.5:1, and calls that a claim to check rather than a measurement. This is the
 * measurement.
 *
 * It reads the shipped stylesheet rather than a copy of the numbers, so a token
 * edited in globals.css is checked here without anyone remembering to update a
 * fixture. A pair that regresses fails the suite.
 */

const CSS = readFileSync(
  resolve(__dirname, "../apps/web/app/globals.css"),
  "utf8"
);

type Rgb = readonly [number, number, number];

/** Pulls `--name: r g b;` declarations out of one rule body. */
function tokensIn(body: string): Record<string, Rgb> {
  const tokens: Record<string, Rgb> = {};
  for (const match of body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    const [, name, r, g, b] = match;
    if (name) tokens[name] = [Number(r), Number(g), Number(b)];
  }
  return tokens;
}

function ruleBody(selector: string): string {
  const start = CSS.indexOf(selector);
  if (start < 0) throw new Error(`no rule for ${selector} in globals.css`);
  const open = CSS.indexOf("{", start);
  const close = CSS.indexOf("}", open);
  return CSS.slice(open, close);
}

const LIGHT = tokensIn(ruleBody(":root {"));
const DARK = tokensIn(ruleBody(':root[data-theme="dark"] {'));

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Body text and anything below 24px. */
const TEXT = 4.5;
/** Large text and UI boundaries. */
const LARGE = 3;

interface Pair {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  readonly what: string;
}

const PAIRS: readonly Pair[] = [
  { fg: "ink", bg: "bed", min: TEXT, what: "primary text on the canvas" },
  { fg: "ink", bg: "bench", min: TEXT, what: "primary text on the work surface" },
  { fg: "ink", bg: "bench-sunk", min: TEXT, what: "primary text on a recessed surface" },
  { fg: "muted", bg: "bed", min: TEXT, what: "secondary text on the canvas" },
  { fg: "muted", bg: "bench", min: TEXT, what: "secondary text on the work surface" },
  { fg: "muted", bg: "bench-sunk", min: TEXT, what: "secondary text on a recessed surface" },
  { fg: "action", bg: "bench", min: TEXT, what: "links and actions" },
  { fg: "action", bg: "bed", min: TEXT, what: "links on the canvas" },
  { fg: "good", bg: "bench", min: TEXT, what: "a gain" },
  { fg: "good", bg: "bench-sunk", min: TEXT, what: "a gain on a recessed surface" },
  { fg: "caution", bg: "bench", min: TEXT, what: "a caution" },
  { fg: "caution", bg: "bench-sunk", min: TEXT, what: "a caution on a recessed surface" },
  { fg: "mark", bg: "bench", min: TEXT, what: "a loss" },
  { fg: "mark", bg: "bench-sunk", min: TEXT, what: "a loss on a recessed surface" },
  { fg: "live-ink", bg: "bench", min: TEXT, what: "AI text" },
  { fg: "live-ink", bg: "bench-sunk", min: TEXT, what: "AI text on a recessed surface" },
  { fg: "bench", bg: "action", min: TEXT, what: "the label on a primary button" },
  { fg: "bench", bg: "ink", min: TEXT, what: "the label on an active tab" },
  // WCAG 1.4.11 covers the boundary of a control, not a divider between
  // sections. `line` draws dividers and card edges and is deliberately quiet;
  // `edge` draws the outline of an input or button and is held to 3:1.
  { fg: "edge", bg: "bench", min: LARGE, what: "a control boundary on the work surface" },
  { fg: "edge", bg: "bench-sunk", min: LARGE, what: "a control boundary on a recessed surface" },
  { fg: "edge", bg: "bed", min: LARGE, what: "a control boundary on the canvas" },
  { fg: "action", bg: "bench", min: LARGE, what: "the focus ring" }
];

function colour(theme: Record<string, Rgb>, name: string): Rgb {
  const value = theme[name];
  if (!value) throw new Error(`globals.css defines no --${name}`);
  return value;
}

describe.each([
  ["light", LIGHT],
  ["dark", DARK]
])("%s theme contrast", (_name, theme) => {
  it("defines every token the system names", () => {
    for (const token of ["bed", "bench", "bench-sunk", "bench-raised", "ink", "muted", "line", "edge", "action", "live", "live-ink", "good", "caution", "mark"]) {
      expect(colour(theme, token)).toHaveLength(3);
    }
  });

  it.each(PAIRS)("clears $min:1 for $what ($fg on $bg)", ({ fg, bg, min }) => {
    const measured = ratio(colour(theme, fg), colour(theme, bg));
    expect(Number(measured.toFixed(2))).toBeGreaterThanOrEqual(min);
  });
});

describe("the ratio calculation", () => {
  it("agrees with the known extremes", () => {
    expect(ratio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
    expect(ratio([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
  });
});
