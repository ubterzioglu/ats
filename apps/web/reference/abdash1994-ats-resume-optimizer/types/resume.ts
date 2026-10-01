export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" or date
  bullets: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate: string;
  gpa?: string;
  honors?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  expiry?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[];
  projects?: Project[];
  publications?: string[];
  awards?: string[];
  languages?: string[];
  volunteer?: string[];
  rawText?: string;
}

export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'staff' | 'director' | 'vp' | 'c-suite';

export type RoleCategory =
  | 'software-engineering'
  | 'data-science'
  | 'product-management'
  | 'design'
  | 'finance'
  | 'marketing'
  | 'sales'
  | 'hr'
  | 'legal'
  | 'healthcare'
  | 'operations'
  | 'customer-success'
  | 'other';

export interface JobContext {
  role: string;
  roleCategory: RoleCategory;
  experienceLevel: ExperienceLevel;
  yearsOfExperience: number;
  jobDescription: string;
}

export interface ATSScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  items: ATSScoreItem[];
}

export interface ATSScoreItem {
  id: string;
  label: string;
  passed: boolean;
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
  autoFixable?: boolean;
}

export interface ATSScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: {
    keywordMatch: ATSScoreDimension;
    formatCompliance: ATSScoreDimension;
    sectionCompleteness: ATSScoreDimension;
    achievementQuality: ATSScoreDimension;
    contactMeta: ATSScoreDimension;
    lengthDensity: ATSScoreDimension;
  };
  perATS: PerATSScore[];
  extractedKeywords: KeywordMatch[];
  missingKeywords: string[];
}

export interface PerATSScore {
  atsName: string;
  score: number;
  criticalIssues: string[];
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  frequency: number;
  importance: 'required' | 'preferred' | 'bonus';
  locations: string[];
}

export interface OptimizationSuggestion {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'keyword' | 'format' | 'section' | 'achievement' | 'contact' | 'length';
  title: string;
  description: string;
  autoFixable: boolean;
  impact: number; // score points gained if fixed
}

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'markdown';

export interface AppState {
  resume: ResumeData | null;
  jobContext: JobContext | null;
  score: ATSScore | null;
  suggestions: OptimizationSuggestion[];
  activeTab: 'editor' | 'score' | 'suggestions';
  isScoring: boolean;
  proApiKey?: string;
  proProvider?: 'groq' | 'openai' | 'anthropic';
}
