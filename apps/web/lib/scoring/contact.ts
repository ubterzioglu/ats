import type { TargetMarket } from "@/types/analysis";

import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { marketFindings } from "./market";
import { caseFold } from "./text";

export const CONTACT_MAX = 10;

const EMAIL = /[\p{L}\d._%+-]+@[\p{L}\d.-]+\.[\p{L}]{2,}/u;
const PHONE = /(\+\d{1,3}[\s./-]?)?(\(?\d{2,5}\)?[\s./-]?){2,4}\d{2,4}/;
const DATE_RANGE = /^\d{2,4}[\s./-]+\d{2,4}$/;
const PROFILE = /(linkedin\.com|xing\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|stackoverflow\.com)/i;
const PLACE =
  /(?<![\p{L}\p{N}])(\d{4,5}\s+[\p{Lu}][\p{L}]+|remote|hybrid|germany|deutschland|austria|osterreich|österreich|switzerland|schweiz|turkey|turkiye|türkiye|netherlands|berlin|munich|munchen|münchen|hamburg|frankfurt|koln|köln|stuttgart|dusseldorf|düsseldorf|istanbul|ankara|izmir|vienna|wien|zurich|zürich|london|amsterdam)(?![\p{L}\p{N}])/iu;

function looksLikeName(line: string): boolean {
  if (/[@\d]/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((word) => /^[\p{Lu}][\p{L}'.-]*$/u.test(word) || /^(?:van|von|der|den|de|la|le)$/i.test(word));
}

/** Contact data is the one thing an ATS must lift out of the document. */
export function scoreContact(context: ScoreContext, market?: TargetMarket): DimensionOutcome {
  const { raw, lines } = context;
  const drafts: FindingDraft[] = [];

  if (!EMAIL.test(raw)) {
    drafts.push({
      id: "contact.email",
      severity: "critical",
      title: "No email address found",
      detail: "Without a parseable address the application can end up in the system with no way to reply to it.",
      fix: "Put the address on its own line as plain text near the top.",
      cost: 4
    });
  }

  const phoneCandidate = raw.match(PHONE);
  const phoneDigits = phoneCandidate ? phoneCandidate[0].replace(/\D/g, "") : "";
  const isDateRange = phoneCandidate ? DATE_RANGE.test(phoneCandidate[0].trim()) : false;
  if (!phoneCandidate || phoneDigits.length < 8 || isDateRange) {
    drafts.push({
      id: "contact.phone",
      severity: "high",
      title: "No phone number found",
      detail: "Recruiters filter on reachability; a missing number drops the record in some systems.",
      fix: "Add the number in international format, for example +49 151 1234567.",
      cost: 3
    });
  }

  if (!PROFILE.test(raw)) {
    drafts.push({
      id: "contact.profile",
      severity: "medium",
      title: "No professional profile link",
      detail: "A LinkedIn, Xing or GitHub URL is a field most systems store and recruiters search on.",
      fix: "Add the full URL as text, not as a hidden hyperlink behind an icon.",
      cost: 2
    });
  }

  if (!PLACE.test(caseFold(raw))) {
    drafts.push({
      id: "contact.location",
      severity: "low",
      title: "No location given",
      detail: "Location drives shortlisting filters for on-site and hybrid roles.",
      fix: "Add city and country, or state that you work remotely.",
      cost: 1
    });
  }

  if (!lines.slice(0, 6).some(looksLikeName)) {
    drafts.push({
      id: "contact.name",
      severity: "medium",
      title: "Name not recognisable at the top",
      detail: "The first lines hold no plain first-name/last-name pair, so name detection falls back to guessing.",
      fix: "Start the document with your name on its own line, without styling tricks.",
      cost: 2
    });
  }

  // Market norms judge the personal-data block; without an explicit choice
  // the document's own language stands in for its market.
  drafts.push(...marketFindings(context, market ?? context.language));

  return buildOutcome("contact", "Contact", CONTACT_MAX, drafts, (score) =>
    score >= 9
      ? "All the identity fields an ATS stores are present."
      : score >= 6
        ? "Some contact fields are missing or hard to read."
        : "The system cannot reliably build a candidate record from this."
  );
}
