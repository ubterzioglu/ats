import { describe, expect, it } from "vitest";

import { analyzeCv } from "@/lib/scoring";
import { buildContext } from "@/lib/scoring/context";
import { detectPersonalFields } from "@/lib/scoring/market";

import { DE_CV, JOB_AD, STRONG_CV, TR_CV, TR_JOB_AD } from "./fixtures";

/**
 * J.6: the same personal-data block is a defect in one market and an
 * expectation in another. The finding must follow the selected market, and
 * absence must never cost points - only presence in a market that reads it as
 * a mistake does.
 */

const TR_PERSONAL_CV = TR_CV.replace(
  "linkedin.com/in/example",
  `linkedin.com/in/example
Doğum Tarihi: 12.05.1990
Medeni Durum: Evli
Askerlik: Tamamlandı
Fotoğraf: vesikalık eklendi`
);

const DE_PERSONAL_CV = DE_CV.replace(
  "linkedin.com/in/example",
  `linkedin.com/in/example
Geburtsdatum: 12.05.1990
Familienstand: verheiratet
Wehrdienst: geleistet`
);

function idsWithCost(cv: string, market?: "en" | "de" | "tr"): Map<string, number> {
  const result = analyzeCv({ cvText: cv, ...(market ? { market } : {}) });
  return new Map(
    result.findings
      .filter((finding) => finding.dimension === "contact")
      .map((finding) => [finding.id, finding.cost])
  );
}

describe("detectPersonalFields", () => {
  it("finds all four fields in a Turkish personal-data block", () => {
    const fields = detectPersonalFields(buildContext(TR_PERSONAL_CV).lines).map(
      (match) => match.field
    );
    expect(new Set(fields)).toEqual(
      new Set(["photo", "date-of-birth", "marital-status", "military-service"])
    );
  });

  it("finds nothing in a CV without a personal-data block", () => {
    expect(detectPersonalFields(buildContext(STRONG_CV).lines)).toEqual([]);
    expect(detectPersonalFields(buildContext(TR_CV).lines)).toEqual([]);
  });
});

describe("market-based advice", () => {
  it("bundles the personal data as one defect for the English market", () => {
    const costs = idsWithCost(TR_PERSONAL_CV, "en");
    expect(costs.get("contact.market-personal-data")).toBe(2);
  });

  it("accepts the same block for the Turkish market", () => {
    const costs = idsWithCost(TR_PERSONAL_CV, "tr");
    expect(costs.has("contact.market-personal-data")).toBe(false);
    expect(costs.has("contact.market-expectations")).toBe(false);
  });

  it("flags only the military line for the German market", () => {
    const costs = idsWithCost(DE_PERSONAL_CV, "de");
    expect(costs.has("contact.market-personal-data")).toBe(false);
    expect(costs.get("contact.market-military-service")).toBe(1);
  });

  it("flags the German block as a whole for the English market", () => {
    const costs = idsWithCost(DE_PERSONAL_CV, "en");
    expect(costs.get("contact.market-personal-data")).toBe(2);
    expect(costs.has("contact.market-military-service")).toBe(false);
  });

  it("defaults the market to the document language", () => {
    const costs = idsWithCost(TR_PERSONAL_CV);
    expect(costs.has("contact.market-personal-data")).toBe(false);
  });

  it("advises about a missing date of birth at zero cost", () => {
    const costs = idsWithCost(TR_CV, "tr");
    expect(costs.get("contact.market-expectations")).toBe(0);
    const de = idsWithCost(DE_CV, "de");
    expect(de.get("contact.market-expectations")).toBe(0);
  });

  it("leaves the score untouched by zero-cost advice", () => {
    const advised = analyzeCv({ cvText: TR_CV, jobDescription: TR_JOB_AD, market: "tr" });
    const plain = analyzeCv({ cvText: TR_CV, jobDescription: TR_JOB_AD, market: "en" });
    expect(advised.total).toBe(plain.total);

    const contact = advised.dimensions.find((dimension) => dimension.id === "contact");
    const cost = advised.findings
      .filter((finding) => finding.dimension === "contact")
      .reduce((sum, finding) => sum + finding.cost, 0);
    expect(contact?.score).toBe((contact?.max ?? 0) - cost);
  });

  it("stays quiet for an English CV without personal data", () => {
    const result = analyzeCv({ cvText: STRONG_CV, jobDescription: JOB_AD });
    const ids = result.findings.map((finding) => finding.id);
    expect(ids).not.toContain("contact.market-personal-data");
    expect(ids).not.toContain("contact.market-expectations");
    expect(ids).not.toContain("contact.market-military-service");
  });
});
