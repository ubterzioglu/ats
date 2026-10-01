'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { parseResume, getAcceptedFileTypes } from '@/lib/parsers';
import type { ResumeData } from '@/types/resume';

interface ResumeUploaderProps {
  onParsed: (resume: ResumeData, fileName: string) => void;
}

type UploadState = 'idle' | 'dragging' | 'parsing' | 'success' | 'error';

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  html: <FileText className="h-5 w-5 text-orange-500" />,
  md: <FileText className="h-5 w-5 text-purple-500" />,
  png: <Image className="h-5 w-5 text-green-500" />,
  jpg: <Image className="h-5 w-5 text-green-500" />,
};

export function ResumeUploader({ onParsed }: ResumeUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseMessage, setParseMessage] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['png', 'jpg', 'jpeg', 'tiff', 'webp'].includes(ext);

    setFileName(file.name);
    setState('parsing');
    setError('');
    setParseMessage(isImage ? 'Running OCR... this may take 10-20 seconds' : 'Parsing resume...');

    try {
      const resume = await parseResume(file);
      setState('success');
      setParseMessage('Resume parsed successfully!');
      onParsed(resume, file.name);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to parse resume. Please try another format.');
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback(() => {
    setState('idle');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer group',
          state === 'dragging'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
            : state === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : state === 'error'
                ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                : state === 'parsing'
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        )}
        onClick={() => state !== 'parsing' && document.getElementById('resume-file-input')?.click()}
      >
        <input
          id="resume-file-input"
          type="file"
          accept={getAcceptedFileTypes()}
          onChange={handleInputChange}
          className="hidden"
        />

        {state === 'parsing' ? (
          <>
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-base font-semibold text-blue-600 dark:text-blue-400">{parseMessage}</p>
            <p className="text-sm text-gray-500 mt-1">{fileName}</p>
          </>
        ) : state === 'success' ? (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-base font-semibold text-green-600 dark:text-green-400">Resume loaded!</p>
            <p className="text-sm text-gray-500 mt-1">{fileName}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={(e) => { e.stopPropagation(); document.getElementById('resume-file-input')?.click(); }}
            >
              Upload different resume
            </Button>
          </>
        ) : state === 'error' ? (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-base font-semibold text-red-600 dark:text-red-400">Parse failed</p>
            <p className="text-sm text-gray-500 mt-1 text-center max-w-xs">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={(e) => e.stopPropagation()}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-9 w-9 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {state === 'dragging' ? 'Drop it here!' : 'Upload your resume'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
              Drag & drop or click to browse. Supports PDF, Word, HTML, Markdown, and images (OCR).
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { ext: 'PDF', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                { ext: 'DOCX', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                { ext: 'HTML', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                { ext: '.MD', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
                { ext: 'Image', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
              ].map(({ ext, color }) => (
                <span key={ext} className={cn('rounded-full px-3 py-1 text-xs font-semibold', color)}>{ext}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
