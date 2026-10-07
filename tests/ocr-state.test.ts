import { describe, expect, it } from "vitest";

import {
  INITIAL_OCR_STATE,
  ocrReducer,
  ocrPercent,
  isRunning
} from "@/lib/extract/ocr/state";

describe("ocr state", () => {
  it("starts in the offer phase", () => {
    expect(INITIAL_OCR_STATE).toEqual({ phase: "offer" });
  });

  describe("ocrReducer", () => {
    it("transitions from offer to downloading on start", () => {
      const next = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      expect(next).toEqual({ phase: "downloading", loaded: 0, total: 1000 });
    });

    it("ignores start when already running", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const next = ocrReducer(downloading, { type: "start", total: 2000 });
      expect(next).toEqual(downloading);
    });

    it("tracks download progress", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const next = ocrReducer(downloading, { type: "downloaded", loaded: 500 });
      expect(next).toEqual({ phase: "downloading", loaded: 500, total: 1000 });
    });

    it("does not decrease loaded bytes", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const at500 = ocrReducer(downloading, { type: "downloaded", loaded: 500 });
      const next = ocrReducer(at500, { type: "downloaded", loaded: 300 });
      expect(next).toEqual(at500);
    });

    it("transitions to recognising after download", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const next = ocrReducer(downloading, {
        type: "recognising",
        page: 1,
        pages: 3,
        progress: 0
      });
      expect(next).toEqual({ phase: "recognising", page: 1, pages: 3, progress: 0 });
    });

    it("does not go backwards in recognition progress", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const atPage2 = ocrReducer(downloading, {
        type: "recognising",
        page: 2,
        pages: 3,
        progress: 0.5
      });
      const next = ocrReducer(atPage2, {
        type: "recognising",
        page: 1,
        pages: 3,
        progress: 0.9
      });
      expect(next).toEqual(atPage2);
    });

    it("transitions to done when finished", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const recognising = ocrReducer(downloading, {
        type: "recognising",
        page: 1,
        pages: 1,
        progress: 1
      });
      const next = ocrReducer(recognising, { type: "finished", pages: 1, found: 1 });
      expect(next).toEqual({ phase: "done", pages: 1, found: 1 });
    });

    it("transitions to cancelled when cancel is sent during a run", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const next = ocrReducer(downloading, { type: "cancel" });
      expect(next).toEqual({ phase: "cancelled" });
    });

    it("ignores cancel when not running", () => {
      const next = ocrReducer(INITIAL_OCR_STATE, { type: "cancel" });
      expect(next).toEqual(INITIAL_OCR_STATE);
    });

    it("transitions to failed on failure during download", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const next = ocrReducer(downloading, { type: "fail", reason: "download" });
      expect(next).toEqual({ phase: "failed", reason: "download" });
    });

    it("transitions to failed on failure during recognition", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const recognising = ocrReducer(downloading, {
        type: "recognising",
        page: 1,
        pages: 1,
        progress: 0
      });
      const next = ocrReducer(recognising, { type: "fail", reason: "recognition" });
      expect(next).toEqual({ phase: "failed", reason: "recognition" });
    });
  });

  describe("isRunning", () => {
    it("returns true for downloading and recognising", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      expect(isRunning(downloading)).toBe(true);
      const recognising = ocrReducer(downloading, {
        type: "recognising",
        page: 1,
        pages: 1,
        progress: 0
      });
      expect(isRunning(recognising)).toBe(true);
    });

    it("returns false for offer, done, cancelled and failed", () => {
      expect(isRunning(INITIAL_OCR_STATE)).toBe(false);
      expect(isRunning({ phase: "done", pages: 1, found: 1 })).toBe(false);
      expect(isRunning({ phase: "cancelled" })).toBe(false);
      expect(isRunning({ phase: "failed", reason: "download" })).toBe(false);
    });
  });

  describe("ocrPercent", () => {
    it("returns the download percentage during download", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const atHalf = ocrReducer(downloading, { type: "downloaded", loaded: 500 });
      expect(ocrPercent(atHalf)).toBe(50);
    });

    it("returns the recognition percentage during recognition", () => {
      const downloading = ocrReducer(INITIAL_OCR_STATE, { type: "start", total: 1000 });
      const recognising = ocrReducer(downloading, {
        type: "recognising",
        page: 2,
        pages: 4,
        progress: 0.5
      });
      expect(ocrPercent(recognising)).toBe(38);
    });

    it("returns 100 when done", () => {
      expect(ocrPercent({ phase: "done", pages: 1, found: 1 })).toBe(100);
    });

    it("returns 0 for offer, cancelled and failed", () => {
      expect(ocrPercent(INITIAL_OCR_STATE)).toBe(0);
      expect(ocrPercent({ phase: "cancelled" })).toBe(0);
      expect(ocrPercent({ phase: "failed", reason: "download" })).toBe(0);
    });
  });
});
