import type { Finding } from "@/types/analysis";

/**
 * The identity fields an applicant tracking system stores, as the parser sees
 * them. Answers the question candidates actually ask: did it read my details
 * correctly?
 *
 * The status of each field comes from the engine's own findings, not from a
 * second detection pass here. A table that decided for itself whether an email
 * was present would eventually disagree with the score beside it - "no email
 * address found" above a table showing one - and the product's claim is that
 * every lost point is explained. The engine decides; this reads the decision.
 *
 * What is done here is locating the value to show, and saying why when it
 * cannot be shown. A field that is not simply found carries a parse-level
 * cause: not "this is missing", which the reader can see, but what the parser
 * did with the document that led there.
 */

export type FieldId = "name" | "email" | "phone" | "location" | "profile";

export type FieldStatus = "found" | "suspect" | "missing";

export type FieldReason =
  /** The engine counts it present, but nothing legible could be lifted out. */
  | "not-located"
  /** Only matches once two adjacent lines are joined: a column split. */
  | "split-across-lines"
  /** Sits inside a long unbroken line a parser can run together. */
  | "buried-in-a-run"
  /** Nothing in the document resembles this field at all. */
  | "nothing-resembling"
  /** Something close is there, but a parser would not accept it. */
  | "rejected-candidate";

export interface IdentityField {
  readonly id: FieldId;
  readonly status: FieldStatus;
  /** The text to show. Absent when nothing legible was located. */
  readonly value?: string;
  /** Index into the document's lines, for marking it in the parse view. */
  readonly line?: number;
  /** Always present when the status is not `found`. */
  readonly reason?: FieldReason;
  /** The near-miss, when the reason is `rejected-candidate`. */
  readonly candidate?: string;
}

/** The finding each field goes missing with. */
const FINDING_ID: Readonly<Record<FieldId, string>> = {
  name: "contact.name",
  email: "contact.email",
  phone: "contact.phone",
  location: "contact.location",
  profile: "contact.profile"
};

export const FIELD_ORDER: readonly FieldId[] = [
  "name",
  "email",
  "phone",
  "location",
  "profile"
];

const EMAIL = /[\p{L}\d._%+-]+@[\p{L}\d.-]+\.[\p{L}]{2,}/u;
const PROFILE =
  /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|xing\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|stackoverflow\.com)\/\S*/i;
const PHONE = /(?:\+\d{1,3}[\s./-]?)?(?:\(?\d{2,5}\)?[\s./-]?){2,4}\d{2,4}/;

/** Near-misses: close enough that a reader would expect the field to be read. */
const EMAIL_ISH = /\S*@\S*/;
const PROFILE_ISH = /(linkedin|xing|github|gitlab|behance|dribbble|stackoverflow)/i;
const DIGIT_RUN = /[\d][\d\s().+/-]{3,}/;

/** A line long enough that the value is lost inside other text. */
const RUN_LENGTH = 80;

interface Located {
  readonly value: string;
  readonly line: number;
  readonly split?: boolean;
}

function locate(lines: readonly string[], pattern: RegExp): Located | null {
  for (const [index, line] of lines.entries()) {
    const match = line.match(pattern);
    if (match?.[0]) return { value: match[0].trim(), line: index };
  }
  return null;
}

/**
 * A value that only matches once two adjacent lines are joined. Column layouts
 * and bad line breaks do this, and the result is a field a parser reads as two
 * fragments, neither of them usable.
 */
function locateAcrossLines(lines: readonly string[], pattern: RegExp): Located | null {
  for (let index = 0; index < lines.length - 1; index += 1) {
    const joined = `${lines[index] ?? ""}${lines[index + 1] ?? ""}`;
    const match = joined.match(pattern);
    if (match?.[0]) return { value: match[0].trim(), line: index, split: true };
  }
  return null;
}

