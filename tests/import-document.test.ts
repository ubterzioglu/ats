import { describe, expect, it } from "vitest";

import { importResumeFromDocument, importResumeFromText } from "@/lib/resume/import-document";
import { parseResume } from "@/lib/resume/schema";
import { normalizeDocument } from "@/lib/scoring/text";

import { DE_CV, STRONG_CV, TR_CV } from "./fixtures";
import { LOOP_RESUME_EN, LOOP_RESUME_TR } from "./fixtures/resumes";
// Side-effect import: headless pdfjs globals before the first extraction.
import "./helpers/pdfjs-node";
import { renderAndExtractTemplate } from "./helpers/pdf-templates";

/**
 * E.9: an existing CV becomes the canonical model, and the acceptance is not
 * negotiable - unextractable fields are flagged, never invented. Two
 * invariants are enforced mechanically: every extracted string is a verbatim
 * slice of the source document (dates excepted, which the engine normalises
 * to YYYY-MM), and every heuristic split carries a needs-review flag the
 * editor turns into "check this".
 */

const strong = importResumeFromText(STRONG_CV, "strong.txt");
const tr = importResumeFromText(TR_CV, "tr.txt");
const de = importResumeFromText(DE_CV, "de.txt");

function walkStrings(
  value: unknown,
  path: string,
  visit: (path: string, text: string) => void
): void {
  if (typeof value === "string") {
    visit(path, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkStrings(entry, `${path}.${index}`, visit));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      walkStrings(entry, path === "" ? key : `${path}.${key}`, visit);
    }
  }
}

const DATE_PATH_RX = /\.(startDate|endDate|date|releaseDate|lastModified)$/;

describe("the no-invention invariant", () => {
  it.each([
    ["english", STRONG_CV, strong],
    ["turkish", TR_CV, tr],
    ["german", DE_CV, de]
  ] as const)("every %s string is a verbatim slice of the document", (_name, source, imported) => {
    const haystack = normalizeDocument(source);
    const offenders: string[] = [];
    walkStrings(imported.resume, "", (path, text) => {
      if (DATE_PATH_RX.test(path)) return;
      if (path.endsWith(".network")) return; // "LinkedIn" is derived from the URL's domain
      if (!haystack.includes(text)) offenders.push(`${path}: "${text}"`);
    });
    expect(offenders).toEqual([]);
  });

  it("reports what it could not extract instead of guessing", () => {
    const missingPaths = strong.issues
      .filter((issue) => issue.status === "missing")
      .map((issue) => issue.path);
    for (const section of ["awards", "publications", "volunteer", "interests", "references", "projects"]) {
      expect(missingPaths).toContain(section);
    }
  });

  it("flags a section it found but does not parse", () => {
    const certifications = strong.issues.find((issue) => issue.path === "certifications");
    expect(certifications?.status).toBe("needs-review");
  });
});

describe("basics extraction", () => {
  it("lifts name, email, phone and the profile link", () => {
    expect(strong.resume.basics?.name).toBe("Umut Baris Terzioglu");
    expect(strong.resume.basics?.email).toBe("umut@example.com");
    expect(strong.resume.basics?.phone).toBe("+49 151 2345678");
    expect(strong.resume.basics?.profiles?.[0]?.url).toBe("linkedin.com/in/example");
  });

  it("reads the headline and the city, and flags both as heuristics", () => {
    expect(strong.resume.basics?.label).toBe("Senior QA Automation Engineer");
    expect(strong.resume.basics?.location?.city).toBe("Berlin");
    expect(strong.reviewPaths).toContain("basics.label");
    expect(strong.reviewPaths).toContain("basics.location.city");
  });

  it("keeps the summary verbatim", () => {
    expect(strong.resume.basics?.summary).toContain("9 years in regression and API test automation");
  });
});

