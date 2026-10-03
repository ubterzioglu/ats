import { renderDateRange } from "@/lib/resume/presentation";
import { detectLanguage } from "@/lib/scoring/language";
import { countOccurrences } from "@/lib/scoring/match";
import { isStopword } from "@/lib/scoring/stopwords";
import { canonicalize } from "@/lib/scoring/taxonomy";
import { caseFold } from "@/lib/scoring/text";
import type { LinkedinPosition, LinkedinProfile } from "@/types/linkedin";
import type { Resume, ResumeWorkItem } from "@/types/resume";

/**
 * The consistency report between the canonical resume and the parsed
 * LinkedIn export. Every inconsistency cites both sources - a "does not
 * match" line without the two quotes side by side is an accusation, not a
 * finding, and this product does not make those.
 *
 * Two things come from the engine and are never reimplemented here: dates
 * (both sides arrive normalised to YYYY-MM through extractPeriods, and the
 * comparison is month arithmetic on canonical strings) and term matching
 * (countOccurrences, so "CI/CD" finds "continuous integration" exactly as
 * the score would - a private matcher here would contradict the report).
 */

export type InconsistencyKind =
  | "date-mismatch"
  | "title-mismatch"
  | "skill-only-in-cv"
  | "headline-mismatch";

export interface Inconsistency {
  readonly id: string;
  readonly kind: InconsistencyKind;
  /** Plain engine wording, one sentence, both sides named. */
  readonly detail: string;
  readonly cvEvidence: string;
  readonly profileEvidence: string;
}

export interface ConsistencyReport {
  readonly inconsistencies: readonly Inconsistency[];
  /** How many CV roles found a profile role to compare against. */
  readonly matchedRoles: number;
  readonly comparedSkills: number;
}

const DATE_TOLERANCE_MONTHS = 1;

function monthsOf(date: string): number | null {
  const match = /^(\d{4})(?:-(\d{2}))?/.exec(date);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = match[2] === undefined ? 1 : Number(match[2]);
  return year * 12 + (month - 1);
}

function significantTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const token of caseFold(text).split(/[^\p{L}\p{N}+#.]+/u)) {
    if (token.length < 3) continue;
    if (isStopword(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

function overlap(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let shared = 0;
  for (const token of a) {
    if (b.has(token)) shared += 1;
  }
  return shared;
}

function roleLine(item: ResumeWorkItem): string {
  return [item.position, item.name].filter(Boolean).join(", ");
}

function positionLine(position: LinkedinPosition): string {
  return [position.title, position.company].filter(Boolean).join(", ");
}

/** Greedy best pairing on company-token overlap, title overlap as tiebreak. */
function pairRoles(
  work: readonly ResumeWorkItem[],
  positions: readonly LinkedinPosition[]
): [ResumeWorkItem, LinkedinPosition][] {
  const taken = new Set<number>();
  const pairs: [ResumeWorkItem, LinkedinPosition][] = [];

  for (const item of work) {
    const company = significantTokens(item.name ?? "");
    const title = significantTokens(item.position ?? "");
    let best = -1;
    let bestScore = 0;

    positions.forEach((position, index) => {
      if (taken.has(index)) return;
      const score =
        overlap(company, significantTokens(position.company)) * 2 +
        overlap(title, significantTokens(position.title));
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });

    if (best >= 0 && bestScore >= 2) {
      const position = positions[best];
      if (position !== undefined) {
        taken.add(best);
        pairs.push([item, position]);
      }
    }
  }
  return pairs;
}

function profileHaystack(profile: LinkedinProfile): string {
  return [
    profile.headline,
    profile.about,
    profile.positions
      .map((position) =>
        [positionLine(position), position.employmentType, position.location, ...position.lines].join(
          "\n"
        )
      )
      .join("\n"),
    profile.education
      .map((entry) => [entry.school, entry.degree, ...entry.lines].join("\n"))
      .join("\n"),
    profile.skills.join("\n"),
    profile.languages.map((entry) => `${entry.language} ${entry.proficiency}`).join("\n"),
    profile.certifications.map((entry) => `${entry.name} ${entry.issuer}`).join("\n"),
    profile.interests.join("\n")
  ].join("\n");
}

export function compareResumeToProfile(
  resume: Resume,
  profile: LinkedinProfile
): ConsistencyReport {
  const inconsistencies: Inconsistency[] = [];
  const work = resume.work ?? [];
  const pairs = pairRoles(work, profile.positions);

  pairs.forEach(([item, position], index) => {
    const cvRange = renderDateRange(item.startDate, item.endDate) ?? "undated";
    const cvQuote = `${roleLine(item)}: ${cvRange}`;
    const profileQuote = `${positionLine(position)}: ${position.dateLine}`;

    const startCv = item.startDate === undefined ? null : monthsOf(item.startDate);
    const startProfile = position.startDate === "" ? null : monthsOf(position.startDate);
    const openCv = item.endDate === "";
    const openProfile = position.endDate === "";

    const startDiffers =
      startCv !== null &&
      startProfile !== null &&
      Math.abs(startCv - startProfile) > DATE_TOLERANCE_MONTHS;
    const endDiffers =
      openCv !== openProfile ||
      (!openCv &&
        !openProfile &&
        item.endDate !== undefined &&
        position.endDate !== "" &&
        monthsOf(item.endDate) !== null &&
        monthsOf(position.endDate) !== null &&
        Math.abs((monthsOf(item.endDate) ?? 0) - (monthsOf(position.endDate) ?? 0)) >
          DATE_TOLERANCE_MONTHS);

    if (startDiffers || endDiffers) {
      inconsistencies.push({
        id: `date-mismatch:${index}`,
        kind: "date-mismatch",
        detail: `The CV and the profile date "${roleLine(item)}" differently; one of the two will read as a gap or an overlap.`,
        cvEvidence: cvQuote,
        profileEvidence: profileQuote
      });
    }

    const titleCv = caseFold(item.position ?? "").trim();
    const titleProfile = caseFold(position.title).trim();
    if (titleCv !== "" && titleProfile !== "" && titleCv !== titleProfile) {
      inconsistencies.push({
        id: `title-mismatch:${index}`,
        kind: "title-mismatch",
        detail: `The role at ${item.name ?? position.company} carries two different titles; recruiters notice when the two documents sit side by side.`,
        cvEvidence: cvQuote,
        profileEvidence: profileQuote
      });
    }
  });

  const haystack = profileHaystack(profile);
  const language = detectLanguage(haystack);
  const terms: { term: string; group: string }[] = [];
  for (const skill of resume.skills ?? []) {
    const group = [skill.name ?? "", (skill.keywords ?? []).join(", ")]
      .filter(Boolean)
      .join(": ");
    if (skill.name !== undefined && skill.name !== "") terms.push({ term: skill.name, group });
    for (const keyword of skill.keywords ?? []) {
      if (keyword !== "") terms.push({ term: keyword, group });
    }
  }

  const seen = new Set<string>();
  for (const entry of terms) {
    const key = caseFold(entry.term);
    if (seen.has(key)) continue;
    seen.add(key);
    // Case-fold and canonicalise before matching, exactly like the keyword
    // dimension does: "CI/CD" only finds "Continuous Integration" through the
    // synonym table, and the table's keys are lowercase.
    if (countOccurrences(haystack, canonicalize(caseFold(entry.term)), language) > 0) continue;
    inconsistencies.push({
      id: `skill-only-in-cv:${key}`,
      kind: "skill-only-in-cv",
      detail: `The CV claims "${entry.term}" but the profile never mentions it; a screener comparing both reads it as an exaggeration on one side.`,
      cvEvidence: `CV skills: ${entry.group}`,
      profileEvidence:
        profile.skills.length > 0
          ? `Profile skills: ${profile.skills.join(", ")}`
          : "Profile: no Skills section in the export"
    });
  }

  const label = resume.basics?.label ?? "";
  if (label !== "" && profile.headline !== "") {
    if (overlap(significantTokens(label), significantTokens(profile.headline)) === 0) {
      inconsistencies.push({
        id: "headline-mismatch",
        kind: "headline-mismatch",
        detail: "The profile headline and the CV headline point at different roles; pick one direction and write it in both.",
        cvEvidence: `CV headline: ${label}`,
        profileEvidence: `Profile headline: ${profile.headline}`
      });
    }
  }

  return {
    inconsistencies,
    matchedRoles: pairs.length,
    comparedSkills: seen.size
  };
}
