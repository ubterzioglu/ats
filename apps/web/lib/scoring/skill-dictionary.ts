import raw from "./data/skills.json";

/**
 * The static skill dictionary compiled by scripts/build-skill-dictionary.mjs
 * from ESCO (en, de), O*NET (en) and a hand-made Turkish list. It is imported
 * as data, so the engine stays pure: no file or network access at runtime.
 * The curated taxonomy in ./taxonomy.ts always takes priority over it.
 */

export type DictionaryLanguage = "en" | "de" | "tr";
export type DictionarySource = "esco" | "onet" | "manual-tr";

export interface DictionaryEntry {
  readonly term: string;
  readonly language: DictionaryLanguage;
  readonly source: DictionarySource;
  readonly aliases: readonly string[];
}

export interface DictionarySourceInfo {
  readonly name: string;
  readonly version: string;
  readonly retrieved?: string;
  readonly url: string | null;
}

const LANGUAGES: ReadonlySet<string> = new Set(["en", "de", "tr"]);
const SOURCES: ReadonlySet<string> = new Set(["esco", "onet", "manual-tr"]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** Reads one `[term, language, source, aliases?]` tuple; a malformed row is skipped. */
export function parseDictionaryRow(row: unknown): DictionaryEntry | null {
  if (!Array.isArray(row) || row.length < 3 || row.length > 4) return null;
  const [term, language, source, aliases = []] = row as unknown[];
  if (typeof term !== "string" || term.length === 0) return null;
  if (typeof language !== "string" || !LANGUAGES.has(language)) return null;
  if (typeof source !== "string" || !SOURCES.has(source)) return null;
  if (!isStringArray(aliases)) return null;
  return {
    term,
    language: language as DictionaryLanguage,
    source: source as DictionarySource,
    aliases
  };
}

export const DICTIONARY_ENTRIES: readonly DictionaryEntry[] = raw.entries
  .map((row: unknown) => parseDictionaryRow(row))
  .filter((entry): entry is DictionaryEntry => entry !== null);

export const DICTIONARY_SOURCES: Readonly<Record<DictionarySource, DictionarySourceInfo>> =
  raw.sources;