describe("entries extraction", () => {
  it("pairs role lines with engine-read dates", () => {
    const work = strong.resume.work ?? [];
    expect(work).toHaveLength(2);
    expect(work[0]?.position).toBe("Senior QA Automation Engineer");
    expect(work[0]?.name).toBe("Adesso SE");
    expect(work[0]?.startDate).toBe("2021-01");
    expect(work[0]?.endDate).toBe("");
    expect(work[1]?.startDate).toBe("2017-03");
    expect(work[1]?.endDate).toBe("2020-12");
    expect(strong.reviewPaths).toContain("work.0.position");
    expect(strong.reviewPaths).toContain("work.0.name");
  });

  it("keeps highlights as the bullets were written", () => {
    const highlights = strong.resume.work?.[0]?.highlights ?? [];
    expect(highlights).toHaveLength(4);
    expect(highlights[0]).toContain("Built a Playwright and TypeScript regression suite");
  });

  it("splits the education line into institution, qualification and field", () => {
    const education = strong.resume.education?.[0];
    expect(education?.institution).toBe("Istanbul Technical University");
    expect(education?.studyType).toBe("BSc");
    expect(education?.area).toBe("Computer Engineering");
    expect(education?.startDate).toBe("2011-09");
    expect(education?.endDate).toBe("2015-06");
  });

  it("collects skills and languages", () => {
    const keywords = strong.resume.skills?.[0]?.keywords ?? [];
    expect(keywords).toContain("Playwright");
    expect(keywords).toContain("REST Assured");
    expect(strong.resume.languages?.[0]).toEqual({ language: "Turkish", fluency: "native" });
  });

  it("reads Turkish and German open-ended roles through the engine", () => {
    expect(tr.resume.work?.[0]?.endDate).toBe("");
    expect(tr.resume.work?.[0]?.position).toBe("Kıdemli Test Otomasyon Mühendisi");
    expect(tr.resume.education?.[0]?.institution).toBe("İstanbul Teknik Üniversitesi");
    expect(de.resume.work?.[0]?.endDate).toBe("");
    expect(de.resume.work?.[0]?.name).toBe("Adesso SE");
  });
});

describe("degradation", () => {
  it("returns an empty model and honest issues for unreadable input", () => {
    const empty = importResumeFromText("...");
    expect(empty.resume).toEqual({});
    const missingPaths = empty.issues
      .filter((issue) => issue.status === "missing")
      .map((issue) => issue.path);
    expect(missingPaths).toContain("basics.email");
    expect(missingPaths).toContain("basics.name");
    expect(missingPaths).toContain("work");
    expect(empty.reviewPaths).toEqual([]);
  });
});

const rendered = await renderAndExtractTemplate(parseResume(LOOP_RESUME_EN), "dense");
const reimported = importResumeFromText(rendered.text, "cv-dense.pdf");

describe("re-importing our own exports", () => {
  const imported = reimported;

  it("reads the template's contact block", () => {
    expect(imported.resume.basics?.email).toBe("umut@example.com");
    expect(imported.resume.basics?.phone).toBe("+49 151 2345678");
    expect(imported.resume.basics?.url).toBe("https://example.com");
  });

  it("reads the template's year-first dates through the engine", () => {
    const work = imported.resume.work ?? [];
    expect(work.length).toBeGreaterThanOrEqual(2);
    expect(work[0]?.startDate).toBe("2021-01");
    expect(work[0]?.endDate).toBe("");
    expect(work[1]?.startDate).toBe("2017-03");
    expect(work[1]?.endDate).toBe("2020-12");
  });

  it("reads role, employer, highlights and education back", () => {
    expect(imported.resume.work?.[0]?.position).toBe("Senior QA Automation Engineer");
    expect(imported.resume.work?.[0]?.name).toBe("Adesso SE");
    expect(imported.resume.work?.[0]?.highlights?.[0]).toContain("Built a Playwright");
    expect(imported.resume.education?.[0]?.institution).toBe("Istanbul Technical University");
    expect(imported.resume.skills?.[0]?.keywords).toContain("Playwright");
    expect(imported.resume.languages?.map((entry) => entry.language)).toContain("Turkish");
  });

  it("flags the sections the importer does not parse yet", () => {
    const review = imported.issues.filter((issue) => issue.status === "needs-review");
    expect(review.map((issue) => issue.path)).toContain("projects");
  });

  it("carries Turkish glyphs through render, extract and import", async () => {
    const trRendered = await renderAndExtractTemplate(parseResume(LOOP_RESUME_TR), "plain");
    const trImported = importResumeFromText(trRendered.text, "cv-plain.pdf");
    expect(trImported.resume.basics?.name).toBe("Umut Barış Terzioğlu");
    expect(trImported.resume.work?.[0]?.position).toBe("Kıdemli Test Otomasyon Mühendisi");
    expect(trImported.resume.work?.[0]?.endDate).toBe("");
    expect(trImported.resume.education?.[0]?.institution).toBe("İstanbul Teknik Üniversitesi");
  });

  it("imports a rendered PDF through the file path", async () => {
    const file = new File([rendered.bytes], "cv-dense.pdf", { type: "application/pdf" });
    const importedFile = await importResumeFromDocument(file);
    expect(importedFile.sourceName).toBe("cv-dense.pdf");
    expect(importedFile.resume.basics?.email).toBe("umut@example.com");
    expect(importedFile.resume.work?.length).toBeGreaterThanOrEqual(2);
  });
});
