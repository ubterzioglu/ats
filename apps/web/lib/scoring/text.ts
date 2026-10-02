const LIGATURES: ReadonlyArray<readonly [RegExp, string]> = [
  [/ﬀ/g, "ff"],
  [/ﬁ/g, "fi"],
  [/ﬂ/g, "fl"],
  [/ﬃ/g, "ffi"],
  [/ﬄ/g, "ffl"],
  [/­/g, ""],
  [/[‘’‛]/g, "'"],
  [/[“”]/g, '"'],
  [/[–—−]/g, "-"],
  [/ /g, " "],
  [/[​-‍﻿]/g, ""]
];

export const BULLET_GLYPHS = /[•▪●■▶‣⁃⁌⁍∙·❖➤➜✔✓★◦‐○◘]/g;

/**
 * Cleans the artefacts a PDF text layer typically leaves behind while keeping
 * line structure intact. Line structure is signal: it is how section headings,
 * bullets and columns are detected later on.
 */
export function normalizeDocument(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n");

  for (const [pattern, replacement] of LIGATURES) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, ""))
    .join("\n");

  // Re-join words the PDF broke across a line end ("respon-\nsibility").
  text = text.replace(/([a-zäöüßçğışA-ZÄÖÜÇĞIŞ])-\n([a-zäöüßçğış])/g, "$1$2");

  // Collapse runs of blank lines to a single separator.
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Locale-neutral case fold. A plain toLowerCase() turns "İ" into "i" plus a
 * combining dot, which splits the word in two for the tokenizer below; the
 * dot is mapped first and any stray combining mark is dropped.
 */
export function caseFold(text: string): string {
  return text.replace(/\u0130/g, "i").replace(/\u0307/g, "").toLowerCase();
}

export function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}][\p{L}\p{N}'+#./-]*/gu);
  return matches ? matches.length : 0;
}

export function tokenize(text: string): string[] {
  const matches = caseFold(text).match(/[\p{L}\p{N}][\p{L}\p{N}+#.]*(?:\+\+)?/gu);
  if (!matches) return [];
  return matches.map((token) => token.replace(/[.]+$/g, "")).filter(Boolean);
}

export function isBulletLine(line: string): boolean {
  return /^([-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+/.test(
    line
  );
}

export function stripBulletMarker(line: string): string {
  return line.replace(
    /^([-*•▪●■▶‣⁃∙·➤➜✔✓★◦○]|\d+[.)])\s+/,
    ""
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export function ratio(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return part / whole;
}
