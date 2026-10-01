import type { ResumeData, ContactInfo, WorkExperience, Education } from '@/types/resume';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Contact field extractors ───────────────────────────────────────────────

function extractEmail(text: string): string {
  const m = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : '';
}

function extractPhone(text: string): string {
  // Remove URLs first to avoid matching port numbers
  const cleaned = text.replace(/https?:\/\/[^\s]+/g, '');
  const m = cleaned.match(/(\+?[\d][\d\s\-().]{6,18}[\d])/);
  if (!m) return '';
  const digits = (m[0].match(/\d/g) || []).length;
  return digits >= 7 ? m[0].trim() : '';
}

function extractLinkedIn(text: string): string {
  const m = text.match(/linkedin\.com\/in\/[\w%-]+/i);
  return m ? `https://${m[0]}` : '';
}

function extractGitHub(text: string): string {
  const m = text.match(/github\.com\/[\w-]+/i);
  return m ? `https://${m[0]}` : '';
}

function extractLocation(text: string): string {
  // Match known city patterns first (avoids matching names as location)
  const cityPatterns = [
    /\b(Bangalore|Bengaluru|Mumbai|Delhi|New Delhi|Hyderabad|Chennai|Pune|Kolkata|Noida|Gurgaon|Gurugram|Ahmedabad|Jaipur|Surat|Lucknow|Chandigarh|Kochi|Bhopal|Indore|Coimbatore)[,\s]+(?:India|IN|Karnataka|Maharashtra|Telangana|Tamil Nadu|UP|Haryana|Gujarat|Rajasthan|Kerala|MP)\b/i,
    /\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|San Francisco|Seattle|Denver|Boston|Nashville|Portland|Las Vegas|Washington)[,\s]+(?:NY|CA|IL|TX|AZ|PA|FL|WA|CO|MA|TN|OR|NV|DC|[A-Z]{2})\b/i,
    // Generic: "City, ST" or "City, Country" — city must start with capital, be lowercase-dominant (not a name)
    /\b([A-Z][a-z]{2,15}(?:\s[A-Z][a-z]{2,12})?),\s+([A-Z]{2}|[A-Z][a-z]{3,15})\b/,
  ];
  for (const pattern of cityPatterns) {
    const m = text.match(pattern);
    if (m) return m[0].trim();
  }
  return '';
}

// ─── Section detection ───────────────────────────────────────────────────────

