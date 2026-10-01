/**
 * resumeParser.ts
 *
 * Converts uploaded PDF / DOCX / TXT files into a structured ParsedResume
 * object entirely in the browser — no server round-trip required.
 *
 * PDF  → pdfjs-dist (Mozilla's battle-tested renderer)
 * DOCX → mammoth    (converts .docx to plain text / HTML)
 * TXT  → FileReader API
 */

import type { ParsedResume, ResumeSection, FileType } from '../types';

// Vite resolves this static import at build time and gives us a local URL to
// the worker file — no CDN dependency, works offline, avoids CORS issues.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Regex patterns that identify common resume section headings (case-insensitive).
const SECTION_PATTERNS: Array<{ type: ResumeSection['type']; pattern: RegExp }> = [
  { type: 'summary',        pattern: /^(professional\s+)?summary|objective|profile|about\s+me/i },
  { type: 'experience',     pattern: /^(work\s+)?experience|employment|career\s+history|positions?\s+held/i },
  { type: 'education',      pattern: /^education|academic|qualifications?|degrees?/i },
  { type: 'skills',         pattern: /^(technical\s+)?skills?|competenc(y|ies)|technologies|tools/i },
  { type: 'certifications', pattern: /^certifications?|licenses?|credentials?/i },
  { type: 'projects',       pattern: /^projects?|portfolio|side\s+projects?/i },
];

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFile(file: File): void {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const allowedExtensions = /\.(pdf|docx|txt)$/i;

  if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`);
  }
}

// ─── PDF parsing ──────────────────────────────────────────────────────────────

async function parsePDF(file: File): Promise<string> {
  // Dynamic import keeps the heavy pdfjs bundle out of the initial JS load.
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

// ─── DOCX parsing ─────────────────────────────────────────────────────────────

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  // extractRawText strips all formatting; we only need plain text for analysis.
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ─── TXT parsing ─────────────────────────────────────────────────────────────

function parseTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Failed to read text file.'));
    reader.readAsText(file, 'utf-8');
  });
}

// ─── Section detection ────────────────────────────────────────────────────────

function detectSectionType(heading: string): ResumeSection['type'] {
  const match = SECTION_PATTERNS.find(({ pattern }) => pattern.test(heading.trim()));
  return match?.type ?? 'other';
}

function extractBullets(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^[\s•\-–—*►▪◦]+/, '').trim())
    .filter((l) => l.length > 15); // ignore very short fragments
}

/**
 * Splits raw resume text into structured sections by detecting headings.
 * Heuristic: a heading is a short line (≤60 chars) followed by a blank line
 * OR written in ALL CAPS / Title Case without ending punctuation.
 */
function parseIntoSections(rawText: string): ResumeSection[] {
  const lines = rawText.split('\n');
  const sections: ResumeSection[] = [];
  let currentTitle = 'Header';
  let currentLines: string[] = [];
  let sectionIndex = 0;

  const isHeading = (line: string, next: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 70) return false;
    // All-caps line
    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return true;
    // Title Case short line followed by empty line
    if (/^[A-Z][a-z]/.test(trimmed) && next.trim() === '') return true;
    // Explicit section keyword
    if (SECTION_PATTERNS.some(({ pattern }) => pattern.test(trimmed))) return true;
    return false;
  };

  const flush = () => {
    const content = currentLines.join('\n').trim();
    if (content) {
      sections.push({
        id: `section-${sectionIndex++}`,
        type: detectSectionType(currentTitle),
        title: currentTitle,
        content,
        bullets: extractBullets(content),
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? '';

    if (isHeading(line, next)) {
      flush();
      currentTitle = line.trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseResume(file: File): Promise<ParsedResume> {
  validateFile(file);

  const ext = file.name.split('.').pop()?.toLowerCase() as FileType;

  let rawText = '';
  if (ext === 'pdf') {
    rawText = await parsePDF(file);
  } else if (ext === 'docx') {
    rawText = await parseDOCX(file);
  } else {
    rawText = await parseTXT(file);
  }

  if (!rawText.trim()) {
    throw new Error('Could not extract any text from the file. Please try a different format.');
  }

  return {
    raw: rawText,
    sections: parseIntoSections(rawText),
    fileName: file.name.replace(/\.[^.]+$/, ''), // strip extension
    fileType: ext,
  };
}
