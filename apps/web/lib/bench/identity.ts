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
 * What is done here is locating the value to show, which the engine has no
 * reason to keep. When the engine says a field is present and nothing legible
 * can be found to display, that disagreement is itself the signal: the field is
 * there but damaged, which is `suspect`.
 */

export type FieldId = "name" | "email" | "phone" | "location" | "profile";

export type FieldStatus = "found" | "suspect" | "missing";

export type SuspectReason = "not-located" | "split-across-lines" | "buried-in-a-run";

export interface IdentityField {
  readonly id: FieldId;
  readonly status: FieldStatus;
  /** The text to show. Absent when nothing legible was located. */
  readonly value?: string;
  /** Index into the document's lines, for marking it in the parse view. */
  readonly line?: number;
  readonly reason?: SuspectReason;
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

/** A line long enough that the value is lost inside other text. */
const RUN_LENGTH = 80;

interface Located {
  readonly value: string;
  readonly line: number;
}

function locate(lines: readonly string[], pattern: RegExp): Located | null {
  for (const [index, line] of lines.entries()) {
    const match = line.match(pattern);
    if (match?.[0]) return { value: match[0].trim(), line: index };
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

function reasonFor(located: Located | null, lines: readonly string[]): SuspectReason | undefined {
  if (!located) return "not-located";
  const line = lines[located.line] ?? "";
  if (line.length > RUN_LENGTH) return "buried-in-a-run";
  return undefined;
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
    email,
    phone: locatePhone(lines),
    profile: locate(lines, PROFILE),
    location: locateLocation(lines, email)
  };

  return FIELD_ORDER.map((id) => {
    if (missing.has(FINDING_ID[id])) return { id, status: "missing" as const };

    const found = located[id];
    const reason = reasonFor(found, lines);

    if (!found) return { id, status: "suspect" as const, reason: "not-located" as const };

    return reason
      ? { id, status: "suspect" as const, value: found.value, line: found.line, reason }
      : { id, status: "found" as const, value: found.value, line: found.line };
  });
}
