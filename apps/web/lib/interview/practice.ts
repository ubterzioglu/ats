import type { StarCard, StoryBank } from "@/types/interview";
import { tokenize } from "../scoring/text";

/**
 * Recommends the best story card for a typed practice answer.
 * Deterministic: relies on shared tokens rather than magic semantic search,
 * making the recommendation 100% traceable to words the candidate actually typed.
 */
export function recommendStory(
  answer: string,
  bank: StoryBank
): { card: StarCard; overlap: number } | null {
  if (!answer.trim() || bank.cards.length === 0) return null;

  const answerTokens = new Set(tokenize(answer));
  if (answerTokens.size === 0) return null;

  const scored = bank.cards.map((card) => {
    // Combine all text fields from the card
    const cardText = [
      card.situation.text,
      card.task.text,
      card.action.text,
      card.result.text
    ].join(" ");

    const cardTokens = new Set(tokenize(cardText));
    
    let overlap = 0;
    for (const token of answerTokens) {
      if (cardTokens.has(token) && token.length > 3) {
        // Only count meaningful words (simple length heuristic to skip "the", "and")
        // We could use the real stopword list, but a length check keeps this module standalone
        // while effectively filtering out noise for this specific scoring purpose.
        overlap++;
      }
    }

    return { card, overlap };
  });

  scored.sort((a, b) => b.overlap - a.overlap || a.card.sourceLine - b.card.sourceLine);

  const best = scored[0]!;
  if (best.overlap === 0) return null;
  
  return best;
}
