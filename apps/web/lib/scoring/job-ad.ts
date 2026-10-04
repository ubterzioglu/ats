import type { KeywordTerm } from "@/types/analysis";

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

export type SeniorityLevel = "junior" | "mid" | "senior" | "lead" | "principal";

export interface SeniorityRequirement {
  readonly level: SeniorityLevel;
  readonly source: string;
}

const SENIORITY_PATTERNS = [
  { level: "junior", rx: /\b(junior|entry-?level|graduate|trainee|yeni mezun|deneyimsiz|anfänger)\b/i },
  { level: "mid", rx: /\b(mid-?level|mid|intermediate|uzman)\b/i },
  { level: "senior", rx: /\b(senior|snr|sr|erfahren)\b/i },
  { level: "lead", rx: /\b(lead|manager|head of|director|vp|yönetici|leiter)\b/i },
  { level: "principal", rx: /\b(principal|staff|architect)\b/i },
] as const;

export function extractSeniority(lines: readonly string[]): SeniorityRequirement | null {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!line) continue;
    for (const pattern of SENIORITY_PATTERNS) {
      if (pattern.rx.test(line)) {
        return { level: pattern.level as SeniorityLevel, source: line };
      }
    }
  }
  for (const line of lines) {
    for (const pattern of SENIORITY_PATTERNS) {
      if (pattern.rx.test(line)) {
        return { level: pattern.level as SeniorityLevel, source: line };
      }
    }
  }
  return null;
}

export interface LanguageRequirement {
  readonly language: string;
  readonly level: string;
  readonly source: string;
}

const LANGUAGE_RX = /\b(english|german|turkish|englisch|deutsch|türkisch|ingilizce|almanca|türkçe)\b/i;
const LEVEL_RX = /\b(fluent|native|proficient|working knowledge|b1|b2|c1|c2|fließend|muttersprache|verhandlungssicher|akıcı|anadil|iyi derecede)\b/i;

export function extractLanguages(lines: readonly string[]): LanguageRequirement[] {
  const reqs: LanguageRequirement[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const langMatch = line.match(LANGUAGE_RX);
    const levelMatch = line.match(LEVEL_RX);
    if (langMatch && levelMatch) {
      const langStr = langMatch[1] ?? "";
      const lang = langStr.toLowerCase();
      if (!seen.has(lang)) {
        seen.add(lang);
        reqs.push({
          language: langStr,
          level: levelMatch[1] ?? "",
          source: line
        });
      }
    }
  }
  return reqs;
}

export type WorkMode = "on-site" | "hybrid" | "remote";

export interface LocationRequirement {
  readonly mode: WorkMode;
  readonly city?: string;
  readonly source: string;
}

export function extractLocation(lines: readonly string[]): LocationRequirement | null {
  let bestMode: WorkMode | undefined;
  let source: string | undefined;

  for (const line of lines) {
    if (/\b(hybrid|hibrit)\b/i.test(line)) {
      bestMode = "hybrid";
      source = line;
      break;
    } else if (!bestMode && /\b(remote|uzaktan|home-?office|home office)\b/i.test(line)) {
      bestMode = "remote";
      source = line;
    } else if (!bestMode && /\b(on-?site|office|ofis|vor ort)\b/i.test(line)) {
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
    const lblMatch = line.match(/(?:location|standort|lokasyon|şehir)\s*:\s*([A-Z][A-Za-z\s]+)/i);
    if (lblMatch) {
      city = (lblMatch[1] ?? "").trim();
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

export interface SalaryRequirement {
  readonly min: number;
  readonly max: number;
  readonly currency: string;
  readonly period: "yearly" | "monthly" | "hourly";
  readonly source: string;
}

export function extractSalary(lines: readonly string[]): SalaryRequirement | null {
  for (const line of lines) {
    if (/\bcompetitive\b/i.test(line)) return null;

    const currMatch = line.match(/(\$|€|£|USD|EUR|GBP|TRY|TL)/i);
    if (!currMatch) continue;

    const numRx = /(?:(?:[1-9]\d{0,2}(?:,\d{3})+)|(?:\d+))(?:\.\d+)?(?:k)?/gi;
    let match;
    const nums: number[] = [];
    numRx.lastIndex = 0;
    while ((match = numRx.exec(line)) !== null) {
      let s = match[0].replace(/,/g, '');
      let multiplier = 1;
      if (s.toLowerCase().endsWith('k')) {
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
      if (/\b(month|ay|monat)\b/i.test(line) || (min < 15000 && min > 500)) period = "monthly";
      else if (/\b(hour|saat|stunde)\b/i.test(line) || min < 500) period = "hourly";

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

export interface JobAdRequirements {
  readonly experience: ExperienceRequirement | null;
  readonly seniority: SeniorityRequirement | null;
  readonly languages: readonly LanguageRequirement[];
  readonly location: LocationRequirement | null;
  readonly salary: SalaryRequirement | null;
  readonly terms: {
    readonly required: readonly KeywordTerm[];
    readonly preferred: readonly KeywordTerm[];
  };
}

export function parseJobAd(jobDescription: string, terms: readonly KeywordTerm[]): JobAdRequirements {
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

  return {
    experience: extractExperienceRequirement(jobDescription),
    seniority: extractSeniority(lines),
    languages: extractLanguages(lines),
    location: extractLocation(lines),
    salary: extractSalary(lines),
    terms: { required, preferred }
  };
}
