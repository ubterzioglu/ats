import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildStoryBank } from "@/lib/interview/stories";
import type { StarCard } from "@/types/interview";

import { DE_CV, STRONG_CV, TR_CV, WEAK_CV } from "./fixtures";

/**
 * H.1: the STAR story bank, rules only. The acceptance is that it works with
 * every AI layer off - there is no AI layer in it - and the invariant behind
 * it is traceability: every field of every card is a verbatim slice of the
 * CV, and a slot the document does not fill is marked missing, never written.
 */

function presentFields(card: StarCard): [string, string][] {
  return [
    ["situation", card.situation.text],
    ["task", card.task.text],
    ["action", card.action.text],
    ["result", card.result.text]
  ].filter((entry): entry is [string, string] => entry[1].length > 0);
}

describe("buildStoryBank on the English fixture", () => {
  const bank = buildStoryBank(STRONG_CV);

  it("cards every achievement bullet", () => {
    expect(bank.cards.length).toBe(7);
  });

  it("splits the outcome clause out of the bullet", () => {
    const card = bank.cards[0];
    expect(card?.action.text).toBe(
      "Built a Playwright and TypeScript regression suite covering 420 cases"
    );
    expect(card?.result.text).toBe("cutting a 6 hour manual cycle to 35 minutes.");
    expect(card?.result.present).toBe(true);
  });

  it("reads the role line above the bullet as the situation", () => {
    expect(bank.cards[0]?.situation.text).toBe("Senior QA Automation Engineer, Adesso SE");
    expect(bank.cards[4]?.situation.text).toBe("QA Engineer, Beispiel GmbH");
  });

  it("quotes a bullet that is itself the result in both slots", () => {
    const card = bank.cards[6];
    expect(card?.sourceText).toContain("Reduced regression escape rate");
    expect(card?.result.present).toBe(true);
    expect(card?.result.text).toBe(card?.action.text);
  });

  it("leaves slots the document does not fill empty", () => {
    const mentored = bank.cards.find((card) => card.sourceText.startsWith("Mentored"));
    expect(mentored?.task.present).toBe(false);
    expect(mentored?.task.text).toBe("");
    expect(mentored?.result.present).toBe(false);

    const xray = bank.cards.find((card) => card.sourceText.includes("Xray"));
    expect(xray?.result.present).toBe(false);
  });

  it("tags topics for the question mapping", () => {
    const first = bank.cards[0];
    expect(first?.topics).toContain("automation");
    expect(first?.topics).toContain("testing");
    expect(first?.topics).toContain("speed");
    const mentored = bank.cards.find((card) => card.sourceText.startsWith("Mentored"));
    expect(mentored?.topics).toContain("mentoring");
  });

  it("is deterministic", () => {
    expect(buildStoryBank(STRONG_CV)).toEqual(bank);
  });
});

describe("buildStoryBank across languages", () => {
  it("reads Turkish achievement bullets", () => {
    const bank = buildStoryBank(TR_CV);
    expect(bank.cards.length).toBeGreaterThanOrEqual(6);

    const pipeline = bank.cards.find((card) => card.sourceText.includes("GitLab CI"));
    expect(pipeline?.action.text).toBe(
      "GitLab CI üzerinde sürüm doğrulamalarını otomatikleştirdim"
    );
    expect(pipeline?.result.text).toBe("hatalı sürümleri %40 azalttım.");
    expect(pipeline?.situation.text).toBe("Kıdemli Test Otomasyon Mühendisi, Adesso");
  });

  it("reads German achievement bullets", () => {
    const bank = buildStoryBank(DE_CV);
    expect(bank.cards.length).toBeGreaterThanOrEqual(6);

    const suite = bank.cards.find((card) => card.sourceText.includes("Regressionssuite"));
    expect(suite?.result.text).toContain("reduzierte");
    expect(suite?.result.text).toContain("35 Minuten");
    expect(suite?.action.text).not.toContain("und reduzierte");
  });
});

describe("the no-invention invariant", () => {
  it.each([
    ["english", STRONG_CV],
    ["turkish", TR_CV],
    ["german", DE_CV]
  ])("every %s card field is a verbatim slice of the CV", (_name, cv) => {
    for (const card of buildStoryBank(cv).cards) {
      for (const [name, text] of presentFields(card)) {
        expect(cv, `${card.id}.${name}: "${text}"`).toContain(text);
      }
      expect(cv).toContain(card.sourceText);
    }
  });
});

describe("degradation", () => {
  it("returns an empty bank for a CV without achievement bullets", () => {
    const bank = buildStoryBank(WEAK_CV);
    expect(bank.cards).toEqual([]);
  });

  it("skips duty bullets and names the reason", () => {
    const bank = buildStoryBank(`Jane Doe

Experience

QA Engineer, Example Ltd
01/2020 - present
- Responsible for testing of software before each release.
- Involved in many tasks around the platform.
- Automated the deployment checks and reduced the failure rate by 25%.
- ok
`);
    expect(bank.cards).toHaveLength(1);
    const reasons = bank.skipped.map((entry) => entry.reason);
    expect(reasons.filter((reason) => reason === "no-achievement-signal")).toHaveLength(2);
    expect(reasons).toContain("too-short");
  });

  it("handles an empty document", () => {
    expect(buildStoryBank("")).toEqual({ cards: [], skipped: [] });
  });

  it("never reaches for the AI or scoring layers", () => {
    const dir = join(process.cwd(), "lib", "interview");
    const files = (readdirSync(dir, { recursive: true }) as string[]).filter((name) =>
      name.endsWith(".ts")
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(join(dir, file), "utf8");
      expect(text, `${file} imports lib/ai`).not.toMatch(/lib\/ai\//);
      expect(text, `${file} imports lib/scoring`).not.toMatch(/lib\/scoring\//);
    }
  });
});
