import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { TOO_LITTLE_TEXT_WORDS, TOO_SHORT_WORDS, THIN_TEXT_WORDS } from "@/lib/scoring/config";
import type { AnalysisResult } from "@/types/analysis";

import { DE_CV, DE_JOB_AD, JOB_AD, STRONG_CV, TR_CV, TR_JOB_AD, WEAK_CV } from "./fixtures";

/**
 * A7: no single finding wipes out a dimension on a realistic CV, one fact is
 * charged once, and an empty document scores near zero.
 */

function ids(result: AnalysisResult): string[] {
  return result.findings.map((finding) => finding.id);
}

function finding(result: AnalysisResult, id: string) {
  return result.findings.find((entry) => entry.id === id);
}

function dimensionScore(result: AnalysisResult, id: string): number | undefined {
  return result.dimensions.find((dimension) => dimension.id === id)?.score;
}

const TIERED_AD = `Senior Test Automation Engineer

Your tasks
You will own the regression suites of our insurance platform and work with product teams.

Requirements
- Several years with Playwright and TypeScript in production test suites
- Hands-on Docker for local test environments
- Solid SQL for test data checks

Nice to have
- Kubernetes experience
- Terraform for test infrastructure
- Grafana dashboards for test trends`;

const UNTIERED_AD = `Senior Test Automation Engineer

We are looking for an engineer who builds regression suites with Playwright and TypeScript,
runs them in Docker and Kubernetes, checks test data with SQL and keeps dashboards in Grafana.
Terraform for test infrastructure is part of the daily work.`;

const CV_HEAD = `Ayse Yilmaz
ayse@example.com
+49 151 2345678
Berlin, Germany

Experience
QA Engineer, Example GmbH
01/2020 - present`;

const REQUIRED_ONLY_CV = `${CV_HEAD}
- Built Playwright and TypeScript regression suites covering 300 cases.
- Ran the suites in Docker and checked test data with SQL across 12 services.

Education
BSc Computer Science, 2019

Skills
Playwright, TypeScript, Docker, SQL`;

const FULL_MATCH_CV = `${REQUIRED_ONLY_CV}, Kubernetes, Terraform, Grafana
- Provisioned Kubernetes test clusters with Terraform and tracked trends in Grafana.`;

const NO_MATCH_CV = `${CV_HEAD}
- Planned 40 shop-floor shifts and cut overtime by 12%.

Education
BSc Business, 2019`;

describe("keywords.required-coverage and keywords.other-coverage", () => {
  it("prices missing nice-to-haves apart from missing requirements", () => {
    const result = analyzeCv({ cvText: REQUIRED_ONLY_CV, jobDescription: TIERED_AD });
    expect(ids(result)).not.toContain("keywords.required-coverage");
    const other = finding(result, "keywords.other-coverage");
    expect(other).toBeDefined();
    expect(other?.cost ?? 0).toBeLessThanOrEqual(10);
    expect(other?.evidence ?? []).toEqual(expect.arrayContaining(["kubernetes"]));
  });

  it("stays quiet on the required share when every requirement is met", () => {
    const result = analyzeCv({ cvText: FULL_MATCH_CV, jobDescription: TIERED_AD });
    expect(ids(result)).not.toContain("keywords.required-coverage");
    expect(ids(result)).not.toContain("keywords.coverage");
  });

  it("splits a zero match into 15 required and 10 other points", () => {
    const result = analyzeCv({ cvText: NO_MATCH_CV, jobDescription: TIERED_AD });
    expect(finding(result, "keywords.required-coverage")?.cost).toBe(15);
    expect(finding(result, "keywords.other-coverage")?.cost).toBe(10);
    expect(finding(result, "keywords.required-coverage")?.title).toMatch(/required terms/);
  });

  it("scores both shares on the overall coverage when the ad has no requirements heading", () => {
    const result = analyzeCv({ cvText: REQUIRED_ONLY_CV, jobDescription: UNTIERED_AD });
    const required = finding(result, "keywords.required-coverage");
    const other = finding(result, "keywords.other-coverage");
    expect(required?.title).toMatch(/key terms/);
    expect(other?.title).toMatch(/does not separate/);
    // Each share follows one coverage, so the two costs stay proportional.
    expect(Math.abs((required?.cost ?? 0) / 15 - (other?.cost ?? 0) / 10)).toBeLessThan(0.1);
  });

  it("keeps the report coverage as the weighted share of all terms", () => {
    const result = analyzeCv({ cvText: REQUIRED_ONLY_CV, jobDescription: TIERED_AD });
    const total = [...result.keywords.matched, ...result.keywords.missing].reduce(
      (sum, term) => sum + term.weight,
      0
    );
    const matched = result.keywords.matched.reduce((sum, term) => sum + term.weight, 0);
    expect(result.keywords.coverage).toBeCloseTo(matched / total, 2);
  });
});

