import type { ResumeData } from '@/types/resume';

export type ParsedResume = ResumeData;

export async function parseResume(file: File): Promise<ResumeData> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const { parsePDF } = await import('./pdf');
    return parsePDF(file);
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const { parseDOCX } = await import('./docx');
    return parseDOCX(file);
  }

  if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) {
    const { parseHTML } = await import('./html');
    return parseHTML(file);
  }

  if (
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    type === 'text/markdown'
  ) {
    const { parseMarkdown } = await import('./markdown');
    return parseMarkdown(file);
  }

  if (
    type.startsWith('image/') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.tiff') ||
    name.endsWith('.webp')
  ) {
    const { parseImage } = await import('./image');
    return parseImage(file);
  }

  // Fallback: try plain text
  const { parseRawTextToResume } = await import('./text-parser');
  const text = await file.text();
  return parseRawTextToResume(text);
}

export function getAcceptedFileTypes(): string {
  return '.pdf,.docx,.doc,.html,.htm,.md,.markdown,.png,.jpg,.jpeg,.tiff,.webp,.txt';
}
