import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * V.10's last item, and the system's most important constraint: `live` means
 * AI-produced output or AI-working state, and nothing else. If it reaches a
 * focus ring or a highlight, the role split stops teaching anything and the one
 * bold element in the product is spent.
 *
 * That rule cannot survive on good intentions across a growing component tree,
 * so it is a test. A new use of `live` fails here until it is either an AI
 * surface or listed with a reason.
 */

const WEB = resolve(__dirname, "../apps/web");

/** Files allowed to render `live`, each because it renders model output. */
const AI_SURFACES: ReadonlySet<string> = new Set([
  // The dock: live edge while the model works, live-ink on the model's turn.
  "components/bench/ask-dock.tsx",
  // A work item: live edge around a draft a model wrote, never a rule draft.
  "components/bench/work-item.tsx",
  // The keyword panel's coverage section, which a model produces.
  "components/keyword-panel.tsx",
  // The cover letter: live edge while the model drafts, and around the draft.
  "components/tailor/cover-letter-panel.tsx",
  // Ad-specific interview questions: live edge while the model generates.
  "components/interview/ad-questions-panel.tsx"
]);

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "reference") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

/**
 * Only the class names that paint with the colour. Matching the bare word
 * would catch `aria-live`, a `draftIsLive` prop and the word "live" in a
 * sentence, none of which paint anything.
 */
const LIVE_CLASS =
  /\blive-edge\b|\b(?:text|bg|border|from|via|to|ring|shadow|decoration|outline|fill|stroke|divide|caret|placeholder|accent)-live(?:-ink)?\b/;

function usesLive(contents: string): boolean {
  return LIVE_CLASS.test(contents);
}

describe("the live colour", () => {
  const files = [
    ...sourceFiles(join(WEB, "components")),
    ...sourceFiles(join(WEB, "app"))
  ];

  it("has files to check, so a broken walk cannot pass silently", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("appears only on surfaces that render model output", () => {
    const offenders = files
      .filter((file) => usesLive(readFileSync(file, "utf8")))
      .map((file) => relative(WEB, file).split("\\").join("/"))
      .filter((file) => !AI_SURFACES.has(file));

    expect(offenders).toEqual([]);
  });

  it("is never the focus ring", () => {
    const css = readFileSync(join(WEB, "app/globals.css"), "utf8");
    const focusRule = css.slice(css.indexOf(":focus-visible"), css.indexOf(":focus-visible") + 200);
    expect(focusRule).toContain("--action");
    expect(focusRule).not.toContain("--live");
  });

  it("is never used as text on the light theme", () => {
    // Bright `live` is for edges, flow and glow. Text uses `live-ink`, which
    // the contrast test holds to 4.5:1.
    for (const file of files) {
      const contents = readFileSync(file, "utf8");
      expect(contents, `${file} sets text in bright live`).not.toMatch(/\btext-live\b(?!-ink)/);
    }
  });
});
