import type { 
  AtsTargetInfo,
  ExperienceRequirement,
  JobAdRedFlag,
  JobAdRequirements,
  KeywordTerm,
  LanguageRequirement,
  LocationRequirement,
  SalaryRequirement,
  SeniorityLevel,
  SeniorityRequirement,
  WorkMode
} from "@/types/analysis";

import { detectAts } from "./ats-detect";
import { caseFold } from "./text";

const YEARS_RX = /(\d{1,2})\s*\+?\s*(?:years?|yrs?|jahre?n?|yıl|yil|sene)\b/giu;
const MAX_PLAUSIBLE_YEARS = 60;
const MIN_AD_LENGTH = 120;

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



const SENIORITY_PATTERNS = [
  { level: "junior", rx: /(?<![\p{L}\p{N}])(junior|entry-?level|graduate|trainee|yeni mezun|deneyimsiz|anfänger)(?![\p{L}\p{N}])/iu },
  { level: "mid", rx: /(?<![\p{L}\p{N}])(mid-?level|mid|intermediate|uzman)(?![\p{L}\p{N}])/iu },
  { level: "senior", rx: /(?<![\p{L}\p{N}])(senior|snr|sr|erfahren)(?![\p{L}\p{N}])/iu },
  { level: "lead", rx: /(?<![\p{L}\p{N}])(lead|manager|head of|director|vp|yönetici|leiter)(?![\p{L}\p{N}])/iu },
  { level: "principal", rx: /(?<![\p{L}\p{N}])(principal|staff|architect)(?![\p{L}\p{N}])/iu },
] as const;

function isTitleLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (/^(you |we |the |our |they )/i.test(trimmed)) return false;
  return true;
}

export function extractSeniority(lines: readonly string[]): SeniorityRequirement | null {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!line || !isTitleLine(line)) continue;
    for (const pattern of SENIORITY_PATTERNS) {
      if (pattern.rx.test(line)) {
        return { level: pattern.level as SeniorityLevel, source: line };
      }
    }
  }
  for (const line of lines) {
    if (!isTitleLine(line)) continue;
    for (const pattern of SENIORITY_PATTERNS) {
      if (pattern.rx.test(line)) {
        return { level: pattern.level as SeniorityLevel, source: line };
      }
    }
  }
  return null;
}



const LANGUAGE_RX = /(?<![\p{L}\p{N}])(english|german|turkish|englisch|deutsch|türkisch|ingilizce|almanca|türkçe)(?![\p{L}\p{N}])/iu;
const LEVEL_RX = /(?<![\p{L}\p{N}])(fluent|native|proficient|working knowledge|b1|b2|c1|c2|fließend|muttersprache|verhandlungssicher|akıcı|anadil|iyi derecede)(?![\p{L}\p{N}])/iu;

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  english: "English",
  german: "German",
  turkish: "Turkish",
  englisch: "English",
  deutsch: "German",
  türkisch: "Turkish",
  ingilizce: "English",
  almanca: "German",
  türkçe: "Turkish"
};

export function extractLanguages(lines: readonly string[]): LanguageRequirement[] {
  const reqs: LanguageRequirement[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const langMatch = line.match(LANGUAGE_RX);
    const levelMatch = line.match(LEVEL_RX);
    if (langMatch && levelMatch) {
      const langStr = langMatch[1] ?? "";
      const lang = caseFold(langStr);
      const canonical = LANGUAGE_NAMES[lang] ?? langStr;
      if (!seen.has(canonical)) {
        seen.add(canonical);
        reqs.push({
          language: canonical,
          level: levelMatch[1] ?? "",
          source: line
        });
      }
    }
  }
  return reqs;
}



export function extractLocation(lines: readonly string[]): LocationRequirement | null {
  let bestMode: WorkMode | undefined;
  let source: string | undefined;

  for (const line of lines) {
    if (/(?<![\p{L}\p{N}])(hybrid|hibrit)(?![\p{L}\p{N}])/iu.test(line)) {
      bestMode = "hybrid";
      source = line;
      break;
    } else if (!bestMode && /(?<![\p{L}\p{N}])(remote|uzaktan|home-?office|home office)(?![\p{L}\p{N}])/iu.test(line)) {
      bestMode = "remote";
      source = line;
    } else if (!bestMode && /(?<![\p{L}\p{N}])(on-?site|office|ofis|vor ort)(?![\p{L}\p{N}])/iu.test(line)) {
      bestMode = "on-site";
      source = line;
    }
  }

  let city: string | undefined;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!line) continue;
    const match = line.match(/^([A-Z][A-Za-z\s]+),\s*([A-Z][A-Za-z\s]+)$/);
    if (match) {
      city = (match[1] ?? "").trim();
      if (!source) source = line;
      break;
    }
    const lblMatch = line.match(/(?<![\p{L}\p{N}])(location|standort|ort|lokasyon|şehir|lieu)(?![\p{L}\p{N}])\s*[:：]\s*([A-Z][A-Za-z\s]+)/iu);
    if (lblMatch) {
      city = (lblMatch[2] ?? "").trim();
      if (!source) source = line;
      break;
    }
  }

  if (bestMode || city) {
    return {
      mode: bestMode ?? "on-site",
      city,
      source: source!
    };
  }

  return null;
}



