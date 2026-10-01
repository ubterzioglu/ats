import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useResume } from '../../context/ResumeContext';
import { GoogleDriveExportCard } from './GoogleDriveExportCard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface Props {
  compact?: boolean;
}

export function ExportOptions({ compact = false }: Props) {
  const { optimizationResult, originalResume, getSectionContent } = useResume();
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  if (!optimizationResult || !originalResume) return null;

  // ── PDF export ─────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = doc.internal.pageSize.getWidth();
      const margin  = 20;
      const maxW    = pageW - margin * 2;
      let y         = margin;

      const addPage = () => { doc.addPage(); y = margin; };

      for (const section of optimizationResult.sections) {
        const content = getSectionContent(section);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        if (y > 270) addPage();
        doc.text(section.title.toUpperCase(), margin, y);
        y += 1;
        doc.setDrawColor(30, 64, 175);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(content, maxW) as string[];
        for (const line of lines) {
          if (y > 275) addPage();
          doc.text(line, margin, y);
          y += 5;
        }
        y += 4;
      }

      doc.save(`${originalResume.fileName}_optimised.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  // ── DOCX export ────────────────────────────────────────────────────────────
  const exportDOCX = async () => {
    setExporting('docx');
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx');

      const children = optimizationResult.sections.flatMap((section) => {
        const content = getSectionContent(section);
        return [
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '3b56e8' } },
            spacing: { after: 100 },
          }),
          ...content.split('\n').map((line) => {
            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
            return new Paragraph({
              bullet: isBullet ? { level: 0 } : undefined,
              children: [new TextRun({ text: line.replace(/^[\s•\-]+/, '').trim(), size: 20 })],
              spacing: { after: 60 },
            });
          }),
        ];
      });

      const doc  = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${originalResume.fileName}_optimised.docx`);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert('DOCX export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  // ── Compact mode (inline in editor header) ─────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={exportPDF}
          disabled={!!exporting}
          className={btnClass(!!exporting)}
        >
          {exporting === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          onClick={exportDOCX}
          disabled={!!exporting}
          className={btnClass(!!exporting)}
        >
          {exporting === 'docx' ? '…' : 'DOCX'}
        </button>
        {GOOGLE_CLIENT_ID && (
          <GoogleDriveExportCard
            optimizationResult={optimizationResult}
            originalResume={originalResume}
            getSectionContent={getSectionContent}
            compact
          />
        )}
      </div>
    );
  }

  // ── Full export panel ──────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Export</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ExportCard
          icon="📄"
          title="Download PDF"
          description="A4 formatted PDF ready to submit."
          onClick={exportPDF}
          loading={exporting === 'pdf'}
          disabled={!!exporting}
        />
        <ExportCard
          icon="📝"
          title="Download DOCX"
          description="Editable Word document."
          onClick={exportDOCX}
          loading={exporting === 'docx'}
          disabled={!!exporting}
        />

        {/* Google Drive card — only rendered when client ID is configured */}
        {GOOGLE_CLIENT_ID ? (
          <GoogleDriveExportCard
            optimizationResult={optimizationResult}
            originalResume={originalResume}
            getSectionContent={getSectionContent}
          />
        ) : (
          <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-300">
            <span className="text-2xl mb-2">☁️</span>
            <span className="text-sm font-medium">Google Drive</span>
            <span className="text-xs mt-1">Add VITE_GOOGLE_CLIENT_ID to .env to enable</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportCard({
  icon, title, description, onClick, loading, disabled,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
        border-brand-100 hover:border-brand-300 hover:bg-brand-50 text-brand-700
        ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <span className="text-2xl mb-2">{loading ? '⏳' : icon}</span>
      <span className="text-sm font-semibold">{loading ? 'Exporting…' : title}</span>
      <span className="text-xs text-gray-400 mt-1">{description}</span>
    </button>
  );
}

function btnClass(disabled: boolean) {
  return `px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-brand-100 text-brand-700 hover:bg-brand-200 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`;
}
