import type { AnalysisResult, Finding, KeywordReport, Strength } from "@/types/analysis";

export type ResultIntent =
  | "why-score-low"
  | "fix-first"
  | "missing-keywords"
  | "what-is-good";

export interface ResultAnswer {
  readonly intent: ResultIntent;
  readonly text: string;
  readonly params: Record<string, string | number | readonly string[]>;
}

/**
 * Detects the user's intent from their question about their own result.
 */
export function detectIntent(question: string): ResultIntent | null {
  const q = question.toLowerCase();

  // Why is my score low / why did it drop
  if (
    q.includes("why") &&
    (q.includes("low") || q.includes("drop") || q.includes("decrease") || q.includes("went down") || q.includes("score") || q.includes("down"))
  ) {
    return "why-score-low";
  }

  // What should I fix first
  if (
    q.includes("fix") ||
    q.includes("improve") ||
    q.includes("start") ||
    q.includes("first") ||
    q.includes("priority")
  ) {
    return "fix-first";
  }

  // Missing keywords
  if (
    q.includes("keyword") ||
    q.includes("missing") ||
    q.includes("match") ||
    q.includes("job description")
  ) {
    return "missing-keywords";
  }

  // What is good / strengths
  if (
    q.includes("good") ||
    q.includes("strength") ||
    q.includes("works") ||
    q.includes("right") ||
    q.includes("well")
  ) {
    return "what-is-good";
  }

  return null;
}

/**
 * Generates a personalized answer from the user's own analysis result.
 * Never includes evidence or CV text.
 */
export function answerFromResult(
  result: AnalysisResult,
  intent: ResultIntent
): ResultAnswer | null {
  switch (intent) {
    case "why-score-low":
      return answerWhyScoreLow(result);
    case "fix-first":
      return answerFixFirst(result);
    case "missing-keywords":
      return answerMissingKeywords(result);
    case "what-is-good":
      return answerWhatIsGood(result);
    default:
      return null;
  }
}

function answerWhyScoreLow(result: AnalysisResult): ResultAnswer {
  const topFindings = [...result.findings]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3);

  const totalMax = result.dimensions.reduce((sum, d) => sum + d.max, 0);
  const totalScore = result.dimensions.reduce((sum, d) => sum + d.score, 0);
  const totalLost = totalMax - totalScore;

  const findingTitles = topFindings.map((f) => f.title);
  const findingCosts = topFindings.map((f) => String(f.cost));

  return {
    intent: "why-score-low",
    text: "help.result.whyScoreLow",
    params: {
      score: totalScore,
      totalMax,
      totalLost,
      topFindings: findingTitles,
      costs: findingCosts
    }
  };
}

function answerFixFirst(result: AnalysisResult): ResultAnswer {
  const sortedFindings = [...result.findings].sort((a, b) => b.cost - a.cost);
  const first = sortedFindings[0];
  const second = sortedFindings[1];
  const third = sortedFindings[2];

  const items: string[] = [];
  const costs: string[] = [];

  if (first) {
    items.push(first.title);
    costs.push(String(first.cost));
  }
  if (second) {
    items.push(second.title);
    costs.push(String(second.cost));
  }
  if (third) {
    items.push(third.title);
    costs.push(String(third.cost));
  }

  return {
    intent: "fix-first",
    text: "help.result.fixFirst",
    params: {
      items,
      costs,
      count: items.length
    }
  };
}

function answerMissingKeywords(result: AnalysisResult): ResultAnswer {
  const keywords = result.keywords;
  if (!keywords || keywords.source !== "job-description") {
    return {
      intent: "missing-keywords",
      text: "help.result.noJobAd",
      params: {}
    };
  }

  const missing = keywords.missing.slice(0, 5).map((term) => term.term);
  const matched = keywords.matched.length;
  const total = keywords.matched.length + keywords.missing.length;
  const coverage = total > 0 ? Math.round((matched / total) * 100) : 0;

  return {
    intent: "missing-keywords",
    text: "help.result.missingKeywords",
    params: {
      missing,
      matched,
      total,
      coverage
    }
  };
}

function answerWhatIsGood(result: AnalysisResult): ResultAnswer {
  if (!result.strengths || result.strengths.length === 0) {
    return {
      intent: "what-is-good",
      text: "help.result.noStrengths",
      params: {}
    };
  }

  const strengths = result.strengths.slice(0, 3).map((s) => s.id);

  return {
    intent: "what-is-good",
    text: "help.result.whatIsGood",
    params: {
      strengths,
      count: result.strengths.length
    }
  };
}