export function extractSalary(lines: readonly string[]): SalaryRequirement | null {
  for (const line of lines) {
    if (/(?<![\p{L}\p{N}])competitive(?![\p{L}\p{N}])/iu.test(line)) return null;

    const currMatch = line.match(/(\$|€|£|USD|EUR|GBP|TRY|TL)/i);
    if (!currMatch) continue;

    const numRx = /(?:(?:[1-9]\d{0,2}(?:,\d{3})+)|(?:\d+))(?:\.\d+)?(?:k)?/gi;
    let match;
    const nums: number[] = [];
    numRx.lastIndex = 0;
    while ((match = numRx.exec(line)) !== null) {
      let s = match[0].replace(/,/g, '');
      let multiplier = 1;
      if (caseFold(s).endsWith('k')) {
        multiplier = 1000;
        s = s.slice(0, -1);
      }
      const val = parseFloat(s) * multiplier;
      if (val > 0) nums.push(val);
    }

    if (nums.length > 0) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const currency = (currMatch[1] ?? "").toUpperCase();
      let period: "yearly" | "monthly" | "hourly" = "yearly";
      if (/(?<![\p{L}\p{N}])(month|ay|monat)(?![\p{L}\p{N}])/iu.test(line) || (min < 15000 && min > 500)) period = "monthly";
      else if (/(?<![\p{L}\p{N}])(hour|saat|stunde)(?![\p{L}\p{N}])/iu.test(line) || min < 500) period = "hourly";

      return {
        min,
        max,
        currency: currency === '€' ? 'EUR' : currency === '$' ? 'USD' : currency === '£' ? 'GBP' : currency,
        period,
        source: line
      };
    }
  }
  return null;
}



export function parseJobAd(jobDescription: string, terms: readonly KeywordTerm[], jobUrl?: string): JobAdRequirements | null {
  if (jobDescription.trim().length < MIN_AD_LENGTH) return null;

  const lines = jobDescription.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const required: KeywordTerm[] = [];
  const preferred: KeywordTerm[] = [];
  for (const term of terms) {
    if (term.tier === "preferred") {
      preferred.push(term);
    } else {
      required.push(term);
    }
  }

  const experience = extractExperienceRequirement(jobDescription);
  const seniority = extractSeniority(lines);
  const targetAts = detectAts(jobUrl ?? "") ?? detectAts(jobDescription);

  return {
    experience,
    seniority,
    languages: extractLanguages(lines),
    location: extractLocation(lines),
    salary: extractSalary(lines),
    terms: { required, preferred },
    redFlags: extractRedFlags(jobDescription, experience, seniority, required),
    targetAts
  };
}

function extractRedFlags(
  text: string,
  experience: ExperienceRequirement | null,
  seniority: SeniorityRequirement | null,
  requiredTerms: readonly KeywordTerm[]
): JobAdRedFlag[] {
  const flags: JobAdRedFlag[] = [];

  // Laundry list of skills
  if (requiredTerms.length > 15) {
    flags.push({
      id: "laundry-list",
      description: "The ad demands an unusually high number of required skills, which often points to an unrealistic job description.",
      // No single line evidence for a laundry list
    });
  }

  // Multiple specialist roles rolled into one
  if (requiredTerms.length > 22) {
    flags.push({
      id: "unrealistic-requirements",
      description: `The vacancy specifies ${requiredTerms.length} mandatory skills, suggesting multiple specialist roles collapsed into one posting.`
    });
  }

  // Seniority mismatch
  if (seniority?.level === "junior" && experience && experience.years >= 3) {
    flags.push({
      id: "seniority-mismatch",
      description: `The role is advertised as Junior but asks for ${experience.years} years of experience.`,
      evidence: experience.source
    });
  }

  // Vague role
  if (text.split(/\s+/).length < 80) {
    flags.push({
      id: "vague-role",
      description: "The job description is extremely short and may lack important context about the responsibilities.",
    });
  }

  // Ghost job or perpetual talent pool signals
  const GHOST_SIGNALS =
    /(posted\s+(?:30\+|60\+|90\+|\d{2,}\+?\s*(?:days?|months?))\s+ago|originally\s+posted|continuous\s+recruitment|always\s+looking\s+for|ongoing\s+talent\s+pool|sürekli\s+al[ıi]m|genel\s+ba[şs]vuru|laufende\s+ausschreibung|talent\s+pool\s+only)/i;

  const ghostMatch = text.match(GHOST_SIGNALS);
  if (ghostMatch) {
    flags.push({
      id: "ghost-job-stale",
      description: "Indicators of a stale posting or continuous talent pool detected. The position may lack an active, funded opening.",
      evidence: ghostMatch[0]
    });
  }

  return flags;
}
