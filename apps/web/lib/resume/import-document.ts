import { extractDocument } from "@/lib/extract";
import { extractPeriods } from "@/lib/scoring/experience";
import { caseFold, countWords, isBulletLine, normalizeDocument, stripBulletMarker } from "@/lib/scoring/text";
import type {
  Resume,
  ResumeEducationItem,
  ResumeLanguageItem,
  ResumeProfile,
  ResumeWorkItem
} from "@/types/resume";

/**
 * Importing an existing CV: text in, canonical model out, and an honest list
 * of what the rules could not carry over.
 *
 * Two promises, both tested: nothing is invented - every extracted string is
 * a verbatim slice of the document, and a field the rules cannot find stays
 * absent and is reported missing; and nothing uncertain passes silently - a
 * field built by a heuristic (a role line split on a comma) carries a
 * needs-review flag the editor renders as "check this". Dates are the one
 * normalisation: they are parsed by the engine's extractPeriods - never a
 * second parser - and written back as JSON Resume's YYYY-MM.
 */

export type ImportFieldStatus = "needs-review" | "missing";

export interface ImportIssue {
  /** Resume path the issue is about, e.g. "basics.email" or "work.1.name". */
  readonly path: string;
  readonly status: ImportFieldStatus;
  /** Plain engine wording; the interface catalog translates the statuses. */
  readonly reason: string;
}

export interface DocumentImport {
  readonly resume: Resume;
  readonly issues: readonly ImportIssue[];
  /** Paths the editor should badge with "check this". */
  readonly reviewPaths: readonly string[];
  readonly sourceWords: number;
  readonly sourceName: string;
}

const EMAIL_RX = /[^\s@,;:()]+@[^\s@,;:()]+\.[\p{L}]{2,}/u;
const URL_RX = /https?:\/\/[^\s,;)]+/i;
const LINKEDIN_RX = /(?<![\w./])linkedin\.com\/[^\s,;)]+/i;

/**
 * The engine reads month-first ranges ("01/2021 - present"); the editor's
 * canonical form - and therefore every template export - is year-first
 * ("2021-01"). Flipping the token order is text normalisation, not date
 * parsing: extractPeriods stays the only parser, and full ISO dates
 * ("2020-05-14") are left alone by the lookahead.
 */
const ISO_YEAR_MONTH_RX = /\b((?:19|20)\d{2})-(0[1-9]|1[0-2])(?!-?\d)/g;

function normalizeIsoDates(text: string): string {
  return text.replace(ISO_YEAR_MONTH_RX, "$2/$1");
}

const HEADING_PATTERNS: readonly (readonly [string, RegExp])[] = [
  ["summary", /^(summary|profile|about me|özet|profil|hakkımda|zusammenfassung)\b/iu],
  ["experience", /^(work\s+|professional\s+|relevant\s+|employment\s+)?(experience|history|deneyim|iş deneyimi|is deneyimi|mesleki deneyim|berufserfahrung|beruflicher werdegang|werdegang|çalışma geçmişi|calisma gecmisi)\b/iu],
  ["education", /^(education|eğitim|egitim|ausbildung|studium)\b/iu],
  ["skills", /^(skills|beceriler|yetenekler|kenntnisse|fähigkeiten|faehigkeiten|yetkinlikler|kompetenzen)\b/iu],
  ["languages", /^(languages|diller|sprachen)\b/iu],
  ["certifications", /^(certifications|certificates|sertifikalar|zertifikate)\b/iu],
  ["awards", /^(awards|ödüller|oduller|auszeichnungen)\b/iu],
  ["publications", /^(publications|yayınlar|yayinlar|publikationen)\b/iu],
  ["volunteer", /^(volunteer|gönüllülük|gonulluluk|ehrenamt)\b/iu],
  ["interests", /^(interests|ilgi alanları|ilgi alanlari|hobbies|hobbys)\b/iu],
  ["references", /^(references|referanslar|referenzen)\b/iu],
  ["projects", /^(projects|projeler|projekte)\b/iu]
];

const UNPARSED_SECTIONS = [
  "certifications",
  "awards",
  "publications",
  "volunteer",
  "interests",
  "references",
  "projects"
] as const;

