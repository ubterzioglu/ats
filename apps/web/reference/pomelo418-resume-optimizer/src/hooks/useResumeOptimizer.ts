/**
 * useResumeOptimizer.ts
 *
 * Orchestrates the multi-step optimisation flow and updates the global
 * ResumeContext with progress, results, and error toasts.
 *
 * Separating this logic from the component keeps components thin
 * (purely concerned with rendering) and makes the pipeline easy to test.
 */

import { useCallback } from 'react';
import { useResume } from '../context/ResumeContext';
import { parseResume } from '../services/resumeParser';
import { optimizeLocally, optimizeWithAI } from '../services/resumeOptimizer';

export function useResumeOptimizer() {
  const { dispatch, addToast, apiKey, jobDescription, originalResume } = useResume();

  // ── Step 1: Parse a dropped/selected file ──────────────────────────────────
  const loadFile = useCallback(async (file: File) => {
    dispatch({ type: 'SET_STEP', payload: { step: 'parsing', progress: 10, message: 'Parsing your resume…' } });
    try {
      const parsed = await parseResume(file);
      dispatch({ type: 'SET_RESUME', payload: parsed });
      dispatch({ type: 'SET_STEP', payload: { step: 'idle', progress: 0, message: '' } });
      addToast(`Loaded "${parsed.fileName}" — ${parsed.sections.length} sections detected.`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file.';
      dispatch({ type: 'SET_STEP', payload: { step: 'error', progress: 0, message } });
      addToast(message, 'error');
    }
  }, [dispatch, addToast]);

  // ── Step 2: Run optimisation ───────────────────────────────────────────────
  const optimize = useCallback(async () => {
    if (!originalResume) {
      addToast('Please upload a resume first.', 'warning');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Please paste a job description first.', 'warning');
      return;
    }

    const onProgress = (message: string, progress: number) => {
      type StepKey = 'extracting-keywords' | 'rewriting-bullets' | 'scoring' | 'complete';
      const stepMap: Record<number, StepKey> = {
        20: 'extracting-keywords',
        40: 'extracting-keywords',
        60: 'rewriting-bullets',
        80: 'scoring',
        100: 'complete',
      };
      const stepKey = Object.keys(stepMap)
        .map(Number)
        .reduce((prev, curr) => (Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev));

      dispatch({
        type: 'SET_STEP',
        payload: { step: stepMap[stepKey] ?? 'rewriting-bullets', progress, message },
      });
    };

    try {
      dispatch({ type: 'SET_STEP', payload: { step: 'extracting-keywords', progress: 5, message: 'Starting optimisation…' } });

      const result = apiKey
        ? await optimizeWithAI(originalResume, jobDescription, apiKey, onProgress)
        : await optimizeLocally(originalResume, jobDescription, onProgress);

      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP',   payload: { step: 'idle', progress: 0, message: '' } });
      dispatch({ type: 'SET_VIEW',   payload: 'compare' });
      addToast(
        `Optimisation complete! ATS score: ${result.atsScore}%. ${result.missingSuggestedSkills.length} skills to consider adding.`,
        'success',
        6000
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimisation failed.';
      dispatch({ type: 'SET_STEP', payload: { step: 'error', progress: 0, message } });
      addToast(message, 'error', 8000);
    }
  }, [originalResume, jobDescription, apiKey, dispatch, addToast]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  return { loadFile, optimize, reset };
}
