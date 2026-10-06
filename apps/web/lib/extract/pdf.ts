import type { ExtractionResult } from "./types";

const WORKER_SRC = "/vendor/pdf.worker.min.mjs";

/** Horizontal gap, in PDF units, above which a run of spaces is emitted. */
const COLUMN_GAP = 12;
const WORD_GAP = 1.4;
/** Vertical tolerance, in PDF units, for treating items as the same line. */
const LINE_TOLERANCE = 2.5;

export interface PositionedItem {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

function toPositioned(item: unknown): PositionedItem | null {
  if (typeof item !== "object" || item === null) return null;
  const candidate = item as { str?: unknown; transform?: unknown; width?: unknown };
  if (typeof candidate.str !== "string" || !Array.isArray(candidate.transform)) return null;

  const x = Number(candidate.transform[4]);
  const y = Number(candidate.transform[5]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    text: candidate.str,
    x,
    y,
    width: typeof candidate.width === "number" ? candidate.width : 0
  };
}

/**
 * Rebuilds lines from item coordinates instead of concatenating fragments.
 * Line breaks and column gaps are the signals the scorer reads structure from,
 * so they are preserved rather than flattened into single spaces.
 */
export function itemsToText(items: readonly PositionedItem[]): string {
  const sorted = [...items]
    .filter((item) => item.text.length > 0)
    .sort((a, b) => (Math.abs(a.y - b.y) > LINE_TOLERANCE ? b.y - a.y : a.x - b.x));

  const lines: string[] = [];
  let current = "";
  let currentY: number | null = null;
  let cursorX = 0;

  for (const item of sorted) {
    const startsNewLine = currentY === null || Math.abs(item.y - currentY) > LINE_TOLERANCE;

    if (startsNewLine) {
      if (current.trim().length > 0) lines.push(current.trimEnd());
      current = item.text;
      currentY = item.y;
      cursorX = item.x + item.width;
      continue;
    }

    const gap = item.x - cursorX;
    if (gap > COLUMN_GAP) current += "    ";
    else if (gap > WORD_GAP && !current.endsWith(" ") && !item.text.startsWith(" ")) current += " ";

    current += item.text;
    cursorX = item.x + item.width;
  }

  if (current.trim().length > 0) lines.push(current.trimEnd());
  return lines.join("\n");
}

export async function extractPdf(file: File): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;

  try {
    const pages: string[] = [];
    const links: string[] = [];
    let emptyPages = 0;

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items
        .map(toPositioned)
        .filter((item): item is PositionedItem => item !== null);
      
      const pageText = itemsToText(items);
      
      if (pageText.trim().length === 0) {
        emptyPages++;
      }
      
      pages.push(pageText);
      
      // Extract annotations (links)
      try {
        const annotations = await page.getAnnotations();
        for (const annotation of annotations) {
          if (annotation.url && typeof annotation.url === "string") {
            links.push(annotation.url);
          }
        }
      } catch {
        // Annotations may not be available
      }
      
      page.cleanup();
    }

    const text = pages.join("\n\n").trim();

    let warning: string | undefined;
    if (text.length < 200) {
      warning = "Hardly any text layer in this PDF. It is probably a scan or an exported image, which is also what an ATS would see.";
    } else if (emptyPages > 0) {
      warning = `${emptyPages} page(s) had no text layer. Those pages are invisible to parsers.`;
    }

    return {
      text,
      pages: document.numPages,
      source: "pdf",
      fileName: file.name,
      warning
    };
  } finally {
    await document.destroy();
  }
}
