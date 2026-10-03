import type { SkippedBullet, StarCard, StarField, StoryBank } from "@/types/interview";

import {
  ACHIEVEMENT_VERB_RX,
  DATE_LINE_RX,
  METRIC_RX,
  PURPOSE_RX,
  RESULT_CLAUSE_RX,
  isHeadingLine,
  topicsOf
} from "./lexicon";

/**
 * The STAR story bank, built by rules only (decision 6). Every card quotes
 * the CV verbatim: the action is the bullet, the result is the outcome
 * clause inside it, the situation is the role line the bullet stands under,
 * the task is an explicit purpose phrase when one exists. A slot with no
 * source text is marked missing instead of filled in - the interview module
 * invents as little as the builder does.
 */

const BULLET_RX = /^\s*(?:[-*•▪●■▶‣⁃∙·]|\d+[.)])\s+/;
const CONTACT_LINE_RX = /[@]|\bhttps?:\/\/|^\+?\d[\d\s()./-]{6,}$/u;
const CONTEXT_WINDOW = 8;

/** Past-tense outcome verbs that can open a bullet which IS the result. */
const RESULT_LEAD_RX =
  /\b(?:reduced|increased|cut|saved|improved|shortened|lowered|raised|halved|doubled|azaltt[ıi]m|azaltt[ıi]k|düşürdüm|düşürdük|indirdim|h[ıi]zland[ıi]rd[ıi]m|k[ıi]saltt[ıi]m|art[ıi]rd[ıi]m|reduzierte|senkte|verbesserte|verkürzte|steigerte|beschleunigte|halbierte)\b/iu;

const TRAILING_CONJUNCTION_RX = /\s+(?:and|und|ve|sowie)\s*$/iu;

function field(text: string): StarField {
  const trimmed = text.trim();
  return trimmed.length > 0 ? { text: trimmed, present: true } : { text: "", present: false };
}

function hasAchievementSignal(content: string): boolean {
  return ACHIEVEMENT_VERB_RX.test(content) || METRIC_RX.test(content);
}

interface ResultSplit {
  readonly action: string;
  readonly result: string;
}

/**
 * Separates the outcome clause from the activity. Both halves are slices of
 * the original bullet, never recomposed text, so every card stays quotable
 * against the document.
 */
function splitResult(content: string): ResultSplit {
  const whole = content.trim();

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char !== "," && char !== ";") continue;
    const candidate = content.slice(index + 1).trim();
    if (candidate.length === 0 || candidate === whole) continue;
    if (METRIC_RX.test(candidate) || RESULT_LEAD_RX.test(candidate) || RESULT_CLAUSE_RX.test(candidate)) {
      return { action: content.slice(0, index).trim(), result: candidate };
    }
  }

  const inline = content.match(RESULT_CLAUSE_RX);
  if (inline !== null && inline.index !== undefined && inline.index > 0) {
    const action = content
      .slice(0, inline.index)
      .replace(/[\s,;]+$/, "")
      .replace(TRAILING_CONJUNCTION_RX, "")
      .trimEnd();
    const result = content.slice(inline.index).replace(/^[\s,;]+/, "").trim();
    if (action.length > 0 && result.length > 0 && result !== whole) {
      return { action, result };
    }
  }

  // A bullet that opens with an outcome verb and carries a metric IS the
  // result; quoting it in both slots keeps the card honest about there being
  // no separate activity sentence, and the UI can collapse the duplicate.
  if (RESULT_LEAD_RX.test(whole) && METRIC_RX.test(whole)) {
    return { action: whole, result: whole };
  }

  return { action: whole, result: "" };
}

function findTask(content: string): string {
  const match = content.match(PURPOSE_RX);
  return match?.[0] ?? "";
}

function findSituation(lines: readonly string[], bulletIndex: number): string {
  for (let offset = 1; offset <= CONTEXT_WINDOW; offset += 1) {
    const index = bulletIndex - offset;
    if (index < 0) return "";
    const line = (lines[index] ?? "").trim();
    if (line.length === 0) continue;
    if (BULLET_RX.test(line)) continue;
    if (DATE_LINE_RX.test(line)) continue;
    if (CONTACT_LINE_RX.test(line)) continue;
    if (isHeadingLine(line)) return "";
    return line;
  }
  return "";
}

function buildCard(lines: readonly string[], lineIndex: number, content: string): StarCard {
  const split = splitResult(content);
  const situation = field(findSituation(lines, lineIndex));
  // The role line tags the story too: a Playwright bullet under "QA
  // Automation Engineer" is an automation story even though the bullet
  // itself never says the word.
  const topics = topicsOf(situation.present ? `${content} ${situation.text}` : content);
  return {
    id: `story-l${lineIndex}`,
    sourceLine: lineIndex,
    sourceText: content,
    situation,
    task: field(findTask(content)),
    action: field(split.action),
    result: field(split.result),
    topics
  };
}

export function buildStoryBank(cvText: string): StoryBank {
  const lines = cvText.split("\n");
  const cards: StarCard[] = [];
  const skipped: SkippedBullet[] = [];

  lines.forEach((line, lineIndex) => {
    const match = line.match(BULLET_RX);
    if (match === null) return;
    const content = line.slice(match[0].length).trim();
    if (content.split(/\s+/).filter(Boolean).length < 4) {
      skipped.push({ lineIndex, text: content, reason: "too-short" });
      return;
    }
    if (!hasAchievementSignal(content)) {
      skipped.push({ lineIndex, text: content, reason: "no-achievement-signal" });
      return;
    }
    cards.push(buildCard(lines, lineIndex, content));
  });

  return { cards, skipped };
}
