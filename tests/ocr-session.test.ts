import { describe, expect, it, vi } from "vitest";

import type { OcrDeps, OcrEngine, OcrPageSource } from "@/lib/extract/ocr/session";
import { runOcr } from "@/lib/extract/ocr/session";
import type { OcrEvent } from "@/lib/extract/ocr/state";
import { planDownload } from "@/lib/extract/ocr/assets";

function mockDeps(overrides: Partial<OcrDeps> = {}): OcrDeps {
  return {
    download: vi.fn().mockImplementation(async (_url: string, _signal: AbortSignal, onBytes: (loaded: number) => void) => {
      onBytes(100);
      return new Uint8Array([1, 2, 3]);
    }),
    createEngine: vi.fn().mockResolvedValue({
      recognise: vi.fn().mockResolvedValue("recognised text"),
      terminate: vi.fn().mockResolvedValue(undefined)
    } satisfies OcrEngine),
    openPages: vi.fn().mockResolvedValue({
      render: vi.fn().mockResolvedValue(new Blob(["image"])),
      close: vi.fn().mockResolvedValue(undefined)
    } satisfies OcrPageSource),
    ...overrides
  };
}

describe("ocr session", () => {
  it("downloads all assets and emits start and downloaded events", async () => {
    const deps = mockDeps();
    const events: OcrEvent[] = [];
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;

    const result = await runOcr(deps, request, signal, (event) => events.push(event));

    expect(result).not.toBeNull();
    expect(events.some((e) => e.type === "start")).toBe(true);
    expect(events.filter((e) => e.type === "downloaded").length).toBeGreaterThan(0);
    expect(deps.download).toHaveBeenCalledTimes(3);
  });

  it("creates the engine after all files are downloaded", async () => {
    const downloadOrder: string[] = [];
    const deps = mockDeps({
      download: vi.fn().mockImplementation(async (url: string) => {
        downloadOrder.push(url);
        return new Uint8Array([1, 2, 3]);
      }),
      createEngine: vi.fn().mockImplementation(async () => {
        expect(downloadOrder.length).toBe(3);
        return {
          recognise: vi.fn().mockResolvedValue("text"),
          terminate: vi.fn().mockResolvedValue(undefined)
        } satisfies OcrEngine;
      })
    });
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;

    await runOcr(deps, request, signal, () => undefined);

    expect(deps.createEngine).toHaveBeenCalled();
  });

  it("recognises each requested page in order", async () => {
    const recognisedPages: number[] = [];
    const deps = mockDeps({
      openPages: vi.fn().mockResolvedValue({
        render: vi.fn().mockImplementation(async (pageNumber: number) => {
          recognisedPages.push(pageNumber);
          return new Blob(["image"]);
        }),
        close: vi.fn().mockResolvedValue(undefined)
      } satisfies OcrPageSource)
    });
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1, 2, 3],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;

    const result = await runOcr(deps, request, signal, () => undefined);

    expect(result).not.toBeNull();
    expect(recognisedPages).toEqual([1, 2, 3]);
  });

  it("returns null when aborted before starting", async () => {
    const deps = mockDeps();
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const controller = new AbortController();
    controller.abort();
    const events: OcrEvent[] = [];

    const result = await runOcr(deps, request, controller.signal, (event) => events.push(event));

    expect(result).toBeNull();
  });

  it("emits a failure event when download fails", async () => {
    const deps = mockDeps({
      download: vi.fn().mockRejectedValue(new Error("network error"))
    });
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;
    const events: OcrEvent[] = [];

    const result = await runOcr(deps, request, signal, (event) => events.push(event));

    expect(result).toBeNull();
    expect(events.some((e) => e.type === "fail" && e.reason === "download")).toBe(true);
  });

  it("emits a failure event when recognition fails", async () => {
    const deps = mockDeps({
      createEngine: vi.fn().mockResolvedValue({
        recognise: vi.fn().mockRejectedValue(new Error("recognition error")),
        terminate: vi.fn().mockResolvedValue(undefined)
      } satisfies OcrEngine)
    });
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;
    const events: OcrEvent[] = [];

    const result = await runOcr(deps, request, signal, (event) => events.push(event));

    expect(result).toBeNull();
    expect(events.some((e) => e.type === "fail" && e.reason === "recognition")).toBe(true);
  });

  it("terminates the engine and closes the page source after completion", async () => {
    const terminate = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const deps = mockDeps({
      createEngine: vi.fn().mockResolvedValue({
        recognise: vi.fn().mockResolvedValue("text"),
        terminate
      } satisfies OcrEngine),
      openPages: vi.fn().mockResolvedValue({
        render: vi.fn().mockResolvedValue(new Blob(["image"])),
        close
      } satisfies OcrPageSource)
    });
    const plan = planDownload("eng", "simd-lstm");
    const request = {
      file: new Blob(["pdf"]),
      pages: [1],
      language: "eng" as const,
      plan
    };
    const signal = new AbortController().signal;

    await runOcr(deps, request, signal, () => undefined);

    expect(terminate).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
