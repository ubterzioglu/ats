import { useResume } from '../../context/ResumeContext';
import { ResumePreview } from '../ResumePreview/ResumePreview';

function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 75 ? 'bg-green-100 text-green-700 ring-green-200' :
    score >= 50 ? 'bg-amber-100 text-amber-700 ring-amber-200' :
                  'bg-red-100 text-red-700 ring-red-200';

  // SVG arc: circumference of r=15 circle ≈ 94.2; score% of that
  const arc = (score / 100) * 94.2;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${colour}`}>
      <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-current opacity-20" />
        <circle
          cx="18" cy="18" r="15" fill="none" strokeWidth="3"
          className="stroke-current"
          strokeDasharray={`${arc} 94.2`}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-bold text-lg">{score}%</span>
      <span className="text-sm font-medium">ATS Score</span>
    </div>
  );
}

export function ComparisonView() {
  const { originalResume, optimizationResult, getSectionContent } = useResume();

  if (!originalResume || !optimizationResult) return null;

  const { sections, jdKeywords, matchedKeywords, missingSuggestedSkills, suggestions, atsScore } = optimizationResult;

  // Build per-section content overrides from the user's edits
  const optimisedOverrides = Object.fromEntries(
    sections.map((s) => [s.id, getSectionContent(s)])
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Score + stats bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex justify-center sm:justify-start">
          <ScoreBadge score={atsScore} />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600">{matchedKeywords.length}</p>
          <p className="text-xs text-gray-500">Keywords matched</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-500">{missingSuggestedSkills.length}</p>
          <p className="text-xs text-gray-500">Skills to consider adding</p>
        </div>
      </div>

      {/* ── Missing skills ────────────────────────────────────────────────── */}
      {missingSuggestedSkills.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-amber-800">Skills in the JD not found in your resume</h3>
          <p className="text-xs text-amber-600">If you have these, add them — ATS systems do exact keyword matching.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {missingSuggestedSkills.map((skill) => (
              <span key={skill} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggestions ───────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Improvement suggestions</h3>
          <ul className="space-y-1">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-blue-700">
                <span className="shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Side-by-side resume previews ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            <h3 className="text-sm font-semibold text-gray-600">Original</h3>
          </div>
          <ResumePreview
            sections={originalResume.sections}
            className="max-h-[68vh]"
          />
        </div>

        {/* Optimised */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
            <h3 className="text-sm font-semibold text-brand-600">Optimised</h3>
            <span className="text-xs text-gray-400">— matched keywords highlighted</span>
          </div>
          <ResumePreview
            sections={sections}
            contentOverrides={optimisedOverrides}
            highlightKeywords={jdKeywords}
            className="max-h-[68vh]"
          />
        </div>
      </div>

      {/* ── Matched keyword chips ─────────────────────────────────────────── */}
      {matchedKeywords.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Matched keywords</h3>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.slice(0, 40).map((kw) => (
              <span key={kw} className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
