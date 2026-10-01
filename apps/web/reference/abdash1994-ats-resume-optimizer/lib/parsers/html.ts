import type { ResumeData } from '@/types/resume';
import { parseRawTextToResume } from './text-parser';

export async function parseHTML(file: File): Promise<ResumeData> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  // Remove scripts and styles
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  const rawText = doc.body?.innerText || doc.body?.textContent || '';
  return parseRawTextToResume(rawText);
}

export async function parseHTMLString(html: string): Promise<ResumeData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach(el => el.remove());
  const rawText = doc.body?.innerText || doc.body?.textContent || '';
  return parseRawTextToResume(rawText);
}
