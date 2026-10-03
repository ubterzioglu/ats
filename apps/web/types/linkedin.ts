/**
 * The LinkedIn "Save as PDF" export, parsed. The user downloads this file
 * themselves - there is no scraping and no terms-of-service exposure - and
 * like the CV it is personal data, so it is parsed in the browser and never
 * uploaded.
 *
 * Fields keep the verbatim lines they came from wherever the comparison
 * report needs to quote them (I.2 cites both sources for every
 * inconsistency), next to the normalised dates the engine read.
 */

export interface LinkedinPosition {
  readonly title: string;
  readonly company: string;
  readonly employmentType: string;
  readonly startDate: string;
  /** "" when the role is open, matching JSON Resume's marker. */
  readonly endDate: string;
  /** The duration as LinkedIn wrote it ("2 yrs 9 mos"), verbatim. */
  readonly durationLabel: string;
  readonly location: string;
  /** Description lines, verbatim, bullets included. */
  readonly lines: readonly string[];
  /** The date line as the document wrote it, for citation. */
  readonly dateLine: string;
}

export interface LinkedinEducation {
  readonly school: string;
  readonly degree: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly dateLine: string;
  readonly lines: readonly string[];
}

export interface LinkedinCertification {
  readonly name: string;
  readonly issuer: string;
  readonly issuedLine: string;
}

export interface LinkedinLanguage {
  readonly language: string;
  readonly proficiency: string;
}

export interface LinkedinProfile {
  readonly name: string;
  readonly headline: string;
  readonly location: string;
  readonly connections: string;
  readonly about: string;
  readonly positions: readonly LinkedinPosition[];
  readonly education: readonly LinkedinEducation[];
  readonly skills: readonly string[];
  readonly languages: readonly LinkedinLanguage[];
  readonly certifications: readonly LinkedinCertification[];
  readonly interests: readonly string[];
  /** Every section heading seen, parsed or not - the report's honesty list. */
  readonly sectionsSeen: readonly string[];
}

export interface LinkedinParse {
  readonly profile: LinkedinProfile;
  /** Plain-English notes about what the parser could not carry over. */
  readonly warnings: readonly string[];
}
