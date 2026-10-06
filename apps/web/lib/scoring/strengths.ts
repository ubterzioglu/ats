import type { DimensionScore, Finding, KeywordReport, Strength } from "@/types/analysis";
import type { ScoreContext } from "./context";

/**
 * Derives strengths from the analysis result. Pure function, no side effects.
 * A strength exists only when the related finding did not fire and there is
 * positive evidence. An empty document yields no strengths.
 */
export function deriveStrengths(
  context: ScoreContext,
  dimensions: readonly DimensionScore[],
  findings: readonly Finding[],
  keywords: KeywordReport
): readonly Strength[] {
  const strengths: Strength[] = [];
  const findingIds = new Set(findings.map((f) => f.id));

  // Contact strengths
  const contactDimension = dimensions.find((d) => d.id === "contact");
  if (contactDimension && contactDimension.score >= 8) {
    strengths.push({
      id: "contact.complete",
      dimension: "contact",
      params: { score: contactDimension.score, max: contactDimension.max }
    });
  }

  // Parseability strengths
  const parseDimension = dimensions.find((d) => d.id === "parseability");
  if (parseDimension && parseDimension.score >= 20 && !findingIds.has("parse.columns") && !findingIds.has("parse.mojibake")) {
    strengths.push({
      id: "parse.clean",
      dimension: "parseability",
      params: { score: parseDimension.score, max: parseDimension.max }
    });
  }

  // Structure strengths
  const structureDimension = dimensions.find((d) => d.id === "structure");
  if (structureDimension && structureDimension.score >= 16) {
    const coreSections = context.sections.filter((s) => ["experience", "education", "skills"].includes(s.id));
    if (coreSections.length >= 2) {
      strengths.push({
        id: "structure.core-sections",
        dimension: "structure",
        params: {
          score: structureDimension.score,
          max: structureDimension.max,
          sections: coreSections.map((s) => s.id)
        }
      });
    }
  }

  // Impact strengths
  const impactDimension = dimensions.find((d) => d.id === "impact");
  if (impactDimension && impactDimension.score >= 15 && context.bullets.length >= 4) {
    const quantified = context.bullets.filter((b) => /\d/.test(b)).length;
    if (quantified >= context.bullets.length * 0.3) {
      strengths.push({
        id: "impact.quantified",
        dimension: "impact",
        params: {
          score: impactDimension.score,
          max: impactDimension.max,
          quantified,
          total: context.bullets.length
        }
      });
    }
  }

  // Keyword strengths
  if (keywords.matched.length >= 5 && keywords.coverage >= 0.5) {
    strengths.push({
      id: "keywords.matched",
      dimension: "keywords",
      params: {
        matched: keywords.matched.length,
        coverage: Math.round(keywords.coverage * 100)
      }
    });
  }

  // Experience strength
  if (context.stats.experienceMonths >= 24) {
    strengths.push({
      id: "experience.solid",
      dimension: "structure",
      params: { months: context.stats.experienceMonths }
    });
  }

  return strengths;
}