function locatePhone(lines: readonly string[]): Located | null {
  for (const [index, line] of lines.entries()) {
    const match = line.match(PHONE);
    const digits = match?.[0]?.replace(/\D/g, "") ?? "";
    if (match?.[0] && digits.length >= 8) return { value: match[0].trim(), line: index };
  }
  return null;
}

/** The first line that reads as a plain first-name/last-name pair. */
function locateName(lines: readonly string[]): Located | null {
  for (const [index, line] of lines.slice(0, 6).entries()) {
    if (/[@\d]/.test(line)) continue;
    const words = line.trim().split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) continue;
    if (words.every((word) => /^[\p{Lu}][\p{L}'.-]*$/u.test(word))) {
      return { value: line.trim(), line: index };
    }
  }
  return null;
}

function locateLocation(lines: readonly string[], email: Located | null): Located | null {
  // The engine's place list is deliberately broad and lives with the score.
  // Rather than copy it, the header block is shown: whatever sits beside the
  // contact details is what a reader would call the location line.
  const start = email?.line ?? 0;
  for (let index = start; index < Math.min(lines.length, start + 4); index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (line.length === 0) continue;
    if (EMAIL.test(line) || PROFILE.test(line)) {
      const rest = line.replace(EMAIL, "").replace(PROFILE, "").replace(PHONE, "").trim();
      const cleaned = rest.replace(/^[·|,;/–—-]+|[·|,;/–—-]+$/g, "").trim();
      if (cleaned.length > 1) return { value: cleaned, line: index };
      continue;
    }
    return { value: line, line: index };
  }
  return null;
}

/** The near-miss that explains a field the engine refused to count. */
function nearMiss(id: FieldId, lines: readonly string[]): string | null {
  const raw = lines.join("\n");

  if (id === "email") return raw.match(EMAIL_ISH)?.[0]?.trim() ?? null;
  if (id === "profile") {
    const line = lines.find((entry) => PROFILE_ISH.test(entry));
    return line?.trim() ?? null;
  }
  if (id === "phone") {
    const run = raw.match(DIGIT_RUN)?.[0]?.trim();
    return run && run.replace(/\D/g, "").length >= 4 ? run : null;
  }
  if (id === "name") {
    // A header line of the right length that fails the capitalisation test.
    const line = lines
      .slice(0, 6)
      .find((entry) => {
        const words = entry.trim().split(/\s+/).filter(Boolean);
        return words.length >= 2 && words.length <= 4 && entry.trim().length > 0;
      });
    return line?.trim() ?? null;
  }
  return null;
}

export function readIdentity(
  cvText: string,
  findings: readonly Finding[]
): readonly IdentityField[] {
  const lines = cvText.split("\n");
  const missing = new Set(findings.map((finding) => finding.id));

  const email = locate(lines, EMAIL);

  const located: Readonly<Record<FieldId, Located | null>> = {
    name: locateName(lines),
    email: email ?? locateAcrossLines(lines, EMAIL),
    phone: locatePhone(lines) ?? locateAcrossLines(lines, PHONE),
    profile: locate(lines, PROFILE) ?? locateAcrossLines(lines, PROFILE),
    location: locateLocation(lines, email)
  };

  return FIELD_ORDER.map((id): IdentityField => {
    if (missing.has(FINDING_ID[id])) {
      const candidate = nearMiss(id, lines);
      return candidate
        ? { id, status: "missing", reason: "rejected-candidate", candidate }
        : { id, status: "missing", reason: "nothing-resembling" };
    }

    const found = located[id];
    if (!found) return { id, status: "suspect", reason: "not-located" };

    if (found.split) {
      return {
        id,
        status: "suspect",
        value: found.value,
        line: found.line,
        reason: "split-across-lines"
      };
    }

    if ((lines[found.line] ?? "").length > RUN_LENGTH) {
      return {
        id,
        status: "suspect",
        value: found.value,
        line: found.line,
        reason: "buried-in-a-run"
      };
    }

    return { id, status: "found", value: found.value, line: found.line };
  });
}
