import type { DetectedSection } from "@/types/analysis";

import { isBulletLine } from "./text";

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
      /^(work\s+|professional\s+|relevant\s+|employment\s+)?(experience|history|employment|career\s+history|berufserfahrung|beruflicher\s+werdegang|werdegang|praxiserfahrung|is\s+deneyimi|iş\s+deneyimi|deneyim|calisma\s+gecmisi|çalışma\s+geçmişi)\b/i
  },
  {
    id: "education",
    label: "Education",
    core: true,
    pattern:
      /^(education|academic\s+background|studies|ausbildung|studium|akademischer\s+werdegang|schulbildung|egitim|eğitim|ogrenim|öğrenim)\b/i
  },
  {
    id: "skills",
    label: "Skills",
    core: true,
    pattern:
      /^(technical\s+|core\s+|key\s+|it[-\s])?(skills|competencies|expertise|tech\s+stack|technologies|toolbox|kenntnisse|faehigkeiten|fähigkeiten|kompetenzen|technische\s+kenntnisse|yetenekler|beceriler|yetkinlikler|teknik\s+beceriler)\b/i
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

    const cleaned = line.replace(/[:：|•\-–—_]+\s*$/g, "").trim();

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

export function sectionLabel(id: string): string {
  return SECTION_DEFINITIONS.find((section) => section.id === id)?.label ?? id;
}