describe("keywords.thin-skill-inventory", () => {
  it("costs at most 10, so a CV with no known skill keeps half the capped dimension", () => {
    const result = analyzeCv({ cvText: WEAK_CV });
    expect(finding(result, "keywords.thin-skill-inventory")?.cost).toBe(10);
    expect(dimensionScore(result, "keywords")).toBe(10);
  });

  it("does not fire on a CV with a full skill inventory", () => {
    expect(ids(analyzeCv({ cvText: STRONG_CV }))).not.toContain("keywords.thin-skill-inventory");
  });
});

describe("taxonomy beyond software", () => {
  function baselineTerms(cvText: string): string[] {
    const result = analyzeCv({ cvText });
    expect(result.keywords.source).toBe("baseline");
    return result.keywords.matched.map((term) => term.term);
  }

  it("recognises a German finance CV", () => {
    const terms = baselineTerms(`Erfahrung
Leiterin Rechnungswesen, Beispiel AG
- Budgetierung und Forecast für 4 Gesellschaften nach IFRS und HGB
- Kreditorenbuchhaltung und Debitorenbuchhaltung in DATEV
- Kostenrechnung und Einkauf neu aufgesetzt`);
    expect(terms).toEqual(
      expect.arrayContaining([
        "accounting", "budgeting", "forecasting", "ifrs", "hgb", "datev",
        "accounts payable", "accounts receivable", "cost accounting", "procurement"
      ])
    );
  });

  it("recognises a Turkish nursing CV", () => {
    const terms = baselineTerms(`Deneyim
Hemşire, Örnek Hastanesi
- hasta bakımı ve triyaj, yoğun bakım ünitesinde 3 yıl
- ilk yardım ve yara bakımı eğitimleri verdim
- hemşirelik kayıtlarını güncel tuttum`);
    expect(terms).toEqual(
      expect.arrayContaining(["patient care", "triage", "first aid", "wound care", "nursing"])
    );
  });

  it("recognises an English sales CV", () => {
    const terms = baselineTerms(`Experience
Account Executive, Example Ltd
- Owned B2B lead generation and pipeline management in HubSpot CRM
- 112% quota attainment through cold calling and negotiation`);
    expect(terms).toEqual(
      expect.arrayContaining([
        "b2b", "lead generation", "pipeline management", "hubspot", "crm",
        "quota attainment", "cold calling", "negotiation"
      ])
    );
  });

  it("recognises a logistics CV in German and Turkish", () => {
    const de = baselineTerms(`Erfahrung
- Lagerverwaltung und Bestandsmanagement mit einem WMS, Lieferkette Osteuropa
- Zollabfertigung nach Incoterms, Gabelstapler-Schein`);
    expect(de).toEqual(
      expect.arrayContaining([
        "warehouse management", "inventory management", "wms", "supply chain",
        "customs clearance", "incoterms"
      ])
    );

    const tr = baselineTerms(`Deneyim
- tedarik zinciri ve stok yönetimi, satın alma süreçleri
- depo yönetimi ve gümrükleme operasyonları`);
    expect(tr).toEqual(
      expect.arrayContaining([
        "supply chain", "inventory management", "procurement", "warehouse management",
        "customs clearance"
      ])
    );
  });

  it("still keeps ambiguous words out without technical context", () => {
    const terms = baselineTerms(`Experience
- Led the go-live of the new warehouse management rollout in R&D logistics`);
    expect(terms).toContain("warehouse management");
    expect(terms).not.toContain("golang");
    expect(terms).not.toContain("r");
  });

  it("gives a non-software CV a smaller inventory finding than before", () => {
    const result = analyzeCv({
      cvText: `Experience
- Budgeting, forecasting and financial reporting under IFRS and US GAAP
- Accounts payable, accounts receivable and audit preparation in DATEV`
    });
    expect(finding(result, "keywords.thin-skill-inventory")?.cost ?? 0).toBeLessThan(10);
  });
});

