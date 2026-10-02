/**
 * Reads what a job ad demands in plain digits, starting with the one number
 * ads state outright: the minimum years of experience. A tenure filter checks
 * this before anything else, so the report has to check it too.
 */

export interface ExperienceRequirement {
  readonly years: number;
  /** The ad line the number was read from, quoted as evidence. */
  readonly source: string;
}

const YEARS_RX = /(\d{1,2})\s*\+?\s*(?:years?|yrs?|jahre?n?|yıl|yil|sene)\b/giu;
const MAX_PLAUSIBLE_YEARS = 60;

/**
 * Returns the highest stated minimum across the ad, because an ad that asks
 * for "2+ years with Kafka" and "8+ years in platform engineering" filters on
 * the larger number. Null rather than a guess when no minimum is stated.
 */
export function extractExperienceRequirement(jobDescription: string): ExperienceRequirement | null {
  let best: ExperienceRequirement | null = null;

  for (const rawLine of jobDescription.split("\n")) {
    const line = rawLine.trim();
    YEARS_RX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = YEARS_RX.exec(line)) !== null) {
      const years = Number(match[1]);
      if (!Number.isFinite(years) || years <= 0 || years > MAX_PLAUSIBLE_YEARS) continue;
      if (!best || years > best.years) best = { years, source: line };
    }
  }

  return best;
}
