import type { DetectedSection } from "@/types/analysis";

import { caseFold, isBulletLine } from "./text";

interface SectionDefinition {
  readonly id: string;
  readonly label: string;
  readonly core: boolean;
  readonly pattern: RegExp;
}

export const SECTION_DEFINITIONS: readonly SectionDefinition[] = [
  {
    id: "summary",
    label: "Summary",
    core: false,
    pattern:
      /^(professional\s+)?(summary|profile|about\s+me|objective|career\s+objective|kurzprofil|profil|zusammenfassung|uber\s+mich|über\s+mich|hakkimda|hakkımda|ozet|özet)\b/i
  },
  {
    id: "experience",
    label: "Experience",
    core: true,
    pattern:
      /^(work\s+|professional\s+|relevant\s+|employment\s+)?(experience|history|employment|career\s+history|berufserfahrung|beruflicher\s+werdegang|werdegang|praxiserfahrung|is\s+deneyimi|iş\s+deneyimi|mesleki\s+deneyim|deneyim|calisma\s+gecmisi|çalışma\s+geçmişi|tecrübe|iş\s+tecrübesi|deneyimler|berufliche\s+erfahrung)\b/i
  },
  {
    id: "education",
    label: "Education",
    core: true,
    pattern:
      /^(education|academic\s+background|studies|ausbildung|studium|akademischer\s+werdegang|schulbildung|egitim|eğitim|ogrenim|öğrenim|bildungsweg|schulische\s+ausbildung|academic\s+qualifications)\b/i
  },
  {
    id: "skills",
    label: "Skills",
    core: true,
    pattern:
      /^(technical\s+|core\s+|key\s+|it[-\s])?(skills|competencies|expertise|tech\s+stack|technologies|toolbox|kenntnisse|faehigkeiten|fähigkeiten|kompetenzen|technische\s+kenntnisse|personal\s+skills|persönliche\s+fähigkeiten|yetenekler|beceriler|yetkinlikler|kişisel\s+beceriler|mesleki\s+beceriler|teknik\s+beceriler|bilgisayar\s+bilgisi|edv-kenntnisse|fachkenntnisse|technical\s+proficiencies)\b/i
  },
  {
    id: "certifications",
    label: "Certifications",
    core: false,
    pattern:
      /^(certifications?|licenses?|accreditations?|zertifikate?|zertifizierungen|sertifikalar?|sertifika)\b/i
  },
  {
    id: "projects",
    label: "Projects",
    core: false,
    pattern: /^(projects?|selected\s+work|portfolio|projekte|projeler)\b/i
  },
  {
    id: "languages",
    label: "Languages",
    core: false,
    pattern: /^(languages?|sprachkenntnisse|sprachen|diller|yabanci\s+diller|yabancı\s+diller)\b/i
  },
  {
    id: "publications",
    label: "Publications",
    core: false,
    pattern: /^(publications?|talks?|conferences?|veroffentlichungen|veröffentlichungen|yayinlar|yayınlar)\b/i
  },
  {
    id: "internships",
    label: "Internships",
    core: false,
    pattern: /^(internships?|praktika|staj)\b/i
  }
];

const MAX_HEADING_WORDS = 6;
const MAX_HEADING_CHARS = 64;

function looksLikeHeading(line: string): boolean {
  if (line.length > MAX_HEADING_CHARS) return false;
  if (isBulletLine(line)) return false;
  if (/[.!?;]\s*$/.test(line)) return false;

  const words = line.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= MAX_HEADING_WORDS;
}

export function detectSections(lines: readonly string[]): DetectedSection[] {
  const found: DetectedSection[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (!looksLikeHeading(line)) return;

    // Case-fold rather than toLowerCase: "İş Deneyimi" must reach the
    // pattern as "iş deneyimi", which a plain lowercase splits in two.
    const cleaned = caseFold(line.replace(/[:：|•\-–—_]+\s*$/g, "").trim());

    for (const definition of SECTION_DEFINITIONS) {
      if (seen.has(definition.id)) continue;
      if (!definition.pattern.test(cleaned)) continue;

      seen.add(definition.id);
      found.push({
        id: definition.id,
        label: definition.label,
        heading: line,
        line: index
      });
      break;
    }
  });

  return found;
}

export function coreSectionIds(): string[] {
  return SECTION_DEFINITIONS.filter((section) => section.core).map((section) => section.id);
}

export interface SectionRange {
  readonly id: string;
  /** Inclusive first line of the section, the heading itself. */
  readonly start: number;
  /** Exclusive last line: the next heading, or the end of the document. */
  readonly end: number;
}

export function sectionRanges(
  sections: readonly DetectedSection[],
  lineCount: number
): SectionRange[] {
  return sections.map((section, index) => {
    const next = sections[index + 1];
    return {
      id: section.id,
      start: section.line,
      end: next ? next.line : lineCount
    };
  });
}

export function lineSection(ranges: readonly SectionRange[], line: number): string | undefined {
  return ranges.find((range) => line >= range.start && line < range.end)?.id;
}

export function sectionLabel(id: string): string {
  return SECTION_DEFINITIONS.find((section) => section.id === id)?.label ?? id;
}
