import { describe, expect, it } from "vitest";

import {
  draftCoverLetter,
  validateCoverLetterPayload,
  type CoverLetterInput
} from "@/lib/ai/tasks/cover-letter";

import { fakeProvider, rawTextProvider } from "./helpers/fake-provider";

/**
 * D.7 inherits D.4's gate, and the letter is where it earns its keep: prose
 * is where a model reaches for the flattering sentence nobody can back up.
 * Each test pairs a draft that must survive with one that must not.
 */

const CV = `Jane Doe

Experience

QA Engineer, Beispiel GmbH
- Automated the regression suite with Playwright across three products.
- Tracked defects in Jira through four release cycles.
`;

const AD = `Senior QA Engineer at Nordwind Logistics

We need someone who knows Playwright and Jira. Kubernetes is a plus.
`;

const INPUT: CoverLetterInput = {
  cvText: CV,
  jobAd: AD,
  matchedTerms: ["playwright", "jira"],
  missingTerms: ["kubernetes"]
};

describe("validateCoverLetterPayload", () => {
  it("accepts the schema shape and drops empty paragraphs", () => {
    expect(validateCoverLetterPayload({ paragraphs: ["One.", "  ", "Two."] })).toEqual([
      "One.",
      "Two."
    ]);
  });

  it("rejects anything else", () => {
    expect(validateCoverLetterPayload(null)).toBeNull();
    expect(validateCoverLetterPayload({ paragraphs: "no" })).toBeNull();
    expect(validateCoverLetterPayload({ paragraphs: [1] })).toBeNull();
  });
});

describe("draftCoverLetter", () => {
  it("keeps a paragraph built from the CV", async () => {
    const stub = fakeProvider([
      {
        paragraphs: [
          "I automated the regression suite with Playwright across three products.",
          "I tracked defects in Jira through four release cycles."
        ]
      }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toHaveLength(2);
    expect(draft.dropped).toBe(0);
  });

  it("names the employer from the vacancy, which the CV never mentions", async () => {
    const stub = fakeProvider([
      { paragraphs: ["I am applying to Nordwind Logistics as a QA engineer."] }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toHaveLength(1);
    expect(draft.dropped).toBe(0);
  });

  it("drops a paragraph inventing an employer neither document names", async () => {
    const stub = fakeProvider([
      { paragraphs: ["Before that I spent two years at Siemens leading the suite."] }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toEqual([]);
    expect(draft.dropped).toBe(1);
  });

  it("drops a paragraph claiming a skill only the vacancy asks for", async () => {
    const stub = fakeProvider([
      { paragraphs: ["I have run Kubernetes clusters for the test environments."] }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toEqual([]);
    expect(draft.dropped).toBe(1);
  });

  it("drops a paragraph inventing a number, even one the vacancy carries", async () => {
    const withYears = { ...INPUT, jobAd: `${AD}\nWe ask for 8 years of experience.` };
    const stub = fakeProvider([{ paragraphs: ["I bring 8 years of testing experience."] }]);
    const draft = await draftCoverLetter(stub.provider, withYears);
    expect(draft.paragraphs).toEqual([]);
    expect(draft.dropped).toBe(1);
  });

  it("keeps a placeholder where the CV gives no result", async () => {
    const stub = fakeProvider([
      {
        paragraphs: [
          "I automated the regression suite with Playwright, cutting the cycle by [quantify: how much]."
        ]
      }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toHaveLength(1);
  });

  it("reports what it refused rather than hiding the gap", async () => {
    const stub = fakeProvider([
      {
        paragraphs: [
          "I tracked defects in Jira through four release cycles.",
          "I also led the Kubernetes migration."
        ]
      }
    ]);
    const draft = await draftCoverLetter(stub.provider, INPUT);
    expect(draft.paragraphs).toHaveLength(1);
    expect(draft.dropped).toBe(1);
  });

  it("retries once on a malformed answer, then gives up loudly", async () => {
    const recovering = fakeProvider([
      { nonsense: true },
      { paragraphs: ["I tracked defects in Jira through four release cycles."] }
    ]);
    const draft = await draftCoverLetter(recovering.provider, INPUT);
    expect(draft.paragraphs).toHaveLength(1);
    expect(recovering.calls()).toBe(2);

    const hopeless = rawTextProvider(["completely broken output"]);
    await expect(draftCoverLetter(hopeless.provider, INPUT)).rejects.toThrow();
    expect(hopeless.calls()).toBe(2);
  });

  it("asks nothing of the model when either document is empty", async () => {
    const stub = fakeProvider([{ paragraphs: ["Never reached."] }]);
    expect(await draftCoverLetter(stub.provider, { ...INPUT, jobAd: "   " })).toEqual({
      paragraphs: [],
      dropped: 0
    });
    expect(stub.calls()).toBe(0);
  });
});