// These are the ONLY patterns we use to detect section headings.
// We intentionally avoid any heuristics like "short title-case line"
// because those destroy experience/education parsing.
const SECTION_PATTERNS: Array<{ type: string; patterns: RegExp[] }> = [
  {
    type: 'summary',
    patterns: [
      /^(professional\s+)?summary:?$/i,
      /^(career\s+)?objective:?$/i,
      /^profile:?$/i,
      /^(professional\s+)?profile:?$/i,
      /^executive\s+summary:?$/i,
      /^about(\s+me)?:?$/i,
      /^overview:?$/i,
      /^introduction:?$/i,
      /^statement:?$/i,
    ],
  },
  {
    type: 'experience',
    patterns: [
      /^(work\s+)?experience:?$/i,
      /^professional\s+experience:?$/i,
      /^employment(\s+history)?:?$/i,
      /^work\s+history:?$/i,
      /^career\s+history:?$/i,
      /^positions?:?$/i,
      /^relevant\s+experience:?$/i,
      /^job\s+history:?$/i,
    ],
  },
  {
    type: 'education',
    patterns: [
      /^education:?$/i,
      /^academic\s+(background|history|qualifications?)?:?$/i,
      /^(educational\s+)?qualifications?:?$/i,
      /^degrees?:?$/i,
      /^schooling:?$/i,
      /^training\s+and\s+education:?$/i,
    ],
  },
  {
    type: 'skills',
    patterns: [
      /^(technical\s+)?skills:?$/i,
      /^core\s+competencies:?$/i,
      /^competencies:?$/i,
      /^key\s+skills:?$/i,
      /^expertise:?$/i,
      /^areas\s+of\s+expertise:?$/i,
      /^proficiencies:?$/i,
      /^technologies:?$/i,
      /^tools?\s*(and\s+technologies?)?:?$/i,
      /^technology\s+stack:?$/i,
      /^technical\s+expertise:?$/i,
      /^professional\s+skills:?$/i,
      /^capabilities:?$/i,
    ],
  },
  {
    type: 'certifications',
    patterns: [
      /^certifications?:?$/i,
      /^certificates?:?$/i,
      /^professional\s+certifications?:?$/i,
      /^credentials?:?$/i,
      /^licenses?:?$/i,
      /^accreditations?:?$/i,
    ],
  },
  {
    type: 'projects',
    patterns: [
      /^(key\s+|personal\s+|side\s+|notable\s+|selected\s+|relevant\s+)?projects?:?$/i,
      /^portfolio:?$/i,
      /^project\s+work:?$/i,
    ],
  },
  {
    type: 'awards',
    patterns: [
      /^awards?(\s+&?\s*honors?)?:?$/i,
      /^honors?:?$/i,
      /^achievements?:?$/i,
      /^recognition:?$/i,
      /^accomplishments?:?$/i,
    ],
  },
  {
    type: 'publications',
    patterns: [
      /^publications?:?$/i,
      /^papers?:?$/i,
      /^research(\s+papers?)?:?$/i,
      /^articles?:?$/i,
    ],
  },
  {
    type: 'languages',
    patterns: [
      /^languages?(\s+skills?|\s+proficiency)?:?$/i,
      /^spoken\s+languages?:?$/i,
    ],
  },
  {
    type: 'volunteer',
    patterns: [
      /^volunteer(\s+experience)?:?$/i,
      /^volunteering:?$/i,
      /^community\s+(service|involvement):?$/i,
    ],
  },
];

function identifySection(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const { type, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) return type;
    }
  }
  return null;
}

function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  // Must be non-empty, not too long, and contain letters (not just numbers/symbols)
  if (!trimmed || trimmed.length > 60 || !/[a-zA-Z]/.test(trimmed)) return false;
  // Must match a known section pattern
  return identifySection(trimmed) !== null;
}

// ─── Section splitting ────────────────────────────────────────────────────────

interface TextSection {
  type: string | null;
  heading: string;
  lines: string[];
}

