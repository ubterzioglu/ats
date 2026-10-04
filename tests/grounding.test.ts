import { describe, expect, it } from "vitest";

import { isGrounded } from "@/lib/ai/grounding";

/**
 * A generated sentence may restate the source and nothing else. These tests
 * are the contract every AI task leans on: invented numbers and invented
 * technologies fail, placeholders pass, aliases of source facts pass.
 */

const SOURCE =
  "Built a Playwright regression suite covering 120 cases and cut the manual cycle from 6 hours to 35 minutes. Ran Docker images in GitLab CI.";

const SKILLS = ["playwright", "docker", "kubernetes", "gitlab ci", "golang", "selenium"];

describe("isGrounded", () => {
  it("accepts a faithful restatement", () => {
    const result = isGrounded(SOURCE, "Built a Playwright suite of 120 cases, cutting 6 hours to 35 minutes.", SKILLS);
    expect(result.grounded).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects an invented number", () => {
    const result = isGrounded(SOURCE, "Cut the cycle by 45% with Playwright across 120 cases.", SKILLS);
    expect(result.grounded).toBe(false);
    expect(result.issues).toContainEqual({ kind: "number", value: "45" });
  });

  it("rejects an invented technology", () => {
    const result = isGrounded(SOURCE, "Built a Selenium suite covering 120 cases in 35 minutes.", SKILLS);
    expect(result.grounded).toBe(false);
    expect(result.issues).toContainEqual({ kind: "technology", value: "selenium" });
  });

  it("accepts placeholders instead of claims", () => {
    const result = isGrounded(
      SOURCE,
      "Cut the cycle by [quantify: percentage] with Playwright, covering [quantify: N] cases.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("accepts an alias of a fact the source states", () => {
    const result = isGrounded(
      "Deployed services with Kubernetes on the production cluster for 3 years.",
      "Ran workloads on k8s for 3 years.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("does not read ordinary English as technology claims", () => {
    const result = isGrounded(
      "Wrote the release checklist and trained the rest of the team, 4 people, in 2021.",
      "Owned the release checklist and mentored the rest of the team, 4 people, in 2021.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("does not treat the verb go as a Go claim", () => {
    const result = isGrounded(
      "Ran the migration in 2022 and managed the rollout.",
      "Led the migration in 2022, then let the team go live with it.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("checks against the whole taxonomy by default", () => {
    const result = isGrounded("Wrote unit tests in 2023.", "Wrote unit tests with PyTorch in 2023.");
    expect(result.grounded).toBe(false);
    expect(result.issues).toContainEqual({ kind: "technology", value: "pytorch" });
  });

  it("rejects an employer the source never named", () => {
    const result = isGrounded(
      "Managed deployment pipelines and test suites.",
      "Managed deployment pipelines at Google.",
      SKILLS
    );
    expect(result.grounded).toBe(false);
    expect(result.issues).toContainEqual({ kind: "institution", value: "Google" });
  });

  it("rejects an invented company carrying a legal suffix", () => {
    const result = isGrounded(
      "Tested releases for two years.",
      "Tested releases for two years, shipping Beispiel GmbH its first suite.",
      SKILLS
    );
    expect(result.grounded).toBe(false);
    expect(result.issues).toContainEqual({ kind: "institution", value: "Beispiel GmbH" });
  });

  it("keeps an organisation the source already names", () => {
    const result = isGrounded(
      "Worked at Acme Corp managing the database.",
      "Managed the database at Acme Corp.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("does not read ordinary capitalised prose as an employer", () => {
    const result = isGrounded(
      "Responsible for testing of software before each release.",
      "Led software testing before each release, catching [quantify: N] defects.",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("does not read a capitalised German noun as an employer", () => {
    const result = isGrounded(
      "Verantwortlich für die Qualitätssicherung im Team.",
      "Leitete die Qualitätssicherung im Team mit [quantify: Umfang].",
      SKILLS
    );
    expect(result.grounded).toBe(true);
  });

  it("leaves a known technology to the technology check", () => {
    const result = isGrounded(
      "Built the regression suite.",
      "Built the regression suite with Playwright.",
      SKILLS
    );
    expect(result.issues).toContainEqual({ kind: "technology", value: "playwright" });
    expect(result.issues.some((issue) => issue.kind === "institution")).toBe(false);
  });
});
