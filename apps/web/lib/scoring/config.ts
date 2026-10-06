export const ENGINE_VERSION = "1.3.0";

export const BAND_THRESHOLDS = [
  [85, "excellent", "Parses cleanly and matches the target role"],
  [70, "good", "Gets through the filter with minor losses"],
  [55, "fair", "Survives parsing but loses relevance"],
  [0, "risky", "Likely to be dropped or misread"]
] as const;

export const GARBLED_THRESHOLD = 0.3;
export const MOJIBAKE_THRESHOLD = 2;
export const STUFFING_THRESHOLD = 12;
export const WORDS_PER_PAGE = 520;

/** Below this the text layer is treated as missing (`parse.too-little-text`). */
export const TOO_LITTLE_TEXT_WORDS = 150;
/** Below this a readable document is thin (`parse.thin-text`). */
export const THIN_TEXT_WORDS = 260;
/** Below this the CV is short (`structure.too-short`). */
export const TOO_SHORT_WORDS = 280;
