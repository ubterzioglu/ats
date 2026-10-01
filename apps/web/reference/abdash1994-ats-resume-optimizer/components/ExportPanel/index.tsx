'use client';

import React, { useState } from 'react';
import { Download, FileText, Code, BookOpen, Loader2, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ResumeData, ExportFormat } from '@/types/resume';

interface ExportPanelProps {
  resume: ResumeData;
}

const EXPORT_OPTIONS: {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
  tip: string;
}[] = [
  {
    format: 'docx',
    label: 'Word Document (.docx)',
    description: 'Universally safest — preferred by Taleo, Workday, iCIMS, ADP, SAP',
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    recommended: true,
    tip: 'Research shows .docx is universally the safest format. Taleo has 41% parse errors on complex PDFs. When in doubt, use DOCX.',
  },
  {
    format: 'pdf',
    label: 'PDF (ATS-Safe)',
    description: 'Single-column plain text PDF — good for modern ATS (Greenhouse, Lever)',
    icon: <FileText className="h-5 w-5 text-red-500" />,
    tip: 'Safe for modern ATS. Avoid for Taleo/ADP. Never use design-heavy PDFs from Canva/InDesign.',
  },
  {
    format: 'html',
    label: 'HTML',
    description: 'Web-ready resume — for portfolios and custom styling',
    icon: <Code className="h-5 w-5 text-orange-500" />,
    tip: 'Great for personal websites. Not recommended for ATS submission.',
  },
  {
    format: 'markdown',
    label: 'Markdown (.md)',
    description: 'Developer-friendly format — for GitHub, dev portfolios',
    icon: <BookOpen className="h-5 w-5 text-purple-500" />,
    tip: 'Perfect for GitHub profiles, README files, or developer portfolios.',
  },
];

export function ExportPanel({ resume }: ExportPanelProps) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [downloaded, setDownloaded] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (downloading) return;
    setDownloading(format);

    try {
      switch (format) {
        case 'pdf': {
          const { exportPDF } = await import('@/lib/exporters/pdf');
          await exportPDF(resume);
          break;
        }
        case 'docx': {
          const { exportDOCX } = await import('@/lib/exporters/docx');
          await exportDOCX(resume);
          break;
        }
        case 'html': {
          const { getResumeHTML } = await import('@/lib/exporters/pdf');
          const html = getResumeHTML(resume);
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${resume.contact.name.replace(/\s+/g, '_')}_Resume.html`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
        case 'markdown': {
          const { exportMarkdown } = await import('@/lib/exporters/markdown');
          exportMarkdown(resume);
          break;
        }
      }

      setDownloaded(format);
      setTimeout(() => setDownloaded(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">ATS Submission Tip</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Use <strong>PDF (ATS-Safe)</strong> or <strong>DOCX</strong> when submitting through online portals.
            Never submit a visually-designed PDF with graphics or columns — ATS cannot parse them.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {EXPORT_OPTIONS.map(option => (
          <div
            key={option.format}
            className={cn(
              'rounded-xl border p-4 transition-all',
              option.recommended
                ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20'
                : 'border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{option.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
                  {option.recommended && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">💡 {option.tip}</p>
              </div>
              <Button
                variant={option.recommended ? 'default' : 'outline'}
                size="sm"
                className="shrink-0 gap-1.5 h-8"
                onClick={() => handleExport(option.format)}
                disabled={!!downloading}
              >
                {downloading === option.format ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : downloaded === option.format ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {downloaded === option.format ? 'Saved!' : 'Download'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
