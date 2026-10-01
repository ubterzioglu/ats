import type { ResumeData } from '@/types/resume';
import { parseRawTextToResume } from './text-parser';

export async function parseDOCX(file: File): Promise<ResumeData> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({ arrayBuffer });
  return parseRawTextToResume(result.value);
}
