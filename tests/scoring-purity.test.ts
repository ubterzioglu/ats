import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { findPartialMatches, type PartialMatchHint } from "@/lib/ai/semantic-match";
import { matchTerms, type SemanticHit } from "@/lib/scoring/match";

/**
 * The engine is deterministic because nothing in it can reach a model. The
 * semantic matching mode is the first thing that wants to, so the rule is
 * enforced here rather than trusted: `lib/scoring` may not import `lib/ai`,
 * touch the DOM, or go to the network. Similarity arrives as data or not at
 * all.
 */

const SCORING_DIR = join(__dirname, "..", "apps", "web", "lib", "scoring");

/** Both spellings of the forbidden dependency: the alias and a relative hop. */
const MODEL_IMPORT_RX = /from\s+["'](?:@\/lib\/ai|\.{1,2}\/(?:\.\.\/)*ai)(?:\/[^"']*)?["']/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

const files = sourceFiles(SCORING_DIR);

/**
 * Comments and string literals, blanked out. The engine's prose says "document"
 * constantly and its word lists are full of ordinary nouns; only real code is
 * evidence of a real dependency.
 */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, '""');
}

describe("lib/scoring purity", () => {
  it("finds the engine's source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((path) => [relative(SCORING_DIR, path), path]))(
    "%s imports no model layer, DOM or network",
    (_name, path) => {
      const source = readFileSync(path, "utf8");
      expect(source).not.toMatch(MODEL_IMPORT_RX);

      const code = codeOnly(source);
      expect(code).not.toMatch(/(?<![.\p{L}\p{N}_$])(?:document|window|navigator|localStorage|indexedDB)\s*\./u);
      expect(code).not.toMatch(/(?<![.\p{L}\p{N}_$])fetch\s*\(/u);
    }
  );
});

describe("the guard itself", () => {
  // A guard that cannot fail guards nothing, so the shapes it must catch are
  // asserted against it directly.
  it.each([
    'import { embed } from "@/lib/ai/embeddings";',
    'import type { Embedder } from "@/lib/ai";',
    'import { x } from "../ai/semantic-match";',
    'import { x } from "./ai/model";'
  ])("catches %s", (line) => {
    expect(line).toMatch(MODEL_IMPORT_RX);
  });

  it("does not catch an import from a sibling that merely starts with the same letters", () => {
    expect('import { x } from "./aids";').not.toMatch(MODEL_IMPORT_RX);
  });

  it("blanks out prose and word lists before looking for DOM use", () => {
    expect(codeOnly('// every document. "window."\nconst a = 1;')).not.toMatch(/document\./);
  });
});

describe("the semantic layer plugs into the engine as data", () => {
  it("accepts a hint shaped exactly like the one lib/ai produces", () => {
    // Structural, not nominal: lib/ai hands its own type over and the engine
    // reads it without an adapter, while importing nothing from lib/ai.
    const hint: PartialMatchHint = {
      term: "terraform",
      passage: "wrote the infrastructure as code by hand",
      similarity: 0.71
    };
    const asEngineInput: SemanticHit = hint;

    const { matched } = matchTerms(
      [{ term: "terraform", weight: 1, hits: 0 }],
      "wrote the infrastructure as code by hand",
      "en",
      "semantic",
      [asEngineInput]
    );

    expect(matched[0]?.semantic?.similarity).toBe(0.71);
    expect(typeof findPartialMatches).toBe("function");
  });
});
