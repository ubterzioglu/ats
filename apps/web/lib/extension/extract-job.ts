import { detectAts } from "@/lib/scoring/ats-detect";

export type JobBoardPlatform =
  | "linkedin"
  | "indeed"
  | "kariyer"
  | "stepstone"
  | "generic";

export interface ExtractedJobData {
  readonly title: string;
  readonly company: string;
  readonly text: string;
  readonly platform: JobBoardPlatform;
  readonly url: string;
  readonly targetAts?: string;
  readonly wordCount: number;
}

export interface DomElementLike {
  readonly textContent: string | null;
}

export interface DocumentLike {
  querySelector(selector: string): DomElementLike | null;
  querySelectorAll?(selector: string): ArrayLike<DomElementLike>;
  readonly title?: string;
}

function cleanText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function extractFirstMatch(doc: DocumentLike, selectors: readonly string[]): string {
  for (const selector of selectors) {
    try {
      const el = doc.querySelector(selector);
      if (el?.textContent && el.textContent.trim().length > 0) {
        return cleanText(el.textContent);
      }
    } catch {
      // Continue to next selector if unsupported selector syntax
    }
  }
  return "";
}

export function detectPlatform(url: string): JobBoardPlatform {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin";
  if (lower.includes("indeed.com")) return "indeed";
  if (lower.includes("kariyer.net")) return "kariyer";
  if (lower.includes("stepstone.de") || lower.includes("stepstone.com")) return "stepstone";
  return "generic";
}

const LINKEDIN_TITLE_SELECTORS = [
  "h1.job-details-jobs-unified-top-card__job-title",
  ".jobs-unified-top-card__job-title",
  ".top-card-layout__title",
  "h1.topcard__title",
  "h1"
] as const;

const LINKEDIN_COMPANY_SELECTORS = [
  "a.job-details-jobs-unified-top-card__company-name",
  ".jobs-unified-top-card__company-name",
  ".topcard__flavor--black-link",
  ".top-card-layout__first-subline a",
  ".top-card-layout__first-subline"
] as const;

const LINKEDIN_DESC_SELECTORS = [
  "#job-details",
  ".jobs-description__content",
  ".jobs-box__html-content",
  ".show-more-less-html__markup",
  ".description__text"
] as const;

const INDEED_TITLE_SELECTORS = [
  "h1[data-testid='jobsearch-JobInfoHeader-title']",
  ".jobsearch-JobInfoHeader-title",
  "h1.jobTitle",
  "h1"
] as const;

const INDEED_COMPANY_SELECTORS = [
  "[data-testid='inlineHeader-companyName']",
  ".jobsearch-CompanyInfoContainer",
  "[data-testid='jobsearch-CompanyInfoContainer']",
  ".jobsearch-InlineCompanyRating"
] as const;

const INDEED_DESC_SELECTORS = [
  "#jobDescriptionText",
  ".jobsearch-JobComponent-description",
  "#jobDescription"
] as const;

const KARIYER_TITLE_SELECTORS = [
  "h1.job-detail-title",
  ".job-title",
  "h1[data-test='job-title']",
  "h1"
] as const;

const KARIYER_COMPANY_SELECTORS = [
  ".company-name",
  "a[data-test='company-title']",
  ".company-title"
] as const;

const KARIYER_DESC_SELECTORS = [
  "#job-description",
  ".job-detail-content",
  ".job-detail"
] as const;

const STEPSTONE_TITLE_SELECTORS = [
  "[data-at='header-job-title']",
  "h1[data-genesis-element='HEADER_TITLE']",
  "h1.listing-title",
  "h1"
] as const;

const STEPSTONE_COMPANY_SELECTORS = [
  "[data-at='header-company-name']",
  "[data-genesis-element='HEADER_COMPANY']",
  ".listing-header-company"
] as const;

const STEPSTONE_DESC_SELECTORS = [
  "[data-genesis-element='JOB_DESCRIPTION']",
  ".listing-content",
  "[data-at='job-description']"
] as const;

const GENERIC_TITLE_SELECTORS = [
  "h1",
  "h2",
  "header h1"
] as const;

const GENERIC_DESC_SELECTORS = [
  "article",
  "main",
  "[role='main']",
  ".job-description",
  ".jobDescription",
  ".vacancy-desc",
  "body"
] as const;

export function extractJobFromDom(doc: DocumentLike, url: string): ExtractedJobData {
  const platform = detectPlatform(url);
  let title = "";
  let company = "";
  let text = "";

  switch (platform) {
    case "linkedin":
      title = extractFirstMatch(doc, LINKEDIN_TITLE_SELECTORS);
      company = extractFirstMatch(doc, LINKEDIN_COMPANY_SELECTORS);
      text = extractFirstMatch(doc, LINKEDIN_DESC_SELECTORS);
      break;
    case "indeed":
      title = extractFirstMatch(doc, INDEED_TITLE_SELECTORS);
      company = extractFirstMatch(doc, INDEED_COMPANY_SELECTORS);
      text = extractFirstMatch(doc, INDEED_DESC_SELECTORS);
      break;
    case "kariyer":
      title = extractFirstMatch(doc, KARIYER_TITLE_SELECTORS);
      company = extractFirstMatch(doc, KARIYER_COMPANY_SELECTORS);
      text = extractFirstMatch(doc, KARIYER_DESC_SELECTORS);
      break;
    case "stepstone":
      title = extractFirstMatch(doc, STEPSTONE_TITLE_SELECTORS);
      company = extractFirstMatch(doc, STEPSTONE_COMPANY_SELECTORS);
      text = extractFirstMatch(doc, STEPSTONE_DESC_SELECTORS);
      break;
    case "generic":
      title = extractFirstMatch(doc, GENERIC_TITLE_SELECTORS);
      text = extractFirstMatch(doc, GENERIC_DESC_SELECTORS);
      break;
  }

  // Fallbacks if specific selectors yielded empty results
  if (!title && doc.title) {
    title = cleanText(doc.title.split(/[-|–]/)[0] ?? doc.title);
  }
  if (!text) {
    text = extractFirstMatch(doc, GENERIC_DESC_SELECTORS);
  }

  const detectedAts = detectAts(url) ?? detectAts(text);
  const words = text.split(/\s+/).filter(Boolean).length;

  return {
    title: title || "Job Posting",
    company: company || "Company",
    text,
    platform,
    url,
    targetAts: detectedAts?.name,
    wordCount: words
  };
}
