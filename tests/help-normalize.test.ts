import { describe, expect, it } from "vitest";

import { normalizeQuestion, removeStopwords, tokenise } from "@/lib/help/normalize";

describe("normalizeQuestion", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeQuestion("Is my CV stored?", "en")).toBe("is my cv stored");
  });

  it("folds Turkish İ and ı to i", () => {
    expect(normalizeQuestion("CV'm saklanıyor mu?", "tr")).toBe("cv m saklaniyor mu");
  });

  it("folds German ß to ss and umlauts", () => {
    expect(normalizeQuestion("Wie lange werden meine Daten aufbewahrt?", "de")).toBe(
      "wie lange werden meine daten aufbewahrt"
    );
    expect(normalizeQuestion("Löschen", "de")).toBe("loschen");
  });

  it("collapses whitespace", () => {
    expect(normalizeQuestion("  too   many   spaces  ", "en")).toBe("too many spaces");
  });

  it("returns empty for punctuation-only input", () => {
    expect(normalizeQuestion("?!.,", "en")).toBe("");
  });
});

describe("tokenise", () => {
  it("splits on whitespace and drops empty tokens", () => {
    expect(tokenise("hello world")).toEqual(["hello", "world"]);
    expect(tokenise("  spaced  out  ")).toEqual(["spaced", "out"]);
  });

  it("returns empty for empty input", () => {
    expect(tokenise("")).toEqual([]);
    expect(tokenise("   ")).toEqual([]);
  });
});

describe("removeStopwords", () => {
  it("removes English stopwords", () => {
    expect(removeStopwords(["is", "my", "cv", "stored"], "en")).toEqual(["cv", "stored"]);
  });

  it("removes Turkish stopwords", () => {
    expect(removeStopwords(["cv", "m", "saklanıyor", "mu"], "tr")).toEqual(["cv", "m", "saklanıyor"]);
  });

  it("removes German stopwords", () => {
    expect(removeStopwords(["wie", "lange", "werden", "daten", "aufbewahrt"], "de")).toEqual([
      "lange",
      "daten",
      "aufbewahrt"
    ]);
  });
});
