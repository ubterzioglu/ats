import { useResume } from '../../context/ResumeContext';
import { useResumeOptimizer } from '../../hooks/useResumeOptimizer';
import type { ActiveView } from '../../types';

const TABS: Array<{ view: ActiveView; label: string; requiresResult?: boolean }> = [
  { view: 'upload',   label: 'Upload & JD'    },
  { view: 'compare',  label: 'Compare',  requiresResult: true },
  { view: 'edit',     label: 'Edit & Export', requiresResult: true },
];

export function Header() {
  const { activeView, optimizationResult, dispatch } = useResume();
  const { reset } = useResumeOptimizer();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:inline">Resume Optimizer</span>
            <span className="font-bold text-gray-900 text-lg sm:hidden">ResumeAI</span>
          </div>

          {/* Tab navigation */}
          <nav className="flex">
            {TABS.map(({ view, label, requiresResult }) => {
              const disabled = requiresResult && !optimizationResult;
              const active   = activeView === view;
              return (
                <button
                  key={view}
                  onClick={() => !disabled && dispatch({ type: 'SET_VIEW', payload: view })}
                  disabled={disabled}
                  className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                    ${active
                      ? 'border-brand-500 text-brand-600'
                      : disabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Reset button */}
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
          >
            Start over
          </button>
        </div>
      </div>
    </header>
  );
}
