import type { Resume } from "@/types/resume";

import { renderContactParts, renderDateRange } from "@/lib/resume/presentation";

/**
 * The content tree every PDF template renders. Templates own layout and
 * nothing else: what appears, in which order, and which empty field stays
 * empty is decided here once, so no template can invent content another one
 * would omit. A section without entries is absent from the tree entirely.
 */

export interface TemplateEntry {
  readonly header?: string;
  readonly meta?: string;
  readonly body?: string;
  readonly lines?: readonly string[];
  readonly bullets?: readonly string[];
}

export interface TemplateSection {
  readonly heading: string;
  readonly entries: readonly TemplateEntry[];
}

export interface TemplateContent {
  readonly name: string;
  readonly label: string;
  readonly contact: readonly string[];
  readonly sections: readonly TemplateSection[];
}

function joined(parts: readonly (string | undefined | null)[], separator: string): string {
  return parts.filter((part): part is string => part !== undefined && part !== null && part !== "").join(separator);
}

function entry(fields: TemplateEntry): TemplateEntry | null {
  const empty =
    (fields.header ?? "") === "" &&
    (fields.meta ?? "") === "" &&
    (fields.body ?? "") === "" &&
    (fields.lines ?? []).every((line) => line === "") &&
    (fields.bullets ?? []).length === 0;
  return empty ? null : fields;
}

function roleEntries(
  items: readonly {
    readonly position?: string;
    readonly name?: string;
    readonly organization?: string;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly summary?: string;
    readonly highlights?: readonly string[];
  }[]
): TemplateEntry[] {
  const entries: TemplateEntry[] = [];
  for (const item of items) {
    const built = entry({
      header: joined([item.position, item.name ?? item.organization], ", "),
      meta: renderDateRange(item.startDate, item.endDate) ?? undefined,
      body: item.summary,
      bullets: item.highlights ?? []
    });
    if (built !== null) entries.push(built);
  }
  return entries;
}

function section(heading: string, entries: readonly TemplateEntry[]): TemplateSection | null {
  return entries.length > 0 ? { heading, entries } : null;
}

export function templateContent(resume: Resume): TemplateContent {
  const sections: TemplateSection[] = [];
  const basics = resume.basics;

  if (basics?.summary !== undefined && basics.summary !== "") {
    sections.push({ heading: "Summary", entries: [{ body: basics.summary }] });
  }

  const experience = section("Experience", roleEntries(resume.work ?? []));
  if (experience !== null) sections.push(experience);

  const projectEntries: TemplateEntry[] = [];
  for (const project of resume.projects ?? []) {
    const lines = [
      (project.roles ?? []).length > 0 ? `Roles: ${(project.roles ?? []).join(", ")}` : "",
      (project.keywords ?? []).join(", ")
    ].filter((line) => line !== "");
    const built = entry({
      header: project.name,
      meta: joined([renderDateRange(project.startDate, project.endDate), project.entity, project.type], " - "),
      body: project.description,
      lines,
      bullets: project.highlights ?? []
    });
    if (built !== null) projectEntries.push(built);
  }
  const projects = section("Projects", projectEntries);
  if (projects !== null) sections.push(projects);

  const educationEntries: TemplateEntry[] = [];
  for (const item of resume.education ?? []) {
    const title = joined([item.studyType, item.area], ", ");
    const built = entry({
      header: joined([title, item.institution], title === "" ? "" : ", ") || item.institution,
      meta: renderDateRange(item.startDate, item.endDate) ?? undefined,
      lines: item.score !== undefined && item.score !== "" ? [`Score: ${item.score}`] : [],
      bullets: item.courses ?? []
    });
    if (built !== null) educationEntries.push(built);
  }
  const education = section("Education", educationEntries);
  if (education !== null) sections.push(education);

  const skillLines = (resume.skills ?? [])
    .map((skill) => {
      const level = skill.level !== undefined && skill.level !== "" ? ` (${skill.level})` : "";
      const keywords = (skill.keywords ?? []).filter(Boolean).join(", ");
      return joined([`${skill.name ?? ""}${level}`, keywords], ": ");
    })
    .filter((line) => line !== "");
  const skills = section("Skills", skillLines.length > 0 ? [{ lines: skillLines }] : []);
  if (skills !== null) sections.push(skills);

  const languageLines = (resume.languages ?? [])
    .map((language) => joined([language.language, language.fluency], " - "))
    .filter((line) => line !== "");
  const languages = section("Languages", languageLines.length > 0 ? [{ lines: languageLines }] : []);
  if (languages !== null) sections.push(languages);

  const awardEntries: TemplateEntry[] = [];
  for (const award of resume.awards ?? []) {
    const built = entry({
      header: award.title,
      meta: joined([award.awarder, award.date], ", "),
      body: award.summary
    });
    if (built !== null) awardEntries.push(built);
  }
  const awards = section("Awards", awardEntries);
  if (awards !== null) sections.push(awards);

  const publicationEntries: TemplateEntry[] = [];
  for (const publication of resume.publications ?? []) {
    const built = entry({
      header: publication.name,
      meta: joined([publication.publisher, publication.releaseDate], ", "),
      body: publication.summary
    });
    if (built !== null) publicationEntries.push(built);
  }
  const publications = section("Publications", publicationEntries);
  if (publications !== null) sections.push(publications);

  const volunteer = section("Volunteer", roleEntries(resume.volunteer ?? []));
  if (volunteer !== null) sections.push(volunteer);

  const interestLines = (resume.interests ?? [])
    .map((interest) => joined([interest.name, (interest.keywords ?? []).join(", ")], ": "))
    .filter((line) => line !== "");
  const interests = section("Interests", interestLines.length > 0 ? [{ lines: interestLines }] : []);
  if (interests !== null) sections.push(interests);

  const referenceLines = (resume.references ?? [])
    .map((reference) => joined([reference.name, reference.reference], " - "))
    .filter((line) => line !== "");
  const references = section("References", referenceLines.length > 0 ? [{ lines: referenceLines }] : []);
  if (references !== null) sections.push(references);

  return {
    name: basics?.name ?? "",
    label: basics?.label ?? "",
    contact: renderContactParts(resume),
    sections
  };
}
