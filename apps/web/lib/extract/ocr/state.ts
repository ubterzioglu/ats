/**
 * The OCR panel's state machine. Nothing leaves "offer" without a "start",
 * which only the consent button sends. After a cancel or a failure every
 * late event from the abandoned run is ignored, so a page that finishes
 * recognising after the user pressed Cancel cannot bring the panel back.
 */

export type OcrFailure = "download" | "recognition" | "unsupported";

export type OcrState =
  | { readonly phase: "offer" }
  | { readonly phase: "downloading"; readonly loaded: number; readonly total: number }
  | {
      readonly phase: "recognising";
      readonly page: number;
      readonly pages: number;
      readonly progress: number;
    }
  | { readonly phase: "done"; readonly pages: number; readonly found: number }
  | { readonly phase: "cancelled" }
  | { readonly phase: "failed"; readonly reason: OcrFailure };

export type OcrEvent =
  | { readonly type: "start"; readonly total: number }
  | { readonly type: "downloaded"; readonly loaded: number }
  | {
      readonly type: "recognising";
      readonly page: number;
      readonly pages: number;
      readonly progress: number;
    }
  | { readonly type: "finished"; readonly pages: number; readonly found: number }
  | { readonly type: "cancel" }
  | { readonly type: "fail"; readonly reason: OcrFailure };

export const INITIAL_OCR_STATE: OcrState = { phase: "offer" };

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function isRunning(state: OcrState): boolean {
  return state.phase === "downloading" || state.phase === "recognising";
}

export function ocrReducer(state: OcrState, event: OcrEvent): OcrState {
  switch (event.type) {
    case "start":
      if (isRunning(state) || state.phase === "done") return state;
      return { phase: "downloading", loaded: 0, total: Math.max(0, event.total) };

    case "downloaded":
      if (state.phase !== "downloading") return state;
      return {
        ...state,
        loaded: Math.max(state.loaded, clamp(event.loaded, 0, state.total))
      };

    case "recognising": {
      if (!isRunning(state)) return state;
      const pages = Math.max(1, event.pages);
      const page = clamp(event.page, 1, pages);
      const progress = clamp(event.progress, 0, 1);
      if (state.phase === "recognising") {
        if (page < state.page) return state;
        if (page === state.page && progress < state.progress) return state;
      }
      return { phase: "recognising", page, pages, progress };
    }

    case "finished":
      if (state.phase !== "recognising") return state;
      return { phase: "done", pages: event.pages, found: event.found };

    case "cancel":
      return isRunning(state) ? { phase: "cancelled" } : state;

    case "fail":
      if (event.reason === "unsupported" && state.phase === "offer") {
        return { phase: "failed", reason: event.reason };
      }
      return isRunning(state) ? { phase: "failed", reason: event.reason } : state;
  }
}

/** Percentage of the current stage: bytes downloaded, then pages read. */
export function ocrPercent(state: OcrState): number {
  switch (state.phase) {
    case "downloading":
      return state.total > 0 ? Math.round((state.loaded / state.total) * 100) : 0;
    case "recognising":
      return Math.round(((state.page - 1 + state.progress) / state.pages) * 100);
    case "done":
      return 100;
    default:
      return 0;
  }
}
