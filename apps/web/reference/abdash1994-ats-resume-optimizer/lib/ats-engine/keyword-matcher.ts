import type { KeywordMatch, ResumeData } from '@/types/resume';

const ACRONYM_MAP: Record<string, string[]> = {
  ml: ['machine learning'],
  ai: ['artificial intelligence'],
  nlp: ['natural language processing'],
  'ab testing': ['a/b testing', 'split testing'],
  'a/b testing': ['ab testing', 'split testing'],
  'abtesting': ['a/b testing', 'ab testing'],
  cv: ['computer vision'],
  dl: ['deep learning'],
  api: ['application programming interface'],
  rest: ['representational state transfer'],
  sql: ['structured query language'],
  nosql: ['non-relational database', 'non relational'],
  aws: ['amazon web services'],
  gcp: ['google cloud platform'],
  ci: ['continuous integration'],
  cd: ['continuous deployment', 'continuous delivery'],
  'ci/cd': ['continuous integration', 'continuous delivery'],
  ux: ['user experience'],
  ui: ['user interface'],
  crm: ['customer relationship management'],
  erp: ['enterprise resource planning'],
  kpi: ['key performance indicator'],
  okr: ['objectives and key results'],
  roi: ['return on investment'],
  mvp: ['minimum viable product'],
  b2b: ['business to business'],
  b2c: ['business to consumer'],
  saas: ['software as a service'],
  paas: ['platform as a service'],
  iaas: ['infrastructure as a service'],
  seo: ['search engine optimization'],
  sem: ['search engine marketing'],
  ppc: ['pay per click'],
  ctr: ['click through rate'],
  cpc: ['cost per click'],
  html: ['hypertext markup language'],
  css: ['cascading style sheets'],
  js: ['javascript'],
  ts: ['typescript'],
  fp: ['functional programming'],
  oop: ['object oriented programming'],
  tdd: ['test driven development'],
  bdd: ['behavior driven development'],
  ddd: ['domain driven design'],
  agile: ['scrum', 'kanban', 'sprint planning'],
  devops: ['development operations'],
  sre: ['site reliability engineering'],
  k8s: ['kubernetes'],
  etl: ['extract transform load'],
  bi: ['business intelligence'],
  'power bi': ['business intelligence'],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    // Normalize A/B → ab, CI/CD → cicd, etc before stripping special chars
    .replace(/([a-z])\/([a-z])/gi, '$1$2')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandWithAcronyms(keyword: string): string[] {
  const lower = keyword.toLowerCase();
  const expansions: string[] = [lower];

  if (ACRONYM_MAP[lower]) {
    expansions.push(...ACRONYM_MAP[lower]);
  }

  // Check reverse: if keyword is a full form, add acronym
  for (const [acronym, forms] of Object.entries(ACRONYM_MAP)) {
    if (forms.some(f => lower.includes(f) || f.includes(lower))) {
      expansions.push(acronym);
    }
  }

  return [...new Set(expansions)];
}

function countKeywordOccurrences(keyword: string, resumeText: string): { count: number; locations: string[] } {
  const normalizedResume = normalize(resumeText);
  const variants = expandWithAcronyms(keyword);
  let totalCount = 0;
  const locations: string[] = [];

  for (const variant of variants) {
    const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = [...normalizedResume.matchAll(regex)];
    totalCount += matches.length;
  }

  // Identify locations (section names)
  const sections = ['summary', 'experience', 'skills', 'education', 'projects'];
  for (const section of sections) {
    const sectionRegex = new RegExp(`${section}[\\s\\S]{0,500}`, 'i');
    const sectionMatch = resumeText.match(sectionRegex);
    if (sectionMatch) {
      const sectionText = normalize(sectionMatch[0]);
      for (const variant of variants) {
        if (sectionText.includes(variant)) {
          locations.push(section);
          break;
        }
      }
    }
  }

  return { count: totalCount, locations };
}

export function matchKeywords(
  jdKeywords: string[],
  preferredKeywords: string[],
  resume: ResumeData
): KeywordMatch[] {
  const resumeText = buildResumeText(resume);
  const results: KeywordMatch[] = [];

  const allKeywords = [
    ...jdKeywords.map(k => ({ keyword: k, importance: 'required' as const })),
    ...preferredKeywords.map(k => ({ keyword: k, importance: 'preferred' as const })),
  ];

  for (const { keyword, importance } of allKeywords) {
    const { count, locations } = countKeywordOccurrences(keyword, resumeText);
    results.push({
      keyword,
      found: count > 0,
      frequency: count,
      importance,
      locations,
    });
  }

  return results;
}

export function buildResumeText(resume: ResumeData): string {
  const parts: string[] = [];

  if (resume.contact.name) parts.push(resume.contact.name);
  if (resume.summary) parts.push(resume.summary);

  for (const exp of resume.experience) {
    parts.push(exp.title, exp.company);
    parts.push(...exp.bullets);
  }

  for (const edu of resume.education) {
    parts.push(edu.institution, edu.degree, edu.field || '');
  }

  parts.push(...resume.skills);

  for (const cert of resume.certifications || []) {
    parts.push(typeof cert === 'string' ? cert : cert.name);
  }

  for (const proj of resume.projects || []) {
    if (typeof proj === 'string') {
      parts.push(proj);
    } else {
      parts.push(proj.name, proj.description, ...(proj.technologies || []));
    }
  }

  return parts.join('\n');
}