function splitIntoSections(rawText: string): TextSection[] {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sections: TextSection[] = [];
  let current: TextSection = { type: null, heading: '', lines: [] };

  for (const line of lines) {
    if (isSectionHeading(line)) {
      if (current.lines.length > 0 || current.heading) {
        sections.push(current);
      }
      current = { type: identifySection(line), heading: line, lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length > 0 || current.heading) {
    sections.push(current);
  }

  return sections;
}

// ─── Contact parsing ──────────────────────────────────────────────────────────

function parseContactSection(lines: string[]): ContactInfo {
  const allText = lines.join('\n');
  const email = extractEmail(allText);
  const linkedin = extractLinkedIn(allText);
  const github = extractGitHub(allText);
  const phone = extractPhone(allText.replace(email, '').replace(linkedin, '').replace(github, ''));
  const location = extractLocation(
    allText.replace(email, '').replace(phone, '').replace(linkedin, '').replace(github, '')
  );

  // Name: first non-empty line that doesn't look like contact metadata
  let name = '';
  for (const line of lines) {
    const t = line.trim();
    if (
      t &&
      !extractEmail(t) &&
      !extractLinkedIn(t) &&
      !extractGitHub(t) &&
      !/^\+?[\d\s\-().]{7,}$/.test(t) &&
      t.length < 60
    ) {
      name = t;
      break;
    }
  }

  return { name, email, phone, location, linkedin, github, portfolio: extractPortfolio(allText) };
}

function extractPortfolio(text: string): string {
  const m = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[a-zA-Z]{2,}(?:\/[\w.-]*)?/i);
  return m ? m[0] : '';
}

// ─── Experience parsing ───────────────────────────────────────────────────────

const DATE_RANGE_RE =
  /((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s*\d{2,4}|\d{1,2}[\/\-]\d{2,4}|\d{4})\s*(?:[-–—]|to)\s*((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?\s*\d{2,4}|\d{1,2}[\/\-]\d{2,4}|\d{4}|present|current|now)/gi;

const SINGLE_YEAR_RE = /\b(19|20)\d{2}\b/;

function parseDateRange(line: string): { start: string; end: string } | null {
  DATE_RANGE_RE.lastIndex = 0;
  const m = DATE_RANGE_RE.exec(line);
  if (m) return { start: m[1].trim(), end: m[2].trim() };
  return null;
}

function isLikelyBullet(line: string): boolean {
  return /^[•\-\*▪◦▸►‣⁃]\s/.test(line) || /^\d+\.\s/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[•\-\*▪◦▸►‣⁃]\s+/, '').replace(/^\d+\.\s+/, '').trim();
}

function parseSeparatedLine(line: string): { parts: string[] } {
  // Split on | · • / — or multiple spaces
  const parts = line.split(/\s*[|·•\/—]\s*|\s{3,}/).map(p => p.trim()).filter(Boolean);
  return { parts };
}

function parseExperienceSection(lines: string[]): WorkExperience[] {
  const entries: WorkExperience[] = [];

  // Group lines into job blocks. A new job starts when we see a date range,
  // or a line that looks like "Title | Company | Dates" or "Title at Company"
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateRange = parseDateRange(trimmed);
    const hasSeparator = /[|·]/.test(trimmed) && trimmed.split(/[|·]/).length >= 2;

    // Start a new block if this line has a date range and we already have content
    if (dateRange && currentBlock.length > 0 && !isLikelyBullet(trimmed)) {
      // Check if the date is NOT in a bullet
      blocks.push(currentBlock);
      currentBlock = [trimmed];
    } else {
      currentBlock.push(trimmed);
    }
  }

  if (currentBlock.length > 0) blocks.push(currentBlock);

  for (const block of blocks) {
    const entry = parseJobBlock(block);
    if (entry) entries.push(entry);
  }

  return entries;
}

function parseJobBlock(lines: string[]): WorkExperience | null {
  let title = '';
  let company = '';
  let startDate = '';
  let endDate = 'Present';
  let location = '';
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Bullet point
    if (isLikelyBullet(trimmed)) {
      bullets.push(stripBullet(trimmed));
      continue;
    }

    // Try to extract date range from the line
    const dateRange = parseDateRange(trimmed);
    if (dateRange) {
      startDate = dateRange.start;
      endDate = dateRange.end;

      // Remove dates from line to get remaining title/company info
      const withoutDate = trimmed
        .replace(DATE_RANGE_RE, '')
        .replace(/[|·,\s]+$/, '')
        .replace(/^[|·,\s]+/, '')
        .trim();

      if (withoutDate) {
        const { parts } = parseSeparatedLine(withoutDate);
        if (parts.length >= 2) {
          if (!title) title = parts[0];
          if (!company) company = parts[1];
          if (parts[2] && !location) location = parts[2];
        } else if (parts.length === 1) {
          if (!title) title = parts[0];
        }
      }
      continue;
    }

    // Inline format: "Title | Company | Location"
    const { parts } = parseSeparatedLine(trimmed);
    if (parts.length >= 2) {
      if (!title) title = parts[0];
      if (!company) company = parts[1];
      if (parts[2] && !location && !/\d{4}/.test(parts[2])) location = parts[2];
      continue;
    }

    // Single line — fill title first, then company
    if (!title) {
      title = trimmed;
    } else if (!company) {
      company = trimmed;
    } else {
      // Could be a non-bulleted achievement line
      bullets.push(trimmed);
    }
  }

  // Need at least a title to be a valid entry
  if (!title && !company) return null;

  return {
    id: generateId(),
    title: title || company,
    company: company || title,
    location,
    startDate,
    endDate,
    bullets,
  };
}

// ─── Education parsing ────────────────────────────────────────────────────────

