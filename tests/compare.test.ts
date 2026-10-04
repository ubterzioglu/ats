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
    const perfectAd = "We are seeking a highly motivated Backend engineer in New York to join our fast-paced startup environment and build scalable microservices. You must have a strong work ethic.\n\nRequirements:\n- Node.js\n- TypeScript\n- 3 years experience";
    const partialAd = "We are seeking a Backend dev for our enterprise infrastructure team. You will be responsible for maintaining our core systems and ensuring high availability across our cloud environments.\n\nRequirements:\n- Node.js\n- TypeScript\n- Kubernetes\n- 2 years experience";
    const poorAd = "We are looking for a Senior Python engineer to lead our data engineering efforts. You will architect robust data pipelines and mentor junior developers in best practices.\n\nRequirements:\n- Django\n- PostgreSQL\n- Python\n- 8 years experience";

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
