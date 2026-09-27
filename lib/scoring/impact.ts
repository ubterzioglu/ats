import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { countWords, ratio } from "./text";

export const IMPACT_MAX = 20;

const ACTION_VERBS = [
  // English
  "led", "owned", "built", "designed", "implemented", "delivered", "launched",
  "migrated", "automated", "reduced", "increased", "improved", "optimized",
  "optimised", "scaled", "refactored", "introduced", "established", "drove",
  "coordinated", "mentored", "negotiated", "rolled", "cut", "saved", "shipped",
  "developed", "created", "maintained", "tested", "analysed", "analyzed",
  // German
  "entwickelt", "umgesetzt", "eingefuhrt", "eingeführt", "aufgebaut", "verbessert",
  "optimiert", "automatisiert", "reduziert", "gesteigert", "geleitet", "betreut",
  "verantwortet", "konzipiert", "migriert", "erstellt", "eingespart",
  // Turkish
  "gelistirdim", "geliştirdim", "kurdum", "tasarladim", "tasarladım", "uyguladim",
  "uyguladım", "otomatiklestirdim", "otomatikleştirdim", "azalttim", "azalttım",
  "artirdim", "artırdım", "iyilestirdim", "iyileştirdim", "yonettim", "yönettim",
  "olusturdum", "oluşturdum", "kurguladim", "kurguladım"
];

const ACTION_VERB_RX = new RegExp(`^(${ACTION_VERBS.join("|")})\\b`, "i");

const GENERIC_RX =
  /(responsible for|worked on|involved in|assisted with|helped with|duties included|tasks included|verantwortlich fur|verantwortlich für|zustandig fur|zuständig für|mitgewirkt|beteiligt an|unterstutzung bei|unterstützung bei|sorumluydum|sorumlu oldum|gorev aldim|görev aldım|destek verdim|yer aldim|yer aldım)/gi;

const BUZZWORD_RX =
  /(team player|hard.?working|detail.?oriented|results.?driven|self.?starter|go.?getter|think outside the box|dynamic personality|motivated individual|teamfahig|teamfähig|belastbar|engagiert|zuverlassig|zuverlässig|dinamik|ozverili|özverili|takim oyuncusu|takım oyuncusu|calis?kan|çalışkan)/gi;

const FIRST_PERSON_RX = /\b(i|my|me|ich|mein|meine|meinen|ben|benim)\b/gi;

const QUANTIFIED_RX =
  /(\d+\s*%|%\s*\d+|[€$£]\s?\d|\d+\s*(k|mio|mn|m\b|million|milyon|tausend|bin)|\b\d{2,}\b|\d+\s*(users?|kunden|müşteri|musteri|tests?|releases?|teams?|projects?|projekte|proje|sprints?|hours?|stunden|saat|days?|tage|gun|gün))/i;

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Keyword matching gets a CV past the filter; this is what decides whether the
 * human on the other side keeps reading.
 */
export function scoreImpact(context: ScoreContext): DimensionOutcome {
  const { bullets, raw, stats } = context;
  const drafts: FindingDraft[] = [];

  const quantified = bullets.filter((bullet) => QUANTIFIED_RX.test(bullet));
  const quantifiedRatio = ratio(quantified.length, bullets.length);

  if (bullets.length >= 4) {
    if (quantifiedRatio < 0.15) {
      drafts.push({
        id: "impact.no-numbers",
        severity: "high",
        title: "Almost no measurable results",
        detail: `${quantified.length} of ${bullets.length} bullets contain a number. Claims without a figure read as job descriptions rather than achievements.`,
        fix: "Add scale or outcome to at least a third of the bullets: runtime cut from 40 to 12 minutes, 15 testers onboarded, coverage raised to 80%.",
        cost: 6
      });
    } else if (quantifiedRatio < 0.35) {
      drafts.push({
        id: "impact.few-numbers",
        severity: "medium",
        title: "Thin on measurable results",
        detail: `Only ${Math.round(quantifiedRatio * 100)}% of bullets carry a figure.`,
        fix: "Quantify the outcomes you remember best; an estimate with a unit beats no number at all.",
        cost: 3
      });
    }

    const withVerb = bullets.filter((bullet) => ACTION_VERB_RX.test(bullet));
    const verbRatio = ratio(withVerb.length, bullets.length);
    if (verbRatio < 0.35) {
      drafts.push({
        id: "impact.weak-verbs",
        severity: "medium",
        title: "Bullets do not open with an action",
        detail: `${Math.round(verbRatio * 100)}% of bullets start with an ownership verb. The rest open with nouns or filler.`,
        fix: "Start each bullet with what you did: built, migrated, automated, reduced.",
        cost: 4
      });
    }

    const longBullets = bullets.filter((bullet) => countWords(bullet) > 38);
    if (longBullets.length > Math.max(2, bullets.length * 0.25)) {
      drafts.push({
        id: "impact.long-bullets",
        severity: "low",
        title: "Bullets run into paragraphs",
        detail: `${longBullets.length} bullets are longer than 38 words, which buries the result at the end.`,
        fix: "Keep a bullet to one action and one outcome, under two lines.",
        cost: 2,
        evidence: longBullets.slice(0, 2).map((bullet) => `${bullet.slice(0, 120)}...`)
      });
    }
  } else if (!/\d/.test(raw)) {
    drafts.push({
      id: "impact.no-numbers-at-all",
      severity: "high",
      title: "No figures anywhere in the document",
      detail: "Nothing in the text quantifies scope, scale or outcome.",
      fix: "Add team sizes, volumes, durations and before/after numbers to the recent roles.",
      cost: 6
    });
  }

  const generic = countMatches(raw, GENERIC_RX);
  if (generic >= 3) {
    drafts.push({
      id: "impact.generic-phrasing",
      severity: "medium",
      title: "Responsibility phrasing instead of results",
      detail: `"Responsible for" and its variants appear ${generic} times. They describe a job title, not your contribution.`,
      fix: "Rewrite each one as an action plus an outcome.",
      cost: 3
    });
  } else if (generic > 0) {
    drafts.push({
      id: "impact.some-generic-phrasing",
      severity: "low",
      title: "Some responsibility phrasing left",
      detail: `${generic} bullet(s) still open with a responsibility phrase.`,
      fix: "Swap them for an action verb.",
      cost: 1
    });
  }

  const buzzwords = countMatches(raw, BUZZWORD_RX);
  if (buzzwords >= 3) {
    drafts.push({
      id: "impact.buzzwords",
      severity: "low",
      title: "Unsupported character claims",
      detail: `${buzzwords} generic self-descriptions such as "team player" appear. They carry no keyword value and no evidence.`,
      fix: "Replace them with a situation that demonstrates the trait.",
      cost: 2
    });
  }

  const pronouns = countMatches(raw, FIRST_PERSON_RX);
  if (stats.words > 200 && ratio(pronouns, stats.words) > 0.035) {
    drafts.push({
      id: "impact.first-person",
      severity: "low",
      title: "Heavy first-person narration",
      detail: "CV bullets conventionally drop the pronoun; it costs space and reads as a cover letter.",
      fix: 'Cut "I" and start from the verb.',
      cost: 2
    });
  }

  return buildOutcome("impact", "Impact", IMPACT_MAX, drafts, (score) =>
    score >= 17
      ? "Concrete, quantified, written as achievements."
      : score >= 11
        ? "Readable, but the results behind the work stay implicit."
        : "Reads as a task list rather than a record of results."
  );
}
