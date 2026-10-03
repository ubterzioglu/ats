import type { Resume } from "@/types/resume";

/**
 * Presentation-neutral renderings shared by every exporter, so a date or a
 * contact block reads the same in DOCX and in every PDF template. One source
 * of truth, because two exporters disagreeing about what "" means would make
 * the product contradict itself across download buttons.
 */

/**
 * The engine reads periods as months since year zero; JSON Resume writes
 * YYYY-MM. This is the one formatter for that conversion, shared by every
 * importer, so two modules can never disagree about what a month number
 * means.
 */
export function formatEngineMonth(months: number): string {
  const year = Math.floor(months / 12);
  const month = (months % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * JSON Resume writes "" for a role that is still open, so "" reads as
 * "present"; a missing end date is unknown and renders as the start alone.
 */
export function renderDateRange(start?: string, end?: string): string | null {
  const endText = end === "" ? "present" : end;
  if (start !== undefined && start !== "" && endText !== undefined && endText !== "") {
    return `${start} - ${endText}`;
  }
  if (start !== undefined && start !== "") return start;
  if (endText !== undefined && endText !== "") return endText;
  return null;
}

export function renderLocation(resume: Resume): string {
  const location = resume.basics?.location;
  if (location === undefined) return "";
  const cityLine = [location.postalCode, location.city].filter(Boolean).join(" ").trim();
  return [location.address, cityLine, location.region, location.countryCode]
    .filter(Boolean)
    .join(", ");
}

/**
 * The contact parts in display order, empties dropped. Exporters choose their
 * own joiner: the DOCX separates with a pipe, the PDF templates with a comma
 * because a text layer full of pipes reads as a table to a parser.
 */
export function renderContactParts(resume: Resume): string[] {
  const basics = resume.basics;
  if (basics === undefined) return [];
  const parts = [basics.email, basics.phone, basics.url, renderLocation(resume)].filter(
    (part): part is string => part !== undefined && part !== ""
  );
  for (const profile of basics.profiles ?? []) {
    const rendered = [profile.network, profile.username ?? profile.url]
      .filter(Boolean)
      .join(": ");
    if (rendered.length > 0) parts.push(rendered);
  }
  return parts;
}
