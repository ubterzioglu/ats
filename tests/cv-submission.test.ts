import { describe, expect, it } from "vitest";

import { MAX_CV_BYTES } from "@/lib/cv-submission/limits";
import { validateFile } from "@/lib/cv-submission/validate";
import { clientHash } from "@/lib/cv-submission/client-hash";
import { parseAdminEmails } from "@/lib/admin/guard";

import { MAX_FILE_BYTES } from "@/lib/extract/types";

describe("limits", () => {
  it("MAX_CV_BYTES matches MAX_FILE_BYTES from extract/types", () => {
    expect(MAX_CV_BYTES).toBe(MAX_FILE_BYTES);
  });
});

describe("validateFile", () => {
  it("accepts a valid PDF", () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateFile("test.pdf", pdfBytes);
    expect(result.ok).toBe(true);
  });

  it("rejects a renamed executable as PDF", () => {
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ header
    const result = validateFile("test.pdf", exeBytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("magic");
  });

  it("accepts a valid DOCX", () => {
    const docxBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const result = validateFile("test.docx", docxBytes);
    expect(result.ok).toBe(true);
  });

  it("rejects oversize files", () => {
    const largeBytes = new Uint8Array(MAX_CV_BYTES + 1);
    const result = validateFile("test.pdf", largeBytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("oversize");
  });

  it("rejects empty files", () => {
    const emptyBytes = new Uint8Array(0);
    const result = validateFile("test.pdf", emptyBytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("empty");
  });

  it("rejects disallowed extensions", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const result = validateFile("test.exe", bytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("extension");
  });

  it("accepts valid UTF-8 text without NUL bytes", () => {
    const textBytes = new TextEncoder().encode("Hello, world!");
    const result = validateFile("test.txt", textBytes);
    expect(result.ok).toBe(true);
  });

  it("rejects text with NUL bytes", () => {
    const textBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x21]);
    const result = validateFile("test.txt", textBytes);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("encoding");
  });
});

describe("clientHash", () => {
  it("returns null when salt is missing", () => {
    const original = process.env.CLIENT_HASH_SALT;
    delete process.env.CLIENT_HASH_SALT;
    try {
      expect(clientHash("127.0.0.1")).toBeNull();
    } finally {
      if (original) process.env.CLIENT_HASH_SALT = original;
    }
  });

  it("returns null when IP is null", () => {
    process.env.CLIENT_HASH_SALT = "test-salt";
    expect(clientHash(null)).toBeNull();
  });

  it("returns a stable hash for the same IP and salt", () => {
    process.env.CLIENT_HASH_SALT = "test-salt";
    const hash1 = clientHash("127.0.0.1");
    const hash2 = clientHash("127.0.0.1");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns different hashes for different IPs", () => {
    process.env.CLIENT_HASH_SALT = "test-salt";
    const hash1 = clientHash("127.0.0.1");
    const hash2 = clientHash("192.168.1.1");
    expect(hash1).not.toBe(hash2);
  });
});

describe("parseAdminEmails", () => {
  it("returns empty array for undefined", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseAdminEmails("")).toEqual([]);
  });

  it("parses comma-separated emails", () => {
    expect(parseAdminEmails("a@example.com,b@example.com")).toEqual([
      "a@example.com",
      "b@example.com"
    ]);
  });

  it("trims whitespace and lowercases", () => {
    expect(parseAdminEmails("  A@Example.COM , B@example.com  ")).toEqual([
      "a@example.com",
      "b@example.com"
    ]);
  });

  it("filters out empty entries", () => {
    expect(parseAdminEmails("a@example.com,,b@example.com,")).toEqual([
      "a@example.com",
      "b@example.com"
    ]);
  });
});
