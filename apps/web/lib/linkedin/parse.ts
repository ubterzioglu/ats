import { extractDocument } from "@/lib/extract";
import { formatEngineMonth } from "@/lib/resume/presentation";
import { extractPeriods } from "@/lib/scoring/experience";
import { isBulletLine, normalizeDocument } from "@/lib/scoring/text";
import type {
  LinkedinCertification,
  LinkedinEducation,
  LinkedinLanguage,
  LinkedinParse,
  LinkedinPosition,
  LinkedinProfile
} from "@/types/linkedin";

/**
 * Parsing the LinkedIn "Save as PDF" export. The user downloads the file
 * themselves - no scraping, no terms-of-service exposure - and it is parsed
 * here in the browser, because a profile is CV data too.
 *
 * The export has three quirks this parser is built around: nearly every line
 * is printed twice (an accessibility artefact), section headings are the only
 * reliable structure, and dates carry a trailing duration label ("· 2 yrs 9
 * mos"). Duplicate lines collapse first, sections split on their headings,
 * and every date range is read by the engine's extractPeriods - the same
 * parser the CV goes through, so the two documents are never compared
 * through different notions of a date.
 */

const SECTION_NAMES: ReadonlyMap<string, string> = new Map([
  ["about", "about"], ["hakkında", "about"], ["hakkinda", "about"], ["info", "about"],
  ["activity", "activity"], ["etkinlik", "activity"], ["aktivitäten", "activity"],
  ["experience", "experience"], ["deneyim", "experience"], ["iş deneyimi", "experience"],
  ["berufserfahrung", "experience"], ["werdegang", "experience"],
  ["education", "education"], ["eğitim", "education"], ["egitim", "education"],
  ["ausbildung", "education"],
  ["skills", "skills"], ["yetenekler", "skills"], ["kenntnisse", "skills"],
  ["languages", "languages"], ["diller", "languages"], ["sprachen", "languages"],
  ["certifications", "certifications"], ["sertifikalar", "certifications"],
  ["zertifizierungen", "certifications"],
  ["projects", "projects"], ["projeler", "projects"], ["projekte", "projects"],
  ["interests", "interests"], ["ilgi alanları", "interests"], ["interessen", "interests"],
  ["volunteer experience", "volunteer"], ["gönüllü deneyim", "volunteer"],
  ["ehrenamt", "volunteer"],
  ["recommendations", "recommendations"], ["öneriler", "recommendations"],
  ["empfehlungen", "recommendations"],
  ["accomplishments", "accomplishments"], ["başarılar", "accomplishments"],
  ["auszeichnungen", "accomplishments"], ["featured", "featured"], ["öne çıkanlar", "featured"]
]);

// No reliance on the i flag for Turkish: /i does not fold "İ" onto "i", so
// the dotted capital gets its own character classes.
const CONTACT_SUFFIX_RX =
  /\s*[·|]\s*(contact\s+info|contactgegevens|[iİ]leti[şs]im\s+bilgileri|kontaktinformationen)\s*$/iu;
const CONNECTIONS_RX = /\b\d+\+?\b[^\n]*\b(connections|verbindungen|bağlantı|baglanti)\b/iu;
const PROFICIENCY_RX =
  /(proficiency|yeterlilik|seviye|düzey|duzey|kenntnisse|sprachkenntnis|native or bilingual|full professional|limited working|elementary)/iu;
const SHOW_ALL_RX = /^(show all|tümünü göster|tumunu goster|alle anzeigen)\b/iu;
const ISSUED_RX = /^(issued|verliehen|veröffentlicht|veroffentlicht|ausgestellt)\b/iu;
const PAGE_FURNITURE_RX = /^(linkedin\b|page\s*\d|sayfa\s*\d|seite\s*\d)/iu;
const MAX_LOCATION_LENGTH = 48;

/** The export prints almost every line twice; consecutive duplicates collapse. */
function dedupeLines(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (PAGE_FURNITURE_RX.test(line)) continue;
    if (out[out.length - 1] === line) continue;
    out.push(line);
  }
  return out;
}

function sectionHeading(line: string): string | null {
  const cleaned = line.trim().toLowerCase();
  if (cleaned.length === 0 || cleaned.length > 30) return null;
  return SECTION_NAMES.get(cleaned) ?? null;
}

interface SectionBlock {
  readonly heading: string;
  readonly rawHeading: string;
  readonly lines: readonly string[];
}

