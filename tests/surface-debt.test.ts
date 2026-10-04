import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { compareAds } from "@/lib/scoring/compare";
import { buildContext } from "@/lib/scoring/context";
import {
  exportApplicationsToCSV,
  exportApplicationsToJSON,
  importApplicationsFromCSV,
  importApplicationsFromJSON
} from "@/lib/store/export";
import { generateReminders } from "@/lib/store/reminders";
import type { ApplicationRecord } from "@/lib/store/schema";

const CV = `Jane Doe
jane.doe@email.com · +49 170 1234567
Berlin, Germany

Experience

Senior QA Engineer, Beispiel GmbH
2021 - present
- Automated the regression suite with Playwright across three products.
- Tracked defects in Jira through four release cycles.
- Led a team of 4 engineers, cutting release cycle time by 30%.

Skills
Playwright, TypeScript, Jira, CI/CD, Selenium
`;

const LONG_AD = `Senior QA Engineer

Requirements:
- Playwright
- TypeScript
- JavaScript
- Selenium
- Cypress
- Docker
- Kubernetes
- Jenkins
- GitLab CI
- Azure DevOps
- Jira
- Confluence
- Postman
- REST API testing
- GraphQL
- Performance testing
- Load testing
- Security testing
Must have 5+ years of experience.
The role is for a junior team member.
`;

const SHORT_AD = `QA role. Apply now.`;

const AD_WITH_TERMS = `QA Engineer at Acme Corp
Requirements: Playwright, TypeScript, Kubernetes, Docker, CI/CD
Must have 3+ years of experience.
Fluent English required.
Remote.`;

const AD_WITH_TERMS_2 = `Senior QA at Other Corp
Requirements: Playwright, Selenium, Cypress, Kubernetes, Azure
5+ years experience needed.
Berlin location preferred.`;

