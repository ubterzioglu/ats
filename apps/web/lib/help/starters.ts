export const STARTER_IDS = [
  "upload",
  "score",
  "formats",
  "retention",
  "free",
  "account"
] as const;

export type StarterId = (typeof STARTER_IDS)[number];
