import { describe, expect, it } from "vitest";

import {
  detectPlatform,
  extractJobFromDom,
  type DocumentLike
} from "@/lib/extension/extract-job";

function createMockDoc(elements: Record<string, string>, title?: string): DocumentLike {
  return {
    title,
    querySelector(selector: string) {
      const match = elements[selector];
      if (match !== undefined) {
        return { textContent: match };
      }
      return null;
    }
  };
}

describe("extractJobFromDom", () => {
  it("detects supported job board platforms correctly", () => {
    expect(detectPlatform("https://www.linkedin.com/jobs/view/123456")).toBe("linkedin");
    expect(detectPlatform("https://de.indeed.com/viewjob?jk=abc789")).toBe("indeed");
    expect(detectPlatform("https://www.kariyer.net/is-ilani/yazilim-uzmani-34567")).toBe("kariyer");
    expect(detectPlatform("https://www.stepstone.de/stellenangebote--Frontend-Developer--123.html")).toBe("stepstone");
    expect(detectPlatform("https://careers.google.com/jobs/results/123")).toBe("generic");
  });

  it("extracts LinkedIn job details from DOM", () => {
    const mockDoc = createMockDoc({
      "h1.job-details-jobs-unified-top-card__job-title": "Senior Frontend Engineer",
      "a.job-details-jobs-unified-top-card__company-name": "Acme Corp",
      "#job-details": "We are looking for a Senior Frontend Engineer proficient in React and TypeScript."
    });

    const result = extractJobFromDom(
      mockDoc,
      "https://www.linkedin.com/jobs/view/999888"
    );

    expect(result.platform).toBe("linkedin");
    expect(result.title).toBe("Senior Frontend Engineer");
    expect(result.company).toBe("Acme Corp");
    expect(result.text).toContain("proficient in React and TypeScript");
    expect(result.wordCount).toBeGreaterThan(5);
  });

  it("extracts Indeed job details and detects target ATS if referenced in description", () => {
    const mockDoc = createMockDoc({
      "h1[data-testid='jobsearch-JobInfoHeader-title']": "DevOps Engineer",
      "[data-testid='inlineHeader-companyName']": "CloudTech",
      "#jobDescriptionText": "Apply via our Workday portal at https://cloudtech.myworkdayjobs.com/careers."
    });

    const result = extractJobFromDom(
      mockDoc,
      "https://www.indeed.com/viewjob?jk=12345"
    );

    expect(result.platform).toBe("indeed");
    expect(result.title).toBe("DevOps Engineer");
    expect(result.company).toBe("CloudTech");
    expect(result.targetAts).toBe("Workday");
  });

  it("extracts Kariyer.net job details from DOM", () => {
    const mockDoc = createMockDoc({
      "h1.job-detail-title": "Full Stack Geliştirici",
      ".company-name": "Teknoloji A.Ş.",
      "#job-description": "Next.js ve Node.js tecrübesi olan takım arkadaşları arıyoruz."
    });

    const result = extractJobFromDom(
      mockDoc,
      "https://www.kariyer.net/is-ilani/full-stack-gelistirici-1234"
    );

    expect(result.platform).toBe("kariyer");
    expect(result.title).toBe("Full Stack Geliştirici");
    expect(result.company).toBe("Teknoloji A.Ş.");
    expect(result.text).toContain("Next.js ve Node.js");
  });

  it("extracts StepStone job details from DOM", () => {
    const mockDoc = createMockDoc({
      "[data-at='header-job-title']": "Softwareentwickler (m/w/d)",
      "[data-at='header-company-name']": "Muster GmbH",
      "[data-genesis-element='JOB_DESCRIPTION']": "Gesucht wird ein erfahrener Entwickler für moderne Webanwendungen."
    });

    const result = extractJobFromDom(
      mockDoc,
      "https://www.stepstone.de/stellenangebote--Softwareentwickler-Muster-GmbH--123.html"
    );

    expect(result.platform).toBe("stepstone");
    expect(result.title).toBe("Softwareentwickler (m/w/d)");
    expect(result.company).toBe("Muster GmbH");
    expect(result.text).toContain("Gesucht wird ein erfahrener Entwickler");
  });

  it("falls back to generic article extraction on custom company career sites", () => {
    const mockDoc = createMockDoc(
      {
        "h1": "Principal Architect",
        "article": "We are seeking a Principal Architect with 10+ years experience in distributed systems."
      },
      "Principal Architect - Future Corp Careers"
    );

    const result = extractJobFromDom(
      mockDoc,
      "https://futurecorp.com/careers/arch-1"
    );

    expect(result.platform).toBe("generic");
    expect(result.title).toBe("Principal Architect");
    expect(result.text).toContain("Principal Architect with 10+ years");
  });
});
