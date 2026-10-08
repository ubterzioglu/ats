import { describe, expect, it } from "vitest";

import { feedbackSchema } from "@/lib/feedback-schema";

describe("feedbackSchema", () => {
  it("accepts feedback without an email", () => {
    const result = feedbackSchema.safeParse({ category: "idea", message: "Please add a dark mode." });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeNull();
  });

  it("normalises a provided email", () => {
    const result = feedbackSchema.safeParse({
      category: "bug",
      message: "The upload button does nothing.",
      email: "  Person@Example.COM "
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("person@example.com");
  });

  it("treats an empty email as absent", () => {
    const result = feedbackSchema.safeParse({ category: "praise", message: "Clear report, thanks.", email: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeNull();
  });

  it("rejects a malformed email", () => {
    const result = feedbackSchema.safeParse({ category: "other", message: "Some long enough text.", email: "nope" });
    expect(result.success).toBe(false);
  });

  it("rejects a message that is too short or too long", () => {
    expect(feedbackSchema.safeParse({ category: "idea", message: "short" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ category: "idea", message: "x".repeat(2001) }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(feedbackSchema.safeParse({ category: "spam", message: "A long enough message." }).success).toBe(false);
  });
});
