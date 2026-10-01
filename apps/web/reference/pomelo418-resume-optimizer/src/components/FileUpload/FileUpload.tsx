import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useResumeOptimizer } from '../../hooks/useResumeOptimizer';
import { useResume } from '../../context/ResumeContext';

const ACCEPT = '.pdf,.docx,.txt';
const MAX_MB  = 5;

export function FileUpload() {
  const { loadFile }        = useResumeOptimizer();
  const { originalResume }  = useResume();
  const inputRef            = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [localError, setLocalError]   = useState('');

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setLocalError('');

    // Quick client-side guard before handing off to the parser
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`File exceeds ${MAX_MB} MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      setLocalError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    await loadFile(file);
  }, [loadFile]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        1. Upload Your Resume
      </h2>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-brand-500
          ${isDragging
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : originalResume
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-brand-300 hover:bg-brand-50'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="sr-only"
          aria-label="Upload resume file"
        />

        {originalResume ? (
          /* Uploaded state */
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium text-green-700">{originalResume.fileName}</p>
            <p className="text-xs text-green-600">
              {originalResume.sections.length} sections detected •{' '}
              {originalResume.fileType.toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 mt-2">Click to replace</p>
          </div>
        ) : (
          /* Empty state */
          <div className="space-y-2">
            <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-gray-300" fill="none" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              {isDragging ? 'Drop your resume here' : 'Drag & drop your resume'}
            </p>
            <p className="text-xs text-gray-400">PDF, DOCX or TXT — max {MAX_MB} MB</p>
            <span className="inline-block mt-1 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-medium">
              Browse files
            </span>
          </div>
        )}
      </div>

      {localError && (
        <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <span>✕</span> {localError}
        </p>
      )}

      {/* Section preview list */}
      {originalResume && originalResume.sections.length > 0 && (
        <ul className="mt-2 space-y-1">
          {originalResume.sections.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-brand-300 shrink-0" />
              <span className="font-medium capitalize">{s.type}</span>
              <span className="text-gray-400">— {s.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
