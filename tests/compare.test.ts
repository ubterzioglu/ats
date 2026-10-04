import { describe, expect, it } from "vitest";

import { buildContext } from "../apps/web/lib/scoring/context";
import { compareAds } from "../apps/web/lib/scoring/compare";

describe("F.4 Multi-ad comparison", () => {
  const cvText = `
    Alex Developer
    New York, USA
    
    Experience
    Backend Engineer
    2020 - 2024
    
    Skills
    Node.js, TypeScript, PostgreSQL
  `;
  const context = buildContext(cvText);

  it("ranks the best fitting ad first", () => {
    const perfectAd = "Backend engineer in New York. Needs Node.js and TypeScript. 3 years experience required.";
    const partialAd = "Backend dev. Needs Node.js, TypeScript, and Kubernetes. 2 years experience.";
    const poorAd = "Senior Python engineer. 8 years experience required. Django, PostgreSQL.";

    const ads: string[] = [poorAd, perfectAd, partialAd];
    
    const results = compareAds(context, ads);
    
    expect(results).toHaveLength(3);
    
    // perfectAd should be ranked first
    expect(results[0]?.ad.experience?.years).toBe(3);
    // poorAd should be ranked last
    expect(results[2]?.ad.experience?.years).toBe(8);
    
    // Match score should decay accordingly
    expect(results[0]!.matchScore).toBeGreaterThan(results[1]!.matchScore);
    expect(results[1]!.matchScore).toBeGreaterThan(results[2]!.matchScore);
  });
});
