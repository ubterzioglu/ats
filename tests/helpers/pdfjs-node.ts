/**
 * pdfjs-dist's display build touches browser globals at module evaluation,
 * even though the extraction path this app uses - getDocument, getTextContent
 * - never draws anything. These minimal placeholders let the identical
 * lib/extract code run headless in the test suite; the browser needs none of
 * it. Imported for side effects before lib/extract/pdf is first loaded.
 */

class DOMMatrixStub {
  readonly a = 1;
  readonly b = 0;
  readonly c = 0;
  readonly d = 1;
  readonly e = 0;
  readonly f = 0;
  readonly m11 = 1;
  readonly m12 = 0;
  readonly m13 = 0;
  readonly m14 = 0;
  readonly m21 = 0;
  readonly m22 = 1;
  readonly m23 = 0;
  readonly m24 = 0;
  readonly m31 = 0;
  readonly m32 = 0;
  readonly m33 = 1;
  readonly m34 = 0;
  readonly m41 = 0;
  readonly m42 = 0;
  readonly m43 = 0;
  readonly m44 = 1;
  readonly is2D = true;
  readonly isIdentity = false;

  constructor(_init?: unknown) {}

  multiplySelf(): DOMMatrixStub {
    return this;
  }

  invertSelf(): DOMMatrixStub {
    return this;
  }

  translateSelf(): DOMMatrixStub {
    return this;
  }

  scaleSelf(): DOMMatrixStub {
    return this;
  }
}

class Path2DStub {}

const globals = globalThis as unknown as Record<string, unknown>;
globals.DOMMatrix ??= DOMMatrixStub;
globals.Path2D ??= Path2DStub;

/**
 * pdfjs-dist 5.x uses the Uint8Array hex/base64 methods that this Node
 * runtime does not ship yet. The worker only needs them for document
 * fingerprints and data URLs, so a straightforward polyfill keeps the modern
 * build usable headless instead of switching the whole suite to the legacy
 * bundle.
 */
type ToHexCapable = { toHex?: () => string; toBase64?: () => string };
const proto = Uint8Array.prototype as Uint8Array & ToHexCapable;
if (typeof proto.toHex !== "function") {
  Object.defineProperty(Uint8Array.prototype, "toHex", {
    configurable: true,
    writable: true,
    value(this: Uint8Array): string {
      let out = "";
      for (const byte of this) out += byte.toString(16).padStart(2, "0");
      return out;
    }
  });
}
if (typeof proto.toBase64 !== "function") {
  Object.defineProperty(Uint8Array.prototype, "toBase64", {
    configurable: true,
    writable: true,
    value(this: Uint8Array): string {
      return Buffer.from(this).toString("base64");
    }
  });
}

type FromBase64Capable = { fromBase64?: (base64: string) => Uint8Array };
const ctor = Uint8Array as unknown as FromBase64Capable;
if (typeof ctor.fromBase64 !== "function") {
  Object.defineProperty(Uint8Array, "fromBase64", {
    configurable: true,
    writable: true,
    value(base64: string): Uint8Array {
      return new Uint8Array(Buffer.from(base64, "base64"));
    }
  });
}

type SumPreciseCapable = { sumPrecise?: (values: Iterable<number>) => number };
const math = Math as unknown as SumPreciseCapable;
if (typeof math.sumPrecise !== "function") {
  Object.defineProperty(Math, "sumPrecise", {
    configurable: true,
    writable: true,
    value(values: Iterable<number>): number {
      let sum = 0;
      for (const value of values) sum += value;
      return sum;
    }
  });
}

/**
 * lib/extract points workerSrc at "/vendor/pdf.worker.min.mjs", a URL the
 * browser serves from public/. Node cannot resolve it, so instead of a worker
 * the handler the worker bundle exports is registered on the global pdfjs
 * looks for (globalThis.pdfjsWorker) and extraction runs on the main thread.
 */
if (globals.pdfjsWorker === undefined) {
  globals.pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs");
}

export {};
