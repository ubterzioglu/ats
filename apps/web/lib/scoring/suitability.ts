import type { JobAdRequirements, KeywordReport, SuitabilityCheck, SuitabilityStatus } from "@/types/analysis";
import type { ScoreContext } from "./context";
import { caseFold } from "./text";

export function evaluateSuitability(
  context: ScoreContext,
  jobAd: JobAdRequirements,
  keywords: KeywordReport
): SuitabilityCheck[] {
  const checks: SuitabilityCheck[] = [];

  // Experience
  if (jobAd.experience) {
    const requiredMonths = jobAd.experience.years * 12;
    const cvMonths = context.stats.experienceMonths;
    const hasDates = context.stats.years.length > 0;
    
    let status: SuitabilityStatus;
    let detail: string;
    
    if (!hasDates && cvMonths === 0) {
      status = "unknown";
      detail = `Requires ${jobAd.experience.years} years but no dates were parsed.`;
    } else {
      const isPassing = cvMonths >= requiredMonths;
      status = isPassing ? "passed" : "failed";
      detail = isPassing
        ? `Meets the ${jobAd.experience.years} year requirement.`
        : `Requires ${jobAd.experience.years} years but parsed ${Math.floor(cvMonths / 12)} years.`;
    }
    
    checks.push({
      id: "experience",
      status,
      title: "Experience",
      detail
    });
  }

  // Language
  if (jobAd.languages.length > 0) {
    let status: SuitabilityStatus = "unknown";
    let passedLangs = 0;
    
    for (const req of jobAd.languages) {
      const lower = caseFold(req.language);
      const isDocLang = 
        (lower.includes("english") && context.language === "en") ||
        (lower.includes("german") && context.language === "de") ||
        (lower.includes("turkish") && context.language === "tr");
      
      const mentionsLang = context.lower.includes(lower);

      if (isDocLang || mentionsLang) {
        passedLangs++;
      }
    }

    if (passedLangs === jobAd.languages.length) {
      status = "passed";
    }

    checks.push({
      id: "language",
      status,
      title: "Languages",
      detail: status === "passed" ? "Language requirements found." : "Language fluency not explicitly verified."
    });
  }

  // Location
  if (jobAd.location) {
    let status: SuitabilityStatus = "unknown";
    if (jobAd.location.city && context.lower.includes(caseFold(jobAd.location.city))) {
      status = "passed";
    }
    
    checks.push({
      id: "location",
      status,
      title: "Location & Right to Work",
      detail: status === "passed" ? `Mentions ${jobAd.location.city}.` : "Location or visa status not explicit."
    });
  }

  // Skills
  if (jobAd.terms.required.length > 0) {
    const requiredCount = jobAd.terms.required.length;
    const matchedSet = new Set(keywords.matched.map(t => t.term));
    const matchedCount = jobAd.terms.required.filter(t => matchedSet.has(t.term)).length;
    
    const status: SuitabilityStatus = matchedCount === requiredCount ? "passed" : "failed";

    checks.push({
      id: "skills",
      status,
      title: "Required Skills",
      detail: matchedCount === requiredCount 
        ? "All mandatory skills matched." 
        : `Missing ${requiredCount - matchedCount} mandatory skill(s).`
    });
  }

  return checks;
}
