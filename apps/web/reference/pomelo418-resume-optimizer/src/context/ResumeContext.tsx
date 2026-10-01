/**
 * ResumeContext.tsx
 *
 * Single source of truth for the entire app via React Context + useReducer.
 * Zustand would add less boilerplate for this scale, but Context keeps the
 * dependency list minimal and makes the data flow explicit for learners.
 *
 * Persistence: the optimised resume text is auto-saved to localStorage so a
 * page refresh doesn't wipe edits.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  ParsedResume,
  OptimizationResult,
  Toast,
  ProcessingStep,
  ActiveView,
  OptimizedSection,
} from '../types';

// ─── State shape ──────────────────────────────────────────────────────────────

interface ResumeState {
  originalResume: ParsedResume | null;
  optimizationResult: OptimizationResult | null;
  jobDescription: string;
  processingStep: ProcessingStep;
  processingProgress: number;
  processingMessage: string;
  toasts: Toast[];
  activeView: ActiveView;
  apiKey: string;
  /** User edits to the optimised text (keyed by section id → edited content) */
  editedSections: Record<string, string>;
}

const initialState: ResumeState = {
  originalResume: null,
  optimizationResult: null,
  jobDescription: '',
  processingStep: 'idle',
  processingProgress: 0,
  processingMessage: '',
  toasts: [],
  activeView: 'upload',
  apiKey: '',
  editedSections: {},
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_RESUME';       payload: ParsedResume }
  | { type: 'SET_JD';           payload: string }
  | { type: 'SET_RESULT';       payload: OptimizationResult }
  | { type: 'SET_STEP';         payload: { step: ProcessingStep; progress: number; message: string } }
  | { type: 'ADD_TOAST';        payload: Toast }
  | { type: 'REMOVE_TOAST';     payload: string }
  | { type: 'SET_VIEW';         payload: ActiveView }
  | { type: 'SET_API_KEY';      payload: string }
  | { type: 'EDIT_SECTION';     payload: { id: string; content: string } }
  | { type: 'RESET' };

function reducer(state: ResumeState, action: Action): ResumeState {
  switch (action.type) {
    case 'SET_RESUME':
      return { ...state, originalResume: action.payload };
    case 'SET_JD':
      return { ...state, jobDescription: action.payload };
    case 'SET_RESULT':
      return { ...state, optimizationResult: action.payload, editedSections: {} };
    case 'SET_STEP':
      return {
        ...state,
        processingStep: action.payload.step,
        processingProgress: action.payload.progress,
        processingMessage: action.payload.message,
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [action.payload, ...state.toasts].slice(0, 5) };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'EDIT_SECTION':
      return {
        ...state,
        editedSections: { ...state.editedSections, [action.payload.id]: action.payload.content },
      };
    case 'RESET':
      return { ...initialState, apiKey: state.apiKey };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ResumeContextValue extends ResumeState {
  dispatch: React.Dispatch<Action>;
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  /** Returns the current (possibly edited) content for a section */
  getSectionContent: (section: OptimizedSection) => string;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'resume-optimizer-edits';

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    // Rehydrate edited sections from localStorage on mount
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return { ...init, editedSections: JSON.parse(saved) as Record<string, string> };
    } catch { /* ignore */ }
    return init;
  });

  // Persist edits whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.editedSections));
    } catch { /* storage quota exceeded — fail silently */ }
  }, [state.editedSections]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type, duration } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration);
  }, []);

  const getSectionContent = useCallback(
    (section: OptimizedSection) =>
      state.editedSections[section.id] ?? section.content,
    [state.editedSections]
  );

  return (
    <ResumeContext.Provider value={{ ...state, dispatch, addToast, getSectionContent }}>
      {children}
    </ResumeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used inside <ResumeProvider>');
  return ctx;
}