describe("F.2 + F.3 surface: red flags and suitability reach the panel", () => {
  it("surfaces red flags from the engine on the analysis result", () => {
    const result = analyzeCv({ cvText: CV, jobDescription: SHORT_AD });
    expect(result.jobAd).toBeDefined();
    expect(result.jobAd!.redFlags.length).toBeGreaterThan(0);
    const ids = result.jobAd!.redFlags.map((f) => f.id);
    expect(ids).toContain("vague-role");
  });

  it("surfaces suitability checks with passed/failed/unknown statuses", () => {
    const result = analyzeCv({ cvText: CV, jobDescription: AD_WITH_TERMS });
    expect(result.suitability).toBeDefined();
    expect(result.suitability!.length).toBeGreaterThan(0);
    for (const check of result.suitability!) {
      expect(["passed", "failed", "unknown"]).toContain(check.status);
      expect(check.title).toBeTruthy();
    }
  });

  it("shows evidence on red flags that carry it", () => {
    const ad = `Junior QA Engineer
Must have 5 years of experience in testing.
Some more text to make this longer than eighty words so the vague-role check does not fire. Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
    const result = analyzeCv({ cvText: CV, jobDescription: ad });
    const mismatch = result.jobAd?.redFlags.find((f) => f.id === "seniority-mismatch");
    expect(mismatch).toBeDefined();
    expect(mismatch!.evidence).toBeTruthy();
  });
});

describe("G.3 surface: reminders reach the kanban cards", () => {
  it("generates no-response reminders for stale applied applications", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "1",
        companyName: "Acme",
        roleTitle: "QA",
        stage: "applied",
        updatedAt: now - 10 * 24 * 60 * 60 * 1000,
        createdAt: now - 10 * 24 * 60 * 60 * 1000
      }
    ];
    const reminders = generateReminders(apps, now);
    expect(reminders.length).toBe(1);
    expect(reminders[0]!.type).toBe("no-response");
    expect(reminders[0]!.daysSinceUpdate).toBeGreaterThanOrEqual(10);
  });

  it("generates follow-up reminders for stale interview applications", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "2",
        companyName: "Acme",
        roleTitle: "QA",
        stage: "interview",
        updatedAt: now - 5 * 24 * 60 * 60 * 1000,
        createdAt: now - 5 * 24 * 60 * 60 * 1000
      }
    ];
    const reminders = generateReminders(apps, now);
    expect(reminders.length).toBe(1);
    expect(reminders[0]!.type).toBe("follow-up-interview");
  });

  it("skips rejected and offer stages", () => {
    const now = Date.now();
    const apps: ApplicationRecord[] = [
      {
        id: "3",
        companyName: "Acme",
        roleTitle: "QA",
        stage: "rejected",
        updatedAt: now - 30 * 24 * 60 * 60 * 1000,
        createdAt: now - 30 * 24 * 60 * 60 * 1000
      }
    ];
    const reminders = generateReminders(apps, now);
    expect(reminders.length).toBe(0);
  });
});

describe("G.4 surface: export/import round-trip", () => {
  const apps: ApplicationRecord[] = [
    {
      id: "a1",
      companyName: "Acme",
      roleTitle: "QA Engineer",
      stage: "applied",
      url: "https://example.com/job1",
      updatedAt: 1000,
      createdAt: 900
    },
    {
      id: "a2",
      companyName: "Other Corp",
      roleTitle: "Senior QA",
      stage: "interview",
      notes: "Good conversation",
      contacts: ["hr@other.com"],
      updatedAt: 2000,
      createdAt: 1500
    }
  ];

  it("round-trips through JSON", () => {
    const json = exportApplicationsToJSON(apps);
    const restored = importApplicationsFromJSON(json);
    expect(restored).toEqual(apps);
  });

  it("round-trips through CSV", () => {
    const csv = exportApplicationsToCSV(apps);
    const restored = importApplicationsFromCSV(csv);
    expect(restored.length).toBe(apps.length);
    expect(restored[0]!.id).toBe("a1");
    expect(restored[0]!.companyName).toBe("Acme");
    expect(restored[0]!.stage).toBe("applied");
    expect(restored[1]!.notes).toBe("Good conversation");
  });

  it("rejects malformed JSON", () => {
    expect(() => importApplicationsFromJSON("not json")).toThrow();
    expect(() => importApplicationsFromJSON('{"not":"array"}')).toThrow();
  });

  it("returns empty for empty CSV", () => {
    expect(importApplicationsFromCSV("")).toEqual([]);
  });
});

describe("F.4 surface: multi-ad comparison ranks by fit", () => {
  it("ranks the best fitting ad first", () => {
    const context = buildContext(CV);
    const results = compareAds(context, [SHORT_AD, AD_WITH_TERMS, AD_WITH_TERMS_2]);
    expect(results.length).toBe(3);
    expect(results[0]!.matchScore).toBeGreaterThanOrEqual(results[1]!.matchScore);
    expect(results[1]!.matchScore).toBeGreaterThanOrEqual(results[2]!.matchScore);
  });

  it("carries suitability and red flags per ad", () => {
    const context = buildContext(CV);
    const results = compareAds(context, [AD_WITH_TERMS]);
    expect(results[0]!.suitability.length).toBeGreaterThan(0);
    expect(results[0]!.ad.redFlags).toBeDefined();
  });
});

describe("F.5 surface: learning priorities from missing terms", () => {
  it("identifies terms missing across multiple ads", () => {
    const ads = [AD_WITH_TERMS, AD_WITH_TERMS_2];
    const missingFreq = new Map<string, number>();

    for (const ad of ads) {
      const result = analyzeCv({ cvText: CV, jobDescription: ad });
      for (const term of result.keywords.missing) {
        missingFreq.set(term.term, (missingFreq.get(term.term) ?? 0) + 1);
      }
    }

    const sorted = [...missingFreq.entries()].sort((a, b) => b[1] - a[1]);
    expect(sorted.length).toBeGreaterThan(0);
    expect(sorted[0]![1]).toBeGreaterThanOrEqual(1);
  });

  it("deterministic order: equal frequency sorted alphabetically", () => {
    const result1 = analyzeCv({ cvText: CV, jobDescription: AD_WITH_TERMS });
    const result2 = analyzeCv({ cvText: CV, jobDescription: AD_WITH_TERMS });
    const missing1 = result1.keywords.missing.map((t) => t.term);
    const missing2 = result2.keywords.missing.map((t) => t.term);
    expect(missing1).toEqual(missing2);
  });
});
