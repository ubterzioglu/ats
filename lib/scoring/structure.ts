import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { SECTION_DEFINITIONS, sectionLabel } from "./sections";

export const STRUCTURE_MAX = 20;

const DATE_RANGE =
  /((0?[1-9]|1[0-2])[./-](19|20)\d{2}|(19|20)\d{2})\s*(-|to|bis|until|present|heute|current|halen|devam)\s*((0?[1-9]|1[0-2])[./-](19|20)\d{2}|(19|20)\d{2}|present|heute|today|current|now|halen|devam ediyor)/i;

function experienceYears(context: ScoreContext): number[] {
  const experience = context.sections.find((section) => section.id === "experience");
  if (!experience) return [];

  const following = context.sections
    .filter((section) => section.line > experience.line)
    .reduce((min, section) => Math.min(min, section.line), context.lines.length);

  return context.lines
    .slice(experience.line, following)
    .flatMap((line) => (line.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number));
}

function isDescending(years: readonly number[]): boolean {
  const trimmed = years.filter((year) => year >= 1960 && year <= 2100);
  if (trimmed.length < 4) return true;

  let descending = 0;
  let ascending = 0;
  for (let index = 1; index < trimmed.length; index += 1) {
    const previous = trimmed[index - 1];
    const current = trimmed[index];
    if (previous === undefined || current === undefined) continue;
    if (current < previous) descending += 1;
    if (current > previous) ascending += 1;
  }

  return descending >= ascending;
}

/** Does the document carry the shape an ATS expects to map onto its fields? */
export function scoreStructure(context: ScoreContext): DimensionOutcome {
  const { sections, stats, raw } = context;
  const drafts: FindingDraft[] = [];
  const present = new Set(sections.map((section) => section.id));

  for (const definition of SECTION_DEFINITIONS) {
    if (!definition.core || present.has(definition.id)) continue;
    drafts.push({
      id: `structure.missing-${definition.id}`,
      severity: "high",
      title: `No "${definition.label}" heading`,
      detail: `Section mapping looks for this heading by name. Without it the content below is filed as unclassified text.`,
      fix: `Add a plain heading on its own line, literally called "${definition.label}".`,
      cost: 4
    });
  }

  if (!present.has("summary")) {
    drafts.push({
      id: "structure.missing-summary",
      severity: "low",
      title: "No summary at the top",
      detail: "A short profile gives both the keyword parser and the human reader the role you are targeting.",
      fix: "Open with three lines naming your role, years of experience and core stack.",
      cost: 1
    });
  }

  if (stats.years.length < 2) {
    drafts.push({
      id: "structure.no-dates",
      severity: "high",
      title: "No dates on the entries",
      detail: "Employment periods cannot be built without years, so tenure filters skip the record.",
      fix: "Date every role as MM/YYYY - MM/YYYY.",
      cost: 4
    });
  } else if (!DATE_RANGE.test(raw)) {
    drafts.push({
      id: "structure.date-format",
      severity: "medium",
      title: "Dates are not written as ranges",
      detail: "Years appear in the text but not as start-to-end ranges a parser can pair up.",
      fix: "Write both ends of every period, using \"present\" for the current role.",
      cost: 3
    });
  }

  if (!isDescending(experienceYears(context))) {
    drafts.push({
      id: "structure.chronology",
      severity: "medium",
      title: "Experience is not in reverse-chronological order",
      detail: "Most systems assume the first role listed is the current one and rank seniority from it.",
      fix: "Put the newest role first and work backwards.",
      cost: 3
    });
  }

  if (stats.bulletLines === 0 && stats.words > 250) {
    drafts.push({
      id: "structure.no-bullets",
      severity: "medium",
      title: "Responsibilities written as paragraphs",
      detail: "Dense blocks hide the achievements that keyword and relevance scoring look for.",
      fix: "Break each role into four to six bullets.",
      cost: 3
    });
  }

  if (stats.words < 280) {
    drafts.push({
      id: "structure.too-short",
      severity: "medium",
      title: "The CV is very short",
      detail: `${stats.words} words gives keyword matching almost nothing to work with.`,
      fix: "Describe each role with concrete tasks, tools and outcomes.",
      cost: 3
    });
  } else if (stats.words > 1500) {
    drafts.push({
      id: "structure.too-long",
      severity: "low",
      title: "The CV runs long",
      detail: `${stats.words} words is roughly ${stats.estimatedPages} pages. Relevance gets diluted and older roles crowd out recent ones.`,
      fix: "Keep the last ten years detailed and compress the rest to one line each.",
      cost: 2
    });
  }

  const detectedLabels = sections.map((section) => sectionLabel(section.id));
  return buildOutcome("structure", "Structure", STRUCTURE_MAX, drafts, (score) =>
    score >= 17
      ? `Clear sections: ${detectedLabels.join(", ")}.`
      : score >= 11
        ? "The skeleton is there but parts of it are not labelled."
        : "Too little structure for a parser to map fields onto."
  );
}