const INSTITUTION_RX =
  /universit|üniversit|universität|universitaet|hochschule|schule|college|institute|enstitü|enstitu|akademie|academy|technical/iu;

const DEGREE_RX =
  /^(BSc|MSc|BA|MA|BS|MS|MBA|PhD|Dr\.?|Bachelor|Master|Lisans|Yüksek Lisans|Yuksek Lisans|Diplom|Associate)\b/iu;

const NAME_WORD_RX = /^[\p{L}][\p{L}'’.-]*$/u;
const CITY_LINE_RX = /^([\p{L}' .-]{3,}),\s*([\p{L}' .-]{2,})$/u;

interface Draft {
  resume: Record<string, unknown>;
  issues: ImportIssue[];
  review: Set<string>;
}

function review(draft: Draft, path: string, reason: string): void {
  draft.issues.push({ path, status: "needs-review", reason });
  draft.review.add(path);
}

function missing(draft: Draft, path: string, reason: string): void {
  draft.issues.push({ path, status: "missing", reason });
}

function headingAt(line: string): string | null {
  const cleaned = caseFold(line.replace(/[:：|•\-–—_]+\s*$/g, "").trim());
  if (cleaned.length === 0) return null;
  if (cleaned.split(/\s+/).length > 5) return null;
  if (isBulletLine(line)) return null;
  for (const [section, pattern] of HEADING_PATTERNS) {
    if (pattern.test(cleaned)) return section;
  }
  return null;
}

function sectionRanges(lines: readonly string[]): Map<string, readonly string[]> {
  const ranges = new Map<string, readonly string[]>();
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = (): void => {
    if (current !== null && !ranges.has(current)) ranges.set(current, buffer);
    buffer = [];
  };

  for (const line of lines) {
    const heading = headingAt(line);
    if (heading !== null) {
      flush();
      current = heading;
      continue;
    }
    if (current !== null) buffer.push(line);
  }
  flush();
  return ranges;
}

/** Engine months since year zero back into JSON Resume's YYYY-MM. */
function formatMonth(months: number): string {
  const year = Math.floor(months / 12);
  const month = (months % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function looksLikePersonName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d/.test(line) || /[@/]/.test(line)) return false;
  return words.every((word) => NAME_WORD_RX.test(word));
}

function digitCount(text: string): number {
  return (text.match(/\d/g) ?? []).length;
}

interface EntryAnchor {
  readonly dateLine: number;
  readonly start: string;
  readonly end: string;
  readonly open: boolean;
  readonly source: string;
}

function anchorEntries(sectionLines: readonly string[]): EntryAnchor[] {
  const { periods } = extractPeriods(sectionLines);
  const anchors: EntryAnchor[] = [];
  const used = new Set<number>();

  for (const period of periods) {
    const dateLine = sectionLines.findIndex(
      (line, index) => !used.has(index) && line.includes(period.source)
    );
    if (dateLine < 0) continue;
    used.add(dateLine);
    anchors.push({
      dateLine,
      start: formatMonth(period.start),
      end: period.open ? "" : formatMonth(period.end),
      open: period.open,
      source: period.source
    });
  }
  return anchors.sort((a, b) => a.dateLine - b.dateLine);
}

function usableLine(line: string | undefined): line is string {
  if (line === undefined) return false;
  const trimmed = line.trim();
  return trimmed.length > 0 && !isBulletLine(line) && headingAt(line) === null;
}

/**
 * The line a role is named on: whatever shares the date line with the range,
 * or the nearest usable line above it. Returns the text and where it came
 * from, because same-line text may still hold the range's surroundings.
 */
function findHeader(
  lines: readonly string[],
  anchor: EntryAnchor,
  upperBound: number
): { readonly text: string; readonly lineIndex: number } | null {
  const dateLine = lines[anchor.dateLine] ?? "";
  const rest = dateLine.replace(anchor.source, "").replace(/^[\s,;|·–—-]+|[\s,;|·–—-]+$/g, "").trim();
  if (rest.split(/\s+/).filter(Boolean).length >= 2) {
    return { text: rest, lineIndex: anchor.dateLine };
  }
  for (let index = anchor.dateLine - 1; index >= upperBound; index -= 1) {
    const candidate = lines[index];
    if (candidate === undefined) continue;
    if (candidate.trim().length === 0) continue;
    if (!usableLine(candidate)) continue;
    return { text: candidate.trim(), lineIndex: index };
  }
  return null;
}

function splitRole(header: string): { readonly position: string; readonly name: string } {
  const parts = header
    .split(/\s*\|\s*|\s*·\s*|,/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length >= 2) {
    const [position, ...rest] = parts as [string, ...string[]];
    return { position, name: rest.join(", ") };
  }
  return { position: parts[0] ?? header.trim(), name: "" };
}

function collectBullets(
  lines: readonly string[],
  from: number,
  to: number
): string[] {
  const bullets: string[] = [];
  for (let index = from; index < to; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    if (!isBulletLine(line)) continue;
    const content = stripBulletMarker(line).trim();
    if (content.length > 0) bullets.push(content);
  }
  return bullets;
}

function buildWork(
  lines: readonly string[],
  draft: Draft,
  sectionPath: string
): ResumeWorkItem[] {
  const anchors = anchorEntries(lines);
  const items: ResumeWorkItem[] = [];

  anchors.forEach((anchor, anchorIndex) => {
    const previous = anchorIndex === 0 ? undefined : anchors[anchorIndex - 1];
    const upperBound = previous === undefined ? 0 : previous.dateLine + 1;
    const next = anchors[anchorIndex + 1];
    const lowerBound =
      next === undefined
        ? lines.length
        : findHeader(lines, next, anchor.dateLine + 1)?.lineIndex ?? lines.length;
    const header = findHeader(lines, anchor, upperBound);

    const item: Record<string, unknown> = {
      startDate: anchor.start,
      ...(anchor.open ? { endDate: "" } : { endDate: anchor.end })
    };

    let nameFromOwnLine = "";
    if (header !== null && header.lineIndex < anchor.dateLine) {
      // A company may sit between the role line and the date line (the
      // three-line entry shape). The line just above the date wins.
      for (let index = anchor.dateLine - 1; index > header.lineIndex; index -= 1) {
        const candidate = lines[index];
        if (candidate !== undefined && usableLine(candidate)) {
          nameFromOwnLine = candidate.trim();
          break;
        }
      }
    }

    if (header === null) {
      missing(draft, `${sectionPath}.${anchorIndex}.position`, "The document has a date range with no role line above it.");
    } else if (nameFromOwnLine !== "") {
      item.position = header.text;
      item.name = nameFromOwnLine;
      review(draft, `${sectionPath}.${anchorIndex}.position`, "Taken from the line above the dates; check the split between role and employer.");
      review(draft, `${sectionPath}.${anchorIndex}.name`, "Taken from the line above the dates; check the split between role and employer.");
    } else {
      const split = splitRole(header.text);
      item.position = split.position;
      review(draft, `${sectionPath}.${anchorIndex}.position`, "Role and employer were split on punctuation; check both halves.");
      if (split.name !== "") {
        item.name = split.name;
        review(draft, `${sectionPath}.${anchorIndex}.name`, "Role and employer were split on punctuation; check both halves.");
      } else {
        missing(draft, `${sectionPath}.${anchorIndex}.name`, "No employer could be separated from the role line.");
      }
    }

    const bullets = collectBullets(lines, anchor.dateLine + 1, lowerBound);
    if (bullets.length > 0) item.highlights = bullets;

    items.push(item as unknown as ResumeWorkItem);
  });

  return items;
}

function buildEducation(
  lines: readonly string[],
  draft: Draft,
  sectionPath: string
): ResumeEducationItem[] {
  const anchors = anchorEntries(lines);
  const items: ResumeEducationItem[] = [];

  anchors.forEach((anchor, anchorIndex) => {
    const previous = anchorIndex === 0 ? undefined : anchors[anchorIndex - 1];
    const upperBound = previous === undefined ? 0 : previous.dateLine + 1;
    const header = findHeader(lines, anchor, upperBound);
    const item: Record<string, unknown> = {
      startDate: anchor.start,
      ...(anchor.open ? { endDate: "" } : { endDate: anchor.end })
    };

    if (header === null) {
      missing(draft, `${sectionPath}.${anchorIndex}.institution`, "The document has a date range with no school line above it.");
      items.push(item as unknown as ResumeEducationItem);
      return;
    }

    const parts = header.text
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const institutionIndex = parts.findIndex((part) => INSTITUTION_RX.test(part));
    const institution =
      institutionIndex >= 0
        ? (parts[institutionIndex] ?? "")
        : parts.length > 1
          ? (parts[parts.length - 1] ?? "")
          : "";
    const qualificationPart =
      institutionIndex >= 0
        ? parts.filter((_, index) => index !== institutionIndex).join(", ")
        : parts.length > 1
          ? parts.slice(0, -1).join(", ")
          : parts[0] ?? "";

    if (institution !== "") {
      item.institution = institution;
      if (institutionIndex < 0) {
        review(draft, `${sectionPath}.${anchorIndex}.institution`, "Guessed from the school wording in the line; check it.");
      }
    } else {
      missing(draft, `${sectionPath}.${anchorIndex}.institution`, "No institution could be recognised in the line.");
    }

    if (qualificationPart !== "") {
      const degree = qualificationPart.match(DEGREE_RX)?.[0];
      if (degree !== undefined) {
        item.studyType = degree;
        const area = qualificationPart.slice(degree.length).replace(/^[,.\s]+/, "");
        if (area !== "") {
          item.area = area;
          review(draft, `${sectionPath}.${anchorIndex}.area`, "Split from the qualification line; check what belongs to the field of study.");
        }
      } else {
        item.area = qualificationPart;
        review(draft, `${sectionPath}.${anchorIndex}.area`, "No qualification keyword recognised; check whether this is the field of study.");
      }
    }

    const next = anchors[anchorIndex + 1];
    const lowerBound =
      next === undefined
        ? lines.length
        : findHeader(lines, next, anchor.dateLine + 1)?.lineIndex ?? lines.length;
    const courses = collectBullets(lines, anchor.dateLine + 1, lowerBound);
    if (courses.length > 0) item.courses = courses;

    items.push(item as unknown as ResumeEducationItem);
  });

  return items;
}

function buildSkills(lines: readonly string[]): string[] {
  const keywords: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const content = isBulletLine(trimmed) ? stripBulletMarker(trimmed).trim() : trimmed;
    // Colons separate a group label from its members ("CI: GitLab, Jenkins")
    // in rendered resumes; commas separate members everywhere.
    for (const part of content.split(/[,:]/)) {
      const keyword = part.trim().replace(/[.·•]+$/g, "").trim();
      if (keyword.length > 0 && !keywords.includes(keyword)) keywords.push(keyword);
    }
  }
  return keywords;
}

