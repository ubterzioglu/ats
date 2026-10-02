/**
 * The canonical resume model: JSON Resume's shape, typed for this codebase.
 *
 * Every field is optional and nothing has a default, because the rule the
 * whole builder lives by is that empty stays empty - a field the candidate
 * did not write must never arrive filled in. Objects may carry keys beyond
 * the ones declared here; the validator is deliberately loose so an imported
 * document can be exported again without losing what we do not model
 * (see lib/resume/json-resume.ts).
 */

export interface ResumeLocation {
  readonly address?: string;
  readonly postalCode?: string;
  readonly city?: string;
  readonly countryCode?: string;
  readonly region?: string;
}

export interface ResumeProfile {
  readonly network?: string;
  readonly username?: string;
  readonly url?: string;
}

export interface ResumeBasics {
  readonly name?: string;
  readonly label?: string;
  readonly image?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly url?: string;
  readonly summary?: string;
  readonly location?: ResumeLocation;
  readonly profiles?: readonly ResumeProfile[];
}

export interface ResumeWorkItem {
  readonly name?: string;
  readonly position?: string;
  readonly url?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly summary?: string;
  readonly highlights?: readonly string[];
}

export interface ResumeVolunteerItem {
  readonly organization?: string;
  readonly position?: string;
  readonly url?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly summary?: string;
  readonly highlights?: readonly string[];
}

export interface ResumeEducationItem {
  readonly institution?: string;
  readonly url?: string;
  readonly area?: string;
  readonly studyType?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly score?: string;
  readonly courses?: readonly string[];
}

export interface ResumeAwardItem {
  readonly title?: string;
  readonly date?: string;
  readonly awarder?: string;
  readonly summary?: string;
}

export interface ResumePublicationItem {
  readonly name?: string;
  readonly publisher?: string;
  readonly releaseDate?: string;
  readonly url?: string;
  readonly summary?: string;
}

export interface ResumeSkillItem {
  readonly name?: string;
  readonly level?: string;
  readonly keywords?: readonly string[];
}

export interface ResumeLanguageItem {
  readonly language?: string;
  readonly fluency?: string;
}

export interface ResumeInterestItem {
  readonly name?: string;
  readonly keywords?: readonly string[];
}

export interface ResumeReferenceItem {
  readonly name?: string;
  readonly reference?: string;
}

export interface ResumeProjectItem {
  readonly name?: string;
  readonly isActive?: boolean;
  readonly description?: string;
  readonly highlights?: readonly string[];
  readonly keywords?: readonly string[];
  readonly startDate?: string;
  readonly endDate?: string;
  readonly url?: string;
  readonly roles?: readonly string[];
  readonly entity?: string;
  readonly type?: string;
}

export interface ResumeMeta {
  readonly canonical?: string;
  readonly version?: string;
  readonly lastModified?: string;
}

export interface Resume {
  readonly basics?: ResumeBasics;
  readonly work?: readonly ResumeWorkItem[];
  readonly volunteer?: readonly ResumeVolunteerItem[];
  readonly education?: readonly ResumeEducationItem[];
  readonly awards?: readonly ResumeAwardItem[];
  readonly publications?: readonly ResumePublicationItem[];
  readonly skills?: readonly ResumeSkillItem[];
  readonly languages?: readonly ResumeLanguageItem[];
  readonly interests?: readonly ResumeInterestItem[];
  readonly references?: readonly ResumeReferenceItem[];
  readonly projects?: readonly ResumeProjectItem[];
  readonly meta?: ResumeMeta;
}
