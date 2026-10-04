import type { KeywordTerm } from "@/types/analysis";
import type { MissingTermCard, SuggestedSection } from "@/types/tailor";

function getSuggestedSection(term: KeywordTerm): SuggestedSection {
  const lower = term.term.toLowerCase();
  
  // Terms containing multiple words like "project management"
  if (lower.includes(" ") && lower.length > 12) {
    return "experience";
  }
  
  // Leadership / soft skills often go to summary or experience
  const isSoftSkill = ["leadership", "communication", "management", "agile", "scrum"].some(s => lower.includes(s));
  if (isSoftSkill) {
    return "summary";
  }

  // Technical terms default to skills
  return "skills";
}

export function buildMissingTermCards(
  jobDescription: string,
  missingTerms: readonly KeywordTerm[]
): MissingTermCard[] {
  const cards: MissingTermCard[] = [];
  
  const lines = jobDescription
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const [index, missing] of missingTerms.entries()) {
    const escapedTerm = missing.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`\\b${escapedTerm}\\b`, "i");
    
    let evidence = "";
    for (const line of lines) {
      if (rx.test(line)) {
        evidence = line;
        break;
      }
    }

    if (!evidence) {
      const fallbackRx = new RegExp(escapedTerm, "i");
      for (const line of lines) {
        if (fallbackRx.test(line)) {
          evidence = line;
          break;
        }
      }
    }

    if (evidence) {
      // Truncate evidence if it's too long (e.g. paragraph without line breaks)
      let snippet = evidence;
      if (snippet.length > 150) {
        const matchIdx = snippet.toLowerCase().indexOf(missing.term.toLowerCase());
        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 60);
          const end = Math.min(snippet.length, matchIdx + missing.term.length + 60);
          snippet = (start > 0 ? "..." : "") + snippet.slice(start, end).trim() + (end < snippet.length ? "..." : "");
        }
      }

      cards.push({
        id: `missing-${index}-${Date.now()}`,
        term: missing,
        evidence: snippet,
        suggestedSection: getSuggestedSection(missing)
      });
    }
  }

  // Sort by tier first (required > preferred > undefined), then by weight
  cards.sort((a, b) => {
    const tierScoreA = a.term.tier === "required" ? 2 : a.term.tier === "preferred" ? 1 : 0;
    const tierScoreB = b.term.tier === "required" ? 2 : b.term.tier === "preferred" ? 1 : 0;
    if (tierScoreA !== tierScoreB) {
      return tierScoreB - tierScoreA;
    }
    return b.term.weight - a.term.weight;
  });

  return cards;
}