function buildLanguages(lines: readonly string[]): ResumeLanguageItem[] {
  const items: ResumeLanguageItem[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const content = isBulletLine(trimmed) ? stripBulletMarker(trimmed).trim() : trimmed;
    for (const part of content.split(",")) {
      const entry = part.trim();
      if (entry.length === 0) continue;
      const paren = entry.match(/^(.*?)\s*\(([^)]+)\)\s*$/u);
      if (paren?.[1] && paren[2]) {
        items.push({ language: paren[1].trim(), fluency: paren[2].trim() });
        continue;
      }
      const dashed = entry.match(/^([^-–—]+)\s*[-–—]\s*(.+)$/u);
      if (dashed?.[1] && dashed[2]) {
        items.push({ language: dashed[1].trim(), fluency: dashed[2].trim() });
        continue;
      }
      items.push({ language: entry });
    }
  }
  return items;
}

function basicsFrom(lines: readonly string[], draft: Draft): Record<string, unknown> {
  const basics: Record<string, unknown> = {};
  const text = lines.join("\n");

  const email = text.match(EMAIL_RX)?.[0];
  if (email !== undefined) basics.email = email;
  else missing(draft, "basics.email", "No email address found in the document.");

  let phone: string | undefined;
  for (const line of lines) {
    const candidate = line.match(/\+?\d[\d\s().-]{7,}\d/)?.[0];
    if (candidate !== undefined && digitCount(candidate) >= 10) {
      phone = candidate.trim();
      break;
    }
  }
  if (phone !== undefined) basics.phone = phone;
  else missing(draft, "basics.phone", "No phone number found in the document.");

  const url = text.match(URL_RX)?.[0];
  if (url !== undefined) basics.url = url;

  const linkedin = text.match(LINKEDIN_RX)?.[0];
  if (linkedin !== undefined) {
    const profile: ResumeProfile = { network: "LinkedIn", url: linkedin };
    basics.profiles = [profile];
  }

  let nameIndex = -1;
  for (let index = 0; index < Math.min(lines.length, 4); index += 1) {
    const line = (lines[index] ?? "").trim();
    if (line.length === 0) continue;
    if (looksLikePersonName(line)) {
      basics.name = line;
      nameIndex = index;
    }
    break;
  }
  if (nameIndex < 0) {
    missing(draft, "basics.name", "No plain name line found at the top of the document.");
  } else {
    for (let index = nameIndex + 1; index < Math.min(lines.length, nameIndex + 3); index += 1) {
      const line = (lines[index] ?? "").trim();
      if (line.length === 0) continue;
      if (/[@]|\bhttps?:|linkedin\.com/i.test(line)) continue;
      if (digitCount(line) > 2) continue;
      if (headingAt(line) !== null) continue;
      if (/\b(?:19|20)\d{2}\b/.test(line)) continue;
      if (line.split(/\s+/).length > 10) continue;
      basics.label = line;
      review(draft, "basics.label", "Taken from the line under the name; check that it is the headline.");
      break;
    }
  }

  const nameLine = nameIndex >= 0 ? (lines[nameIndex] ?? "") : null;
  for (let index = 0; index < Math.min(lines.length, 7); index += 1) {
    const line = (lines[index] ?? "").trim();
    if (line.length === 0 || line === nameLine) continue;
    if (/@|\bhttps?:|linkedin\.com/i.test(line)) continue;
    if (/\d/.test(line)) continue;
    if (headingAt(line) !== null) continue;
    if (index === nameIndex + 1 && basics.label === line) continue;
    const city = line.match(CITY_LINE_RX);
    if (city?.[1]) {
      basics.location = { city: city[1].trim() };
      review(draft, "basics.location.city", "Read from a city-like line near the top; check it.");
    }
    if (basics.location !== undefined) break;
  }

  return basics;
}

