import { describe, expect, it } from "vitest";

import { extractJobKeywords } from "@/lib/scoring/keywords";

import { GOLDEN_JOB_ADS } from "./fixtures/job-ads";

/**
 * A term the ad lists under "Nice to have" is not a term the ATS filters on.
 * The tier drives the weight and the panel order, so it has to come from the
 * heading a term was listed under, in the ad's own language.
 */

const ad = (id: string) => GOLDEN_JOB_ADS.find((entry) => entry.id === id)!.text;

function tierByTerm(text: string): Map<string, "required" | "preferred" | undefined> {
  return new Map(extractJobKeywords(text).map((term) => [term.term, term.tier]));
}

describe("required/preferred tier detection", () => {
  it("tiers English Requirements as required and Nice to have as preferred", () => {
    const tiers = tierByTerm(ad("backend-en"));
    expect(tiers.get("docker")).toBe("required");
    expect(tiers.get("kubernetes")).toBe("required");
    expect(tiers.get("terraform")).toBe("preferred");
    expect(tiers.get("prometheus")).toBe("preferred");
  });

  it("leaves responsibility-section terms untiered", () => {
    const tiers = tierByTerm(ad("backend-en"));
    expect(tiers.get("microservices")).toBeUndefined();
  });

  it("gives a term seen in both sections the stronger tier", () => {
    const tiers = tierByTerm(ad("backend-en"));
    // java appears under "What you'll do" and under "Requirements"
    expect(tiers.get("java")).toBe("required");
  });

  it("reads Must have / Preferred", () => {
    const tiers = tierByTerm(ad("data-en"));
    expect(tiers.get("python")).toBe("required");
    expect(tiers.get("kafka")).toBe("preferred");
  });

  it("reads the German Dein Profil / Wünschenswert", () => {
    const tiers = tierByTerm(ad("qa-de"));
    expect(tiers.get("testng")).toBe("required");
    expect(tiers.get("playwright")).toBe("preferred");
  });

  it("reads the Turkish Aranan nitelikler / Tercihen", () => {
    const tiers = tierByTerm(ad("frontend-tr"));
    expect(tiers.get("redux")).toBe("required");
    expect(tiers.get("graphql")).toBe("preferred");
  });

  it("checks preferred headings first because 'Preferred qualifications' contains 'qualifications'", () => {
    const tiers = tierByTerm(`Backend Engineer

Preferred qualifications
- Experience with RabbitMQ
- Exposure to Elixir

Qualifications
- Solid Java background
`);
    expect(tiers.get("rabbitmq")).toBe("preferred");
    expect(tiers.get("java")).toBe("required");
  });

  it("does not mistake a bullet that ends in 'a plus' for a heading", () => {
    const tiers = tierByTerm(`Engineer

Your profile
- Strong Python skills
- Kubernetes experience is a plus
`);
    expect(tiers.get("python")).toBe("required");
    expect(tiers.get("kubernetes")).toBe("required");
  });
});

describe("tier weighting and order", () => {
  const weighted = extractJobKeywords(`Data Engineer

Must have
- Airflow orchestration

Bonus
- Kafka streams
`);

  it("weighs a required term above an equally frequent preferred term", () => {
    const airflow = weighted.find((term) => term.term === "airflow");
    const kafka = weighted.find((term) => term.term === "kafka");
    expect(airflow?.weight ?? 0).toBeGreaterThan(kafka?.weight ?? 0);
  });

  it("lists required terms before preferred terms", () => {
    const ranks = weighted.map((term) =>
      term.tier === "required" ? 0 : term.tier === "preferred" ? 2 : 1
    );
    expect([...ranks].sort()).toEqual(ranks);
  });
});
