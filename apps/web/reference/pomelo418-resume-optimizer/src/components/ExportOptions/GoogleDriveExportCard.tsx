/**
 * GoogleDriveExportCard.tsx
 *
 * Isolated component that owns the useGoogleDrive hook.
 * Only rendered by ExportOptions when VITE_GOOGLE_CLIENT_ID is defined,
 * so useGoogleLogin is never called without a valid client ID.
 */

import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import type { OptimizationResult, ParsedResume } from '../../types';

interface Props {
  optimizationResult: OptimizationResult;
  originalResume: ParsedResume;
  getSectionContent: (section: OptimizationResult['sections'][number]) => string;
  compact?: boolean;
}

export function GoogleDriveExportCard({ optimizationResult, originalResume, getSectionContent, compact }: Props) {
  const { isConnected, isLoading, login, logout, saveFile, savedFile } = useGoogleDrive();

  const uploadToDrive = async () => {
    if (!isConnected) { login(); return; }

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const children = optimizationResult.sections.flatMap((s) => [
        new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_2 }),
        ...getSectionContent(s)
          .split('\n')
          .map((line) => new Paragraph({ children: [new TextRun({ text: line.trim(), size: 20 })] })),
      ]);

      const doc  = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      const file = await saveFile(
        blob,
        `${originalResume.fileName}_optimised.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      alert(`Saved to Google Drive: "${file.name}"\nOpen: ${file.webViewLink}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Google Drive upload failed.');
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={uploadToDrive}
          disabled={isLoading}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-green-100 text-green-700 hover:bg-green-200 ${isLoading ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {isLoading ? '…' : isConnected ? 'Drive' : 'Drive (sign in)'}
        </button>
        {isConnected && (
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">Sign out</button>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={uploadToDrive}
        disabled={isLoading}
        className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer border-green-200 hover:border-green-400 hover:bg-green-50 text-green-700 ${isLoading ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <span className="text-2xl mb-2">{isLoading ? '⏳' : '☁️'}</span>
        <span className="text-sm font-semibold">
          {isLoading ? 'Uploading…' : isConnected ? 'Save to Drive' : 'Google Drive'}
        </span>
        <span className="text-xs text-gray-400 mt-1">
          {isConnected ? 'Upload directly to Drive.' : 'Sign in with Google to upload.'}
        </span>
      </button>

      {savedFile && (
        <div className="col-span-full rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700">
          Saved to Drive:{' '}
          <a href={savedFile.webViewLink} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            {savedFile.name}
          </a>
        </div>
      )}
    </>
  );
}
