export interface AtsProfile {
  readonly id: string;
  readonly name: string;
  readonly notes: string;
  readonly formatAdvice: string;
}

const ATS_PATTERNS: readonly { readonly pattern: RegExp; readonly profile: AtsProfile }[] = [
  {
    pattern: /myworkdayjobs\.com|workday\.com\/.*\/job|workday\b/i,
    profile: {
      id: "workday",
      name: "Workday",
      notes: "Multi-column layouts and text boxes frequently cause extraction errors in Workday.",
      formatAdvice: "DOCX or a clean single-column PDF is recommended. Avoid two-column layouts and tables."
    }
  },
  {
    pattern: /boards\.greenhouse\.io|job-boards\.greenhouse\.io|greenhouse\.io|\bgreenhouse\b/i,
    profile: {
      id: "greenhouse",
      name: "Greenhouse",
      notes: "Greenhouse handles text-based PDFs well but struggles with image-based or graphic-heavy documents.",
      formatAdvice: "A clean text-based PDF or DOCX is safe. Avoid scanned pages."
    }
  },
  {
    pattern: /jobs\.lever\.co|lever\.co|\blever\b/i,
    profile: {
      id: "lever",
      name: "Lever",
      notes: "Lever's parser is flexible with single-column documents.",
      formatAdvice: "Both clean single-column PDF and DOCX work well."
    }
  },
  {
    pattern: /jobs\.ashby\.io|ashbyhq\.com|\bashby\b/i,
    profile: {
      id: "ashby",
      name: "Ashby",
      notes: "Modern parser with strong multi-language and layout support.",
      formatAdvice: "Standard text-based PDF or DOCX is recommended."
    }
  },
  {
    pattern: /taleo\.net|oracle.*taleo|\btaleo\b/i,
    profile: {
      id: "taleo",
      name: "Oracle Taleo",
      notes: "Legacy enterprise system with strict parsing constraints. Non-standard formatting is frequently dropped.",
      formatAdvice: "DOCX format is strongly recommended. Keep sections strictly chronological."
    }
  },
  {
    pattern: /icims\.com|\bicims\b/i,
    profile: {
      id: "icims",
      name: "iCIMS",
      notes: "Handles standard layouts reliably, but graphic elements and complex tables can break parsing.",
      formatAdvice: "Use a simple single-column layout in DOCX or text-based PDF."
    }
  },
  {
    pattern: /smartrecruiters\.com|\bsmartrecruiters\b/i,
    profile: {
      id: "smartrecruiters",
      name: "SmartRecruiters",
      notes: "Modern ATS parser with reliable entity extraction.",
      formatAdvice: "Standard PDF or DOCX parses cleanly."
    }
  },
  {
    pattern: /breezy\.hr|\bbreezy\b/i,
    profile: {
      id: "breezy",
      name: "Breezy HR",
      notes: "Modern ATS commonly used by startups and mid-market teams.",
      formatAdvice: "Clean single-column PDF or DOCX is safe."
    }
  },
  {
    pattern: /successfactors\.com|successfactors\.eu|\bsuccessfactors\b/i,
    profile: {
      id: "successfactors",
      name: "SAP SuccessFactors",
      notes: "Enterprise ATS with rigid section detection. Requires standard section headings.",
      formatAdvice: "Use standard headings like 'Experience' and 'Education'. DOCX or simple PDF is best."
    }
  },
  {
    pattern: /recruitee\.com|\brecruitee\b/i,
    profile: {
      id: "recruitee",
      name: "Recruitee",
      notes: "European ATS with modern parsing technology.",
      formatAdvice: "Single-column layout with clear headings parses reliably."
    }
  }
];

/**
 * Detects the target ATS vendor from an application URL or job description text.
 * Returns null if no known ATS signature is detected.
 */
export function detectAts(urlOrText: string): AtsProfile | null {
  if (!urlOrText || urlOrText.trim().length === 0) return null;

  for (const entry of ATS_PATTERNS) {
    if (entry.pattern.test(urlOrText)) {
      return entry.profile;
    }
  }

  return null;
}
