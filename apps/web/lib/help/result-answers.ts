import type { AnalysisResult, Finding } from "@/types/analysis";

export interface ResultAnswer {
  readonly question: string;
  readonly answer: string;
}

/**
 * Answers questions about the user's own analysis result. Pure function,
 * no side effects, no storage access.
 */
export function answerFromResult(
  question: string,
  result: AnalysisResult,
  locale: "en" | "tr" | "de"
): ResultAnswer | null {
  const lower = question.toLowerCase();

  if (asksWhyScoreLow(lower, locale)) {
    return {
      question,
      answer: explainLowScore(result, locale)
    };
  }

  if (asksWhatToFixFirst(lower, locale)) {
    return {
      question,
      answer: explainFirstFix(result, locale)
    };
  }

  if (asksWhatIsGood(lower, locale)) {
    return {
      question,
      answer: explainWhatIsGood(result, locale)
    };
  }

  return null;
}

function asksWhyScoreLow(question: string, locale: "en" | "tr" | "de"): boolean {
  if (locale === "en") {
    return /why.*(score|low|lost|point)|score.*(low|bad|poor)/i.test(question);
  }
  if (locale === "tr") {
    return /neden.*(puan|düşük|kayıp)|puan.*(neden|düşük)/i.test(question);
  }
  return /warum.*(punktzahl|niedrig|verloren)|punktzahl.*(niedrig|schlecht)/i.test(question);
}

function asksWhatToFixFirst(question: string, locale: "en" | "tr" | "de"): boolean {
  if (locale === "en") {
    return /what.*(fix|improve|first)|first.*(fix|improve)|priority/i.test(question);
  }
  if (locale === "tr") {
    return /ne.*(düzel|iyileştir|önce)|önce.*(ne|düzel)/i.test(question);
  }
  return /was.*(beheben|verbessern|zuerst)|zuerst.*(beheben|verbessern)/i.test(question);
}

function asksWhatIsGood(question: string, locale: "en" | "tr" | "de"): boolean {
  if (locale === "en") {
    return /what.*(good|strong|well)|good.*(point|aspect)/i.test(question);
  }
  if (locale === "tr") {
    return /ne.*(iyi|güçlü|başarılı)|iyi.*(ne|yan)/i.test(question);
  }
  return /was.*(gut|stark)|gut.*(gemacht|aspekt)/i.test(question);
}

function explainLowScore(result: AnalysisResult, locale: "en" | "tr" | "de"): string {
  const topFindings = result.findings.slice(0, 3);
  
  if (topFindings.length === 0) {
    return locale === "en"
      ? "Your score is actually quite good. No major issues were found."
      : locale === "tr"
        ? "Puanınız aslında oldukça iyi. Büyük bir sorun bulunamadı."
        : "Ihre Punktzahl ist eigentlich recht gut. Keine größeren Probleme gefunden.";
  }

  const totalLost = topFindings.reduce((sum, f) => sum + f.cost, 0);
  const findingDescriptions = topFindings
    .map((f) => `- ${f.title} (-${f.cost})`)
    .join("\n");

  if (locale === "en") {
    return `Your score lost ${totalLost} points from the top issues:\n${findingDescriptions}\n\nFix these in order for the biggest improvement.`;
  }
  if (locale === "tr") {
    return `Puanınız en büyük sorunlardan ${totalLost} puan kaybetti:\n${findingDescriptions}\n\nEn büyük iyileşme için bunları sırayla düzeltin.`;
  }
  return `Ihre Punktzahl verlor ${totalLost} Punkte durch die größten Probleme:\n${findingDescriptions}\n\nBeheben Sie diese nacheinander für die größte Verbesserung.`;
}

function explainFirstFix(result: AnalysisResult, locale: "en" | "tr" | "de"): string {
  const topFinding = result.findings[0];
  
  if (!topFinding) {
    return locale === "en"
      ? "No critical issues to fix. Your CV is in good shape."
      : locale === "tr"
        ? "Düzeltilecek kritik bir sorun yok. CV'niz iyi durumda."
        : "Keine kritischen Probleme zu beheben. Ihr CV ist in guter Form.";
  }

  if (locale === "en") {
    return `Fix this first: "${topFinding.title}" (-${topFinding.cost} points)\n\n${topFinding.fix}`;
  }
  if (locale === "tr") {
    return `Önce bunu düzeltin: "${topFinding.title}" (-${topFinding.cost} puan)\n\n${topFinding.fix}`;
  }
  return `Beheben Sie dies zuerst: "${topFinding.title}" (-${topFinding.cost} Punkte)\n\n${topFinding.fix}`;
}

function explainWhatIsGood(result: AnalysisResult, locale: "en" | "tr" | "de"): string {
  const dimensions = result.dimensions.filter((d) => d.score >= d.max * 0.8);
  
  if (dimensions.length === 0) {
    return locale === "en"
      ? "No dimension scored above 80%. There is room for improvement across the board."
      : locale === "tr"
        ? "Hiçbir boyut %80'in üzerinde puan almadı. Her alanda iyileştirme alanı var."
        : "Keine Dimension erreichte über 80%. Es gibt überall Raum für Verbesserungen.";
  }

  const goodDimensions = dimensions
    .map((d) => `- ${d.label}: ${d.score}/${d.max}`)
    .join("\n");

  if (locale === "en") {
    return `These dimensions scored well:\n${goodDimensions}`;
  }
  if (locale === "tr") {
    return `Bu boyutlar iyi puan aldı:\n${goodDimensions}`;
  }
  return `Diese Dimensionen haben gut abgeschnitten:\n${goodDimensions}`;
}
