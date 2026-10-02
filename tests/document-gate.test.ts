import { describe, expect, it } from "vitest";

import { assessDocumentKind } from "@/lib/scoring/gate";

import { STRONG_CV } from "./fixtures";

/**
 * The gate warns; it never blocks. Its job is to be right about "this is not
 * a CV" without ever crying wolf on a real one.
 */

const COVER_LETTER = `Dear Hiring Manager,

I am writing to express my interest in the open position at your company.
Over the past years I have grown as a professional and I believe my profile
fits your team well. I would welcome the opportunity to discuss how I can
contribute.

Sincerely,
Jane Doe
`;

const INVOICE = `Invoice #2024-117

Bill to: Example GmbH
Subtotal: 1,200.00 EUR
Total due: 1,428.00 EUR
Payment due within 14 days of the billing date.
`;

const RECIPE = `Grandma's soup recipe

Ingredients: two tablespoons of butter, three onions, one liter of stock.
Preheat the pot, add the butter, and simmer for forty minutes.
`;

describe("assessDocumentKind", () => {
  it("is confident about a real CV", () => {
    expect(assessDocumentKind(STRONG_CV).confident).toBe(true);
  });

  it("rejects a cover letter", () => {
    const assessment = assessDocumentKind(COVER_LETTER);
    expect(assessment.confident).toBe(false);
    expect(assessment.negativeSignals).toBeGreaterThanOrEqual(2);
  });

  it("rejects an invoice", () => {
    expect(assessDocumentKind(INVOICE).confident).toBe(false);
  });

  it("rejects a recipe", () => {
    expect(assessDocumentKind(RECIPE).confident).toBe(false);
  });

  it("tolerates one academic word inside a real CV", () => {
    const withThesis = `${STRONG_CV}\nMaster thesis on distributed test orchestration.\n`;
    expect(assessDocumentKind(withThesis).confident).toBe(true);
  });

  it("gives the UI a sentence whenever it is not confident", () => {
    for (const text of [COVER_LETTER, INVOICE, RECIPE, "just some random words here"]) {
      const assessment = assessDocumentKind(text);
      expect(assessment.confident).toBe(false);
      expect(assessment.reason.length).toBeGreaterThan(10);
    }
  });
});