function parseEducationSection(lines: string[]): Education[] {
  const entries: Education[] = [];
  let current: Partial<Education> | null = null;

  const flush = () => {
    if (current && (current.institution || current.degree)) {
      entries.push({
        id: generateId(),
        institution: current.institution || '',
        degree: current.degree || '',
        field: current.field,
        startDate: current.startDate,
        endDate: current.endDate || '',
        gpa: current.gpa,
      });
      current = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const gpaMatch = trimmed.match(/\bGPA[:\s]+(\d+\.?\d*)/i);
    const dateRange = parseDateRange(trimmed);
    const singleYear = trimmed.match(SINGLE_YEAR_RE);

    if (gpaMatch && current) {
      current.gpa = gpaMatch[1];
      continue;
    }

    if (dateRange) {
      flush();
      current = { startDate: dateRange.start, endDate: dateRange.end };
      // Remaining text after removing date
      const rest = trimmed.replace(DATE_RANGE_RE, '').replace(/[|·,\s]+$/, '').replace(/^[|·,\s]+/, '').trim();
      if (rest) {
        const { parts } = parseSeparatedLine(rest);
        if (parts.length >= 2) {
          current.degree = parts[0];
          current.institution = parts[1];
        } else if (parts.length === 1) {
          current.institution = parts[0];
        }
      }
      continue;
    }

    // Line has a year but no range
    if (singleYear) {
      flush();
      current = { endDate: singleYear[0] };
      const rest = trimmed.replace(singleYear[0], '').replace(/[|·,\s]+$/, '').replace(/^[|·,\s]+/, '').trim();
      if (rest) {
        const { parts } = parseSeparatedLine(rest);
        if (parts.length >= 2) {
          current.degree = parts[0];
          current.institution = parts[1];
        } else {
          current.institution = rest;
        }
      }
      continue;
    }

    // Inline: "Degree | Institution" or "Degree in Field | Institution"
    const { parts } = parseSeparatedLine(trimmed);
    if (parts.length >= 2) {
      if (!current) current = {};
      if (!current.degree) current.degree = parts[0];
      if (!current.institution) current.institution = parts[1];
      continue;
    }

    if (!current) current = {};
    if (!current.institution) current.institution = trimmed;
    else if (!current.degree) current.degree = trimmed;
    else if (!current.field) current.field = trimmed;
  }

  flush();
  return entries;
}

// ─── Skills parsing ───────────────────────────────────────────────────────────

function parseSkillsSection(lines: string[]): string[] {
  const skills: string[] = [];
  for (const line of lines) {
    // Split on commas, semicolons, pipes, bullets, or newlines
    const parts = line.split(/[,;|•·\t]+/);
    for (const part of parts) {
      const cleaned = part.replace(/^[-*•·▪]\s*/, '').trim();
      if (cleaned && cleaned.length > 1 && cleaned.length < 60) {
        skills.push(cleaned);
      }
    }
  }
  return [...new Set(skills)];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseRawTextToResume(rawText: string): ResumeData {
  const sections = splitIntoSections(rawText);

  let contact: ContactInfo = { name: '', email: '', phone: '', location: '' };
  let summary = '';
  let experience: WorkExperience[] = [];
  let education: Education[] = [];
  let skills: string[] = [];

  // First section (before any known heading) = contact info
  if (sections.length > 0) {
    const first = sections[0];
    if (!first.type || first.type === 'contact') {
      contact = parseContactSection([first.heading, ...first.lines]);
    }
  }

  for (const section of sections) {
    if (!section.type) continue;

    switch (section.type) {
      case 'contact':
        contact = parseContactSection([section.heading, ...section.lines]);
        break;
      case 'summary':
        summary = section.lines.join(' ').trim();
        break;
      case 'experience':
        experience = parseExperienceSection(section.lines);
        break;
      case 'education':
        education = parseEducationSection(section.lines);
        break;
      case 'skills':
        skills = parseSkillsSection(section.lines);
        break;
    }
  }

  // Fallback: if name still missing, use very first non-empty line
  if (!contact.name) {
    const firstLine = rawText.split('\n').find(l => l.trim().length > 1);
    if (firstLine) contact.name = firstLine.trim().slice(0, 80);
  }

  return {
    contact,
    summary,
    experience,
    education,
    skills,
    certifications: [],
    projects: [],
    rawText,
  };
}
