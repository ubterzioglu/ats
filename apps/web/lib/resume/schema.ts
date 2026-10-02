import { z } from "zod";

import type { Resume } from "@/types/resume";

/**
 * The JSON Resume schema as a zod validator, tuned for two promises:
 *  - nothing is invented. Every field is optional, nothing carries a default,
 *    and parsing an empty object returns an empty object.
 *  - nothing is lost. Every object is loose, so keys this app does not model
 *    survive import and ride along to export untouched.
 *
 * Dates follow JSON Resume's lenient "is-date-like" contract: YYYY,
 * YYYY-MM or YYYY-MM-DD, with an optional time part. Real CVs write
 * "2020-03" and never "2020-03-01T00:00:00.000Z", and rejecting the short
 * forms would reject the documents this product exists for.
 */

const DATE_LIKE =
  /^\d{4}(?:-\d{2}(?:-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?)?)?$/;

/**
 * The empty string is a legal JSON Resume date: official exports write
 * "endDate": "" for a role that is still open, and rejecting it would reject
 * the registry's own sample. It stays "" after parsing - it is data, not a
 * gap to fill.
 */
const dateLike = z.union([
  z.literal(""),
  z.string().regex(DATE_LIKE, "expected a date-like string: YYYY, YYYY-MM or YYYY-MM-DD")
]);

const optionalString = z.string().optional();
const stringList = z.array(z.string()).optional();

const locationSchema = z.looseObject({
  address: optionalString,
  postalCode: optionalString,
  city: optionalString,
  countryCode: optionalString,
  region: optionalString
});

const profileSchema = z.looseObject({
  network: optionalString,
  username: optionalString,
  url: optionalString
});

const basicsSchema = z.looseObject({
  name: optionalString,
  label: optionalString,
  image: optionalString,
  email: optionalString,
  phone: optionalString,
  url: optionalString,
  summary: optionalString,
  location: locationSchema.optional(),
  profiles: z.array(profileSchema).optional()
});

const workSchema = z.looseObject({
  name: optionalString,
  position: optionalString,
  url: optionalString,
  startDate: dateLike.optional(),
  endDate: dateLike.optional(),
  summary: optionalString,
  highlights: stringList
});

const volunteerSchema = z.looseObject({
  organization: optionalString,
  position: optionalString,
  url: optionalString,
  startDate: dateLike.optional(),
  endDate: dateLike.optional(),
  summary: optionalString,
  highlights: stringList
});

const educationSchema = z.looseObject({
  institution: optionalString,
  url: optionalString,
  area: optionalString,
  studyType: optionalString,
  startDate: dateLike.optional(),
  endDate: dateLike.optional(),
  score: optionalString,
  courses: stringList
});

const awardSchema = z.looseObject({
  title: optionalString,
  date: dateLike.optional(),
  awarder: optionalString,
  summary: optionalString
});

const publicationSchema = z.looseObject({
  name: optionalString,
  publisher: optionalString,
  releaseDate: dateLike.optional(),
  url: optionalString,
  summary: optionalString
});

const skillSchema = z.looseObject({
  name: optionalString,
  level: optionalString,
  keywords: stringList
});

const languageSchema = z.looseObject({
  language: optionalString,
  fluency: optionalString
});

const interestSchema = z.looseObject({
  name: optionalString,
  keywords: stringList
});

const referenceSchema = z.looseObject({
  name: optionalString,
  reference: optionalString
});

const projectSchema = z.looseObject({
  name: optionalString,
  isActive: z.boolean().optional(),
  description: optionalString,
  highlights: stringList,
  keywords: stringList,
  startDate: dateLike.optional(),
  endDate: dateLike.optional(),
  url: optionalString,
  roles: stringList,
  entity: optionalString,
  type: optionalString
});

const metaSchema = z.looseObject({
  canonical: optionalString,
  version: optionalString,
  lastModified: optionalString
});

export const resumeSchema = z.looseObject({
  basics: basicsSchema.optional(),
  work: z.array(workSchema).optional(),
  volunteer: z.array(volunteerSchema).optional(),
  education: z.array(educationSchema).optional(),
  awards: z.array(awardSchema).optional(),
  publications: z.array(publicationSchema).optional(),
  skills: z.array(skillSchema).optional(),
  languages: z.array(languageSchema).optional(),
  interests: z.array(interestSchema).optional(),
  references: z.array(referenceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  meta: metaSchema.optional()
});

/** A schema violation, reduced to what a form or an import dialog can show. */
export interface ResumeIssue {
  /** Dotted path into the document, e.g. "work.0.startDate". */
  readonly path: string;
  readonly message: string;
}

export type ResumeParseResult =
  | { readonly ok: true; readonly resume: Resume }
  | { readonly ok: false; readonly issues: readonly ResumeIssue[] };

export function parseResume(json: unknown): Resume {
  return resumeSchema.parse(json) as Resume;
}

export function safeParseResume(json: unknown): ResumeParseResult {
  const result = resumeSchema.safeParse(json);
  if (result.success) {
    return { ok: true, resume: result.data as Resume };
  }
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message
    }))
  };
}
