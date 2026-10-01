import type { ResumeData } from '@/types/resume';
import { parseRawTextToResume } from './text-parser';

export async function parseMarkdown(file: File): Promise<ResumeData> {
  const text = await file.text();
  // Strip markdown syntax to get plain text
  const plainText = text
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '') // unordered lists
    .replace(/^\d+\.\s+/gm, '') // ordered lists
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/^---+$/gm, '') // horizontal rules
    .replace(/\|/g, ' '); // table pipes

  return parseRawTextToResume(plainText);
}
