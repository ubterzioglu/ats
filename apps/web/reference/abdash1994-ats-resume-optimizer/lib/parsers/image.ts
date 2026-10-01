import type { ResumeData } from '@/types/resume';
import { parseRawTextToResume } from './text-parser';

export async function parseImage(file: File): Promise<ResumeData> {
  const Tesseract = await import('tesseract.js');

  const worker = await Tesseract.createWorker('eng');
  const imageUrl = URL.createObjectURL(file);

  try {
    const { data: { text } } = await worker.recognize(imageUrl);
    return parseRawTextToResume(text);
  } finally {
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);
  }
}
