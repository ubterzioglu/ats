import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { detectEuropass } from "@/lib/scoring/europass";
import { scoreStructure } from "@/lib/scoring/structure";

import { DE_CV, STRONG_CV, TR_CV } from "./fixtures";

/**
 * J.7: the Europass template is recognised by its brand word or by the
 * section labels it prints in every language, and the report warns about the
 * layout instead of silently scoring its parsing damage.
 */

const EUROPASS_EN = `Curriculum Vitae

Personal information
Jane Doe
Address: 12 Example Street, Berlin
Email: jane@example.com
Phone: +49 30 1234567

Work experience
QA Engineer, Beispiel GmbH
03/2017 - 12/2020
- Automated the regression suite and kept it green

Education and training
BSc Computer Engineering
09/2011 - 06/2015

Personal skills
Mother tongue(s): German
Other language(s): English C1, Turkish C1
Digital skills
- Playwright, Selenium, SQL
Self-assessment
- Reliable team member
Communication skills
- Good presenter
Driving licence
- Class B
`;

const EUROPASS_TR = `Özgeçmiş

Kişisel Bilgiler
Ad Soyad: Ayşe Yılmaz
E-posta: ayse@example.com
Telefon: +90 532 000 00 00

Kişisel Beceriler
Ana Diller: Türkçe
Dijital Yetkinlikler
- Playwright, Selenium, SQL
Öz Değerlendirme
- Güvenilir ekip üyesi
Sürücü Belgesi
- B sınıfı
`;

function idsOf(cv: string): string[] {
  return scoreStructure(buildContext(cv)).findings.map((finding) => finding.id);
}

describe("detectEuropass", () => {
  it("detects the English template by its labels alone", () => {
    const report = detectEuropass(buildContext(EUROPASS_EN));
    expect(report.detected).toBe(true);
    expect(report.branded).toBe(false);
    expect(report.markerCount).toBeGreaterThanOrEqual(5);
  });

  it("detects the Turkish template by its labels alone", () => {
    const report = detectEuropass(buildContext(EUROPASS_TR));
    expect(report.detected).toBe(true);
    expect(report.markerCount).toBeGreaterThanOrEqual(4);
  });

  it("detects the brand word on its own", () => {
    const report = detectEuropass(buildContext(`${STRONG_CV}\nCreated with Europass\n`));
    expect(report.detected).toBe(true);
    expect(report.branded).toBe(true);
  });

  it("does not flag ordinary CVs, including a single stray marker", () => {
    for (const cv of [STRONG_CV, DE_CV, TR_CV]) {
      expect(detectEuropass(buildContext(cv)).detected).toBe(false);
    }
    // DE_CV and TR_CV name a mother tongue - one marker is not a template.
    expect(detectEuropass(buildContext(DE_CV)).markerCount).toBeLessThanOrEqual(1);
  });
});

describe("structure.europass", () => {
  it("warns with evidence and a cost", () => {
    const outcome = scoreStructure(buildContext(EUROPASS_EN));
    const finding = outcome.findings.find((entry) => entry.id === "structure.europass");
    expect(finding).toBeDefined();
    expect(finding?.cost).toBe(2);
    expect(finding?.evidence?.length ?? 0).toBeGreaterThan(0);
  });

  it("stays out of clean documents", () => {
    for (const cv of [STRONG_CV, DE_CV, TR_CV]) {
      expect(idsOf(cv)).not.toContain("structure.europass");
    }
  });

  it("still maps the template's headings onto sections", () => {
    const sections = buildContext(EUROPASS_EN).sections.map((section) => section.id);
    expect(sections).toContain("experience");
    expect(sections).toContain("skills");
    const tr = buildContext(EUROPASS_TR).sections.map((section) => section.id);
    expect(tr).toContain("skills");
  });

  it("keeps the score explainable end to end", () => {
    const result = analyzeCv({ cvText: EUROPASS_EN });
    const structure = result.dimensions.find((dimension) => dimension.id === "structure");
    const cost = result.findings
      .filter((finding) => finding.dimension === "structure")
      .reduce((sum, finding) => sum + finding.cost, 0);
    expect(structure?.score).toBe(Math.max(0, (structure?.max ?? 0) - cost));
  });
});
