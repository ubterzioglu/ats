import { describe, expect, it } from "vitest";

import { markdownToHtml } from "@/lib/blog/markdown";

describe("markdownToHtml", () => {
  it("renders blank-line separated text as separate paragraphs", () => {
    expect(markdownToHtml("One.\n\nTwo.")).toBe("<p>One.</p>\n<p>Two.</p>");
  });

  it("renders a citation marker as a superscript", () => {
    expect(markdownToHtml("Claim[^12].")).toBe('<p>Claim<sup class="cite">12</sup>.</p>');
  });

  it("does not italicise underscores inside words", () => {
    expect(markdownToHtml("use snake_case_name here")).toBe("<p>use snake_case_name here</p>");
    expect(markdownToHtml("an _emphasised_ word")).toBe("<p>an <em>emphasised</em> word</p>");
  });

  it("keeps http links and drops script URLs", () => {
    expect(markdownToHtml("[a](https://example.com)")).toContain('href="https://example.com"');
    const bad = markdownToHtml("[a](javascript:alert(1))");
    expect(bad).not.toContain("href=");
  });
});
