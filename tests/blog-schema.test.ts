import { describe, expect, it } from "vitest";

import { slugify, validateBlogPost } from "@/lib/blog/schema";

describe("slugify", () => {
  it("converts to lowercase and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("handles Turkish characters", () => {
    expect(slugify("İstanbul'da")).toBe("istanbulda");
  });

  it("handles German characters", () => {
    expect(slugify("Über, schön!")).toBe("über-schön");
  });
});

describe("validateBlogPost", () => {
  it("accepts a valid post", () => {
    const result = validateBlogPost({
      locale: "en",
      slug: "test-post",
      title: "Test Post",
      description: "A test post",
      body_md: "# Hello",
      status: "draft",
      author_email: "test@example.com"
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid locale", () => {
    const result = validateBlogPost({
      locale: "fr",
      slug: "test-post",
      title: "Test Post"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = validateBlogPost({
      locale: "en",
      slug: "Invalid Slug!",
      title: "Test Post"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects empty title", () => {
    const result = validateBlogPost({
      locale: "en",
      slug: "test-post",
      title: ""
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = validateBlogPost({
      locale: "en",
      slug: "test-post",
      title: "Test Post",
      status: "archived"
    });
    expect(result.ok).toBe(false);
  });

  it("defaults status to draft", () => {
    const result = validateBlogPost({
      locale: "en",
      slug: "test-post",
      title: "Test Post"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("draft");
    }
  });
});
