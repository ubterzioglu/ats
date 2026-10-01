import { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { ResumePreview } from '../ResumePreview/ResumePreview';
import { ExportOptions } from '../ExportOptions/ExportOptions';

const SECTION_TYPE_COLOURS: Record<string, string> = {
  summary:        'bg-purple-100 text-purple-700',
  experience:     'bg-blue-100 text-blue-700',
  education:      'bg-green-100 text-green-700',
  skills:         'bg-orange-100 text-orange-700',
  certifications: 'bg-teal-100 text-teal-700',
  projects:       'bg-pink-100 text-pink-700',
  other:          'bg-gray-100 text-gray-600',
};

type EditorMode = 'preview' | 'edit';

export function ResumeEditor() {
  const { optimizationResult, dispatch, getSectionContent } = useResume();
  const [mode, setMode] = useState<EditorMode>('preview');

  if (!optimizationResult) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Run the optimiser first to unlock the editor.
      </div>
    );
  }

  const { sections } = optimizationResult;

  // Collect all current content overrides for the preview
  const contentOverrides = Object.fromEntries(
    sections.map((s) => [s.id, getSectionContent(s)])
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Edit Optimised Resume</h2>
          <p className="text-xs text-gray-400 mt-0.5">Changes are auto-saved to your browser.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Preview / Edit toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 transition-colors ${mode === 'preview' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1.5 transition-colors ${mode === 'edit' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Edit
            </button>
          </div>
          <div className="hidden sm:block">
            <ExportOptions compact />
          </div>
        </div>
      </div>

      {/* ── Preview mode ─────────────────────────────────────────────────── */}
      {mode === 'preview' && (
        <ResumePreview
          sections={sections}
          contentOverrides={contentOverrides}
          className="min-h-[60vh]"
        />
      )}

      {/* ── Edit mode ────────────────────────────────────────────────────── */}
      {mode === 'edit' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: textareas */}
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Edit each section below. Switch to Preview to see the formatted result.</p>
            {sections.map((section) => {
              const content  = getSectionContent(section);
              const modified = content !== section.originalContent;
              const colour   = SECTION_TYPE_COLOURS[section.type] ?? SECTION_TYPE_COLOURS.other;

              return (
                <div key={section.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide ${colour}`}>
                      {section.type}
                    </span>
                    <h3 className="text-sm font-medium text-gray-700 flex-1">{section.title}</h3>
                    {section.wasModified && !modified && (
                      <span className="text-[10px] text-brand-500">AI improved</span>
                    )}
                    {modified && (
                      <>
                        <span className="text-[10px] text-green-600 font-medium">Edited</span>
                        <button
                          onClick={() => dispatch({ type: 'EDIT_SECTION', payload: { id: section.id, content: section.content } })}
                          className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                          title="Revert to AI-optimised version"
                        >
                          Revert
                        </button>
                      </>
                    )}
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => dispatch({ type: 'EDIT_SECTION', payload: { id: section.id, content: e.target.value } })}
                    rows={Math.max(4, content.split('\n').length + 1)}
                    className="w-full px-4 py-3 text-sm text-gray-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-300 font-mono"
                    spellCheck
                  />
                  <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 text-right">
                    <span className="text-[10px] text-gray-300">{content.length} chars</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: live document preview */}
          <div className="space-y-2 hidden xl:block">
            <p className="text-xs text-gray-400">Live preview</p>
            <ResumePreview
              sections={sections}
              contentOverrides={contentOverrides}
              className="sticky top-20 max-h-[80vh]"
            />
          </div>
        </div>
      )}

      <div className="sm:hidden">
        <ExportOptions />
      </div>
    </div>
  );
}
