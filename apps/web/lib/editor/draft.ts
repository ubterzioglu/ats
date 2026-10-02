import type { Resume } from "@/types/resume";

/**
 * Immutable edits to the resume draft, addressed by path.
 *
 * Every operation returns a new document. The editor holds one value in state
 * and replaces it; nothing is mutated in place, so a render always sees a
 * consistent document and an undo stack would be a list of these values.
 *
 * The rule that outranks everything here: empty stays empty. Clearing a field
 * removes the key rather than storing "", and removing the last item of a
 * section removes the section. A document that has been opened and closed must
 * come out the way it went in, and a builder that quietly leaves `"name": ""`
 * behind has invented a field the candidate never wrote.
 */

export type Path = readonly (string | number)[];

type Json = Record<string, unknown> | unknown[];

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Writes `value` at `path`, dropping keys that become empty on the way back up.
 * `undefined` removes. The one exception is the empty string in a date field,
 * which JSON Resume uses to mean a role that is still open - callers that need
 * it pass it through `setLiteral`.
 */
function write(target: unknown, path: Path, value: unknown, keepEmpty: boolean): unknown {
  const [head, ...rest] = path;
  if (head === undefined) return value;

  if (typeof head === "number") {
    const source = Array.isArray(target) ? target : [];
    const next = [...source];
    next[head] = write(next[head], rest, value, keepEmpty);
    return next;
  }

  const source = target && typeof target === "object" && !Array.isArray(target)
    ? (target as Record<string, unknown>)
    : {};
  const child = write(source[head], rest, value, keepEmpty);

  const next = { ...source };
  if (!keepEmpty && isEmpty(child)) delete next[head];
  else next[head] = child;

  return next;
}

export function setField(resume: Resume, path: Path, value: unknown): Resume {
  return write(resume, path, value, false) as Resume;
}

/** Keeps an empty string, which a date field uses to mean "still here". */
export function setLiteral(resume: Resume, path: Path, value: unknown): Resume {
  return write(resume, path, value, true) as Resume;
}

export function clearField(resume: Resume, path: Path): Resume {
  return setField(resume, path, undefined);
}

function readAt(resume: Resume, path: Path): unknown {
  let cursor: unknown = resume;
  for (const step of path) {
    if (cursor === undefined || cursor === null) return undefined;
    cursor = (cursor as Json as Record<string | number, unknown>)[step];
  }
  return cursor;
}

export function readList(resume: Resume, path: Path): readonly unknown[] {
  const value = readAt(resume, path);
  return Array.isArray(value) ? value : [];
}

export function readValue(resume: Resume, path: Path): unknown {
  return readAt(resume, path);
}

export function appendItem(resume: Resume, path: Path, item: unknown): Resume {
  const list = readList(resume, path);
  // Written with setLiteral: a new row is an empty object, and setField would
  // drop it for being empty before the user has typed anything into it.
  return setLiteral(resume, path, [...list, item]);
}

export function removeItem(resume: Resume, path: Path, index: number): Resume {
  const list = readList(resume, path);
  if (list[index] === undefined) return resume;
  return setField(resume, path, list.filter((_, at) => at !== index));
}

export function moveItem(resume: Resume, path: Path, from: number, to: number): Resume {
  const list = [...readList(resume, path)];
  if (from === to) return resume;
  const [moved] = list.splice(from, 1);
  if (moved === undefined) return resume;
  list.splice(Math.max(0, Math.min(list.length, to)), 0, moved);
  return setLiteral(resume, path, list);
}

/** `["a", "b"]` from "a, b" - the editing shape of highlights and keywords. */
export function parseStringList(value: string): readonly string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function formatStringList(value: unknown): string {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string").join("\n") : "";
}