function splitSections(lines: readonly string[]): { header: string[]; sections: SectionBlock[] } {
  const header: string[] = [];
  const sections: SectionBlock[] = [];
  let current: { heading: string; rawHeading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const heading = sectionHeading(line);
    if (heading !== null) {
      if (current !== null) sections.push(current);
      current = { heading, rawHeading: line.trim(), lines: [] };
      continue;
    }
    if (current === null) header.push(line);
    else current.lines.push(line);
  }
  if (current !== null) sections.push(current);
  return { header, sections };
}

interface DateAnchor {
  readonly dateLine: number;
  readonly source: string;
  readonly start: string;
  readonly end: string;
  readonly open: boolean;
}

function anchorDates(lines: readonly string[]): DateAnchor[] {
  const { periods } = extractPeriods(lines);
  const anchors: DateAnchor[] = [];
  const used = new Set<number>();

  for (const period of periods) {
    const index = lines.findIndex((line, i) => !used.has(i) && line.includes(period.source));
    if (index < 0) continue;
    used.add(index);
    anchors.push({
      dateLine: index,
      source: period.source,
      start: formatEngineMonth(period.start),
      end: period.open ? "" : formatEngineMonth(period.end),
      open: period.open
    });
  }
  return anchors.sort((a, b) => a.dateLine - b.dateLine);
}

/**
 * The contiguous block of short, period-free lines directly above a date:
 * LinkedIn writes title and company there. Sentences (a description's last
 * line ends with a period), bullets and other date lines stop the walk.
 */
function headerBlockAbove(
  lines: readonly string[],
  dateLine: number,
  anchorLines: ReadonlySet<number>
): { readonly start: number; readonly block: readonly string[] } {
  const block: string[] = [];
  let index = dateLine - 1;
  while (index >= 0 && block.length < 2) {
    const line = (lines[index] ?? "").trim();
    if (line.length === 0 || isBulletLine(line) || anchorLines.has(index)) break;
    if (line.endsWith(".")) break;
    block.unshift(line);
    index -= 1;
  }
  return { start: index + 1, block };
}

/**
 * LinkedIn writes the duration behind a middot on the date line ("Jan 2021 -
 * Present · 2 yrs 9 mos"). The engine's period source is the whole line, so
 * the label is whatever follows the last middot.
 */
function durationAfter(dateText: string): string {
  const at = dateText.lastIndexOf("·");
  return at >= 0 ? dateText.slice(at + 1).trim() : "";
}

function looksLikeLocation(line: string | undefined): boolean {
  if (line === undefined) return false;
  const trimmed = line.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_LOCATION_LENGTH &&
    !isBulletLine(trimmed) &&
    !trimmed.endsWith(".") &&
    !/\d/.test(trimmed)
  );
}

function parsePositions(lines: readonly string[], warnings: string[]): LinkedinPosition[] {
  const anchors = anchorDates(lines);
  const anchorLines = new Set(anchors.map((anchor) => anchor.dateLine));
  const headers = anchors.map((anchor) => headerBlockAbove(lines, anchor.dateLine, anchorLines));

  return anchors.map((anchor, index) => {
    const dateText = lines[anchor.dateLine] ?? "";
    const header = headers[index];
    const block = header?.block ?? [];

    const companyLine = block.find((line) => line.includes("·") || line.includes("|"));
    const titleLine = block.find((line) => line !== companyLine);
    const [company, employmentType] =
      companyLine !== undefined
        ? companyLine
            .split(/\s*[·|]\s*/)
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
        : [];

    if ((titleLine ?? "") === "" && (companyLine ?? "") !== "") {
      warnings.push(`The entry dated "${dateText.trim()}" has a company but no title line.`);
    } else if ((titleLine ?? "") === "") {
      warnings.push(`The entry dated "${dateText.trim()}" has no title line above it.`);
    }

    const after = lines[anchor.dateLine + 1];
    const location = looksLikeLocation(after) ? (after ?? "").trim() : "";
    const descriptionFrom = anchor.dateLine + 1 + (location === "" ? 0 : 1);
    const nextHeader = headers[index + 1];
    const descriptionTo = nextHeader?.start ?? lines.length;
    const description = lines
      .slice(descriptionFrom, descriptionTo)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      title: titleLine ?? "",
      company: company ?? "",
      employmentType: employmentType ?? "",
      startDate: anchor.start,
      endDate: anchor.end,
      durationLabel: durationAfter(dateText),
      location,
      lines: description,
      dateLine: dateText.trim()
    };
  });
}

