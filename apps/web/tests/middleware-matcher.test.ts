import { describe, expect, it } from "vitest";

import { config } from "@/middleware";

function matchesMatcher(path: string): boolean {
  const pattern = config.matcher[0];
  if (!pattern) return false;
  const regex = new RegExp(`^${pattern.replace(/\((?!\?)/g, "(?:")}$`);
  return regex.test(path);
}

describe("middleware matcher", () => {
  it("matches /", () => {
    expect(matchesMatcher("/")).toBe(true);
  });

  it("matches /analyze", () => {
    expect(matchesMatcher("/analyze")).toBe(true);
  });

  it("matches /tr/analyze", () => {
    expect(matchesMatcher("/tr/analyze")).toBe(true);
  });

  it("matches /about", () => {
    expect(matchesMatcher("/about")).toBe(true);
  });

  it("does not match /api/cv", () => {
    expect(matchesMatcher("/api/cv")).toBe(false);
  });

  it("does not match /auth/confirm", () => {
    expect(matchesMatcher("/auth/confirm")).toBe(false);
  });

  it("does not match /_next/static/chunks/main.js", () => {
    expect(matchesMatcher("/_next/static/chunks/main.js")).toBe(false);
  });

  it("does not match /favicon.ico", () => {
    expect(matchesMatcher("/favicon.ico")).toBe(false);
  });

  it("does not match /robots.txt", () => {
    expect(matchesMatcher("/robots.txt")).toBe(false);
  });

  it("does not match /sitemap.xml", () => {
    expect(matchesMatcher("/sitemap.xml")).toBe(false);
  });

  it("does not match /llms.txt", () => {
    expect(matchesMatcher("/llms.txt")).toBe(false);
  });

  it("does not match /feed.xml", () => {
    expect(matchesMatcher("/feed.xml")).toBe(false);
  });

  it("does not match /manifest.json", () => {
    expect(matchesMatcher("/manifest.json")).toBe(false);
  });

  it("does not match /ai/faq.json", () => {
    expect(matchesMatcher("/ai/faq.json")).toBe(false);
  });

  it("does not match /.well-known/ai-plugin.json", () => {
    expect(matchesMatcher("/.well-known/ai-plugin.json")).toBe(false);
  });

  it("does not match /vendor/something.js", () => {
    expect(matchesMatcher("/vendor/something.js")).toBe(false);
  });

  it("does not match /image.png", () => {
    expect(matchesMatcher("/image.png")).toBe(false);
  });

  it("does not match /photo.jpg", () => {
    expect(matchesMatcher("/photo.jpg")).toBe(false);
  });
});
