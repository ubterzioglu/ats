import { AMBIGUOUS_TERMS } from "./ambiguous-terms";
import raw from "./data/approved-synonyms.json";
import { isJobNoise, isStopword } from "./stopwords";
import { caseFold, tokenize } from "./text";

/**
 * Synonyms a person has approved into the static data
 * (lib/scoring/data/approved-synonyms.json). They are proposed offline by
 * scripts/mine-synonyms.mjs and moved here by scripts/approve-synonyms.mjs;
 * nothing is mined or embedded at runtime. Only entries with
 * `approvedBy: "human"` reach the engine. A `"pending-review"` entry is a
 * suggestion on file and has no effect on any score.
 */

export type ApprovalState = "human" | "pending-review";
export type SynonymLanguage = "en" | "de" | "tr";
export type SynonymOrigin = "miner" | "manual";

export interface ApprovedSynonym {
  readonly id: string;
  readonly canonical: string;
  readonly aliases: readonly string[];
  readonly languages: readonly SynonymLanguage[];
  readonly approvedBy: ApprovalState;
  /** YYYY-MM-DD; required once a person approved the entry. */
  readonly approvedOn: string | null;
  readonly origin: SynonymOrigin;
  /** Lowest pairwise similarity the miner measured, or null for a manual entry. */
  readonly similarity: number | null;
  readonly note?: string;
}

const LANGUAGES: ReadonlySet<string> = new Set(["en", "de", "tr"]);
const STATES: ReadonlySet<string> = new Set(["human", "pending-review"]);
const ORIGINS: ReadonlySet<string> = new Set(["miner", "manual"]);
const ID_RX = /^syn-[a-z0-9-]{4,64}$/;
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Stored the way the engine compares: folded, trimmed, single-spaced. */
function isFoldedSurface(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value === caseFold(value).trim().replace(/\s+/g, " ")
  );
}

/**
 * A surface no synonym may use: too short, an ambiguous token ("go", "r"),
 * a stopword or job-ad noise. The same guard the dictionary build applies.
 */
export function isGuardedSurface(term: string): boolean {
  if (term.length < 3 || tokenize(term).length === 0) return true;
  return AMBIGUOUS_TERMS.has(term) || isStopword(term) || isJobNoise(term);
}

function digitRuns(term: string): string {
  return (term.match(/\d+/g) ?? []).join(".");
}

function lettersOnly(term: string): string {
  return term.replace(/[^\p{L}]/gu, "");
}

function symbols(term: string): string {
  return term.replace(/[^+#]/g, "");
}

/**
 * Two spellings that name different versions or different languages of the
 * same family: "html" / "html5", "iso 9001" / "iso 27001", "c" / "c++",
 * "c#" / "c++". Embeddings put these close together; they are never synonyms.
 */
export function differsByVersion(a: string, b: string): boolean {
  if (digitRuns(a) !== digitRuns(b)) return true;
  return lettersOnly(a) === lettersOnly(b) && symbols(a) !== symbols(b);
}

/**
 * One spelling nested inside the other: "java" / "javascript", "sql" /
 * "mysql", "angular" / "angularjs". Usually a different product or a narrower
 * term, so the miner does not propose them.
 */
export function nestedSpelling(a: string, b: string): boolean {
  const left = lettersOnly(a);
  const right = lettersOnly(b);
  if (left.length === 0 || right.length === 0 || left === right) return false;
  return left.includes(right) || right.includes(left);
}

/** Reads one entry; anything malformed is skipped rather than trusted. */
export function parseApprovedSynonym(value: unknown): ApprovedSynonym | null {
  if (!isRecord(value)) return null;
  const { id, canonical, aliases, languages, approvedBy, approvedOn, origin, similarity, note } = value;
  if (typeof id !== "string" || !ID_RX.test(id)) return null;
  if (!isFoldedSurface(canonical)) return null;
  if (!Array.isArray(aliases) || aliases.length === 0 || !aliases.every(isFoldedSurface)) return null;
  if (new Set(aliases).size !== aliases.length || aliases.includes(canonical)) return null;
  if (!Array.isArray(languages) || !languages.every((item) => typeof item === "string" && LANGUAGES.has(item))) {
    return null;
  }
  if (typeof approvedBy !== "string" || !STATES.has(approvedBy)) return null;
  if (approvedOn !== null && (typeof approvedOn !== "string" || !DATE_RX.test(approvedOn))) return null;
  if (approvedBy === "human" && approvedOn === null) return null;
  if (typeof origin !== "string" || !ORIGINS.has(origin)) return null;
  if (similarity !== null && (typeof similarity !== "number" || similarity < -1 || similarity > 1)) return null;
  if (note !== undefined && typeof note !== "string") return null;
  return {
    id,
    canonical,
    aliases: aliases as string[],
    languages: languages as SynonymLanguage[],
    approvedBy: approvedBy as ApprovalState,
    approvedOn: approvedOn as string | null,
    origin: origin as SynonymOrigin,
    similarity: similarity as number | null,
    ...(note !== undefined ? { note: note as string } : {})
  };
}

export interface ApprovedSynonymFile {
  readonly entries: readonly ApprovedSynonym[];
  /** Rows dropped as malformed or as a repeated id. */
  readonly rejected: number;
}

export function parseApprovedSynonymFile(value: unknown): ApprovedSynonymFile {
  if (!isRecord(value) || value.schema !== 1 || !Array.isArray(value.entries)) {
    return { entries: [], rejected: 0 };
  }
  const ids = new Set<string>();
  const entries: ApprovedSynonym[] = [];
  for (const row of value.entries as unknown[]) {
    const entry = parseApprovedSynonym(row);
    if (entry === null || ids.has(entry.id)) continue;
    ids.add(entry.id);
    entries.push(entry);
  }
  return { entries, rejected: value.entries.length - entries.length };
}

/** Every valid entry on file, pending ones included. For the scripts and tests. */
export const APPROVED_SYNONYM_FILE: ApprovedSynonymFile = parseApprovedSynonymFile(raw as unknown);

/** The only entries the engine reads. */
export const HUMAN_APPROVED_SYNONYMS: readonly ApprovedSynonym[] = APPROVED_SYNONYM_FILE.entries.filter(
  (entry) => entry.approvedBy === "human"
);
