import { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { useResumeOptimizer } from '../../hooks/useResumeOptimizer';

const MIN_JD_LENGTH = 100;

export function JobDescription() {
  const { jobDescription, dispatch, originalResume, apiKey, processingStep } = useResume();
  const { optimize } = useResumeOptimizer();
  const [showApiKey, setShowApiKey] = useState(false);

  const isProcessing = processingStep !== 'idle' && processingStep !== 'error' && processingStep !== 'complete';
  const canOptimize  = !!originalResume && jobDescription.trim().length >= MIN_JD_LENGTH;

  return (
    <div className="space-y-4">
      {/* Job description textarea */}
      <div className="space-y-2">
        <label htmlFor="jd" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          2. Paste Job Description
        </label>
        <textarea
          id="jd"
          value={jobDescription}
          onChange={(e) => dispatch({ type: 'SET_JD', payload: e.target.value })}
          placeholder="Paste the full job posting here — including required skills, responsibilities, and qualifications…"
          rows={10}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-y focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{jobDescription.length} characters</span>
          {jobDescription.length > 0 && jobDescription.length < MIN_JD_LENGTH && (
            <span className="text-amber-500">Paste a longer description for better results</span>
          )}
        </div>
      </div>

      {/* Optional AI API key */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-gray-400 hover:text-brand-500 transition-colors list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
          AI Enhancement (optional — requires Anthropic API key)
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-xs text-gray-400 leading-relaxed">
            Without an API key, the app uses smart local heuristics. With a key, Claude rewrites your
            resume with full natural-language understanding. Your key is never stored on any server.
          </p>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
              placeholder="sk-ant-…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono pr-16 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          {apiKey && (
            <p className="text-xs text-green-600">
              ✓ AI mode enabled — will use claude-sonnet-4-6
            </p>
          )}
        </div>
      </details>

      {/* Optimize button */}
      <button
        onClick={optimize}
        disabled={!canOptimize || isProcessing}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm
          ${canOptimize && !isProcessing
            ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-200 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Optimising…
          </span>
        ) : (
          `${apiKey ? '✨ Optimise with AI' : '⚡ Optimise Resume'}`
        )}
      </button>

      {!originalResume && (
        <p className="text-xs text-center text-gray-400">Upload a resume to enable optimisation</p>
      )}
    </div>
  );
}
