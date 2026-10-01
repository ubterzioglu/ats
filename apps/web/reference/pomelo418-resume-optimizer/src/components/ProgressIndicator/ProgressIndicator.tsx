import { useResume } from '../../context/ResumeContext';

const STEPS = [
  { key: 'parsing',             label: 'Parsing resume'   },
  { key: 'extracting-keywords', label: 'Extracting keywords' },
  { key: 'rewriting-bullets',   label: 'Rewriting bullets' },
  { key: 'scoring',             label: 'Scoring ATS'      },
  { key: 'complete',            label: 'Done'             },
] as const;

const STEP_KEYS = STEPS.map((s) => s.key);

export function ProgressIndicator() {
  const { processingStep, processingProgress, processingMessage } = useResume();

  const isActive = processingStep !== 'idle' && processingStep !== 'error';
  if (!isActive) return null;

  const currentIdx = STEP_KEYS.indexOf(processingStep as typeof STEP_KEYS[number]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Optimising your resume…</h2>
        <p className="text-sm text-gray-500 mb-6">{processingMessage}</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="h-2 bg-brand-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${processingProgress}%` }}
          />
        </div>

        {/* Step pills */}
        <ol className="flex flex-col gap-2">
          {STEPS.map((step, i) => {
            const done    = i < currentIdx;
            const active  = i === currentIdx;
            return (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-300 ${
                    done   ? 'bg-brand-500 text-white' :
                    active ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400' :
                             'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={`text-sm ${active ? 'text-brand-700 font-medium' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.label}
                  {active && <span className="ml-2 inline-block animate-pulse-slow">…</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