function parseEducation(lines: readonly string[], warnings: string[]): LinkedinEducation[] {
  const anchors = anchorDates(lines);
  const anchorLines = new Set(anchors.map((anchor) => anchor.dateLine));
  const headers = anchors.map((anchor) => headerBlockAbove(lines, anchor.dateLine, anchorLines));

  return anchors.map((anchor, index) => {
    const dateText = lines[anchor.dateLine] ?? "";
    const block = headers[index]?.block ?? [];
    // LinkedIn writes school above degree above dates; with a single line it
    // is the school.
    const school = block[0] ?? "";
    const degree = block.length >= 2 ? (block[1] ?? "") : "";
    if (school === "") {
      warnings.push(`The education entry dated "${dateText.trim()}" has no school line.`);
    }
    const nextHeader = headers[index + 1];
    const extra = lines
      .slice(anchor.dateLine + 1, nextHeader?.start ?? lines.length)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      school,
      degree,
      startDate: anchor.start,
      endDate: anchor.end,
      dateLine: dateText.trim(),
      lines: extra
    };
  });
}

function parseSkills(lines: readonly string[]): string[] {
  const skills: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || SHOW_ALL_RX.test(trimmed)) continue;
    if (!skills.includes(trimmed)) skills.push(trimmed);
  }
  return skills;
}

function parseLanguages(lines: readonly string[]): LinkedinLanguage[] {
  const languages: LinkedinLanguage[] = [];
  let pending = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (PROFICIENCY_RX.test(trimmed) && pending !== "") {
      languages.push({ language: pending, proficiency: trimmed });
      pending = "";
      continue;
    }
    if (pending !== "") languages.push({ language: pending, proficiency: "" });
    pending = trimmed;
  }
  if (pending !== "") languages.push({ language: pending, proficiency: "" });
  return languages;
}

function parseCertifications(lines: readonly string[]): LinkedinCertification[] {
  const groups: string[][] = [];
  let group: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (group.length > 0) groups.push(group);
      group = [];
      continue;
    }
    group.push(trimmed);
  }
  if (group.length > 0) groups.push(group);

  return groups.map((block) => {
    const issuedLine = block.find((line) => ISSUED_RX.test(line)) ?? "";
    const named = block.filter((line) => line !== issuedLine);
    return {
      name: named[0] ?? "",
      issuer: named[1] ?? "",
      issuedLine
    };
  });
}

export function parseLinkedinText(text: string): LinkedinParse {
  const lines = dedupeLines(normalizeDocument(text).split("\n"));
  const { header, sections } = splitSections(lines);
  const warnings: string[] = [];

  const headerLines = header.filter((line) => line.trim().length > 0).map((line) => line.trim());
  const name = headerLines[0] ?? "";
  const locationLine = headerLines.find((line) => CONTACT_SUFFIX_RX.test(line)) ?? "";
  const location = locationLine.replace(CONTACT_SUFFIX_RX, "").trim();
  const connections = headerLines.find((line) => CONNECTIONS_RX.test(line)) ?? "";
  const headline =
    headerLines.find(
      (line) => line !== name && line !== locationLine && line !== connections
    ) ?? "";

  if (name === "") warnings.push("The export has no readable name line.");

  const byName = new Map(sections.map((section) => [section.heading, section]));
  const experienceSection = byName.get("experience");
  if (experienceSection === undefined) {
    warnings.push("The export has no Experience section.");
  }

  const about = (byName.get("about")?.lines ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  const positions = parsePositions(experienceSection?.lines ?? [], warnings);
  const education = parseEducation(byName.get("education")?.lines ?? [], warnings);
  const skills = parseSkills(byName.get("skills")?.lines ?? []);
  const languages = parseLanguages(byName.get("languages")?.lines ?? []);
  const certifications = parseCertifications(byName.get("certifications")?.lines ?? []);
  const interests = (byName.get("interests")?.lines ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const profile: LinkedinProfile = {
    name,
    headline,
    location,
    connections,
    about,
    positions,
    education,
    skills,
    languages,
    certifications,
    interests,
    sectionsSeen: sections.map((section) => section.rawHeading)
  };

  return { profile, warnings };
}

/** Reads the user's own export in the browser; the file never leaves. */
export async function parseLinkedinDocument(file: File): Promise<LinkedinParse> {
  const extraction = await extractDocument(file);
  return parseLinkedinText(extraction.text);
}
