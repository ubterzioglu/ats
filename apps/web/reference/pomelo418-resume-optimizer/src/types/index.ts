// ─── Domain types ────────────────────────────────────────────────────────────

export type FileType = 'pdf' | 'docx' | 'txt';

/** A structured section parsed out of the raw resume text. */
export interface ResumeSection {
  id: string;
  /** Detected section category */
  type: 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'other';
  /** Original heading text, e.g. "Work Experience" */
  title: string;
  /** Full text of the section (may contain newlines) */
  content: string;
  /** Individual bullet points extracted from the section */
  bullets: string[];
}

export interface ParsedResume {
  raw: string;
  sections: ResumeSection[];
  fileName: string;
  fileType: FileType;
}

export interface OptimizedSection extends ResumeSection {
  originalContent: string;
  originalBullets: string[];
  wasModified: boolean;
}

export interface OptimizationResult {
  sections: OptimizedSection[];
  /** Skills found in the JD but absent from the resume */
  missingSuggestedSkills: string[];
  /** All keywords extracted from the job description */
  jdKeywords: string[];
  /** Keywords from JD that appear in the optimised resume */
  matchedKeywords: string[];
  /** 0–100 estimate of ATS compatibility */
  atsScore: number;
  /** High-level improvement notes shown to the user */
  suggestions: string[];
}

// ─── App state types ──────────────────────────────────────────────────────────

export type ProcessingStep =
  | 'idle'
  | 'parsing'
  | 'extracting-keywords'
  | 'rewriting-bullets'
  | 'adjusting-summary'
  | 'scoring'
  | 'complete'
  | 'error';

export type ActiveView = 'upload' | 'optimize' | 'compare' | 'edit';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// ─── Google Drive types ───────────────────────────────────────────────────────

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
}

// ─── AI service types ─────────────────────────────────────────────────────────

export interface AIOptimizationRequest {
  resumeText: string;
  jobDescription: string;
  apiKey: string;
}

export interface AIOptimizationResponse {
  optimizedText: string;
  keywords: string[];
  missingSkills: string[];
  suggestions: string[];
}
