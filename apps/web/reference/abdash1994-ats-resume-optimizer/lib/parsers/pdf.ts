import type { ResumeData } from '@/types/resume';
import { parseRawTextToResume } from './text-parser';

export async function parsePDF(file: File): Promise<ResumeData> {
  const pdfjsLib = await import('pdfjs-dist');

  // Version-stamped URL busts the browser cache when pdfjs upgrades.
  // The file is served from /public and copied fresh by the postinstall script.
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjsLib.version}`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Preserve line structure using Y position grouping
    const lines: Map<number, string[]> = new Map();
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const y = Math.round((item as any).transform[5]);
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y)!.push((item as any).str);
      }
    }

    const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      fullText += lines.get(y)!.join(' ') + '\n';
    }
    fullText += '\n';
  }

  return parseRawTextToResume(fullText);
}
