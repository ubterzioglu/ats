import { z } from "zod";

import { ALLOWED_EXTENSIONS, MAX_CV_BYTES, MAX_CV_TEXT_CHARS, MAX_JD_CHARS } from "./limits";

const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const docxMagic = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

function hasMagicBytes(bytes: Uint8Array, magic: readonly number[]): boolean {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
}

function isValidUtf8WithoutNul(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) return false;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export type FileValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

export function validateFile(name: string, bytes: Uint8Array): FileValidationResult {
  if (bytes.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (bytes.length > MAX_CV_BYTES) {
    return { ok: false, reason: "oversize" };
  }

  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, reason: "extension" };
  }

  if (ext === "pdf" && !hasMagicBytes(bytes, pdfMagic)) {
    return { ok: false, reason: "magic" };
  }
  if (ext === "docx" && !hasMagicBytes(bytes, docxMagic)) {
    return { ok: false, reason: "magic" };
  }
  if ((ext === "txt" || ext === "md") && !isValidUtf8WithoutNul(bytes)) {
    return { ok: false, reason: "encoding" };
  }

  return { ok: true };
}

export const cvTextSchema = z.object({
  cvText: z.string().max(MAX_CV_TEXT_CHARS),
  jobDescription: z.string().max(MAX_JD_CHARS).optional()
});
