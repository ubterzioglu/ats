import type { TargetMarket } from "@/types/analysis";

import type { ScoreContext } from "./context";
import type { FindingDraft } from "./dimension";

/**
 * Market norms for the personal-data block. What a Turkish employer expects
 * (photo, date of birth, military status) is what an American one is told
 * never to collect, and a German Lebenslauf sits in between. The engine cannot
 * see a photo - a text layer can only carry the labels and lines around it -
 * so this detects the fields a parser would read and judges them against the
 * selected market.
 */

export type PersonalField = "photo" | "date-of-birth" | "marital-status" | "military-service";

export interface PersonalFieldMatch {
  readonly field: PersonalField;
  readonly line: string;
}

const FIELD_PATTERNS: readonly (readonly [PersonalField, RegExp])[] = [
  [
    "date-of-birth",
    /\b(date of birth|birth date|geburtsdatum|geboren am|doğum tarihi|dogum tarihi)\b/iu
  ],
  [
    "marital-status",
    /\b(marital status|familienstand|medeni durum|medeni hal|medeni hâl|evli|bekar|bekâr|verheiratet|ledig)\b/iu
  ],
  [
    "military-service",
    /\b(military service|military obligation|wehrdienst|zivildienst|askerlik)\b/iu
  ],
  ["photo", /\b(photo|foto|fotograf|fotoğraf|passbild|lichtbild|vesikalık|vesikalik)\b/iu]
];

const FIELD_LABELS: Readonly<Record<PersonalField, string>> = {
  photo: "a photo reference",
  "date-of-birth": "date of birth",
  "marital-status": "marital status",
  "military-service": "military service"
};

/** Finds the personal-data fields a parser would read, one hit per field. */
export function detectPersonalFields(lines: readonly string[]): PersonalFieldMatch[] {
  const found = new Map<PersonalField, string>();
  for (const line of lines) {
    for (const [field, pattern] of FIELD_PATTERNS) {
      if (found.has(field)) continue;
      if (pattern.test(line)) found.set(field, line);
    }
  }
  return [...found.entries()].map(([field, line]) => ({ field, line }));
}

/**
 * Norm findings for the selected market. Presence findings cost points where
 * the market reads the field as a defect; absence never costs - markets that
 * expect a date of birth only get a zero-cost advisory, because no parser
 * fails without one.
 */
export function marketFindings(context: ScoreContext, market: TargetMarket): FindingDraft[] {
  const matches = detectPersonalFields(context.lines);
  const present = new Set(matches.map((match) => match.field));
  const drafts: FindingDraft[] = [];

  if (market === "en" && matches.length > 0) {
    const fields = matches.map((match) => FIELD_LABELS[match.field]);
    drafts.push({
      id: "contact.market-personal-data",
      severity: "medium",
      title: "Personal details an English-market CV leaves out",
      detail: `The document carries ${fields.join(", ")}. US and UK style applications expect none of these; many employers discard them on sight to stay clear of discrimination rules.`,
      fix: "Remove these lines for English-market applications. Keep the contact block to name, email, phone, location and profile links.",
      cost: 2,
      evidence: matches.slice(0, 4).map((match) => match.line)
    });
  }

  if (market === "de" && present.has("military-service")) {
    const line = matches.find((match) => match.field === "military-service")?.line;
    drafts.push({
      id: "contact.market-military-service",
      severity: "low",
      title: "Military service reads as dated in a German CV",
      detail: "Wehrdienst has not been part of the standard Lebenslauf since conscription ended in 2011. It costs a line and invites questions the role does not need.",
      fix: "Drop the Wehrdienst line unless the employer explicitly asks for it.",
      cost: 1,
      ...(line !== undefined ? { evidence: [line] } : {})
    });
  }

  if (market === "tr" && !present.has("date-of-birth")) {
    drafts.push({
      id: "contact.market-expectations",
      severity: "low",
      title: "Turkish employers commonly expect a photo and date of birth",
      detail: "Most Turkish employers still ask for a vesikalık photo and a doğum tarihi. No parser needs them, but their absence can read as an incomplete application in this market.",
      fix: "If this CV targets the Turkish market, add your date of birth and expect to supply a photo with the application.",
      cost: 0
    });
  }

  if (market === "de" && !present.has("date-of-birth")) {
    drafts.push({
      id: "contact.market-expectations",
      severity: "low",
      title: "A date of birth is still common in a German Lebenslauf",
      detail: "Many German employers expect a Geburtsdatum, and a photo is still widespread though no longer required. No parser needs either; this is about what the reader expects.",
      fix: "If this CV targets the German market, consider adding your Geburtsdatum under the contact block.",
      cost: 0
    });
  }

  return drafts;
}
