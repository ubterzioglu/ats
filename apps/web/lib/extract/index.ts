import { extractPdf } from "./pdf";
import { MAX_FILE_BYTES, UnsupportedFileError, type ExtractionResult } from "./types";

export { MAX_FILE_BYTES, UnsupportedFileError } from "./types";
export type { ExtractionResult, ExtractionSource } from "./types";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function htmlToText(html: string): string {
  let text = html;
  
  text = text.replace(/<li[^>]*>/gi, "- ");
  text = text.replace(/<\/li>/gi, "\n");
  
  text = text.replace(/<\/td>/gi, "\t");
  text = text.replace(/<\/th>/gi, "\t");
  text = text.replace(/<\/tr>/gi, "\n");
  
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  
  text = text.replace(/<[^>]+>/g, "");
  
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  
  text = text.split("\n").map(line => line.trim()).join("\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  
  return text.trim();
}

async function extractDocx(file: File): Promise<ExtractionResult> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  const text = htmlToText(html);

  return {
    text,
    pages: Math.max(1, Math.round(text.length / 2600)),
    source: "docx",
    fileName: file.name,
    warning:
      "DOCX was read directly. Headers and footers are not extracted. Most employers receive a PDF, so export to PDF and check that score too."
  };
}

async function extractPlainText(file: File): Promise<ExtractionResult> {
  const text = (await file.text()).trim();
  return {
    text,
    pages: Math.max(1, Math.round(text.length / 2600)),
    source: "text",
    fileName: file.name
  };
}

/** Reads a CV file entirely in the browser. Nothing leaves the device. */
export async function extractDocument(file: File): Promise<ExtractionResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is larger than 10 MB. Export a lighter version without embedded images.");
  }

  const name = file.name.toLowerCase();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) return extractPdf(file);
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) return extractDocx(file);
  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return extractPlainText(file);
  }

  throw new UnsupportedFileError(file.name);
}