describe("impact.nothing-to-measure", () => {
  it("fires on an empty document", () => {
    expect(ids(analyzeCv({ cvText: "" }))).toContain("impact.nothing-to-measure");
  });

  it("fires on prose with no bullets and no experience section", () => {
    expect(ids(analyzeCv({ cvText: WEAK_CV }))).toContain("impact.nothing-to-measure");
  });

  it("does not fire on a CV whose bullets are merely few", () => {
    const result = analyzeCv({
      cvText: `${CV_HEAD}
- Built a regression suite of 300 cases.
- Cut the release cycle from 3 days to 4 hours.`
    });
    expect(ids(result)).not.toContain("impact.nothing-to-measure");
  });

  it("does not fire on an experience section written without bullets", () => {
    const result = analyzeCv({
      cvText: `${CV_HEAD}
Built the regression suite and ran it in the nightly pipeline.
Moved the team from manual checks to automated ones.`
    });
    expect(ids(result)).not.toContain("impact.nothing-to-measure");
  });

  it("does not fire on a full CV", () => {
    expect(ids(analyzeCv({ cvText: STRONG_CV }))).not.toContain("impact.nothing-to-measure");
  });
});

describe("thin documents are charged once", () => {
  function padTo(words: number): string {
    const base = analyzeCv({ cvText: STRONG_CV }).stats.words;
    const extra = words - base;
    expect(extra).toBeGreaterThan(0);
    return `${STRONG_CV}\nInterests\n${Array.from({ length: extra }, () => "reading").join(" ")}`;
  }

  it("leaves the thin band to parse.thin-text", () => {
    const result = analyzeCv({ cvText: STRONG_CV });
    expect(result.stats.words).toBeGreaterThanOrEqual(TOO_LITTLE_TEXT_WORDS);
    expect(result.stats.words).toBeLessThan(THIN_TEXT_WORDS);
    expect(ids(result)).toContain("parse.thin-text");
    expect(ids(result)).not.toContain("structure.too-short");
  });

  it("names a short but readable CV in structure only", () => {
    const result = analyzeCv({ cvText: padTo(THIN_TEXT_WORDS + 5) });
    expect(result.stats.words).toBeLessThan(TOO_SHORT_WORDS);
    expect(ids(result)).toContain("structure.too-short");
    expect(ids(result)).not.toContain("parse.thin-text");
  });

  it("charges neither once the CV is long enough", () => {
    const result = analyzeCv({ cvText: padTo(TOO_SHORT_WORDS + 5) });
    expect(ids(result)).not.toContain("structure.too-short");
    expect(ids(result)).not.toContain("parse.thin-text");
  });

  it("scales parse.too-little-text with how little text was read", () => {
    const empty = finding(analyzeCv({ cvText: "" }), "parse.too-little-text");
    const weak = finding(analyzeCv({ cvText: WEAK_CV }), "parse.too-little-text");
    expect(empty?.cost).toBe(25);
    expect(weak?.cost ?? 0).toBeGreaterThanOrEqual(13);
    expect(weak?.cost ?? 0).toBeLessThan(25);
  });
});

describe("score = max - sum(cost) over every fixture", () => {
  const cases: ReadonlyArray<readonly [string, string, string | undefined]> = [
    ["strong", STRONG_CV, undefined],
    ["strong + ad", STRONG_CV, JOB_AD],
    ["weak", WEAK_CV, undefined],
    ["weak + ad", WEAK_CV, JOB_AD],
    ["turkish", TR_CV, undefined],
    ["turkish + ad", TR_CV, TR_JOB_AD],
    ["german", DE_CV, undefined],
    ["german + ad", DE_CV, DE_JOB_AD],
    ["required only + tiered ad", REQUIRED_ONLY_CV, TIERED_AD],
    ["no match + tiered ad", NO_MATCH_CV, TIERED_AD],
    ["empty", "", undefined]
  ];

  it.each(cases)("%s", (_name, cvText, jobDescription) => {
    const result = analyzeCv({ cvText, jobDescription });
    for (const dimension of result.dimensions) {
      const cost = result.findings
        .filter((entry) => entry.dimension === dimension.id)
        .reduce((total, entry) => total + entry.cost, 0);
      expect(dimension.score).toBe(Math.max(0, dimension.max - cost));
    }
    expect(result.total).toBe(result.dimensions.reduce((sum, dimension) => sum + dimension.score, 0));
  });
});