export function importResumeFromText(text: string, sourceName = ""): DocumentImport {
  const normalized = normalizeIsoDates(normalizeDocument(text));
  const lines = normalized.split("\n");
  const draft: Draft = { resume: {}, issues: [], review: new Set() };
  const sections = sectionRanges(lines);

  const basics = basicsFrom(lines, draft);

  const summaryLines = sections.get("summary") ?? [];
  const summary = summaryLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  if (summary !== "") basics.summary = summary;

  if (Object.keys(basics).length > 0) draft.resume.basics = basics;

  const work = buildWork(sections.get("experience") ?? [], draft, "work");
  if (work.length > 0) draft.resume.work = work;
  else missing(draft, "work", "No employment entries with readable dates were found.");

  const education = buildEducation(sections.get("education") ?? [], draft, "education");
  if (education.length > 0) draft.resume.education = education;
  else missing(draft, "education", "No education entries with readable dates were found.");

  const keywords = buildSkills(sections.get("skills") ?? []);
  if (keywords.length > 0) draft.resume.skills = [{ keywords }];
  else missing(draft, "skills", "No skills list was found.");

  const languages = buildLanguages(sections.get("languages") ?? []);
  if (languages.length > 0) draft.resume.languages = languages;
  else missing(draft, "languages", "No languages section was found.");

  for (const section of UNPARSED_SECTIONS) {
    if ((sections.get(section) ?? []).some((line) => line.trim().length > 0)) {
      review(
        draft,
        section,
        `The document has a ${section} section, but the importer does not parse it yet. Add it by hand.`
      );
    } else {
      missing(draft, section, `No ${section} section was found in the document.`);
    }
  }

  const issues = [...draft.issues].sort((a, b) => a.path.localeCompare(b.path));
  return {
    resume: draft.resume as Resume,
    issues,
    reviewPaths: issues.filter((issue) => issue.status === "needs-review").map((issue) => issue.path),
    sourceWords: countWords(normalized),
    sourceName
  };
}

/** Reads a PDF or DOCX in the browser - the file never leaves the device. */
export async function importResumeFromDocument(file: File): Promise<DocumentImport> {
  const extraction = await extractDocument(file);
  return importResumeFromText(extraction.text, file.name);
}
