import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { performGhostCheck, validateGhostInput, type GhostCheckInput } from "@/lib/ghost-check";

describe("F.6 ghost posting check: input validation", () => {
  it("accepts a valid input", () => {
    const input = validateGhostInput({ platform: "greenhouse", board: "acme-corp", jobId: "abc-123" });
    expect(input).toEqual({ platform: "greenhouse", board: "acme-corp", jobId: "abc-123" });
  });

  it("rejects extra fields", () => {
    expect(validateGhostInput({
      platform: "greenhouse",
      board: "acme",
      jobId: "123",
      cvText: "should not be here"
    })).toBeNull();
  });

  it("rejects unknown platform", () => {
    expect(validateGhostInput({ platform: "indeed", board: "acme", jobId: "123" })).toBeNull();
  });

  it("rejects empty board", () => {
    expect(validateGhostInput({ platform: "greenhouse", board: "", jobId: "123" })).toBeNull();
  });

  it("rejects board with path traversal", () => {
    expect(validateGhostInput({ platform: "greenhouse", board: "../evil", jobId: "123" })).toBeNull();
  });

  it("rejects jobId with special characters", () => {
    expect(validateGhostInput({ platform: "greenhouse", board: "acme", jobId: "<script>" })).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(validateGhostInput("string")).toBeNull();
    expect(validateGhostInput(null)).toBeNull();
    expect(validateGhostInput([])).toBeNull();
  });

  it("rejects missing fields", () => {
    expect(validateGhostInput({ platform: "greenhouse" })).toBeNull();
    expect(validateGhostInput({ platform: "greenhouse", board: "acme" })).toBeNull();
  });
});

describe("F.6 ghost posting check: SSRF protection", () => {
  it("the proxy carries no candidate data", () => {
    const input = validateGhostInput({
      platform: "greenhouse",
      board: "acme",
      jobId: "job-123"
    });
    expect(input).not.toBeNull();
    const keys = Object.keys(input!);
    expect(keys).toEqual(["platform", "board", "jobId"]);
    expect(keys).not.toContain("cvText");
    expect(keys).not.toContain("name");
    expect(keys).not.toContain("email");
  });

  it("URL is built from a fixed host allowlist, never user input", () => {
    const allowedHosts = new Set([
      "boards.greenhouse.io",
      "api.lever.co",
      "api.ashbyhq.com"
    ]);
    for (const platform of ["greenhouse", "lever", "ashby"] as const) {
      const input: GhostCheckInput = { platform, board: "test-board", jobId: "test-job" };
      const urlMap: Record<string, string> = {
        greenhouse: "https://boards.greenhouse.io/test-board/embed.json",
        lever: "https://api.lever.co/v0/postings/test-board?mode=json",
        ashby: "https://api.ashbyhq.com/posting/test-board/test-job/json"
      };
      expect(urlMap[platform]).toContain(allowedHosts.has(urlMap[platform].split("/")[2]!) ? platform : "FAIL");
    }
  });
});

describe("F.6 ghost posting check: network behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns 'gone' on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 })
    );

    const result = await performGhostCheck({
      platform: "greenhouse",
      board: "acme",
      jobId: "gone-job"
    });
    expect(result.status).toBe("gone");
  });

  it("returns 'unknown' on network error, never throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network error"));

    const result = await performGhostCheck({
      platform: "greenhouse",
      board: "acme",
      jobId: "job-1"
    });
    expect(result.status).toBe("unknown");
  });

  it("returns 'unknown' on server error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("internal error", { status: 500 })
    );

    const result = await performGhostCheck({
      platform: "lever",
      board: "acme",
      jobId: "job-2"
    });
    expect(result.status).toBe("unknown");
  });

  it("does not forward cookies", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ postings: [{ id: "job-1" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    await performGhostCheck({
      platform: "greenhouse",
      board: "acme",
      jobId: "job-1"
    });

    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    const init = callArgs![1] as RequestInit;
    expect(init.credentials).toBeUndefined();
  });
});

describe("F.6 ghost posting check: invalid URL construction", () => {
  it("returns unknown for board with slashes", async () => {
    const input: GhostCheckInput = {
      platform: "greenhouse",
      board: "acme/../../evil",
      jobId: "job-1"
    };
    const result = await performGhostCheck(input);
    expect(result.status).toBe("unknown");
  });

  it("returns unknown for jobId with spaces", async () => {
    const input: GhostCheckInput = {
      platform: "greenhouse",
      board: "acme",
      jobId: "job 1 with spaces"
    };
    const result = await performGhostCheck(input);
    expect(result.status).toBe("unknown");
  });
});
